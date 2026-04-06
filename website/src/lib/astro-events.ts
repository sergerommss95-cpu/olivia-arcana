/**
 * astro-events.ts — Upcoming astrological events database
 *
 * Major events for 2026 with dates, descriptions, and per-sign impacts.
 * Includes: eclipses, retrogrades, sign ingresses, full/new moons,
 * grand aspects, and seasonal turning points.
 */

export type EventType =
  | "eclipse_solar"
  | "eclipse_lunar"
  | "retrograde_start"
  | "retrograde_end"
  | "new_moon"
  | "full_moon"
  | "ingress"
  | "grand_aspect"
  | "equinox"
  | "solstice";

export interface AstroEvent {
  date: string;          // YYYY-MM-DD
  type: EventType;
  title: string;
  description: string;
  planet?: string;
  sign?: string;
  signGlyph?: string;
  intensity: 1 | 2 | 3; // 1=minor, 2=notable, 3=major
  impacts: Record<string, string>; // sign name → personal impact
}

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

// ── 2026 Astrological Events ──
export const EVENTS_2026: AstroEvent[] = [
  // ── ECLIPSES ──
  {
    date: "2026-02-17",
    type: "eclipse_solar",
    title: "Annular Solar Eclipse in Aquarius",
    description: "A ring of fire eclipse at 28° Aquarius. Powerful portal for innovation, community transformation, and breaking free from outdated structures. Seeds planted now manifest over 6 months.",
    sign: "Aquarius", signGlyph: "♒", intensity: 3,
    impacts: {
      Aries: "Your social networks undergo radical transformation. A group connection becomes pivotal.",
      Taurus: "Career breakthroughs come through unconventional paths. Your public image shifts.",
      Gemini: "Higher learning or travel opens unexpected doors. Expand your philosophical horizons.",
      Cancer: "Shared resources and intimacy transform. A financial partnership restructures.",
      Leo: "Relationships hit a turning point. Partnerships evolve or release to make room for aligned connections.",
      Virgo: "Work routines and health habits undergo revolutionary change. Embrace new systems.",
      Libra: "Creative and romantic energy surges. Children or artistic projects reach a milestone.",
      Scorpio: "Home and family dynamics shift dramatically. Inner foundations restructure.",
      Sagittarius: "Communication style transforms. A sibling or neighbor connection becomes significant.",
      Capricorn: "Values and finances realign with your authentic self. Material security evolves.",
      Aquarius: "Personal identity rebirth. You are becoming someone new — embrace it fully.",
      Pisces: "Subconscious patterns surface for healing. Dreams carry profound messages.",
    },
  },
  {
    date: "2026-03-03",
    type: "eclipse_lunar",
    title: "Total Lunar Eclipse in Virgo",
    description: "A total lunar eclipse at 12° Virgo brings culmination to health, work, and service themes. What you've been perfecting reaches a turning point. Release perfectionism and trust the process.",
    sign: "Virgo", signGlyph: "♍", intensity: 3,
    impacts: {
      Aries: "Health revelations demand attention. A work project completes or transforms.",
      Taurus: "Creative works reach fruition. Romance or children bring emotional breakthroughs.",
      Gemini: "Home and family matters culminate. A domestic situation resolves.",
      Cancer: "Important conversations deliver clarity. A sibling or local connection shifts.",
      Leo: "Financial matters reach a peak. Your value system undergoes refinement.",
      Virgo: "Personal transformation peaks. You see yourself with new clarity — own it.",
      Libra: "Hidden patterns emerge for healing. Spiritual insights accelerate growth.",
      Scorpio: "Community and friendships evolve. A social aspiration manifests.",
      Sagittarius: "Career achievements culminate. Public recognition arrives unexpectedly.",
      Capricorn: "Philosophical or educational journey reaches a milestone. Beliefs evolve.",
      Aquarius: "Shared finances or intimate bonds transform. Power dynamics rebalance.",
      Pisces: "Partnership clarity arrives. A relationship reveals its true nature.",
    },
  },
  {
    date: "2026-08-12",
    type: "eclipse_solar",
    title: "Total Solar Eclipse in Leo",
    description: "A dramatic total solar eclipse at 19° Leo ignites creative fire, self-expression, and courage. This is the cosmos giving you permission to shine. New beginnings in leadership, romance, and artistic vision.",
    sign: "Leo", signGlyph: "♌", intensity: 3,
    impacts: {
      Aries: "Creative and romantic energy explodes. Take the stage in whatever form calls you.",
      Taurus: "Home and family receive a powerful new beginning. Domestic transformation.",
      Gemini: "Communication becomes your superpower. Write, speak, teach — your voice carries.",
      Cancer: "Financial new beginnings. A new income stream or value shift emerges.",
      Leo: "Total personal rebirth. You are being reborn — step into your power fearlessly.",
      Virgo: "Spiritual awakening intensifies. The unseen world communicates clearly.",
      Libra: "Social life transforms. New community, new friends, new aspirations.",
      Scorpio: "Career ignites with new purpose. A leadership opportunity materializes.",
      Sagittarius: "Adventure calls loudly. Travel, education, or publishing opens new horizons.",
      Capricorn: "Shared resources transform. Inheritance, investments, or intimate bonds restructure.",
      Aquarius: "Relationships enter a powerful new chapter. Partnerships forge or reforge.",
      Pisces: "Work and health routines receive fresh energy. Service to others becomes fulfilling.",
    },
  },
  {
    date: "2026-08-28",
    type: "eclipse_lunar",
    title: "Partial Lunar Eclipse in Pisces",
    description: "At 4° Pisces, this eclipse illuminates intuition, compassion, and spiritual connection. Emotional truths that have been submerged rise to the surface for integration.",
    sign: "Pisces", signGlyph: "♓", intensity: 2,
    impacts: {
      Aries: "Subconscious revelations. Dreams and intuition speak louder than logic.",
      Taurus: "Social connections reveal their depth. A friendship becomes spiritually significant.",
      Gemini: "Career direction clarifies through intuitive knowing, not analysis.",
      Cancer: "Beliefs and philosophy reach emotional culmination. Faith deepens.",
      Leo: "Shared resources and intimacy bring emotional breakthroughs.",
      Virgo: "Partnership truths surface. A relationship shows you what you need to see.",
      Libra: "Health and daily routines align with spiritual practice.",
      Scorpio: "Creative and romantic feelings reach a peak. Express what you've been holding.",
      Sagittarius: "Home and family emotions culminate. Ancestral patterns heal.",
      Capricorn: "Important conversations deliver emotional clarity.",
      Aquarius: "Values and self-worth reach emotional peak. You know what you deserve.",
      Pisces: "Personal emotional tsunami. This is YOUR eclipse — feel everything, release everything.",
    },
  },

  // ── RETROGRADES ──
  {
    date: "2026-01-26",
    type: "retrograde_start",
    title: "Mercury Retrograde in Aquarius",
    description: "Mercury stations retrograde at 21° Aquarius. Technology glitches, miscommunications, and reconnections with the past. Review group commitments and digital systems.",
    planet: "Mercury", sign: "Aquarius", signGlyph: "♒", intensity: 2,
    impacts: {
      Aries: "Friendships and group projects hit review mode. Old allies resurface.",
      Taurus: "Career communications need careful handling. Double-check public statements.",
      Gemini: "Travel and education plans need revision. Revisit a philosophical question.",
      Cancer: "Financial paperwork and shared resources need review. Read the fine print.",
      Leo: "Relationship communication tangles. An ex or old partner may reappear.",
      Virgo: "Health appointments and work systems need updating. Backup your data.",
      Libra: "Creative projects stall for necessary revision. A romantic conversation replays.",
      Scorpio: "Home tech and family communication needs attention. Fix what's been ignored.",
      Sagittarius: "Local travel disruptions. Sibling or neighbor miscommunications increase.",
      Capricorn: "Financial communications need extra care. Review subscriptions and contracts.",
      Aquarius: "Personal identity and self-expression need recalibration. Who are you becoming?",
      Pisces: "Inner dialogue intensifies. Meditation and journaling reveal important insights.",
    },
  },
  {
    date: "2026-02-16",
    type: "retrograde_end",
    title: "Mercury Direct in Aquarius",
    description: "Mercury stations direct. Communications clear, technology stabilizes, and delayed plans move forward. Implement the insights gained during the retrograde period.",
    planet: "Mercury", sign: "Aquarius", signGlyph: "♒", intensity: 1,
    impacts: Object.fromEntries(SIGN_NAMES.map(s => [s, "Forward momentum returns. Act on the clarity gained during the review period."])),
  },
  {
    date: "2026-05-22",
    type: "retrograde_start",
    title: "Mercury Retrograde in Gemini",
    description: "Mercury retrogrades in its home sign at 17° Gemini. Powerful for reassessing how you think, learn, and communicate. Writing and speaking projects benefit from revision.",
    planet: "Mercury", sign: "Gemini", signGlyph: "♊", intensity: 2,
    impacts: {
      Aries: "Short trips and sibling connections need revisiting. A message from the past arrives.",
      Taurus: "Financial decisions need more data. Delay major purchases if possible.",
      Gemini: "Personal communication style undergoes deep review. You're refining your voice.",
      Cancer: "Subconscious patterns in your thinking surface. Dreams become more vivid.",
      Leo: "Social media and group communications need attention. Review your network.",
      Virgo: "Career communications require extra precision. Proofread everything twice.",
      Libra: "Educational or travel plans shift. A philosophical insight returns for integration.",
      Scorpio: "Shared resource agreements need careful review. Update beneficiary information.",
      Sagittarius: "Relationship conversations replay. Listen to what you missed the first time.",
      Capricorn: "Health information and work processes need updating. Revisit a diagnosis or routine.",
      Aquarius: "Creative ideas from the past resurface with new potential. Revisit abandoned projects.",
      Pisces: "Home communications and family plans need revision. A household issue resurfaces.",
    },
  },
  {
    date: "2026-06-14",
    type: "retrograde_end",
    title: "Mercury Direct in Gemini",
    description: "Mercury stations direct in Gemini. Mental clarity returns with force. Conversations that stalled now flow. Act on revised plans.",
    planet: "Mercury", sign: "Gemini", signGlyph: "♊", intensity: 1,
    impacts: Object.fromEntries(SIGN_NAMES.map(s => [s, "Mental clarity returns. The revisions you made now prove their value."])),
  },
  {
    date: "2026-09-17",
    type: "retrograde_start",
    title: "Mercury Retrograde in Libra",
    description: "Mercury retrogrades at 12° Libra. Relationships, contracts, and agreements need review. Balance and fairness are the themes. Avoid signing important documents.",
    planet: "Mercury", sign: "Libra", signGlyph: "♎", intensity: 2,
    impacts: {
      Aries: "Partnership agreements need careful review. An ex-partner may reappear.",
      Taurus: "Health appointments and daily routines need rescheduling. Double-check prescriptions.",
      Gemini: "Creative projects and romantic communications tangle. Revise, don't abandon.",
      Cancer: "Home and family communications need patience. Real estate deals stall.",
      Leo: "Neighborhood and sibling connections revisited. Local travel disrupted.",
      Virgo: "Financial communications and contracts need extra scrutiny.",
      Libra: "Personal identity and self-expression need recalibration. Who do you want to be?",
      Scorpio: "Subconscious patterns emerge. Therapy and inner work are highly productive.",
      Sagittarius: "Social network communications need review. Group commitments reassessed.",
      Capricorn: "Career communications require diplomatic precision. Public image needs care.",
      Aquarius: "Travel and educational plans shift. A legal or philosophical matter revisited.",
      Pisces: "Shared financial communications need attention. Insurance and debt reviewed.",
    },
  },

  // ── SIGN INGRESSES ──
  {
    date: "2026-03-20",
    type: "equinox",
    title: "Spring Equinox — Sun Enters Aries",
    description: "The astrological new year begins as the Sun crosses into Aries at the vernal equinox. Fresh starts, new initiatives, and pioneering energy flood every area of life. Plant seeds of intention.",
    sign: "Aries", signGlyph: "♈", intensity: 2,
    impacts: {
      Aries: "Your personal new year. Set powerful intentions — the cosmos amplifies your vision.",
      Taurus: "Spiritual and subconscious realms activate. Retreat to recharge before your season.",
      Gemini: "Social aspirations ignite. Community connections spark new opportunities.",
      Cancer: "Career ambitions surge. Take initiative in your professional life.",
      Leo: "Adventure and expansion call. Book that trip, start that course.",
      Virgo: "Transformation and shared resources energize. Dive deep.",
      Libra: "Relationships charge with new energy. Partnerships evolve.",
      Scorpio: "Health and work routines receive fresh motivation. Optimize.",
      Sagittarius: "Creative and romantic fire ignites. Express yourself boldly.",
      Capricorn: "Home and family receive fresh energy. Domestic new beginnings.",
      Aquarius: "Communication energizes. Start writing, speaking, teaching.",
      Pisces: "Finances and values receive fresh perspective. What truly matters?",
    },
  },
  {
    date: "2026-06-21",
    type: "solstice",
    title: "Summer Solstice — Sun Enters Cancer",
    description: "The longest day marks the Sun's entry into Cancer. Emotional depth, nurturing energy, and home-centered focus dominate. Honor your roots and create sanctuary.",
    sign: "Cancer", signGlyph: "♋", intensity: 2,
    impacts: Object.fromEntries(SIGN_NAMES.map(s => [s, "Emotional and nurturing energy peaks. Create space for family, home, and inner security."])),
  },
  {
    date: "2026-09-22",
    type: "equinox",
    title: "Autumn Equinox — Sun Enters Libra",
    description: "Balance returns as day and night equalize. Relationships, fairness, and aesthetic beauty take center stage. Seek harmony in all areas.",
    sign: "Libra", signGlyph: "♎", intensity: 2,
    impacts: Object.fromEntries(SIGN_NAMES.map(s => [s, "Seek balance. Relationships, partnerships, and aesthetic pursuits are highlighted."])),
  },
  {
    date: "2026-12-21",
    type: "solstice",
    title: "Winter Solstice — Sun Enters Capricorn",
    description: "The shortest day turns the wheel toward ambition, structure, and long-term planning. Set foundations for the year ahead.",
    sign: "Capricorn", signGlyph: "♑", intensity: 2,
    impacts: Object.fromEntries(SIGN_NAMES.map(s => [s, "Structure and discipline lead to mastery. Build foundations that last."])),
  },

  // ── NOTABLE NEW/FULL MOONS ──
  {
    date: "2026-04-17",
    type: "new_moon",
    title: "New Moon in Aries",
    description: "A fiery new beginning at 27° Aries. Set bold intentions, start new projects, and assert your independence. The warrior energy is strong.",
    sign: "Aries", signGlyph: "♈", intensity: 1,
    impacts: {
      Aries: "Your most powerful manifestation window of the year. Dream big and act bigger.",
      Taurus: "Plant seeds in your spiritual practice. Solitude is productive.",
      Gemini: "New social connections form. A group aspiration takes shape.",
      Cancer: "Career initiative pays off. Take the lead on a professional goal.",
      Leo: "Educational or travel opportunity emerges. Expand your horizons.",
      Virgo: "Shared financial new beginning. Investments or intimate bonds deepen.",
      Libra: "Partnership new beginning. A relationship evolves to the next level.",
      Scorpio: "Health and work breakthrough. New routine, new vitality.",
      Sagittarius: "Creative spark ignites. Romance or artistic expression flourishes.",
      Capricorn: "Home improvements or family new beginnings. Nest and nurture.",
      Aquarius: "Communication breakthrough. A conversation or project launches.",
      Pisces: "Financial clarity. New income stream or value alignment.",
    },
  },
  {
    date: "2026-05-01",
    type: "full_moon",
    title: "Full Moon in Scorpio",
    description: "Intense full moon at 11° Scorpio. Hidden truths surface, emotions intensify, and transformation accelerates. What needs to die so something new can be born?",
    sign: "Scorpio", signGlyph: "♏", intensity: 2,
    impacts: {
      Aries: "Financial or intimate revelations. A shared resource matter culminates.",
      Taurus: "Relationship intensity peaks. A partnership truth becomes undeniable.",
      Gemini: "Health or work matter reaches critical clarity. Transform your routine.",
      Cancer: "Creative or romantic emotions peak. Express the depth of your feelings.",
      Leo: "Home and family emotions culminate. A domestic secret emerges.",
      Virgo: "A conversation delivers transformative truth. Words carry power.",
      Libra: "Financial transformation completes. You know your true worth.",
      Scorpio: "Personal emotional breakthrough. You transform before your own eyes.",
      Sagittarius: "Subconscious material surfaces powerfully. Dreams are prophetic.",
      Capricorn: "Social dynamics shift. A friendship reveals its true depth.",
      Aquarius: "Career truth surfaces. Your professional reputation transforms.",
      Pisces: "Philosophical or educational breakthrough. Beliefs deepen.",
    },
  },

  // ── GRAND ASPECTS ──
  {
    date: "2026-06-09",
    type: "grand_aspect",
    title: "Jupiter-Uranus Trine",
    description: "Jupiter in Cancer trines Uranus in Taurus — a rare and lucky aspect bringing unexpected breakthroughs, financial opportunities, and innovative solutions. Fortune favors the bold and the prepared.",
    intensity: 3,
    impacts: {
      Aries: "Home-based income opportunity. Innovative domestic solutions bring abundance.",
      Taurus: "Personal breakthrough combines luck with innovation. Act on sudden inspiration.",
      Gemini: "Hidden financial opportunity emerges. Trust your intuition about money.",
      Cancer: "Major personal expansion through unconventional means. Your luck multiplies.",
      Leo: "Social connections deliver unexpected opportunities. Community is your catalyst.",
      Virgo: "Career breakthrough through innovation. Your unique approach gets recognized.",
      Libra: "Travel or education brings life-changing encounters. Say yes to the unexpected.",
      Scorpio: "Financial windfall or inheritance possibility. Shared resources expand.",
      Sagittarius: "Relationship brings unexpected expansion. A partner opens doors.",
      Capricorn: "Health breakthrough or work innovation. New technology serves you.",
      Aquarius: "Creative genius flows. Artistic or romantic life gets a lucky boost.",
      Pisces: "Home value increases or family brings fortune. Roots yield fruit.",
    },
  },
];

/** Get upcoming events from today, sorted by date */
export function getUpcomingEvents(count = 5): AstroEvent[] {
  const today = new Date().toISOString().slice(0, 10);
  return EVENTS_2026
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, count);
}

/** Get past events (most recent first) */
export function getRecentEvents(count = 3): AstroEvent[] {
  const today = new Date().toISOString().slice(0, 10);
  return EVENTS_2026
    .filter(e => e.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, count);
}

/** Get all events for a given month */
export function getMonthEvents(year: number, month: number): AstroEvent[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return EVENTS_2026.filter(e => e.date.startsWith(prefix));
}

/** Get impact of an event on a specific sign */
export function getEventImpact(event: AstroEvent, signName: string): string {
  return event.impacts[signName] || "This event brings subtle shifts to your cosmic landscape. Stay aware and open.";
}

/** Event type display info */
export const EVENT_TYPE_META: Record<EventType, { label: string; emoji: string; color: string }> = {
  eclipse_solar: { label: "Solar Eclipse", emoji: "🌑", color: "#FFD700" },
  eclipse_lunar: { label: "Lunar Eclipse", emoji: "🌕", color: "#C0C0C0" },
  retrograde_start: { label: "Retrograde Begins", emoji: "℞", color: "#E8524A" },
  retrograde_end: { label: "Retrograde Ends", emoji: "→", color: "#4ECDC4" },
  new_moon: { label: "New Moon", emoji: "🌑", color: "#7B68EE" },
  full_moon: { label: "Full Moon", emoji: "🌕", color: "#FFD700" },
  ingress: { label: "Sign Ingress", emoji: "→", color: "#D4AF37" },
  grand_aspect: { label: "Grand Aspect", emoji: "✦", color: "#4ECDC4" },
  equinox: { label: "Equinox", emoji: "☀", color: "#FFD700" },
  solstice: { label: "Solstice", emoji: "☀", color: "#D4AF37" },
};
