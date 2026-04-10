"use client";

import React from "react";
import { motion } from "framer-motion";
import type { TarotCard } from "../../lib/academy/tarot-cards";

const EASE = [0.16, 1, 0.3, 1] as const;

interface CardInfoPanelProps {
  card: TarotCard;
  reversed: boolean;
}

function Section({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className={`glass-card ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function CardInfoPanel({ card, reversed }: CardInfoPanelProps) {
  const isMajor = card.arcana === "major";

  return (
    <div className="w-full max-w-[500px] mx-auto space-y-4 pb-12">
      {/* Card header */}
      <Section delay={0.1} className={`p-8 text-center ${isMajor ? "border-[rgba(212,175,55,0.15)]" : ""}`}>
        <div
          className="uppercase tracking-[0.2em] text-[0.55rem] font-semibold mb-2"
          style={{ color: isMajor ? "rgba(212,175,55,0.5)" : "rgba(180,170,210,0.4)" }}
        >
          {isMajor ? "Major Arcana" : `${card.suit} · Minor Arcana`}
          {reversed && " · Reversed"}
        </div>

        <h2
          className="font-[family-name:var(--font-accent)] text-[1.8rem] font-normal tracking-[0.08em] mb-2"
          style={{ color: "rgba(240,236,255,0.92)" }}
        >
          {isMajor ? (
            <span className="text-gold-gradient">{card.name}</span>
          ) : (
            card.name
          )}
        </h2>

        <div className="flex justify-center gap-1.5 flex-wrap">
          {card.keywords.map((k) => (
            <span
              key={k}
              className="px-2.5 py-1 rounded-full text-[0.65rem]"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(200,185,255,0.06)",
                color: "rgba(200,190,235,0.55)",
              }}
            >
              {k}
            </span>
          ))}
        </div>
      </Section>

      {/* Meaning */}
      <Section delay={0.2} className="p-6">
        <div
          className="uppercase tracking-[0.18em] text-[0.6rem] font-medium mb-2"
          style={{ color: reversed ? "rgba(232,82,74,0.5)" : "rgba(78,205,196,0.5)" }}
        >
          {reversed ? "Reversed Meaning" : "Upright Meaning"}
        </div>
        <p
          className="font-[family-name:var(--font-body)] text-[0.9rem] font-light leading-[1.8]"
          style={{ color: "rgba(220,210,240,0.75)" }}
        >
          {reversed ? card.reversed : card.upright}
        </p>
      </Section>

      {/* Advice */}
      <Section delay={0.3} className="p-6 text-center border-[rgba(212,175,55,0.06)]" >
        <div
          className="uppercase tracking-[0.18em] text-[0.6rem] font-medium mb-1.5"
          style={{ color: "rgba(212,175,55,0.45)" }}
        >
          Today&apos;s Advice
        </div>
        <p
          className="font-[family-name:var(--font-accent)] text-base font-normal leading-[1.7] italic"
          style={{ color: "rgba(220,210,240,0.8)" }}
        >
          {card.advice}
        </p>
      </Section>

      {/* Correspondences */}
      <motion.div
        className="grid grid-cols-3 gap-2"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.4 }}
      >
        {[
          { label: "Astrology", value: card.astrology },
          { label: "Element", value: card.element },
          { label: "Yes / No", value: card.yesNo.charAt(0).toUpperCase() + card.yesNo.slice(1) },
        ].map(({ label, value }) => (
          <div key={label} className="glass-card p-3 text-center">
            <div
              className="uppercase tracking-[0.18em] text-[0.5rem] font-medium mb-0.5"
              style={{ color: "rgba(180,170,210,0.4)" }}
            >
              {label}
            </div>
            <div
              className="font-[family-name:var(--font-accent)] text-[0.85rem] font-medium"
              style={{ color: "rgba(230,220,255,0.8)" }}
            >
              {value}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Journal prompt */}
      <Section delay={0.5} className="p-5">
        <div
          className="uppercase tracking-[0.18em] text-[0.6rem] font-medium mb-1.5"
          style={{ color: "rgba(180,170,210,0.4)" }}
        >
          Journal Prompt
        </div>
        <p
          className="font-[family-name:var(--font-body)] text-[0.82rem] font-light leading-[1.7]"
          style={{ color: "rgba(196,185,228,0.65)" }}
        >
          How does the energy of {card.name} {reversed ? "(reversed)" : ""} show
          up in your life right now? What is it asking you to pay attention to
          today?
        </p>
      </Section>
    </div>
  );
}
