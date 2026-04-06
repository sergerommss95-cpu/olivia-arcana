"use client";

import { useEffect, useRef, useState } from "react";

export default function CTA() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative py-32 px-6" ref={ref}>
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)",
        }}
      />

      <div
        className={`relative max-w-3xl mx-auto text-center transition-all duration-1000 ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        }`}
      >
        <div className="text-5xl mb-6 animate-float">☽</div>

        <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold mb-6">
          <span className="text-gold-gradient">Your Stars Are Waiting</span>
        </h2>

        <p className="font-[family-name:var(--font-accent)] text-xl text-muted-lavender mb-10 max-w-xl mx-auto">
          The cosmos has been writing your story since the moment you were born.
          It&apos;s time to read it.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://t.me/OliviaArcanaBot"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-10 py-4 rounded-full overflow-hidden font-semibold text-void-black transition-all duration-300 hover:scale-105"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-celestial-gold to-[#F5E6A3]" />
            <span className="absolute inset-0 bg-gradient-to-r from-[#F5E6A3] to-celestial-gold opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative">Get Your Free Reading</span>
          </a>
        </div>

        <p className="mt-6 text-xs text-muted-lavender/40">
          Free birth chart reading. No payment required. Takes 2 minutes.
        </p>
      </div>
    </section>
  );
}
