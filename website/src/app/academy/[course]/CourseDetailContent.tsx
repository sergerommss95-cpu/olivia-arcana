"use client";

/**
 * Course detail — Personal-Almanac print register.
 *
 * The course header set as an article frontispiece; stats as a dot-leader
 * table; the interactive LessonList kept mounted (all quiz/exercise/widget
 * logic intact) and repainted into ink-on-paper via scoped overrides.
 */

import Link from "next/link";
import { getCourse } from "../../../lib/academy/courses";
import { translateCourse } from "../../../lib/academy/translate-courses";
import LessonList from "../../../components/LessonList";
import { useLocale } from "@/lib/i18n/useLocale";
import AlmanacShell from "@/components/almanac/AlmanacShell";

export function CourseDetailContent({ courseSlug }: { courseSlug: string }) {
  const { t, locale } = useLocale();
  const rawCourse = getCourse(courseSlug);
  const course = rawCourse ? translateCourse(rawCourse, locale) : null;
  if (!course) return null;

  const totalMinutes = course.lessons.reduce((s, l) => s + l.duration, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  const LEVEL_LABELS: Record<string, string> = {
    beginner: t("academy_level_beginner"),
    intermediate: t("academy_level_intermediate"),
    advanced: t("academy_level_advanced"),
    capstone: "Capstone",
  };

  const TRACK_LABELS: Record<string, string> = {
    astrology: `${t("academy_track_astrology")} Track`,
    tarot: `${t("academy_track_tarot")} Track`,
    integrated: `${t("academy_track_integrated")} Track`,
  };

  const stats: Array<[string, string]> = [
    [t("academy_lessons"), String(course.lessons.length)],
    [t("academy_content_label"), `${totalHours}h`],
    [t("academy_duration_label"), course.duration],
  ];

  return (
    <AlmanacShell narrow>
      <div className="crs">
        {/* Breadcrumb */}
        <Link href="/academy" className="crs-back">
          ← {t("academy_back")}
        </Link>

        {/* Course header */}
        <header className="crs-head">
          <span className="crs-glyph" aria-hidden>
            {course.icon}
          </span>
          <p className="alm-caption crs-tags">
            {TRACK_LABELS[course.track]} · {LEVEL_LABELS[course.level]} · No. {course.number}
          </p>
          <h1 className="alm-h1">{course.title}</h1>
          <p className="crs-sub">{course.subtitle}</p>
          <p className="alm-lead crs-desc">{course.description}</p>
        </header>

        {/* Stats — dot-leader table */}
        <div className="crs-stats">
          {stats.map(([label, value]) => (
            <div key={label} className="crs-stat-row">
              <span className="crs-stat-label">{label}</span>
              <span className="crs-stat-leader" aria-hidden />
              <span className="crs-stat-value">{value}</span>
            </div>
          ))}
        </div>

        {/* Topics */}
        <section className="crs-topics" aria-label={t("academy_what_youll_learn")}>
          <p className="alm-caption crs-label">{t("academy_what_youll_learn")}</p>
          <div className="crs-topic-list">
            {course.topics.map((topic) => (
              <span key={topic} className="crs-topic">
                {topic}
              </span>
            ))}
          </div>
        </section>

        {/* Lesson list — logic kept, repainted into ink & paper below */}
        <section id="lessons">
          <p className="alm-caption crs-label">{t("academy_lessons")}</p>
          <div className="crs-lessons">
            <LessonList lessons={course.lessons} courseSlug={course.slug} />
          </div>
        </section>

        {/* CTA */}
        <div className="crs-cta alm-card">
          <p className="crs-cta-text">{t("academy_course_cta")}</p>
          <a href="#lessons" className="alm-btn">
            {t("academy_start_learning")}
          </a>
        </div>
      </div>

      <style jsx>{`
        .crs :global(.crs-back) {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          margin-bottom: 0.8rem;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.64rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 200ms var(--ease);
        }

        .crs :global(.crs-back:hover) {
          color: var(--ox);
        }

        .crs-head {
          text-align: center;
          padding-bottom: clamp(1.4rem, 3vw, 2rem);
          border-bottom: 1px solid var(--hairline);
        }

        .crs-glyph {
          display: block;
          margin-bottom: 0.7rem;
          font-size: 2.4rem;
          line-height: 1;
          color: var(--ox);
        }

        .crs-tags {
          margin: 0 0 0.9rem;
        }

        .crs-sub {
          margin: 0.5rem 0 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: clamp(1.05rem, 2vw, 1.25rem);
          color: var(--ink-soft);
        }

        .crs-desc {
          margin: 1.1rem auto 0;
          max-width: 56ch;
        }

        /* ── Stats table ─────────────────────────────────────── */
        .crs-stats {
          margin: clamp(1.4rem, 3vw, 2rem) 0;
          border-top: 3px solid var(--ink);
        }

        .crs-stat-row {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          padding: 0.75rem 0.2rem;
          border-bottom: 1px solid var(--hairline);
        }

        .crs-stat-label {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-soft);
        }

        .crs-stat-leader {
          flex: 1 1 auto;
          min-width: 2rem;
          border-bottom: 1.5px dotted rgba(232, 233, 255, 0.35);
          transform: translateY(-0.28em);
        }

        .crs-stat-value {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.15rem;
          font-weight: 600;
          font-variant-numeric: lining-nums;
          color: var(--ink);
          white-space: nowrap;
        }

        /* ── Topics ──────────────────────────────────────────── */
        .crs-topics {
          margin-bottom: clamp(1.6rem, 3vw, 2.2rem);
        }

        .crs-label {
          margin: 0 0 0.7rem;
        }

        .crs-topic-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .crs-topic {
          padding: 0.28rem 0.7rem;
          border: 1px solid var(--hairline);
          background: rgba(250, 246, 236, 0.6);
          font-size: 0.76rem;
          color: var(--ink-soft);
        }

        /* ── CTA ─────────────────────────────────────────────── */
        .crs-cta {
          margin-top: clamp(1.8rem, 4vw, 2.6rem);
          text-align: center;
        }

        .crs-cta-text {
          margin: 0 0 1.1rem;
          color: var(--ink-soft);
          font-size: 0.92rem;
          line-height: 1.6;
        }

        /* ── LessonList repaint — the component's logic is intact;
             these overrides repaint its dark inline palette into
             ink-on-paper. State colors are remapped: gold → oxblood,
             error-red → oxblood, success-teal → ink. ─────────────── */
        .crs-lessons :global(*) {
          color: var(--ink-soft) !important;
          border-color: var(--hairline) !important;
        }

        /* Titles and primary text (near-white / --c-text in the dark theme) */
        .crs-lessons :global([style*="240,236,255"]),
        .crs-lessons :global([style*="var(--c-text)"]) {
          color: var(--ink) !important;
        }

        /* Gold accents → oxblood */
        .crs-lessons :global([style*="200,168,75"]),
        .crs-lessons :global([style*="224,183,104"]),
        .crs-lessons :global([style*="var(--c-gold)"]) {
          color: var(--ox) !important;
          border-color: rgba(224, 183, 104, 0.3) !important;
        }

        /* Wrong / warning (red) → oxblood */
        .crs-lessons :global([style*="232,82,74"]) {
          color: var(--ox) !important;
          border-color: rgba(224, 183, 104, 0.45) !important;
          background-color: rgba(224, 183, 104, 0.06) !important;
        }

        /* Correct / success (teal) → ink */
        .crs-lessons :global([style*="78,205,196"]) {
          color: var(--ink) !important;
          border-color: rgba(232, 233, 255, 0.45) !important;
          background-color: rgba(232, 233, 255, 0.05) !important;
        }

        /* Purple gradient buttons (quiz "check answers") → ink pill */
        .crs-lessons :global([style*="linear-gradient"]) {
          background: var(--ink) !important;
          color: #f6f1e5 !important;
          border-color: var(--ink) !important;
        }

        /* Translucent card grounds → paper */
        .crs-lessons :global([style*="rgba(232,230,240"]) {
          background-color: rgba(250, 246, 236, 0.6) !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .crs :global(.crs-back) {
            transition: none !important;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
