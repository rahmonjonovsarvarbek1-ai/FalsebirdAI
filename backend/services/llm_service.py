"""
llm_service.py
--------------
Handles all communication with the LLM provider (OpenAI).

Responsibilities:
- Build the message payload (system prompt + conversation history + new message)
- Inject persona-specific configurations (temperature, max_tokens)
- Handle streaming vs. non-streaming responses
- Normalize errors into clean application exceptions

This layer is intentionally abstracted so swapping OpenAI for
Anthropic, Gemini, or a local model (Ollama/LlamaCpp) only
requires changing this file.
"""

import logging
import os
from typing import AsyncGenerator
from openai import AsyncOpenAI, APIStatusError, APIConnectionError
from services.personas import PersonaConfig
from models.schemas import ChatMessage

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
#  Client Initialization
# ─────────────────────────────────────────────
_client: AsyncOpenAI | None = None

def get_client() -> AsyncOpenAI:
    """Lazy-initialize the OpenAI async client, configured for Groq."""
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise EnvironmentError(
                "GROQ_API_KEY environment variable is not set. "
                "Please add your Groq key (gsk_...) to the .env file."
            )
        # Groq-ga ulanish uchun base_url qo'shdik
        _client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1"
        )
    return _client

# ─────────────────────────────────────────────
#  Message Builder
# ─────────────────────────────────────────────

def _build_messages(
    persona: PersonaConfig,
    history: list[ChatMessage],
    new_message: str,
) -> list[dict]:
    """
    Construct the full messages array for the Chat Completions API.
    
    Structure:
      1. System prompt (persona definition)
      2. Conversation history (trimmed to last N messages)
      3. New user message
    """
    messages = [
        {"role": "system", "content": persona.system_prompt}
    ]

    # Include history (skip any system-role entries from history)
    for msg in history:
        if msg.role in ("user", "assistant"):
            messages.append({
                "role": msg.role,
                "content": msg.content,
            })

    # Current user turn
    messages.append({"role": "user", "content": new_message})
    return messages


# ─────────────────────────────────────────────
#  Core Chat Function
# ─────────────────────────────────────────────

async def get_chat_response(
    persona: PersonaConfig,
    history: list[ChatMessage],
    user_message: str,
    # MANA BU YERNI O'ZGARTIRDIK:
    model: str = "llama-3.3-70b-versatile",
) -> tuple[str, int]:
    """
    Send a message to the LLM and receive a complete response.
    """
    client = get_client()
    messages = _build_messages(persona, history, user_message)

    logger.info(
        f"[LLM] Calling {model} | persona={persona.name} | "
        f"history_len={len(history)} | temp={persona.temperature}"
    )

    try:
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=persona.temperature,
            max_tokens=persona.max_tokens,
            presence_penalty=0.1,
            frequency_penalty=0.1,
        )
        reply = response.choices[0].message.content or ""
        tokens = response.usage.total_tokens if response.usage else 0
        logger.info(f"[LLM] Response received | tokens={tokens}")
        return reply.strip(), tokens

    except APIConnectionError as e:
        logger.error(f"[LLM] Connection error: {e}")
        raise RuntimeError("Unable to reach the AI service. Please try again.")

    except APIStatusError as e:
        logger.error(f"[LLM] API status error {e.status_code}: {e.message}")
        if e.status_code == 429:
            raise RuntimeError("The AI service is busy right now. Please wait a moment.")
        # Agar 401 xato bo'lsa, bu kalit yoki model xatosi bo'ladi
        raise RuntimeError("The AI service returned an error. Please try again.")


# ─────────────────────────────────────────────
#  Streaming Chat (for future SSE support)
# ─────────────────────────────────────────────

async def stream_chat_response(
    persona: PersonaConfig,
    history: list[ChatMessage],
    user_message: str,
    model: str = "llama-3.3-70b-versatile",
) -> AsyncGenerator[str, None]:
    """
    Stream the LLM response token-by-token (for Server-Sent Events).
    Usage: async for chunk in stream_chat_response(...): yield chunk
    """
    client = get_client()
    messages = _build_messages(persona, history, user_message)

    try:
        stream = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=persona.temperature,
            max_tokens=persona.max_tokens,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    except (APIConnectionError, APIStatusError) as e:
        logger.error(f"[LLM Stream] Error: {e}")
        yield "\n\n[Connection interrupted. Please try again.]"