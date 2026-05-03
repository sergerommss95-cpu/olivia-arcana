"use client";

import Link from "next/link";
import { getCourse } from "../../../lib/academy/courses";
import { translateCourse } from "../../../lib/academy/translate-courses";
import LessonList from "../../../components/LessonList";
import { useLocale } from "@/lib/i18n/useLocale";

export function CourseDetailContent({ courseSlug }: { courseSlug: string }) {
  const { t, locale } = useLocale();
  const rawCourse = getCourse(courseSlug);
  const course = rawCourse ? translateCourse(rawCourse, locale) : null;
  if (!course) return null;

  const totalMinutes = course.lessons.reduce((s, l) => s + l.duration, 0);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

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

  return (
    <div style={{
      minHeight: "100vh", position: "relative", zIndex: 1,
      maxWidth: "750px", margin: "0 auto", padding: "2rem 1rem 4rem",
    }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/academy" style={{
          fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 400, minHeight: "44px", display: "inline-flex", alignItems: "center",
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: "rgba(180,170,210,0.4)", textDecoration: "none",
        }}>&larr; {t("academy_back")}</Link>
      </div>

      {/* Course header */}
      <div style={{
        textAlign: "center", marginBottom: "2.5rem",
        padding: "2rem",
        background: "rgba(8,6,20,0.4)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        border: "1px solid rgba(200,185,255,0.06)",
        borderRadius: "1.5rem",
      }}>
        <span style={{
          fontSize: "3rem",
          filter: `drop-shadow(0 0 12px ${course.color}40)`,
          display: "block", marginBottom: "0.75rem",
        }}>{course.icon}</span>

        <div style={{
          display: "flex", justifyContent: "center", gap: "0.4rem", marginBottom: "0.5rem",
        }}>
          <span style={{
            padding: "0.15rem 0.5rem", borderRadius: "100px",
            background: "rgba(200,185,255,0.06)", border: "1px solid rgba(200,185,255,0.08)",
            fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 500,
            letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(180,170,210,0.4)",
          }}>{TRACK_LABELS[course.track]}</span>
          <span style={{
            padding: "0.15rem 0.5rem", borderRadius: "100px",
            background: "rgba(200,185,255,0.06)", border: "1px solid rgba(200,185,255,0.08)",
            fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 500,
            letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(180,170,210,0.4)",
          }}>{LEVEL_LABELS[course.level]}</span>
        </div>

        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 4vw, 2rem)",
          fontWeight: 400, margin: "0 0 0.2rem",
        }}>
          <span className="text-gold-gradient">{course.title}</span>
        </h1>
        <p style={{
          fontFamily: "var(--font-accent)", fontSize: "1rem", fontWeight: 400,
          color: "rgba(196,185,228,0.55)", fontStyle: "italic", margin: "0 0 1rem",
        }}>{course.subtitle}</p>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 300,
          lineHeight: 1.7, color: "rgba(196,185,228,0.65)", margin: "0 0 1.25rem",
          maxWidth: "550px", marginLeft: "auto", marginRight: "auto",
        }}>{course.description}</p>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem" }}>
          {[
            { n: String(course.lessons.length), label: t("academy_lessons") },
            { n: `${totalHours}h`, label: t("academy_content_label") },
            { n: course.duration, label: t("academy_duration_label") },
          ].map(({ n, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "var(--font-accent)", fontSize: "1.2rem", fontWeight: 400,
                color: "rgba(240,236,255,0.8)",
              }}>{n}</div>
              <div style={{
                fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 500,
                letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(180,170,210,0.3)",
              }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Topics */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{
          fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
          letterSpacing: "0.18em", textTransform: "uppercase",
          color: "rgba(180,170,210,0.35)", marginBottom: "0.6rem",
        }}>{t("academy_what_youll_learn")}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
          {course.topics.map(topic => (
            <span key={topic} style={{
              padding: "0.3rem 0.7rem", borderRadius: "100px",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,185,255,0.06)",
              fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 400,
              color: "rgba(200,190,235,0.6)",
            }}>{topic}</span>
          ))}
        </div>
      </div>

      {/* Lesson list */}
      <div id="lessons">
        <div style={{
          fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
          letterSpacing: "0.18em", textTransform: "uppercase",
          color: "rgba(180,170,210,0.35)", marginBottom: "0.75rem",
        }}>{t("academy_lessons")}</div>
        <LessonList lessons={course.lessons} courseSlug={course.slug} />
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <div style={{
          padding: "1.5rem",
          background: "rgba(8,6,20,0.3)",
          backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          border: "1px solid rgba(200,185,255,0.05)",
          borderRadius: "1rem",
        }}>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 300,
            color: "rgba(196,185,228,0.55)", margin: "0 0 1rem",
          }}>{t("academy_course_cta")}</p>
          <a href="#lessons" style={{
            display: "inline-block", padding: "0.75rem 2rem", borderRadius: "100px",
            background: "linear-gradient(135deg, rgba(160,120,255,0.2), rgba(100,80,220,0.15))",
            border: "1px solid rgba(200,180,255,0.2)",
            color: "rgba(240,235,255,0.9)", fontSize: "0.8rem", fontWeight: 500,
            letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none",
          }}>{t("academy_start_learning")}</a>
        </div>
      </div>
    </div>
  );
}
