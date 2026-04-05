"""Natal chart computation using kerykeion."""

from dataclasses import dataclass
from datetime import date, time, datetime
from typing import Optional

from kerykeion import AstrologicalSubjectFactory


@dataclass
class PlanetPosition:
    name: str
    sign: str
    degree: float
    house: Optional[int]
    retrograde: bool


@dataclass
class NatalChart:
    name: str
    sun: PlanetPosition
    moon: PlanetPosition
    mercury: PlanetPosition
    venus: PlanetPosition
    mars: PlanetPosition
    jupiter: PlanetPosition
    saturn: PlanetPosition
    uranus: PlanetPosition
    neptune: PlanetPosition
    pluto: PlanetPosition
    ascending: Optional[PlanetPosition]
    houses: list[dict]
    aspects: list[dict]
    dominant_element: str

    @property
    def sun_sign(self) -> str:
        return self.sun.sign

    @property
    def moon_sign(self) -> Optional[str]:
        return self.moon.sign if self.moon else None

    @property
    def rising_sign(self) -> Optional[str]:
        return self.ascending.sign if self.ascending else None

    def to_summary(self) -> str:
        """Formatted summary for Claude context injection."""
        lines = [
            f"Natal Chart for {self.name}:",
            f"  Sun: {self.sun.sign} ({self.sun.degree:.1f}°) House {self.sun.house or '?'}",
            f"  Moon: {self.moon.sign} ({self.moon.degree:.1f}°) House {self.moon.house or '?'}",
        ]
        if self.ascending:
            lines.append(f"  Rising: {self.ascending.sign} ({self.ascending.degree:.1f}°)")
        lines.extend([
            f"  Mercury: {self.mercury.sign} House {self.mercury.house or '?'}{' (R)' if self.mercury.retrograde else ''}",
            f"  Venus: {self.venus.sign} House {self.venus.house or '?'}{' (R)' if self.venus.retrograde else ''}",
            f"  Mars: {self.mars.sign} House {self.mars.house or '?'}{' (R)' if self.mars.retrograde else ''}",
            f"  Jupiter: {self.jupiter.sign} House {self.jupiter.house or '?'}{' (R)' if self.jupiter.retrograde else ''}",
            f"  Saturn: {self.saturn.sign} House {self.saturn.house or '?'}{' (R)' if self.saturn.retrograde else ''}",
            f"  Dominant element: {self.dominant_element}",
        ])

        if self.aspects:
            lines.append("  Key aspects:")
            for asp in self.aspects[:8]:
                lines.append(f"    {asp['p1']} {asp['aspect']} {asp['p2']} (orb: {asp['orb']:.1f}°)")

        return "\n".join(lines)


def _extract_planet(subject, planet_name: str) -> PlanetPosition:
    """Extract a planet position from a kerykeion subject."""
    planet = getattr(subject, planet_name.lower(), None)
    if planet is None:
        # Try alternative attribute names
        planet = getattr(subject, planet_name, None)

    if planet is None:
        return PlanetPosition(
            name=planet_name, sign="Unknown", degree=0.0,
            house=None, retrograde=False,
        )

    return PlanetPosition(
        name=planet_name,
        sign=getattr(planet, "sign", "Unknown"),
        degree=getattr(planet, "abs_pos", 0.0),
        house=getattr(planet, "house", None),
        retrograde=getattr(planet, "retrograde", False),
    )


def _count_elements(planets: list[PlanetPosition]) -> str:
    """Determine dominant element from planet signs."""
    element_map = {
        "Ari": "Fire", "Leo": "Fire", "Sag": "Fire",
        "Tau": "Earth", "Vir": "Earth", "Cap": "Earth",
        "Gem": "Air", "Lib": "Air", "Aqu": "Air",
        "Can": "Water", "Sco": "Water", "Pis": "Water",
    }
    # Also handle full names
    full_names = {
        "Aries": "Fire", "Leo": "Fire", "Sagittarius": "Fire",
        "Taurus": "Earth", "Virgo": "Earth", "Capricorn": "Earth",
        "Gemini": "Air", "Libra": "Air", "Aquarius": "Air",
        "Cancer": "Water", "Scorpio": "Water", "Pisces": "Water",
    }
    element_map.update(full_names)

    counts = {"Fire": 0, "Earth": 0, "Air": 0, "Water": 0}
    for p in planets:
        element = element_map.get(p.sign, element_map.get(p.sign[:3], None))
        if element:
            counts[element] += 1
    return max(counts, key=counts.get)


def compute_natal_chart(
    name: str,
    birth_year: int,
    birth_month: int,
    birth_day: int,
    birth_hour: int = 12,
    birth_minute: int = 0,
    lat: float = 0.0,
    lng: float = 0.0,
    tz_str: str = "UTC",
    has_birth_time: bool = True,
) -> NatalChart:
    """Compute a natal chart using kerykeion."""
    subject = AstrologicalSubjectFactory.from_birth_data(
        name=name,
        year=birth_year,
        month=birth_month,
        day=birth_day,
        hour=birth_hour,
        minute=birth_minute,
        lat=lat,
        lng=lng,
        tz_str=tz_str,
        online=False,
    )

    planets = []
    planet_names = ["Sun", "Moon", "Mercury", "Venus", "Mars",
                    "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]

    planet_positions = {}
    for pname in planet_names:
        pos = _extract_planet(subject, pname)
        planet_positions[pname.lower()] = pos
        planets.append(pos)

    ascending = None
    if has_birth_time:
        ascending = _extract_planet(subject, "First_House")
        if ascending.sign == "Unknown":
            # Try alternative
            try:
                asc_data = subject.first_house
                ascending = PlanetPosition(
                    name="Ascendant",
                    sign=getattr(asc_data, "sign", "Unknown"),
                    degree=getattr(asc_data, "abs_pos", 0.0),
                    house=1,
                    retrograde=False,
                )
            except Exception:
                ascending = None

    # Extract aspects
    aspects = []
    try:
        for aspect in getattr(subject, "aspects_list", []):
            aspects.append({
                "p1": getattr(aspect, "p1_name", "?"),
                "aspect": getattr(aspect, "aspect", "?"),
                "p2": getattr(aspect, "p2_name", "?"),
                "orb": getattr(aspect, "orb", 0.0),
            })
    except Exception:
        pass

    dominant_element = _count_elements(planets)

    return NatalChart(
        name=name,
        sun=planet_positions["sun"],
        moon=planet_positions["moon"],
        mercury=planet_positions["mercury"],
        venus=planet_positions["venus"],
        mars=planet_positions["mars"],
        jupiter=planet_positions["jupiter"],
        saturn=planet_positions["saturn"],
        uranus=planet_positions["uranus"],
        neptune=planet_positions["neptune"],
        pluto=planet_positions["pluto"],
        ascending=ascending,
        houses=[],
        aspects=aspects,
        dominant_element=dominant_element,
    )


def compute_chart_from_user_data(
    name: str,
    birth_date: date,
    birth_time: Optional[time],
    lat: float,
    lng: float,
    tz_str: str = "UTC",
) -> NatalChart:
    """Convenience wrapper that takes date/time objects."""
    has_time = birth_time is not None
    hour = birth_time.hour if birth_time else 12
    minute = birth_time.minute if birth_time else 0

    return compute_natal_chart(
        name=name,
        birth_year=birth_date.year,
        birth_month=birth_date.month,
        birth_day=birth_date.day,
        birth_hour=hour,
        birth_minute=minute,
        lat=lat,
        lng=lng,
        tz_str=tz_str,
        has_birth_time=has_time,
    )
