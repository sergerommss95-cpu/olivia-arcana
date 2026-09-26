import type { Metadata } from "next";
import Link from "next/link";
import { cardGroups, cardNumeral, cardSlug } from "@/app/cards/card-pages";
import { TAROT_UK } from "@/lib/academy/tarot-cards-uk";
import UkrainianLibraryShell from "./library-shell";
import styles from "./card-library.module.css";

const title = "Значення всіх 78 карт Таро українською | Olivia Arcana";
const description = "Старші та Молодші Аркани: усі 78 карт Таро українською. Назви, ключові слова, пряме й перевернуте значення та поради для власних роздумів.";
export const metadata: Metadata = {
  title, description,
  alternates: { canonical: "https://oliviaarcana.com/uk/cards/", languages: { en: "https://oliviaarcana.com/cards/", uk: "https://oliviaarcana.com/uk/cards/", "x-default": "https://oliviaarcana.com/cards/" } },
  openGraph: { title, description, url: "https://oliviaarcana.com/uk/cards/", locale: "uk_UA", alternateLocale: ["en_US"], type: "website" },
};
const groupNames = ["Старші Аркани", "Жезли", "Кубки", "Мечі", "Пентаклі"];
const groupNotes = ["22 карти · важливі теми життя", "14 карт · дія і творчість", "14 карт · почуття і зв’язки", "14 карт · думки і вибір", "14 карт · праця і матеріальний світ"];

export default function UkrainianCardsPage() {
  return <UkrainianLibraryShell>
    <nav className={styles.crumb} aria-label="Навігаційний шлях"><Link href="/uk/">Головна</Link><span aria-hidden> / </span><span aria-current="page">Карти Таро</span></nav>
    <header>
      <p className={styles.kicker}>Колода Olivia Arcana · 78 карт</p>
      <h1 className={styles.title}>Значення карт Таро</h1>
      <p className={styles.lead}>Кожна карта — окрема мова образів. Дослідіть 22 Старші Аркани та чотири масті Молодших: їхні ключові теми, прямі й перевернуті значення. Зіставляйте символи зі своїм досвідом, зберігаючи свободу власного вибору.</p>
    </header>
    {cardGroups().map((group, index) => <section key={group.title} className={styles.group}>
      <div className={styles.groupHead}><h2>{groupNames[index]}</h2><p>{groupNotes[index]}</p></div>
      <ul className={styles.list}>{group.cards.map(card => {
        const text = TAROT_UK[card.name];
        return <li key={card.name}><Link className={styles.row} href={`/uk/cards/${cardSlug(card.name)}/`}>
          <span className={styles.number}>{cardNumeral(card)}</span><span className={styles.cardName}>{text.name}</span><span className={styles.keywords}>{text.keywords.slice(0, 3).join(" · ")}</span><span aria-hidden>↗</span>
        </Link></li>;
      })}</ul>
    </section>)}
    <div className={styles.actions}><a className={styles.button} href="/uk/?experience=question">Почати власне читання ↗</a></div>
  </UkrainianLibraryShell>;
}
