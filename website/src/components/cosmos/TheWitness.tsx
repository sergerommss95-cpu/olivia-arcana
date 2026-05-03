"use client";

import React from "react";
import dynamic from "next/dynamic";

const LivingOrb = dynamic(() => import("@/components/orb/LivingOrb"), {
  ssr: false,
  loading: () => (
    <div className="witness-orb-fallback" aria-hidden="true">
      <div className="witness-orb-fallback__glow" />
      <div className="witness-orb-fallback__inner" />
      <style jsx>{`
        .witness-orb-fallback {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          background: radial-gradient(circle at 40% 30%, rgba(255, 245, 200, 0.22), transparent 28%),
            radial-gradient(circle at 60% 55%, rgba(210, 175, 55, 0.15), transparent 40%);
          box-shadow: inset 0 0 40px rgba(255, 220, 150, 0.14);
        }

        .witness-orb-fallback__glow {
          position: absolute;
          inset: -12%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 242, 187, 0.28), transparent 42%);
          filter: blur(22px);
        }

        .witness-orb-fallback__inner {
          position: absolute;
          inset: 14%;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.3), transparent 40%),
            radial-gradient(circle at 45% 65%, rgba(229, 180, 97, 0.16), transparent 28%);
          filter: blur(0.5px);
        }
      `}</style>
    </div>
  ),
});

interface WitnessProps {
  isAsking?: boolean;
  isProcessing?: boolean;
  userInputLength?: number;
  scrollProgress?: number;
}

export default function TheWitness({ isAsking, isProcessing, userInputLength, scrollProgress = 0 }: WitnessProps) {
  return (
    <div
      className="witness-orb-container"
      style={{
        width: "min(400px, 72vw)",
        height: "min(400px, 72vw)",
        cursor: "pointer",
      }}
    >
      <LivingOrb
        isAsking={isAsking}
        isProcessing={isProcessing}
        userInputLength={userInputLength}
        scrollProgress={scrollProgress}
      />

      <style jsx>{`
        .witness-orb-container {
          filter: drop-shadow(0 0 50px rgba(0, 0, 0, 0.45));
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(4px) ;
          border-radius: 50%;
          mask-image: radial-gradient(circle at center, black 40%, transparent 70%);
        }

        @media (max-width: 768px) {
          .witness-orb-container {
            backdrop-filter: blur(2px) ;
          }
        }

        .witness-orb-container:hover {
          transform: scale(1.02) translateY(-5px);
        }
      `}</style>
    </div>
  );
}
