"""Current transit computation and transit-to-natal overlay."""

from datetime import datetime
from typing import Optional

from kerykeion import AstrologicalSubjectFactory

from src.astrology.charts import NatalChart, PlanetPosition, _extract_planet


def get_current_transits(dt: Optional[datetime] = None) -> dict[str, PlanetPosition]:
    """Get current planetary positions (transits)."""
    if dt is None:
        dt = datetime.utcnow()

    # Create a subject for "now" at Greenwich (transit positions are location-independent for outer planets)
    now_subject = AstrologicalSubjectFactory.from_birth_data(
        name="Current Transits",
        year=dt.year,
        month=dt.month,
        day=dt.day,
        hour=dt.hour,
        minute=dt.minute,
        lat=51.4772,  # Greenwich
        lng=0.0,
        tz_str="UTC",
        online=False,
    )

    planet_names = ["Sun", "Moon", "Mercury", "Venus", "Mars",
                    "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]

    transits = {}
    for pname in planet_names:
        transits[pname.lower()] = _extract_planet(now_subject, pname)

    return transits


def format_transits_summary(transits: dict[str, PlanetPosition]) -> str:
    """Format current transits as a readable summary for Claude."""
    lines = ["Current Planetary Positions:"]
    for name, pos in transits.items():
        retro = " (Retrograde)" if pos.retrograde else ""
        lines.append(f"  {name.title()}: {pos.sign} {pos.degree:.1f}°{retro}")
    return "\n".join(lines)


def find_active_transits_to_natal(
    natal: NatalChart,
    transits: Optional[dict[str, PlanetPosition]] = None,
    orb: float = 5.0,
) -> list[dict]:
    """Find transit planets making aspects to natal planets.

    Returns list of active transit aspects with details.
    """
    if transits is None:
        transits = get_current_transits()

    ASPECT_ANGLES = {
        "conjunction": 0,
        "opposition": 180,
        "trine": 120,
        "square": 90,
        "sextile": 60,
    }

    natal_planets = {
        "sun": natal.sun, "moon": natal.moon, "mercury": natal.mercury,
        "venus": natal.venus, "mars": natal.mars, "jupiter": natal.jupiter,
        "saturn": natal.saturn, "uranus": natal.uranus, "neptune": natal.neptune,
        "pluto": natal.pluto,
    }
    if natal.ascending:
        natal_planets["ascendant"] = natal.ascending

    active = []
    for t_name, t_pos in transits.items():
        for n_name, n_pos in natal_planets.items():
            if t_name == n_name:
                continue  # Skip same planet transiting itself (usually too common)

            angular_diff = abs(t_pos.degree - n_pos.degree) % 360
            if angular_diff > 180:
                angular_diff = 360 - angular_diff

            for aspect_name, aspect_angle in ASPECT_ANGLES.items():
                aspect_orb = abs(angular_diff - aspect_angle)
                if aspect_orb <= orb:
                    # Determine if applying or separating (simplified)
                    significance = _transit_significance(t_name, n_name, aspect_name)
                    active.append({
                        "transit_planet": t_name.title(),
                        "transit_sign": t_pos.sign,
                        "natal_planet": n_name.title(),
                        "natal_sign": n_pos.sign,
                        "aspect": aspect_name,
                        "orb": round(aspect_orb, 2),
                        "significance": significance,
                    })

    # Sort by significance (major transits first)
    active.sort(key=lambda x: x["significance"], reverse=True)
    return active


def _transit_significance(transit_planet: str, natal_planet: str, aspect: str) -> int:
    """Score transit significance (higher = more important)."""
    # Slow planets transiting personal planets are most significant
    slow_planets = {"saturn", "uranus", "neptune", "pluto", "jupiter"}
    personal_planets = {"sun", "moon", "mercury", "venus", "mars", "ascendant"}
    hard_aspects = {"conjunction", "opposition", "square"}

    score = 0
    if transit_planet in slow_planets:
        score += 3
    if natal_planet in personal_planets:
        score += 2
    if aspect in hard_aspects:
        score += 2
    if transit_planet in {"saturn", "pluto"} and aspect in hard_aspects:
        score += 2  # Extra weight for Saturn/Pluto hard aspects

    return score


def format_transit_overlay(
    natal: NatalChart,
    active_transits: list[dict],
    max_transits: int = 5,
) -> str:
    """Format active transits as a readable summary for Claude."""
    if not active_transits:
        return "No major transits currently active on your chart."

    lines = [f"Active transits affecting {natal.name}'s chart:"]
    for t in active_transits[:max_transits]:
        lines.append(
            f"  {t['transit_planet']} in {t['transit_sign']} "
            f"{t['aspect']} natal {t['natal_planet']} in {t['natal_sign']} "
            f"(orb: {t['orb']}°)"
        )
    return "\n".join(lines)


def get_cosmic_weather_score(active_transits: list[dict]) -> str:
    """Compute a simple cosmic weather score: green/yellow/red."""
    if not active_transits:
        return "green"

    total_significance = sum(t["significance"] for t in active_transits)
    hard_count = sum(1 for t in active_transits if t["aspect"] in {"square", "opposition"})

    if total_significance > 15 or hard_count >= 3:
        return "red"
    elif total_significance > 8 or hard_count >= 1:
        return "yellow"
    return "green"
