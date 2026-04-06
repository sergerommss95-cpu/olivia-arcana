"use client";

import { useEffect, useState } from "react";

const zodiacGlyphs = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

export default function Hero() {
  const [visible, setVisible] = useState(false);
  const [glyphIndex, setGlyphIndex] = useState(0);

  useEffect(() => {
    // Stagger reveal
    const timer = setTimeout(() => setVisible(true), 200);
    // Rotate zodiac glyph
    const interval = setInterval(() => {
      setGlyphIndex((i) => (i + 1) % zodiacGlyphs.length);
    }, 2000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6">
      {/* Radial glow behind content */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(123,104,238,0.3) 0%, rgba(212,175,55,0.1) 40%, transparent 70%)",
        }}
      />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Rotating zodiac glyph */}
        <div
          className={`text-6xl md:text-7xl text-celestial-gold mb-8 transition-all duration-1000 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "0ms" }}
        >
          <span className="inline-block animate-float" key={glyphIndex}>
            {zodiacGlyphs[glyphIndex]}
          </span>
        </div>

        {/* Main headline */}
        <h1
          className={`font-[family-name:var(--font-heading)] text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6 transition-all duration-1000 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          <span className="text-gold-gradient">Written in</span>
          <br />
          <span className="text-warm-ivory">Your Stars</span>
        </h1>

        {/* Subheadline */}
        <p
          className={`font-[family-name:var(--font-accent)] text-xl md:text-2xl text-muted-lavender max-w-2xl mx-auto mb-4 transition-all duration-1000 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "400ms" }}
        >
          Personalized astrology readings calculated from your exact planetary
          positions. Not templates — real cosmic guidance.
        </p>

        {/* NASA badge */}
        <p
          className={`text-sm text-muted-lavender/60 mb-10 transition-all duration-1000 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "500ms" }}
        >
          Powered by NASA JPL ephemeris data
        </p>

        {/* CTA buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          <a
            href="https://t.me/OliviaArcanaBot"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-8 py-4 rounded-full overflow-hidden font-medium text-void-black transition-all duration-300 hover:scale-105"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-celestial-gold to-[#F5E6A3]" />
            <span className="absolute inset-0 bg-gradient-to-r from-[#F5E6A3] to-celestial-gold opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
              Start on Telegram
            </span>
          </a>

          <a
            href="#reading"
            className="px-8 py-4 rounded-full border border-celestial-gold/30 text-celestial-gold font-medium hover:bg-celestial-gold/10 transition-all duration-300 hover:scale-105"
          >
            Get Your Free Reading
          </a>
        </div>

        {/* Social proof */}
        <div
          className={`mt-16 flex flex-col items-center gap-3 transition-all duration-1000 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "800ms" }}
        >
          <div className="flex -space-x-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-void-black"
                style={{
                  background: `linear-gradient(135deg, ${
                    ["#D4AF37", "#7B68EE", "#4ECDC4", "#E8524A", "#9B96A8"][i]
                  }, ${["#F5E6A3", "#A899CC", "#7EEEE4", "#F5A0A0", "#C4C0D0"][i]})`,
                }}
              />
            ))}
          </div>
          <p className="text-xs text-muted-lavender/60">
            Join 10,000+ seekers reading their stars daily
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border border-celestial-gold/30 flex justify-center pt-2">
          <div className="w-1 h-2 rounded-full bg-celestial-gold/50" />
        </div>
      </div>
    </section>
  );
}
