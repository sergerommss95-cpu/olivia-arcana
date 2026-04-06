"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Share Your Birth Data",
    description: "Date, time, and place of birth. Olivia calculates your exact planetary positions using NASA's JPL ephemeris.",
    icon: "🔭",
  },
  {
    number: "02",
    title: "Receive Your Chart",
    description: "Your complete natal chart — Sun, Moon, Rising, all planets, houses, and aspects. The cosmic blueprint of who you are.",
    icon: "✨",
  },
  {
    number: "03",
    title: "Get Daily Guidance",
    description: "Every morning, Olivia overlays today's real transits onto YOUR chart. Personal, timely, and grounded in actual planetary positions.",
    icon: "🌙",
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative py-32 px-6" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <p className="font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-[0.3em] uppercase mb-4">
            How It Works
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-warm-ivory mb-6">
            Three Steps to Your Stars
          </h2>
          <div className="star-divider max-w-xs mx-auto">&#10022;</div>
        </div>

        <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-3 md:gap-12">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`text-center transition-all duration-700 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${i * 200}ms` }}
            >
              {/* Step number */}
              <div className="relative inline-block mb-6">
                <span className="text-6xl font-[family-name:var(--font-heading)] font-bold text-celestial-gold/10">
                  {step.number}
                </span>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl">
                  {step.icon}
                </span>
              </div>

              <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-warm-ivory mb-3">
                {step.title}
              </h3>

              <p className="text-muted-lavender text-sm leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>

              {/* Connecting line (not on last item) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-20 right-0 w-full h-px bg-gradient-to-r from-transparent via-celestial-gold/20 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
