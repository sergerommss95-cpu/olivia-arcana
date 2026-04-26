import React from "react";
import { Composition } from "remotion";
import { ZodiacDaily } from "./ZodiacDaily";
import { ColorProphecy } from "./ColorProphecy";
import { OliviaMysticOracle, OliviaMysticOracleProps } from "./OliviaMysticOracle";
import { ZodiacVideoProps } from "./types";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ZodiacDaily"
        component={ZodiacDaily}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={
          {
            sign: "Aries",
            glyph: "\u2648",
            element: "fire",
            hook: "Aries, the universe has a message for you today.",
            body: "Mars is igniting your fifth house of creativity. Bold ideas are flowing and the cosmos is daring you to act. Trust the fire inside you. This is not the day to play it safe.",
            cta: "Follow Olivia Arcana for your daily cosmic guidance.",
            audioSrc: null,
            durationInFrames: 600,
          } satisfies ZodiacVideoProps
        }
      />
      <Composition
        id="OliviaMysticOracle"
        component={OliviaMysticOracle}
        durationInFrames={15 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={
          {
            sign: "Taurus",
            cardName: "The Empress",
            oracleLines: ["Trust the quiet hand", "that steadies you today."],
            ctaText: "oliviaarcana.bot",
            glyphPath: "olivia/taurus-glyph.svg",
            narrationPath: "olivia/narration.wav",
            musicPath: "olivia/drone.wav",
          } satisfies OliviaMysticOracleProps
        }
      />
      <Composition
        id="ColorProphecy"
        component={ColorProphecy}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          sign: "Aries",
          glyph: "\u2648",
          element: "fire" as const,
          hook: "Aries, the universe has a message for you today.",
          body: "Mars is igniting your fifth house of creativity. Bold ideas are flowing and the cosmos is daring you to act. Trust the fire inside you. This is not the day to play it safe. A powerful shift is coming that will change everything.",
          cta: "Follow for your daily reading",
        }}
      />
    </>
  );
};
