"use client";

import { useEffect, useRef, useState } from "react";
import TiltCard from "./TiltCard";

const testimonials = [
  {
    quote: "I've tried every astrology app out there. Olivia is the only one that references my ACTUAL chart — not just my sun sign. The readings feel like they were written for me specifically.",
    name: "Sarah M.",
    sign: "♏ Scorpio Sun, ♓ Pisces Moon",
    avatar: "#7B68EE",
  },
  {
    quote: "The compatibility reading was scarily accurate. It identified tension points in my relationship that we've been working through for years. Now I understand the cosmic WHY behind it.",
    name: "Marcus T.",
    sign: "♌ Leo Sun, ♎ Libra Rising",
    avatar: "#D4AF37",
  },
  {
    quote: "My morning routine: coffee, then Olivia's daily reading. It's become my meditation. The transit alerts saved me during Mercury retrograde — I actually prepared for once.",
    name: "Elena K.",
    sign: "♒ Aquarius Sun, ♋ Cancer Moon",
    avatar: "#4ECDC4",
  },
];

export default function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative py-32 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <p className="font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-[0.3em] uppercase mb-4">
            From Our Community
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-warm-ivory mb-6">
            Voices from the Stars
          </h2>
          <div className="star-divider max-w-xs mx-auto">&#10022;</div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <TiltCard key={t.name} maxTilt={3}>
            <div
              className={`glass-card p-8 transition-all duration-700 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              {/* Stars rating */}
              <div className="text-celestial-gold text-sm mb-4 tracking-wider">
                &#10022; &#10022; &#10022; &#10022; &#10022;
              </div>

              {/* Quote */}
              <p className="text-warm-ivory/90 text-sm leading-relaxed mb-6 font-[family-name:var(--font-accent)] italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-void-black font-semibold text-sm"
                  style={{ background: t.avatar }}
                >
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-warm-ivory text-sm font-medium">{t.name}</p>
                  <p className="text-muted-lavender text-xs">{t.sign}</p>
                </div>
              </div>
            </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
