"use client";

import React, { useState } from "react";

/**
 * FoolsJourneyMap — The 22-card Major Arcana story path.
 *
 * AHA moment: "The Major Arcana isn't random — it's a STORY.
 * The Fool's Journey from innocence (0) to enlightenment (21)
 * mirrors every human life's spiritual arc."
 *
 * - Visual path with 22 stops
 * - Three acts: Conscious (0-7), Subconscious (8-14), Superconscious (15-21)
 * - Tap a card to see its role in the journey narrative
 * - Progressive unlock: each card's story builds on the previous
 */

interface JourneyCard {
  number: number;
  name: string;
  glyph: string;
  role: string;          // one-line story role
  narrative: string;     // how it connects to the journey
  act: 1 | 2 | 3;
  theme: string;
}

const JOURNEY: JourneyCard[] = [
  { number: 0,  name: "The Fool",           glyph: "0",    act: 1, theme: "Beginning",
    role: "The innocent traveler steps off the cliff",
    narrative: "Every journey begins with a leap of faith. The Fool is you at the start — full of potential, carrying nothing but trust. The number 0 is not emptiness; it's infinite possibility. The entire Major Arcana is this one soul's story, unfolding.",
  },
  { number: 1,  name: "The Magician",       glyph: "I",    act: 1, theme: "Will",
    role: "Discovery of personal power",
    narrative: "The Fool discovers they have tools. Four elements appear on the table — wands, cups, swords, pentacles. For the first time, intention meets ability. 'I can create.' This is the first awakening of conscious will.",
  },
  { number: 2,  name: "The High Priestess", glyph: "II",   act: 1, theme: "Intuition",
    role: "The inner world reveals itself",
    narrative: "After discovering outward power, the Fool encounters the mystery within. The High Priestess guards the threshold between conscious and unconscious. She whispers: 'Not everything can be willed into being. Some things must be received in silence.'",
  },
  { number: 3,  name: "The Empress",        glyph: "III",  act: 1, theme: "Creation",
    role: "Abundance and nurturing emerge",
    narrative: "The Fool learns to create, to nurture, to receive pleasure. The Empress is the first experience of abundance — love, beauty, sensuality, the overflowing goodness of being alive. Mother Earth in all her generosity.",
  },
  { number: 4,  name: "The Emperor",        glyph: "IV",   act: 1, theme: "Structure",
    role: "Order is imposed on chaos",
    narrative: "But abundance without structure breeds chaos. The Emperor introduces law, discipline, and authority. The Fool learns that freedom requires boundaries. Power must be wielded responsibly. This is the father principle.",
  },
  { number: 5,  name: "The Hierophant",     glyph: "V",    act: 1, theme: "Tradition",
    role: "Joining a larger system of meaning",
    narrative: "The Fool seeks a teacher, a tradition, a moral compass beyond the self. The Hierophant represents all the wisdom that came before — religion, education, mentorship. Before you can break the rules, you must understand why they exist.",
  },
  { number: 6,  name: "The Lovers",         glyph: "VI",   act: 1, theme: "Choice",
    role: "The first great choice of the heart",
    narrative: "Now comes the first truly personal choice. Not inherited structure or received wisdom — YOUR choice. The Lovers isn't just about romance; it's about alignment. Choosing what you value, what you commit to, what defines you. Identity crystallizes through choice.",
  },
  { number: 7,  name: "The Chariot",        glyph: "VII",  act: 1, theme: "Victory",
    role: "Willpower conquers the outer world",
    narrative: "Armed with identity, the Fool charges forward. The Chariot is triumph through pure determination. Act I ends with a victory — the ego has mastered the material world. But mastery of the outer world is not wisdom. Deeper challenges await.",
  },
  { number: 8,  name: "Strength",           glyph: "VIII", act: 2, theme: "Inner Power",
    role: "Mastering the beast within",
    narrative: "Act II begins with a different kind of power. Not force — gentleness. The lion doesn't need to be killed; it needs to be befriended. Strength teaches that real power is patience, compassion, and the courage to face your own shadow.",
  },
  { number: 9,  name: "The Hermit",         glyph: "IX",   act: 2, theme: "Solitude",
    role: "Withdrawing to find inner truth",
    narrative: "The Fool retreats from the world. After outer victory and inner reckoning, solitude becomes necessary. The Hermit carries a lantern — the light of hard-won wisdom. Some truths can only be found alone on the mountain.",
  },
  { number: 10, name: "Wheel of Fortune",   glyph: "X",    act: 2, theme: "Fate",
    role: "Understanding cycles and karma",
    narrative: "The Hermit's meditation reveals the great pattern: everything cycles. Fortune rises and falls not by merit but by the turning of a cosmic wheel. The Fool learns humility before fate. What goes up must come down — and will rise again.",
  },
  { number: 11, name: "Justice",            glyph: "XI",   act: 2, theme: "Truth",
    role: "Facing consequences with clarity",
    narrative: "The wheel's turning demands accountability. Justice holds the scales and the sword — truth must be weighed, and consequences accepted. Every choice from Act I now presents its bill. Karmic balance is not punishment; it's precision.",
  },
  { number: 12, name: "The Hanged Man",     glyph: "XII",  act: 2, theme: "Surrender",
    role: "Surrendering control to gain wisdom",
    narrative: "The most paradoxical card. The Fool hangs upside down — voluntarily. And from this inverted perspective, everything looks different. Sacrifice leads to insight. Letting go of control is itself a form of mastery. The ego must die before the soul can see.",
  },
  { number: 13, name: "Death",              glyph: "XIII", act: 2, theme: "Transformation",
    role: "The old self must die for the new to be born",
    narrative: "Not physical death — the death of who you were. Everything that served you in Act I is stripped away. Relationships, beliefs, identity. It's terrifying and irreversible. But the Fool learns: transformation requires total release. You cannot carry the old into the new.",
  },
  { number: 14, name: "Temperance",         glyph: "XIV",  act: 2, theme: "Integration",
    role: "Healing and alchemical balance",
    narrative: "After Death's devastation comes the angel of healing. Temperance pours between two cups — mixing opposites into something new. Fire and water, conscious and unconscious, old self and new self. Act II ends with integration. The Fool is no longer who they were, but not yet who they will become.",
  },
  { number: 15, name: "The Devil",          glyph: "XV",   act: 3, theme: "Shadow",
    role: "Confronting bondage and illusion",
    narrative: "Act III opens with the darkest card. The Devil reveals the chains you forged yourself — addictions, fears, toxic patterns you chose. The terrifying truth: the chains are loose. You could remove them at any time. Bondage is an illusion of your own making.",
  },
  { number: 16, name: "The Tower",          glyph: "XVI",  act: 3, theme: "Destruction",
    role: "False structures shattered by lightning",
    narrative: "Once the illusion is seen, the false structure must fall. The Tower is sudden, violent, liberating destruction. Everything built on lies collapses. It's the most feared card — and the most necessary. You cannot build truth on a false foundation.",
  },
  { number: 17, name: "The Star",           glyph: "XVII", act: 3, theme: "Hope",
    role: "Naked hope under the infinite sky",
    narrative: "After the Tower's devastation, the sky clears. The Star kneels naked by the water, pouring hope back into the earth. No armor, no pretense — just pure, vulnerable faith that life is worth living. This is the first genuine spiritual experience.",
  },
  { number: 18, name: "The Moon",           glyph: "XVIII",act: 3, theme: "Illusion",
    role: "Navigating the unconscious depths",
    narrative: "But the path isn't clear yet. The Moon casts confusing light — shadows, fears, projections. The Fool must travel through the unconscious without a map. Anxiety and intuition are indistinguishable here. The only way out is through.",
  },
  { number: 19, name: "The Sun",            glyph: "XIX",  act: 3, theme: "Joy",
    role: "Pure radiant consciousness",
    narrative: "Dawn breaks. After the Moon's darkness, the Sun brings total clarity, joy, and vitality. The child rides freely — not the naive innocence of The Fool, but earned innocence. Joy that has passed through suffering and emerged radiant.",
  },
  { number: 20, name: "Judgement",          glyph: "XX",   act: 3, theme: "Calling",
    role: "Answering the cosmic call",
    narrative: "The trumpet sounds. Every version of yourself — past, present, possible — rises to be seen. Judgement is the moment of total self-awareness, where you understand why everything happened as it did. Your purpose becomes clear. You answer the call.",
  },
  { number: 21, name: "The World",          glyph: "XXI",  act: 3, theme: "Completion",
    role: "The dance of wholeness",
    narrative: "The journey is complete. The World dancer floats within the wreath of accomplishment, holding the wands of mastery. All four elements are balanced. The Fool has become The World — not by escaping life, but by embracing every part of it. And then... the cycle begins again.",
  },
];

const ACT_INFO = [
  { name: "Act I: The Conscious World", range: "0-VII", color: "#D4AF37", desc: "Discovering the outer world — identity, power, choice" },
  { name: "Act II: The Subconscious", range: "VIII-XIV", color: "#7B68EE", desc: "Turning inward — shadow, surrender, transformation" },
  { name: "Act III: The Superconscious", range: "XV-XXI", color: "#4ECDC4", desc: "Spiritual awakening — destruction, hope, wholeness" },
];

export default function FoolsJourneyMap() {
  const [selected, setSelected] = useState<number | null>(null);
  const [actFilter, setActFilter] = useState<1 | 2 | 3 | null>(null);

  const selectedCard = selected !== null ? JOURNEY[selected] : null;

  const filteredCards = actFilter ? JOURNEY.filter(c => c.act === actFilter) : JOURNEY;

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {/* Act filter buttons */}
      <div style={{ display: "flex", gap: "0.3rem", justifyContent: "center", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        <button
          onClick={() => setActFilter(null)}
          style={{
            padding: "0.35rem 0.75rem", borderRadius: "100px", cursor: "pointer",
            background: actFilter === null ? "rgba(200,168,75,0.1)" : "rgba(232,230,240,0.03)",
            border: `1px solid ${actFilter === null ? "rgba(200,168,75,0.25)" : "rgba(200,185,255,0.06)"}`,
            color: actFilter === null ? "rgba(212,175,55,0.8)" : "rgba(180,170,210,0.4)",
            fontSize: "0.62rem", fontWeight: 500, letterSpacing: "0.04em",
            transition: "all 0.3s ease",
          }}
        >
          All 22 Cards
        </button>
        {ACT_INFO.map((act, i) => (
          <button
            key={i}
            onClick={() => setActFilter(actFilter === (i + 1) as 1|2|3 ? null : (i + 1) as 1|2|3)}
            style={{
              padding: "0.35rem 0.75rem", borderRadius: "100px", cursor: "pointer",
              background: actFilter === i + 1 ? `${act.color}15` : "rgba(232,230,240,0.03)",
              border: `1px solid ${actFilter === i + 1 ? `${act.color}30` : "rgba(200,185,255,0.06)"}`,
              color: actFilter === i + 1 ? act.color : "rgba(180,170,210,0.4)",
              fontSize: "0.62rem", fontWeight: 500, letterSpacing: "0.04em",
              transition: "all 0.3s ease",
            }}
          >
            {act.range}
          </button>
        ))}
      </div>

      {/* Act description */}
      {actFilter && (
        <div style={{
          textAlign: "center", marginBottom: "0.75rem",
          fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 300,
          color: "rgba(196,185,228,0.6)",
        }}>
          <span style={{ color: ACT_INFO[actFilter - 1].color, fontWeight: 500 }}>
            {ACT_INFO[actFilter - 1].name}
          </span>
          {" — "}{ACT_INFO[actFilter - 1].desc}
        </div>
      )}

      {/* Journey path — card stops */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(120px, 100%), 1fr))",
        gap: "0.35rem",
      }}>
        {filteredCards.map((card) => {
          const isSelected = selected === card.number;
          const actColor = ACT_INFO[card.act - 1].color;

          return (
            <button
              key={card.number}
              onClick={() => setSelected(isSelected ? null : card.number)}
              style={{
                padding: "0.6rem 0.5rem", borderRadius: "0.6rem",
                background: isSelected ? `${actColor}12` : "rgba(232,230,240,0.02)",
                border: `1px solid ${isSelected ? `${actColor}30` : "rgba(200,185,255,0.05)"}`,
                cursor: "pointer", textAlign: "center",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 600,
                color: isSelected ? actColor : `${actColor}50`,
                marginBottom: "0.15rem",
              }}>{card.glyph}</div>
              <div style={{
                fontFamily: "var(--font-body)", fontSize: "0.58rem", fontWeight: isSelected ? 500 : 300,
                color: isSelected ? "rgba(240,236,255,0.85)" : "rgba(180,170,210,0.45)",
                lineHeight: 1.3,
              }}>{card.name.replace("The ", "")}</div>
              <div style={{
                fontFamily: "var(--font-body)", fontSize: "0.42rem", fontWeight: 300,
                color: `${actColor}40`, marginTop: "0.15rem",
                letterSpacing: "0.04em",
              }}>{card.theme}</div>
            </button>
          );
        })}
      </div>

      {/* Selected card narrative */}
      {selectedCard && (
        <div style={{
          marginTop: "0.75rem", padding: "1.25rem", borderRadius: "0.75rem",
          background: `${ACT_INFO[selectedCard.act - 1].color}06`,
          border: `1px solid ${ACT_INFO[selectedCard.act - 1].color}15`,
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: "1.4rem", fontWeight: 700,
              color: `${ACT_INFO[selectedCard.act - 1].color}70`,
            }}>{selectedCard.glyph}</span>
            <div>
              <div style={{
                fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 500,
                color: "rgba(240,236,255,0.9)",
              }}>{selectedCard.name}</div>
              <div style={{
                fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 400,
                fontStyle: "italic",
                color: `${ACT_INFO[selectedCard.act - 1].color}80`,
              }}>
                {selectedCard.role}
              </div>
            </div>
          </div>

          {/* Act badge */}
          <div style={{
            display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "100px",
            background: `${ACT_INFO[selectedCard.act - 1].color}10`,
            border: `1px solid ${ACT_INFO[selectedCard.act - 1].color}20`,
            fontFamily: "var(--font-body)", fontSize: "0.52rem", fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: ACT_INFO[selectedCard.act - 1].color,
            marginBottom: "0.6rem",
          }}>
            {ACT_INFO[selectedCard.act - 1].name}
          </div>

          {/* Narrative */}
          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
            lineHeight: 1.8, color: "rgba(220,210,240,0.7)", margin: 0,
          }}>
            {selectedCard.narrative}
          </p>

          {/* Journey position */}
          <div style={{
            marginTop: "0.6rem", paddingTop: "0.5rem",
            borderTop: `1px solid ${ACT_INFO[selectedCard.act - 1].color}10`,
            display: "flex", justifyContent: "space-between",
            fontFamily: "var(--font-mono)", fontSize: "0.52rem",
            color: "rgba(180,170,210,0.3)",
          }}>
            <span>Card {selectedCard.number} of 21</span>
            <span>Theme: {selectedCard.theme}</span>
            {selectedCard.number < 21 && (
              <span
                onClick={(e) => { e.stopPropagation(); setSelected(selectedCard.number + 1); }}
                style={{ cursor: "pointer", color: `${ACT_INFO[selectedCard.act - 1].color}50` }}
              >
                Next: {JOURNEY[selectedCard.number + 1].name} →
              </span>
            )}
          </div>
        </div>
      )}

      {/* Journey insight (when no card selected) */}
      {!selectedCard && (
        <div style={{
          marginTop: "0.75rem", textAlign: "center",
          fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 300,
          fontStyle: "italic", color: "rgba(180,170,210,0.35)",
        }}>
          Tap any card to follow The Fool&apos;s journey from innocence to enlightenment
        </div>
      )}
    </div>
  );
}
