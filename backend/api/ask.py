"""Ask the Stars — astrological Q&A endpoint.

Uses Anthropic Claude API when available, falls back to pre-written responses.
"""

import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class AskRequest(BaseModel):
    question: str
    sun_sign: Optional[str] = None
    moon_sign: Optional[str] = None
    rising_sign: Optional[str] = None


class AskResponse(BaseModel):
    answer: str
    source: str  # "claude" or "static"


# Pre-written responses for when Claude API is not configured
STATIC_RESPONSES = {
    "love": "The stars reveal a period of deep emotional transformation in your love life. Venus is moving through your intimacy sector, inviting you to release old patterns and open to a more authentic connection.",
    "career": "Saturn's influence on your professional sector demands patience and strategic thinking. The foundation you're building now may feel invisible, but the cosmos rewards those who build with integrity.",
    "health": "Your cosmic energy flow is asking for recalibration. The Moon's current transit suggests your body is holding emotional tension that needs release. Prioritize rest as sacred practice.",
    "default": "The celestial currents point toward a period of awakening and clarity. Jupiter's expansive energy is amplifying your intuition. What you plant now will bear fruit for years to come.",
}


def get_static_response(question: str) -> str:
    q = question.lower()
    if any(w in q for w in ["love", "relationship", "partner", "dating"]):
        return STATIC_RESPONSES["love"]
    if any(w in q for w in ["career", "job", "work", "money"]):
        return STATIC_RESPONSES["career"]
    if any(w in q for w in ["health", "energy", "wellness"]):
        return STATIC_RESPONSES["health"]
    return STATIC_RESPONSES["default"]


async def ask_claude(question: str, chart_context: str = "") -> Optional[str]:
    """Try to use Anthropic Claude API for the response."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        system = (
            "You are Olivia, a warm, insightful astrologer. You speak with poetic precision, "
            "weaving real astrological knowledge with intuitive wisdom. Your tone is mystical "
            "but grounded — never vague platitudes. Keep responses 2-3 sentences. "
            "Reference specific planetary transits and aspects when relevant."
        )
        if chart_context:
            system += f"\n\nQuerent's natal chart:\n{chart_context}"

        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            system=system,
            messages=[{"role": "user", "content": question}],
        )
        return response.content[0].text
    except Exception:
        return None


@router.post("/ask", response_model=AskResponse)
async def ask_the_stars(req: AskRequest):
    chart_context = ""
    if req.sun_sign:
        chart_context += f"Sun in {req.sun_sign}"
    if req.moon_sign:
        chart_context += f", Moon in {req.moon_sign}"
    if req.rising_sign:
        chart_context += f", Rising in {req.rising_sign}"

    # Try Claude first
    claude_answer = await ask_claude(req.question, chart_context)
    if claude_answer:
        return AskResponse(answer=claude_answer, source="claude")

    # Fallback to static
    return AskResponse(answer=get_static_response(req.question), source="static")
