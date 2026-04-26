/**
 * /academy/[course] — Course detail page with lesson list
 */

import { notFound } from "next/navigation";
import { COURSES, getCourse } from "../../../lib/academy/courses";
import { CourseDetailContent } from "./CourseDetailContent";

export function generateStaticParams() {
  return COURSES.map(c => ({ course: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ course: string }> }) {
  const { course: slug } = await params;
  const course = getCourse(slug);
  if (!course) return {};
  const url = `https://oliviaarcana.com/academy/${slug}/`;
  const title = `${course.title} — Olivia Arcana Academy`;
  const description = course.description.slice(0, 200);
  const ogImage = `https://oliviaarcana.com/og/academy/${slug}.png`;
  return {
    title,
    description,
    keywords: [
      course.track,
      course.level,
      "astrology course",
      "tarot course",
      "olivia arcana academy",
      ...(course.lessons || []).slice(0, 6).map(l => l.title),
    ],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "Olivia Arcana",
      images: [
        {
          // Per-course social card. Falls back to site OG until per-course
          // images ship at /og/academy/<slug>.png (1200x630).
          url: ogImage,
          secureUrl: ogImage,
          width: 1200,
          height: 630,
          alt: `${course.title} — ${course.subtitle}`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ course: string }> }) {
  const { course: slug } = await params;
  const course = getCourse(slug);
  if (!course) return notFound();

  return <CourseDetailContent courseSlug={slug} />;
}
