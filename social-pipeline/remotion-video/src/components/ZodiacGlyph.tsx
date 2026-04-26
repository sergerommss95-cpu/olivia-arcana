import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { cormorantFamily } from "../fonts";

type Props = {
  glyph: string;
  sign: string;
  color: string;
};

/**
 * Zodiac glyph entrance — spring scale + fade, followed by sign name
 * letter-by-letter reveal beneath.
 */
export const ZodiacGlyph: React.FC<Props> = ({ glyph, sign, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Glyph entrance: spring scale from 0 -> 1
  const glyphScale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80, mass: 1.2 },
  });

  const glyphOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Subtle continuous glow pulse
  const glowIntensity = Math.sin(frame * 0.06) * 4 + 8;

  // Sign name: letter-by-letter reveal starting at 0.4s
  const signText = sign.toUpperCase();
  const letterDelay = 0.4 * fps;
  const lettersPerFrame = 0.12 * fps; // each letter takes 0.12s
  const visibleLetters = Math.min(
    signText.length,
    Math.max(0, Math.floor((frame - letterDelay) / lettersPerFrame)),
  );

  const signOpacity = interpolate(
    frame,
    [letterDelay, letterDelay + 0.3 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Orbit ring rotation
  const orbitRotation = interpolate(frame, [0, 600], [0, 360]);
  const orbitOpacity = interpolate(frame, [0.6 * fps, 1.2 * fps], [0, 0.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 200,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      {/* Glow aura behind glyph */}
      <div
        style={{
          position: "absolute",
          top: 20,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}18 0%, ${color}08 40%, transparent 70%)`,
          opacity: glyphOpacity,
          transform: `scale(${glyphScale * 1.1})`,
        }}
      />

      {/* Orbit ring */}
      <div
        style={{
          position: "absolute",
          top: -10,
          width: 340,
          height: 340,
          borderRadius: "50%",
          border: `1px solid ${color}`,
          opacity: orbitOpacity,
          transform: `rotate(${orbitRotation}deg)`,
        }}
      >
        {/* Orbiting dot */}
        <div
          style={{
            position: "absolute",
            top: -3,
            left: "50%",
            marginLeft: -3,
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>

      {/* Glyph — force text rendering (not emoji) via VS15 selector */}
      <div
        style={{
          fontSize: 200,
          lineHeight: 1,
          fontFamily: `"Noto Sans Symbols 2", "Segoe UI Symbol", ${cormorantFamily}, serif`,
          color,
          opacity: glyphOpacity,
          transform: `scale(${glyphScale})`,
          textShadow: `0 0 ${glowIntensity * 1.5}px ${color}50, 0 0 ${glowIntensity * 3}px ${color}25, 0 0 ${glowIntensity * 6}px ${color}10`,
          filter: `drop-shadow(0 0 ${glowIntensity * 2}px ${color}40)`,
        }}
      >
        {glyph + "\uFE0E"}
      </div>

      {/* Sign name — refined spacing */}
      <div
        style={{
          fontFamily: cormorantFamily,
          fontSize: 44,
          fontWeight: 500,
          letterSpacing: 14,
          color: "#D4AF37",
          opacity: signOpacity,
          marginTop: 16,
          textShadow: "0 0 20px rgba(212,175,55,0.15)",
        }}
      >
        {signText.slice(0, visibleLetters)}
        {visibleLetters < signText.length && (
          <span style={{ opacity: 0.2 }}>
            {signText.slice(visibleLetters)}
          </span>
        )}
      </div>

      {/* Gold divider line — gradient fade */}
      <div
        style={{
          width: interpolate(
            frame,
            [0.8 * fps, 1.5 * fps],
            [0, 360],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          height: 1,
          background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
          opacity: 0.5,
          marginTop: 12,
        }}
      />
    </div>
  );
};
