/**
 * Celestial Portrait — Generative Cosmic DNA
 *
 * Full-viewport animated artwork unique to each birth date.
 * Enter birthday → watch your cosmic identity generate in real-time.
 * Download as 4K PNG.
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { buildPortraitConfig, PortraitRenderer, type PortraitConfig } from "../../lib/portrait-engine";
import { getSunSign, getCosmicProfile } from "../../lib/zodiac-utils";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function PortraitPage() {
  const [birthday, setBirthday] = useState("");
  const [config, setConfig] = useState<PortraitConfig | null>(null);
  const [phase, setPhase] = useState<"input" | "generating" | "revealed">("input");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PortraitRenderer | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleBirthday = (value: string) => {
    let v = value.replace(/[^\d\/\-\.]/g, "");
    if (v.length === 2 && !v.includes("/") && !v.includes("-") && birthday.length < v.length) v += "/";
    if (v.length > 5) v = v.slice(0, 5);
    setBirthday(v);
  };

  const generate = useCallback(() => {
    const match = birthday.match(/^(\d{1,2})[\/\-\.](\d{1,2})$/);
    if (!match) return;
    const month = parseInt(match[1]);
    const day = parseInt(match[2]);
    const cfg = buildPortraitConfig({ month, day });
    if (!cfg) return;

    setConfig(cfg);
    setPhase("generating");

    // Animate input out
    overlayRef.current?.animate(
      [{ opacity: "1" }, { opacity: "0" }],
      { duration: 600, easing: EASE, fill: "forwards" }
    );

    // Start rendering after brief pause
    setTimeout(() => {
      if (!canvasRef.current) return;
      rendererRef.current?.stop();
      const renderer = new PortraitRenderer(canvasRef.current, cfg);
      rendererRef.current = renderer;
      renderer.init();
      renderer.start();
      setPhase("revealed");
    }, 800);
  }, [birthday]);

  const download = useCallback(() => {
    if (!rendererRef.current) return;
    const url = rendererRef.current.toDataURL();
    const a = document.createElement("a");
    a.href = url;
    a.download = `celestial-portrait-${config?.signName?.toLowerCase() || "cosmic"}.png`;
    a.click();
  }, [config]);

  const reset = useCallback(() => {
    rendererRef.current?.stop();
    rendererRef.current = null;
    setBirthday("");
    setConfig(null);
    setPhase("input");
  }, []);

  // Handle Enter key
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") generate();
  };

  // Cleanup
  useEffect(() => {
    return () => { rendererRef.current?.stop(); };
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (rendererRef.current && canvasRef.current) {
        rendererRef.current.stop();
        rendererRef.current.init();
        rendererRef.current.start();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sign = config ? getSunSign(0, 0) : null; // placeholder
  const profile = config ? getCosmicProfile(config.signName, "", config.signIndex) : null;

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#04020d" }}>
      {/* Canvas — full viewport */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* Input overlay */}
      <div
        ref={overlayRef}
        style={{
          position: "absolute",
          inset: 0,
          display: phase === "revealed" ? "none" : "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          zIndex: 10,
          background: phase === "input" ? "rgba(4,2,13,0.92)" : "transparent",
          transition: `background 0.6s ${EASE}`,
        }}
      >
        <a href="/" style={{
          position: "absolute", top: "1.5rem", left: "1.5rem",
          fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 400,
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: "rgba(180,170,210,0.4)", textDecoration: "none",
        }}>← Home</a>

        <div style={{
          fontSize: "2rem",
          color: "rgba(212,175,55,0.5)",
          textShadow: "0 0 40px rgba(212,175,55,0.2)",
        }}>✦</div>

        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
          fontWeight: 400,
          textAlign: "center",
        }}>
          <span className="text-gold-gradient">Your Celestial Portrait</span>
        </h1>

        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 300,
          color: "rgba(196,185,228,0.55)", textAlign: "center", maxWidth: "380px",
        }}>
          A living artwork generated from your unique cosmic DNA.
          No two are alike.
        </p>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <label style={{
            fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
            letterSpacing: "0.18em", textTransform: "uppercase",
            color: "rgba(180,170,210,0.4)",
          }}>Enter your birthday</label>
          <input
            type="text"
            placeholder="MM / DD"
            value={birthday}
            onChange={(e) => handleBirthday(e.target.value)}
            onKeyDown={handleKey}
            autoFocus
            style={{
              width: "160px", padding: "0.7rem 1.2rem", textAlign: "center",
              fontFamily: "var(--font-accent)", fontSize: "1.1rem", letterSpacing: "0.1em",
              color: "rgba(240,236,255,0.9)", background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(200,185,255,0.12)", borderRadius: "9999px",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              outline: "none", transition: "border-color 0.3s",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(200,185,255,0.3)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(200,185,255,0.12)"; }}
          />
          <button
            onClick={generate}
            disabled={!/^\d{1,2}[\/\-\.]\d{1,2}$/.test(birthday)}
            style={{
              padding: "0.7rem 2rem", borderRadius: "100px",
              background: "linear-gradient(135deg, rgba(160,120,255,0.2), rgba(100,80,220,0.15))",
              border: "1px solid rgba(200,180,255,0.2)",
              color: "rgba(240,235,255,0.9)", fontSize: "0.8rem", fontWeight: 500,
              letterSpacing: "0.06em", textTransform: "uppercase",
              cursor: /^\d{1,2}[\/\-\.]\d{1,2}$/.test(birthday) ? "pointer" : "not-allowed",
              opacity: /^\d{1,2}[\/\-\.]\d{1,2}$/.test(birthday) ? 1 : 0.3,
              transition: `all 0.3s ${EASE}`,
            }}
          >Generate My Portrait</button>
        </div>
      </div>

      {/* Revealed overlay — sign info + controls */}
      {phase === "revealed" && config && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          display: "flex", flexDirection: "column",
          justifyContent: "space-between", pointerEvents: "none",
        }}>
          {/* Top bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            padding: "1.5rem", pointerEvents: "auto",
          }}>
            <a href="/" style={{
              fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 400,
              letterSpacing: "0.15em", textTransform: "uppercase",
              color: "rgba(180,170,210,0.35)", textDecoration: "none",
            }}>← Home</a>
            <button onClick={reset} style={{
              fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 400,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "rgba(180,170,210,0.35)", background: "none", border: "none",
              cursor: "pointer",
            }}>New Portrait</button>
          </div>

          {/* Bottom info panel */}
          <div style={{
            padding: "2rem",
            background: "linear-gradient(to top, rgba(4,2,13,0.8) 0%, transparent 100%)",
            pointerEvents: "auto",
          }}>
            <div style={{
              display: "flex", alignItems: "flex-end", justifyContent: "space-between",
              maxWidth: "800px", margin: "0 auto", flexWrap: "wrap", gap: "1rem",
            }}>
              {/* Sign info */}
              <div>
                <div style={{
                  fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 500,
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  color: "rgba(180,170,210,0.4)", marginBottom: "0.3rem",
                }}>Your Celestial Portrait</div>
                <div style={{
                  fontFamily: "var(--font-accent)", fontSize: "1.8rem", fontWeight: 400,
                  letterSpacing: "0.1em", color: "rgba(240,236,255,0.9)",
                  textTransform: "uppercase",
                }}>{config.signName}</div>
                <div style={{
                  fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 300,
                  color: "rgba(196,185,228,0.5)", marginTop: "0.2rem",
                  display: "flex", gap: "0.75rem",
                }}>
                  <span>{config.element} Element</span>
                  <span>&middot;</span>
                  <span>{config.modality} Modality</span>
                  <span>&middot;</span>
                  <span>{config.symmetry}-fold Symmetry</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button
                  onClick={download}
                  style={{
                    padding: "0.65rem 1.5rem", borderRadius: "100px",
                    background: "linear-gradient(135deg, rgba(160,120,255,0.2), rgba(100,80,220,0.15))",
                    border: "1px solid rgba(200,180,255,0.2)",
                    color: "rgba(240,235,255,0.9)", fontSize: "0.75rem", fontWeight: 500,
                    letterSpacing: "0.06em", textTransform: "uppercase",
                    cursor: "pointer", transition: `all 0.3s ${EASE}`,
                    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                  }}
                >Download PNG</button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `My Celestial Portrait — ${config.signName}`,
                        text: `Check out my unique cosmic DNA! I'm a ${config.signName} (${config.element} element).`,
                        url: window.location.href,
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                  style={{
                    padding: "0.65rem 1.5rem", borderRadius: "100px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(200,185,255,0.1)",
                    color: "rgba(200,185,240,0.7)", fontSize: "0.75rem", fontWeight: 400,
                    letterSpacing: "0.06em", textTransform: "uppercase",
                    cursor: "pointer", transition: `all 0.3s ${EASE}`,
                    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                  }}
                >Share</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
