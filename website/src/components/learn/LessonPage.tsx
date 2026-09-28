/** One lesson of "Learn to read", in English or Ukrainian. */

import Link from "next/link";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { TAROT_UK } from "@/lib/academy/tarot-cards-uk";
import { getCardThumbPath } from "@/lib/academy/card-images";
import { leafById } from "@/lib/academy/leaf";
import { PATHS, learnHome, lessonHref, lessonsInPath, type Lesson, type Locale } from "@/lib/learn/lessons";
import LessonTool from "./LessonTool";
import styles from "./learn.module.css";

const COPY = {
  en: { home: "Home", learn: "Learn to read", crumb: "Breadcrumb", lessonOf: (n: number, total: number) => `Lesson ${n} of ${total}`, minutes: (m: number) => `${m} min read`, example: "A worked example", remember: "To remember", previous: "Previous", next: "Next", all: "All lessons", back: "Back to the path" },
  uk: { home: "Головна", learn: "Навчитися читати", crumb: "Навігаційний шлях", lessonOf: (n: number, total: number) => `Урок ${n} з ${total}`, minutes: (m: number) => `${m} хв читання`, example: "Приклад", remember: "Варто запам’ятати", previous: "Попередній", next: "Наступний", all: "Усі уроки", back: "До шляху" },
};

function cardName(id: number, locale: Locale) {
  const name = ALL_CARDS[id].name;
  return locale === "uk" ? TAROT_UK[name]?.name ?? name : name;
}

export default function LessonPage({ lesson, locale }: { lesson: Lesson; locale: Locale }) {
  const c = COPY[locale];
  const text = lesson[locale];
  const path = PATHS.find((p) => p.id === lesson.path)!;
  const siblings = lessonsInPath(lesson.path, locale);
  const index = siblings.findIndex((l) => l.slug === lesson.slug);
  const previous = siblings[index - 1];
  const next = siblings[index + 1];
  const cardHref = (id: number) => `${locale === "uk" ? "/uk" : ""}/cards/${leafById(id)?.slug}/`;

  return (
    <article className={styles.lesson} lang={locale}>
      <nav aria-label={c.crumb} className={styles.crumb}>
        <ol>
          <li><Link href={locale === "uk" ? "/uk/" : "/"}>{c.home}</Link></li><li aria-hidden>/</li>
          <li><Link href={learnHome(locale)}>{c.learn}</Link></li><li aria-hidden>/</li>
          <li><Link href={`${learnHome(locale)}#${path.id}`}>{path[locale].title}</Link></li>
        </ol>
      </nav>

      <header className={styles.lessonHead}>
        <p className={styles.kicker}>{path[locale].title} · {c.lessonOf(index + 1, siblings.length)}</p>
        <h1 className={styles.h1}>{text.title}</h1>
        <p className={styles.dek}>{text.dek}</p>
        <p className={styles.meta}>{c.minutes(text.minutes)}</p>
      </header>

      <div className={styles.body}>
        {text.sections.map((section, i) => (
          <section key={i} className={styles.section}>
            <h2 className={styles.h2}>{section.heading}</h2>
            {section.body.map((paragraph, j) => <p key={j}>{paragraph}</p>)}
          </section>
        ))}

        <aside className={styles.example} aria-labelledby="example-title">
          <p className={styles.label}>{c.example}</p>
          <h2 id="example-title" className={styles.exampleTitle}>{text.example.heading}</h2>
          <ul className={styles.exampleCards}>
            {text.example.cards.map((id) => (
              <li key={id}>
                <Link href={cardHref(id)}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail */}
                  <img src={getCardThumbPath(ALL_CARDS[id])} width={120} height={206} alt="" loading="lazy" />
                  <span>{cardName(id, locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
          {text.example.body.map((paragraph, j) => <p key={j}>{paragraph}</p>)}
        </aside>
      </div>

      {lesson.tool && <LessonTool tool={lesson.tool} locale={locale} />}

      <div className={styles.body}>
        <section className={styles.tryThis} aria-labelledby="try-title">
          <h2 id="try-title" className={styles.h2}>{text.tryThis.heading}</h2>
          <ol>{text.tryThis.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>
        </section>

        <section className={styles.remember} aria-labelledby="remember-title">
          <p id="remember-title" className={styles.label}>{c.remember}</p>
          <ul>{text.remember.map((point, i) => <li key={i}>{point}</li>)}</ul>
        </section>
      </div>

      <nav className={styles.pager} aria-label={path[locale].title}>
        {previous ? <Link href={lessonHref(previous, locale)} className={styles.pagerLink}><span>← {c.previous}</span>{previous[locale].title}</Link> : <span />}
        {next ? <Link href={lessonHref(next, locale)} className={`${styles.pagerLink} ${styles.pagerNext}`}><span>{c.next} →</span>{next[locale].title}</Link> : <Link href={learnHome(locale)} className={`${styles.pagerLink} ${styles.pagerNext}`}><span>{c.all} →</span>{c.learn}</Link>}
      </nav>
    </article>
  );
}
