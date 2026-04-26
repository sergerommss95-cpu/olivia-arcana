import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { ZodiacVideoProps, ELEMENT_COLORS, COLORS } from "./types";
import { cormorantFamily, interFamily } from "./fonts";

/**
 * ZodiacDaily V6 — Real cosmic video background + liquid glass.
 *
 * The fundamental change: REAL nebula video behind everything.
 * No more CSS-approximated space. Actual cosmic footage.
 */
export const ZodiacDaily: React.FC<ZodiacVideoProps> = (props) => {
  const { fps, durationInFrames } = useVideoConfig();
  const { sign, glyph, element, hook, body, cta, audioSrc, cardImage } = props;

  const HOOK = Math.floor(2.5 * fps);
  const CARD = Math.floor(4 * fps);
  const CTA_DUR = Math.floor(2.5 * fps);
  const READING = durationInFrames - HOOK - CARD - CTA_DUR;
  const ec = ELEMENT_COLORS[element];

  const imgSrc = cardImage
    ? cardImage.startsWith("http") ? cardImage : staticFile(cardImage)
    : staticFile("cards/00_the_fool.png");

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* REAL cosmic video background — loops, covers all scenes */}
      <CosmicVideo />

      <Sequence durationInFrames={HOOK} premountFor={fps}>
        <HookScene text={hook} glyph={glyph} sign={sign} ec={ec} />
      </Sequence>

      <Sequence from={HOOK - 3} durationInFrames={9}><DivineBurst ec={ec} /></Sequence>

      <Sequence from={HOOK} durationInFrames={CARD} premountFor={fps}>
        <CardScene imgSrc={imgSrc} sign={sign} glyph={glyph} ec={ec} />
      </Sequence>

      <Sequence from={HOOK + CARD - 3} durationInFrames={9}><DivineBurst ec={ec} /></Sequence>

      <Sequence from={HOOK + CARD} durationInFrames={READING} premountFor={fps}>
        <ReadingScene body={body} glyph={glyph} sign={sign} ec={ec} />
      </Sequence>

      <Sequence from={HOOK + CARD + READING - 3} durationInFrames={9}><DivineBurst ec={ec} /></Sequence>

      <Sequence from={HOOK + CARD + READING} durationInFrames={CTA_DUR} premountFor={fps}>
        <CTAScene sign={sign} ec={ec} glyph={glyph} />
      </Sequence>

      {audioSrc && <Audio src={audioSrc} volume={(f) =>
        interpolate(f, [0, 10], [0, 1], { extrapolateRight: "clamp" })
      } />}
    </AbsoluteFill>
  );
};

/* ═══ COSMIC VIDEO BACKGROUND ═══ */
const CosmicVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Slow Ken Burns zoom over the entire duration
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.15]);
  // Slow pan
  const panX = interpolate(frame, [0, durationInFrames], [0, -30]);
  const panY = interpolate(frame, [0, durationInFrames], [0, -20]);

  // Master fade in/out
  const opacity = interpolate(frame, [0, fps], [0, 1], { extrapolateRight: "clamp" }) *
    interpolate(frame, [durationInFrames - fps, durationInFrames], [1, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Video layer — looping cosmic nebula, native 1080x1920 */}
      <OffthreadVideo
        src={staticFile("bg/cosmic.mp4")}
        style={{
          width: "100%", height: "100%",
          objectFit: "cover",
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
        }}
        volume={0}
        loop
      />

      {/* Dark vignette — keeps text readable */}
      <AbsoluteFill style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.55) 100%)",
      }} />

      {/* Subtle dark overlay — ensures text contrast */}
      <AbsoluteFill style={{ backgroundColor: "rgba(0,0,0,0.25)" }} />
    </AbsoluteFill>
  );
};

/* ═══ DIVINE BURST ═══ */
const DivineBurst: React.FC<{ ec: string }> = ({ ec }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 2, 7], [0, 1, 0], { extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, 7], [0.3, 3], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(255,248,230,0.95) 0%, rgba(212,175,55,0.7) 20%, ${ec}40 45%, transparent 65%)`,
        opacity: o, transform: `scale(${scale})`, mixBlendMode: "screen",
      }} />
    </AbsoluteFill>
  );
};

/* ═══ GLASS PANEL ═══ */
const Glass: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => {
  const frame = useCurrentFrame();
  const specX = 30 + Math.sin(frame * 0.025) * 40;
  const specY = 20 + Math.cos(frame * 0.035) * 30;

  return (
    <div style={{
      background: "rgba(10, 5, 30, 0.55)",
      backdropFilter: "blur(20px)",
      borderRadius: 24,
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.3)",
      position: "relative", overflow: "hidden",
      ...style,
    }}>
      {/* Specular highlight */}
      <div style={{
        position: "absolute", width: 250, height: 250,
        left: `${specX}%`, top: `${specY}%`,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 55%)",
        transform: "translate(-50%, -50%)", pointerEvents: "none",
      }} />
      {/* Top edge refraction */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.1) 75%, transparent 95%)",
      }} />
      {children}
    </div>
  );
};

/* ═══ TEXT STYLE ═══ */
const txt = (size: number, color = "#fff"): React.CSSProperties => ({
  fontFamily: interFamily, fontSize: size, fontWeight: 900, color,
  textAlign: "center", lineHeight: 1.08, letterSpacing: -1,
  WebkitTextStroke: `${Math.max(1, size * 0.018)}px rgba(0,0,0,0.5)`,
  paintOrder: "stroke fill",
  textShadow: `0 4px 20px rgba(0,0,0,0.9), 0 0 60px rgba(0,0,0,0.4)`,
});

/* ═══ SCENE 1: HOOK ═══ */
const HookScene: React.FC<{
  text: string; glyph: string; sign: string; ec: string;
}> = ({ text, glyph, sign, ec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = text.split(/\s+/);
  const mid = Math.ceil(words.length / 2);
  const l1 = words.slice(0, mid).join(" ");
  const l2 = words.slice(mid).join(" ");

  const e1 = spring({ frame, fps, config: { damping: 10, stiffness: 60 } });
  const e2 = spring({ frame, fps, config: { damping: 10, stiffness: 60 }, delay: 5 });

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 36px", gap: 4,
    }}>
      {/* Glyph */}
      <div style={{
        fontSize: 130, color: ec, marginBottom: 16,
        fontFamily: `"Noto Sans Symbols 2", serif`,
        opacity: interpolate(e1, [0, 1], [0, 1]),
        transform: `scale(${interpolate(e1, [0, 1], [0.4, 1])})`,
        textShadow: `0 0 60px ${ec}90, 0 0 120px ${ec}50, 0 0 180px ${ec}25`,
        filter: `drop-shadow(0 0 40px ${ec}70)`,
      }}>{glyph + "\uFE0E"}</div>

      <div style={{
        ...txt(90), opacity: interpolate(e1, [0, 1], [0, 1]),
        transform: `scale(${interpolate(e1, [0, 1], [1.5, 1])})`,
      }}>{l1}</div>

      <div style={{
        ...txt(82),
        background: "linear-gradient(135deg, #f5e6c8 0%, #D4AF37 40%, #b8860b 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        WebkitTextStroke: "0px transparent",
        filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.9)) drop-shadow(0 0 30px rgba(212,175,55,0.35))",
        opacity: interpolate(e2, [0, 1], [0, 1]),
        transform: `scale(${interpolate(e2, [0, 1], [1.4, 1])})`,
      }}>{l2}</div>

      <div style={{
        marginTop: 28,
        opacity: interpolate(frame, [0.7 * fps, 1.1 * fps], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        }),
      }}>
        <Glass style={{ padding: "10px 28px", borderRadius: 22 }}>
          <div style={{
            fontFamily: interFamily, fontSize: 13, fontWeight: 700,
            letterSpacing: 5, color: ec, textTransform: "uppercase",
            position: "relative",
          }}>✦ {sign.toUpperCase()} ✦</div>
        </Glass>
      </div>
    </AbsoluteFill>
  );
};

/* ═══ SCENE 2: CARD ═══ */
const CardScene: React.FC<{
  imgSrc: string; sign: string; glyph: string; ec: string;
}> = ({ imgSrc, sign, glyph, ec }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const ent = spring({ frame, fps, config: { damping: 11, stiffness: 40, mass: 2 } });
  const cardY = interpolate(ent, [0, 1], [800, 0]);
  const cardO = interpolate(ent, [0, 1], [0, 1]);
  const cardR = interpolate(ent, [0, 1], [10, 0]);
  const ken = interpolate(frame, [0, durationInFrames], [1, 1.08]);
  const glow = Math.sin(frame * 0.07) * 0.06 + 0.25;
  const shimmer = 105 + frame * 1.5;

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Golden aura */}
      <div style={{
        position: "absolute", width: 900, height: 1350, borderRadius: 50,
        background: `radial-gradient(ellipse, rgba(212,175,55,${glow}) 0%, rgba(212,175,55,0.02) 40%, transparent 60%)`,
        opacity: cardO,
      }} />

      {/* Card — 720px = 67% of frame width */}
      <div style={{
        width: 720, height: 1080, borderRadius: 24, overflow: "hidden",
        opacity: cardO, transform: `translateY(${cardY}px) rotate(${cardR}deg)`,
        boxShadow: `0 30px 100px rgba(0,0,0,0.9), 0 0 140px rgba(212,175,55,${glow}), 0 0 280px rgba(212,175,55,${glow * 0.2})`,
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <Img src={imgSrc} style={{
          width: "100%", height: "100%", objectFit: "cover",
          transform: `scale(${ken})`,
        }} />
        {/* Shimmer */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(${shimmer}deg, transparent 15%, rgba(255,255,255,0.04) 38%, rgba(255,255,255,0.14) 46%, rgba(245,230,200,0.2) 50%, rgba(255,255,255,0.14) 54%, rgba(255,255,255,0.04) 62%, transparent 85%)`,
        }} />
        {/* Top specular edge */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
        }} />
      </div>

      {/* Sign label */}
      <div style={{
        position: "absolute", bottom: 100,
        opacity: interpolate(frame, [1.2 * fps, 1.8 * fps], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        }),
      }}>
        <Glass style={{ padding: "14px 36px", borderRadius: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
            <span style={{
              fontSize: 36, color: ec,
              fontFamily: `"Noto Sans Symbols 2", serif`,
              textShadow: `0 0 16px ${ec}60`,
            }}>{glyph + "\uFE0E"}</span>
            <span style={{ ...txt(44), letterSpacing: 6, WebkitTextStroke: "1px rgba(0,0,0,0.3)" }}>
              {sign.toUpperCase()}
            </span>
          </div>
        </Glass>
      </div>
    </AbsoluteFill>
  );
};

/* ═══ SCENE 3: READING ═══ */
const ReadingScene: React.FC<{
  body: string; glyph: string; sign: string; ec: string;
}> = ({ body, glyph, sign, ec }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

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

  const punch = spring({ frame: lf, fps, config: { damping: 11, stiffness: 140 } });
  const scale = interpolate(punch, [0, 1], [1.12, 1]);
  const opacity = interpolate(punch, [0, 1], [0, 1]);
  const exitO = interpolate(lf, [fpc - 3, fpc], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const cw = chunks[ai].split(" ");
  const hlIdx = Math.min(cw.length - 1, Math.floor(lf / (fpc / cw.length)));

  return (
    <AbsoluteFill>
      {/* Ghost glyph */}
      <div style={{
        position: "absolute", top: "28%", left: "50%",
        fontSize: 700, color: ec, opacity: 0.04,
        fontFamily: `"Noto Sans Symbols 2", serif`,
        transform: `translate(-50%, -50%) rotate(${frame * 0.1}deg)`,
        filter: "blur(4px)",
      }}>{glyph + "\uFE0E"}</div>

      {/* Top label */}
      <div style={{
        position: "absolute", top: 90, width: "100%",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.6 }}>
          <span style={{ fontSize: 22, color: ec, fontFamily: `"Noto Sans Symbols 2", serif` }}>
            {glyph + "\uFE0E"}
          </span>
          <span style={{
            fontFamily: interFamily, fontSize: 12, fontWeight: 700,
            letterSpacing: 5, color: ec, textTransform: "uppercase",
          }}>{sign}</span>
        </div>
      </div>

      {/* Glass caption — center screen */}
      <AbsoluteFill style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 32px",
      }}>
        <div style={{ opacity: opacity * exitO, transform: `scale(${scale})` }}>
          <Glass style={{ padding: "40px 48px" }}>
            <div style={{
              fontFamily: interFamily, fontSize: 80, fontWeight: 900,
              textAlign: "center", lineHeight: 1.12, letterSpacing: -1,
              position: "relative",
            }}>
              {cw.map((w, i) => (
                <span key={i} style={{
                  color: i === hlIdx ? COLORS.celestialGold : "#fff",
                  WebkitTextStroke: i === hlIdx ? "1px rgba(80,60,10,0.3)" : "1.5px rgba(0,0,0,0.4)",
                  paintOrder: "stroke fill",
                  textShadow: i === hlIdx
                    ? `0 0 30px rgba(212,175,55,0.5), 0 2px 8px rgba(0,0,0,0.4)`
                    : "0 2px 8px rgba(0,0,0,0.5)",
                }}>{w}{i < cw.length - 1 ? " " : ""}</span>
              ))}
            </div>
          </Glass>
        </div>
      </AbsoluteFill>

      {/* Progress */}
      <div style={{
        position: "absolute", bottom: 480,
        left: 90, right: 90, height: 3,
        backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 2,
      }}>
        <div style={{
          height: "100%", borderRadius: 2,
          width: `${((ai + lf / fpc) / chunks.length) * 100}%`,
          background: `linear-gradient(90deg, ${ec}, ${COLORS.celestialGold})`,
          boxShadow: `0 0 12px ${COLORS.celestialGold}60`,
        }} />
      </div>
    </AbsoluteFill>
  );
};

/* ═══ SCENE 4: CTA ═══ */
const CTAScene: React.FC<{ sign: string; ec: string; glyph: string }> = ({ sign, ec, glyph }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const e = spring({ frame, fps, config: { damping: 10, stiffness: 80 } });

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 24, padding: "0 44px",
      opacity: interpolate(e, [0, 1], [0, 1]),
      transform: `scale(${interpolate(e, [0, 1], [0.85, 1])})`,
    }}>
      <div style={{
        fontSize: 90, color: ec,
        fontFamily: `"Noto Sans Symbols 2", serif`,
        textShadow: `0 0 60px ${ec}80, 0 0 120px ${ec}40`,
        marginBottom: 8,
      }}>{glyph + "\uFE0E"}</div>

      <div style={txt(78)}>Follow for your</div>

      <div style={{
        ...txt(86),
        background: "linear-gradient(135deg, #f5e6c8 0%, #D4AF37 40%, #b8860b 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        WebkitTextStroke: "0px transparent",
        filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.9)) drop-shadow(0 0 35px rgba(212,175,55,0.4))",
      }}>daily reading ✦</div>

      <div style={{
        marginTop: 16,
        opacity: interpolate(frame, [0.4 * fps, 0.8 * fps], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        }),
      }}>
        <Glass style={{ padding: "12px 36px", borderRadius: 26 }}>
          <div style={{
            fontFamily: interFamily, fontSize: 14, fontWeight: 700,
            letterSpacing: 4, color: COLORS.celestialGold,
            textTransform: "uppercase", position: "relative",
          }}>@oliviaarcana</div>
        </Glass>
      </div>
    </AbsoluteFill>
  );
};
