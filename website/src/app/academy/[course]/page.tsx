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
  return {
    title: `${course.title} — Olivia Arcana Academy`,
    description: course.description,
  };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ course: string }> }) {
  const { course: slug } = await params;
  const course = getCourse(slug);
  if (!course) return notFound();

  return <CourseDetailContent courseSlug={slug} />;
}
