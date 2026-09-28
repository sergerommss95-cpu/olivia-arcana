import { shareMeta } from "@/lib/learn/share-meta";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import UkrainianLibraryShell from "../../../cards/library-shell";
import LessonPage from "@/components/learn/LessonPage";
import { allLessons, findLesson } from "@/lib/learn/lessons";

export function generateStaticParams() {
  return allLessons("uk").map((lesson) => ({ path: lesson.path, lesson: lesson.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ path: string; lesson: string }> }): Promise<Metadata> {
  const { path, lesson: slug } = await params;
  const lesson = findLesson(path, slug, "uk");
  if (!lesson) return {};
  const url = `https://oliviaarcana.com/uk/learn/${path}/${slug}/`;
  return {
    title: `${lesson.uk.title} | Навчитися читати Таро | Olivia Arcana`,
    description: lesson.uk.dek,
    alternates: { canonical: url, languages: { en: `https://oliviaarcana.com/learn/${path}/${slug}/`, uk: url, "x-default": `https://oliviaarcana.com/learn/${path}/${slug}/` } },
    ...shareMeta({ title: lesson.uk.title, description: lesson.uk.dek, url, locale: "uk", cardId: lesson.cards[0] ?? 9, alt: "Карта з колоди Olivia Arcana" }),
  };
}

export default async function UkrainianLessonRoute({ params }: { params: Promise<{ path: string; lesson: string }> }) {
  const { path, lesson: slug } = await params;
  const lesson = findLesson(path, slug, "uk");
  if (!lesson) notFound();
  return <UkrainianLibraryShell englishPath={`/learn/${path}/${slug}/`}><LessonPage lesson={lesson} locale="uk" /></UkrainianLibraryShell>;
}
