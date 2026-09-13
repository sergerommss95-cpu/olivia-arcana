"use client";

/**
 * Academy — "The Curriculum."
 *
 * Personal-Almanac print register: the course catalog set as a numbered
 * syllabus. Roman-numeral course rows under hairlines, one oxblood
 * accent, mono small-caps labels. No glass, no glow.
 */

import Link from "next/link";
import { getCoursesByTrack, type Course } from "../../lib/academy/courses";
import { translateCourses } from "../../lib/academy/translate-courses";
import { useLocale } from "@/lib/i18n/useLocale";
import AlmanacShell from "@/components/almanac/AlmanacShell";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI"];
const roman = (n: number) => ROMAN[n - 1] ?? String(n);

// ── Course row — a catalog entry under a hairline ──────────────────────
function CourseRow({
  course,
  levelLabel,
  lessonsLabel,
  startHere,
}: {
  course: Course;
  levelLabel: string;
  lessonsLabel: string;
  startHere?: string;
}) {
  return (
    <Link href={`/academy/${course.slug}`} className="course-row">
      <span className="course-no" aria-hidden>
        {roman(course.number)}
      </span>
      <span className="course-glyph" aria-hidden>
        {course.icon}
      </span>
      <span className="course-main">
        <span className="course-titleline">
          <span className="course-title">{course.title}</span>
          {startHere && <span className="course-start">{startHere}</span>}
        </span>
        <span className="course-sub">{course.subtitle}</span>
        <span className="course-desc">{course.description}</span>
      </span>
      <span className="course-meta">
        <span className="course-level">{levelLabel}</span>
        <span className="course-count">
          {course.lessons.length} {lessonsLabel} · {course.duration}
        </span>
      </span>
    </Link>
  );
}

// ── Track section ──────────────────────────────────────────────────────
function TrackSection({
  numeral,
  title,
  description,
  track,
  levelLabels,
  lessonsLabel,
  locale,
  featureFirst,
  startHereLabel,
}: {
  numeral: string;
  title: string;
  description: string;
  track: string;
  levelLabels: Record<string, string>;
  lessonsLabel: string;
  locale: string;
  featureFirst?: boolean;
  startHereLabel?: string;
}) {
  const courses = translateCourses(getCoursesByTrack(track as "astrology" | "tarot" | "integrated"), locale);
  return (
    <section className="track">
      <div className="track-head">
        <p className="alm-caption">{numeral}</p>
        <h2 className="alm-h2 track-title">{title}</h2>
      </div>
      <p className="track-desc">{description}</p>
      <div className="track-list">
        {courses.map((c, i) => (
          <CourseRow
            key={c.slug}
            course={c}
            levelLabel={levelLabels[c.level] || c.level}
            lessonsLabel={lessonsLabel}
            startHere={featureFirst && i === 0 ? startHereLabel : undefined}
          />
        ))}
      </div>
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────

export function AcademyPageContent() {
  const { t, locale } = useLocale();

  const levelLabels: Record<string, string> = {
    beginner: t("academy_level_beginner"),
    intermediate: t("academy_level_intermediate"),
    advanced: t("academy_level_advanced"),
    capstone: "Capstone",
  };

  return (
    <AlmanacShell>
      <div className="acad">
        {/* ── Header ── */}
        <header className="acad-head">
          <Link href="/" className="acad-back">
            ← {t("academy_home_link")}
          </Link>
          <p className="alm-kicker acad-room">
            {locale === "uk"
              ? "ЧИТАЛЬНА ЗАЛА — друкарня також навчає, як справжні альманахи"
              : "THE READING ROOM — the press also teaches, as real almanacs did"}
          </p>
          <p className="alm-kicker">
            <span aria-hidden>✦</span>
            {t("academy_subtitle")}
          </p>
          <h1 className="alm-h1">{t("academy_title")}</h1>
          <p className="alm-lead acad-lead">
            Learn astrology and tarot at your own pace. Begin with <em className="acad-em">The Cosmic Alphabet</em> or draw
            today&apos;s card.
          </p>
        </header>

        {/* ── Instruments: 1 featured ritual + 3 references ── */}
        <section className="tools" aria-label={t("academy_card_of_day")}>
          <Link href="/academy/card-of-the-day" className="tool-featured alm-card">
            <span className="alm-kicker tool-kicker">Ritual of the day</span>
            <span className="tool-featured-title">{t("academy_card_of_day")}</span>
            <span className="tool-featured-desc">{t("academy_card_of_day_desc")}</span>
            <span className="tool-featured-cta">Draw today&apos;s card →</span>
          </Link>
          <div className="tool-stack">
            {[
              { href: "/academy/tarot-encyclopedia", icon: "◇", title: t("academy_tarot_encyclopedia"), desc: t("academy_tarot_encyclopedia_desc") },
              { href: "/academy/aspect-guide", icon: "△", title: t("academy_aspect_guide"), desc: t("academy_aspect_guide_desc") },
              { href: "/cosmos", icon: "☉", title: t("academy_live_cosmos"), desc: t("academy_live_cosmos_desc") },
            ].map((tool) => (
              <Link key={tool.href} href={tool.href} className="tool-row">
                <span className="tool-icon" aria-hidden>
                  {tool.icon}
                </span>
                <span className="tool-body">
                  <span className="tool-title">{tool.title}</span>
                  <span className="tool-desc">{tool.desc}</span>
                </span>
                <span className="tool-arrow" aria-hidden>
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="rule-star" aria-hidden>
          <span>✦</span>
        </div>

        {/* ── Track sections ── */}
        <TrackSection
          numeral={locale === "uk" ? "Полиця I · Track I" : "Shelf I · Track I"}
          title={t("academy_track_astrology")}
          description={t("academy_track_astrology_desc")}
          track="astrology"
          levelLabels={levelLabels}
          lessonsLabel={t("academy_lessons").toLowerCase()}
          locale={locale}
          featureFirst
          startHereLabel="Start Here"
        />

        <TrackSection
          numeral={locale === "uk" ? "Полиця II · Track II" : "Shelf II · Track II"}
          title={t("academy_track_tarot")}
          description={t("academy_track_tarot_desc")}
          track="tarot"
          levelLabels={levelLabels}
          lessonsLabel={t("academy_lessons").toLowerCase()}
          locale={locale}
        />

        <TrackSection
          numeral={locale === "uk" ? "Полиця III · Track III" : "Shelf III · Track III"}
          title={t("academy_track_integrated")}
          description={t("academy_track_integrated_desc")}
          track="integrated"
          levelLabels={levelLabels}
          lessonsLabel={t("academy_lessons").toLowerCase()}
          locale={locale}
        />
      </div>

      <style jsx>{`
        .acad {
          width: min(100%, 68rem);
          margin: 0 auto;
        }

        .acad-head {
          margin-bottom: clamp(2.2rem, 5vw, 3.6rem);
        }

        .acad :global(.acad-back) {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          margin-bottom: 0.9rem;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.64rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 200ms var(--ease);
        }

        .acad :global(.acad-back:hover) {
          color: var(--ox);
        }

        .acad :global(.acad-room) {
          margin-bottom: 0.4rem;
          color: var(--ink-faint);
        }

        .acad-lead {
          margin: 1.1rem 0 0;
          max-width: 58ch;
        }

        .acad-em {
          font-style: italic;
          color: var(--ox);
          /* italic serif overhang swallows the following space visually */
          padding-right: 0.18em;
        }

        /* ── Instruments ─────────────────────────────────────── */
        .tools {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: clamp(1.2rem, 3vw, 2.2rem);
          align-items: stretch;
          margin-bottom: clamp(2.2rem, 5vw, 3.6rem);
        }

        .acad :global(.tool-featured) {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          text-decoration: none;
          color: var(--ink);
          transition: border-color 250ms var(--ease);
        }

        .acad :global(.tool-featured:hover) {
          border-color: rgba(224, 183, 104, 0.45);
        }

        .acad :global(.tool-kicker) {
          margin: 0;
        }

        .acad :global(.tool-featured-title) {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(1.7rem, 3vw, 2.3rem);
          font-weight: 500;
          line-height: 1.1;
        }

        .acad :global(.tool-featured-desc) {
          color: var(--ink-soft);
          font-size: 0.92rem;
          line-height: 1.6;
          max-width: 44ch;
        }

        .acad :global(.tool-featured-cta) {
          margin-top: auto;
          padding-top: 0.9rem;
          color: var(--ox);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .tool-stack {
          display: flex;
          flex-direction: column;
          border-top: 1px solid var(--hairline);
        }

        .acad :global(.tool-row) {
          display: flex;
          align-items: baseline;
          gap: 0.9rem;
          padding: 0.95rem 0.2rem;
          border-bottom: 1px solid var(--hairline);
          text-decoration: none;
          color: var(--ink);
          transition: background 200ms var(--ease);
        }

        .acad :global(.tool-row:hover) {
          background: rgba(232, 233, 255, 0.04);
        }

        .acad :global(.tool-icon) {
          flex: 0 0 auto;
          color: var(--ox);
          font-size: 1.05rem;
          line-height: 1;
        }

        .acad :global(.tool-body) {
          flex: 1 1 auto;
          min-width: 0;
        }

        .acad :global(.tool-title) {
          display: block;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.12rem;
          font-weight: 600;
          line-height: 1.25;
        }

        .acad :global(.tool-desc) {
          display: block;
          margin-top: 0.15rem;
          color: var(--ink-soft);
          font-size: 0.8rem;
          line-height: 1.5;
        }

        .acad :global(.tool-arrow) {
          flex: 0 0 auto;
          color: var(--ink-faint);
          transition: color 200ms var(--ease);
        }

        .acad :global(.tool-row:hover .tool-arrow) {
          color: var(--ox);
        }

        /* ── Section divider ─────────────────────────────────── */
        .rule-star {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          margin: clamp(1.5rem, 3vw, 2.5rem) 0;
          color: var(--ink-faint);
        }

        .rule-star::before,
        .rule-star::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--hairline);
        }

        .rule-star span {
          font-size: 0.8rem;
        }

        /* ── Tracks ──────────────────────────────────────────── */
        .track {
          margin-bottom: clamp(2.5rem, 5vw, 4rem);
        }

        .track-head {
          display: flex;
          align-items: baseline;
          gap: 1rem;
        }

        .track-head .alm-caption {
          margin: 0;
          color: var(--ox);
        }

        .track-title {
          font-style: italic;
        }

        .track-desc {
          margin: 0.5rem 0 1.4rem;
          max-width: 62ch;
          color: var(--ink-soft);
          font-size: 0.92rem;
          line-height: 1.6;
        }

        .track-list {
          border-top: 3px solid var(--ink);
        }

        .acad :global(.course-row) {
          display: grid;
          grid-template-columns: 3rem 2rem minmax(0, 1fr) auto;
          gap: 1rem;
          align-items: baseline;
          padding: 1.15rem 0.2rem;
          border-bottom: 1px solid var(--hairline);
          text-decoration: none;
          color: var(--ink);
          transition: background 200ms var(--ease);
        }

        .acad :global(.course-row:hover) {
          background: rgba(232, 233, 255, 0.04);
        }

        .acad :global(.course-no) {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          color: var(--ink-faint);
        }

        .acad :global(.course-glyph) {
          font-size: 1.05rem;
          line-height: 1;
          color: var(--ink-soft);
          text-align: center;
        }

        .acad :global(.course-main) {
          min-width: 0;
        }

        .acad :global(.course-titleline) {
          display: flex;
          align-items: baseline;
          gap: 0.7rem;
          flex-wrap: wrap;
        }

        .acad :global(.course-title) {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(1.2rem, 2vw, 1.45rem);
          font-weight: 600;
          line-height: 1.2;
        }

        .acad :global(.course-row:hover .course-title) {
          color: var(--ox);
        }

        .acad :global(.course-start) {
          color: var(--ox);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.58rem;
          font-weight: 600;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          border: 1px solid rgba(224, 183, 104, 0.45);
          padding: 0.16rem 0.5rem;
        }

        .acad :global(.course-sub) {
          display: block;
          margin-top: 0.1rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 0.95rem;
          color: var(--ink-soft);
        }

        .acad :global(.course-desc) {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-top: 0.35rem;
          max-width: 62ch;
          color: var(--ink-soft);
          font-size: 0.84rem;
          line-height: 1.55;
        }

        .acad :global(.course-meta) {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.35rem;
          text-align: right;
        }

        .acad :global(.course-level) {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-soft);
          border: 1px solid var(--hairline);
          padding: 0.18rem 0.5rem;
        }

        .acad :global(.course-count) {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          color: var(--ink-faint);
          white-space: nowrap;
        }

        @media (max-width: 760px) {
          .tools {
            grid-template-columns: 1fr;
          }

          .acad :global(.course-row) {
            grid-template-columns: 2.2rem minmax(0, 1fr);
          }

          .acad :global(.course-glyph) {
            display: none;
          }

          .acad :global(.course-meta) {
            grid-column: 2;
            flex-direction: row;
            align-items: baseline;
            justify-content: flex-start;
            text-align: left;
            margin-top: 0.4rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .acad :global(.acad-back),
          .acad :global(.tool-featured),
          .acad :global(.tool-row),
          .acad :global(.tool-arrow),
          .acad :global(.course-row) {
            transition: none !important;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
