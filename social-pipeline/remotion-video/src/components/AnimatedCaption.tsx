import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { interFamily } from "../fonts";
import { COLORS } from "../types";

type CaptionGroup = {
  text: string;
  startFrame: number;
  endFrame: number;
};

type Props = {
  hook: string;
  body: string;
  cta: string;
};

/**
 * Word-group caption system.
 *
 * Splits combined text into 2-3 word groups.
 * Each group: spring fade-up entrance, gold highlight while active, fade-out.
 * Positioned in lower third for TikTok/Reels safe zone.
 */

function buildCaptionGroups(
  text: string,
  startFrame: number,
  endFrame: number,
): CaptionGroup[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const groups: CaptionGroup[] = [];
  let idx = 0;

  while (idx < words.length) {
    // 2-3 words per group: use 3 if first word is short
    const groupSize = words[idx].length < 5 ? 3 : 2;
    const chunk = words.slice(idx, idx + groupSize).join(" ");
    groups.push({ text: chunk, startFrame: 0, endFrame: 0 });
    idx += groupSize;
  }

  // Distribute time evenly across groups
  const totalFrames = endFrame - startFrame;
  const framesPerGroup = totalFrames / groups.length;

  for (let i = 0; i < groups.length; i++) {
    groups[i].startFrame = Math.floor(startFrame + i * framesPerGroup);
    groups[i].endFrame = Math.floor(startFrame + (i + 1) * framesPerGroup);
  }

  return groups;
}

export const AnimatedCaption: React.FC<Props> = ({ hook, body, cta }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fullText = [hook, body, cta].filter(Boolean).join(" ");

  // Captions run from 1.5s in to 1.5s before end
  const captionStart = Math.floor(1.5 * fps);
  const captionEnd = durationInFrames - Math.floor(1.5 * fps);
  const groups = buildCaptionGroups(fullText, captionStart, captionEnd);

  // Find current active group
  const activeIdx = groups.findIndex(
    (g) => frame >= g.startFrame && frame < g.endFrame,
  );
  const activeGroup = activeIdx >= 0 ? groups[activeIdx] : null;

  if (!activeGroup) return null;

  // Local frame within this group
  const localFrame = frame - activeGroup.startFrame;
  const groupDuration = activeGroup.endFrame - activeGroup.startFrame;

  // Spring entrance
  const entrance = spring({
    frame: localFrame,
    fps,
    config: { damping: 18, stiffness: 120 },
  });

  const translateY = interpolate(entrance, [0, 1], [30, 0]);
  const opacity = interpolate(entrance, [0, 1], [0, 1]);

  // Fade out in last 10% of group — keeps captions nearly continuous
  const fadeOutStart = Math.floor(groupDuration * 0.9);
  const exitOpacity = interpolate(
    localFrame,
    [fadeOutStart, groupDuration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Subtle scale pulse on entrance
  const scale = interpolate(entrance, [0, 1], [0.92, 1]);

  // Gold accent glow intensity
  const glowPulse = Math.sin(frame * 0.08) * 0.15 + 0.85;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 300,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        padding: "0 48px",
      }}
    >
      <div
        style={{
          opacity: opacity * exitOpacity,
          transform: `translateY(${translateY}px) scale(${scale})`,
        }}
      >
        {/* Glass pill background */}
        <div
          style={{
            background: "rgba(10, 8, 25, 0.65)",
            backdropFilter: "blur(12px)",
            borderRadius: 20,
            padding: "24px 40px",
            border: "1px solid rgba(212, 175, 55, 0.08)",
            boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(212,175,55,${0.03 * glowPulse})`,
          }}
        >
          <span
            style={{
              fontFamily: interFamily,
              fontSize: 64,
              fontWeight: 700,
              color: "#fff",
              textAlign: "center",
              lineHeight: 1.3,
              textShadow: `0 0 30px rgba(212,175,55,0.15), 0 2px 8px rgba(0,0,0,0.5)`,
              display: "block",
              letterSpacing: -0.5,
            }}
          >
            {activeGroup.text}
          </span>
        </div>

        {/* Gold underline accent */}
        <div
          style={{
            width: interpolate(entrance, [0, 1], [0, 120]),
            maxWidth: "50%",
            height: 2,
            background: `linear-gradient(90deg, transparent, ${COLORS.celestialGold}, transparent)`,
            opacity: 0.4 * glowPulse,
            margin: "16px auto 0",
          }}
        />
      </div>
    </div>
  );
};
