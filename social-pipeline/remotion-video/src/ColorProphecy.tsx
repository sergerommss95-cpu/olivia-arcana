import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { interFamily, cormorantFamily } from "./fonts";

/**
 * Color Prophecy — Pure color and light as the medium.
 * 
 * No card image, no space footage, no objects.
 * Just shifting fields of color that ARE the reading.
 * Text appears as if carved from the color itself.
 * A silhouette breathes within the color field.
 * 
 * Color theory:
 *   Fire signs: black → deep crimson → amber → molten gold → white heat
 *   Water signs: black → deep ocean → teal → silver → moonlight  
 *   Earth signs: black → moss → bronze → warm umber → honey gold
 *   Air signs: black → violet → electric blue → lavender → white
 */

type Props = {
  sign: string;
  glyph: string;
  element: "fire" | "earth" | "air" | "water";
  hook: string;
  body: string;
  cta: string;
};

// Color journeys per element — each is a 5-stop emotional arc
const COLOR_JOURNEYS: Record<string, string[][]> = {
  fire: [
    ["#050000", "#1a0505", "#0a0000"],  // void
    ["#2a0a08", "#3d1510", "#180505"],  // embers awakening
    ["#6b2010", "#8a3015", "#4a1208"],  // crimson surge
    ["#c47020", "#d4a030", "#8a5010"],  // amber blaze
    ["#f0c850", "#ffe080", "#d4af37"],  // molten gold crescendo
  ],
  water: [
    ["#000508", "#001018", "#000810"],
    ["#051830", "#082848", "#041020"],
    ["#104060", "#186080", "#0a3050"],
    ["#308090", "#50a0b0", "#206878"],
    ["#90c8d8", "#b0e0f0", "#70b0c8"],
  ],
  earth: [
    ["#030200", "#080500", "#050300"],
    ["#1a1808", "#2a2510", "#101005"],
    ["#3a3818", "#504a20", "#282510"],
    ["#706830", "#8a7840", "#504820"],
    ["#b8a050", "#d4b860", "#907838"],
  ],
  air: [
    ["#020008", "#050015", "#030010"],
    ["#150830", "#200a48", "#0a0520"],
    ["#301060", "#481880", "#200840"],
    ["#5830a0", "#7040c0", "#402080"],
    ["#a080e0", "#c0a0f0", "#8060c0"],
  ],
};

export const ColorProphecy: React.FC<Props> = ({
  sign, glyph, element, hook, body, cta,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const colors = COLOR_JOURNEYS[element] || COLOR_JOURNEYS.fire;

  // Scene timing
  const INTRO = Math.floor(2 * fps);
  const GLYPH = Math.floor(2.5 * fps);
  const READING = durationInFrames - INTRO - GLYPH - Math.floor(3 * fps);
  const CTA_DUR = Math.floor(3 * fps);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Living color field — always present, evolving through the whole video */}
      <ColorField colors={colors} element={element} />

      {/* Silhouette — faint human presence within the color */}
      <Silhouette element={element} />

      {/* Scene 1: Color awakens + glyph emerges from the color itself */}
      <Sequence durationInFrames={INTRO + GLYPH} premountFor={fps}>
        <IntroScene glyph={glyph} sign={sign} element={element} colors={colors} />
      </Sequence>

      {/* Scene 2: Reading — text carved from color */}
      <Sequence from={INTRO + GLYPH} durationInFrames={READING} premountFor={fps}>
        <ReadingScene body={body} element={element} colors={colors} />
      </Sequence>

      {/* Scene 3: CTA — color reaches peak intensity */}
      <Sequence from={INTRO + GLYPH + READING} durationInFrames={CTA_DUR} premountFor={fps}>
        <CTAScene sign={sign} glyph={glyph} element={element} />
      </Sequence>

      {/* Film grain */}
      <AbsoluteFill style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "200px", opacity: 0.04, mixBlendMode: "overlay",
        pointerEvents: "none",
      }} />

      {/* Watermark */}
      <div style={{
        position: "absolute", bottom: 55, right: 45,
        fontFamily: cormorantFamily, fontSize: 12, letterSpacing: 5,
        color: "rgba(255,255,255,0.1)", textTransform: "uppercase",
      }}>Olivia Arcana</div>
    </AbsoluteFill>
  );
};

/* ═══ LIVING COLOR FIELD ═══ 
   Multiple layers of gradient blobs that morph, drift, and shift hue
   through the color journey over the video duration. The color IS the reading. */
const ColorField: React.FC<{ colors: string[][]; element: string }> = ({ colors, element }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame * 0.015;

  // Progress through the color journey (0→1 over video duration)
  const journey = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Current color stage (0-4) with smooth interpolation
  const stage = journey * (colors.length - 1);
  const stageIdx = Math.min(Math.floor(stage), colors.length - 2);
  const stageFrac = stage - stageIdx;

  const c1 = colors[stageIdx];
  const c2 = colors[stageIdx + 1];

  // Interpolate between stage colors
  const lerp = (a: string, b: string, t: number) => {
    const pa = [parseInt(a.slice(1,3),16), parseInt(a.slice(3,5),16), parseInt(a.slice(5,7),16)];
    const pb = [parseInt(b.slice(1,3),16), parseInt(b.slice(3,5),16), parseInt(b.slice(5,7),16)];
    const r = Math.round(pa[0] + (pb[0]-pa[0]) * t);
    const g = Math.round(pa[1] + (pb[1]-pa[1]) * t);
    const b2 = Math.round(pa[2] + (pb[2]-pa[2]) * t);
    return `rgb(${r},${g},${b2})`;
  };

  const primary = lerp(c1[0], c2[0], stageFrac);
  const secondary = lerp(c1[1], c2[1], stageFrac);
  const tertiary = lerp(c1[2], c2[2], stageFrac);

  // Intensity increases as we progress through the journey
  const intensity = 0.3 + journey * 0.7;

  return (
    <AbsoluteFill>
      {/* Base wash */}
      <AbsoluteFill style={{
        background: `linear-gradient(170deg, ${primary} 0%, ${tertiary} 50%, #000 100%)`,
        opacity: intensity,
      }} />

      {/* Blob 1 — large, primary color, slow drift */}
      <div style={{
        position: "absolute",
        width: 1200, height: 1200,
        left: `${-10 + Math.sin(t * 0.3) * 15}%`,
        top: `${20 + Math.cos(t * 0.2) * 10}%`,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${secondary} 0%, transparent 55%)`,
        opacity: intensity * 0.4,
        filter: "blur(80px)",
        transform: `translate(-50%, -50%) scale(${1 + Math.sin(t * 0.4) * 0.1})`,
      }} />

      {/* Blob 2 — secondary, faster */}
      <div style={{
        position: "absolute",
        width: 900, height: 900,
        right: `${-5 + Math.cos(t * 0.4) * 12}%`,
        top: `${45 + Math.sin(t * 0.35) * 8}%`,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${primary} 0%, transparent 50%)`,
        opacity: intensity * 0.3,
        filter: "blur(70px)",
        transform: `translate(50%, -50%) scale(${1 + Math.cos(t * 0.5) * 0.12})`,
      }} />

      {/* Blob 3 — tertiary accent */}
      <div style={{
        position: "absolute",
        width: 700, height: 700,
        left: `${40 + Math.sin(t * 0.5 + 2) * 10}%`,
        bottom: `${-5 + Math.cos(t * 0.3 + 1) * 8}%`,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${secondary} 0%, transparent 45%)`,
        opacity: intensity * 0.25,
        filter: "blur(60px)",
        transform: `translate(-50%, 50%) scale(${1 + Math.sin(t * 0.6) * 0.08})`,
      }} />

      {/* Horizontal aurora streak */}
      <div style={{
        position: "absolute",
        width: "140%", height: 250,
        left: "-20%",
        top: `${40 + Math.sin(t * 0.25) * 5}%`,
        background: `linear-gradient(90deg, transparent 5%, ${tertiary}30 25%, ${secondary}20 50%, ${primary}25 75%, transparent 95%)`,
        filter: "blur(40px)",
        transform: `rotate(${-2 + Math.sin(t * 0.15) * 3}deg)`,
        opacity: intensity * 0.6,
      }} />

      {/* Vertical light shaft — divine beam */}
      <div style={{
        position: "absolute",
        width: 200, height: "120%",
        left: `${50 + Math.sin(t * 0.2) * 8}%`,
        top: "-10%",
        background: `linear-gradient(180deg, ${secondary}15 0%, ${secondary}08 30%, transparent 60%)`,
        filter: "blur(30px)",
        transform: `translateX(-50%) rotate(${Math.sin(t * 0.1) * 2}deg)`,
        opacity: intensity * 0.5,
      }} />

      {/* Vignette — always present for depth */}
      <AbsoluteFill style={{
        background: "radial-gradient(ellipse 65% 55% at 50% 45%, transparent 0%, rgba(0,0,0,0.6) 100%)",
      }} />
    </AbsoluteFill>
  );
};

/* ═══ SILHOUETTE ═══ */
const Silhouette: React.FC<{ element: string }> = ({ element }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame * 0.01;

  // Silhouette fades in after 3 seconds, out before end
  const opacity = interpolate(frame, [3 * fps, 5 * fps], [0, 0.06], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }) * interpolate(frame, [durationInFrames - 2 * fps, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const breathe = Math.sin(t * 1.5) * 0.02;

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Head */}
      <div style={{
        position: "absolute",
        top: "28%", left: "50%",
        width: 120, height: 140,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(200,180,255,0.2) 40%, transparent 70%)",
        filter: "blur(12px)",
        transform: `translate(-50%, -50%) scale(${1 + breathe})`,
      }} />
      {/* Body */}
      <div style={{
        position: "absolute",
        top: "35%", left: "50%",
        width: 250, height: 800,
        borderRadius: "30% 30% 0 0",
        background: "radial-gradient(ellipse 100% 80% at 50% 0%, rgba(200,180,255,0.3) 0%, rgba(150,120,200,0.1) 30%, transparent 60%)",
        filter: "blur(18px)",
        transform: `translate(-50%, 0) scale(${1 + breathe})`,
      }} />
    </AbsoluteFill>
  );
};

/* ═══ INTRO — glyph emerges from color ═══ */
const IntroScene: React.FC<{
  glyph: string; sign: string; element: string; colors: string[][];
}> = ({ glyph, sign, element, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Glyph materializes from blur → sharp
  const glyphProgress = interpolate(frame, [0.5 * fps, 2.5 * fps], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const glyphBlur = interpolate(glyphProgress, [0, 1], [20, 0]);
  const glyphScale = interpolate(glyphProgress, [0, 1], [2, 1]);
  const glyphOpacity = interpolate(glyphProgress, [0, 1], [0, 0.7]);

  // Sign name fades in after glyph
  const nameOpacity = interpolate(frame, [2 * fps, 3 * fps], [0, 0.5], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Hook text — appears at the end of intro
  const hookOpacity = interpolate(frame, [3 * fps, 4 * fps], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      {/* Glyph — emerges from the color field */}
      <div style={{
        fontSize: 280,
        fontFamily: `"Noto Sans Symbols 2", serif`,
        color: "rgba(255,255,255,0.9)",
        opacity: glyphOpacity,
        filter: `blur(${glyphBlur}px)`,
        transform: `scale(${glyphScale})`,
        textShadow: "0 0 80px rgba(255,255,255,0.2), 0 0 160px rgba(255,255,255,0.1)",
        mixBlendMode: "soft-light",
      }}>
        {glyph + "\uFE0E"}
      </div>

      {/* Sign name — whisper quiet */}
      <div style={{
        fontFamily: cormorantFamily,
        fontSize: 24,
        fontWeight: 300,
        letterSpacing: 14,
        color: "rgba(255,255,255,0.5)",
        textTransform: "uppercase",
        marginTop: 24,
        opacity: nameOpacity,
      }}>
        {sign}
      </div>
    </AbsoluteFill>
  );
};

/* ═══ READING — text as part of the color ═══ */
const ReadingScene: React.FC<{
  body: string; element: string; colors: string[][];
}> = ({ body, element, colors }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Split into word chunks
  const words = body.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let idx = 0;
  while (idx < words.length) {
    const s = words[idx].length < 4 ? 4 : 3;
    chunks.push(words.slice(idx, idx + s).join(" "));
    idx += s;
  }

  const fpc = Math.floor(durationInFrames / chunks.length);
  const ai = Math.min(chunks.length - 1, Math.floor(frame / fpc));
  const lf = frame - ai * fpc;

  // Text materializes from blur → sharp (like the glyph did)
  const textProgress = interpolate(lf, [0, Math.floor(fps * 0.4)], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const textBlur = interpolate(textProgress, [0, 1], [8, 0]);
  const textScale = interpolate(textProgress, [0, 1], [1.08, 1]);
  const textOpacity = interpolate(textProgress, [0, 1], [0, 1]);

  // Exit — dissolves back into color
  const exitProgress = interpolate(lf, [fpc - 6, fpc], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const exitBlur = interpolate(exitProgress, [0, 1], [0, 6]);
  const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);

  const totalBlur = textBlur + exitBlur;
  const totalOpacity = textOpacity * exitOpacity;

  // Word-level highlighting — current word glows
  const chunkWords = chunks[ai].split(" ");
  const wordProgress = lf / fpc;
  const hlIdx = Math.min(chunkWords.length - 1,
    Math.floor(wordProgress * chunkWords.length));

  return (
    <AbsoluteFill style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 48px",
    }}>
      <div style={{
        opacity: totalOpacity,
        filter: `blur(${totalBlur}px)`,
        transform: `scale(${textScale})`,
      }}>
        <div style={{
          fontFamily: interFamily,
          fontSize: 82,
          fontWeight: 900,
          textAlign: "center",
          lineHeight: 1.12,
          letterSpacing: -1,
        }}>
          {chunkWords.map((w, i) => (
            <span key={i} style={{
              color: i === hlIdx ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.6)",
              textShadow: i === hlIdx
                ? "0 0 40px rgba(255,255,255,0.4), 0 0 80px rgba(255,255,255,0.15), 0 4px 16px rgba(0,0,0,0.8)"
                : "0 4px 16px rgba(0,0,0,0.8)",
              transition: "color 0.1s, text-shadow 0.1s",
            }}>
              {w}{i < chunkWords.length - 1 ? " " : ""}
            </span>
          ))}
        </div>

        {/* Thin light line below text — pulses with the color */}
        <div style={{
          width: interpolate(textProgress, [0, 1], [0, 300]),
          height: 1,
          margin: "24px auto 0",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
          opacity: totalOpacity * 0.6,
        }} />
      </div>
    </AbsoluteFill>
  );
};

/* ═══ CTA ═══ */
const CTAScene: React.FC<{
  sign: string; glyph: string; element: string;
}> = ({ sign, glyph, element }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const e = spring({ frame, fps, config: { damping: 15, stiffness: 60 } });
  const opacity = interpolate(e, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 20, padding: "0 60px",
      opacity,
    }}>
      {/* Glyph — bright, present */}
      <div style={{
        fontSize: 100,
        fontFamily: `"Noto Sans Symbols 2", serif`,
        color: "rgba(255,255,255,0.7)",
        textShadow: "0 0 60px rgba(255,255,255,0.2)",
        marginBottom: 8,
      }}>{glyph + "\uFE0E"}</div>

      <div style={{
        fontFamily: cormorantFamily,
        fontSize: 56,
        fontWeight: 300,
        color: "rgba(255,255,255,0.85)",
        textAlign: "center",
        lineHeight: 1.3,
        letterSpacing: 1,
        textShadow: "0 0 40px rgba(0,0,0,0.6)",
      }}>
        Follow for your<br/>daily reading
      </div>

      <div style={{
        fontFamily: cormorantFamily,
        fontSize: 16,
        fontWeight: 300,
        letterSpacing: 10,
        color: "rgba(255,255,255,0.25)",
        textTransform: "uppercase",
        marginTop: 16,
      }}>Olivia Arcana</div>
    </AbsoluteFill>
  );
};
