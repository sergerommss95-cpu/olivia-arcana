/**
 * LivingOliveMark.tsx — Generative Brand Identity
 * 
 * Replaces the static olive-mark.svg with a reactive, elemental version.
 * Implements the 2026 'Generative Identity' trend.
 */

"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useProfile } from "../lib/user/profile-store";
import { getMissionProgress } from "../lib/missions";

interface Props {
  size?: number;
  className?: string;
  animate?: boolean;
}

const ELEMENT_STYLES = {
  Fire:  { color1: "#f79a9a", color2: "#e8524a", glow: "rgba(232, 82, 74, 0.4)",  speed: "1.8s" },
  Water: { color1: "#9ac4f7", color2: "#6b8dd6", glow: "rgba(107, 141, 214, 0.4)", speed: "3.5s" },
  Air:   { color1: "#c8b4ff", color2: "#7b68ee", glow: "rgba(123, 104, 238, 0.4)", speed: "2.4s" },
  Earth: { color1: "#9af7c4", color2: "#4ecdc4", glow: "rgba(78, 205, 196, 0.4)",  speed: "4s" },
  None:  { color1: "#f7e39a", color2: "#d4af37", glow: "rgba(212, 175, 55, 0.3)",  speed: "3s" },
};

type ElementKey = keyof typeof ELEMENT_STYLES;

function resolveElement(sign: string): ElementKey {
  if (["Aries", "Leo", "Sagittarius"].includes(sign)) return "Fire";
  if (["Cancer", "Scorpio", "Pisces"].includes(sign)) return "Water";
  if (["Gemini", "Libra", "Aquarius"].includes(sign)) return "Air";
  if (["Taurus", "Virgo", "Capricorn"].includes(sign)) return "Earth";
  return "None";
}

export default function LivingOliveMark({ size = 32, className, animate = true }: Props) {
  const { profile } = useProfile();
  const [bloom, setBloom] = useState(false);
  const [points, setPoints] = useState(0);
  
  useEffect(() => {
    // Initial load
    requestAnimationFrame(() => {
      setPoints(getMissionProgress().totalPoints);
    });

    // Listen for growth events
    const onMission = () => {
      setPoints(getMissionProgress().totalPoints);
      setBloom(true);
      setTimeout(() => setBloom(false), 2000);
    };
    window.addEventListener("mission:completed", onMission);
    return () => window.removeEventListener("mission:completed", onMission);
  }, []);

  const element = profile ? resolveElement(profile.signName) : "None";
  const style = ELEMENT_STYLES[element];
  
  // Complexity factor based on points (0-100)
  const growth = 1.0 + (points / 200); // Max 50% larger

  const gradientId = useMemo(() => `olive-grad-${element.toLowerCase()}`, [element]);

  return (
    <svg 
      width={size * growth} 
      height={size * growth} 
      viewBox="0 0 32 32" 
      className={className}
      role="img"
      aria-label={`Olivia Arcana — ${element} olive mark`}
      style={{
        transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
        filter: bloom ? "drop-shadow(0 0 15px white)" : "none"
      }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={style.color1}>
            {animate && (
              <animate 
                attributeName="stop-color" 
                values={`${style.color1};${style.color2};${style.color1}`} 
                dur={style.speed} 
                repeatCount="indefinite" 
              />
            )}
          </stop>
          <stop offset="100%" stopColor={style.color2} />
        </linearGradient>

        <filter id="olive-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <g transform="translate(16 16)" style={{ filter: animate ? "url(#olive-glow)" : "none" }}>
        {/* Animated Sprig Group */}
        <g className="sprig-animate">
          {/* Stem */}
          <path 
            d="M 0,12 C 1.6,6 -1.6,0 0,-6 C 1,-10 -0.5,-12 0,-13"
            fill="none" 
            stroke={`url(#${gradientId})`}
            strokeWidth="1.4" 
            strokeLinecap="round"
          />

          {/* Leaves */}
          <g fill={`url(#${gradientId})`}>
            <path d="M 0.5,7 Q 5.5,3 8.5,5 Q 5.5,8 0.5,7 Z" opacity="0.95" />
            <path d="M -0.5,1 Q -7,-3 -9.5,-1.5 Q -7,1.5 -0.5,1 Z" opacity="0.95" />
            <path d="M 0.5,-5 Q 5.5,-9 8.5,-7 Q 5.5,-4 0.5,-5 Z" opacity="0.95" />
          </g>

          {/* Fruit */}
          <ellipse cx="0" cy="-13.5" rx="1.8" ry="2.3" fill={`url(#${gradientId})`} />
          <circle cx="-0.6" cy="-14.3" r="0.45" fill="rgba(255,250,220,0.9)" />
        </g>
      </g>

      <style jsx>{`
        .sprig-animate {
          transform-origin: center;
          animation: ${animate ? `olive-breath ${style.speed} ease-in-out infinite` : 'none'};
        }
        @keyframes olive-breath {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50%      { transform: scale(1.05) rotate(2deg); }
        }
      `}</style>
    </svg>
  );
}
