"""Compatibility endpoint — synastry scores between two signs."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class CompatRequest(BaseModel):
    sign_a: str
    sign_b: str


class CompatResponse(BaseModel):
    sign_a: str
    sign_b: str
    love: int
    communication: int
    trust: int
    passion: int
    overall: int
    verdict: str


ELEMENTS = {
    "Aries": "Fire", "Leo": "Fire", "Sagittarius": "Fire",
    "Taurus": "Earth", "Virgo": "Earth", "Capricorn": "Earth",
    "Gemini": "Air", "Libra": "Air", "Aquarius": "Air",
    "Cancer": "Water", "Scorpio": "Water", "Pisces": "Water",
}

SIGN_INDEX = {
    "Aries": 0, "Taurus": 1, "Gemini": 2, "Cancer": 3,
    "Leo": 4, "Virgo": 5, "Libra": 6, "Scorpio": 7,
    "Sagittarius": 8, "Capricorn": 9, "Aquarius": 10, "Pisces": 11,
}


def compute_compat(sign_a: str, sign_b: str) -> dict:
    a = SIGN_INDEX.get(sign_a, 0)
    b = SIGN_INDEX.get(sign_b, 0)
    seed = (a + 1) * 13 + (b + 1) * 7

    def h(n: int) -> int:
        return abs(((seed * 2654435761 + n * 31)) % 100)

    same_element = ELEMENTS.get(sign_a) == ELEMENTS.get(sign_b)
    boost = 15 if same_element else 0

    love = min(55 + h(1) % 40 + boost, 99)
    comm = min(50 + h(2) % 42 + boost, 99)
    trust = min(52 + h(3) % 38 + boost, 99)
    passion = min(48 + h(4) % 44 + boost, 99)
    overall = round((love + comm + trust + passion) / 4)

    if overall >= 85:
        verdict = "A cosmic match written in the stars."
    elif overall >= 70:
        verdict = "Strong gravitational pull. Your energies complement each other."
    elif overall >= 55:
        verdict = "Intriguing tensions create growth. This pairing challenges you to evolve."
    else:
        verdict = "Different orbits, but opposites can spark transformation."

    return {
        "love": love, "communication": comm, "trust": trust,
        "passion": passion, "overall": overall, "verdict": verdict,
    }


@router.post("/compat", response_model=CompatResponse)
async def get_compatibility(req: CompatRequest):
    a = req.sign_a.capitalize()
    b = req.sign_b.capitalize()
    if a not in SIGN_INDEX or b not in SIGN_INDEX:
        raise HTTPException(400, "Invalid sign name")

    scores = compute_compat(a, b)
    return CompatResponse(sign_a=a, sign_b=b, **scores)
