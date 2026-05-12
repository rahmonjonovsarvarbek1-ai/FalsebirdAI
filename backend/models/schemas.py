"""
models.py
---------
Pydantic data models for FalsebirdAI API.
Handles request validation, response serialization, and
type safety across the entire application layer.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime
import uuid


# ─────────────────────────────────────────────
#  Shared Types
# ─────────────────────────────────────────────

PersonaType = Literal["balu", "dora"]
RoleType = Literal["user", "assistant", "system"]


# ─────────────────────────────────────────────
#  Chat Models
# ─────────────────────────────────────────────

class ChatMessage(BaseModel):
    """A single message in a conversation."""
    role: RoleType
    content: str
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Message content cannot be empty.")
        return v.strip()


class ChatRequest(BaseModel):
    """Incoming chat request from the frontend."""
    persona: PersonaType = Field(
        ...,
        description="Which AI persona should respond: 'balu' or 'dora'",
        examples=["balu", "dora"],
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The user's current message",
    )
    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=40,  # cap context window; ~20 back-and-forth turns
        description="Prior conversation messages for context",
    )
    session_id: Optional[str] = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Client-generated session identifier",
    )

    @field_validator("message")
    @classmethod
    def sanitize_message(cls, v: str) -> str:
        return v.strip()


class SafetyInfo(BaseModel):
    """Safety evaluation result returned to frontend."""
    triggered: bool
    risk_level: str
    show_resources: bool
    resources: Optional[str] = None


class ChatResponse(BaseModel):
    """Response returned to the frontend."""
    persona: PersonaType
    persona_name: str
    reply: str
    safety: SafetyInfo
    session_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    tokens_used: Optional[int] = None


# ─────────────────────────────────────────────
#  Persona Info Model (for /personas endpoint)
# ─────────────────────────────────────────────

class PersonaInfo(BaseModel):
    """Public metadata about a persona."""
    id: str
    name: str
    gender: str
    tagline: str
    color_accent: str
    avatar_emoji: str


class PersonaListResponse(BaseModel):
    personas: list[PersonaInfo]


# ─────────────────────────────────────────────
#  Health Check
# ─────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    version: str
    personas_available: list[str]