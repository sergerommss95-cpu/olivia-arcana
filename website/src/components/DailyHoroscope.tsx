"use client";

import { useEffect, useRef, useState } from "react";

const signs = [
  { name: "Aries", glyph: "♈", dates: "Mar 21 – Apr 19", element: "Fire", color: "#E8524A" },
  { name: "Taurus", glyph: "♉", dates: "Apr 20 – May 20", element: "Earth", color: "#4ECDC4" },
  { name: "Gemini", glyph: "♊", dates: "May 21 – Jun 20", element: "Air", color: "#7B68EE" },
  { name: "Cancer", glyph: "♋", dates: "Jun 21 – Jul 22", element: "Water", color: "#6B8DD6" },
  { name: "Leo", glyph: "♌", dates: "Jul 23 – Aug 22", element: "Fire", color: "#E8524A" },
  { name: "Virgo", glyph: "♍", dates: "Aug 23 – Sep 22", element: "Earth", color: "#4ECDC4" },
  { name: "Libra", glyph: "♎", dates: "Sep 23 – Oct 22", element: "Air", color: "#7B68EE" },
  { name: "Scorpio", glyph: "♏", dates: "Oct 23 – Nov 21", element: "Water", color: "#6B8DD6" },
  { name: "Sagittarius", glyph: "♐", dates: "Nov 22 – Dec 21", element: "Fire", color: "#E8524A" },
  { name: "Capricorn", glyph: "♑", dates: "Dec 22 – Jan 19", element: "Earth", color: "#4ECDC4" },
  { name: "Aquarius", glyph: "♒", dates: "Jan 20 – Feb 18", element: "Air", color: "#7B68EE" },
  { name: "Pisces", glyph: "♓", dates: "Feb 19 – Mar 20", element: "Water", color: "#6B8DD6" },
];

export default function DailyHoroscope() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section id="daily" className="relative py-32 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-[0.3em] uppercase mb-4">
            Daily Horoscope
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-warm-ivory mb-4">
            Today&apos;s Cosmic Weather
          </h2>
          <p className="text-muted-lavender text-sm">{today}</p>
          <div className="star-divider max-w-xs mx-auto mt-6">&#10022;</div>
        </div>

        {/* Zodiac wheel / grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {signs.map((sign, i) => (
            <button
              key={sign.name}
              onClick={() => setSelected(selected === i ? null : i)}
              className={`glass-card p-4 text-center transition-all duration-500 hover:scale-105 cursor-pointer ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              } ${
                selected === i
                  ? "ring-1 ring-celestial-gold/50 scale-105"
                  : ""
              }`}
              style={{
                transitionDelay: `${i * 50}ms`,
                borderColor: selected === i ? sign.color + "50" : undefined,
              }}
            >
              <div
                className="text-3xl md:text-4xl mb-2 transition-transform duration-300"
                style={{ color: sign.color }}
              >
                {sign.glyph}
              </div>
              <div className="font-[family-name:var(--font-heading)] text-sm font-semibold text-warm-ivory">
                {sign.name}
              </div>
              <div className="text-xs text-muted-lavender/60 mt-1">
                {sign.dates}
              </div>
            </button>
          ))}
        </div>

        {/* Selected sign reading preview */}
        {selected !== null && (
          <div className="mt-8 glass-card p-8 max-w-2xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl" style={{ color: signs[selected].color }}>
                {signs[selected].glyph}
              </span>
              <div>
                <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-warm-ivory">
                  {signs[selected].name}
                </h3>
                <p className="text-xs text-muted-lavender">
                  {signs[selected].element} Sign &middot; {signs[selected].dates}
                </p>
              </div>
            </div>

            <p className="text-muted-lavender leading-relaxed mb-6">
              Today&apos;s planetary alignments bring a shift in energy for {signs[selected].name}.
              The current transits are activating key areas of your chart, creating opportunities
              for growth and self-discovery. For your full personalized reading based on YOUR
              exact birth chart — not just your sun sign — start a conversation with Olivia.
            </p>

            <a
              href={`https://t.me/OliviaArcanaBot?start=daily_${signs[selected].name.toLowerCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-celestial-gold/10 border border-celestial-gold/30 text-celestial-gold text-sm font-medium hover:bg-celestial-gold/20 transition-all"
            >
              Get Your Personal {signs[selected].name} Reading
              <span>&rarr;</span>
            </a>
          </div>
        )}

        {/* Teaser CTA */}
        {selected === null && (
          <div className="mt-12 text-center">
            <p className="text-muted-lavender/60 text-sm">
              Select your sign above for today&apos;s preview &mdash; or get your{" "}
              <a
                href="https://t.me/OliviaArcanaBot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-celestial-gold hover:underline"
              >
                full personal reading
              </a>{" "}
              calculated from your exact birth chart.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
