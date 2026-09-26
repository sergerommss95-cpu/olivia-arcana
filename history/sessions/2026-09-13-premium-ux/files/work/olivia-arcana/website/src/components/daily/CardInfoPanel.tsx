"use client";

/**
 * CardInfoPanel — Personal-Almanac print register.
 *
 * Meaning, advice, correspondences, journal prompt, and the ritual-
 * continuity next step, set as hairline index cards on bone paper.
 * All logic (locale, suggested action, motion reveals) intact.
 */

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { TarotCard } from "../../lib/academy/tarot-cards";
import { useLocale } from "@/lib/i18n/useLocale";
import { getSuggestedAction } from "../../lib/ritual-continuity";

const EASE = [0.16, 1, 0.3, 1] as const;

const INK = "var(--ink, #e8dcc8)";
const INK_SOFT = "var(--ink-soft, rgba(232,233,255,0.72))";
const INK_FAINT = "var(--ink-faint, rgba(232,233,255,0.45))";
const HAIRLINE = "var(--hairline, rgba(232,233,255,0.18))";
const OX = "var(--ox, #e0b768)";
const SERIF = "var(--font-heading, 'Cormorant Garamond'), serif";
const MONO = "var(--font-mono, ui-monospace), monospace";
const BODY = "var(--font-body, system-ui), sans-serif";

const cardSt: React.CSSProperties = {
  border: `1px solid ${HAIRLINE}`,
  background: "var(--paper-bone, #0f1240)",
};

const labelSt: React.CSSProperties = {
  fontFamily: MONO,
  color: INK_FAINT,
};

interface CardInfoPanelProps {
  card: TarotCard;
  reversed: boolean;
}

function Section({
  children,
  delay = 0,
  className = "",
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className={className}
      style={{ ...cardSt, ...style }}
    >
      {children}
    </motion.div>
  );
}

export default function CardInfoPanel({ card, reversed }: CardInfoPanelProps) {
  const { t } = useLocale();
  const isMajor = card.arcana === "major";
  const action = getSuggestedAction(card.name, card.element);

  return (
    <div className="w-full max-w-[500px] mx-auto space-y-4 pb-12">
      {/* Card header */}
      <Section
        delay={0.1}
        className="p-8 text-center"
        style={isMajor ? { borderColor: "rgba(224, 183, 104, 0.4)" } : undefined}
      >
        <div
          className="uppercase tracking-[0.2em] text-[0.55rem] font-semibold mb-2"
          style={{ ...labelSt, color: isMajor ? OX : INK_FAINT }}
        >
          {isMajor ? t("academy_major_arcana") : `${card.suit} · ${t("academy_minor_arcana")}`}
          {reversed && ` · ${t("academy_reversed")}`}
        </div>

        <h2
          className="text-[1.8rem] font-medium mb-2"
          style={{ fontFamily: SERIF, color: INK, lineHeight: 1.1 }}
        >
          {card.name}
        </h2>

        <div className="flex justify-center gap-1.5 flex-wrap">
          {card.keywords.map((k) => (
            <span
              key={k}
              className="px-2.5 py-1 text-[0.65rem]"
              style={{
                background: "rgba(232, 233, 255, 0.03)",
                border: `1px solid ${HAIRLINE}`,
                color: INK_SOFT,
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
          style={{ ...labelSt, color: reversed ? OX : INK_SOFT }}
        >
          {reversed ? t("academy_reversed") : t("academy_upright")}
        </div>
        <p
          className="text-[0.9rem] leading-[1.8]"
          style={{ fontFamily: BODY, color: INK_SOFT }}
        >
          {reversed ? card.reversed : card.upright}
        </p>
      </Section>

      {/* Advice */}
      <Section
        delay={0.3}
        className="p-6 text-center"
        style={{ borderColor: "rgba(224, 183, 104, 0.35)" }}
      >
        <div
          className="uppercase tracking-[0.18em] text-[0.6rem] font-medium mb-1.5"
          style={{ ...labelSt, color: OX }}
        >
          {t("academy_advice")}
        </div>
        <p
          className="text-[1.05rem] leading-[1.6] italic"
          style={{ fontFamily: SERIF, color: INK }}
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
          { label: t("academy_astrology_label"), value: card.astrology },
          { label: t("academy_element_label"), value: card.element },
          { label: t("academy_yesno_label"), value: card.yesNo.charAt(0).toUpperCase() + card.yesNo.slice(1) },
        ].map(({ label, value }) => (
          <div key={label} className="p-3 text-center" style={cardSt}>
            <div
              className="uppercase tracking-[0.18em] text-[0.5rem] font-medium mb-0.5"
              style={labelSt}
            >
              {label}
            </div>
            <div
              className="text-[0.95rem] font-medium"
              style={{ fontFamily: SERIF, color: INK }}
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
          style={labelSt}
        >
          {t("academy_journal_prompt")}
        </div>
        <p
          className="text-[0.82rem] leading-[1.7]"
          style={{ fontFamily: BODY, color: INK_SOFT }}
        >
          How does the energy of {card.name} {reversed ? "(reversed)" : ""} show
          up in your life right now? What is it asking you to pay attention to
          today?
        </p>
      </Section>

      {/* Ritual Continuity — Next Step */}
      <Section delay={0.6} className="p-5" style={{ borderColor: "rgba(224, 183, 104, 0.35)" }}>
        <div
          className="uppercase tracking-[0.2em] text-[0.55rem] font-semibold mb-3"
          style={{ ...labelSt, color: OX }}
        >
          ✦ Next Logical Action
        </div>
        <div>
          <p
            className="text-[0.78rem] leading-[1.6]"
            style={{ fontFamily: BODY, color: INK_SOFT }}
          >
            {action.reason}
          </p>
          <Link
            href={action.href}
            style={{
              display: "inline-block",
              marginTop: "0.75rem",
              textDecoration: "none",
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: OX,
              borderBottom: "1px solid rgba(224, 183, 104, 0.35)",
              paddingBottom: "0.2rem",
            }}
          >
            {action.label} &rarr;
          </Link>
        </div>
      </Section>
    </div>
  );
}
