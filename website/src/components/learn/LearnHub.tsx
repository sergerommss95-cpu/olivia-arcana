/** "Learn to read": the five paths and their lessons. */

import Link from "next/link";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { getCardThumbPath } from "@/lib/academy/card-images";
import { PATHS, lessonHref, lessonsInPath, type Locale } from "@/lib/learn/lessons";
import styles from "./learn.module.css";

const COPY = {
  en: { home: "Home", crumb: "Breadcrumb", kicker: "After the card meanings", title: "Learn to read", lead: "Knowing what each card means is the start. These lessons teach the craft of reading: asking a question the cards can meet, reading a spread as a whole, letting cards talk to each other, and keeping a practice that grows with you. Most of them end with something to try.", minutes: (m: number) => `${m} min`, interactive: "Interactive", lesson: (n: number) => `Lesson ${n}`,
    toolsKicker: "To use beside the lessons", tools: [
      { href: "/cards/pairs/lab/", cards: [17, 58], title: "Pair Lab", text: "Choose any two cards and read them together through five lenses." },
      { href: "/cards/", cards: [9, 38], title: "A spread from any card", text: "Every card page ends with three questions of its own. Ask them with three cards from the deck." },
      { href: "/#symbols", cards: [18, 0], title: "The language of symbols", text: "Follow one carved symbol from card to card and watch its meaning shift." },
    ] },
  uk: { home: "Головна", crumb: "Навігаційний шлях", kicker: "Після значень карт", title: "Навчитися читати", lead: "Знати значення кожної карти — це початок. Ці уроки вчать самого мистецтва читання: ставити запитання, на яке карти можуть відповісти, читати розклад як ціле, дозволяти картам говорити між собою і вести практику, яка росте разом із вами. Більшість уроків закінчується вправою.", minutes: (m: number) => `${m} хв`, interactive: "Інтерактивно", lesson: (n: number) => `Урок ${n}`,
    toolsKicker: "Поруч з уроками", tools: [
      { href: "/uk/cards/pairs/lab/", cards: [17, 58], title: "Лабораторія пар", text: "Оберіть будь-які дві карти й прочитайте їх разом п’ятьма способами." },
      { href: "/uk/cards/", cards: [9, 38], title: "Розклад від будь-якої карти", text: "Кожна сторінка карти закінчується трьома її власними запитаннями. Розкладіть із ними три карти з колоди." },
      { href: "/uk/#symbols", cards: [18, 0], title: "Мова символів", text: "Простежте один вирізьблений символ від карти до карти й подивіться, як змінюється його значення." },
    ] },
};

export default function LearnHub({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  return (
    <div className={styles.hub} lang={locale}>
      <nav aria-label={c.crumb} className={styles.crumb}>
        <ol><li><Link href={locale === "uk" ? "/uk/" : "/"}>{c.home}</Link></li><li aria-hidden>/</li><li aria-current="page">{c.title}</li></ol>
      </nav>
      <header className={styles.hubHead}>
        <p className={styles.kicker}>{c.kicker}</p>
        <h1 className={styles.h1}>{c.title}</h1>
        <p className={styles.hubLead}>{c.lead}</p>
      </header>
      <section className={styles.instruments} aria-label={c.toolsKicker}>
        <p className={styles.kicker}>{c.toolsKicker}</p>
        <ul>
          {c.tools.map((tool) => (
            <li key={tool.href}>
              <a href={tool.href} className={styles.instrument}>
                <span className={styles.instrumentArt} aria-hidden>
                  {tool.cards.map((id) => (
                    // eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail
                    <img key={id} src={getCardThumbPath(ALL_CARDS[id])} alt="" width={120} height={206} />
                  ))}
                </span>
                <span className={styles.instrumentTitle}>{tool.title} <span aria-hidden>↗</span></span>
                <span className={styles.instrumentText}>{tool.text}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
      <div className={styles.paths}>
        {PATHS.map((path, p) => {
          const lessons = lessonsInPath(path.id, locale);
          if (!lessons.length) return null;
          return (
            <section key={path.id} id={path.id} className={styles.path} aria-labelledby={`${path.id}-title`}>
              <div className={styles.pathHead}>
                <span className={styles.pathNo} aria-hidden>{["I", "II", "III", "IV", "V"][p]}</span>
                <h2 id={`${path.id}-title`} className={styles.pathTitle}>{path[locale].title}</h2>
                <p className={styles.pathLead}>{path[locale].lead}</p>
              </div>
              <ol className={styles.lessonList}>
                {lessons.map((lesson, i) => (
                  <li key={lesson.slug}>
                    <Link href={lessonHref(lesson, locale)} className={styles.lessonRow}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail */}
                      <img className={styles.lessonThumb} src={getCardThumbPath(ALL_CARDS[lesson.cards[0] ?? 0])} alt="" width={120} height={206} />
                      <span className={styles.lessonText}>
                        <span className={styles.lessonNo}>{c.lesson(i + 1)}</span>
                        <span className={styles.lessonTitle}>{lesson[locale].title}</span>
                        <span className={styles.lessonDek}>{lesson[locale].dek}</span>
                      </span>
                      <span className={styles.lessonMeta}>
                        <span>{c.minutes(lesson[locale].minutes)}</span>
                        {lesson.tool && <span className={styles.badge}>{c.interactive}</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
