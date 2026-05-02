/**
 * Cosmos — Real-time celestial dashboard
 *
 * Shows: planet positions, moon phase, upcoming events, event library.
 * All computed client-side from astronomical algorithms.
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getAllPositions, getMoonPhase, type CelestialBody } from "../../lib/celestial";
import {
  getUpcomingEvents, getRecentEvents, EVENTS_2026, EVENT_TYPE_META,
  type AstroEvent,
} from "../../lib/astro-events";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const label: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
  letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(180,170,210,0.45)",
};

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(200,185,255,0.08)",
  borderRadius: "1rem",
  backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
};

function PlanetRow({ body }: { body: CelestialBody }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.75rem",
      padding: "0.6rem 0",
      borderBottom: "1px solid rgba(200,185,255,0.04)",
    }}>
      <span style={{ fontSize: "1.2rem", width: "28px", textAlign: "center" }}>{body.glyph}</span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: "var(--font-accent)", fontSize: "0.9rem", fontWeight: 500,
          color: "rgba(230,220,255,0.88)", letterSpacing: "0.04em",
        }}>{body.name}</div>
        <div style={{
          fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 300,
          color: "rgba(180,170,210,0.5)",
        }}>
          {body.signGlyph} {body.sign} {body.degree}°
          {body.retrograde && <span style={{ color: "rgba(232,82,74,0.7)", marginLeft: "0.4rem" }}>℞</span>}
        </div>
      </div>
      {/* Mini position bar */}
      <div style={{
        width: "60px", height: "3px", borderRadius: "2px",
        background: "rgba(255,255,255,0.04)", overflow: "hidden",
      }}>
        <div style={{
          width: `${(body.degree / 30) * 100}%`, height: "100%",
          background: "rgba(212,175,55,0.4)", borderRadius: "2px",
        }} />
      </div>
    </div>
  );
}

function EventCard({ event, onSelect }: { event: AstroEvent; onSelect: (e: AstroEvent) => void }) {
  const meta = EVENT_TYPE_META[event.type];
  const d = new Date(event.date + "T00:00:00");
  const month = d.toLocaleString("en", { month: "short" });
  const day = d.getDate();

  return (
    <button
      onClick={() => onSelect(event)}
      style={{
        ...glass,
        padding: "1rem",
        display: "flex", gap: "0.75rem", alignItems: "flex-start",
        width: "100%", textAlign: "left", cursor: "pointer",
        transition: `all 0.3s ${EASE}`,
        borderColor: `${meta.color}22`,
      }}
    >
      {/* Date badge */}
      <div style={{
        minWidth: "42px", textAlign: "center",
        padding: "0.3rem 0",
      }}>
        <div style={{
          fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 500,
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: "rgba(180,170,210,0.4)",
        }}>{month}</div>
        <div style={{
          fontFamily: "var(--font-accent)", fontSize: "1.3rem", fontWeight: 400,
          color: "rgba(240,236,255,0.85)",
        }}>{day}</div>
      </div>

      <div style={{ flex: 1 }}>
        {/* Type badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.3rem",
          padding: "0.15rem 0.5rem", borderRadius: "100px",
          background: `${meta.color}15`, border: `1px solid ${meta.color}20`,
          marginBottom: "0.4rem",
        }}>
          <span style={{ fontSize: "0.65rem" }}>{meta.emoji}</span>
          <span style={{
            fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 500,
            letterSpacing: "0.08em", textTransform: "uppercase", color: `${meta.color}99`,
          }}>{meta.label}</span>
        </div>

        <div style={{
          fontFamily: "var(--font-accent)", fontSize: "0.95rem", fontWeight: 500,
          color: "rgba(240,236,255,0.88)", letterSpacing: "0.02em",
          marginBottom: "0.25rem",
        }}>{event.title}</div>
        <div style={{
          fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 300,
          color: "rgba(196,185,228,0.55)", lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
        }}>{event.description}</div>

        {/* Intensity dots */}
        <div style={{ display: "flex", gap: "3px", marginTop: "0.4rem" }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              width: "4px", height: "4px", borderRadius: "50%",
              background: i <= event.intensity ? meta.color : "rgba(200,185,255,0.1)",
            }} />
          ))}
        </div>
      </div>
    </button>
  );
}

function EventDetail({ event, onClose }: { event: AstroEvent; onClose: () => void }) {
  const meta = EVENT_TYPE_META[event.type];
  const SIGN_ORDER = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ];
  const GLYPHS: Record<string, string> = {
    Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍",
    Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1.5rem",
      background: "rgba(4,2,13,0.8)",
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      overflowY: "auto",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        ...glass, maxWidth: "560px", width: "100%",
        padding: "2rem", maxHeight: "90vh", overflowY: "auto",
        border: `1px solid ${meta.color}22`,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
              padding: "0.2rem 0.6rem", borderRadius: "100px",
              background: `${meta.color}15`, border: `1px solid ${meta.color}25`,
              marginBottom: "0.5rem",
            }}>
              <span style={{ fontSize: "0.7rem" }}>{meta.emoji}</span>
              <span style={{
                fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
                letterSpacing: "0.1em", textTransform: "uppercase", color: `${meta.color}99`,
              }}>{meta.label} &middot; {event.date}</span>
            </div>
            <h2 style={{
              fontFamily: "var(--font-heading)", fontSize: "1.3rem", fontWeight: 400,
              color: "rgba(240,236,255,0.92)", margin: 0,
            }}>{event.title}</h2>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,185,255,0.1)",
            borderRadius: "50%", width: "32px", height: "32px", display: "flex",
            alignItems: "center", justifyContent: "center", color: "rgba(200,185,240,0.5)",
            cursor: "pointer", fontSize: "1rem",
          }}>&times;</button>
        </div>

        {/* Description */}
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 300,
          lineHeight: 1.75, color: "rgba(196,185,228,0.75)", margin: "0 0 1.5rem",
        }}>{event.description}</p>

        {/* Per-sign impacts */}
        <div style={{ ...label, marginBottom: "0.75rem" }}>Impact by Sign</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {SIGN_ORDER.map(sign => (
            <div key={sign} style={{
              display: "flex", gap: "0.6rem", padding: "0.6rem 0.75rem",
              borderRadius: "0.75rem",
              background: event.sign === sign ? `${meta.color}08` : "transparent",
              border: event.sign === sign ? `1px solid ${meta.color}15` : "1px solid transparent",
            }}>
              <span style={{ fontSize: "1rem", width: "24px", textAlign: "center", opacity: 0.6 }}>
                {GLYPHS[sign]}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "var(--font-accent)", fontSize: "0.8rem", fontWeight: 500,
                  color: "rgba(230,220,255,0.85)", marginBottom: "0.15rem",
                }}>{sign}</div>
                <div style={{
                  fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 300,
                  lineHeight: 1.6, color: "rgba(196,185,228,0.65)",
                }}>{event.impacts[sign]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CosmosPage() {
  const [mounted, setMounted] = useState(false);
  const [positions, setPositions] = useState<CelestialBody[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AstroEvent | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      setPositions(getAllPositions(new Date()));
    }, 0);

    // Update positions every minute
    const interval = setInterval(() => {
      setPositions(getAllPositions(new Date()));
    }, 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  if (!mounted) return null;

  const moonPhase = getMoonPhase(new Date());
  const upcoming = getUpcomingEvents(6);
  const recent = getRecentEvents(2);

  return (
    <div style={{
      minHeight: "100svh", position: "relative", zIndex: 1,
      maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem 4rem",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <Link href="/" style={{
          fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 400,
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: "rgba(180,170,210,0.4)", textDecoration: "none",
        }}>← Home</Link>
        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
          fontWeight: 400, marginTop: "0.75rem",
        }}>
          <span className="text-gold-gradient">The Living Cosmos</span>
        </h1>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
          color: "rgba(196,185,228,0.55)", marginTop: "0.4rem",
        }}>Real-time celestial positions and upcoming astrological events</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* ── LEFT: Planetary Positions ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Moon Phase Card */}
          <div style={{ ...glass, padding: "1.25rem" }}>
            <div style={{ ...label, marginBottom: "0.75rem" }}>Current Moon</div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "2.5rem" }}>{moonPhase.emoji}</span>
              <div>
                <div style={{
                  fontFamily: "var(--font-accent)", fontSize: "1.1rem", fontWeight: 500,
                  color: "rgba(240,236,255,0.9)",
                }}>{moonPhase.phase}</div>
                <div style={{
                  fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 300,
                  color: "rgba(180,170,210,0.5)",
                }}>{moonPhase.illumination}% illuminated &middot; Day {moonPhase.age}</div>
              </div>
            </div>
          </div>

          {/* Planet positions */}
          <div style={{ ...glass, padding: "1.25rem" }}>
            <div style={{ ...label, marginBottom: "0.5rem" }}>Planetary Positions — Live</div>
            {positions.map(body => (
              <PlanetRow key={body.name} body={body} />
            ))}
            <div style={{
              fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 300,
              color: "rgba(180,170,210,0.3)", marginTop: "0.75rem", textAlign: "center",
            }}>Updated in real-time &middot; Approximate positions (&plusmn;1-2°)</div>
          </div>
        </div>

        {/* ── RIGHT: Events ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Upcoming */}
          <div>
            <div style={{ ...label, marginBottom: "0.75rem" }}>Upcoming Events</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {upcoming.map(event => (
                <EventCard key={event.date + event.title} event={event} onSelect={setSelectedEvent} />
              ))}
            </div>
          </div>

          {/* Recent */}
          {recent.length > 0 && (
            <div>
              <div style={{ ...label, marginBottom: "0.75rem" }}>Recently Passed</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", opacity: 0.6 }}>
                {recent.map(event => (
                  <EventCard key={event.date + event.title} event={event} onSelect={setSelectedEvent} />
                ))}
              </div>
            </div>
          )}

          {/* Show all toggle */}
          <button
            onClick={() => setShowAll(!showAll)}
            style={{
              padding: "0.6rem 1.5rem", borderRadius: "100px",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,185,255,0.1)",
              color: "rgba(200,185,240,0.6)", fontFamily: "var(--font-body)",
              fontSize: "0.72rem", letterSpacing: "0.06em", cursor: "pointer",
              transition: `all 0.3s ${EASE}`, alignSelf: "center",
            }}
          >{showAll ? "Show Less" : `View All ${EVENTS_2026.length} Events`}</button>
        </div>
      </div>

      {/* Full event library */}
      {showAll && (
        <div style={{ marginTop: "2rem" }}>
          <div className="star-divider" style={{ marginBottom: "1.5rem" }}>&#10022;</div>
          <h2 style={{
            fontFamily: "var(--font-heading)", fontSize: "1.3rem", fontWeight: 400,
            textAlign: "center", marginBottom: "1.5rem",
          }}>
            <span className="text-gold-gradient">2026 Astrological Event Library</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {EVENTS_2026.map(event => (
              <EventCard key={event.date + event.title} event={event} onSelect={setSelectedEvent} />
            ))}
          </div>
        </div>
      )}

      {/* Event detail overlay */}
      {selectedEvent && (
        <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
