/**
 * house-profile.ts — Lesson content templates for astrological house lessons
 *
 * Generates data-driven sections for individual house profiles,
 * house overviews, and house classification systems.
 * Pulls from HOUSE_MEANING for real interpretive data.
 */

import type { LessonContent, ContentSection } from "../types";
import { HOUSE_MEANING } from "@/lib/planet-interpretations";

// ── Helpers ──

function text(title: string, body: string): ContentSection {
  return { type: "text", title, body };
}

function callout(style: "insight" | "warning" | "tip", body: string): ContentSection {
  return { type: "callout", style, body };
}

function houseProfile(house: number): ContentSection {
  return { type: "house-profile", house };
}

// ── Individual house data ──

interface HouseLesson {
  slug: string;
  house: number;
  title: string;
  intro: string;
  insight: string;
}

const HOUSE_LESSONS: HouseLesson[] = [
  {
    slug: "house-1-self",
    house: 1,
    title: "The 1st House: Self and Identity",
    intro:
      "The 1st house is the most personal point in your chart. It begins at the Ascendant — the sign that was " +
      "rising on the eastern horizon at the exact moment of your birth. This house governs your physical " +
      "appearance, your demeanor, the first impression you make, and the lens through which you see the world. " +
      "While your Sun sign describes your core identity, the 1st house and its ruling sign describe the mask you " +
      "wear — not in a dishonest sense, but as the interface between your inner self and the outer world. People " +
      "often identify more strongly with their rising sign than their Sun sign in social situations because the " +
      "Ascendant is literally what others see first.",
    insight:
      "Any planets in the 1st house have an outsized influence on your personality and physical presence. A 1st " +
      "house Mars gives an athletic, assertive bearing. A 1st house Venus creates natural charm and aesthetic " +
      "awareness. The 1st house is the 'I am' of the chart — it is where the self announces itself to the world. " +
      "In traditional Hellenistic astrology, the 1st house is the joy of Mercury — the mind's interface with the " +
      "world, the place where perception and self-presentation merge.",
  },
  {
    slug: "house-2-resources",
    house: 2,
    title: "The 2nd House: Money and Values",
    intro:
      "The 2nd house governs your relationship with material resources, personal finances, and self-worth. This " +
      "is not just about money — it is about what you value, what you consider worth investing your time and " +
      "energy in, and how you generate income. The 2nd house describes your earning capacity, spending habits, " +
      "and relationship with physical possessions. At a deeper level, it reflects your sense of inherent worth: " +
      "do you feel valuable regardless of what you own? The sign on the 2nd house cusp and any planets within " +
      "it reveal how you build security and what material comfort means to you.",
    insight:
      "The 2nd house opposite is the 8th house (other people's money, shared resources). Together they form the " +
      "axis of value: what is mine vs. what is ours. Financial struggles often involve an imbalance between " +
      "these two houses — either excessive self-reliance (2nd house emphasis) or excessive dependence on others " +
      "(8th house emphasis).",
  },
  {
    slug: "house-3-communication",
    house: 3,
    title: "The 3rd House: Communication and Learning",
    intro:
      "The 3rd house is the domain of the mind in its daily operations — how you think, speak, write, and learn. " +
      "It governs all forms of short-distance communication: conversations, texts, emails, social media, and " +
      "local travel. This house also rules siblings, neighbors, and your immediate environment. The 3rd house " +
      "describes your learning style, your relationship with information, and how you process and share ideas. " +
      "A strong 3rd house often indicates a person who is perpetually curious, verbally skilled, and engaged " +
      "with their local community.",
    insight:
      "The 3rd house (everyday learning) opposes the 9th house (higher education and philosophy). Together they " +
      "form the axis of knowledge: concrete information vs. abstract wisdom. The best thinkers balance both — " +
      "they gather data (3rd) and synthesize meaning (9th). In the Hellenistic system, the 3rd house is the " +
      "joy of the Moon — the goddess of local travel, everyday rhythm, and the shifting tides of daily life.",
  },
  {
    slug: "house-4-home",
    house: 4,
    title: "The 4th House: Home and Roots",
    intro:
      "The 4th house sits at the very bottom of the chart, representing your deepest foundation. It governs " +
      "home, family of origin, ancestry, emotional security, and your private inner life. This is the most " +
      "hidden house — what happens here is rarely visible to the outside world. The 4th house describes the " +
      "home you came from and the home you create for yourself, both physically and psychologically. It also " +
      "connects to your relationship with one parent (traditionally the mother or the more nurturing parent) " +
      "and to the emotional patterns inherited from your family lineage.",
    insight:
      "The 4th house (private self) opposes the 10th house (public self). This is the axis of inner vs. outer " +
      "life. People with strong 4th house placements need a stable, nourishing home base before they can " +
      "achieve anything in the public sphere. Neglecting the 4th house in pursuit of 10th house ambitions " +
      "always catches up eventually.",
  },
  {
    slug: "house-5-creativity",
    house: 5,
    title: "The 5th House: Creativity and Romance",
    intro:
      "The 5th house is where joy lives. It governs creative self-expression, romantic love (the exciting, " +
      "flirtatious kind), children, play, hobbies, gambling, and anything you do purely for the pleasure of " +
      "doing it. This is the house of the inner child — the part of you that creates without agenda, loves " +
      "without caution, and plays without purpose. A strong 5th house often indicates a person who needs " +
      "creative outlets to feel alive, who falls in love intensely, and who has a special relationship with " +
      "children or childlike energy.",
    insight:
      "The 5th house (personal creation) opposes the 11th house (collective contribution). Together they " +
      "form the axis of creativity: individual expression vs. group participation. The artist who only creates " +
      "for themselves (5th) eventually needs an audience (11th), and the community organizer (11th) needs " +
      "personal creative fulfillment (5th) to avoid burnout. Traditionally, the 5th house is the joy of Venus — " +
      "the goddess of pleasure, love, and creative beauty naturally thrives in the house of play and romance.",
  },
  {
    slug: "house-6-service",
    house: 6,
    title: "The 6th House: Health and Service",
    intro:
      "The 6th house governs your daily routines, work habits, physical health, and acts of service. This is " +
      "not the house of career (that belongs to the 10th) but of the daily work that sustains life — the " +
      "routines, rituals, and disciplines that keep body and mind functioning. The 6th house also rules your " +
      "relationship with service: how you help others, how you maintain systems, and your relationship with " +
      "pets (the beings who depend on your daily care). Health issues often correlate with the sign and planets " +
      "in the 6th house, pointing to the body systems that need the most conscious attention.",
    insight:
      "The 6th house (daily service) opposes the 12th house (spiritual surrender). This axis represents the " +
      "tension between doing and being, between the practical and the mystical. The healthiest approach " +
      "integrates both: daily work as spiritual practice, and spiritual awareness that informs practical choices. " +
      "In Hellenistic astrology, the 6th house is the joy of Mars — the warrior planet thrives in conditions " +
      "of difficulty, illness, and hard labor, channeling its combative energy into the daily struggle to endure.",
  },
  {
    slug: "house-7-partnership",
    house: 7,
    title: "The 7th House: Partnership",
    intro:
      "The 7th house is the house of the Other. It governs committed partnerships of all kinds — marriage, " +
      "business partnerships, close collaborations, and even open enemies (anyone you meet as an equal in " +
      "direct confrontation). The sign on the 7th house cusp (the Descendant) describes the qualities you " +
      "seek in a partner, which are often qualities you have not fully developed in yourself. This is why " +
      "the 7th house is always the opposite sign of your Ascendant — your partner mirrors what your rising " +
      "sign lacks. The 7th house teaches the deepest lesson of relationship: that the Other is a mirror for " +
      "the self.",
    insight:
      "The 7th house cusp (Descendant) is one of the four angles of the chart and therefore one of its most " +
      "powerful points. Planets in the 7th house are not just about partnerships — they describe qualities you " +
      "project onto others until you learn to own them yourself. A 7th house Pluto person may attract intense, " +
      "controlling partners until they claim their own power.",
  },
  {
    slug: "house-8-transformation",
    house: 8,
    title: "The 8th House: Transformation and Shared Resources",
    intro:
      "The 8th house is the zodiac's underworld — the domain of taboo, transformation, shared resources, sex, " +
      "death, inheritance, and other people's money. This is not comfortable territory, and it is not meant to " +
      "be. The 8th house governs every experience that requires you to surrender control and merge with something " +
      "larger or deeper than yourself. Financial entanglements, psychological depth work, intimate vulnerability, " +
      "and encounters with mortality all live here. A strong 8th house often indicates a person drawn to the " +
      "hidden dimensions of life — psychology, the occult, forensics, or crisis management.",
    insight:
      "The 8th house is where the ego learns that it cannot control everything. Planets here undergo a process " +
      "of death and rebirth — they must be destroyed in their superficial form so that their deeper power can " +
      "emerge. This is why 8th house transits are so intense: they are not punishing you, they are revealing " +
      "what was always underneath.",
  },
  {
    slug: "house-9-philosophy",
    house: 9,
    title: "The 9th House: Philosophy and Travel",
    intro:
      "The 9th house is the domain of the higher mind — philosophy, religion, higher education, foreign cultures, " +
      "long-distance travel, publishing, and the search for meaning. Where the 3rd house gathers information, " +
      "the 9th house synthesizes wisdom. This is the house of the teacher, the philosopher, the explorer, and " +
      "the pilgrim. It governs belief systems, ethical frameworks, and the stories you tell yourself about what " +
      "life means. A strong 9th house often indicates a person who needs travel, education, or spiritual seeking " +
      "to feel fully alive.",
    insight:
      "The 9th house is traditionally called the House of God — not because it is inherently religious but because " +
      "it represents whatever framework of meaning you use to make sense of existence. Whether that framework is " +
      "organized religion, secular philosophy, scientific inquiry, or personal spirituality, it lives in the 9th " +
      "house of your chart. Traditionally, the 9th house is the joy of the Sun — the god of truth, prophecy, " +
      "and higher knowledge illuminates this house of philosophy, making it a place where clarity and meaning converge.",
  },
  {
    slug: "house-10-career",
    house: 10,
    title: "The 10th House: Career and Legacy",
    intro:
      "The 10th house sits at the very top of the chart — the most visible, public point. It governs your " +
      "career, public reputation, legacy, and relationship with authority. The sign on the 10th house cusp " +
      "(the Midheaven or MC) describes how the world perceives you professionally and the kind of achievement " +
      "that fulfills your sense of purpose. This is not just about what job you have — it is about what you " +
      "contribute to the world, how you are remembered, and the authority you develop through sustained effort " +
      "and demonstrated competence.",
    insight:
      "The Midheaven is the second most important angle in the chart after the Ascendant. While the Ascendant " +
      "describes who you are, the Midheaven describes what you are here to do. Planets conjunct the Midheaven " +
      "are visible to the world whether you want them to be or not — they become part of your public identity.",
  },
  {
    slug: "house-11-community",
    house: 11,
    title: "The 11th House: Community and Dreams",
    intro:
      "The 11th house governs your relationship with groups, communities, social causes, friendships, and your " +
      "hopes for the future. This is the house of the collective — the people you choose as your tribe, the " +
      "causes you champion, and the vision of the future you work toward. The 11th house describes the kind of " +
      "friends you attract, the groups you naturally belong to, and the role you play within communities. It " +
      "also governs technology, innovation, and humanitarian impulses — anything that serves the many rather " +
      "than the one.",
    insight:
      "The 11th house is often called the House of Good Fortune in traditional astrology because it represents " +
      "the support that comes from being part of something larger than yourself. Planets here operate through " +
      "social connection — they achieve their goals not through solo effort but through collaboration, networking, " +
      "and shared purpose. In the Hellenistic tradition, the 11th house is the joy of Jupiter — the greater " +
      "benefic naturally flourishes in the house of good fortune, hopes, and the blessings that flow from friendship.",
  },
  {
    slug: "house-12-transcendence",
    house: 12,
    title: "The 12th House: The Subconscious and Transcendence",
    intro:
      "The 12th house is the most mysterious territory in the chart — the house of the subconscious, of hidden " +
      "things, of self-undoing and self-transcendence. It governs what lies beneath conscious awareness: repressed " +
      "emotions, karmic patterns, spiritual gifts, hidden enemies, and the collective unconscious. This is also " +
      "the house of solitude, meditation, retreat, and the sacred. Prisons, hospitals, monasteries, and ashrams " +
      "are all 12th house environments — places where the boundary between self and world dissolves. A strong " +
      "12th house often indicates a person with psychic sensitivity, artistic vision, or a deep need for periodic " +
      "withdrawal from the world.",
    insight:
      "The 12th house is the final house — the end of the zodiac cycle before it begins again with the 1st. It " +
      "represents everything that must be released before new life can emerge. Planets here operate from behind " +
      "the scenes. They are powerful but hidden, often expressing through dreams, intuition, and creative vision " +
      "rather than direct, visible action. In traditional astrology, the 12th house is the joy of Saturn — the " +
      "planet of isolation, endurance, and confinement finds a strange home in this house of hidden things, " +
      "teaching that some of the deepest wisdom is forged in solitude and suffering.",
  },
];

// ── Main generator ──

export function generateHouseContent(lessonSlug: string, locale: string = "en"): LessonContent | null {
  // Individual house lessons
  const lesson = HOUSE_LESSONS.find((l) => l.slug === lessonSlug);
  if (lesson) {
    const meaning = HOUSE_MEANING[lesson.house];
    const sections: ContentSection[] = [
      text(lesson.title, lesson.intro),
      { type: "house-wheel", highlightHouse: lesson.house },
      callout("tip", `${meaning.area}: ${meaning.rules}`),
      houseProfile(lesson.house),
      callout("insight", lesson.insight),
      callout("tip", "Further Reading: 'The Twelve Houses' by Howard Sasportas — the essential modern text on house meanings and their psychological significance."),
    ];
    return {
      sections,
      estimatedMinutes: 8,
      keyTakeaway: `The ${ordinal(lesson.house)} house governs ${meaning.area.toLowerCase()} — ${meaning.rules.split(",")[0].toLowerCase()}.`,
    };
  }

  // Houses overview
  if (lessonSlug === "houses-overview") {
    const items = Object.entries(HOUSE_MEANING).map(([num, data]) => ({
      term: `${ordinal(Number(num))} House`,
      definition: `${data.area} — ${data.rules}`,
    }));
    const sections: ContentSection[] = [
      text(
        "The Twelve Houses",
        "If planets are the actors and signs are the costumes, houses are the stages on which the drama " +
        "plays out. The twelve houses divide the chart into twelve life areas, from identity (1st house) " +
        "through partnership (7th house) to transcendence (12th house). Unlike signs, which are based on " +
        "the Sun's apparent path, houses are based on the Earth's daily rotation — they depend on the exact " +
        "time and place of birth. This is why birth time matters so much in astrology: without it, the houses " +
        "cannot be accurately calculated."
      ),
      { type: "house-wheel" },
      { type: "keyword-map", items },
      text(
        "House Systems: How Boundaries Are Drawn",
        "Different house systems calculate the boundaries between houses differently, which means the same birth " +
        "chart can place planets in different houses depending on the system used. Placidus — the most common " +
        "system in modern Western astrology — divides houses based on the time it takes each degree of the " +
        "ecliptic to move from the horizon to the Midheaven. Equal House simply divides the chart into twelve " +
        "30-degree segments starting from the Ascendant. Whole Sign houses — the original Hellenistic method, now " +
        "experiencing a major modern revival — assigns each house to one complete zodiac sign, with the Ascendant's " +
        "sign becoming the entire 1st house. Each system has strengths. Whole Sign is the simplest and produces " +
        "the clearest house rulership assignments. Placidus is more sensitive to latitude. The best approach is " +
        "to learn your chart in at least two systems and see which one resonates with your lived experience."
      ),
      text(
        "Houses and Daily Life",
        "Every transit, progression, and solar return activates specific houses in your chart. When Jupiter " +
        "transits your 2nd house, financial opportunities expand. When Saturn enters your 7th house, " +
        "relationships get tested and strengthened. Understanding your houses gives you a practical map for " +
        "when and where life's major themes will intensify."
      ),
      callout(
        "insight",
        "The four angular houses (1st, 4th, 7th, 10th) are the most powerful positions in a chart. Planets " +
        "in these houses have the greatest visible impact on your life. The 1st house shapes identity, the " +
        "4th shapes home life, the 7th shapes partnerships, and the 10th shapes career."
      ),
    ];
    return {
      sections,
      estimatedMinutes: 10,
      keyTakeaway: "The twelve houses map twelve life areas, from self-identity to transcendence, based on your exact birth time.",
    };
  }

  // Angular, succedent, cadent
  if (lessonSlug === "angular-succedent-cadent") {
    const sections: ContentSection[] = [
      text(
        "House Types: Angular, Succedent, and Cadent",
        "Just as signs are classified by modality (Cardinal, Fixed, Mutable), houses are classified into three " +
        "types based on their position relative to the chart's angles. Angular houses are the most powerful and " +
        "visible. Succedent houses stabilize and build upon what the angular houses initiate. Cadent houses adapt, " +
        "distribute, and prepare for the next angular house. This three-fold rhythm mirrors the Cardinal-Fixed-Mutable " +
        "cycle of the signs."
      ),
      {
        type: "comparison-table",
        headers: ["Type", "Houses", "Quality", "Parallel", "Effect on Planets"],
        rows: [
          [
            "Angular",
            "1st, 4th, 7th, 10th",
            "Action and initiation",
            "Cardinal signs",
            "Planets here are strong, visible, and actively expressed in the world",
          ],
          [
            "Succedent",
            "2nd, 5th, 8th, 11th",
            "Stability and resources",
            "Fixed signs",
            "Planets here build, accumulate, and deepen over time",
          ],
          [
            "Cadent",
            "3rd, 6th, 9th, 12th",
            "Adaptation and learning",
            "Mutable signs",
            "Planets here process, communicate, and refine experience",
          ],
        ],
      },
      text(
        "Why This Matters",
        "Planets in angular houses have the most obvious impact on your life — they are the first things anyone " +
        "notices about you. Planets in succedent houses work more slowly but build lasting results. Planets in " +
        "cadent houses are the most subtle — their influence operates through learning, communication, and inner " +
        "development rather than external action. A chart with most planets in angular houses belongs to someone " +
        "who makes things happen. A chart weighted toward cadent houses belongs to a thinker, teacher, or " +
        "behind-the-scenes influence."
      ),
      callout(
        "tip",
        "Count how many planets you have in each house type. This gives you a quick read on whether you are " +
        "primarily an initiator (angular), a builder (succedent), or a processor (cadent). Most people have " +
        "a mix, but the dominant type tells you a lot about your operating style."
      ),
    ];
    return {
      sections,
      estimatedMinutes: 8,
      keyTakeaway: "Angular houses are action, succedent houses are stability, cadent houses are learning — mirroring the Cardinal-Fixed-Mutable rhythm.",
    };
  }

  return null;
}

// ── Utility ──

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
