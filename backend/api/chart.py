"""Chart endpoint — compute natal chart from birth data."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


class ChartRequest(BaseModel):
    date: str  # YYYY-MM-DD
    time: Optional[str] = "12:00"  # HH:MM, default noon
    city: Optional[str] = "New York"
    name: Optional[str] = "Querent"


class PlanetData(BaseModel):
    name: str
    sign: str
    degree: float
    house: Optional[int]
    retrograde: bool


class ChartResponse(BaseModel):
    name: str
    sun_sign: str
    moon_sign: Optional[str]
    rising_sign: Optional[str]
    planets: list[PlanetData]
    dominant_element: str
    aspects: list[dict]
    summary: str


@router.post("/chart", response_model=ChartResponse)
async def compute_chart(req: ChartRequest):
    try:
        from src.astrology.charts import compute_natal_chart
    except ImportError:
        raise HTTPException(500, "Astrology engine not available — install kerykeion")

    try:
        chart = compute_natal_chart(
            name=req.name or "Querent",
            birth_date=req.date,
            birth_time=req.time or "12:00",
            city=req.city or "New York",
        )
    except Exception as e:
        raise HTTPException(400, f"Chart computation failed: {e}")

    planets = []
    for attr in ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]:
        p = getattr(chart, attr, None)
        if p:
            planets.append(PlanetData(
                name=p.name, sign=p.sign, degree=p.degree,
                house=p.house, retrograde=p.retrograde,
            ))

    return ChartResponse(
        name=chart.name,
        sun_sign=chart.sun_sign,
        moon_sign=chart.moon_sign,
        rising_sign=chart.rising_sign,
        planets=planets,
        dominant_element=chart.dominant_element,
        aspects=chart.aspects[:10],
        summary=chart.to_summary(),
    )
