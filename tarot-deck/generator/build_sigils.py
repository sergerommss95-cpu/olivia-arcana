"""
COSMOS sigil builder — author all 78 sigil_body strings using locked
template patterns and write them into deck_manifest.json.

Three proven figure patterns (each validated to pass BFL moderation):

  A. SEATED  — single figure on a simple stool/bench/ground
  B. WALKING — single figure in mid-stride with "cliff edge / empty
                space" narrative framing (Fool v5 pattern)
  C. DYAD    — two figures facing each other with reaching hands
                (Lovers pattern)

Each card supplies three compact fields:
  - essence       : narrative framing clause (appears after "— " in the
                    intro, e.g. "the essence of stepping into the unknown
                    toward a guiding star")
  - pattern       : one of "seated", "walking", "dyad"
  - figure_desc   : describes the pose/action of the figure(s) —
                    (element 1 of the icon)
  - emblem_desc   : describes the celestial/symbolic element that
                    differentiates this card from others — (element 3)
  - emblem_label  : the short noun used in elements (5) and the vertex
                    list to reference this card's emblem

This script builds the full sigil_body strings and writes updated
card dicts to deck_manifest.json.
"""
from __future__ import annotations

import json
from pathlib import Path

HERE = Path(__file__).parent
MANIFEST = HERE / "deck_manifest.json"


# ─────────────────────────────────────────────────────────────
# Body builders for each of the three proven figure patterns
# ─────────────────────────────────────────────────────────────
def seated_body(figure_desc: str, emblem_desc: str, emblem_label: str) -> str:
    """Pattern A — seated figure on furniture, differentiator above head."""
    return (
        "The icon consists of: "
        f"(1) {figure_desc} "
        "The figure is drawn as pure hairline outline, no face, no clothing "
        "detail. "
        "(2) A clean horizontal ground line beneath the figure's feet. "
        f"(3) {emblem_desc} "
        "(4) A thin gentle downward crescent arc floating below the ground "
        "line. "
        "(5) The entire composition is framed inside a thin perfect gold "
        f"circle that encloses the figure, ground, {emblem_label}, and "
        "crescent — like a luxury emblem seal. "
        f"At the key vertices of the composition — the {emblem_label}, the "
        "tips of the crescent, and two points on the circle ring — are six "
        "bright star points in alternating lavender-magenta and cool cyan "
        "with soft radial halos."
    )


def walking_body(figure_desc: str, emblem_desc: str, emblem_label: str) -> str:
    """Pattern B — walking figure with 'cliff edge / empty space' framing."""
    return (
        "The icon consists of: "
        f"(1) {figure_desc} "
        "No face, no clothing detail, just the minimalist silhouette line. "
        "(2) A clean horizontal line beneath the figure's trailing foot "
        "representing the cliff edge — the figure's front foot extends out "
        "beyond this line into empty space, making the 'stepping off the "
        "edge' reading unmistakable. "
        f"(3) {emblem_desc} "
        "(4) A thin gentle downward crescent arc floating below the cliff "
        "line representing the open void being stepped into. "
        "(5) The entire composition is framed inside a thin perfect gold "
        f"circle that encloses the figure, cliff, {emblem_label}, and "
        "crescent — like a luxury emblem seal. "
        "At the key vertices of the composition — the guiding star, the "
        "tips of the crescent, the point where the figure's front foot "
        "meets empty space, and two points on the circle ring — are six "
        "bright star points in alternating lavender-magenta and cool cyan "
        "with soft radial halos."
    )


def dyad_body(figure_desc: str, emblem_desc: str, emblem_label: str) -> str:
    """Pattern C — two figures facing each other with a shared emblem above."""
    return (
        "The icon consists of: "
        f"(1) {figure_desc} "
        "Both figures are drawn as pure hairline outline, no face, no "
        "clothing detail. "
        "(2) A clean horizontal ground line beneath the figures' feet. "
        f"(3) {emblem_desc} "
        "(4) A thin gentle crescent arc floating just above the central "
        "emblem like a blessing. "
        "(5) The entire composition is framed inside a thin perfect gold "
        f"circle that encloses the figures, ground, {emblem_label}, and "
        "crescent — like a luxury emblem seal. "
        f"At the key vertices of the composition — the {emblem_label}, the "
        "tips of the crescent, and two points on the circle ring — are six "
        "bright star points in alternating lavender-magenta and cool cyan "
        "with soft radial halos."
    )


BUILDERS = {
    "seated": seated_body,
    "walking": walking_body,
    "dyad": dyad_body,
}


def build(pattern: str, figure_desc: str, emblem_desc: str, emblem_label: str) -> str:
    return BUILDERS[pattern](figure_desc, emblem_desc, emblem_label)


# ─────────────────────────────────────────────────────────────
# Reusable fragments — keep sigil descriptions consistent
# ─────────────────────────────────────────────────────────────
SEATED_ON_STOOL = (
    "a single slender human figure silhouette in pure profile view seated "
    "upright on a simple low stool at the exact center, both hands resting "
    "calmly on their thighs, feet planted on the ground below. The stool is "
    "a thin horizontal gold line with two short vertical legs."
)

SEATED_ON_BENCH = (
    "a single slender human figure silhouette in pure profile view seated "
    "upright on a simple horizontal bench at the exact center, hands "
    "resting calmly on their knees, feet planted on the ground below. The "
    "bench is a thin horizontal gold line with two short vertical legs."
)

SEATED_ON_GROUND = (
    "a single slender human figure silhouette in pure profile view seated "
    "cross-legged on the ground at the exact center, back straight, hands "
    "resting calmly on their knees."
)

WALKING_FORWARD = (
    "a small stylized human figure silhouette in pure profile view, drawn "
    "as a continuous hairline outline — the figure is mid-stride with one "
    "foot lifted forward and arms slightly raised in movement, body leaning "
    "into the step, clearly reading as a person walking forward."
)

TWO_FIGURES_FACING = (
    "two slender human figure silhouettes standing in profile facing each "
    "other at the exact center, their inner hands reaching forward to "
    "almost touch between them, their outer arms relaxed at their sides."
)

ANCHOR_STAR_ABOVE = (
    "Directly above the figure's head floats a single large bright anchor "
    "star with a soft radial glow in lavender-magenta — the guiding star."
)


# ─────────────────────────────────────────────────────────────
# CARD DEFINITIONS — all 78 cards
# ─────────────────────────────────────────────────────────────
# Each entry: id → (essence, pattern, figure_desc, emblem_desc, emblem_label)
CARDS: dict[int, dict] = {}

# ════════════════════════════════════════════════════════════
# MAJOR ARCANA (0–21)
# ════════════════════════════════════════════════════════════

CARDS[0] = {
    "essence": "the essence of stepping into the unknown toward a guiding star",
    "pattern": "walking",
    "figure_desc": WALKING_FORWARD,
    "emblem_desc": (
        "A single small bright anchor star positioned directly above the "
        "figure's head representing the guiding star, with a soft radial "
        "glow in lavender-magenta."
    ),
    "emblem_label": "guiding star",
}

CARDS[1] = {
    "essence": "the essence of focused inner mastery beneath a radiant sun of manifestation",
    "pattern": "seated",
    "figure_desc": SEATED_ON_STOOL,
    "emblem_desc": (
        "Directly above the figure's head floats a small bright radiant sun "
        "disc — a tiny filled gold circle with twelve short hairline gold "
        "rays radiating outward at equal angles — representing the sun of "
        "manifestation, with a soft radial glow."
    ),
    "emblem_label": "sun disc",
}

CARDS[2] = {
    "essence": "the essence of quiet intuition beneath a reflecting crescent moon",
    "pattern": "seated",
    "figure_desc": SEATED_ON_BENCH,
    "emblem_desc": (
        "Directly above the figure's head floats a single large upward-"
        "facing crescent moon arc opening upward like a bowl — drawn in "
        "clean hairline gold with a soft radial glow — representing the "
        "vessel of intuition. Two small hairline vertical pillars of equal "
        "height flank the bench on either side."
    ),
    "emblem_label": "crescent bowl",
}

CARDS[3] = {
    "essence": "the essence of nurturing abundance beneath a crown of twelve stars",
    "pattern": "seated",
    "figure_desc": SEATED_ON_BENCH,
    "emblem_desc": (
        "Directly above the figure's head floats a gentle arc of twelve "
        "small bright stars arranged in a soft semicircle like a crown, "
        "drawn in warm gold with lavender-magenta and cyan accent rays — "
        "the crown of stars."
    ),
    "emblem_label": "crown of stars",
}

CARDS[4] = {
    "essence": "the essence of steady sovereignty beneath a mountain of enduring stone",
    "pattern": "seated",
    "figure_desc": SEATED_ON_BENCH,
    "emblem_desc": (
        "Directly above the figure's head floats a simple triangular "
        "mountain silhouette — a clean hairline gold outline of a peak — "
        "with a single small bright anchor star resting at its summit, "
        "representing enduring sovereignty."
    ),
    "emblem_label": "mountain",
}

CARDS[5] = {
    "essence": "the essence of timeless teaching beneath a triple-tier key of understanding",
    "pattern": "seated",
    "figure_desc": SEATED_ON_BENCH,
    "emblem_desc": (
        "Directly above the figure's head floats a tall vertical key shape "
        "drawn in clean hairline gold — a circular bow at the top with a "
        "simple shaft and three small teeth at the base — representing the "
        "key of inherited wisdom, with a soft radial glow."
    ),
    "emblem_label": "key of wisdom",
}

CARDS[6] = {
    "essence": "the essence of two souls meeting under a guiding star of union",
    "pattern": "dyad",
    "figure_desc": TWO_FIGURES_FACING,
    "emblem_desc": (
        "Floating directly above the gap between them, centered between "
        "their heads, is a single large bright anchor star with a soft "
        "radial glow in lavender-magenta — the star of union."
    ),
    "emblem_label": "union star",
}

CARDS[7] = {
    "essence": "the essence of focused will moving forward under a guiding star",
    "pattern": "seated",
    "figure_desc": (
        "a single slender human figure silhouette in profile view seated "
        "upright inside a simple two-wheeled chariot drawn as a clean "
        "hairline rectangular box with two circular gold wheels at the "
        "sides, the figure's hands lightly holding two thin hairline gold "
        "reins that extend forward into empty space ahead."
    ),
    "emblem_desc": (
        "Directly above the chariot and figure floats a single large bright "
        "anchor star with a soft radial glow in lavender-magenta — the "
        "guiding star of victory."
    ),
    "emblem_label": "guiding star",
}

CARDS[8] = {
    "essence": "the essence of gentle inner strength beneath an infinity of endurance",
    "pattern": "seated",
    "figure_desc": SEATED_ON_STOOL,
    "emblem_desc": (
        "Directly above the figure's head floats a clean horizontal "
        "infinity lemniscate drawn as a single continuous hairline gold "
        "ribbon — two equal loops meeting at a central crossing point — "
        "representing quiet endurance, with a soft radial glow."
    ),
    "emblem_label": "infinity ribbon",
}

CARDS[9] = {
    "essence": "the essence of solitary inner light held alone on a dark path",
    "pattern": "seated",
    "figure_desc": (
        "a single slender human figure silhouette in pure profile view "
        "seated cross-legged on the ground at the exact center, back "
        "straight, both hands gently holding a small hexagonal lantern "
        "resting on the ground in front of the crossed legs. The lantern "
        "is a tiny hairline gold hexagon with a small bright point of light "
        "inside it."
    ),
    "emblem_desc": ANCHOR_STAR_ABOVE,
    "emblem_label": "guiding star",
}

CARDS[10] = {
    "essence": "the essence of turning cycles beneath a wheel of cosmic spiral",
    "pattern": "seated",
    "figure_desc": SEATED_ON_STOOL,
    "emblem_desc": (
        "Directly above the figure's head floats a perfect hairline gold "
        "circle with eight thin spokes radiating from its center to its "
        "rim, like a clean minimalist wheel — representing the turning "
        "cycle of fortune, with a soft radial glow."
    ),
    "emblem_label": "wheel",
}

CARDS[11] = {
    "essence": "the essence of truth weighed in perfect balance",
    "pattern": "seated",
    "figure_desc": SEATED_ON_BENCH,
    "emblem_desc": (
        "Directly above the figure's head floats a single pair of "
        "perfectly balanced hanging scales — drawn in clean hairline gold "
        "as a thin horizontal beam suspended from a small central hook, "
        "with two identical shallow round pans hanging by thin lines from "
        "each end of the beam, both pans resting at exactly the same "
        "height to show perfect equilibrium — with a soft radial glow "
        "around the scales, representing truth weighed in balance. No "
        "crescent moon, no sun, no other celestial body near the scales."
    ),
    "emblem_label": "scales",
}

CARDS[12] = {
    "essence": "the essence of quiet surrender beneath a single still star",
    "pattern": "seated",
    "figure_desc": (
        "a single slender human figure silhouette in pure profile view "
        "seated cross-legged on the ground at the exact center, head "
        "tilted gently back to gaze upward at the sky, hands resting "
        "calmly on the knees."
    ),
    "emblem_desc": (
        "Directly above the figure's upturned face floats a single large "
        "bright still star with a soft radial halo in lavender-magenta — "
        "the still point of surrender."
    ),
    "emblem_label": "still star",
}

CARDS[13] = {
    "essence": "the essence of a quiet threshold crossed toward a guiding star",
    "pattern": "walking",
    "figure_desc": (
        "a small stylized human figure silhouette in pure profile view "
        "walking forward in mid-stride, one foot lifted forward and the "
        "other foot planted behind, body leaning gently into the step, "
        "passing beneath a simple hairline gold doorway arch drawn as a "
        "thin upside-down U shape that frames the figure."
    ),
    "emblem_desc": (
        "A single small bright anchor star positioned directly above the "
        "doorway arch representing the guiding star beyond the threshold, "
        "with a soft radial glow in lavender-magenta."
    ),
    "emblem_label": "guiding star",
}

CARDS[14] = {
    "essence": "the essence of patient blending beneath a crescent of flowing water",
    "pattern": "seated",
    "figure_desc": (
        "a single slender human figure silhouette in profile view seated "
        "upright on a simple low stool at the exact center, holding two "
        "small hairline gold vessels one in each hand at chest level — a "
        "tall slender vessel in the upper hand and a short cup-shaped "
        "vessel in the lower hand — with a thin hairline gold stream of "
        "water arcing gracefully from the upper vessel down into the "
        "lower vessel. The stool is a thin horizontal gold line with two "
        "short vertical legs."
    ),
    "emblem_desc": (
        "Directly above the figure's head floats a clean upward-facing "
        "crescent arc drawn in hairline gold — the crescent of flow — "
        "with a soft radial glow."
    ),
    "emblem_label": "crescent of flow",
}

CARDS[15] = {
    "essence": "the essence of chosen bondage released beneath a broken chain link",
    "pattern": "dyad",
    "figure_desc": (
        "two slender human figure silhouettes standing in profile facing "
        "each other at the exact center, each with their inner wrist "
        "connected by a thin hairline gold chain of three small oval "
        "links, the middle link clearly broken open — the chain hangs "
        "loose between them, suggesting chosen bondage that is already "
        "loosening. Both figures stand with their outer arms relaxed."
    ),
    "emblem_desc": (
        "Floating directly above the gap between them, centered between "
        "their heads, is a single large bright anchor star with a soft "
        "radial glow in lavender-magenta — the star of freedom."
    ),
    "emblem_label": "star of freedom",
}

CARDS[16] = {
    "essence": "the essence of sudden revelation beneath a bolt of awakening light",
    "pattern": "seated",
    "figure_desc": (
        "a single slender human figure silhouette in profile view seated "
        "upright on a simple low stool at the exact center, hands resting "
        "calmly on their thighs, gazing upward. The stool is a thin "
        "horizontal gold line with two short vertical legs. A tall slim "
        "hairline gold obelisk shape rises just behind the figure, its "
        "top capped with a small pyramidal point."
    ),
    "emblem_desc": (
        "Directly above the obelisk floats a single zigzag bolt shape — "
        "three short angled hairline gold line segments forming a clean "
        "lightning bolt — with a soft radial glow in lavender-magenta, "
        "representing the flash of revelation."
    ),
    "emblem_label": "bolt of light",
}

CARDS[17] = {
    "essence": "the essence of pouring hope beneath a sky of seven guiding stars",
    "pattern": "seated",
    "figure_desc": (
        "a single slender human figure silhouette in profile view kneeling "
        "on one knee at the exact center, both hands gently holding a small "
        "round hairline gold vessel tilted to pour a thin hairline gold "
        "stream of water down onto the ground line."
    ),
    "emblem_desc": (
        "Directly above the figure's head floats a gentle arc of seven "
        "small bright stars arranged in a soft semicircle, drawn in warm "
        "gold with lavender-magenta and cyan accent rays — the seven "
        "guiding stars of hope."
    ),
    "emblem_label": "seven stars",
}

CARDS[18] = {
    "essence": "the essence of inner waters mirrored beneath a luminous disc of reflection",
    "pattern": "seated",
    "figure_desc": (
        "a single slender human figure silhouette in profile view seated "
        "cross-legged on the ground at the exact center beside a small "
        "still hairline gold pool drawn as a flat horizontal ellipse just "
        "in front of the figure, gazing down at the reflection in the pool."
    ),
    "emblem_desc": (
        "Directly above the figure's head floats a single large perfect "
        "hairline gold outline circle — completely empty inside, drawn "
        "as a thin clean gold ring only, absolutely NO photographic "
        "lunar texture, NO craters, NO shading, NO surface detail — "
        "just a pure line-art ring with a faint inner concentric hairline "
        "ring and a soft radial lavender-magenta halo emanating outward "
        "from the ring. The circle must stay in the same minimalist "
        "hairline gold style as every other element on the card."
    ),
    "emblem_label": "luminous disc",
}

CARDS[19] = {
    "essence": "the essence of radiant joy beneath a great sun of pure warmth",
    "pattern": "seated",
    "figure_desc": (
        "a small slender human figure silhouette in pure profile view "
        "seated upright on the ground at the exact center with arms "
        "extended outward to the sides palms open, legs crossed comfortably, "
        "feet planted on the ground below."
    ),
    "emblem_desc": (
        "Directly above the figure's head floats a single large radiant "
        "sun — a filled gold circle with twenty short hairline gold rays "
        "radiating outward at equal angles at varying lengths — with a "
        "generous soft radial glow in warm gold, representing the great "
        "sun of joy."
    ),
    "emblem_label": "great sun",
}

CARDS[20] = {
    "essence": "the essence of a quiet rising answer beneath a descending cosmic bell",
    "pattern": "seated",
    "figure_desc": (
        "a single slender human figure silhouette in pure profile view "
        "seated upright on a simple low stool at the exact center with "
        "both arms raised gently outward at the elbows in a quiet receiving "
        "gesture, palms open facing upward toward the sky, feet planted on "
        "the ground below. The stool is a thin horizontal gold line with "
        "two short vertical legs."
    ),
    "emblem_desc": (
        "Directly above the figure's upturned palms floats a single "
        "downward-facing bell-shaped arc drawn in clean hairline gold — "
        "the cosmic bell of calling — with a small bright star at its "
        "apex and a soft radial glow in lavender-magenta."
    ),
    "emblem_label": "cosmic bell",
}

CARDS[21] = {
    "essence": "the essence of completion encircled beneath a wreath of living light",
    "pattern": "seated",
    "figure_desc": SEATED_ON_STOOL,
    "emblem_desc": (
        "Surrounding the entire seated figure at a respectful distance is "
        "a clean hairline gold oval wreath made of two curving gold lines "
        "meeting at the top and bottom with six small accent leaves along "
        "its length — the wreath of completion. Directly above the figure's "
        "head within the wreath floats a single small bright anchor star "
        "with a soft radial glow in lavender-magenta."
    ),
    "emblem_label": "wreath of completion",
}


# ════════════════════════════════════════════════════════════
# MINOR ARCANA — 56 cards, four suits × 14 each
# ════════════════════════════════════════════════════════════
# Suit symbol visual definitions — reused across all minor cards
SUIT_SYMBOLS = {
    "Wands": (
        "an upright wooden staff pointing straight up — drawn as a thick "
        "hairline gold vertical rod with a small rounded knob at the top, "
        "a matching rounded base at the bottom, and two small leaf sprouts "
        "emerging sideways from the midsection of the shaft like a "
        "budding branch. Flat 2D line-art only, no photographic texture, "
        "no wood grain, no galaxies, no nebulae — just a clean gold "
        "outline of a simple magic wand / staff."
    ),
    "Cups": (
        "an upright drinking goblet — drawn as a hairline gold wide "
        "shallow U-shaped bowl (like a rounded half-moon cup opening "
        "upward) sitting on top of a slender vertical stem that rises "
        "from a small round flat foot base. The whole shape reads "
        "instantly as a simple wine glass / chalice in silhouette. Flat "
        "2D line-art only, absolutely no spiral galaxy, no nebula swirl, "
        "no cosmic cluster, no photographic texture of any kind — just a "
        "clean gold outline of a drinking cup."
    ),
    "Swords": (
        "a straight upright dagger pointing up — drawn as a hairline gold "
        "long thin triangular blade pointing toward the top of the card, "
        "a distinct horizontal crossguard bar at the base of the blade, "
        "a short straight handle below the crossguard, and a small round "
        "pommel at the very bottom of the handle. Flat 2D line-art only, "
        "no photographic texture — just a clean gold outline of a simple "
        "sword / dagger with a visible hilt."
    ),
    "Pentacles": (
        "an upright round gold coin — drawn as a hairline gold perfect "
        "circle with a simple smaller concentric circle inside it "
        "(double-ring coin edge), and four tiny dots arranged in a "
        "cardinal compass pattern (north, south, east, west) inside the "
        "inner ring. No star shape of any kind, no lines radiating to "
        "the edges, no geometric symbols — just a plain minted coin with "
        "a double-ring outline and four small cardinal dots. Flat 2D "
        "line-art only, no photographic texture, no metal reflection — "
        "just a clean gold outline of a simple round coin."
    ),
}

# Short action phrases for each numbered card in each suit (1-10 + court)
# Each entry: (figure_action, emblem_desc_template, emblem_label)
# The emblem_desc_template uses {symbol} and {n} placeholders

def make_minor(
    suit: str,
    number: str,
    pattern: str,
    figure_desc: str,
    emblem_desc: str,
    emblem_label: str,
) -> dict:
    return {
        "pattern": pattern,
        "figure_desc": figure_desc,
        "emblem_desc": emblem_desc,
        "emblem_label": emblem_label,
    }


# Suit essences (fixed narrative theme for each suit)
SUIT_ESSENCE = {
    "Wands": "fire and will",
    "Cups": "water and heart",
    "Swords": "air and clear thought",
    "Pentacles": "earth and craft",
}


def minor_essence(suit: str, number: str, theme: str) -> str:
    """Compose an essence clause for a minor card."""
    return f"the essence of {theme} in the suit of {SUIT_ESSENCE[suit]}"


# Numbered card themes (applied uniformly across all four suits)
NUMBER_THEMES = {
    "Ace":   "a pure first spark",
    "Two":   "the meeting of two paths",
    "Three": "the first harvest of intention",
    "Four":  "the building of a stable foundation",
    "Five":  "a necessary challenge",
    "Six":   "the rhythm of generous exchange",
    "Seven": "the quiet testing of resolve",
    "Eight": "the steady craft of mastery",
    "Nine":  "the fullness of near completion",
    "Ten":   "the full circle of completion",
    "Page":  "a young heart learning the craft",
    "Knight": "the forward ride of devotion",
    "Queen": "the wise inner sovereign",
    "King":  "the grounded outer sovereign",
}


def seated_minor_figure(suit: str, n_symbols: int) -> str:
    """Seated figure holding suit symbol(s) in hands."""
    symbol_plural = (
        f"{n_symbols} small {suit.lower()} symbols"
        if n_symbols > 1
        else f"a single {suit.lower()} symbol"
    )
    return (
        "a single slender human figure silhouette in pure profile view "
        "seated upright on a simple low stool at the exact center, both "
        f"hands resting calmly on their thighs. The stool is a thin "
        "horizontal gold line with two short vertical legs."
    )


# Concrete plural nouns for each suit — used directly in the emblem
# description so Flux2 renders a specific recognisable object instead
# of falling back to abstract "star" decoration.
SUIT_PLURAL = {
    "Wands": "wooden staffs",
    "Cups": "upright goblets",
    "Swords": "upright daggers",
    "Pentacles": "round coin medallions",
}
SUIT_SINGULAR = {
    "Wands": "wooden staff",
    "Cups": "upright goblet",
    "Swords": "upright dagger",
    "Pentacles": "round coin medallion",
}


def n_symbols_above(suit: str, n: int) -> tuple[str, str]:
    """Return (emblem_desc, emblem_label) for a pip card.

    Rather than rendering N copies of the suit object (which Flux2
    consistently fails to do — it collapses them to abstract sparkles),
    we use a SINGLE large hero suit object + a pattern of N small
    accent dot-points arranged as a 'rank counter' just above it.
    This mirrors the proven court card approach."""
    sym_single = SUIT_SYMBOLS[suit]
    singular = SUIT_SINGULAR[suit]

    # Each rank's dot pattern — kept simple and geometric so the model
    # can render it cleanly. The count is what differentiates the cards
    # within a suit; the hero object is what identifies the suit.
    rank_patterns = {
        1: "a single small accent dot-point centred at its apex",
        2: "two small accent dot-points side by side at its upper "
           "corners",
        3: "three small accent dot-points arranged in a small triangle "
           "(two at the base and one at the apex) just above it",
        4: "four small accent dot-points arranged in a small two-by-two "
           "square grid just above it",
        5: "five small accent dot-points arranged in a small pentagon "
           "ring just above it",
        6: "six small accent dot-points arranged in a small two-by-three "
           "rectangular grid just above it",
        7: "seven small accent dot-points arranged in a small gentle arc "
           "just above it",
        8: "eight small accent dot-points arranged in a small two-by-four "
           "rectangular grid just above it",
        9: "nine small accent dot-points arranged in a small three-by-three "
           "square grid just above it",
        10: "ten small accent dot-points arranged in a small two-row pattern "
            "of five-and-five just above it",
    }
    pattern = rank_patterns[n]

    return (
        f"Directly above the figure's head, filling the upper portion of "
        f"the card, floats a single large dominant hero {singular}. The "
        f"{singular} is drawn as {sym_single}. It is the unmistakable "
        f"focal object of the upper half of the card and occupies the "
        f"space directly above the figure's head like a luxury logo "
        f"mark. Floating just above the {singular} as a minimalist rank "
        f"counter are {pattern}, drawn as small bright cyan and "
        f"lavender dot-marks. The {singular} itself MUST be rendered as "
        f"a single recognisable object, NOT replaced by stars or "
        f"abstract sparkles or duplicated.",
        singular,
    )


# Build minor cards
MINOR_ID_MAP = {
    # (id, suit, number)
    22: ("Wands", "Ace"),
    23: ("Wands", "Two"),
    24: ("Wands", "Three"),
    25: ("Wands", "Four"),
    26: ("Wands", "Five"),
    27: ("Wands", "Six"),
    28: ("Wands", "Seven"),
    29: ("Wands", "Eight"),
    30: ("Wands", "Nine"),
    31: ("Wands", "Ten"),
    32: ("Wands", "Page"),
    33: ("Wands", "Knight"),
    34: ("Wands", "Queen"),
    35: ("Wands", "King"),
    36: ("Cups", "Ace"),
    37: ("Cups", "Two"),
    38: ("Cups", "Three"),
    39: ("Cups", "Four"),
    40: ("Cups", "Five"),
    41: ("Cups", "Six"),
    42: ("Cups", "Seven"),
    43: ("Cups", "Eight"),
    44: ("Cups", "Nine"),
    45: ("Cups", "Ten"),
    46: ("Cups", "Page"),
    47: ("Cups", "Knight"),
    48: ("Cups", "Queen"),
    49: ("Cups", "King"),
    50: ("Swords", "Ace"),
    51: ("Swords", "Two"),
    52: ("Swords", "Three"),
    53: ("Swords", "Four"),
    54: ("Swords", "Five"),
    55: ("Swords", "Six"),
    56: ("Swords", "Seven"),
    57: ("Swords", "Eight"),
    58: ("Swords", "Nine"),
    59: ("Swords", "Ten"),
    60: ("Swords", "Page"),
    61: ("Swords", "Knight"),
    62: ("Swords", "Queen"),
    63: ("Swords", "King"),
    64: ("Pentacles", "Ace"),
    65: ("Pentacles", "Two"),
    66: ("Pentacles", "Three"),
    67: ("Pentacles", "Four"),
    68: ("Pentacles", "Five"),
    69: ("Pentacles", "Six"),
    70: ("Pentacles", "Seven"),
    71: ("Pentacles", "Eight"),
    72: ("Pentacles", "Nine"),
    73: ("Pentacles", "Ten"),
    74: ("Pentacles", "Page"),
    75: ("Pentacles", "Knight"),
    76: ("Pentacles", "Queen"),
    77: ("Pentacles", "King"),
}

NUMBER_TO_COUNT = {
    "Ace": 1, "Two": 2, "Three": 3, "Four": 4, "Five": 5,
    "Six": 6, "Seven": 7, "Eight": 8, "Nine": 9, "Ten": 10,
}

COURT_POSE = {
    "Page": (
        "a single slender young human figure silhouette in pure profile "
        "view seated upright on a simple low stool at the exact center, "
        "attentively gazing upward, both hands resting calmly on their "
        "thighs. The stool is a thin horizontal gold line with two short "
        "vertical legs."
    ),
    "Knight": (
        "a single slender human figure silhouette in pure profile view "
        "seated upright on a simple low stool at the exact center, back "
        "straight and alert, both hands resting on their thighs. The stool "
        "is a thin horizontal gold line with two short vertical legs."
    ),
    "Queen": (
        "a single slender human figure silhouette in pure profile view "
        "seated upright on a simple bench at the exact center, back "
        "serene and straight, hands resting calmly on their knees. The "
        "bench is a thin horizontal gold line with two short vertical legs."
    ),
    "King": (
        "a single slender human figure silhouette in pure profile view "
        "seated upright on a simple bench at the exact center, posture "
        "fully upright and grounded, both hands resting on their knees. "
        "The bench is a thin horizontal gold line with two short vertical "
        "legs."
    ),
}


def court_emblem(suit: str, rank: str) -> tuple[str, str]:
    """Return (emblem_desc, emblem_label) for a court card — a single large
    hero suit object floating above the figure's head, with a minimalist
    rank crown indicating Page / Knight / Queen / King."""
    sym_single = SUIT_SYMBOLS[suit]
    singular = SUIT_SINGULAR[suit]
    # Court cards get a small crown-like arc above the hero object that
    # differentiates the four ranks visually.
    crown_points = {
        "Page": "a single small dot-point at its apex",
        "Knight": "two small dot-points at its upper corners",
        "Queen": "three small dot-points arranged in a gentle crown arc above it",
        "King": "four small dot-points arranged in a wider crown arc above it",
    }[rank]
    emblem_desc = (
        f"Directly above the figure's head, filling the upper portion of "
        f"the card, floats a single large dominant hero {singular}. The "
        f"{singular} is drawn as {sym_single}. It is the unmistakable "
        f"focal object of the upper half of the card — drawn in warm gold "
        f"hairline lines with a soft radial glow — with {crown_points} "
        f"floating just above it like a minimalist rank crown. This "
        f"{singular} must be rendered as a recognisable object, NOT "
        f"replaced by stars or abstract sparkles."
    )
    return emblem_desc, singular


# Build all minor entries
for card_id, (suit, number) in MINOR_ID_MAP.items():
    theme = NUMBER_THEMES[number]
    essence = minor_essence(suit, number, theme)

    if number in COURT_POSE:
        figure_desc = COURT_POSE[number]
        emblem_desc, emblem_label = court_emblem(suit, number)
    else:
        count = NUMBER_TO_COUNT[number]
        figure_desc = seated_minor_figure(suit, count)
        emblem_desc, emblem_label = n_symbols_above(suit, count)

    CARDS[card_id] = {
        "essence": essence,
        "pattern": "seated",
        "figure_desc": figure_desc,
        "emblem_desc": emblem_desc,
        "emblem_label": emblem_label,
    }


# ─────────────────────────────────────────────────────────────
# Build & save manifest
# ─────────────────────────────────────────────────────────────
def main() -> None:
    with open(MANIFEST) as f:
        manifest = json.load(f)

    # Update metadata
    meta = manifest["deck_metadata"]
    meta["width"] = 896
    meta["height"] = 1344
    meta["aesthetic"] = "COSMOS liquid-glass"
    meta["notes"] = (
        "COSMOS aesthetic: dark cosmic nebula background with a single "
        "physical tarot card as hero object, central alchemical line-art "
        "emblem in warm gold with lavender-magenta + cyan accent star "
        "points, Apple-style liquid-glass perimeter edge. 896x1344 (2:3) "
        "at flux-2-pro ~$0.03/image = ~$2.34 for the full 78-card deck. "
        "Template locked via test_cosmos_validation.py after extensive "
        "moderation debugging — see prompts.py header for details."
    )

    # Clear out the obsolete liquid-glass fields so only the new COSMOS
    # fields are authoritative. Keep id/name/arcana/suit/number metadata.
    output_dir = HERE / "output"
    for card in manifest["cards"]:
        card_id = card["id"]
        if card_id not in CARDS:
            print(f"  ⚠ card {card_id} has no sigil definition — skipping")
            continue
        entry = CARDS[card_id]
        card["card_name"] = card["card_name"]  # preserve
        card["essence"] = entry["essence"]
        new_body = build(
            entry["pattern"],
            entry["figure_desc"],
            entry["emblem_desc"],
            entry["emblem_label"],
        )
        body_changed = card.get("sigil_body") != new_body
        card["sigil_body"] = new_body
        # Remove the obsolete fields
        card.pop("card_subject", None)
        card.pop("astrological_symbology", None)

        # Preserve status for already-generated cards whose sigil_body did
        # not change AND whose output file still exists on disk. This lets
        # us iterate on build_sigils.py for individual cards without
        # wiping the rest of the deck.
        subdir = "major" if card["arcana"] == "major" else "minor"
        output_path = output_dir / subdir / card["output_filename"]
        if not body_changed and output_path.exists() and output_path.stat().st_size > 20_000:
            # keep whatever status + seed it already had
            pass
        else:
            card["status"] = "pending"
            card["seed"] = None

    with open(MANIFEST, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"✓ Updated manifest with {len([c for c in manifest['cards'] if 'sigil_body' in c])} sigil bodies.")
    print(f"  Dimensions: {meta['width']}x{meta['height']}")
    print(f"  Total cards: {len(manifest['cards'])}")


if __name__ == "__main__":
    main()
