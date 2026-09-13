/**
 * Daily Reading — "Counsel for the day."
 *
 * Personal-Almanac register: bone paper, warm-black ink, one oxblood
 * accent. The zodiac wheel is a plate engraving, the reading a numbered
 * table of counsel — Do / Don't columns, life areas as ruled rows, the
 * day's message set as an epigraph.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import FlipRevealCard from "@/components/shaders/FlipRevealCard";
import CardInfoPanel from "@/components/daily/CardInfoPanel";
import { getDailyCard, getCardNumeral } from "@/lib/daily-card";
import { recordDraw } from "@/lib/deck-memory";
import { ALL_CARDS, type TarotCard } from "@/lib/academy/tarot-cards";
import { getSunPosition, getMoonPosition, getMoonPhase } from "../../lib/celestial";
import { getTodayHoroscope } from "../../lib/zodiac-utils";
import { LIFE_AREAS } from "../../lib/planet-interpretations";
import ZodiacWheel, { type WheelSign } from "../../components/daily/ZodiacWheel";
import WhisperText from "../../components/WhisperText";
import { textWordSpacing } from "../../lib/micro-typography";
import { loadUser } from "../../lib/user-store";
import { useLocale } from "../../lib/i18n/useLocale";
import { getAlmanacToday } from "@/lib/almanac-today";
import { nextFullMoon, nextNewMoon, nextIngress, solarReturn, cutToday, getLastCut } from "@/lib/ahead";
import { getStoredBirth } from "@/lib/birth";
import { useProfile, useStreak } from "../../lib/user/profile-store";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const SIGNS: WheelSign[] = [
  { name: "Aries",       glyph: "♈", element: "Fire",  dateRange: "Mar 21 — Apr 19" },
  { name: "Taurus",      glyph: "♉", element: "Earth", dateRange: "Apr 20 — May 20" },
  { name: "Gemini",      glyph: "♊", element: "Air",   dateRange: "May 21 — Jun 20" },
  { name: "Cancer",      glyph: "♋", element: "Water", dateRange: "Jun 21 — Jul 22" },
  { name: "Leo",         glyph: "♌", element: "Fire",  dateRange: "Jul 23 — Aug 22" },
  { name: "Virgo",       glyph: "♍", element: "Earth", dateRange: "Aug 23 — Sep 22" },
  { name: "Libra",       glyph: "♎", element: "Air",   dateRange: "Sep 23 — Oct 22" },
  { name: "Scorpio",     glyph: "♏", element: "Water", dateRange: "Oct 23 — Nov 21" },
  { name: "Sagittarius", glyph: "♐", element: "Fire",  dateRange: "Nov 22 — Dec 21" },
  { name: "Capricorn",   glyph: "♑", element: "Earth", dateRange: "Dec 22 — Jan 19" },
  { name: "Aquarius",    glyph: "♒", element: "Air",   dateRange: "Jan 20 — Feb 18" },
  { name: "Pisces",      glyph: "♓", element: "Water", dateRange: "Feb 19 — Mar 20" },
];

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const ITEM_NUMERALS = ["i", "ii", "iii"];

/* Page-local copy — the strings this page authors itself (everything else
   comes through t()). Follows the AlmanacShell en/uk pattern. */
const COPY = {
  en: {
    kicker: "Today's almanac",
    ritual: (n: number) => `Ritual — day ${n}`,
    sunIn: "Sun in",
    moonIn: "Moon in",
    skyCaption: "Fig. 1 — the sky above, today",
    cardKicker: "The card of the day",
    cardCaption: (sun: string, moon: string) => `Fig. 2 — one card for everyone, drawn under ☉ ${sun} · ☽ ${moon}`,
    cardHint: "Turn the card",
    cardCounsel: "Read it against today's counsel below ↓",
    wheelCaption: "Fig. 3 — the wheel of twelve signs",
    plate: "Plate",
    writtenFor: (name: string) => `Today's reading, written for the chart of ${name}.`,
    elements: { Fire: "Fire", Earth: "Earth", Air: "Air", Water: "Water" } as Record<WheelSign["element"], string>,
  },
  uk: {
    kicker: "Сьогоднішній альманах",
    ritual: (n: number) => `Ритуал — день ${n}`,
    sunIn: "Сонце в",
    moonIn: "Місяць у",
    skyCaption: "Мал. 1 — небо над вами сьогодні",
    cardKicker: "Карта дня",
    cardCaption: (sun: string, moon: string) => `Мал. 2 — одна карта для всіх, витягнута під ☉ ${sun} · ☽ ${moon}`,
    cardHint: "Переверніть карту",
    cardCounsel: "Прочитайте її разом із порадою дня нижче ↓",
    wheelCaption: "Мал. 3 — колесо дванадцяти знаків",
    plate: "Таблиця",
    writtenFor: (name: string) => `Сьогоднішнє читання, написане для карти ${name}.`,
    elements: { Fire: "Вогонь", Earth: "Земля", Air: "Повітря", Water: "Вода" } as Record<WheelSign["element"], string>,
  },
};

function getLifeAreaReading(sign: string, area: string, dayOfYear: number): { power: string; pressure: string } {
  let h = 0;
  for (let i = 0; i < sign.length; i++) h = (h * 31 + sign.charCodeAt(i)) | 0;
  h = Math.abs((h ^ (dayOfYear * 2654435761) ^ (area.charCodeAt(0) * 16777619)) | 0);

  const powers: Record<string, string[]> = {
    self: ["Your sense of identity is crystallizing. You know who you are today.", "Self-confidence arrives without effort. Trust it.", "An old version of yourself is falling away. Let it."],
    thinking: ["Mental clarity is unusually high. Make the important decisions now.", "A creative breakthrough is forming. Don't force it — let it arrive.", "Your communication lands perfectly today. Say the hard thing."],
    love: ["Magnetic attraction is elevated. You draw the right attention.", "Emotional vulnerability opens a door that was locked.", "A relationship truth becomes clear. Act on it with grace."],
    routine: ["Productivity flows naturally. The system works if you trust it.", "A health insight arrives. Your body is speaking — listen.", "Work feels purposeful today. Effort converts directly to results."],
    spirituality: ["Intuition is unusually sharp. Follow the quiet voice, not the loud one.", "A dream from last night carries a real message. Revisit it.", "The boundary between imagination and insight dissolves. Both are true."],
    social: ["A friendship deepens unexpectedly. Let it happen.", "Your presence shifts group dynamics positively. Show up.", "An invitation arrives that's worth accepting. Say yes."],
  };
  const pressures: Record<string, string[]> = {
    self: ["Self-doubt creeps in without evidence. Name it and it loses power.", "You're comparing yourself to someone else's highlight reel. Stop.", "An identity question resurfaces. Sit with the discomfort."],
    thinking: ["Overthinking threatens to paralyze action. Set a timer and decide.", "A miscommunication needs repair. Clarify before assuming.", "Mental fatigue is real. Rest your mind or it'll rest itself."],
    love: ["Expectations clash with reality in a relationship. Adjust or communicate.", "An old romantic pattern repeats. Recognize it this time.", "Jealousy or comparison poisons the well. Choose trust."],
    routine: ["Your schedule feels like a trap. Build in one spontaneous break.", "A health habit you've been ignoring demands attention. Today.", "Burnout signals are flashing. Ignoring them costs more than pausing."],
    spirituality: ["Spiritual bypassing tempts you. Feel the feeling before transcending it.", "Escapism looks attractive. Face reality first — then dream.", "Your inner critic disguises itself as wisdom. It's not."],
    social: ["A social obligation drains you. It's okay to decline.", "Group dynamics feel off. Trust your read on the room.", "Someone's energy affects yours. Protect your space."],
  };
  return {
    power: (powers[area] || powers.self)[h % 3],
    pressure: (pressures[area] || pressures.self)[(h >> 8) % 3],
  };
}

function getDoDont(sign: string, dayOfYear: number) {
  let h = 0;
  for (let i = 0; i < sign.length; i++) h = (h * 31 + sign.charCodeAt(i)) | 0;
  h = Math.abs((h ^ (dayOfYear * 123457)) | 0);
  const dos = ["Speak first in a difficult conversation", "Take the scenic route", "Write down what you're feeling before reacting", "Let someone help you", "Start the project you've been avoiding", "Say no to one thing today", "Move your body before noon", "Reach out to someone you've been thinking about", "Trust your first instinct", "Create before you consume", "Leave space in your schedule for nothing", "Eat something that makes you feel alive"];
  const donts = ["Respond to messages that trigger you immediately", "Compare your chapter 1 to someone's chapter 20", "Skip the meal that grounds you", "Say yes out of obligation", "Scroll past the 30-minute mark", "Ignore the tension you feel in a relationship", "Work through lunch", "Abandon your routine for someone else's agenda", "Mistake urgency for importance", "Suppress what needs expression", "Perform confidence you don't feel", "Let fear make your decisions"];
  return {
    dos: [dos[h % 12], dos[(h + 3) % 12], dos[(h + 7) % 12]],
    donts: [donts[(h + 1) % 12], donts[(h + 5) % 12], donts[(h + 9) % 12]],
  };
}

const EASE_ARR = [0.16, 1, 0.3, 1] as const;

export default function DailyPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useLocale();
  const { profile } = useProfile();
  const { streak, tick } = useStreak();
  const copy = locale === "uk" ? COPY.uk : COPY.en;

  // The card of the day — the leaf's engraving. Same card for every
  // reader today; revealed by hand, never by default.
  const [card, setCard] = useState<TarotCard>(ALL_CARDS[0]);
  const [cardReversed, setCardReversed] = useState(false);
  const [cardRevealed, setCardRevealed] = useState(false);
  const cardPanelRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLElement | null>(null);

  const handleCardFlip = useCallback(
    (rev: boolean) => {
      if (!rev) return;
      setCardRevealed(true);
      recordDraw(card.name);
      setTimeout(() => {
        cardPanelRef.current?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start",
        });
      }, 900);
    },
    [card.name]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      const daily = getDailyCard();
      setCard(daily.card);
      setCardReversed(daily.reversed);
      // Auto-select user's sun sign (prefer new profile-store, fall back to legacy user-store)
      let idx = -1;
      if (profile) {
        idx = SIGNS.findIndex((s) => s.name === profile.signName);
      } else {
        const user = loadUser();
        if (user) idx = SIGNS.findIndex((s) => s.name === user.sunSign);
      }
      if (idx >= 0) setSelected(idx);
    }, 0);

    // Advance the daily-ritual streak exactly once per local day.
    tick();
    // only fire on first mount
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Settle the content in when the sign changes — a quiet letterpress
  // reveal, skipped entirely for reduced-motion readers.
  useEffect(() => {
    if (selected === null || !contentRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      contentRef.current.style.opacity = "1";
      return;
    }
    contentRef.current.animate(
      [
        { opacity: "0", transform: "translateY(12px)" },
        { opacity: "1", transform: "translateY(0)" },
      ],
      { duration: 500, easing: EASE, fill: "forwards" }
    );
  }, [selected]);

  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const sun = mounted ? getSunPosition(now) : null;
  const moon = mounted ? getMoonPosition(now) : null;
  const moonPhase = mounted ? getMoonPhase(now) : null;
  const sign = selected !== null ? SIGNS[selected] : null;
  const doDont = sign ? getDoDont(sign.name, dayOfYear) : null;

  // The honest engine: deltas and forward ephemerides the sky itself
  // writes — day-level only, never an hour we cannot stand behind.
  const isUk = locale === "uk";
  const alm = mounted ? getAlmanacToday(locale, now) : null;
  const almTomorrow = mounted ? getAlmanacToday(locale, new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12)) : null;
  const aheadFull = mounted ? nextFullMoon(now, locale) : null;
  const aheadNew = mounted ? nextNewMoon(now, locale) : null;
  const aheadIngress = mounted ? nextIngress(now, locale) : null;
  const aheadReturn = mounted ? (() => { const b = getStoredBirth(); return b ? solarReturn(now, b) : null; })() : null;
  const INGRESS_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
  const SIGN_UK: Record<string, string> = {
    Aries: "Овні", Taurus: "Тельці", Gemini: "Близнюках", Cancer: "Раку",
    Leo: "Леві", Virgo: "Діві", Libra: "Терезах", Scorpio: "Скорпіоні",
    Sagittarius: "Стрільці", Capricorn: "Козерозі", Aquarius: "Водолії", Pisces: "Рибах",
  };
  const signName = (en: string) => (isUk ? SIGN_UK[en] ?? en : en);
  const [cutMark, setCutMark] = useState<{ year: number; no: number } | null>(null);
  useEffect(() => {
    if (mounted) setCutMark(getLastCut());
  }, [mounted]);
  const cutIsToday = cutMark !== null && cutMark.year === now.getFullYear() && cutMark.no === dayOfYear;

  return (
    <AlmanacShell>
      <div className="daily">
        {/* ── Head — the day's masthead ── */}
        <header className="daily-head">
          <Link href="/" className="back-link">
            ← {t("common_home")}
          </Link>
          <p className="alm-kicker">
            <span>№ {dayOfYear}</span>· {copy.kicker}
          </p>
          <h1 className="alm-h1">{t("daily_title")}</h1>
          <p className="dateline">
            {now.toLocaleDateString(locale === "uk" ? "uk" : "en", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
          {streak && streak.count > 1 && (
            <p className="ritual-note" aria-label={copy.ritual(streak.count)}>
              <span aria-hidden>⁂</span> {copy.ritual(streak.count)}
            </p>
          )}

          {/* Sky observations — a ruled almanac row, not pills */}
          {sun && moon && moonPhase && (
            <figure className="sky-row">
              <div className="sky-entries">
                <span className="sky-entry">
                  <span aria-hidden>☉</span> {copy.sunIn} {signName(sun.sign)}
                </span>
                <span className="sky-dot" aria-hidden>·</span>
                <span className="sky-entry">
                  <span aria-hidden>☽</span> {copy.moonIn} {signName(moon.sign)}
                </span>
                <span className="sky-dot" aria-hidden>·</span>
                <span className="sky-entry">{alm ? alm.moonPhaseName : moonPhase.phase}</span>
              </div>
              <figcaption className="alm-caption">{copy.skyCaption}</figcaption>
            </figure>
          )}

          {/* The deltas — only today's figures, and tomorrow's, because
              the sky cannot repeat itself. */}
          {alm && almTomorrow && (
            <p className="press-delta">
              ☽ {Math.round(alm.moonFraction * 100)}%{isUk ? " освітлено" : " lit"} ·{" "}
              {isUk ? "завтра" : "tomorrow"} {Math.round(almTomorrow.moonFraction * 100)}% ·{" "}
              {isUk ? alm.hourLine.replace(/^годину/, "година") : alm.hourLine} {alm.hourGlyph}
            </p>
          )}

          {/* AHEAD — the sky issues the next appointments. */}
          {mounted && (aheadFull || aheadNew || aheadIngress || aheadReturn) && (
            <p className="press-ahead">
              <span className="pa-label">{isUk ? "ПОПЕРЕДУ" : "AHEAD"}</span>
              {aheadFull && (
                <span> {isUk ? `повня за ${aheadFull.inDays} дн` : `full moon in ${aheadFull.inDays} d`}</span>
              )}
              {aheadNew && aheadNew.inDays < (aheadFull?.inDays ?? 99) && (
                <span> · {isUk ? `новий місяць за ${aheadNew.inDays} дн` : `new moon in ${aheadNew.inDays} d`}</span>
              )}
              {aheadIngress && (
                <span>
                  {" "}· ☉ → {INGRESS_GLYPHS[aheadIngress.signIndex]}︎ {isUk ? `за ${aheadIngress.inDays} дн` : `in ${aheadIngress.inDays} d`}
                </span>
              )}
              {aheadReturn && (
                <span>
                  {" "}· {isUk ? `ваше сонячне повернення за ${aheadReturn.inDays} дн` : `your solar return in ${aheadReturn.inDays} d`}
                </span>
              )}
            </p>
          )}

          {/* Back numbers — the recent leaves rest here, never counted
              against the reader. */}
          {mounted && (
            <details className="back-issues">
              <summary>{isUk ? "Минулі числа" : "Back numbers"}</summary>
              <div className="bi-rows">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i + 1), 12);
                  const a = getAlmanacToday(locale, d);
                  const no = dayOfYear - (i + 1);
                  if (no < 1) return null;
                  const wasCut = cutMark !== null && cutMark.year === d.getFullYear() && cutMark.no === no;
                  return (
                    <p key={i} className="bi-row">
                      <span className="bi-no">№ {no}</span>
                      <span className="bi-date">{a.dateLine}</span>
                      <span className="bi-moon">☽ {Math.round(a.moonFraction * 100)}% · {a.moonPhaseName}</span>
                      <span className="bi-cut" aria-hidden>{wasCut ? "⁂" : "·"}</span>
                    </p>
                  );
                })}
              </div>
            </details>
          )}

          {/* Cutting the page — one quiet gesture; never a streak. */}
          {mounted && (
            <p className="press-cut">
              {cutIsToday ? (
                <span className="cut-done">
                  {isUk ? `Лист № ${dayOfYear} — розрізано` : `Leaf No. ${dayOfYear} — cut`} <span aria-hidden>⁂</span>
                </span>
              ) : (
                <button
                  type="button"
                  className="cut-btn"
                  onClick={() => {
                    cutToday(now.getFullYear(), dayOfYear);
                    setCutMark({ year: now.getFullYear(), no: dayOfYear });
                  }}
                >
                  {isUk ? "Розрізати сьогоднішній лист" : "Cut today's leaf"} <span aria-hidden>✂︎</span>
                </button>
              )}
            </p>
          )}
        </header>

        {/* ── Act I — the card of the day ── */}
        <section className="card-act" aria-label={copy.cardKicker}>
          <p className="alm-kicker card-act-kicker">
            <span aria-hidden>✦</span> {copy.cardKicker}
          </p>
          <div className="card-stage">
            {mounted && (
              <FlipRevealCard
                card={card}
                numeral={getCardNumeral(card)}
                width={320}
                onFlip={handleCardFlip}
              />
            )}
            {!cardRevealed && <p className="card-hint">{copy.cardHint}</p>}
          </div>
          {sun && moon && (
            <p className="alm-caption card-caption">
              {copy.cardCaption(signName(sun.sign), signName(moon.sign))}
            </p>
          )}

          <MotionConfig reducedMotion="user">
            <AnimatePresence>
              {cardRevealed && (
                <motion.div
                  ref={cardPanelRef}
                  className="card-panel"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: EASE_ARR, delay: 0.3 }}
                >
                  <CardInfoPanel card={card} reversed={cardReversed} />
                  <p className="card-counsel">
                    <button
                      type="button"
                      className="card-counsel-link"
                      onClick={() =>
                        wheelRef.current?.scrollIntoView({
                          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                          block: "start",
                        })
                      }
                    >
                      {copy.cardCounsel}
                    </button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </MotionConfig>
        </section>

        {/* ── Sign selector — the engraved wheel ── */}
        <figure className="wheel-figure" ref={(el) => { wheelRef.current = el; }}>
          <ZodiacWheel
            signs={SIGNS}
            selectedIndex={selected}
            onSelect={(i) => setSelected(i)}
            centerGlyph={sign?.glyph}
            centerLabel={sign?.name}
          />
          <figcaption className="alm-caption">{copy.wheelCaption}</figcaption>
        </figure>

        {/* ── The reading ── */}
        <div className="reading-col">
          {sign && doDont ? (
            <div ref={contentRef} aria-live="polite" className="reading" style={{ opacity: 0 }}>
              <header className="sign-head">
                <span className="sign-watermark" aria-hidden>
                  {sign.glyph}
                </span>
                <p className="alm-kicker">
                  <span>
                    {copy.plate} {ROMAN[selected as number]}
                  </span>
                  · {copy.elements[sign.element]} · {sign.dateRange}
                </p>
                <h2 className="sign-name">{sign.name}</h2>
                <p className="sign-sub">{copy.writtenFor(sign.name)}</p>
                <div className="oxford-rule" aria-hidden />
              </header>

              {/* ── Do / Don't — two ruled columns ── */}
              <div className="dodont">
                <section className="dodont-col alm-card">
                  <h3 className="col-label">
                    <span className="col-tick ink" aria-hidden />
                    {t("daily_do")}
                  </h3>
                  {doDont.dos.map((d, i) => (
                    <p key={i} className={`dodont-item ${i < 2 ? "ruled" : ""}`}>
                      <span className="item-numeral" aria-hidden>{ITEM_NUMERALS[i]}.</span>
                      {d}
                    </p>
                  ))}
                </section>
                <section className="dodont-col alm-card">
                  <h3 className="col-label ox">
                    <span className="col-tick oxb" aria-hidden />
                    {t("daily_dont")}
                  </h3>
                  {doDont.donts.map((d, i) => (
                    <p key={i} className={`dodont-item ${i < 2 ? "ruled" : ""}`}>
                      <span className="item-numeral" aria-hidden>{ITEM_NUMERALS[i]}.</span>
                      {d}
                    </p>
                  ))}
                </section>
              </div>

              {/* ── Life areas — a ruled table ── */}
              <section className="areas">
                <h3 className="areas-title">{t("daily_by_life_area")}</h3>
                <div className="areas-table">
                  {LIFE_AREAS.map((area) => {
                    const reading = getLifeAreaReading(sign.name, area.key, dayOfYear);
                    return (
                      <article key={area.key} className="area-row">
                        <div className="area-head">
                          <span className="area-icon" aria-hidden>{area.icon}</span>
                          <div>
                            <h4 className="area-label">{area.label}</h4>
                            <p className="area-desc alm-caption">{area.desc}</p>
                          </div>
                        </div>
                        <div className="area-cols">
                          <div>
                            <p className="area-col-label alm-caption">{t("daily_power")}</p>
                            <p className="area-text">{reading.power}</p>
                          </div>
                          <div>
                            <p className="area-col-label alm-caption is-ox">{t("daily_pressure")}</p>
                            <p className="area-text">{reading.pressure}</p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* ── Today's message — the epigraph ── */}
              <figure className="message">
                <span className="message-mark" aria-hidden>⁂</span>
                <blockquote
                  className="message-text"
                  style={{ wordSpacing: textWordSpacing(getTodayHoroscope(sign.name)) }}
                >
                  &ldquo;<WhisperText text={getTodayHoroscope(sign.name)} delay={400} wordDelay={60} />&rdquo;
                </blockquote>
                <figcaption className="alm-caption">{t("daily_todays_message")}</figcaption>
              </figure>

              {/* CTA */}
              <div className="cta-row">
                <a href="/portrait" className="alm-btn">
                  {t("daily_get_portrait")}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden style={{ marginLeft: "0.5rem" }}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          ) : (
            <div className="empty">
              <span className="empty-mark" aria-hidden>✦</span>
              <p className="empty-line">{t("daily_select_sign")}</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .daily {
          width: min(100%, 56rem);
          margin: 0 auto;
        }

        /* ── Head ── */
        .daily-head {
          text-align: center;
          margin-bottom: clamp(1.6rem, 4vw, 2.6rem);
        }

        .daily :global(.back-link) {
          display: inline-block;
          margin-bottom: 1.4rem;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 200ms var(--ease);
        }

        .daily :global(.back-link:hover) {
          color: var(--ox);
        }

        .dateline {
          margin: 0.9rem 0 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: clamp(1.05rem, 1.8vw, 1.25rem);
          color: var(--ink-soft);
        }

        .press-delta {
          margin: 0.7rem 0 0;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-soft, rgba(232, 233, 255, 0.72));
        }

        .press-ahead {
          margin: 0.4rem 0 0;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-faint, rgba(232, 233, 255, 0.45));
        }

        .press-ahead .pa-label {
          color: var(--verdis, #8a93c8);
          letter-spacing: 0.26em;
          margin-right: 0.4rem;
        }

        .back-issues {
          margin: 1rem auto 0;
          max-width: 34rem;
          text-align: left;
        }

        .back-issues summary {
          cursor: pointer;
          list-style: none;
          text-align: center;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.58rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--ink-faint, rgba(232, 233, 255, 0.45));
        }

        .back-issues summary:hover {
          color: var(--ox, #e0b768);
        }

        .back-issues[open] summary {
          color: var(--ox, #e0b768);
        }

        .bi-rows {
          margin-top: 0.6rem;
          border-top: 1px solid rgba(232, 233, 255, 0.18);
        }

        .bi-row {
          display: flex;
          gap: 0.8rem;
          align-items: baseline;
          margin: 0;
          padding: 0.35rem 0.2rem;
          border-bottom: 1px dotted rgba(232, 233, 255, 0.18);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-soft, rgba(232, 233, 255, 0.72));
        }

        .bi-no {
          color: var(--ox, #e0b768);
          min-width: 3.4rem;
        }

        .bi-date {
          flex: 1;
        }

        .bi-moon {
          color: var(--ink-faint, rgba(232, 233, 255, 0.45));
        }

        .bi-cut {
          color: var(--ox, #e0b768);
        }

        .press-cut {
          margin: 0.9rem 0 0;
        }

        .cut-btn {
          background: none;
          border: 0;
          cursor: pointer;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ox, #e0b768);
          border-bottom: 1px dashed rgba(224, 183, 104, 0.5);
          padding: 0.2rem 0 2px;
        }

        .cut-btn:hover {
          border-bottom-style: solid;
        }

        .cut-done {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-faint, rgba(232, 233, 255, 0.45));
        }

        .cut-done span {
          color: var(--ox, #e0b768);
        }

        .ritual-note {
          margin: 0.7rem 0 0;
          color: var(--ox);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
        }

        .sky-row {
          margin: 1.8rem auto 0;
          max-width: 34rem;
        }

        .sky-entries {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: center;
          gap: 0.35rem 0.7rem;
          padding: 0.75rem 0.4rem;
          border-top: 1px solid var(--hairline);
          border-bottom: 1px solid var(--hairline);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.68rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-soft);
        }

        .sky-entry > span {
          color: var(--ink);
        }

        .sky-dot {
          color: var(--ink-faint);
        }

        .sky-row figcaption {
          margin-top: 0.7rem;
          text-align: center;
        }

        /* ── Act I — the card ── */
        .card-act {
          margin: 0 auto clamp(2.4rem, 6vw, 3.6rem);
          padding: clamp(1.6rem, 4vw, 2.6rem) 0 0;
          border-top: 1px solid var(--hairline);
          text-align: center;
        }

        .card-act-kicker {
          justify-content: center;
          margin-bottom: clamp(1.2rem, 3vw, 1.8rem);
        }

        .card-stage {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 26rem;
          /* the vitrine: the plate sits in a pool of blue-hour light */
          background: radial-gradient(38rem 24rem at 50% 42%, rgba(138, 147, 200, 0.07), rgba(232, 233, 255, 0.02) 55%, transparent 75%);
        }

        .card-hint {
          margin: 1.1rem 0 0;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--ink-faint);
          animation: hint-breath 3.6s ease-in-out infinite;
        }

        @keyframes hint-breath {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }

        .card-caption {
          margin: 1rem auto 0;
          max-width: 40rem;
        }

        .card-panel {
          position: relative;
          z-index: 5;
          margin-top: clamp(1.6rem, 4vw, 2.4rem);
          text-align: left;
        }

        .card-counsel {
          margin: 2rem 0 0;
          text-align: center;
        }

        .card-counsel-link {
          background: none;
          border: 0;
          cursor: pointer;
          padding: 0.2rem 0 2px;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ox);
          border-bottom: 1px dashed rgba(224, 183, 104, 0.5);
        }

        .card-counsel-link:hover {
          border-bottom-style: solid;
        }

        @media (prefers-reduced-motion: reduce) {
          .card-hint {
            animation: none;
          }
        }

        /* ── Wheel ── */
        .wheel-figure {
          margin: 0 auto clamp(2rem, 5vw, 3.2rem);
          max-width: 34rem;
          text-align: center;
        }

        .wheel-figure figcaption {
          margin-top: 1rem;
        }

        /* ── Reading column ── */
        .reading-col {
          max-width: 44rem;
          margin: 0 auto;
        }

        .sign-head {
          position: relative;
          padding: clamp(1.4rem, 3.5vw, 2.4rem) 0 1.4rem;
          margin-bottom: clamp(1.6rem, 4vw, 2.4rem);
          overflow: hidden;
        }

        .sign-watermark {
          position: absolute;
          right: -0.08em;
          top: 50%;
          transform: translateY(-52%);
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(9rem, 24vw, 14rem);
          line-height: 1;
          color: var(--ink);
          opacity: 0.06;
          pointer-events: none;
          user-select: none;
        }

        .sign-name {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-weight: 400;
          font-size: clamp(2.6rem, 7vw, 4.2rem);
          line-height: 1;
          letter-spacing: -0.01em;
          color: var(--ink);
        }

        .sign-sub {
          margin: 0.85rem 0 0;
          max-width: 34em;
          color: var(--ink-soft);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .oxford-rule {
          margin-top: 1.4rem;
          height: 6px;
          background: linear-gradient(180deg, var(--ink) 0 3px, transparent 3px 4.5px, var(--ink) 4.5px 5.5px, transparent 5.5px);
        }

        /* ── Do / Don't ── */
        .dodont {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: clamp(2.2rem, 5vw, 3rem);
        }

        .col-label {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin: 0 0 1rem;
          color: var(--ink);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.64rem;
          font-weight: 600;
          letter-spacing: 0.26em;
          text-transform: uppercase;
        }

        .col-label.ox {
          color: var(--ox);
        }

        .col-tick {
          width: 7px;
          height: 7px;
          border: 1px solid currentColor;
        }

        .col-tick.oxb {
          background: var(--ox);
          border-color: var(--ox);
        }

        .dodont-item {
          display: flex;
          gap: 0.55rem;
          margin: 0 0 0.6rem;
          color: var(--ink-soft);
          font-size: 0.88rem;
          line-height: 1.6;
        }

        .dodont-item.ruled {
          padding-bottom: 0.6rem;
          border-bottom: 1px solid var(--hairline);
        }

        .item-numeral {
          flex: 0 0 auto;
          min-width: 1.2em;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.72rem;
          line-height: 1.9;
        }

        /* ── Life areas ── */
        .areas {
          margin-bottom: clamp(2.2rem, 5vw, 3rem);
        }

        .areas-title {
          margin: 0 0 1.2rem;
          text-align: center;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-weight: 400;
          font-size: clamp(1.4rem, 3vw, 1.8rem);
          color: var(--ink);
        }

        .areas-table {
          border-top: 3px solid var(--ink);
        }

        .area-row {
          padding: 1.25rem 0.2rem 1.35rem;
          border-bottom: 1px solid var(--hairline);
        }

        .area-head {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .area-icon {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border: 1px solid var(--hairline);
          color: var(--ink);
          font-size: 1.05rem;
        }

        .area-label {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-weight: 500;
          font-size: 1.15rem;
          color: var(--ink);
        }

        .area-desc {
          margin: 0.2rem 0 0;
        }

        .area-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .area-col-label {
          margin: 0 0 0.45rem;
        }

        .area-col-label.is-ox {
          color: var(--ox);
        }

        .area-text {
          margin: 0;
          color: var(--ink-soft);
          font-size: 0.88rem;
          line-height: 1.65;
        }

        /* ── Message ── */
        .message {
          margin: 0 0 clamp(2.2rem, 5vw, 3rem);
          padding: clamp(1.8rem, 4vw, 2.6rem) clamp(1.2rem, 3vw, 2rem);
          border-top: 1px solid var(--hairline);
          border-bottom: 1px solid var(--hairline);
          text-align: center;
        }

        .message-mark {
          display: block;
          margin-bottom: 1rem;
          color: var(--ox);
          font-size: 1rem;
        }

        .message-text {
          margin: 0 auto;
          max-width: 34rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: clamp(1.2rem, 2.4vw, 1.45rem);
          line-height: 1.6;
          color: var(--ink);
        }

        .message-text :global(div) {
          display: inline;
        }

        .message figcaption {
          margin-top: 1.1rem;
        }

        /* ── CTA / empty ── */
        .cta-row {
          text-align: center;
        }

        .empty {
          max-width: 34rem;
          margin: 0 auto;
          padding: clamp(2.6rem, 6vw, 4rem) 1.6rem;
          border: 1px dashed var(--hairline);
          text-align: center;
        }

        .empty-mark {
          display: block;
          margin-bottom: 1.1rem;
          color: var(--ink-faint);
          font-size: 1.6rem;
        }

        .empty-line {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.2rem;
          line-height: 1.55;
          color: var(--ink-soft);
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .dodont,
          .area-cols {
            grid-template-columns: 1fr;
          }

          .area-cols {
            gap: 1rem;
          }

          .sign-watermark {
            font-size: 8rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .daily :global(.back-link) {
            transition: none;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
