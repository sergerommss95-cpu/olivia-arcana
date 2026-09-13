/**
 * TarotDeckDOM.tsx — Lead Creative Technologist Edition.
 * 
 * PHYSICS-DRIVEN ORCHESTRATION:
 * - Explicit Trigonometric Fan (User "Secret Sauce").
 * - Proximity-based "Ripple" Effect (Adjacent card pushing).
 * - 3-Card Selection Logic with CSS 3D Flips.
 * - 100% Identity Sync with SVG DNA.
 */

"use client";

import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const TOTAL_CARDS = 22;
const RADIUS = 800;
const SPREAD = 100; 
const START_ANGLE = -(SPREAD / 2);

export default function TarotDeckDOM() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);

  useGSAP(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.tarot-card');
    
    cards.forEach((card, i) => {
      const isSelected = selectedCards.includes(i);
      const selIdx = selectedCards.indexOf(i);
      
      // THE "SECRET SAUCE" MATH
      const angle = START_ANGLE + (SPREAD / (TOTAL_CARDS - 1)) * i;
      const radians = angle * (Math.PI / 180);
      
      let targetX = Math.sin(radians) * RADIUS;
      let targetY = RADIUS - (Math.cos(radians) * RADIUS);
      let rotation = angle;
      let zIndex = i;
      let scale = 1;

      // Selection Physics
      if (isSelected) {
        targetX = (selIdx - 1) * 320;
        targetY = -500; 
        rotation = 0;
        scale = 1.25;
        zIndex = 500 + i;
      } 
      // Hover Ripple Physics
      else if (hoveredIndex !== null) {
        const dist = Math.abs(i - hoveredIndex);
        const proximity = Math.max(0, 1 - dist / 5);
        
        if (i === hoveredIndex) {
          targetY -= 150; 
          rotation = 0;
          scale = 1.4;
          zIndex = 1000;
        } else {
          const pushDir = i < hoveredIndex ? -1 : 1;
          targetX += pushDir * proximity * 80;
          rotation += pushDir * proximity * 10;
          targetY += proximity * 40;
        }
      }

      gsap.to(card, {
        x: targetX,
        y: targetY,
        rotationZ: rotation,
        scale: scale,
        zIndex: zIndex,
        duration: 0.8,
        ease: "power3.out",
        overwrite: true
      });
    });
  }, { dependencies: [hoveredIndex, selectedCards], scope: containerRef });

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* SHARED SVG SYMBOL DEFINITION */}
      <svg className="hidden">
        <symbol id="card-back-v2" viewBox="0 0 360 540">
          <defs>
            <radialGradient id="g-base-v2" cx="50%" cy="38%" r="70%">
              <stop offset="0%" stopColor="#181d7a" />
              <stop offset="55%" stopColor="#10134d" />
              <stop offset="100%" stopColor="#0a0d38" />
            </radialGradient>
          </defs>
          <rect width="360" height="540" fill="url(#g-base-v2)" />
          <rect x="22" y="22" width="316" height="496" rx="10" stroke="#e0b768" strokeWidth="1.2" strokeOpacity="0.8" />
          <g transform="translate(180, 270)">
            <circle r="115" stroke="#e0b768" strokeWidth="0.5" strokeOpacity="0.4" />
            <circle r="98" stroke="#e0b768" strokeWidth="0.3" strokeOpacity="0.2" />
            <g transform="scale(1.2)">
              <path d="M 0,14 C 1.5,7 -1.5,0 0,-7" stroke="#e0b768" strokeWidth="1" strokeOpacity="0.9" strokeLinecap="round" />
              <circle cy="-15" r="1.8" fill="#e0b768" />
            </g>
          </g>
        </symbol>
      </svg>

      <div className="absolute bottom-[5%] flex items-center justify-center">
        {Array.from({ length: TOTAL_CARDS }).map((_, i) => (
          <div
            key={i}
            className="tarot-card absolute cursor-pointer"
            style={{ 
              width: "220px", 
              height: "330px", 
              transformOrigin: "50% 200%",
              perspective: "1200px"
            }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => {
              setSelectedCards(prev => {
                if (prev.includes(i)) return prev.filter(idx => idx !== i);
                if (prev.length < 3) return [...prev, i];
                return prev;
              });
            }}
          >
            <div className="relative w-full h-full transition-transform duration-700" 
                 style={{ 
                   transformStyle: 'preserve-3d',
                   transform: selectedCards.includes(i) ? 'rotateY(180deg)' : 'rotateY(0deg)'
                 }}>
              {/* BACK */}
              <div className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border border-[rgba(232,233,255,0.16)] bg-[#10134d]"
                   style={{ backfaceVisibility: 'hidden' }}>
                <svg className="w-full h-full"><use href="#card-back-v2" /></svg>
              </div>

              {/* FRONT */}
              <div className="absolute inset-0 rounded-xl bg-[#e0b768] shadow-2xl flex flex-col items-center justify-center"
                   style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="text-[#15174c] font-mono text-[10px] tracking-[0.3em] uppercase opacity-40 mb-2">Fragment</div>
                <div className="text-[#15174c] font-serif text-4xl">{selectedCards.indexOf(i) + 1}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
