import type { Course } from "./courses";

// Import all locale dictionaries
import { dict as uk } from "./course-locales/uk";
import { dict as ru } from "./course-locales/ru";
import { dict as de } from "./course-locales/de";
import { dict as fr } from "./course-locales/fr";
import { dict as ar } from "./course-locales/ar";
import { dict as es } from "./course-locales/es";
import { dict as zh } from "./course-locales/zh";
import { dict as pt } from "./course-locales/pt";

const DICTS: Record<string, Record<string, string>> = { uk, ru, de, fr, ar, es, zh, pt };

export function translateCourse(course: Course, locale: string): Course {
  if (locale === "en") return course;
  const d = DICTS[locale];
  if (!d) return course;
  const t = (s: string) => d[s] ?? s;
  return {
    ...course,
    title: t(course.title),
    subtitle: t(course.subtitle),
    description: t(course.description),
    topics: course.topics.map(t),
    duration: t(course.duration),
    lessons: course.lessons.map(l => ({
      ...l,
      title: t(l.title),
      description: t(l.description),
    })),
  };
}

export function translateCourses(courses: Course[], locale: string): Course[] {
  return courses.map(c => translateCourse(c, locale));
}
