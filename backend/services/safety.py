"""
safety.py
---------
The Safety Layer for FalsebirdAI.

This module is the FIRST thing evaluated on every incoming message.
It scans for crisis-level language (self-harm, suicidal ideation, 
immediate danger) and, if detected, bypasses normal AI response logic
to return a structured safety intervention instead.

Architecture principle: Safety is a HARD override — no AI persona
response is generated or shown when this layer fires.
"""

import re
import logging
from dataclasses import dataclass
from enum import Enum
from typing import Optional

logger = logging.getLogger(__name__)


class RiskLevel(str, Enum):
    NONE = "none"
    LOW = "low"        # distress signals, monitor but respond normally
    MEDIUM = "medium"  # explicit self-harm ideation, safety message shown
    HIGH = "high"      # immediate danger language, full crisis override


@dataclass
class SafetyResult:
    triggered: bool
    risk_level: RiskLevel
    matched_pattern: Optional[str]
    safety_message: Optional[str]
    show_resources: bool


# ─────────────────────────────────────────────
#  Keyword / Pattern Banks
#  NOTE: These are starting points. In production,
#  augment with an ML classifier (e.g. fine-tuned
#  BERT on crisis-line transcripts).
# ─────────────────────────────────────────────

HIGH_RISK_PATTERNS = [
    # Direct suicidal intent
    r"\b(i want to|i'm going to|i will|i'm planning to)\s+(kill myself|end my life|take my life)\b",
    r"\b(suicide|suicidal)\b",
    r"\bgoodbye.{0,30}(forever|world|everyone)\b",
    r"\b(no reason|nothing left)\s+to live\b",
    r"\bdon'?t want to (be alive|exist|live anymore)\b",
    r"\bending (it|everything|my life)\b",
    # Self-harm explicit
    r"\b(cutting|burning|hurting) myself\b",
    r"\bself[- ]?harm\b",
    r"\bwant to (hurt|harm|cut|burn) myself\b",
    # Immediate danger
    r"\b(have a|with a|using a)\s+(gun|knife|rope|pills|weapon)\b",
    r"\boverdos(e|ing)\b",
]

MEDIUM_RISK_PATTERNS = [
    r"\b(can'?t|cannot) (go on|continue|take it anymore)\b",
    r"\b(wish i was|wish i were) dead\b",
    r"\bwhat'?s the point (of living|of life|anymore)\b",
    r"\b(nobody|no one) (would|will) (miss|care) (if i|about me)\b",
    r"\b(tired of|exhausted from) living\b",
    r"\bfeel like (disappearing|vanishing)\b",
    r"\b(life is|living is) (pointless|worthless|meaningless)\b",
]

LOW_RISK_PATTERNS = [
    r"\b(hopeless|helpless|worthless)\b",
    r"\b(depressed|depression)\b",
    r"\bi hate (my life|myself)\b",
    r"\bcan'?t (sleep|eat|function)\b",
    r"\bfall apart\b",
]

# ─────────────────────────────────────────────
#  Crisis Resources (localize per deployment)
# ─────────────────────────────────────────────
CRISIS_RESOURCES = """
🆘 **Immediate Help — Please reach out now:**

• **International Association for Suicide Prevention:** https://www.iasp.info/resources/Crisis_Centres/
• **Crisis Text Line (US):** Text HOME to 741741
• **Samaritans (UK/IE):** Call 116 123 (free, 24/7)
• **Lifeline (AU):** 13 11 14
• **iCall (India):** 9152987821

You are not alone. Real humans are standing by right now.
"""

SAFETY_MESSAGES = {
    RiskLevel.HIGH: (
        "I need to pause our conversation for a moment, because what you just shared matters deeply to me. "
        "It sounds like you might be in real danger right now, and I care too much about you to just keep chatting as if that's not true. "
        "Please — reach out to a crisis line immediately. These are real people who want to help, right now."
    ),
    RiskLevel.MEDIUM: (
        "I hear you, and I want you to know: what you're feeling is real, and you deserve real support. "
        "What you've shared tells me this pain is very serious. I'm here, but I also want to make sure you know "
        "there are people specifically trained to help in moments like this."
    ),
}


# ─────────────────────────────────────────────
#  Core Detection Function
# ─────────────────────────────────────────────

def _compile_patterns(patterns: list[str]) -> list[re.Pattern]:
    return [re.compile(p, re.IGNORECASE | re.DOTALL) for p in patterns]


_HIGH_COMPILED = _compile_patterns(HIGH_RISK_PATTERNS)
_MEDIUM_COMPILED = _compile_patterns(MEDIUM_RISK_PATTERNS)
_LOW_COMPILED = _compile_patterns(LOW_RISK_PATTERNS)


def evaluate_safety(text: str) -> SafetyResult:
    """
    Evaluate a user message for safety risk.
    
    Returns a SafetyResult indicating:
    - Whether to override normal AI response
    - Risk level for logging/analytics
    - Pre-written safety message if triggered
    - Whether to show crisis resources

    This function is intentionally conservative — false positives
    (showing resources unnecessarily) are far better than false negatives.
    """
    if not text or not text.strip():
        return SafetyResult(
            triggered=False,
            risk_level=RiskLevel.NONE,
            matched_pattern=None,
            safety_message=None,
            show_resources=False,
        )

    # Check HIGH first (most urgent)
    for pattern in _HIGH_COMPILED:
        match = pattern.search(text)
        if match:
            logger.warning(f"[SAFETY] HIGH risk pattern matched: '{match.group()[:50]}'")
            return SafetyResult(
                triggered=True,
                risk_level=RiskLevel.HIGH,
                matched_pattern=match.group(),
                safety_message=SAFETY_MESSAGES[RiskLevel.HIGH],
                show_resources=True,
            )

    # Check MEDIUM
    for pattern in _MEDIUM_COMPILED:
        match = pattern.search(text)
        if match:
            logger.warning(f"[SAFETY] MEDIUM risk pattern matched: '{match.group()[:50]}'")
            return SafetyResult(
                triggered=True,
                risk_level=RiskLevel.MEDIUM,
                matched_pattern=match.group(),
                safety_message=SAFETY_MESSAGES[RiskLevel.MEDIUM],
                show_resources=True,
            )

    # LOW — log but don't override AI response
    for pattern in _LOW_COMPILED:
        match = pattern.search(text)
        if match:
            logger.info(f"[SAFETY] LOW risk signal detected: '{match.group()[:50]}'")
            return SafetyResult(
                triggered=False,  # AI responds, but backend is alerted
                risk_level=RiskLevel.LOW,
                matched_pattern=match.group(),
                safety_message=None,
                show_resources=False,
            )

    return SafetyResult(
        triggered=False,
        risk_level=RiskLevel.NONE,
        matched_pattern=None,
        safety_message=None,
        show_resources=False,
    )


def get_crisis_resources() -> str:
    """Return formatted crisis resource block."""
    return CRISIS_RESOURCES