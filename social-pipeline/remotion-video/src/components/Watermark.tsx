import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { COLORS } from "../types";
import { cormorantFamily } from "../fonts";

/**
 * "OLIVIA ARCANA" watermark — bottom-right, subtle entrance.
 */
export const Watermark: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [2 * fps, 3 * fps], [0, 0.18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 52,
        right: 40,
        fontFamily: cormorantFamily,
        fontSize: 14,
        fontWeight: 400,
        letterSpacing: 5,
        color: COLORS.celestialGold,
        opacity,
        textTransform: "uppercase",
      }}
    >
      Olivia Arcana
    </div>
  );
};
