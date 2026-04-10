/**
 * /academy — Course catalog with tracks and levels
 *
 * Three tracks: Astrology, Tarot, Integrated
 * Visual card grid with progress indicators
 */

import Link from "next/link";
import { COURSES, getCoursesByTrack, getTotalLessons, type Course } from "../../lib/academy/courses";

export const metadata = {
  title: "Olivia Arcana Academy — Learn Astrology & Tarot",
  description: "14 courses, 212 lessons. Master natal charts, planets, aspects, transits, tarot spreads, and the esoteric connections between stars and cards.",
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: "rgba(78,205,196,0.5)",
  intermediate: "rgba(212,175,55,0.5)",
  advanced: "rgba(232,82,74,0.5)",
  capstone: "rgba(123,104,238,0.5)",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  capstone: "Capstone",
};

function CourseCard({ course }: { course: Course }) {
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
          }}>{LEVEL_LABELS[course.level]}</span>
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
        }}>{course.lessons.length} lessons</span>
        <span style={{
          fontFamily: "var(--font-body)", fontSize: "0.65rem",
          color: "rgba(180,170,210,0.4)",
        }}>{course.duration}</span>
      </div>
    </Link>
  );
}

function TrackSection({ title, description, track, icon }: { title: string; description: string; track: string; icon: string }) {
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
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1rem",
      }}>
        {courses.map(c => <CourseCard key={c.slug} course={c} />)}
      </div>
    </section>
  );
}

export default function AcademyPage() {
  const totalLessons = getTotalLessons();

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
        }}>← Home</Link>

        <div style={{ fontSize: "2.5rem", color: "rgba(212,175,55,0.3)", marginTop: "1.5rem", marginBottom: "0.75rem" }}>✦</div>

        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
          fontWeight: 400, margin: "0 0 0.5rem",
        }}>
          <span className="text-gold-gradient">Olivia Arcana Academy</span>
        </h1>

        <p style={{
          fontFamily: "var(--font-accent)", fontSize: "1.1rem", fontWeight: 400,
          color: "rgba(196,185,228,0.6)", fontStyle: "italic",
          margin: "0 0 1.5rem",
        }}>Master the language of the cosmos</p>

        {/* Stats */}
        <div style={{
          display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap",
        }}>
          {[
            { n: "14", label: "Courses" },
            { n: String(totalLessons), label: "Lessons" },
            { n: "3", label: "Tracks" },
            { n: "~65", label: "Weeks" },
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

      {/* Track sections */}
      <TrackSection
        title="Astrology"
        description="From zodiac basics to advanced chart synthesis — 8 courses that take you from curious beginner to confident practitioner."
        track="astrology"
        icon="☉"
      />

      <TrackSection
        title="Tarot"
        description="The Major and Minor Arcana, spreads, reading techniques, and the deep esoteric connections — 5 courses from first card to professional reader."
        track="tarot"
        icon="🃏"
      />

      <TrackSection
        title="Integrated Practice"
        description="Where astrology and tarot become one unified system. The capstone experience."
        track="integrated"
        icon="✦"
      />
    </div>
  );
}
