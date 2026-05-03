"use client";

import Link from "next/link";
import { getCoursesByTrack, type Course } from "../../lib/academy/courses";
import { translateCourses } from "../../lib/academy/translate-courses";
import { useLocale } from "@/lib/i18n/useLocale";
import Surface, { Eyebrow, Rule } from "@/components/design/Surface";

const LEVEL_COLORS: Record<string, string> = {
  beginner: "rgba(78,205,196,0.55)",
  intermediate: "rgba(232,201,106,0.65)",
  advanced: "rgba(232,82,74,0.55)",
  capstone: "rgba(178,150,240,0.6)",
};

// ── Course card — supports "featured" size variant ──────────────────────
function CourseCard({
  course,
  levelLabel,
  lessonsLabel,
  featured,
  startHere,
}: {
  course: Course;
  levelLabel: string;
  lessonsLabel: string;
  featured?: boolean;
  startHere?: string;
}) {
  return (
    <Surface
      as={Link}
      href={`/academy/${course.slug}`}
      variant={featured ? "solid" : "solid"}
      raised={featured}
      radius="lg"
      pad="none"
      className="academy-course-card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: featured ? "1rem" : "0.6rem",
        padding: featured ? "1.75rem 1.75rem 1.5rem" : "1.25rem 1.35rem",
        textDecoration: "none",
        transition: "border-color 260ms ease, transform 260ms cubic-bezier(0.16,1,0.3,1)",
        gridColumn: featured ? "span 2" : "span 1",
        minHeight: featured ? "240px" : "auto",
        borderColor: featured ? "rgba(232, 201, 106, 0.25)" : undefined,
      }}
    >
      {startHere && (
        <span
          style={{
            position: "absolute",
            top: "-10px",
            left: "1.25rem",
            padding: "0.25rem 0.7rem",
            background: "#E8C96A",
            color: "#06041a",
            fontFamily: "var(--font-body, system-ui), sans-serif",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            borderRadius: "9999px",
            boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
          }}
        >
          {startHere}
        </span>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span
          style={{
            fontSize: featured ? "2.4rem" : "1.6rem",
            lineHeight: 1,
            filter: `drop-shadow(0 0 12px ${course.color}30)`,
          }}
          aria-hidden
        >
          {course.icon}
        </span>
        <span
          style={{
            padding: "0.2rem 0.6rem",
            borderRadius: "100px",
            background: "transparent",
            border: `1px solid ${LEVEL_COLORS[course.level]}`,
            fontFamily: "var(--font-body, system-ui), sans-serif",
            fontSize: "0.55rem",
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: LEVEL_COLORS[course.level].replace("0.5", "0.9").replace("0.55", "0.95").replace("0.6", "0.95").replace("0.65", "0.95"),
          }}
        >
          {levelLabel}
        </span>
      </div>

      <div>
        <div
          style={{
            fontFamily: "var(--font-body, system-ui), sans-serif",
            fontSize: "0.58rem",
            fontWeight: 500,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(180,170,210,0.42)",
            marginBottom: "0.35rem",
          }}
        >
          Course {course.number}
        </div>
        <h3
          style={{
            fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
            fontStyle: "italic",
            fontSize: featured ? "1.9rem" : "1.2rem",
            fontWeight: 400,
            lineHeight: 1.15,
            color: "#F5F0E8",
            margin: "0 0 0.2rem",
            letterSpacing: "-0.005em",
          }}
        >
          {course.title}
        </h3>
        <div
          style={{
            fontFamily: "var(--font-body, system-ui), sans-serif",
            fontSize: "0.78rem",
            fontWeight: 400,
            color: "rgba(232, 201, 106, 0.75)",
            letterSpacing: "0.02em",
          }}
        >
          {course.subtitle}
        </div>
      </div>

      <p
        style={{
          fontFamily: "var(--font-body, system-ui), sans-serif",
          fontSize: featured ? "0.95rem" : "0.82rem",
          fontWeight: 400,
          lineHeight: 1.6,
          color: "rgba(220, 212, 240, 0.72)",
          margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: featured ? 4 : 3,
          WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
        }}
      >
        {course.description}
      </p>

      <div
        style={{
          display: "flex",
          gap: "1.25rem",
          marginTop: "auto",
          paddingTop: "0.9rem",
          borderTop: "1px solid rgba(200,185,255,0.08)",
        }}
      >
        <span style={{ fontFamily: "var(--font-body, system-ui), sans-serif", fontSize: "0.68rem", color: "rgba(180,170,210,0.5)" }}>
          {course.lessons.length} {lessonsLabel}
        </span>
        <span style={{ fontFamily: "var(--font-body, system-ui), sans-serif", fontSize: "0.68rem", color: "rgba(180,170,210,0.5)" }}>
          {course.duration}
        </span>
      </div>
    </Surface>
  );
}

// ── Track section — first course is featured for "astrology" ──────────
function TrackSection({
  title,
  description,
  track,
  levelLabels,
  lessonsLabel,
  locale,
  featureFirst,
  startHereLabel,
}: {
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
    <section style={{ marginBottom: "clamp(2.5rem, 5vw, 4rem)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "1rem", marginBottom: "0.4rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
            fontStyle: "italic",
            fontSize: "clamp(1.5rem, 3vw, 2.1rem)",
            fontWeight: 400,
            color: "#F5F0E8",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
        <span
          style={{
            flex: 1,
            height: "1px",
            background: "linear-gradient(90deg, rgba(232,201,106,0.25), transparent)",
          }}
          aria-hidden
        />
      </div>
      <p
        style={{
          fontFamily: "var(--font-body, system-ui), sans-serif",
          fontSize: "0.9rem",
          fontWeight: 400,
          color: "rgba(196,185,228,0.65)",
          margin: "0 0 1.5rem",
          maxWidth: "620px",
        }}
      >
        {description}
      </p>
      <div
        className="academy-track-grid"
        style={{
          display: "grid",
          gridTemplateColumns: featureFirst ? "repeat(4, 1fr)" : "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
          gap: "1rem",
        }}
      >
        {courses.map((c, i) => (
          <CourseCard
            key={c.slug}
            course={c}
            levelLabel={levelLabels[c.level] || c.level}
            lessonsLabel={lessonsLabel}
            featured={featureFirst && i === 0}
            startHere={featureFirst && i === 0 ? startHereLabel : undefined}
          />
        ))}
      </div>
    </section>
  );
}

// ── Quick tool tile — varied sizes (1 featured + 3 utility) ────────────
function FeaturedTool({ href, title, description, kicker }: { href: string; title: string; description: string; kicker: string }) {
  return (
    <Surface
      as={Link}
      href={href}
      variant="solid"
      raised
      radius="lg"
      pad="none"
      className="academy-featured-tool"
      style={{
        gridColumn: "span 2",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "1.75rem 1.75rem 1.5rem",
        minHeight: "180px",
        background: "linear-gradient(160deg, rgba(232,201,106,0.1) 0%, rgba(20,14,44,0.4) 55%, rgba(8,6,20,0.5))",
        borderColor: "rgba(232, 201, 106, 0.3)",
        textDecoration: "none",
        transition: "border-color 260ms ease",
        overflow: "hidden",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          right: "-20px",
          top: "-20px",
          width: "140px",
          height: "140px",
          borderRadius: "100%",
          background: "radial-gradient(circle, rgba(232,201,106,0.18), transparent 70%)",
          filter: "blur(10px)",
          pointerEvents: "none",
        }}
      />
      <Eyebrow tone="gold">{kicker}</Eyebrow>
      <div>
        <h3
          style={{
            fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
            fontStyle: "italic",
            fontSize: "clamp(1.7rem, 2.6vw, 2.2rem)",
            fontWeight: 400,
            color: "#F5F0E8",
            margin: "0 0 0.35rem",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-body, system-ui), sans-serif",
            fontSize: "0.92rem",
            lineHeight: 1.55,
            color: "rgba(220, 212, 240, 0.78)",
            margin: 0,
            maxWidth: "42ch",
          }}
        >
          {description}
        </p>
      </div>
      <span
        style={{
          fontFamily: "var(--font-body, system-ui), sans-serif",
          fontSize: "0.78rem",
          fontWeight: 500,
          color: "rgba(232, 201, 106, 0.95)",
          letterSpacing: "0.08em",
        }}
      >
        Draw today&apos;s card →
      </span>
    </Surface>
  );
}

function UtilityTool({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Surface
      as={Link}
      href={href}
      variant="solid"
      radius="md"
      pad="none"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        padding: "1rem 1.1rem",
        textDecoration: "none",
        transition: "border-color 240ms ease, background 240ms ease",
        minHeight: "90px",
      }}
    >
      <span
        aria-hidden
        style={{
          fontSize: "1.35rem",
          color: "rgba(232, 201, 106, 0.78)",
          lineHeight: 1.1,
          marginTop: "0.15rem",
        }}
      >
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
            fontStyle: "italic",
            fontSize: "1rem",
            fontWeight: 500,
            color: "#F5F0E8",
            marginBottom: "0.15rem",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: "var(--font-body, system-ui), sans-serif",
            fontSize: "0.74rem",
            lineHeight: 1.5,
            color: "rgba(196,185,228,0.6)",
          }}
        >
          {desc}
        </div>
      </div>
    </Surface>
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
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        zIndex: 1,
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "calc(var(--nav-height, 5rem) + 2.5rem) clamp(1.25rem, 4vw, 3rem) 5rem",
      }}
    >
      {/* ── Editorial masthead ── */}
      <header style={{ marginBottom: "clamp(2.5rem, 5vw, 4rem)" }}>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-body, system-ui), sans-serif",
            fontSize: "0.68rem",
            fontWeight: 500,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(180,170,210,0.55)",
            textDecoration: "none",
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          ← {t("academy_home_link")}
        </Link>

        <Eyebrow tone="gold" style={{ marginTop: "1.5rem" }}>
          ✦ {t("academy_subtitle")}
        </Eyebrow>
        <h1
          style={{
            fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
            fontStyle: "italic",
            fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)",
            fontWeight: 400,
            lineHeight: 1.05,
            color: "#F5F0E8",
            margin: "0.75rem 0 1rem",
            letterSpacing: "-0.015em",
          }}
        >
          {t("academy_title")}
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body, system-ui), sans-serif",
            fontSize: "clamp(1rem, 1.4vw, 1.1rem)",
            lineHeight: 1.65,
            color: "rgba(220, 212, 240, 0.78)",
            margin: 0,
            maxWidth: "58ch",
          }}
        >
          Learn astrology and tarot at your own pace. Begin with{" "}
          <em style={{ fontStyle: "italic", color: "rgba(232, 201, 106, 0.95)" }}>The Cosmic Alphabet</em>
          {" "}or draw today&apos;s card.
        </p>
      </header>

      {/* ── Tools row: 1 featured + 3 utility ── */}
      <section
        className="academy-tools-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.9rem",
          marginBottom: "clamp(3rem, 6vw, 4.5rem)",
        }}
      >
        <FeaturedTool
          href="/academy/card-of-the-day"
          kicker="Ritual of the day"
          title={t("academy_card_of_day")}
          description={t("academy_card_of_day_desc")}
        />
        <div className="academy-tools-stack" style={{ display: "flex", flexDirection: "column", gap: "0.7rem", gridColumn: "span 2" }}>
          <UtilityTool href="/academy/tarot-encyclopedia" icon="◇" title={t("academy_tarot_encyclopedia")} desc={t("academy_tarot_encyclopedia_desc")} />
          <UtilityTool href="/academy/aspect-guide" icon="△" title={t("academy_aspect_guide")} desc={t("academy_aspect_guide_desc")} />
          <UtilityTool href="/cosmos" icon="☉" title={t("academy_live_cosmos")} desc={t("academy_live_cosmos_desc")} />
        </div>
      </section>

      <Rule tone="gold" style={{ margin: "clamp(1.5rem, 3vw, 2.5rem) 0" }} />

      {/* ── Track sections ── */}
      <TrackSection
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
        title={t("academy_track_tarot")}
        description={t("academy_track_tarot_desc")}
        track="tarot"
        levelLabels={levelLabels}
        lessonsLabel={t("academy_lessons").toLowerCase()}
        locale={locale}
      />

      <TrackSection
        title={t("academy_track_integrated")}
        description={t("academy_track_integrated_desc")}
        track="integrated"
        levelLabels={levelLabels}
        lessonsLabel={t("academy_lessons").toLowerCase()}
        locale={locale}
      />

      <style jsx>{`
        .academy-course-card:hover {
          border-color: rgba(232, 201, 106, 0.45);
          transform: translateY(-2px);
        }
        @media (max-width: 900px) {
          .academy-tools-grid,
          .academy-track-grid {
            grid-template-columns: 1fr !important;
          }
          :global(.academy-featured-tool),
          .academy-tools-stack,
          :global(.academy-course-card) {
            grid-column: 1 / -1 !important;
          }
        }
      `}</style>
    </div>
  );
}
