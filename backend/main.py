"""
main.py
-------
FalsebirdAI — FastAPI Application Entry Point

This is the central backend orchestrator. It wires together:
  - The FastAPI app and CORS configuration
  - The /chat endpoint (core logic: safety → persona → LLM → response)
  - The /personas endpoint (frontend persona discovery)
  - Health check endpoint
  - Global error handling

Request lifecycle for /chat:
  1. Validate input (Pydantic)
  2. Run safety evaluation (safety.py)  ← ALWAYS FIRST
  3. If safety triggered: return crisis response, skip LLM
  4. Look up persona configuration (personas.py)
  5. Send to LLM with persona context (llm_service.py)
  6. Return structured response to frontend
"""

import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Internal modules
from models.schemas import (
    ChatRequest,
    ChatResponse,
    SafetyInfo,
    PersonaInfo,
    PersonaListResponse,
    HealthResponse,
)
from services.personas import get_persona, PERSONAS
from services.safety import evaluate_safety, get_crisis_resources, RiskLevel
from services.llm_service import get_chat_response

APP_VERSION = "1.0.0"
# ─────────────────────────────────────────────
#  Logging Setup
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("falsebirdai")

# ─────────────────────────────────────────────
#  Environment
# ─────────────────────────────────────────────
load_dotenv()

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:3001"
).split(",")

# ─────────────────────────────────────────────
#  App Lifecycle
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🐦 FalsebirdAI v{APP_VERSION} starting up...")
    logger.info(f"   Personas loaded: {[p.name for p in PERSONAS.values()]}")
    logger.info(f"   CORS origins: {ALLOWED_ORIGINS}")
    yield
    logger.info("FalsebirdAI shutting down.")


# ─────────────────────────────────────────────
#  FastAPI App
# ─────────────────────────────────────────────
app = FastAPI(
    title="FalsebirdAI API",
    description=(
        "Emotional support platform with dual AI personas: "
        "Balu (strategic) and Dora (empathetic). "
        "Includes safety layer for crisis detection."
    ),
    version=APP_VERSION,
    lifespan=lifespan,
)

# CORS — allow the React dev server and production frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
#  Global Error Handler
# ─────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again."},
    )


# ─────────────────────────────────────────────
#  Routes
# ─────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Quick liveness check — confirms the API is up and personas are loaded."""
    return HealthResponse(
        status="ok",
        version=APP_VERSION,
        personas_available=list(PERSONAS.keys()),
    )


@app.get("/personas", response_model=PersonaListResponse, tags=["Personas"])
async def list_personas():
    """
    Returns public metadata for all available personas.
    The frontend uses this to render the persona switcher UI.
    """
    persona_list = [
        PersonaInfo(
            id=p.id,
            name=p.name,
            gender=p.gender,
            tagline=p.tagline,
            color_accent=p.color_accent,
            avatar_emoji=p.avatar_emoji,
        )
        for p in PERSONAS.values()
    ]
    return PersonaListResponse(personas=persona_list)


@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest):
    """
    Core chat endpoint. Full request lifecycle:

    1. Safety evaluation (always runs first — no exceptions)
    2. Crisis bypass if HIGH/MEDIUM risk detected
    3. Persona resolution
    4. LLM call with persona-specific system prompt + history
    5. Structured response
    """

    # ── Step 1: Safety Check ──────────────────────────────────────────
    safety_result = evaluate_safety(request.message)

    if safety_result.triggered:
        logger.warning(
            f"[SAFETY OVERRIDE] session={request.session_id} "
            f"risk={safety_result.risk_level} "
            f"pattern='{(safety_result.matched_pattern or '')[:40]}'"
        )

        # For HIGH/MEDIUM risk: skip LLM entirely, return safety message
        resources = get_crisis_resources() if safety_result.show_resources else None

        # Resolve persona name for the response (safety msg uses no LLM)
        persona = get_persona(request.persona)
        persona_name = persona.name if persona else request.persona.capitalize()

        return ChatResponse(
            persona=request.persona,
            persona_name=persona_name,
            reply=safety_result.safety_message or "",
            safety=SafetyInfo(
                triggered=True,
                risk_level=safety_result.risk_level,
                show_resources=safety_result.show_resources,
                resources=resources,
            ),
            session_id=request.session_id or "unknown",
            tokens_used=0,
        )

    # ── Step 2: Resolve Persona ───────────────────────────────────────
    persona = get_persona(request.persona)
    if not persona:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown persona: '{request.persona}'. Valid options: balu, dora",
        )

    # ── Step 3: LLM Call ──────────────────────────────────────────────
    try:
        reply, tokens_used = await get_chat_response(
            persona=persona,
            history=request.history,
            user_message=request.message,
        )
    except RuntimeError as e:
        # LLM service raised a clean error — surface it to the user
        raise HTTPException(status_code=503, detail=str(e))

    # ── Step 4: Build Response ────────────────────────────────────────
    # Note: LOW risk messages still get an AI response, but we log them.
    # The frontend can optionally show a gentle "you're not alone" notice.
    return ChatResponse(
        persona=request.persona,
        persona_name=persona.name,
        reply=reply,
        safety=SafetyInfo(
            triggered=False,
            risk_level=safety_result.risk_level,
            show_resources=False,
            resources=None,
        ),
        session_id=request.session_id or "unknown",
        tokens_used=tokens_used,
    )