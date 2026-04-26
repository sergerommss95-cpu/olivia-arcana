import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/**
 * Olivia Mystic Oracle — Mystic Cartography aesthetic seed (Phase 1b).
 *
 * A 15s vertical (1080x1920) zodiac daily oracle, built on the winning
 * "Mystic Cartography" direction from brain/SVG Protocol.md:
 *   - aged-parchment-over-navy backdrop
 *   - fine gold linework manuscript glyph (the real SVG asset)
 *   - Didot/serif wordmarks, letterspaced for luxury
 *   - jewel-tone palette: indigo #1a0f2e / rose #5a1f33 / champagne #d4a574
 *   - Piper TTS narration + stacked-sine ambient drone
 *   - word-level caption overlay (TikTok pacing) across oracle scene
 *
 * NOT related to V6 ZodiacDaily.tsx (nebula direction, flagged as failure
 * mode per brain/Olivia Video Creative.md). NOT related to r3f-orb (R3F
 * liquid-glass direction, currently at ~65% rating). This is a third
 * aesthetic option: cheap-to-render, batch-friendly, brand-coherent.
 *
 * Props are plain JSON so a daily orchestrator can fill them per sign.
 */

export interface OliviaMysticOracleProps {
  sign: string;
  cardName: string;
  oracleLines: string[];
  ctaText: string;
  glyphPath: string;
  narrationPath?: string;
  musicPath?: string;
}

const PALETTE = {
  bg: "#1a0f2e",
  bgDeep: "#0d0719",
  rose: "#5a1f33",
  teal: "#1f3a3a",
  gold: "#d4a574",
  goldLight: "#ffe8a3",
  goldDeep: "#6b4a1f",
};

const FONT_SERIF = "'Didot', 'Bodoni 72', 'Cormorant Garamond', 'Times New Roman', serif";
const FONT_SANS = "'Optima', 'Avenir Next', system-ui, sans-serif";

// A hair-thin gold divider line, responsive to width + opacity.
const GoldDivider: React.FC<{ width: number; opacity: number }> = ({ width, opacity }) => (
  <div
    style={{
      width,
      height: 1.5,
      margin: "0 auto",
      background: `linear-gradient(90deg, transparent, ${PALETTE.gold} 30%, ${PALETTE.goldLight} 50%, ${PALETTE.gold} 70%, transparent)`,
      opacity,
      boxShadow: `0 0 8px ${PALETTE.gold}55`,
    }}
  />
);

// Shared background layer — deep indigo radial + subtle vignette + grain overlay.
const MysticBackdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(55% 50% at 50% 40%, ${PALETTE.bg} 0%, ${PALETTE.bgDeep} 100%)`,
    }}
  >
    {/* Very subtle vignette — darkens the edges like parchment */}
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(70% 65% at 50% 50%, transparent 0%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        pointerEvents: "none",
      }}
    />
    {/* Warm rose wash at center (very low opacity) */}
    <AbsoluteFill
      style={{
        background:
          `radial-gradient(35% 30% at 50% 45%, ${PALETTE.rose}20 0%, transparent 70%)`,
        pointerEvents: "none",
      }}
    />
  </AbsoluteFill>
);

// ---------- Scene 1: Invocation (0–3s)
const InvocationScene: React.FC<{ sign: string; glyphPath: string }> = ({
  sign,
  glyphPath,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const glyphSpring = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 80, mass: 1.5 },
  });
  const glyphOpacity = interpolate(frame, [0, 15, 75, 90], [0, 1, 1, 0.92]);
  const wordSpring = spring({
    frame: Math.max(0, frame - 14),
    fps,
    config: { damping: 20, stiffness: 120, mass: 1 },
  });
  const wordOpacity = interpolate(frame, [0, 20, 75, 90], [0, 1, 1, 0.92]);
  const subOpacity = interpolate(frame, [0, 28, 75, 90], [0, 1, 1, 0.85]);
  const dividerWidth = interpolate(frame, [22, 40], [40, 260], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "center" }}
    >
      <img
        src={glyphPath}
        style={{
          width: 780,
          height: 780,
          transform: `scale(${0.85 + glyphSpring * 0.15})`,
          opacity: glyphOpacity,
          filter: `drop-shadow(0 0 50px ${PALETTE.gold}55) drop-shadow(0 0 120px ${PALETTE.gold}25)`,
        }}
      />
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <GoldDivider width={dividerWidth} opacity={wordOpacity * 0.85} />
        <div
          style={{
            marginTop: 22,
            fontFamily: FONT_SERIF,
            fontSize: 104,
            fontWeight: 300,
            letterSpacing: "0.42em",
            color: PALETTE.goldLight,
            transform: `translateX(0.21em) scale(${0.94 + wordSpring * 0.06})`,
            opacity: wordOpacity,
          }}
        >
          {sign.toUpperCase()}
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: FONT_SANS,
            fontSize: 24,
            letterSpacing: "0.55em",
            color: PALETTE.gold,
            opacity: subOpacity * 0.82,
            transform: "translateX(0.27em)",
          }}
        >
          DAILY ORACLE
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Scene 2: Card reveal (3–10s)
const CardRevealScene: React.FC<{ cardName: string; glyphPath: string }> = ({
  cardName,
  glyphPath,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = 7 * 30;

  const textRise = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 20, stiffness: 90, mass: 1.2 },
  });
  const ken = interpolate(frame, [0, dur], [1.0, 1.07]);
  const hold = interpolate(frame, [0, 15, dur - 25, dur], [0, 1, 1, 0.85]);
  const labelDividerWidth = interpolate(frame, [10, 28], [20, 140], {
    extrapolateRight: "clamp",
  });
  const titleDividerWidth = interpolate(frame, [24, 45], [20, 200], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 200 }}
    >
      <img
        src={glyphPath}
        style={{
          width: 500,
          height: 500,
          transform: `scale(${ken})`,
          opacity: hold * 0.92,
          filter: `drop-shadow(0 0 35px ${PALETTE.gold}40) drop-shadow(0 0 80px ${PALETTE.gold}20)`,
        }}
      />
      <div
        style={{
          marginTop: 80,
          width: 900,
          textAlign: "center",
          transform: `translateY(${(1 - textRise) * 50}px)`,
          opacity: hold,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <GoldDivider width={labelDividerWidth} opacity={hold * 0.75} />
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 24,
              letterSpacing: "0.55em",
              color: PALETTE.gold,
              opacity: 0.9,
            }}
          >
            CARD OF THE DAY
          </div>
          <GoldDivider width={labelDividerWidth} opacity={hold * 0.75} />
        </div>
        <div
          style={{
            marginTop: 38,
            fontFamily: FONT_SERIF,
            fontSize: 110,
            fontWeight: 300,
            fontStyle: "italic",
            letterSpacing: "0.04em",
            color: PALETTE.goldLight,
            lineHeight: 1.08,
            textShadow: `0 0 40px ${PALETTE.gold}30`,
          }}
        >
          {cardName}
        </div>
        <div style={{ marginTop: 34 }}>
          <GoldDivider width={titleDividerWidth} opacity={hold * 0.85} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Scene 3: Oracle (10–14s)
const OracleScene: React.FC<{ oracleLines: string[] }> = ({ oracleLines }) => {
  const frame = useCurrentFrame();
  const dur = 4 * 30;

  const body = oracleLines.join(" ").split(/\s+/);
  const perWord = (dur - 25) / body.length;

  const sceneFade = interpolate(frame, [0, 12, dur - 15, dur], [0, 1, 1, 0.7]);
  const haloOpacity = interpolate(
    frame,
    [0, 30, dur - 20, dur],
    [0, 0.35, 0.35, 0],
  );

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {/* Soft gold aura behind text */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 520,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${PALETTE.gold}22 0%, transparent 60%)`,
          opacity: haloOpacity,
          filter: "blur(30px)",
        }}
      />
      <div
        style={{
          width: 900,
          textAlign: "center",
          fontFamily: FONT_SERIF,
          fontSize: 76,
          fontWeight: 300,
          fontStyle: "italic",
          lineHeight: 1.35,
          letterSpacing: "0.015em",
          color: PALETTE.goldLight,
          opacity: sceneFade,
          textShadow: `0 0 30px ${PALETTE.bgDeep}`,
        }}
      >
        {body.map((word, i) => {
          const wordFrame = Math.max(0, frame - i * perWord - 8);
          const wordOp = interpolate(wordFrame, [0, 10], [0, 1], {
            extrapolateRight: "clamp",
          });
          const wordRise = interpolate(wordFrame, [0, 14], [14, 0], {
            extrapolateRight: "clamp",
          });
          const wordGlow = interpolate(wordFrame, [0, 12, 30], [0.8, 1.15, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: wordOp,
                transform: `translateY(${wordRise}px) scale(${wordGlow})`,
                marginRight: 14,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Scene 4: CTA (14–15s)
const CtaScene: React.FC<{ ctaText: string }> = ({ ctaText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 110, mass: 1 },
  });
  const dividerWidth = interpolate(frame, [6, 22], [30, 220], {
    extrapolateRight: "clamp",
  });
  const op = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", opacity: op, transform: `scale(${0.94 + appear * 0.06})` }}>
        <div
          style={{
            fontFamily: FONT_SANS,
            fontSize: 22,
            letterSpacing: "0.55em",
            color: PALETTE.gold,
            opacity: 0.85,
            marginBottom: 28,
            transform: "translateX(0.27em)",
          }}
        >
          FULL READING AT
        </div>
        <GoldDivider width={dividerWidth} opacity={op * 0.9} />
        <div
          style={{
            marginTop: 28,
            fontFamily: FONT_SERIF,
            fontSize: 72,
            fontWeight: 300,
            letterSpacing: "0.06em",
            color: PALETTE.goldLight,
          }}
        >
          {ctaText}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Word-level caption overlay (TikTok-style, bottom third)
// Uses section timings to distribute words evenly. Not ML-accurate but
// viewers don't frame-count.
const CaptionOverlay: React.FC<{
  sections: Array<{ text: string; startSeconds: number; endSeconds: number }>;
}> = ({ sections }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const second = frame / fps;

  // Find the active section.
  const active = sections.find(
    (s) => second >= s.startSeconds && second < s.endSeconds,
  );
  if (!active) return null;

  const words = active.text.split(/\s+/);
  const sectionDur = active.endSeconds - active.startSeconds;
  const localSecond = second - active.startSeconds;
  // Active word index based on even distribution; small bias to
  // start slightly before first word.
  const activeIdx = Math.min(
    words.length - 1,
    Math.floor((localSecond / sectionDur) * words.length),
  );

  const sectionFade = interpolate(
    localSecond,
    [0, 0.3, sectionDur - 0.25, sectionDur],
    [0, 1, 1, 0],
  );

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", paddingBottom: 320 }}>
      <div
        style={{
          margin: "0 auto",
          width: 920,
          padding: "18px 28px",
          textAlign: "center",
          fontFamily: FONT_SANS,
          fontSize: 40,
          fontWeight: 600,
          letterSpacing: "0.04em",
          color: PALETTE.goldLight,
          background: "rgba(13, 7, 25, 0.55)",
          borderRadius: 14,
          backdropFilter: "blur(8px)",
          border: `1px solid ${PALETTE.gold}25`,
          opacity: sectionFade,
          lineHeight: 1.2,
        }}
      >
        {words.map((w, i) => (
          <span
            key={i}
            style={{
              color: i === activeIdx ? PALETTE.gold : `${PALETTE.goldLight}bb`,
              textShadow:
                i === activeIdx ? `0 0 14px ${PALETTE.gold}88` : "none",
              marginRight: 10,
              transition: "color 0.1s",
            }}
          >
            {w}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Root
export const OliviaMysticOracle: React.FC<OliviaMysticOracleProps> = ({
  sign,
  cardName,
  oracleLines,
  ctaText,
  glyphPath,
  narrationPath,
  musicPath,
}) => {
  const { fps } = useVideoConfig();
  const g = glyphPath.startsWith("http") ? glyphPath : staticFile(glyphPath);
  const n =
    narrationPath && !narrationPath.startsWith("http")
      ? staticFile(narrationPath)
      : narrationPath;
  const m =
    musicPath && !musicPath.startsWith("http")
      ? staticFile(musicPath)
      : musicPath;

  // Captions mirror the script sections.
  const captionSections = [
    { text: sign, startSeconds: 0, endSeconds: 3 },
    { text: cardName, startSeconds: 3, endSeconds: 10 },
    { text: oracleLines.join(" "), startSeconds: 10, endSeconds: 14 },
    { text: ctaText, startSeconds: 14, endSeconds: 15 },
  ];

  return (
    <AbsoluteFill style={{ background: PALETTE.bgDeep }}>
      <MysticBackdrop />

      {m && <Audio src={m} volume={0.55} />}
      {n && <Audio src={n} volume={1.0} />}

      <Sequence from={0} durationInFrames={3 * fps}>
        <InvocationScene sign={sign} glyphPath={g} />
      </Sequence>

      <Sequence from={3 * fps} durationInFrames={7 * fps}>
        <CardRevealScene cardName={cardName} glyphPath={g} />
      </Sequence>

      <Sequence from={10 * fps} durationInFrames={4 * fps}>
        <OracleScene oracleLines={oracleLines} />
      </Sequence>

      <Sequence from={14 * fps} durationInFrames={1 * fps}>
        <CtaScene ctaText={ctaText} />
      </Sequence>

      <CaptionOverlay sections={captionSections} />
    </AbsoluteFill>
  );
};
