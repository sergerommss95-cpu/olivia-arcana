import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import LessonPage from "@/components/learn/LessonPage";
import { allLessons, findLesson } from "@/lib/learn/lessons";

export function generateStaticParams() {
  return allLessons("en").map((lesson) => ({ path: lesson.path, lesson: lesson.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ path: string; lesson: string }> }): Promise<Metadata> {
  const { path, lesson: slug } = await params;
  const lesson = findLesson(path, slug, "en");
  if (!lesson) return {};
  const url = `https://oliviaarcana.com/learn/${path}/${slug}/`;
  return {
    title: `${lesson.en.title} | Learn to Read Tarot | Olivia Arcana`,
    description: lesson.en.dek,
    alternates: { canonical: url, languages: { en: url, uk: `https://oliviaarcana.com/uk/learn/${path}/${slug}/`, "x-default": url } },
    openGraph: { title: lesson.en.title, description: lesson.en.dek, url, type: "article" },
  };
}

export default async function LessonRoute({ params }: { params: Promise<{ path: string; lesson: string }> }) {
  const { path, lesson: slug } = await params;
  const lesson = findLesson(path, slug, "en");
  if (!lesson) notFound();
  return <AlmanacShell><LessonPage lesson={lesson} locale="en" /></AlmanacShell>;
}
