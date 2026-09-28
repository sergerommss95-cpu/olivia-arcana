import Link from "next/link";
import styles from "./card-library.module.css";

export default function UkrainianLibraryShell({ children, englishPath = "/cards/" }: { children: React.ReactNode; englishPath?: string }) {
  return <div lang="uk" className={styles.page}>
    <header className={styles.header}>
      <Link className={styles.wordmark} href="/uk/">Olivia Arcana</Link>
      <nav className={styles.nav} aria-label="Головна навігація">
        <Link href="/uk/cards/">78 карт</Link>
        <Link href="/uk/learn/">Навчання</Link>
        <a href="/uk/?experience=spreads">Розклади</a>
        <a href="/uk/?experience=question">Почати читання ↗</a>
        <a href={englishPath} lang="en" hrefLang="en" aria-label="Read this page in English">EN</a>
      </nav>
    </header>
    <main id="main-content" className={styles.main}>{children}</main>
    <footer className={styles.footer}>
      <p>Olivia Arcana · Простір для ваших запитань.</p>
      <p>Карти пропонують погляд для роздумів. Рішення залишається за вами.</p>
    </footer>
  </div>;
}
