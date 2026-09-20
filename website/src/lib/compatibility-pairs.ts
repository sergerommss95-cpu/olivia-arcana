/**
 * compatibility-pairs.ts — deterministic generator for all 144 ordered
 * sun-sign pair pages (/compatibility/[pair]).
 *
 * Everything is derived from real astrological structure, no randomness:
 *  - element pair dynamics (fire/earth/air/water, 10 unordered combos)
 *  - modality friction/harmony (cardinal/fixed/mutable, 6 combos)
 *  - ruling-planet dialogue (per-planet "voice" composed per pair)
 *  - sun-sign aspect: angular distance between the signs on the wheel
 *    (distance in signs x 30°) named as conjunction / semi-sextile /
 *    sextile / square / trine / quincunx / opposition, each with a
 *    genuine relationship interpretation.
 *
 * SCORE FORMULA (documented, deterministic):
 *   score = elementScore + modalityScore + aspectScore
 *   - elementScore (12–38): complementary pairs (Fire–Air, Earth–Water) 38;
 *     same element 34; Air–Water 20; Fire–Earth 16; Air–Earth 16;
 *     Fire–Water 12.
 *   - modalityScore (10–18): Cardinal–Fixed 18; Cardinal–Mutable 17;
 *     Mutable–Mutable 16; Fixed–Mutable 15; Cardinal–Cardinal 12;
 *     Fixed–Fixed 10.
 *   - aspectScore (10–35): trine 35; sextile 30; conjunction 26;
 *     opposition 24; semi-sextile 14; square 12; quincunx 10.
 *   Observed range across the 144 pairs: 34 (fixed squares, e.g.
 *   Leo–Scorpio) to 87 (same-element trines, e.g. Aries–Leo). The three
 *   components are the classical trio every synastry primer weighs first;
 *   the weights favor element (the daily texture of a bond) over aspect
 *   (the structural angle) over modality (the pacing).
 *
 * Sentence structure varies by (element combo, modality combo, aspect)
 * indices so the 144 pages assemble in different orders with different
 * openers — authored, not templated. Both slug orders exist
 * ("aries-and-scorpio" and "scorpio-and-aries"); the alphabetical order
 * is canonical and the other points at it via metadata canonical.
 */

// ── Sign table (zodiac order) ──

export type Element = "Fire" | "Earth" | "Air" | "Water";
export type Modality = "Cardinal" | "Fixed" | "Mutable";

export interface SignInfo {
  name: string;
  slug: string;
  glyph: string;
  element: Element;
  modality: Modality;
  ruler: string;
  rulerGlyph: string;
}

export const SIGNS: SignInfo[] = [
  { name: "Aries", slug: "aries", glyph: "♈", element: "Fire", modality: "Cardinal", ruler: "Mars", rulerGlyph: "♂" },
  { name: "Taurus", slug: "taurus", glyph: "♉", element: "Earth", modality: "Fixed", ruler: "Venus", rulerGlyph: "♀" },
  { name: "Gemini", slug: "gemini", glyph: "♊", element: "Air", modality: "Mutable", ruler: "Mercury", rulerGlyph: "☿" },
  { name: "Cancer", slug: "cancer", glyph: "♋", element: "Water", modality: "Cardinal", ruler: "the Moon", rulerGlyph: "☽" },
  { name: "Leo", slug: "leo", glyph: "♌", element: "Fire", modality: "Fixed", ruler: "the Sun", rulerGlyph: "☉" },
  { name: "Virgo", slug: "virgo", glyph: "♍", element: "Earth", modality: "Mutable", ruler: "Mercury", rulerGlyph: "☿" },
  { name: "Libra", slug: "libra", glyph: "♎", element: "Air", modality: "Cardinal", ruler: "Venus", rulerGlyph: "♀" },
  { name: "Scorpio", slug: "scorpio", glyph: "♏", element: "Water", modality: "Fixed", ruler: "Pluto", rulerGlyph: "♇" },
  { name: "Sagittarius", slug: "sagittarius", glyph: "♐", element: "Fire", modality: "Mutable", ruler: "Jupiter", rulerGlyph: "♃" },
  { name: "Capricorn", slug: "capricorn", glyph: "♑", element: "Earth", modality: "Cardinal", ruler: "Saturn", rulerGlyph: "♄" },
  { name: "Aquarius", slug: "aquarius", glyph: "♒", element: "Air", modality: "Fixed", ruler: "Uranus", rulerGlyph: "♅" },
  { name: "Pisces", slug: "pisces", glyph: "♓", element: "Water", modality: "Mutable", ruler: "Neptune", rulerGlyph: "♆" },
];

const SIGN_BY_SLUG = new Map(SIGNS.map((s) => [s.slug, s]));

// ── Element pair dynamics ──

interface ElementCombo {
  score: number;
  dynamic: string;
  love: string;
  friction: string;
  work: string;
}

function elemKey(a: Element, b: Element): string {
  return [a, b].sort().join("|");
}

const ELEMENT_COMBOS: Record<string, ElementCombo> = {
  "Fire|Fire": {
    score: 34,
    dynamic:
      "Two fires burn in the same grate. Everything here moves — plans, tempers, affection — and neither partner has to explain why speed matters, because both already live at it. The risk is not coldness but consumption: two people who accelerate each other need somewhere for the heat to go.",
    love:
      "Attraction arrives early and announces itself. Courtship between two fire signs looks like competition from the outside and feels like recognition from the inside. Grand gestures are native currency here — and so is jealousy the moment attention drifts.",
    friction:
      "Both want the last word and the first move. Arguments ignite fast, burn hot, and end abruptly; the danger is scorched ground neither will walk back over.",
    work:
      "Keep separate arenas. Two fires each need their own fuel — distinct projects, distinct victories — so that admiration replaces rivalry. Decide early who leads in which room, and honor it.",
  },
  "Earth|Earth": {
    score: 34,
    dynamic:
      "Two earth signs build. The relationship acquires furniture, routines, savings, a garden — evidence. Trust accrues the way soil does, slowly and by deposit. What it lacks in spark it repays in permanence; the open question is whether either partner remembers to open a window.",
    love:
      "Affection is proven, not performed: the repaired hinge, the packed lunch, the arrival exactly on time. Sensuality runs deep in this pairing — earth signs love with their hands and their calendars.",
    friction:
      "Stubbornness meets stubbornness. Disputes calcify into silences, since both would rather outlast than concede, and comfort can quietly harden into inertia.",
    work:
      "Schedule disruption on purpose — book the trip neither of you would book alone. When you deadlock, trade concessions in kind: a practical exchange both ledgers can accept.",
  },
  "Air|Air": {
    score: 34,
    dynamic:
      "Two air signs talk. The relationship is conducted out loud — theories, jokes, plans for cities neither has visited. Mental rapport is instant and durable, and the architecture is all conversation. What the pairing must learn is that a feeling is not a debate topic, and some weather cannot be reasoned with.",
    love:
      "Seduction is verbal. The best evenings end at two in the morning, mid-sentence. Romance stays light on its feet — freedom granted freely, little appetite for possession.",
    friction:
      "When conflict comes, both go abstract — analysing the argument instead of having it. Feelings get discussed rather than felt, and drift, not rupture, is the real threat.",
    work:
      "Anchor the words in bodies and dates. Walk while you argue; put the plans on a calendar, not a whiteboard. Once a week, ask what the other feels — and refuse the first clever answer.",
  },
  "Water|Water": {
    score: 34,
    dynamic:
      "Two water signs read each other without subtitles. Moods travel between them like weather over a bay; comfort is total and privacy is shared. The gift is depth — the hazard is that the tide moves both boats at once, and nobody is left standing on shore.",
    love:
      "Intimacy here is the point, not the reward. Both remember anniversaries of feelings, not just dates. Love runs loyal, enveloping, and jealous of its own depths.",
    friction:
      "Hurt is absorbed rather than voiced, and surfaces weeks later with interest. Two feelers can drown in each other's undertow while keeping score in silence.",
    work:
      "Name feelings while they are still small. One of you must play lighthouse when the other is at sea — take turns deliberately, and keep one friendship each that lives entirely on dry land.",
  },
  "Air|Fire": {
    score: 38,
    dynamic:
      "Air feeds fire, and fire gives air something worth circling. Ideas become expeditions in this pairing: one partner supplies the spark, the other the oxygen of possibility. It is the zodiac's most naturally kinetic combination — light, fast, mutually enlarging — provided somebody occasionally lands the balloon.",
    love:
      "Flirtation never fully retires; you will still be amusing each other in year twenty. Passion stays playful rather than heavy, and each partner guards the other's independence as if it were their own.",
    friction:
      "Neither is native to follow-through. Enthusiasm shared is doubled — but so is the pile of half-finished plans, and quarrels turn theatrical when both perform for an audience.",
    work:
      "Finish one thing before starting three. Assign the practical dossier — money, logistics — to fixed days rather than moods. This bond runs on delight; feed it novelty on schedule.",
  },
  "Earth|Water": {
    score: 38,
    dynamic:
      "Earth gives water a bed to run in; water keeps earth alive. This is the zodiac's gardening pair — one holds the structure, the other supplies the feeling, and each is visibly better tended in the other's company. Growth is slow, organic, and difficult to uproot.",
    love:
      "Devotion compounds quietly. Water reads the unspoken; earth proves the promises. Between them, affection takes physical form — the home itself becomes the love letter.",
    friction:
      "Earth can mistake feeling for weather and simply wait it out; water can mistake steadiness for indifference. Mud happens — emotion bogged in practicality, practicality soaked in mood.",
    work:
      "Earth must ask about feelings before they flood; water must say plainly what a gesture meant. Keep the rituals — the Sunday walk, the anniversary table. They are load-bearing.",
  },
  "Earth|Fire": {
    score: 16,
    dynamic:
      "Fire wants the summit today; earth wants the mountain surveyed first. This pairing runs on friction that can either forge or fray: fire brings the urgency earth secretly needs, earth brings the ballast fire privately craves. Respect converts the difference into propulsion; impatience converts it into grinding.",
    love:
      "Attraction is real and slightly bewildered — each is drawn to precisely what they would never do. Fire courts with spectacle, earth with substance, and both must learn to receive the other's currency.",
    friction:
      "Tempo is the battleground. Fire reads caution as doubt; earth reads speed as recklessness. Spending, risk, and holidays become proxy wars.",
    work:
      "Split the itinerary: fire chooses the destination, earth builds the road. Agree on a risk budget — a sum, a timeframe — inside which fire plays freely and beyond which earth's veto stands.",
  },
  "Air|Water": {
    score: 20,
    dynamic:
      "Air approaches life as a text to be read; water, as a current to be felt. Together they hold the full instrument — analysis and intuition — but the handoff is delicate: what air names, water has already sensed, and each quietly suspects the other's method of missing the point.",
    love:
      "The courtship fascinates — air is drawn to water's depths, water to air's light. Love deepens once air learns that listening is not solving, and water learns that questions are a form of care.",
    friction:
      "Air's candor lands as coldness; water's silence lands as accusation. One wants to talk it through at once, the other needs to feel it through first.",
    work:
      "Agree on a delay: feelings first, forensics after — a day between the wound and the debrief. Air should write less and hold more; water should say one true sentence early instead of ten late.",
  },
  "Air|Earth": {
    score: 16,
    dynamic:
      "Earth asks what a plan costs; air asks what it could become. This is the surveyor and the kite — capable of extraordinary building when the string holds, and of mutual exasperation when it does not. The pairing matures late and rewards patience.",
    love:
      "Affection grows from proven usefulness into genuine delight. Earth steadies air's scattered brilliance; air airs out earth's settled rooms. It is rarely love at first sight and often love at fifth.",
    friction:
      "Earth hears air's speculation as noise; air hears earth's caution as a locked door. Boredom and restlessness are the twin saboteurs.",
    work:
      "Put the dreams through the workshop together: one wild idea a month, properly costed. Earth commits to trying before pricing; air commits to finishing before proposing.",
  },
  "Fire|Water": {
    score: 12,
    dynamic:
      "Steam, or extinguished coals — this pairing produces one or the other, rarely anything lukewarm. Fire acts outward, water feels inward, and each holds exactly the power to undo the other. That is why the attraction is real, and why the handling instructions matter more here than in any other match.",
    love:
      "Intensity is guaranteed. Water is drawn to fire's certainty, fire to water's mystery, and both discover the other cannot be conquered — only understood. Passion here has tides and flare-ups alike.",
    friction:
      "Fire's bluntness scalds; water's moods smother. A raised voice meets a closed door, and neither fights fair by the other's rules — because the rules were never compared.",
    work:
      "Compare the rules. Fire must learn that retreat is not defeat; water must learn that heat is not hatred. Institute a signal — a word, a raised hand — that pauses any fight before the element takes over.",
  },
};

const ELEMENT_KEYS = Object.keys(ELEMENT_COMBOS).sort();

// ── Modality combos ──

interface ModalityCombo {
  score: number;
  note: string;
  friction: string;
  work: string;
}

function modKey(a: Modality, b: Modality): string {
  return [a, b].sort().join("|");
}

const MODALITY_COMBOS: Record<string, ModalityCombo> = {
  "Cardinal|Cardinal": {
    score: 12,
    note:
      "Two initiators share this chart: both open doors, and neither much likes following through someone else's. Leadership is the recurring negotiation.",
    friction:
      "Both steer. Every joint decision becomes a small summit between heads of state, and stalemates come from competing directions, not absent will.",
    work:
      "Divide the kingdom explicitly — domains where each rules unquestioned — and rotate the lead on anything genuinely shared.",
  },
  "Fixed|Fixed": {
    score: 10,
    note:
      "Two fixed signs give this bond its granite: once committed, neither drifts. The same grip that holds the bond also holds every position taken inside it.",
    friction:
      "Neither yields first. Disagreements do not escalate so much as fossilize, each partner waiting the other out with geological patience.",
    work:
      "Adopt a rule of exchanged concessions — nobody yields unilaterally, both yield simultaneously — and revisit fossilized disputes annually, not daily.",
  },
  "Mutable|Mutable": {
    score: 16,
    note:
      "Two mutable signs bend without breaking — plans change, roles swap, and neither minds. Adaptability is doubled; so is the absence of anyone holding the map.",
    friction:
      "Nothing is ever quite decided. Commitments stay soft, exits stay open, and the relationship can drift for years on amiable postponement.",
    work:
      "Borrow structure from outside: standing dates, written plans, a shared calendar treated as law. Decide small things instantly, as practice for the large ones.",
  },
  "Cardinal|Fixed": {
    score: 18,
    note:
      "One initiates, the other sustains — the zodiac's project team. Cardinal starts what fixed finishes, and the division of labor, once respected, is formidable.",
    friction:
      "Cardinal grows restless with fixed's pace; fixed grows weary of cardinal's next new thing arriving before the last one settled.",
    work:
      "Let cardinal launch and fixed steward — and honor the handoff. New ventures need the fixed partner's sign-off; standing arrangements need the cardinal partner's refresh.",
  },
  "Cardinal|Mutable": {
    score: 17,
    note:
      "Cardinal sets the course; mutable trims the sails. Direction and adaptation cooperate naturally here — one provides the where, the other the how.",
    friction:
      "Cardinal can bulldoze, mistaking mutable's flexibility for agreement; mutable can slip sideways, agreeing aloud and rerouting quietly.",
    work:
      "The mutable partner must state objections at the table, not after it; the cardinal partner must ask twice before assuming consent. Check the shared course monthly.",
  },
  "Fixed|Mutable": {
    score: 15,
    note:
      "Fixed holds the center while mutable ranges — an anchor and a sail. The bond gets stability and freshness at once, so long as each values the other's function.",
    friction:
      "Fixed reads mutable's variability as unreliability; mutable reads fixed's constancy as confinement. Each is tempted to police the other's nature.",
    work:
      "Fix the foundations and free the surfaces: unmovable agreements on the few things that matter, full flexibility everywhere else — and name, out loud, which is which.",
  },
};

const MODALITY_KEYS = Object.keys(MODALITY_COMBOS).sort();

// ── Sun-sign aspects (by distance in signs, 0–6) ──

interface AspectDef {
  name: string;
  angle: number;
  score: number;
  overall: string;
  friction: string;
  advice: string;
  short: string;
}

const ASPECTS: AspectDef[] = [
  {
    name: "Conjunction",
    angle: 0,
    score: 26,
    overall:
      "Same sign, same season: your suns sit conjunct. You share one operating manual — identical instincts, identical blind spots. Understanding is immediate; perspective is what is missing, since every strength arrives doubled and unchaperoned.",
    friction:
      "Your faults synchronize. Whatever this sign overdoes, the household now overdoes in stereo, with no in-house dissent.",
    advice:
      "Import outside perspective on purpose — friends, counsel, anything that is not this sign — because the chart will not supply it from within.",
    short: "the conjunction gives instant recognition and doubled blind spots",
  },
  {
    name: "Semi-sextile",
    angle: 30,
    score: 14,
    overall:
      "Neighboring signs form the semi-sextile — adjacent chapters of one story that share a border but no terrain. Element, modality, and ruler all differ; nothing is handed to you, and every understanding is built by hand.",
    friction:
      "You lack a common shorthand. Misreadings are structural, not personal — the two of you were drafted by different committees.",
    advice:
      "Treat every assumption as unchecked: ask, do not infer. What neighbors lack in common ground they can replace with shared history.",
    short: "the semi-sextile means everything shared is built, not given",
  },
  {
    name: "Sextile",
    angle: 60,
    score: 30,
    overall:
      "Two signs apart, your suns form a sextile — the aspect of easy opportunity. The elements cooperate, conversation costs nothing, and friendship underwrites whatever else develops.",
    friction:
      "The sextile's ease is real but unforced — it opens the door without pushing anyone through. Neglect is the only enemy: this bond fails by coasting, not by combustion.",
    advice:
      "Put effort where the aspect gives ease — plan, initiate, invest — because the sextile rewards whatever you actually start.",
    short: "the sextile keeps friendship underneath the romance",
  },
  {
    name: "Square",
    angle: 90,
    score: 12,
    overall:
      "Three signs apart, your suns square each other — the aspect of productive friction. You share a modality but not an element: the same will, aimed differently. Squares generate more energy than any soft aspect; the only question is where it gets spent.",
    friction:
      "The square guarantees recurring collision on the same few themes. Fought blindly, it exhausts; fought consciously, it forges.",
    advice:
      "Pick the recurring fight and give it rules; a square spent on a shared project becomes horsepower instead of heat.",
    short: "the square supplies friction that can forge or fray",
  },
  {
    name: "Trine",
    angle: 120,
    score: 35,
    overall:
      "Four signs apart, your suns trine each other from the same element — the zodiac's aspect of native ease. You run on the same fuel at different octaves, and rapport feels less like achievement than like memory.",
    friction:
      "The trine's danger is its comfort: nothing demands growth, and ease can quietly become laziness about each other.",
    advice:
      "Set challenges on purpose — travel, projects, stakes — so that ease remains a gift and never becomes a sedative.",
    short: "the trine makes rapport feel like memory",
  },
  {
    name: "Quincunx",
    angle: 150,
    score: 10,
    overall:
      "Five signs apart, your suns form a quincunx — the aspect of perpetual adjustment. No shared element, no shared modality, no shared angle of approach: this relationship runs on deliberate translation, and the fit is engineered rather than found.",
    friction:
      "Just when a rhythm settles, it needs recalibrating. The quincunx never resolves; it is maintained, like a bridge.",
    advice:
      "Make standing maintenance the covenant: a weekly recalibration of plans and moods, kept as faithfully as any anniversary.",
    short: "the quincunx demands constant, conscious adjustment",
  },
  {
    name: "Opposition",
    angle: 180,
    score: 24,
    overall:
      "Face to face across the wheel, your suns stand in opposition — the aspect of the mirror. You occupy complementary elements and the same modality: each holds precisely what the other set down, and the pull of that is considerable.",
    friction:
      "Polarity swings between fascination and tug-of-war. What you admire across the axis is also what you argue with.",
    advice:
      "Use the axis: divide roles by pole, trade ends of it regularly, and treat the middle as meeting ground rather than battleground.",
    short: "the opposition pairs magnetic attraction with tug-of-war",
  },
];

// ── Ruling-planet dialogue ──

const PLANET_VOICE: Record<string, { voice: string; noun: string }> = {
  "the Sun": { voice: "keeps its own center and warms whatever orbits it", noun: "radiance" },
  "the Moon": { voice: "moves by tide and forgets nothing", noun: "memory" },
  Mercury: { voice: "asks, counts, and keeps the correspondence", noun: "commentary" },
  Venus: { voice: "chooses pleasure, beauty, and the well-set table", noun: "invitation" },
  Mars: { voice: "acts first and files the report later", noun: "momentum" },
  Jupiter: { voice: "enlarges whatever it is given", noun: "appetite" },
  Saturn: { voice: "builds slowly and expects the wall to bear weight", noun: "ledger" },
  Uranus: { voice: "breaks the pattern on principle", noun: "lightning" },
  Neptune: { voice: "blurs the edges and hears what is unsaid", noun: "fog" },
  Pluto: { voice: "holds the deep levers and does not bargain", noun: "gravity" },
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function rulerDialogue(a: SignInfo, b: SignInfo): string {
  const va = PLANET_VOICE[a.ruler];
  const vb = PLANET_VOICE[b.ruler];
  if (a.slug === b.slug) {
    return `Both of you answer to ${a.ruler}, which ${va.voice}. The planet is doubled here — patron and mirror at once — so its lesson must be learned twice or not at all.`;
  }
  if (a.ruler === b.ruler) {
    return `Both signs answer to ${a.ruler}, which ${va.voice} — one planet working through ${a.element.toLowerCase()} and ${b.element.toLowerCase()}, a shared language spoken in two accents.`;
  }
  return `${a.name} answers to ${a.ruler}, which ${va.voice}; ${b.name} is ruled by ${b.ruler}, which ${vb.voice}. The negotiation between them — ${a.ruler}'s ${va.noun} against ${b.ruler}'s ${vb.noun} — is the engine room of this match.`;
}

// ── Assembly ──

export interface CompatPair {
  slug: string;
  canonicalSlug: string;
  isCanonical: boolean;
  a: SignInfo;
  b: SignInfo;
  score: number;
  aspect: { name: string; angle: number };
  sections: { overall: string; love: string; friction: string; work: string };
  faq: { q: string; a: string }[];
  metaDescription: string;
}

const WORK_CLOSINGS = [
  "None of this is fate — it is terrain. Two people who know the map walk it better than two who merely feel strongly about it.",
  "The sky offers the conditions; the two of you write the treaty.",
  "Compatibility is not found, it is kept — and this pairing repays the keeping.",
];

function firstSentence(text: string): string {
  const i = text.indexOf(". ");
  return i === -1 ? text : text.slice(0, i + 1);
}

function signDistance(a: SignInfo, b: SignInfo): number {
  const ia = SIGNS.findIndex((s) => s.slug === a.slug);
  const ib = SIGNS.findIndex((s) => s.slug === b.slug);
  const d = Math.abs(ia - ib) % 12;
  return d > 6 ? 12 - d : d;
}

export function pairScore(a: SignInfo, b: SignInfo): number {
  const elem = ELEMENT_COMBOS[elemKey(a.element, b.element)];
  const mod = MODALITY_COMBOS[modKey(a.modality, b.modality)];
  const asp = ASPECTS[signDistance(a, b)];
  return elem.score + mod.score + asp.score;
}

function scoreBand(score: number): string {
  if (score >= 75) return "one of the zodiac's natural alliances";
  if (score >= 60) return "a strong match with workable seams";
  if (score >= 45) return "a mixed aspect — real chemistry, real work";
  return "a demanding match that pays only the committed";
}

export function pairSlug(aSlug: string, bSlug: string): string {
  return `${aSlug}-and-${bSlug}`;
}

export function getAllPairSlugs(): string[] {
  const slugs: string[] = [];
  for (const a of SIGNS) {
    for (const b of SIGNS) {
      slugs.push(pairSlug(a.slug, b.slug));
    }
  }
  return slugs;
}

export function getPair(slug: string): CompatPair | null {
  const parts = slug.split("-and-");
  if (parts.length !== 2) return null;
  const a = SIGN_BY_SLUG.get(parts[0]);
  const b = SIGN_BY_SLUG.get(parts[1]);
  if (!a || !b) return null;

  const eKey = elemKey(a.element, b.element);
  const mKey = modKey(a.modality, b.modality);
  const elem = ELEMENT_COMBOS[eKey];
  const mod = MODALITY_COMBOS[mKey];
  const dist = signDistance(a, b);
  const asp = ASPECTS[dist];
  const score = elem.score + mod.score + asp.score;
  const ruler = rulerDialogue(a, b);

  // Deterministic variant selection — keyed off the structural combos so
  // the 144 pages assemble their sentences in different orders.
  const eIdx = ELEMENT_KEYS.indexOf(eKey);
  const mIdx = MODALITY_KEYS.indexOf(mKey);
  const overallV = (eIdx + mIdx + dist) % 3;
  const loveV = (eIdx * 2 + dist) % 3;
  const frictionV = (mIdx + dist * 2) % 3;
  const workV = (eIdx + mIdx * 2) % 2;
  const closing = WORK_CLOSINGS[(dist + eIdx) % 3];

  const scoreLine = `On the almanac's scale, ${a.name} and ${b.name} land at ${score} of 100 — ${scoreBand(score)}.`;

  const overall =
    overallV === 0
      ? `${asp.overall} ${elem.dynamic} ${mod.note} ${scoreLine}`
      : overallV === 1
        ? `${scoreLine} ${elem.dynamic} ${asp.overall} ${mod.note}`
        : `${mod.note} ${elem.dynamic} ${asp.overall} ${scoreLine}`;

  const sunToSun = `Sun to sun, ${asp.short}.`;

  const love =
    loveV === 0
      ? `${ruler} ${elem.love} ${sunToSun}`
      : loveV === 1
        ? `${elem.love} ${sunToSun} ${ruler}`
        : `In love, the planets speak before the people do. ${ruler} ${elem.love} ${sunToSun}`;

  const friction =
    frictionV === 0
      ? `${elem.friction} ${mod.friction} ${asp.friction}`
      : frictionV === 1
        ? `${mod.friction} ${asp.friction} ${elem.friction}`
        : `${asp.friction} ${elem.friction} ${mod.friction}`;

  const work =
    workV === 0
      ? `${elem.work} ${mod.work} ${asp.advice} ${closing}`
      : `${mod.work} ${asp.advice} ${elem.work} ${closing}`;

  const canonicalSlug =
    a.slug <= b.slug ? pairSlug(a.slug, b.slug) : pairSlug(b.slug, a.slug);

  const faq = [
    {
      q: `Are ${a.name} and ${b.name} compatible?`,
      a: `In sun-sign terms they score ${score}% — ${scoreBand(score)}. ${firstSentence(elem.dynamic)}`,
    },
    {
      q: `Are ${a.name} and ${b.name} a good match in love?`,
      a: `${firstSentence(elem.love)} Between their suns, ${asp.short}.`,
    },
    {
      q: `What is the hardest part of a ${a.name}–${b.name} relationship?`,
      a: `${firstSentence(elem.friction)} ${firstSentence(mod.friction)}`,
    },
  ];

  // Meta description: base + tail, tail dropped rather than truncated mid-word.
  const metaBase = `${a.name} and ${b.name} compatibility: ${score}%. ${cap(firstSentence(elem.dynamic))}`;
  const metaTail = " Love, friction points, and how to make it work.";
  const metaDescription =
    metaBase.length + metaTail.length <= 158
      ? metaBase + metaTail
      : metaBase.length <= 158
        ? metaBase
        : metaBase.slice(0, metaBase.lastIndexOf(" ", 155)) + "…";

  return {
    slug,
    canonicalSlug,
    isCanonical: slug === canonicalSlug,
    a,
    b,
    score,
    aspect: { name: asp.name, angle: asp.angle },
    sections: { overall, love, friction, work },
    faq,
    metaDescription,
  };
}
