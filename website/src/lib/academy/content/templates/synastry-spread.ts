/**
 * synastry-spread.ts — Content for relationship astrology and tarot spread lessons
 *
 * Handles:
 * - Synastry lessons: venus-mars-dynamics, sun-moon-bond, saturn-in-synastry, composite charts, etc.
 * - Spread lessons: celtic-cross, three-card, custom-spreads, etc.
 */

import type { LessonContent, ContentSection } from "../types";

interface LessonData {
  sections: ContentSection[];
  minutes: number;
  takeaway: string;
}

// ─── Synastry / Relationship Astrology ───

const SYNASTRY_CONTENT: Record<string, LessonData> = {
  "venus-mars-attraction": {
    sections: [
      {
        type: "text",
        title: "Venus-Mars: The Chemistry Axis",
        body: "In synastry, the connection between one person's Venus and the other's Mars is the single strongest indicator of physical and romantic chemistry. Venus represents what we attract and find beautiful; Mars represents how we pursue and act on desire. When these two planets form aspects between charts, the result is magnetic pull.",
      },
      {
        type: "text",
        title: "The Major Venus-Mars Aspects in Synastry",
        body: "A conjunction between one person's Venus and the other's Mars creates immediate, undeniable attraction. The Venus person feels irresistibly drawn; the Mars person feels compelled to pursue. The sexual chemistry is potent and often felt from the first meeting.\n\nA trine or sextile creates easy, pleasurable chemistry — attraction that feels natural rather than intense. These aspects often appear in long-lasting relationships where desire remains steady rather than volatile.\n\nA square or opposition generates intense chemistry laced with friction. The attraction is powerful but the expression of desire can clash. Venus may feel overwhelmed by Mars' aggression; Mars may feel Venus is too passive. These aspects create the 'can't live with them, can't live without them' dynamic.",
      },
      {
        type: "text",
        title: "Beyond the Aspect: Sign and Element Dynamics",
        body: "The signs involved add nuance. Venus in Scorpio opposite Mars in Taurus creates a smoldering, possessive magnetism. Venus in Aquarius conjunct Mars in Aquarius produces a cerebral, unconventional attraction where intellectual stimulation is as important as physical chemistry.\n\nPay attention to the element combination. Fire-fire Venus-Mars connections burn hot and fast. Earth-water combinations build slowly but run deep. The element tells you how the attraction expresses — through action, sensation, conversation, or emotion.",
      },
      {
        type: "comparison-table",
        headers: ["Aspect", "Chemistry Quality", "Long-Term Pattern"],
        rows: [
          ["Conjunction", "Immediate, magnetic, fused", "Can burn out if not given space"],
          ["Trine/Sextile", "Easy, natural, pleasurable", "Sustained desire that remains steady"],
          ["Square", "Intense friction, push-pull", "Volatile but deeply engaging"],
          ["Opposition", "Polarized attraction", "Requires conscious balancing of needs"],
        ],
      },
      { type: "callout", style: "tip", body: "If you want to understand the sexual chemistry in a relationship, look at Venus-Mars aspects first. Everything else adds context, but this axis is the engine of attraction." },
    ],
    minutes: 12,
    takeaway: "Venus-Mars connections are the primary indicator of physical and romantic chemistry in synastry. The aspect type determines whether attraction flows easily or generates tension.",
  },

  "sun-moon-bond": {
    sections: [
      {
        type: "text",
        title: "Sun-Moon: The Deepest Compatibility",
        body: "While Venus-Mars governs attraction, Sun-Moon connections govern the deeper compatibility that sustains a relationship over decades. The Sun represents identity — who you fundamentally are. The Moon represents emotional needs — what you require to feel safe and nurtured. When one person's Sun harmonizes with the other's Moon, identity and emotion find mutual understanding.",
      },
      {
        type: "text",
        title: "How Sun-Moon Connections Work",
        body: "When your Sun is conjunct or trine another person's Moon, your very identity makes them feel emotionally safe. You do not have to try — your presence is nurturing to them. And their emotional nature supports and validates who you are. This creates a feeling of 'coming home' that many couples with these contacts describe.\n\nThe reverse matters too. When your Moon is contacted by their Sun, you feel emotionally understood and accepted at a core level. The combination of both connections — his Sun on her Moon and her Sun on his Moon — creates what traditional astrologers call mutual reception of luminaries, one of the strongest indicators of lasting partnership.",
      },
      {
        type: "text",
        title: "When Sun-Moon Connections Are Tense",
        body: "A Sun-Moon square or opposition in synastry does not kill a relationship — but it creates an ongoing dialogue between identity and emotional needs that requires work. One person's way of being may inadvertently trigger the other's insecurities. The Sun person may feel the Moon person is too sensitive; the Moon person may feel the Sun person is insensitive to their needs.\n\nThese aspects are workable when both people are willing to see the dynamic clearly. The Sun person learns to be gentler with their partner's emotional landscape. The Moon person learns that their partner's identity is not a threat to their emotional safety.",
      },
      { type: "callout", style: "insight", body: "Long-term relationships survive on Sun-Moon compatibility more than Venus-Mars chemistry. Attraction fades; emotional understanding deepens. Look for the Sun-Moon bond when evaluating lasting potential." },
    ],
    minutes: 12,
    takeaway: "Sun-Moon connections determine whether two people feel emotionally at home with each other. This is the compatibility that sustains relationships over a lifetime.",
  },

  "saturn-in-synastry": {
    sections: [
      {
        type: "text",
        title: "Saturn: The Glue That Binds (or Suffocates)",
        body: "Saturn in synastry is one of the most important — and most feared — contacts. Saturn represents structure, commitment, time, and restriction. When one person's Saturn touches the other's personal planets, it brings seriousness, longevity, and stability to the relationship. But it can also bring control, criticism, and a feeling of being restricted.",
      },
      {
        type: "text",
        title: "Positive Saturn Contacts",
        body: "Saturn conjunct or trine another person's Sun, Moon, or Venus can feel like meeting someone who takes you seriously. There is a weight to the connection, a sense that this matters. Saturn provides the framework for a lasting commitment — the willingness to show up through difficulty, to commit when things are not easy.\n\nMany long-married couples have strong Saturn contacts. Saturn is the planet that says 'I am not going anywhere.' It is the difference between a summer fling and a 40-year partnership.",
      },
      {
        type: "text",
        title: "Challenging Saturn Contacts",
        body: "Saturn square or opposite someone's personal planets can create a power imbalance. The Saturn person may unconsciously become the critic, the parent, or the authority figure. The planet person may feel judged, restricted, or 'not good enough.' Over time, this dynamic can erode self-esteem and breed resentment.\n\nThe key is awareness. If you are the Saturn person, watch your tendency to correct or control. If you are on the receiving end, recognize that Saturn contacts often trigger old wounds around authority and approval. Neither person is the villain — but both must be conscious.",
      },
      { type: "callout", style: "warning", body: "Saturn contacts are not optional — they are the price of lasting commitment. The question is not whether Saturn appears in your synastry, but whether both people are mature enough to handle its weight with grace." },
    ],
    minutes: 12,
    takeaway: "Saturn in synastry brings the potential for lasting commitment — but also the risk of control and criticism. Maturity from both partners determines which side manifests.",
  },

  "composite-charts": {
    sections: [
      {
        type: "text",
        title: "The Composite Chart: The Relationship's Birth Chart",
        body: "A composite chart is created by calculating the midpoints of each planet and angle between two people's charts. The result is a single chart that represents the relationship itself — not person A, not person B, but the third entity that emerges when they come together.\n\nThink of a composite chart as the relationship's own birth chart. It has its own Sun (core purpose), Moon (emotional climate), Venus (love expression), and challenges (hard aspects). Understanding the composite helps you see the relationship's needs as distinct from either individual's needs.",
      },
      {
        type: "text",
        title: "Key Composite Placements",
        body: "The composite Sun shows the relationship's purpose — what it exists to accomplish or explore. A composite Sun in the 5th house creates a relationship focused on creativity, joy, and play. In the 10th house, the relationship is defined by shared ambition or public identity.\n\nThe composite Moon reveals the emotional climate. A composite Moon in Cancer creates a nurturing, home-centered bond. In Aquarius, the emotional tone is independent and friendship-based. The Moon's aspects show whether emotional expression comes easily or requires conscious effort.\n\nComposite Venus shows how the relationship expresses love, while composite Mars shows how it handles conflict and desire. Saturn in the composite reveals where commitment is tested.",
      },
      {
        type: "text",
        title: "Transits to the Composite",
        body: "The composite chart responds to transits just like a natal chart. When Saturn transits through the composite 7th house, the partnership itself faces a test of commitment. When Jupiter transits composite Venus, the relationship enters a period of growth and renewed affection.\n\nTracking composite transits helps you understand why a relationship goes through phases. The ups and downs are not random — they follow the same planetary rhythms that govern individual lives.",
      },
      { type: "callout", style: "tip", body: "Create a composite chart for any significant relationship — romantic, business, creative. Understanding the third entity helps you stop projecting individual needs onto the partnership." },
    ],
    minutes: 15,
    takeaway: "The composite chart reveals the relationship as its own entity with its own needs, purpose, and evolutionary cycles — distinct from either individual.",
  },

  "composite-sun-moon": {
    sections: [
      {
        type: "text",
        title: "The Composite Sun: The Relationship's Identity",
        body: "The composite Sun is the core of the relationship's identity — its reason for existing, its central theme, and what it projects to the world. A composite Sun in Aries is a relationship that pioneers, takes risks, and thrives on novelty. A composite Sun in Capricorn is a relationship built on shared ambition, mutual respect, and long-term building.\n\nThe house placement of the composite Sun shows where the relationship directs its energy. Composite Sun in the 1st house means the relationship itself is the focus — it exists to be. In the 4th house, home and family are the core. In the 9th house, shared exploration and philosophical growth define the bond.",
      },
      {
        type: "text",
        title: "The Composite Moon: The Emotional Weather",
        body: "The composite Moon shows how the relationship feels from the inside. It governs the emotional habits, comfort patterns, and instinctive reactions of the partnership. A composite Moon in Scorpio creates an emotionally intense, all-or-nothing bond. In Gemini, the emotional tone is light, communicative, and restless.\n\nThe composite Moon's aspects are crucial. A composite Moon square Saturn means the relationship struggles with emotional expression — there may be a sense of duty overriding genuine feeling. A composite Moon trine Venus indicates natural warmth and easy affection between the two people when they are together.",
      },
      { type: "callout", style: "insight", body: "When a relationship feels 'off' for no obvious reason, check the composite Moon. The emotional climate of the partnership may need attention that neither individual's chart explains." },
    ],
    minutes: 12,
    takeaway: "The composite Sun reveals what the relationship is about; the composite Moon reveals how it feels from the inside. Together, they define the partnership's core identity and emotional reality.",
  },

  "composite-venus-mars-saturn": {
    sections: [
      {
        type: "text",
        title: "Composite Venus: How the Relationship Loves",
        body: "Composite Venus shows how the partnership expresses affection, values beauty, and handles pleasure. A well-aspected composite Venus means the relationship naturally generates warmth, appreciation, and mutual enjoyment. A challenged composite Venus (square Saturn, opposite Pluto) means love expression requires more conscious effort.\n\nThe sign and house of composite Venus reveal the style of love. Venus in the 2nd house values material security and shared comfort. Venus in the 11th values friendship and intellectual stimulation within the romantic bond.",
      },
      {
        type: "text",
        title: "Composite Mars: How the Relationship Fights",
        body: "Every relationship has conflict — composite Mars shows how yours handles it. Composite Mars in Aries confronts directly and gets it over with. In Libra, conflict is avoided or processed through careful negotiation. In Scorpio, arguments go deep and can become power struggles.\n\nA well-aspected composite Mars gives the relationship healthy assertiveness and drive. A composite Mars square or opposite Pluto can create destructive power dynamics. Understanding your composite Mars helps you develop healthier conflict patterns as a couple.",
      },
      {
        type: "text",
        title: "Composite Saturn: What Holds It Together",
        body: "Composite Saturn is the structural foundation of the relationship — the commitment, the responsibilities, and the tests that prove its worth. A strong composite Saturn (well-placed, well-aspected) indicates a relationship that endures. A challenged composite Saturn may struggle with authority imbalances, excessive duty, or emotional coldness.\n\nComposite Saturn's house shows where the relationship faces its greatest tests. Saturn in the 2nd tests financial partnership. Saturn in the 7th tests the commitment itself. These are not deal-breakers — they are the areas where the relationship grows strongest through conscious effort.",
      },
      { type: "callout", style: "tip", body: "Look at these three composite planets together: Venus shows how you love, Mars shows how you fight, Saturn shows what holds it all together. A relationship needs all three functioning well." },
    ],
    minutes: 12,
    takeaway: "Composite Venus, Mars, and Saturn form the operational triangle of a relationship: how it loves, how it handles conflict, and what gives it structural integrity.",
  },

  "nodal-connections": {
    sections: [
      {
        type: "text",
        title: "Karmic Ties: The Lunar Nodes in Synastry",
        body: "The Lunar Nodes — North Node (future direction) and South Node (past comfort) — carry a quality of fate in synastry. When someone's planets land on your North Node, they catalyze your growth. When they land on your South Node, the connection feels hauntingly familiar, as if you have known each other before.",
      },
      {
        type: "text",
        title: "North Node Connections",
        body: "A partner whose planets (especially Sun, Moon, or Venus) conjunct your North Node pushes you toward your evolutionary purpose. This can feel exciting and uncomfortable simultaneously — they represent where you are going, not where you have been. The relationship may feel fated because it accelerates your personal growth.\n\nThese connections are not always romantic. A mentor whose Saturn sits on your North Node teaches you discipline. A friend whose Jupiter sits there expands your horizons. The North Node connection says: this person helps you become who you are meant to be.",
      },
      {
        type: "text",
        title: "South Node Connections",
        body: "A partner whose planets conjunct your South Node feels like coming home — but the home may be from a past life. The comfort is immediate but the growth potential is limited unless both people are conscious. South Node connections can become codependent, recycling old patterns rather than evolving.\n\nThe most powerful synastry involves both nodes. When one person's North Node conjuncts the other's planet, and simultaneously the other's North Node is activated, both people grow through the connection. These are the relationships that feel most destined — because they are.",
      },
      { type: "callout", style: "insight", body: "North Node connections feel like destiny pulling you forward. South Node connections feel like karma pulling you back. The healthiest relationships activate your North Node growth." },
    ],
    minutes: 12,
    takeaway: "Nodal connections in synastry carry a quality of fate and karmic recognition. North Node contacts push growth; South Node contacts offer comfort but risk stagnation.",
  },

  "synastry-intro": {
    sections: [
      {
        type: "text",
        title: "What Synastry Is: Two Charts, One Relationship",
        body: "Synastry is the art of overlaying two birth charts to see how one person's planets interact with the other's. You take Chart A and place it around Chart B, then observe: where do their planets land in your houses? What aspects do their planets form to yours? The result is a map of the relationship's chemistry, challenges, and growth potential.\n\nThis is the oldest technique in relationship astrology, practiced since Hellenistic times. Liz Greene's 'Relating' brought modern psychological depth to the practice, showing that synastry is not just about compatibility — it is about how two psyches activate each other.",
      },
      {
        type: "text",
        title: "Synastry vs. Composite: Two Different Questions",
        body: "Synastry and composite charts answer different questions. Synastry asks: how does Person A experience Person B, and vice versa? It preserves both individual charts and shows the specific interactions between them. You can see that their Venus on your Ascendant makes you feel adored, while your Saturn on their Moon makes them feel judged.\n\nThe composite chart, by contrast, calculates the midpoints between all planets in both charts to create a single chart representing the relationship as its own entity. The composite asks: what is this relationship about? What is its purpose, emotional climate, and destiny?\n\nBoth techniques are valuable, but synastry comes first because it reveals the raw chemistry — the specific ways two people push, pull, attract, and challenge each other.",
      },
      {
        type: "text",
        title: "House Overlays: Where Their Planets Fall in Your World",
        body: "One of the most revealing techniques in synastry is the house overlay. Take their planets and note which of YOUR houses they land in. If their Sun falls in your 7th house, they feel like a natural partner — their identity resonates with your partnership needs. If their Sun falls in your 10th house, they feel connected to your career and public standing.\n\nIf their Saturn lands on your Moon, they trigger your emotional defenses. You may feel judged, criticized, or emotionally constrained around them — not because they intend it, but because their Saturn energy activates your most vulnerable emotional patterns. If their Jupiter lands in your 5th house, they expand your creativity, joy, and romantic expression.\n\nHouse overlays explain why the same person can feel like a soulmate to one person and a challenge to another. The planets are the same — the houses they land in are different.",
      },
      {
        type: "text",
        title: "The Aspect Grid: How Planets Talk to Each Other",
        body: "Beyond house overlays, synastry examines the aspects (angular relationships) between planets in both charts. Their Venus conjunct your Mars creates magnetic attraction. Their Mercury trine your Moon creates easy emotional communication. Their Pluto square your Sun creates a power struggle that can feel obsessive.\n\nThe aspect grid in a synastry report lists every significant connection between the two charts. When reading it, prioritize aspects involving personal planets (Sun, Moon, Mercury, Venus, Mars) and the angles (Ascendant, Descendant, MC, IC). These carry the most personal weight. Outer planet contacts (Uranus, Neptune, Pluto) add depth but operate on a slower, more fate-like frequency.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Synastry", definition: "The overlay of two natal charts to examine inter-chart aspects and house placements — reveals how two people experience each other" },
          { term: "Composite chart", definition: "A single chart created from the midpoints of two charts — represents the relationship itself as a third entity" },
          { term: "Inter-aspects", definition: "Aspects formed between planets in different charts (e.g., your Venus conjunct their Mars) — the core chemistry indicators" },
          { term: "House overlay", definition: "Where one person's planets fall in the other's house system — shows which life areas each person activates in the other" },
          { term: "Aspect grid", definition: "A matrix listing every significant angular relationship between two charts — the technical blueprint of a synastry reading" },
          { term: "Cross-chart contacts", definition: "Any connection between planets in Chart A and planets or angles in Chart B — the building blocks of synastry" },
          { term: "Angles (ASC/DSC/MC/IC)", definition: "The four cardinal points of the chart — contacts to angles are deeply personal and immediately felt" },
          { term: "Personal planets", definition: "Sun, Moon, Mercury, Venus, Mars — carry the most individual weight in synastry; prioritize these in the aspect grid" },
          { term: "Davison chart", definition: "An alternative to the composite — a chart cast for the midpoint in time and space between two births" },
        ],
      },
      { type: "callout", style: "tip", body: "Further Reading: 'Relating' by Liz Greene — the definitive psychological approach to synastry, showing how relationships serve as mirrors for inner development. 'Planets in Composite' by Robert Hand — the companion text for understanding composite charts alongside synastry. Also: 'The Development of the Personality' by Liz Greene and Howard Sasportas — seminars that illuminate how synastry reflects psychological projection and individuation." },
    ],
    minutes: 18,
    takeaway: "Synastry overlays two charts to reveal how each person's planets activate the other's houses and form aspects. It maps the raw chemistry, triggers, and growth potential between two people.",
  },

  "outer-planets-synastry": {
    sections: [
      {
        type: "text",
        title: "The Outer Planets: Where Relationships Touch Fate",
        body: "Uranus, Neptune, and Pluto move slowly through the zodiac, spending years or decades in a single sign. When these planets form tight aspects to personal planets in synastry, the effect is seismic. These are not casual connections — they feel fated, transformative, and often inescapable. Liz Greene's 'The Astrology of Fate' explores how outer planet contacts in synastry activate the deepest layers of the psyche, pulling both people into experiences that feel larger than individual choice.",
      },
      {
        type: "text",
        title: "Uranus Contacts: Electric Awakening",
        body: "When someone's Uranus touches your personal planets, they electrify your life. Uranus conjunct your Venus makes love feel thrilling, unpredictable, and unlike anything you have experienced. Uranus conjunct your Sun shakes your identity awake — you feel more alive, more authentically yourself, but also destabilized.\n\nThe gift of Uranus contacts is liberation. The person frees you from patterns you did not know were cages. The danger is instability — Uranus does not commit, does not settle, and does not promise continuity. A relationship dominated by Uranus contacts can be the most exciting of your life and also the most unreliable. These connections teach you that freedom and security are not always compatible, and force you to decide which you value more.",
      },
      {
        type: "text",
        title: "Neptune Contacts: Sacred Illusion",
        body: "Neptune contacts create the experience of spiritual union — the sense that you have found your soulmate, your twin flame, your divine partner. Neptune conjunct someone's Venus produces a love that feels transcendent, idealized, and almost unbearably beautiful. Neptune trine someone's Moon creates an emotional connection that feels telepathic.\n\nThe danger is disillusionment. Neptune dissolves boundaries, which initially feels like merger but can become codependence, deception, or loss of self. The Neptune person may unconsciously project a fantasy onto the relationship, seeing what they want to see rather than what is. When the illusion breaks — and it always does eventually — the crash can be devastating.\n\nThe mature expression of Neptune in synastry is compassion without illusion: seeing the other person clearly and loving them anyway.",
      },
      {
        type: "text",
        title: "Pluto Contacts: The Most Intense Force in Synastry",
        body: "Pluto conjunct someone's Venus is widely regarded as the most intense romantic contact in astrology. It creates obsessive attraction, emotional depth that borders on consuming, and a feeling that the relationship touches something primal and non-negotiable. For good or devastating — and often both — Pluto-Venus synastry transforms everyone it touches.\n\nPluto contacts in general create power dynamics. The Pluto person holds a subtle but unmistakable power over the planet person. They see through them, activate their deepest fears and desires, and demand transformation. If both people are psychologically mature, this can be the most profoundly healing connection imaginable. If either person is unconscious, it becomes a destructive cycle of control, jealousy, and emotional manipulation.\n\nPluto does not do anything halfway. If Pluto is prominently involved in your synastry, the relationship will change you. The only question is whether you will emerge transformed or traumatized.",
      },
      {
        type: "comparison-table",
        headers: ["Outer Planet", "Gift in Synastry", "Danger in Synastry", "Power Dynamic", "Feels Like"],
        rows: [
          ["Uranus", "Liberation, authenticity, electric awakening", "Instability, commitment-phobia, chaos", "Uranus person disrupts the planet person's patterns", "Lightning bolt — thrilling but unpredictable"],
          ["Neptune", "Spiritual union, compassion, transcendent love", "Illusion, codependence, deception, loss of self", "Neptune person projects fantasy onto the planet person", "Soulmate recognition — beautiful but potentially unreal"],
          ["Pluto", "Profound transformation, psychological depth, rebirth", "Obsession, control, jealousy, power struggles", "Pluto person sees through and dominates the planet person", "Fate — inescapable, consuming, permanently transformative"],
        ],
      },
      { type: "callout", style: "tip", body: "Further Reading: 'The Astrology of Fate' by Liz Greene — explores how outer planet contacts in synastry activate archetypal patterns that feel destined. Essential for understanding the transformative, sometimes overwhelming power of Uranus, Neptune, and Pluto in relationships." },
    ],
    minutes: 18,
    takeaway: "Outer planet contacts in synastry feel fated because they touch the deepest psychic layers. Uranus liberates, Neptune idealizes, and Pluto transforms — each carrying both extraordinary potential and significant danger.",
  },

  "the-descendant": {
    sections: [
      {
        type: "text",
        title: "The Descendant: Your Shadow Partner",
        body: "The Descendant is the cusp of the 7th house — the point directly opposite your Ascendant. While the Ascendant describes how you present yourself to the world, the Descendant describes what you seek in others. It is your 'shadow partner' archetype: the qualities you are drawn to in relationships precisely because they represent what you have not fully developed in yourself.\n\nIf your Ascendant is Aries — independent, assertive, self-reliant — your Descendant is Libra. You attract and need partners who bring diplomacy, beauty, balance, and relational skill. If your Ascendant is Virgo — analytical, modest, service-oriented — your Descendant is Pisces. You seek partners who bring imagination, spiritual depth, and the ability to surrender control.",
      },
      {
        type: "text",
        title: "The Descendant as a Projection Screen",
        body: "Jung's concept of projection is essential to understanding the Descendant. The qualities you admire most in partners are often qualities you possess but have not owned. The Descendant is where you project your unrealized potential onto others, then fall in love with the projection.\n\nThis is not inherently unhealthy — it is how relationships catalyze growth. You are attracted to what you need to integrate. The danger comes when you refuse to develop those qualities yourself and instead demand that your partner carry them exclusively. The partner who embodies your Descendant qualities is not there to complete you — they are there to show you what you need to develop within yourself.\n\nThis is why relationships often become difficult when one partner begins to grow. If you start embodying your Descendant qualities, the dynamic that attracted you to each other shifts — and both people must renegotiate the relationship's terms.",
      },
      {
        type: "text",
        title: "Planets Near the Descendant",
        body: "Planets conjunct the Descendant in the natal chart heavily influence your relationship patterns. Venus conjunct the Descendant produces a person for whom partnership is central to identity — love comes naturally and is deeply valued. Mars conjunct the Descendant may attract conflict in relationships, or partners who are assertive and combative. Saturn conjunct the Descendant brings seriousness to partnership — delays in finding a partner, but also the capacity for deeply committed, long-lasting bonds.\n\nPluto conjunct the Descendant creates intense, transformative relationships. The person may unconsciously attract power struggles until they learn to own their own power rather than projecting it onto partners.\n\nWhen a transit or progression activates the Descendant, relationship themes come to the foreground. A Jupiter transit over the Descendant is one of the classic indicators of meeting a significant partner.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Aries Rising / Libra DSC", definition: "Independent and assertive self — seeks partners who bring diplomacy, balance, beauty, and relational grace" },
          { term: "Taurus Rising / Scorpio DSC", definition: "Steady and sensual self — seeks partners who bring emotional intensity, psychological depth, and transformative power" },
          { term: "Gemini Rising / Sagittarius DSC", definition: "Curious and communicative self — seeks partners who bring vision, philosophical depth, adventure, and expansive thinking" },
          { term: "Cancer Rising / Capricorn DSC", definition: "Nurturing and emotionally attuned self — seeks partners who bring structure, ambition, authority, and worldly competence" },
          { term: "Leo Rising / Aquarius DSC", definition: "Creative and expressive self — seeks partners who bring intellectual independence, originality, and a commitment to the collective" },
          { term: "Virgo Rising / Pisces DSC", definition: "Analytical and service-oriented self — seeks partners who bring imagination, spiritual sensitivity, surrender, and boundless compassion" },
          { term: "Libra Rising / Aries DSC", definition: "Diplomatic and partnership-oriented self — seeks partners who bring decisiveness, courage, directness, and independent fire" },
          { term: "Scorpio Rising / Taurus DSC", definition: "Intense and psychologically penetrating self — seeks partners who bring stability, sensuality, patience, and grounded calm" },
          { term: "Sagittarius Rising / Gemini DSC", definition: "Visionary and freedom-loving self — seeks partners who bring versatility, intellectual curiosity, wit, and communicative agility" },
          { term: "Capricorn Rising / Cancer DSC", definition: "Ambitious and structured self — seeks partners who bring emotional warmth, nurturing, sensitivity, and a sense of home" },
          { term: "Aquarius Rising / Leo DSC", definition: "Independent and collective-minded self — seeks partners who bring personal warmth, creative self-expression, generosity, and heart" },
          { term: "Pisces Rising / Virgo DSC", definition: "Intuitive and boundaryless self — seeks partners who bring practical skill, analytical clarity, discernment, and grounded service" },
        ],
      },
      { type: "callout", style: "tip", body: "Further Reading: 'Relating' by Liz Greene — her analysis of the Ascendant-Descendant axis as the core dynamic of relationship psychology is unmatched. Understanding your Descendant is the single most illuminating step in relationship astrology." },
    ],
    minutes: 15,
    takeaway: "The Descendant describes what you seek in partners — often your own unrealized qualities projected onto others. Understanding it transforms how you approach every relationship.",
  },

  "timing-in-relationships": {
    sections: [
      {
        type: "text",
        title: "When Will Love Arrive? The Astrology of Timing",
        body: "One of the most common questions in astrology is 'When will I meet someone?' While no technique can predict the exact date, astrology offers remarkably reliable indicators of periods when relationship energy is heightened. The key is knowing where to look: transits and progressions to Venus, the 7th house ruler, and the Descendant are the primary timing tools for relationship astrology.",
      },
      {
        type: "text",
        title: "Transits That Open Doors",
        body: "Jupiter transiting the 7th house or conjuncting natal Venus is the classic indicator of expanded partnership opportunities. Jupiter does not guarantee love — it expands possibility. Under this transit, you are more open, more attractive, and more likely to encounter someone whose energy aligns with yours. These transits last roughly a year and represent windows of opportunity.\n\nVenus transiting the 7th house creates brief but potent sparks — a few weeks of heightened romantic receptivity. Eclipses in the 7th house or conjuncting Venus can trigger sudden, significant relationship events: meeting someone, a proposal, a breakup that clears space for something better.\n\nSaturn transiting the 7th house is different. Saturn does not bring casual romance — it brings serious commitment or the serious testing of existing relationships. If you are single, Saturn in the 7th may bring a partner who is older, more established, or represents a significant karmic lesson. If you are partnered, Saturn tests the foundation. Relationships that survive Saturn in the 7th emerge stronger. Those that do not survive were not built to last.",
      },
      {
        type: "text",
        title: "Progressions and Relationship Readiness",
        body: "The progressed Venus cycle offers a slower, deeper timing layer. When progressed Venus changes signs, your entire relationship orientation shifts — what you find attractive, what you need from love, and how you express affection all evolve. When progressed Venus aspects natal planets, inner readiness for relationship changes in ways that feel organic rather than event-driven.\n\nThe progressed Moon's passage through the 7th house (roughly two and a half years out of every twenty-seven) is a period of heightened emotional openness to partnership. Similarly, the progressed Sun moving into conjunction with natal Venus or the Descendant marks a period where identity and relationship become deeply intertwined.\n\nThe most reliable timing comes from multiple indicators converging. When a Jupiter transit to the 7th coincides with a progressed Venus aspect and an eclipse on the Descendant, the conditions for significant relationship development are as strong as astrology can indicate.",
      },
      { type: "callout", style: "tip", body: "Further Reading: 'Planets in Transit' by Robert Hand — the most thorough reference for transit interpretation, including relationship timing. 'The Astrology of Fate' by Liz Greene — for understanding why certain relationships arrive at certain times in your life." },
    ],
    minutes: 15,
    takeaway: "Relationship timing depends on transits and progressions to Venus, the 7th house ruler, and the Descendant. Jupiter opens doors, Saturn tests foundations, and the most significant meetings happen when multiple indicators converge.",
  },
};

// ─── Tarot Spread Content ───

const SPREAD_CONTENT: Record<string, LessonData> = {
  "celtic-cross": {
    sections: [
      {
        type: "text",
        title: "The Celtic Cross: The Gold Standard",
        body: "The Celtic Cross is the most widely used and comprehensive tarot spread. With 10 cards occupying 10 distinct positions, it provides a complete picture of a situation — past, present, future, conscious, subconscious, and external influences.\n\nThe spread has been used in various forms for over a century, and its endurance speaks to its effectiveness. When you need depth and detail, the Celtic Cross delivers.",
      },
      {
        type: "text",
        title: "The 10 Positions Explained",
        body: "Position 1 (Center): The present situation — what you are dealing with right now.\nPosition 2 (Crossing): The challenge or obstacle crossing you. This is what complicates the situation.\nPosition 3 (Foundation): The root cause or foundation beneath the situation.\nPosition 4 (Recent Past): What has just passed or is fading from influence.\nPosition 5 (Crown): The best possible outcome, or what you are working toward.\nPosition 6 (Near Future): What is approaching in the immediate future.\nPosition 7 (Self): Your attitude, feelings, and approach to the situation.\nPosition 8 (Environment): External influences — other people, circumstances, energy around you.\nPosition 9 (Hopes & Fears): What you hope for and what you fear (often the same thing).\nPosition 10 (Outcome): The likely outcome given the current trajectory.",
      },
      {
        type: "text",
        title: "Reading the Celtic Cross as a Story",
        body: "The power of the Celtic Cross is narrative. Positions 3-4-5-6 create a timeline from past to future. Positions 7-8 reveal the interplay between inner and outer worlds. Position 9 often holds the psychological key — the fear that is creating the obstacle.\n\nBegin by reading the center cross (1-2) as the core drama. Then expand to the timeline. Finally, read the staff (7-10) as the deeper psychological and environmental context. The outcome card (10) is not fixed — it reflects the most likely trajectory given everything else in the spread.",
      },
      { type: "callout", style: "tip", body: "Do not try to memorize positions mechanically. Think of the Celtic Cross as a story with a beginning (foundation), a conflict (crossing card), a journey (timeline), and a resolution (outcome). Stories stick in memory better than lists." },
    ],
    minutes: 20,
    takeaway: "The Celtic Cross tells a complete story in 10 cards. Master its narrative structure — past through future, inner through outer — and you have a framework for answering any question.",
  },

  "three-card-spread": {
    sections: [
      {
        type: "text",
        title: "The Three-Card Spread: Elegant Simplicity",
        body: "The three-card spread is the most versatile layout in tarot. With just three positions, it can address virtually any question with clarity and focus. Its simplicity is its strength — there is nowhere to hide in three cards.\n\nThe most common layout is past, present, future — but the three-card spread can be adapted to: situation/action/outcome, mind/body/spirit, what to do/what not to do/potential result, or any other three-part framework you design.",
      },
      {
        type: "text",
        title: "How to Read Three Cards Together",
        body: "The magic of the three-card spread is in the relationships between cards, not the individual meanings. Look for: do the cards tell a story when read left to right? Is there a shift in energy or suit? Does one card seem to resolve the tension created by another?\n\nAlso notice what is missing. If all three cards are Cups, the situation is entirely emotional — the mind (Swords) and action (Wands) are absent. If all three are Major Arcana, the situation carries significant weight. The presence and absence of suits tells you as much as the individual cards.",
      },
      {
        type: "text",
        title: "Variations and Custom Frameworks",
        body: "The beauty of three cards is their adaptability. For a relationship question, try: what I bring/what they bring/what we create together. For a career decision: what I gain/what I lose/what I learn. For morning guidance: what to embrace/what to release/what to watch for.\n\nDesigning your own three-card framework is one of the most valuable tarot skills. It teaches you to think in positions — to break any question into its essential components.",
      },
      { type: "callout", style: "tip", body: "When in doubt, pull three cards. The three-card spread is your everyday workhorse. Practice it daily and it will become as natural as thinking in sentences." },
    ],
    minutes: 12,
    takeaway: "The three-card spread is the most adaptable tool in your tarot practice. Its simplicity forces clarity, and its flexibility makes it useful for any question.",
  },

  "creating-custom-spreads": {
    sections: [
      {
        type: "text",
        title: "Designing Spreads That Answer Your Question",
        body: "Every tarot spread is essentially a set of questions arranged spatially. The Celtic Cross asks 10 specific questions. A three-card spread asks three. When you learn to design your own spreads, you unlock the ability to get precise answers to any question you can articulate.\n\nThe design process starts with the question. What do you actually need to know? Break the question into its component parts. Each component becomes a card position.",
      },
      {
        type: "text",
        title: "Principles of Spread Design",
        body: "Keep these principles in mind when creating custom spreads:\n\nClarity of positions: Each position should ask one specific thing. 'The energy around my situation' is vague. 'What I am not seeing about my finances' is specific.\n\nLogical flow: Arrange positions so they build on each other. A spread about a decision might flow: the situation, option A, option B, the hidden factor, the advice.\n\nSpatial meaning: The physical layout can add meaning. Cards placed higher represent conscious or aspirational themes. Cards below represent subconscious or foundational themes. Cards to the left are past; to the right, future.\n\nSize appropriateness: Match the number of cards to the complexity of the question. A simple daily query needs one to three cards. A life transition might need seven to twelve.",
      },
      {
        type: "text",
        title: "Examples of Custom Spreads",
        body: "The Crossroads Spread (5 cards): Where I am now / Path A outcome / Path B outcome / What I am not considering / The advice.\n\nThe Mirror Spread (4 cards): How I see myself / How others see me / What is true about both / What I need to accept.\n\nThe Season Ahead (4 cards): What is ending / What is beginning / What to nurture / What to release.\n\nCreate spreads that match your life. The more specific the positions, the more useful the reading.",
      },
      { type: "callout", style: "tip", body: "Keep a spread journal. When you design a layout that works well, record it. Over time, you will build a personal library of custom spreads tailored to the questions you care about most." },
    ],
    minutes: 12,
    takeaway: "Custom spread design is the bridge between knowing tarot and truly using it. When you can break any question into positions, tarot becomes a precision tool for any situation.",
  },

  "relationship-spread": {
    sections: [
      {
        type: "text",
        title: "The Relationship Spread: Seeing Both Sides",
        body: "Relationship spreads are specifically designed to examine the dynamics between two people. Unlike a general spread that focuses on one person's perspective, a relationship layout gives voice to both sides — and reveals the hidden energy between them.\n\nThe most common relationship spread uses a mirrored structure: cards for Person A on one side, cards for Person B on the other, and cards in the center representing the relationship itself.",
      },
      {
        type: "text",
        title: "A Seven-Card Relationship Layout",
        body: "Position 1: How Person A feels about the relationship.\nPosition 2: How Person B feels about the relationship.\nPosition 3: What Person A brings (gifts, strengths).\nPosition 4: What Person B brings (gifts, strengths).\nPosition 5: The challenge between them (what creates friction).\nPosition 6: The foundation (what holds them together).\nPosition 7: The potential (where the relationship can grow).\n\nThis layout respects both perspectives while revealing the dynamic field between them. It is particularly powerful for couples seeking to understand recurring patterns.",
      },
      {
        type: "text",
        title: "Ethical Considerations",
        body: "Relationship readings carry special ethical weight. When reading about another person, remember that you are seeing their energy through the lens of the cards — not reading their mind. Frame insights as patterns and possibilities, not certainties about the other person's intentions.\n\nNever use tarot to justify controlling behavior. If a reading reveals that a partner is 'pulling away,' the ethical response is to examine your own needs and communication — not to manipulate the situation. Tarot reveals truth; what you do with that truth is your responsibility.",
      },
      { type: "callout", style: "warning", body: "Relationship readings can be emotionally charged. If you are reading for yourself about a relationship, be aware that your own desires and fears will color your interpretation. Consider having a trusted reader do the reading for you." },
    ],
    minutes: 12,
    takeaway: "Relationship spreads give voice to both sides of a dynamic, revealing what each person brings and what the relationship itself needs to grow.",
  },

  "year-ahead-spread": {
    sections: [
      {
        type: "text",
        title: "The Year Ahead Spread: 12 Cards for 12 Months",
        body: "The Year Ahead spread is a powerful forecasting tool that maps one card to each month of the coming year. It provides a bird's eye view of the themes, challenges, and opportunities that will unfold across your timeline.\n\nThis spread is traditionally done on or near your birthday, New Year's, or the start of a significant new chapter. It works best when approached as a map — not a fixed prediction, but a guide to the terrain ahead.",
      },
      {
        type: "text",
        title: "How to Read the Year Ahead",
        body: "Lay 12 cards in a clock-like circle, one for each month. Read each card as the dominant theme or energy of that month. Some months will carry challenging cards — these are not things to dread, but themes to prepare for.\n\nAfter reading each card individually, look for patterns. Are there clusters of one suit? That element dominates a season of your life. Do Major Arcana cards appear in specific months? Those are the turning points. Is there a progression or story arc across the year?\n\nSome readers add a 13th card in the center as the overarching theme of the entire year. This single card becomes the lens through which all 12 months are understood.",
      },
      {
        type: "text",
        title: "Using the Year Ahead Spread Throughout the Year",
        body: "The Year Ahead spread is most valuable when revisited monthly. At the start of each month, return to the card for that month. Does it resonate with what is happening? Has the theme manifested in an unexpected way?\n\nKeep a journal alongside the spread. At the end of the year, review your journal entries against the original spread. This practice builds your confidence in tarot as a forecasting tool and deepens your understanding of how cards manifest in real life.",
      },
      { type: "callout", style: "tip", body: "Photograph your Year Ahead spread and keep it somewhere accessible. Returning to it monthly transforms a single reading into a year-long dialogue with your cards." },
    ],
    minutes: 15,
    takeaway: "The Year Ahead spread provides a map of coming themes, not fixed predictions. Its greatest value comes from revisiting it monthly and tracking how the energy unfolds.",
  },

  "single-card-pull": {
    sections: [
      {
        type: "text",
        title: "The Daily Single Card: Foundation of Practice",
        body: "The single card pull is the most underestimated practice in tarot. Beginners rush past it toward complex spreads, not realizing that the daily single card is where real mastery is built. One card, drawn each morning, becomes your lens for the day — not a prediction of what will happen, but a framework for how to pay attention.\n\nThe single card is not simple. It is the opposite of simple. When you pull one card, there is nowhere to hide. No surrounding cards to add context or soften the message. You must go DEEP into that single archetype — its imagery, its traditional meaning, its emotional resonance, and its specific relevance to your life right now.",
      },
      {
        type: "text",
        title: "The Practice: Image Before Meaning",
        body: "Draw one card each morning. Before you reach for any book or app, sit with the image. Look at the colors, the figures, the landscape. Notice your emotional response — do you feel relief, anxiety, curiosity, dread? These initial reactions are data. They tell you something about your current state and your relationship with the archetype the card represents.\n\nAfter sitting with the image for at least one full minute, write down your impression. What do you think this card is telling you today? Only then consult a reference. Compare your intuitive reading with the traditional meaning. Over weeks and months, you will find that your first impressions become increasingly accurate — and increasingly personal.",
      },
      {
        type: "text",
        title: "Building a Personal Vocabulary",
        body: "The single card practice, maintained over months, builds something no book can give you: a personal relationship with each of the 78 cards. After pulling the Three of Cups fifteen times across a year, you will know that card in a way that goes beyond any printed definition. You will have lived it — felt its energy on days of celebration and on quiet Tuesday mornings when its message was subtler.\n\nKeep a single card journal. Date each entry, note the card, record your impression, and at the end of the day add a brief note about what actually happened. Over time, this journal becomes the most valuable tarot reference you own — because it is written in the language of your own life.",
      },
      { type: "callout", style: "tip", body: "Further Reading: 'Seventy-Eight Degrees of Wisdom' by Rachel Pollack — the most beloved card-by-card guide for deepening your relationship with individual archetypes. 'Tarot for Your Self' by Mary K. Greer — excellent daily practice frameworks." },
    ],
    minutes: 12,
    takeaway: "The daily single card pull is the foundation of tarot mastery. One card demands depth, builds personal vocabulary with each archetype, and develops intuition through consistent practice.",
  },

  "five-card-cross": {
    sections: [
      {
        type: "text",
        title: "The Five-Card Cross: Focused Depth",
        body: "The five-card cross occupies the sweet spot between the simplicity of three cards and the complexity of the Celtic Cross. With five positions arranged in a cross pattern, it provides enough structure to explore a situation thoroughly while remaining focused enough to avoid information overload.\n\nThis layout is ideal for specific situations — a decision, a relationship dynamic, a project — where you need more context than three cards provide but do not need the full narrative arc of ten.",
      },
      {
        type: "text",
        title: "The Five Positions",
        body: "Center card: The heart of the matter — what the situation is really about at its core. This is the card you read first and return to last, because everything else orbits around it.\n\nLeft card: Past influence — what has led to this moment. The energy, event, or pattern that set the current situation in motion. This card explains how you got here.\n\nRight card: Future influence — where the energy is heading if the current trajectory continues. Not a fixed prediction but a likely direction based on present momentum.\n\nTop card: Conscious aspiration — what you are aware of wanting, hoping for, or working toward. This represents the surface level of the situation, the part you can articulate.\n\nBottom card: Subconscious foundation — what underlies the situation at a level you may not be fully aware of. This card often holds the key to the reading, revealing hidden motivations, fears, or truths that shape the situation from below.",
      },
      {
        type: "text",
        title: "Reading the Cross as a Whole",
        body: "The power of the five-card cross is in its spatial logic. The horizontal axis (left-center-right) tells a story through time: past, present, future. The vertical axis (bottom-center-top) reveals the depth structure: subconscious, conscious situation, conscious aspiration.\n\nStart with the center card to establish the core theme. Then read the horizontal timeline for the narrative. Finally, read the vertical axis for the depth — and pay special attention to the bottom card. If the subconscious foundation contradicts the conscious aspiration, that tension is where the real work lies.\n\nThis spread works beautifully for journal reflection. Pull five cards about a situation, read them, then return to the spread in a week. Often the bottom card's meaning becomes clear only in retrospect.",
      },
      { type: "callout", style: "tip", body: "Further Reading: 'Tarot for Your Self' by Mary K. Greer — offers multiple five-card frameworks and excellent guidance on reading spatial relationships between card positions." },
    ],
    minutes: 12,
    takeaway: "The five-card cross balances depth and focus. Its spatial logic — timeline on the horizontal axis, depth on the vertical — makes it ideal for exploring specific situations.",
  },

  "astrological-spread": {
    sections: [
      {
        type: "text",
        title: "Twelve Cards, Twelve Houses: Bridging Two Systems",
        body: "The astrological spread maps one tarot card to each of the twelve astrological houses, creating a direct bridge between the two symbolic systems. Card 1 corresponds to the 1st house (self and identity), Card 7 to the 7th house (partnerships), Card 10 to the 10th house (career and public life), and Card 12 to the 12th house (the subconscious and hidden patterns).\n\nThis is not a spread for focused questions — it is a spread for complete life overviews. When you want to see the full landscape of your life at a given moment, rather than drilling into a specific issue, the astrological spread provides a panoramic view that no other layout matches.",
      },
      {
        type: "text",
        title: "The Twelve Positions",
        body: "Card 1 (1st House): Self-image, physical presence, how you are showing up right now.\nCard 2 (2nd House): Money, values, self-worth, material resources.\nCard 3 (3rd House): Communication, siblings, local environment, daily thinking.\nCard 4 (4th House): Home, family, emotional foundation, roots.\nCard 5 (5th House): Creativity, romance, children, joy, self-expression.\nCard 6 (6th House): Health, daily routines, work, service.\nCard 7 (7th House): Partnerships, marriage, significant others, open enemies.\nCard 8 (8th House): Shared resources, transformation, sexuality, death and rebirth.\nCard 9 (9th House): Higher education, travel, philosophy, meaning-making.\nCard 10 (10th House): Career, public reputation, achievement, authority.\nCard 11 (11th House): Friends, groups, hopes, community, social ideals.\nCard 12 (12th House): The unconscious, hidden patterns, spirituality, self-undoing.",
      },
      {
        type: "text",
        title: "How to Use the Astrological Spread",
        body: "Lay the cards in a circle, mimicking the astrological wheel. Read each card in the context of its house — the Six of Pentacles in the 2nd house means something very different from the Six of Pentacles in the 7th house. In the 2nd, it speaks to generosity with material resources. In the 7th, it speaks to balance and reciprocity in partnership.\n\nAfter reading each position individually, look for patterns. Are there Major Arcana concentrated in certain houses? Those are the areas of greatest significance right now. Is one element dominant? That tells you which dimension of life is most active. Are the 'difficult' cards clustered together? That might reveal where a life challenge is centered.\n\nThis spread pairs powerfully with a natal chart reading. Lay the astrological spread alongside your birth chart and compare: does the tarot echo the chart's themes? Does it add something the chart alone does not show?",
      },
      { type: "callout", style: "tip", body: "Further Reading: 'Seventy-Eight Degrees of Wisdom' by Rachel Pollack — for deepening your understanding of individual cards as they appear in house-based positions. Understanding both systems enriches each one." },
    ],
    minutes: 18,
    takeaway: "The astrological spread provides a complete life overview by mapping 12 cards to the 12 astrological houses. It bridges tarot and astrology directly and works best for panoramic life readings.",
  },

  "tree-of-life-spread": {
    sections: [
      {
        type: "text",
        title: "The Deepest Spread: 10 Cards on the Tree of Life",
        body: "The Tree of Life spread maps 10 tarot cards to the 10 Sephiroth of the Kabbalistic Tree of Life — the central diagram of Western esoteric tradition. Each Sephirah represents a specific level of consciousness, from the divine source (Kether) to physical manifestation (Malkuth). This is the most philosophically profound spread in tarot, connecting each card to a cosmic principle rather than a mundane life area.\n\nIsrael Regardie's 'A Garden of Pomegranates' provides the foundational understanding of the Tree that makes this spread meaningful. Without at least basic familiarity with the Sephiroth, the spread becomes an arbitrary arrangement of ten cards. With that knowledge, it becomes a meditation on the structure of consciousness itself.",
      },
      {
        type: "text",
        title: "The Ten Positions",
        body: "Position 1 — Kether (Crown): Divine will, highest spiritual aspiration, the ultimate purpose behind the reading's question. This card reveals what the universe intends, beyond personal desire.\n\nPosition 2 — Chokmah (Wisdom): The first creative impulse, raw dynamic energy, the father principle. What force is driving the situation forward.\n\nPosition 3 — Binah (Understanding): Form, structure, the mother principle, necessary limitation. What is giving the situation shape and boundary.\n\nPosition 4 — Chesed (Mercy): Expansion, generosity, abundance, benevolence. Where grace and opportunity exist in the situation.\n\nPosition 5 — Geburah (Severity): Discipline, cutting away, necessary destruction, strength through restriction. What must be confronted or eliminated.\n\nPosition 6 — Tiphareth (Beauty): Harmony, the heart center, the balance point. The core truth of the situation, stripped of excess.\n\nPosition 7 — Netzach (Victory): Emotion, desire, the drive toward connection and beauty. The feeling dimension of the situation.\n\nPosition 8 — Hod (Splendor): Intellect, communication, analysis, strategy. The thinking dimension of the situation.\n\nPosition 9 — Yesod (Foundation): The unconscious, dreams, instinct, the astral plane. What operates beneath awareness and shapes the situation invisibly.\n\nPosition 10 — Malkuth (Kingdom): Physical manifestation, the material world, the final outcome in concrete reality.",
      },
      {
        type: "text",
        title: "Working with the Tree",
        body: "The Tree of Life spread is not for casual use. It is a contemplative practice best suited for deep questions about spiritual direction, life purpose, or psychological integration. The spread works best when you already have familiarity with Kabbalistic concepts and can sit with each card's position as a meditation.\n\nRead the Tree in three triads. The Supernal Triad (Kether, Chokmah, Binah) represents the highest level — divine intention and cosmic framework. The Ethical Triad (Chesed, Geburah, Tiphareth) represents the moral and psychological level — how the situation unfolds through the interplay of expansion and restriction. The Astral Triad (Netzach, Hod, Yesod) represents the emotional-intellectual-instinctual level — the inner world that generates outer reality. Malkuth at the base receives and manifests everything above it.\n\nCompare the card at Kether with the card at Malkuth. The relationship between divine intention (top) and physical manifestation (bottom) often reveals the central message of the entire spread.",
      },
      { type: "callout", style: "tip", body: "Further Reading: 'A Garden of Pomegranates' by Israel Regardie — the essential primer on the Kabbalistic Tree of Life. 'The Qabalistic Tarot' by Robert Wang — specifically connects tarot to the Tree with scholarly precision." },
    ],
    minutes: 20,
    takeaway: "The Tree of Life spread maps 10 cards to the 10 Sephiroth, connecting tarot to the deepest structural framework of Western esoteric tradition. It is a meditation on consciousness itself.",
  },

  "chakra-spread": {
    sections: [
      {
        type: "text",
        title: "Seven Cards, Seven Energy Centers",
        body: "The chakra spread uses seven cards, one for each of the major energy centers recognized in Hindu and yogic tradition. From the root chakra at the base of the spine to the crown chakra at the top of the head, each center governs a specific dimension of human experience. This spread provides a holistic body-mind-spirit diagnostic, revealing where energy flows freely and where it is blocked.\n\nLay the seven cards in a vertical line from bottom to top, mirroring the body's energy column. The reading moves upward through increasingly subtle dimensions of experience — from physical survival to spiritual transcendence.",
      },
      {
        type: "text",
        title: "The Seven Positions",
        body: "Card 1 — Root (Muladhara): Security, survival, grounding, physical safety. This card reveals your relationship to basic stability — financial security, housing, health, the sense of having a right to exist. A challenging card here suggests foundational anxiety that affects everything above it.\n\nCard 2 — Sacral (Svadhisthana): Creativity, sexuality, pleasure, emotional flow. This card shows how freely you allow yourself to feel, create, and experience pleasure without guilt.\n\nCard 3 — Solar Plexus (Manipura): Personal power, confidence, will, identity. This card reveals your sense of agency — whether you feel empowered to act on your own behalf or diminished by circumstances.\n\nCard 4 — Heart (Anahata): Love, compassion, connection, forgiveness. The heart card is the bridge between lower (physical) and upper (spiritual) chakras. It shows your capacity to give and receive love.\n\nCard 5 — Throat (Vishuddha): Communication, truth, authentic expression. This card reveals whether you are speaking your truth or suppressing it.\n\nCard 6 — Third Eye (Ajna): Intuition, insight, vision, inner knowing. This card shows the state of your intuitive faculties — whether you trust your inner guidance or second-guess it.\n\nCard 7 — Crown (Sahasrara): Spiritual connection, divine awareness, transcendence. This card reveals your relationship to meaning, purpose, and the sacred — however you define it.",
      },
      {
        type: "text",
        title: "Reading the Energy Column",
        body: "The chakra spread is most powerful when read as a complete system rather than seven separate readings. Energy flows upward — blocks in lower chakras affect everything above. If the root card shows instability, even a beautiful crown card may represent spiritual bypassing rather than genuine transcendence.\n\nLook for the break point: where does the energy shift from flowing to blocked? A reading with strong lower chakras and challenging upper chakras suggests someone well-grounded who needs to develop their intuitive or spiritual life. The reverse — strong upper chakras with a weak root — suggests someone spiritually developed who needs to attend to material foundations.\n\nThe heart card (position 4) deserves special attention as the integration point. When the heart card is strong, it bridges the physical and spiritual dimensions. When it is challenged, the lower and upper halves of the person's life may feel disconnected.",
      },
      { type: "callout", style: "tip", body: "Further Reading: 'Tarot for Your Self' by Mary K. Greer — includes body-based spreads and exercises that complement the chakra approach. 'Eastern Body, Western Mind' by Anodea Judith — the definitive bridge between chakra psychology and Western therapeutic practice." },
    ],
    minutes: 15,
    takeaway: "The chakra spread provides a holistic body-mind-spirit diagnostic. Reading the seven cards as an interconnected energy system reveals where life force flows freely and where it needs attention.",
  },

  "karmic-spread": {
    sections: [
      {
        type: "text",
        title: "Reading the Soul's Ledger",
        body: "The karmic spread uses the concept of the Lunar Nodes — the points where the Moon's orbit crosses the ecliptic — as its philosophical foundation. In astrology, the South Node represents past life patterns, ingrained habits, and karmic debts carried forward. The North Node represents the soul's evolutionary direction, the lessons to be learned, and the gifts that emerge through growth.\n\nThis five-card spread translates that nodal framework into tarot, creating a reading that addresses not just present circumstances but the deeper soul-level patterns that shape them.",
      },
      {
        type: "text",
        title: "The Five Positions",
        body: "Card 1 — Past Life Lesson: The dominant theme or pattern carried from previous experience (whether you interpret 'past life' literally or as deep unconscious patterning). This card reveals what you already know too well — the default behavior, the comfort zone, the skill that has become a crutch.\n\nCard 2 — Karmic Debt: What was left unresolved, unhealed, or unbalanced. This is the energetic debt you carry — not as punishment but as unfinished business. It might manifest as a recurring relationship pattern, a persistent fear, or a situation that keeps repeating until its lesson is absorbed.\n\nCard 3 — Present Life Purpose: The soul's intention for this incarnation. This card points toward what you are here to develop, create, or contribute — the North Node direction in tarot language.\n\nCard 4 — The Challenge: The specific obstacle that stands between the karmic pattern and its resolution. This is often the most uncomfortable card in the spread because it names the growth edge — the thing you must face rather than avoid.\n\nCard 5 — The Gift: What emerges when the karma is resolved. This card reveals the wisdom, strength, or capacity that becomes available when the old pattern is integrated rather than repeated. This is not a reward — it is the natural result of doing the work.",
      },
      {
        type: "text",
        title: "Working with Karmic Readings",
        body: "The karmic spread is not for the faint-hearted. It asks you to look at patterns you may have been avoiding for years — or lifetimes, depending on your framework. Approach it with honesty and self-compassion.\n\nPay special attention to the relationship between Card 1 (past life lesson) and Card 3 (present life purpose). These two cards often reveal a polarity: the past life lesson is what you do too easily; the present life purpose is what challenges you. Growth lies in moving from one toward the other — not abandoning the past but integrating it into a larger purpose.\n\nThe Challenge card (position 4) deserves careful, compassionate reading. It is not a verdict but a direction. If the Tower appears here, the challenge is accepting necessary destruction. If the Three of Swords appears, the challenge is moving through grief rather than around it. Every challenge card contains within it the instructions for its own resolution.\n\nRevisit this spread annually or at major life transitions. The karmic pattern may remain consistent while your relationship to it evolves.",
      },
      { type: "callout", style: "tip", body: "Further Reading: 'The Astrology of Fate' by Liz Greene — her exploration of fate, karma, and the Lunar Nodes provides the philosophical depth this spread requires. 'Tarot for Your Self' by Mary K. Greer — includes past-life reading techniques that complement the karmic spread." },
    ],
    minutes: 15,
    takeaway: "The karmic spread maps past patterns, present purpose, and future gifts through five cards grounded in the Lunar Node framework. It addresses the soul-level patterns that shape recurring life themes.",
  },
};

// ─── Additional slug aliases ───

const SLUG_MAP: Record<string, string> = {
  // Synastry aliases
  "venus-mars-dynamics": "venus-mars-attraction",
  "mercury-aspects-communication": "sun-moon-bond",
};

/**
 * Generate synastry or spread educational content.
 * Returns null if the lesson slug does not match.
 */
export function generateSynastrySpreadContent(
  lessonSlug: string,
): LessonContent | null {
  // Direct match in synastry content
  const synastryData = SYNASTRY_CONTENT[lessonSlug];
  if (synastryData) {
    return {
      sections: synastryData.sections,
      estimatedMinutes: synastryData.minutes,
      keyTakeaway: synastryData.takeaway,
    };
  }

  // Direct match in spread content
  const spreadData = SPREAD_CONTENT[lessonSlug];
  if (spreadData) {
    return {
      sections: spreadData.sections,
      estimatedMinutes: spreadData.minutes,
      keyTakeaway: spreadData.takeaway,
    };
  }

  // Alias match
  const aliasedSlug = SLUG_MAP[lessonSlug];
  if (aliasedSlug) {
    const aliasData = SYNASTRY_CONTENT[aliasedSlug] || SPREAD_CONTENT[aliasedSlug];
    if (aliasData) {
      return {
        sections: aliasData.sections,
        estimatedMinutes: aliasData.minutes,
        keyTakeaway: aliasData.takeaway,
      };
    }
  }

  return null;
}
