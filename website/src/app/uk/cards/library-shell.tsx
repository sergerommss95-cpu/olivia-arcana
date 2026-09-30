import AlmanacMasthead from "@/components/almanac/AlmanacMasthead";
import styles from "./card-library.module.css";

export default function UkrainianLibraryShell({ children, englishPath = "/cards/" }: { children: React.ReactNode; englishPath?: string }) {
  return <div lang="uk" className={styles.page}>
    {/* The same masthead as every other page, so the site looks the same in both languages */}
    <AlmanacMasthead locale="uk" languageHref={englishPath} />
    <main id="main-content" className={styles.main}>{children}</main>
    <footer className={styles.footer}>
      <p>Olivia Arcana · Простір для ваших запитань.</p>
      <p>Карти пропонують погляд для роздумів. Рішення залишається за вами.</p>
    </footer>
  </div>;
}
