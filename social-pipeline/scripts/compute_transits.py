from __future__ import annotations
"""
Step 1: Compute today's planetary transits using kerykeion (NASA JPL ephemeris).
Produces structured transit data for all 12 zodiac signs.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

try:
    from kerykeion import AstrologicalSubject
    HAS_KERYKEION = True
except ImportError:
    HAS_KERYKEION = False

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config.settings import ZODIAC_SIGNS, OUTPUT_DIR


# Zodiac sign degree ranges (ecliptic longitude)
SIGN_RANGES = {
    "Aries": (0, 30), "Taurus": (30, 60), "Gemini": (60, 90),
    "Cancer": (90, 120), "Leo": (120, 150), "Virgo": (150, 180),
    "Libra": (180, 210), "Scorpio": (210, 240), "Sagittarius": (240, 270),
    "Capricorn": (270, 300), "Aquarius": (300, 330), "Pisces": (330, 360),
}

PLANETS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]

ASPECT_NAMES = {
    0: "conjunction", 60: "sextile", 90: "square",
    120: "trine", 150: "quincunx", 180: "opposition",
}
ASPECT_ORBS = {0: 8, 60: 6, 90: 7, 120: 8, 150: 3, 180: 8}


def get_daily_transits() -> dict:
    """Compute current planetary positions and their impact on each sign."""
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")

    if HAS_KERYKEION:
        sky = AstrologicalSubject(
            "Transit", now.year, now.month, now.day,
            now.hour, now.minute, "Greenwich", "GB"
        )
        planets = {}
        for planet_name in PLANETS:
            planet_obj = getattr(sky, planet_name, None)
            if planet_obj:
                planets[planet_name] = {
                    "sign": planet_obj.sign,
                    "degree": round(planet_obj.position, 2),
                    "abs_degree": round(planet_obj.abs_pos, 2),
                    "retrograde": getattr(planet_obj, "retrograde", False),
                }
    else:
        # Fallback: approximate positions for development/testing
        planets = _approximate_positions(now)

    # Compute which transits affect each sign
    sign_impacts = {}
    for sign_info in ZODIAC_SIGNS:
        sign_name = sign_info["name"]
        impacts = _compute_sign_impacts(sign_name, planets)
        sign_impacts[sign_name] = impacts

    return {
        "date": today,
        "timestamp": now.isoformat(),
        "planets": planets,
        "sign_impacts": sign_impacts,
        "moon_phase": _get_moon_phase(now),
    }


def _compute_sign_impacts(sign_name: str, planets: dict) -> list:
    """Find which transiting planets are forming aspects to a sign's range."""
    sign_start, sign_end = SIGN_RANGES[sign_name]
    impacts = []

    for planet_name, planet_data in planets.items():
        abs_deg = planet_data.get("abs_degree", 0)

        # Check each major aspect
        for aspect_angle, aspect_name in ASPECT_NAMES.items():
            orb = ASPECT_ORBS[aspect_angle]

            # Check if the planet aspects the sign's midpoint (15 degrees in)
            sign_midpoint = sign_start + 15
            angle_diff = abs((abs_deg - sign_midpoint + 180) % 360 - 180)
            aspect_diff = abs(angle_diff - aspect_angle)

            if aspect_diff <= orb:
                # Determine which house the planet is transiting
                house_num = _get_house_from_sign(sign_name, planet_data["sign"])
                impacts.append({
                    "planet": planet_name.capitalize(),
                    "aspect": aspect_name,
                    "transit_sign": planet_data["sign"],
                    "house": house_num,
                    "exact_degree": planet_data["degree"],
                    "orb": round(aspect_diff, 1),
                    "retrograde": planet_data.get("retrograde", False),
                    "strength": _aspect_strength(aspect_name, planet_name, aspect_diff, orb),
                })

    # Sort by strength (most impactful first)
    impacts.sort(key=lambda x: x["strength"], reverse=True)
    return impacts


def _get_house_from_sign(natal_sign: str, transit_sign: str) -> int:
    """Approximate which house a transit falls in (whole sign houses from natal sign)."""
    signs_order = [s["name"] for s in ZODIAC_SIGNS]
    natal_idx = signs_order.index(natal_sign)
    transit_idx = signs_order.index(transit_sign)
    house = ((transit_idx - natal_idx) % 12) + 1
    return house


def _aspect_strength(aspect: str, planet: str, orb_diff: float, max_orb: float) -> float:
    """Score 0-10 for how impactful this transit is."""
    # Closer orb = stronger
    orb_factor = 1 - (orb_diff / max_orb)

    # Weight by planet (outer planets = more impactful for major transits)
    planet_weights = {
        "Sun": 5, "Moon": 4, "Mercury": 3, "Venus": 4, "Mars": 6,
        "Jupiter": 7, "Saturn": 8, "Uranus": 9, "Neptune": 8, "Pluto": 10,
    }
    planet_factor = planet_weights.get(planet.capitalize(), 5) / 10

    # Weight by aspect type
    aspect_weights = {
        "conjunction": 10, "opposition": 8, "square": 7,
        "trine": 6, "sextile": 5, "quincunx": 4,
    }
    aspect_factor = aspect_weights.get(aspect, 5) / 10

    return round(orb_factor * planet_factor * aspect_factor * 10, 1)


def _get_moon_phase(dt: datetime) -> str:
    """Approximate moon phase based on lunar cycle."""
    # Simple approximation: new moon was ~Jan 6, 2026, cycle = 29.53 days
    from datetime import datetime as dt_class
    reference = datetime(2026, 1, 6, tzinfo=timezone.utc)
    days_since = (dt - reference).total_seconds() / 86400
    phase_position = (days_since % 29.53) / 29.53

    if phase_position < 0.0625:
        return "New Moon"
    elif phase_position < 0.1875:
        return "Waxing Crescent"
    elif phase_position < 0.3125:
        return "First Quarter"
    elif phase_position < 0.4375:
        return "Waxing Gibbous"
    elif phase_position < 0.5625:
        return "Full Moon"
    elif phase_position < 0.6875:
        return "Waning Gibbous"
    elif phase_position < 0.8125:
        return "Last Quarter"
    else:
        return "Waning Crescent"


def _approximate_positions(now: datetime) -> dict:
    """Rough planetary positions for dev/testing when kerykeion isn't installed."""
    # These are approximate for April 2026
    return {
        "sun":     {"sign": "Aries",       "degree": 17.5, "abs_degree": 17.5,  "retrograde": False},
        "moon":    {"sign": "Virgo",       "degree": 12.3, "abs_degree": 162.3, "retrograde": False},
        "mercury": {"sign": "Aries",       "degree": 5.8,  "abs_degree": 5.8,   "retrograde": False},
        "venus":   {"sign": "Pisces",      "degree": 28.2, "abs_degree": 358.2, "retrograde": False},
        "mars":    {"sign": "Cancer",      "degree": 8.4,  "abs_degree": 98.4,  "retrograde": False},
        "jupiter": {"sign": "Cancer",      "degree": 2.1,  "abs_degree": 92.1,  "retrograde": False},
        "saturn":  {"sign": "Aries",       "degree": 1.9,  "abs_degree": 1.9,   "retrograde": False},
        "uranus":  {"sign": "Gemini",      "degree": 0.3,  "abs_degree": 60.3,  "retrograde": False},
        "neptune": {"sign": "Aries",       "degree": 2.5,  "abs_degree": 2.5,   "retrograde": False},
        "pluto":   {"sign": "Aquarius",    "degree": 4.8,  "abs_degree": 304.8, "retrograde": False},
    }


def format_transits_for_claude(transit_data: dict) -> str:
    """Format transit data into a readable string for Claude API prompts."""
    lines = [f"Date: {transit_data['date']}", f"Moon Phase: {transit_data['moon_phase']}", ""]
    lines.append("Current planetary positions:")
    for planet, data in transit_data["planets"].items():
        retro = " (Retrograde)" if data.get("retrograde") else ""
        lines.append(f"  {planet.capitalize()}: {data['degree']}° {data['sign']}{retro}")
    return "\n".join(lines)


def format_sign_impact_for_claude(sign_name: str, impacts: list) -> str:
    """Format a sign's transit impacts for Claude prompts."""
    if not impacts:
        return f"No major transits directly affecting {sign_name} today. Focus on the general cosmic weather."

    lines = [f"Key transits affecting {sign_name}:"]
    for impact in impacts[:3]:  # Top 3 most impactful
        retro = " (retrograde)" if impact["retrograde"] else ""
        lines.append(
            f"  - {impact['planet']}{retro} in {impact['transit_sign']} "
            f"({impact['aspect']} to your sign, house {impact['house']}, "
            f"strength: {impact['strength']}/10)"
        )
    return "\n".join(lines)


def save_transit_data(transit_data: dict, date_str: str) -> Path:
    """Save transit data to daily output directory."""
    day_dir = OUTPUT_DIR / date_str
    day_dir.mkdir(parents=True, exist_ok=True)
    output_path = day_dir / "transits.json"
    with open(output_path, "w") as f:
        json.dump(transit_data, f, indent=2)
    return output_path


if __name__ == "__main__":
    data = get_daily_transits()
    print(format_transits_for_claude(data))
    print()
    for sign in ZODIAC_SIGNS:
        impacts = data["sign_impacts"][sign["name"]]
        if impacts:
            print(format_sign_impact_for_claude(sign["name"], impacts))
            print()
    save_path = save_transit_data(data, data["date"])
    print(f"Saved to: {save_path}")
