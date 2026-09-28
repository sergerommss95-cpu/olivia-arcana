/**
 * /academy/[course] — Course detail page with lesson list
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { shareMeta } from "@/lib/learn/share-meta";
import { COURSES, getCourse } from "../../../lib/academy/courses";
import { CourseDetailContent } from "./CourseDetailContent";

export function generateStaticParams() {
  return COURSES.map(c => ({ course: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ course: string }> }): Promise<Metadata> {
  const { course: slug } = await params;
  const course = getCourse(slug);
  if (!course) return {};
  const url = `https://oliviaarcana.com/academy/${slug}/`;
  const title = `${course.title} | Olivia Arcana Academy`;
  const description = course.description.slice(0, 200);
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
    ...shareMeta({
      title, description, url, locale: "en", translated: false,
      // Per-course social card at public/og/academy/<slug>.png.
      image: { url: `https://oliviaarcana.com/og/academy/${slug}.png`, width: 1200, height: 630, alt: `${course.title}: ${course.subtitle}`, type: "image/png" },
    }),
  };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ course: string }> }) {
  const { course: slug } = await params;
  const course = getCourse(slug);
  if (!course) return notFound();

  return <CourseDetailContent courseSlug={slug} />;
}
