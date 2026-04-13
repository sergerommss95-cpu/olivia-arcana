"use client";

import Link from "next/link";
import { COURSES, getCoursesByTrack, getTotalLessons, type Course } from "../../lib/academy/courses";
import { useLocale } from "@/lib/i18n/useLocale";

const LEVEL_COLORS: Record<string, string> = {
  beginner: "rgba(78,205,196,0.5)",
  intermediate: "rgba(212,175,55,0.5)",
  advanced: "rgba(232,82,74,0.5)",
  capstone: "rgba(123,104,238,0.5)",
};

function CourseCard({ course, levelLabel, lessonsLabel }: { course: Course; levelLabel: string; lessonsLabel: string }) {
  return (
    <Link
      href={`/academy/${course.slug}`}
      style={{
        display: "flex", flexDirection: "column", gap: "0.75rem",
        padding: "1.5rem",
        background: "rgba(8,6,20,0.45)",
        backdropFilter: "blur(20px) saturate(1.2)",
        WebkitBackdropFilter: "blur(20px) saturate(1.2)",
        border: "1px solid rgba(200,185,255,0.06)",
        borderRadius: "1.25rem",
        textDecoration: "none",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{
          fontSize: "2rem",
          filter: `drop-shadow(0 0 8px ${course.color}40)`,
        }}>{course.icon}</span>
        <div style={{ display: "flex", gap: "0.3rem" }}>
          <span style={{
            padding: "0.15rem 0.5rem", borderRadius: "100px",
            background: `${LEVEL_COLORS[course.level]}15`,
            border: `1px solid ${LEVEL_COLORS[course.level]}25`,
            fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: LEVEL_COLORS[course.level],
          }}>{levelLabel}</span>
        </div>
      </div>

      {/* Title */}
      <div>
        <div style={{
          fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 500,
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: "rgba(180,170,210,0.35)", marginBottom: "0.2rem",
        }}>Course {course.number}</div>
        <h3 style={{
          fontFamily: "var(--font-accent)", fontSize: "1.15rem", fontWeight: 500,
          color: "rgba(240,236,255,0.9)", margin: "0 0 0.15rem",
          letterSpacing: "0.02em",
        }}>{course.title}</h3>
        <div style={{
          fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 300,
          color: "rgba(196,185,228,0.5)", fontStyle: "italic",
        }}>{course.subtitle}</div>
      </div>

      {/* Description */}
      <p style={{
        fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300,
        lineHeight: 1.6, color: "rgba(196,185,228,0.6)", margin: 0,
        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const,
        overflow: "hidden",
      }}>{course.description}</p>

      {/* Footer stats */}
      <div style={{
        display: "flex", gap: "1rem", marginTop: "auto",
        paddingTop: "0.75rem",
        borderTop: "1px solid rgba(200,185,255,0.04)",
      }}>
        <span style={{
          fontFamily: "var(--font-body)", fontSize: "0.65rem",
          color: "rgba(180,170,210,0.4)",
        }}>{course.lessons.length} {lessonsLabel}</span>
        <span style={{
          fontFamily: "var(--font-body)", fontSize: "0.65rem",
          color: "rgba(180,170,210,0.4)",
        }}>{course.duration}</span>
      </div>
    </Link>
  );
}

function TrackSection({ title, description, track, icon, levelLabels, lessonsLabel }: {
  title: string; description: string; track: string; icon: string;
  levelLabels: Record<string, string>; lessonsLabel: string;
}) {
  const courses = getCoursesByTrack(track as any);
  return (
    <section style={{ marginBottom: "3rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "1.3rem", color: "rgba(212,175,55,0.5)" }}>{icon}</span>
        <h2 style={{
          fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 400,
          margin: 0,
        }}>
          <span className="text-gold-gradient">{title}</span>
        </h2>
      </div>
      <p style={{
        fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
        color: "rgba(196,185,228,0.5)", margin: "0 0 1.5rem",
      }}>{description}</p>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
        gap: "1rem",
      }}>
        {courses.map(c => (
          <CourseCard
            key={c.slug}
            course={c}
            levelLabel={levelLabels[c.level] || c.level}
            lessonsLabel={lessonsLabel}
          />
        ))}
      </div>
    </section>
  );
}

export function AcademyPageContent() {
  const { t } = useLocale();
  const totalLessons = getTotalLessons();

  const levelLabels: Record<string, string> = {
    beginner: t("academy_level_beginner"),
    intermediate: t("academy_level_intermediate"),
    advanced: t("academy_level_advanced"),
    capstone: "Capstone",
  };

  return (
    <div style={{
      minHeight: "100vh", position: "relative", zIndex: 1,
      maxWidth: "1000px", margin: "0 auto", padding: "2rem 1.5rem 4rem",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <Link href="/" style={{
          fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 400,
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: "rgba(180,170,210,0.4)", textDecoration: "none",
        }}>&larr; {t("academy_home_link")}</Link>

        <div style={{ fontSize: "2.5rem", color: "rgba(212,175,55,0.3)", marginTop: "1.5rem", marginBottom: "0.75rem" }}>&#10022;</div>

        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
          fontWeight: 400, margin: "0 0 0.5rem",
        }}>
          <span className="text-gold-gradient">{t("academy_title")}</span>
        </h1>

        <p style={{
          fontFamily: "var(--font-accent)", fontSize: "1.1rem", fontWeight: 400,
          color: "rgba(196,185,228,0.6)", fontStyle: "italic",
          margin: "0 0 1.5rem",
        }}>{t("academy_subtitle")}</p>

        {/* Stats */}
        <div style={{
          display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap",
        }}>
          {[
            { n: "14", label: t("academy_courses") },
            { n: String(totalLessons), label: t("academy_lessons") },
            { n: "3", label: t("academy_tracks") },
            { n: "~65", label: t("academy_weeks") },
          ].map(({ n, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "var(--font-accent)", fontSize: "1.5rem", fontWeight: 400,
                color: "rgba(240,236,255,0.85)",
              }}>{n}</div>
              <div style={{
                fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
                letterSpacing: "0.15em", textTransform: "uppercase",
                color: "rgba(180,170,210,0.35)",
              }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Tools */}
      <div style={{ marginBottom: "3rem" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))",
          gap: "0.75rem",
        }}>
          {[
            { href: "/academy/card-of-the-day", icon: "\uD83C\uDCCF", title: t("academy_card_of_day"), desc: t("academy_card_of_day_desc") },
            { href: "/academy/tarot-encyclopedia", icon: "\u25C7", title: t("academy_tarot_encyclopedia"), desc: t("academy_tarot_encyclopedia_desc") },
            { href: "/academy/aspect-guide", icon: "\u25B3", title: t("academy_aspect_guide"), desc: t("academy_aspect_guide_desc") },
            { href: "/cosmos", icon: "\u2609", title: t("academy_live_cosmos"), desc: t("academy_live_cosmos_desc") },
          ].map(tool => (
            <Link key={tool.href} href={tool.href} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "1rem 1.25rem",
              background: "rgba(8,6,20,0.4)",
              backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(200,185,255,0.06)",
              borderRadius: "1rem",
              textDecoration: "none",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}>
              <span style={{ fontSize: "1.5rem", opacity: 0.6 }}>{tool.icon}</span>
              <div>
                <div style={{
                  fontFamily: "var(--font-accent)", fontSize: "0.9rem", fontWeight: 500,
                  color: "rgba(240,236,255,0.85)",
                }}>{tool.title}</div>
                <div style={{
                  fontFamily: "var(--font-body)", fontSize: "0.65rem",
                  color: "rgba(180,170,210,0.4)",
                }}>{tool.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Track sections */}
      <TrackSection
        title={t("academy_track_astrology")}
        description={t("academy_track_astrology_desc")}
        track="astrology"
        icon="\u2609"
        levelLabels={levelLabels}
        lessonsLabel={t("academy_lessons").toLowerCase()}
      />

      <TrackSection
        title={t("academy_track_tarot")}
        description={t("academy_track_tarot_desc")}
        track="tarot"
        icon="\uD83C\uDCCF"
        levelLabels={levelLabels}
        lessonsLabel={t("academy_lessons").toLowerCase()}
      />

      <TrackSection
        title={t("academy_track_integrated")}
        description={t("academy_track_integrated_desc")}
        track="integrated"
        icon="\u2726"
        levelLabels={levelLabels}
        lessonsLabel={t("academy_lessons").toLowerCase()}
      />
    </div>
  );
}
