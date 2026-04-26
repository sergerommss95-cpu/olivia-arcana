"use client";

/**
 * ShareSignButton — Surfaces the chart-card share modal from a sign page.
 *
 * The renderer + modal already exist; this is the discoverable entry point
 * the audit flagged as missing on /signs/[sign]. One tap → preview a square
 * Instagram card → share via Web Share API or download PNG.
 */

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import type { CSSProperties } from "react";

const ShareCardModal = dynamic(() => import("./ShareCardModal"), { ssr: false });

interface Props {
  signName: string;
  signGlyph: string;
  element: string;
  elementEmoji: string;
  dateRange: string;
  traits: string[];
  horoscope: string;
  luckyColor: string;
  luckyColorHex: string;
}

const buttonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.55em",
  padding: "0.7rem 1.4rem",
  borderRadius: "9999px",
  background: "linear-gradient(135deg, rgba(232,201,106,0.18), rgba(212,175,55,0.12))",
  border: "1px solid rgba(232,201,106,0.45)",
  color: "rgba(245,240,232,0.96)",
  fontFamily: "var(--font-body, system-ui), sans-serif",
  fontSize: "0.78rem",
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  cursor: "pointer",
  transition: "transform 220ms cubic-bezier(0.16,1,0.3,1), background 220ms",
};

export default function ShareSignButton(props: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Synthesize the cosmic-energy bar from day-of-year + sign hash
  // (deterministic, matches what /onboarding shows so the share card looks
  // identical to what the user already saw inside the app).
  const cosmicEnergy = useMemo(() => {
    if (!mounted) return 75; // stable fallback for SSR
    const now = Date.now();
    const day = Math.floor((now - new Date(new Date(now).getFullYear(), 0, 0).getTime()) / 86_400_000);
    let h = 0;
    for (const c of props.signName) h = (h * 31 + c.charCodeAt(0)) | 0;
    return 60 + (Math.abs((day + h) % 41));
  }, [mounted, props.signName]);

  return (
    <>
      <button
        type="button"
        disabled={!mounted}
        onClick={() => setOpen(true)}
        style={{
          ...buttonStyle,
          opacity: mounted ? 1 : 0.5,
          cursor: mounted ? "pointer" : "wait",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
        }}
      >
        <span aria-hidden style={{ fontSize: "0.95em", color: "rgba(232,201,106,0.92)" }}>✦</span>
        Share your {props.signName} card
      </button>

      <ShareCardModal
        open={open}
        onClose={() => setOpen(false)}
        data={{
          signName: props.signName,
          signGlyph: props.signGlyph,
          bigThree: `Sun in ${props.signName}`,
          element: props.element,
          elementEmoji: props.elementEmoji,
          cosmicEnergy,
          horoscope: props.horoscope,
          luckyColor: props.luckyColor,
          luckyColorHex: props.luckyColorHex,
          dateRange: props.dateRange,
          traits: props.traits,
        }}
      />
    </>
  );
}
