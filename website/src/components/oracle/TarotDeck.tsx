/**
 * TarotDeck.tsx — Lead Creative Technologist Edition (GSAP DOM Engine).
 * 
 * PHYSICS-DRIVEN ORCHESTRATION:
 * - Explicit Trigonometric Fan (Math.sin/cos).
 * - Proximity-based "Ripple" Effect (Adjacent card pushing).
 * - 3-Card Selection Logic with CSS 3D Flips.
 * - 100% Identity Sync with SVG DNA.
 */

"use client";

import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Register GSAP for stability
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

const TOTAL_CARDS = 22;
const RADIUS = 800;
const SPREAD = 90; // Total degrees
const START_ANGLE = -(SPREAD / 2);

export default function TarotDeck() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);

  // ── THE "SECRET SAUCE" FAN MATH ──
  useGSAP(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.tarot-card');
    
    cards.forEach((card, i) => {
      const isSelected = selectedCards.includes(i);
      const selIdx = selectedCards.indexOf(i);
      
      // 1. Calculate Base Arc (Trigonometry)
      const angle = START_ANGLE + (SPREAD / (TOTAL_CARDS - 1)) * i;
      const radians = angle * (Math.PI / 180);
      
      let x = Math.sin(radians) * RADIUS;
      let y = RADIUS - (Math.cos(radians) * RADIUS);
      let rotation = angle;
      let zIndex = i;
      let scale = 1;
      const opacity = 1;

      // 2. Selection Physics
      if (isSelected) {
        x = (selIdx - 1) * 320;
        y = -400; // Move up to slots
        rotation = 0;
        scale = 1.2;
        zIndex = 100 + i;
      } 
      // 3. Hover Ripple Physics (The "Push")
      else if (hoveredIndex !== null) {
        const dist = Math.abs(i - hoveredIndex);
        const proximity = Math.max(0, 1 - dist / 5);
        
        if (i === hoveredIndex) {
          y -= 120; // Float up
          rotation = 0;
          scale = 1.3;
          zIndex = 200;
        } else {
          // Push away neighbors
          const pushDir = i < hoveredIndex ? -1 : 1;
          x += pushDir * proximity * 60;
          rotation += pushDir * proximity * 10;
          y += proximity * 20;
          zIndex = i;
        }
      }

      // 4. GSAP Execution (Transform-Only for 60FPS)
      gsap.to(card, {
        x: x,
        y: y,
        rotationZ: rotation,
        scale: scale,
        zIndex: zIndex,
        opacity: opacity,
        duration: 0.6,
        ease: "power3.out",
        overwrite: true
      });
    });
  }, { dependencies: [hoveredIndex, selectedCards], scope: containerRef });

  const handleCardClick = (i: number) => {
    setSelectedCards(prev => {
      if (prev.includes(i)) return prev.filter(idx => idx !== i);
      if (prev.length < 3) return [...prev, i];
      return prev;
    });
  };

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* The Fan Anchor (Bottom Center) */}
      <div className="absolute bottom-[-100px] flex items-center justify-center">
        {Array.from({ length: TOTAL_CARDS }).map((_, i) => (
          <div
            key={i}
            className="tarot-card absolute cursor-pointer transition-shadow duration-300"
            style={{ 
              width: "220px", 
              height: "330px", 
              transformOrigin: "50% 150%" 
            }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => handleCardClick(i)}
          >
            <div className={`relative w-full h-full preserve-3d transition-transform duration-700 ${selectedCards.includes(i) ? 'rotate-y-180' : ''}`}>
              {/* BACK FACE (Identity Parity) */}
              <div className="absolute inset-0 backface-hidden rounded-xl overflow-hidden shadow-2xl border border-white/10">
                <CardBackSVG />
              </div>

              {/* FRONT FACE (Gold Slot) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl bg-gradient-to-br from-[#f3dd8e] via-[#D4AF37] to-[#8a6818] shadow-2xl flex items-center justify-center border border-white/20">
                <div className="text-[#08061a] font-mono text-xs tracking-widest uppercase">
                  FRAGMENT {selectedCards.indexOf(i) + 1}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardBackSVG() {
  return (
    <svg className="w-full h-full" viewBox="0 0 360 540" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="card-grad" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#221348" />
          <stop offset="55%" stopColor="#0c0720" />
          <stop offset="100%" stopColor="#04030c" />
        </radialGradient>
      </defs>
      <rect width="360" height="540" fill="url(#card-grad)" />
      
      <rect x="22" y="22" width="316" height="496" rx="10" stroke="#D4AF37" strokeWidth="1.2" strokeOpacity="0.8" />
      
      <g transform="translate(180, 270)">
        <circle r="115" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.4" />
        <circle r="98" stroke="#D4AF37" strokeWidth="0.3" strokeOpacity="0.2" />
        
        {/* Olivia Logo */}
        <g transform="scale(1.2)">
          <path d="M 0,14 C 1.5,7 -1.5,0 0,-7" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.9" strokeLinecap="round" />
          <circle cy="-15" r="1.8" fill="#D4AF37" />
        </g>
      </g>
      
      <rect width="360" height="540" fill="black" opacity="0.3" style={{ mixBlendMode: 'multiply' }} />
    </svg>
  );
}
