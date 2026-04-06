"""Daily reading endpoint — personalized reading based on transits + natal chart."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class DailyRequest(BaseModel):
    sun_sign: str
    moon_sign: Optional[str] = None
    rising_sign: Optional[str] = None


class DailyResponse(BaseModel):
    sign: str
    power: str
    pressure: str
    trouble: str
    overall_energy: int  # 0-100


# Pre-written readings per sign (Claude API integration when ready)
DAILY_POWER = {
    "Aries": "Your initiative is magnetic today. Lead with confidence — others will follow.",
    "Taurus": "Financial instincts are razor-sharp. Trust the slow strategy paying dividends.",
    "Gemini": "Words carry unusual weight today. A conversation could change everything.",
    "Cancer": "Your emotional radar is calibrated perfectly. Use it to nurture the right connections.",
    "Leo": "Creative fire burns bright. Express yourself boldly — the audience is ready.",
    "Virgo": "Your analytical gifts solve what others can't. The answer is in the details.",
    "Libra": "Harmony flows naturally today. Your presence balances every room you enter.",
    "Scorpio": "Intuitive power is at peak. You see what's hidden — use this wisely.",
    "Sagittarius": "Expansion calls. An opportunity arrives from an unexpected direction.",
    "Capricorn": "Discipline meets opportunity. Today's focused effort creates lasting impact.",
    "Aquarius": "Innovation strikes like lightning. The unconventional path is the right one.",
    "Pisces": "Creative and spiritual channels are wide open. Flow with what comes.",
}

DAILY_PRESSURE = {
    "Aries": "Impatience could sabotage what patience would win. Count to ten before acting.",
    "Taurus": "Stubbornness masks fear of change. Flex one degree and feel the relief.",
    "Gemini": "Mental overload threatens focus. Choose one lane and commit for 24 hours.",
    "Cancer": "Over-giving depletes your reserves. Today, fill your own cup first.",
    "Leo": "Ego sensitivity spikes under this transit. Not everything is about you — and that's freeing.",
    "Virgo": "Perfectionism becomes paralysis. Good enough today beats perfect never.",
    "Libra": "People-pleasing pulls you off center. Your needs are not negotiable.",
    "Scorpio": "Control instincts intensify. Release the grip — what's yours won't leave.",
    "Sagittarius": "Restlessness masks avoidance. What are you running from?",
    "Capricorn": "Work-life balance tips dangerously. Step away before the cost compounds.",
    "Aquarius": "Detachment feels safe but costs connection. Let someone in today.",
    "Pisces": "Boundaries blur under Neptune's influence. Define where you end and others begin.",
}

DAILY_TROUBLE = {
    "Aries": "A conflict invites you to prove yourself. The real victory is walking away.",
    "Taurus": "An unexpected expense or loss tests your security. You have more than enough.",
    "Gemini": "Miscommunication risk is high. Re-read before you send. Twice.",
    "Cancer": "Old emotional patterns resurface. You've healed more than you think.",
    "Leo": "Someone challenges your authority. Respond with grace, not fire.",
    "Virgo": "A system fails or a plan falls apart. Improvisation is also a skill.",
    "Libra": "A relationship reveals an imbalance. Address it with love, not avoidance.",
    "Scorpio": "A secret surfaces at an inconvenient time. Truth, though uncomfortable, liberates.",
    "Sagittarius": "Overcommitment catches up with you. Cancel something guilt-free.",
    "Capricorn": "Authority figures disappoint. Your own standards are the ones that matter.",
    "Aquarius": "A group dynamic turns toxic. Your independence is your greatest asset.",
    "Pisces": "Escapism tempts you away from reality. Face the discomfort — it passes faster.",
}


@router.post("/daily", response_model=DailyResponse)
async def get_daily_reading(req: DailyRequest):
    sign = req.sun_sign.capitalize()
    if sign not in DAILY_POWER:
        raise HTTPException(400, f"Unknown sign: {sign}")

    # Deterministic energy based on sign + day
    from datetime import date
    day = date.today().toordinal()
    energy = 60 + abs(hash(sign + str(day))) % 36

    return DailyResponse(
        sign=sign,
        power=DAILY_POWER[sign],
        pressure=DAILY_PRESSURE[sign],
        trouble=DAILY_TROUBLE[sign],
        overall_energy=energy,
    )
