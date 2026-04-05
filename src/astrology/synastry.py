"""Synastry (compatibility) computation between two natal charts."""

from src.astrology.charts import NatalChart, PlanetPosition


ASPECT_ANGLES = {
    "conjunction": 0,
    "opposition": 180,
    "trine": 120,
    "square": 90,
    "sextile": 60,
}

# Harmonious vs challenging aspects
HARMONIOUS = {"trine", "sextile", "conjunction"}
CHALLENGING = {"square", "opposition"}


def compute_synastry(chart_a: NatalChart, chart_b: NatalChart, orb: float = 6.0) -> dict:
    """Compute synastry aspects between two charts.

    Returns structured synastry data with aspects, scores, and summaries.
    """
    planets_a = _get_planet_dict(chart_a)
    planets_b = _get_planet_dict(chart_b)

    aspects = []
    for name_a, pos_a in planets_a.items():
        for name_b, pos_b in planets_b.items():
            angular_diff = abs(pos_a.degree - pos_b.degree) % 360
            if angular_diff > 180:
                angular_diff = 360 - angular_diff

            for aspect_name, aspect_angle in ASPECT_ANGLES.items():
                aspect_orb = abs(angular_diff - aspect_angle)
                if aspect_orb <= orb:
                    aspects.append({
                        "planet_a": name_a,
                        "sign_a": pos_a.sign,
                        "planet_b": name_b,
                        "sign_b": pos_b.sign,
                        "aspect": aspect_name,
                        "orb": round(aspect_orb, 2),
                        "nature": "harmonious" if aspect_name in HARMONIOUS else "challenging",
                    })

    # Compute category scores
    scores = _compute_synastry_scores(aspects)

    return {
        "person_a": chart_a.name,
        "person_b": chart_b.name,
        "aspects": aspects,
        "scores": scores,
        "overall_compatibility": scores.get("overall", 50),
    }


def _get_planet_dict(chart: NatalChart) -> dict[str, PlanetPosition]:
    planets = {
        "Sun": chart.sun, "Moon": chart.moon, "Mercury": chart.mercury,
        "Venus": chart.venus, "Mars": chart.mars, "Jupiter": chart.jupiter,
        "Saturn": chart.saturn,
    }
    if chart.ascending:
        planets["Ascendant"] = chart.ascending
    return planets


def _compute_synastry_scores(aspects: list[dict]) -> dict:
    """Compute category-wise compatibility scores."""
    categories = {
        "sun_harmony": {"pairs": [("Sun", "Sun"), ("Sun", "Moon"), ("Sun", "Ascendant")], "score": 50},
        "moon_bond": {"pairs": [("Moon", "Moon"), ("Moon", "Sun"), ("Moon", "Venus")], "score": 50},
        "venus_match": {"pairs": [("Venus", "Venus"), ("Venus", "Mars"), ("Venus", "Moon")], "score": 50},
        "mars_energy": {"pairs": [("Mars", "Mars"), ("Mars", "Venus"), ("Mars", "Sun")], "score": 50},
    }

    for aspect in aspects:
        pair = (aspect["planet_a"], aspect["planet_b"])
        pair_rev = (aspect["planet_b"], aspect["planet_a"])

        for cat_name, cat_data in categories.items():
            if pair in cat_data["pairs"] or pair_rev in cat_data["pairs"]:
                if aspect["nature"] == "harmonious":
                    bonus = max(1, int(15 - aspect["orb"] * 2))
                    cat_data["score"] = min(100, cat_data["score"] + bonus)
                else:
                    penalty = max(1, int(10 - aspect["orb"]))
                    cat_data["score"] = max(0, cat_data["score"] - penalty)

    scores = {name: data["score"] for name, data in categories.items()}
    scores["overall"] = round(sum(scores.values()) / len(scores))
    return scores


def format_synastry_summary(synastry_data: dict, brief: bool = False) -> str:
    """Format synastry results for Claude context or direct display."""
    scores = synastry_data["scores"]
    a = synastry_data["person_a"]
    b = synastry_data["person_b"]

    if brief:
        return (
            f"Compatibility between {a} and {b}: {scores['overall']}%\n"
            f"Sun Harmony: {scores['sun_harmony']}% | "
            f"Moon Bond: {scores['moon_bond']}% | "
            f"Venus Match: {scores['venus_match']}%"
        )

    lines = [
        f"Synastry Report: {a} & {b}",
        f"  Overall Compatibility: {scores['overall']}%",
        f"  Sun Harmony: {scores['sun_harmony']}%",
        f"  Moon Bond: {scores['moon_bond']}%",
        f"  Venus Match: {scores['venus_match']}%",
        f"  Mars Energy: {scores['mars_energy']}%",
        "",
        "Key Aspects:",
    ]

    for asp in synastry_data["aspects"][:10]:
        nature_icon = "✓" if asp["nature"] == "harmonious" else "✗"
        lines.append(
            f"  {nature_icon} {a}'s {asp['planet_a']} {asp['aspect']} "
            f"{b}'s {asp['planet_b']} (orb: {asp['orb']}°)"
        )

    return "\n".join(lines)
