/** Olivia Astrology: what the practice is, the sky right now, and the way into a birth chart. */

import { astroCopy } from "@/lib/astrology/copy";
import { majorCards } from "@/lib/astrology/deck";
import { SIGN_CARDS, SIGN_GLYPHS, SIGNS } from "@/lib/astrology/chart.js";
import TonightSky from "./TonightSky";
import styles from "./astrology.module.css";

const COPY = {
  en: {
    home: "Home", crumb: "Breadcrumb", section: "Astrology", kicker: "Olivia Astrology", title: "The sky, as a practice",
    lead: "Astrology here works the way the cards do: a way of looking that invites reflection, never a forecast. Every sign and planet has a Major Arcana card, so the sky and the deck speak the same language.",
    chartKicker: "Your birth", chartTitle: "Your birth chart", chartText: "A card for your Sun, your Moon and your Rising sign, and the wheel of the sky at the moment you were born. Worked out on your device.",
    chartCta: "Read my chart", signsKicker: "Twelve signs, twelve cards", signsLead: "The Golden Dawn gave each sign a card of the Major Arcana. Open one to read the card.",
    methodKicker: "How we read the sky",
  },
  uk: {
    home: "Головна", crumb: "Навігаційний шлях", section: "Астрологія", kicker: "Астрологія Olivia", title: "Небо як практика",
    lead: "Астрологія тут працює так само, як карти: це спосіб дивитися, що запрошує до роздумів, а не прогноз. Кожен знак і кожна планета мають свою карту Старших Арканів, тож небо й колода говорять однією мовою.",
    chartKicker: "Ваше народження", chartTitle: "Ваша натальна карта", chartText: "Карта для вашого Сонця, Місяця й Асцендента та коло неба в мить вашого народження. Розраховується на вашому пристрої.",
    chartCta: "Прочитати мою карту", signsKicker: "Дванадцять знаків, дванадцять карт", signsLead: "Традиція Золотої Зорі дала кожному знаку карту Старших Арканів. Відкрийте будь-яку, щоб прочитати її.",
    methodKicker: "Як ми читаємо небо",
  },
};

export default function AstrologyHub({ locale }: { locale: "en" | "uk" }) {
  const c = COPY[locale];
  const copy = astroCopy(locale);
  const cards = majorCards(locale);
  const base = locale === "uk" ? "/uk" : "";
  return (
    <div className={styles.page} lang={locale}>
      <nav aria-label={c.crumb} className={styles.crumb}>
        <ol><li><a href={`${base}/`}>{c.home}</a></li><li aria-hidden>/</li><li aria-current="page">{c.section}</li></ol>
      </nav>
      <header className={styles.head}>
        <p className={styles.kicker}>{c.kicker}</p>
        <h1 className={styles.h1}>{c.title}</h1>
        <p className={styles.lead}>{c.lead}</p>
      </header>

      <a href={`${base}/astrology/birth-chart/`} className={styles.door}>
        <span className={styles.doorArt} aria-hidden>
          {[19, 2, 10].map((id) => (
            // eslint-disable-next-line @next/next/no-img-element -- pre-sized thumbnail
            <img key={id} src={cards[id].thumb} alt="" width={120} height={206} />
          ))}
        </span>
        <span className={styles.doorText}>
          <span className={styles.kicker}>{c.chartKicker}</span>
          <span className={styles.doorTitle}>{c.chartTitle}</span>
          <span className={styles.note}>{c.chartText}</span>
          <span className={styles.primary}>{c.chartCta}</span>
        </span>
      </a>

      <TonightSky locale={locale} copy={copy} cards={cards} />

      <section className={styles.block} aria-labelledby="signs-title">
        <p className={styles.kicker}>{c.signsKicker}</p>
        <p id="signs-title" className={styles.blockLead}>{c.signsLead}</p>
        <ul className={styles.signGrid}>
          {SIGNS.map((sign, i) => {
            const card = cards[SIGN_CARDS[i]];
            return (
              <li key={sign}>
                <a href={card.href} className={styles.signCell}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized thumbnail */}
                  <img src={card.thumb} alt="" width={120} height={206} loading="lazy" />
                  <span className={styles.signName}><span aria-hidden>{SIGN_GLYPHS[i] + "︎"} </span>{copy.signs[sign].name}</span>
                  <span className={styles.optionMeta}>{card.name}</span>
                  <span className={styles.signEssence}>{copy.signs[sign].essence}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.method} aria-labelledby="method-title">
        <h2 id="method-title" className={styles.kicker}>{c.methodKicker}</h2>
        <p>{copy.ui.method}</p>
        <p className={styles.boundary}>{copy.ui.boundary}</p>
      </section>
    </div>
  );
}
