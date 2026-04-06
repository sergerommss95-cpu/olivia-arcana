"""Transits endpoint — current planetary positions."""

from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class TransitPlanet(BaseModel):
    name: str
    sign: str
    degree: float
    retrograde: bool


class TransitsResponse(BaseModel):
    date: str
    planets: list[TransitPlanet]


# Approximate positions for demo (real positions require kerykeion computation)
def get_current_transits() -> list[TransitPlanet]:
    """Return approximate current planetary positions."""
    # These are approximate positions for April 2026
    return [
        TransitPlanet(name="Sun", sign="Aries", degree=17.3, retrograde=False),
        TransitPlanet(name="Moon", sign="Leo", degree=12.8, retrograde=False),
        TransitPlanet(name="Mercury", sign="Aries", degree=22.1, retrograde=False),
        TransitPlanet(name="Venus", sign="Pisces", degree=28.4, retrograde=False),
        TransitPlanet(name="Mars", sign="Cancer", degree=8.7, retrograde=False),
        TransitPlanet(name="Jupiter", sign="Cancer", degree=14.2, retrograde=False),
        TransitPlanet(name="Saturn", sign="Pisces", degree=24.6, retrograde=False),
        TransitPlanet(name="Uranus", sign="Taurus", degree=29.1, retrograde=False),
        TransitPlanet(name="Neptune", sign="Aries", degree=2.3, retrograde=False),
        TransitPlanet(name="Pluto", sign="Aquarius", degree=6.8, retrograde=False),
    ]


@router.get("/transits", response_model=TransitsResponse)
async def get_transits():
    return TransitsResponse(
        date=datetime.now().strftime("%Y-%m-%d"),
        planets=get_current_transits(),
    )
