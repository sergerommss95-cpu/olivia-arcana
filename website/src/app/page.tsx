"use client";

import ConstellationOverlay from "@/components/ConstellationOverlay";
import MagneticGlow from "@/components/MagneticGlow";
import HeroV3 from "@/components/HeroV3";
import Footer from "@/components/Footer";
import TransitionLink from "@/components/transitions/TransitionLink";
import { useLocale } from "@/lib/i18n/useLocale";

const HOME_COPY = {
  en: {
    actionsTitle: "What you can do here",
    actionsSubtitle: "Choose the path that matches the question you have today.",
    actions: [
      {
        title: "Ask the Oracle",
        body: "Bring a question. Draw cards. Get a concise reading shaped by your chart.",
        href: "/oracle",
        cta: "Ask now",
      },
      {
        title: "Read your chart",
        body: "Create your natal chart and see the patterns that make the reading personal.",
        href: "/portrait",
        cta: "Create chart",
      },
      {
        title: "Check compatibility",
        body: "Compare two birth dates and see the relationship dynamics in plain language.",
        href: "/synastry",
        cta: "Compare charts",
      },
    ],
    whyTitle: "Why it feels personal",
    why: [
      ["Birth chart context", "Your reading starts with your date, time, and place of birth."],
      ["Current timing", "Transits add the mood of the moment without pretending to predict your life."],
      ["Tarot interpretation", "Cards turn the pattern into reflective guidance you can act on."],
    ],
    sampleEyebrow: "A lighter preview",
    sampleTitle: "Clear guidance, not a wall of symbols",
    sample:
      "A reading might connect the Eight of Pentacles with a practical question: what deserves steady attention now, and what can wait until the timing is clearer?",
    sampleCta: "See a sample reading",
    pricingTitle: "Start free. Go deeper when you are ready.",
    pricingBody:
      "Try the daily card, basic chart context, and a few oracle questions first. Paid plans add fuller chart readings, compatibility, transits, and deeper tarot spreads.",
    pricingCta: "Compare plans",
    oracleCta: "Ask the Oracle",
  },
  uk: {
    actionsTitle: "Що тут можна зробити",
    actionsSubtitle: "Оберіть шлях під запитання, з яким ви прийшли сьогодні.",
    actions: [
      {
        title: "Запитати Оракула",
        body: "Принесіть запитання, витягніть карти й отримайте коротке читання з контекстом вашої карти.",
        href: "/oracle",
        cta: "Запитати",
      },
      {
        title: "Прочитати натальну карту",
        body: "Створіть карту народження й побачте головні патерни без зайвого шуму.",
        href: "/portrait",
        cta: "Створити карту",
      },
      {
        title: "Перевірити сумісність",
        body: "Порівняйте дві дати народження й побачте динаміку стосунків простою мовою.",
        href: "/synastry",
        cta: "Порівняти",
      },
    ],
    whyTitle: "Чому це відчувається особистим",
    why: [
      ["Контекст натальної карти", "Читання починається з дати, часу й місця народження."],
      ["Поточний момент", "Транзити додають настрій часу, не видаючи його за гарантований прогноз."],
      ["Таро-інтерпретація", "Карти перетворюють патерн на рефлексивну підказку для дії."],
    ],
    sampleEyebrow: "Легкий приклад",
    sampleTitle: "Ясність замість стіни символів",
    sample:
      "Читання може поєднати Вісімку Пентаклів із практичним запитанням: що зараз варте стабільної уваги, а що може зачекати?",
    sampleCta: "Переглянути приклад",
    pricingTitle: "Почніть безкоштовно. Заглиблюйтесь, коли будете готові.",
    pricingBody:
      "Спершу спробуйте карту дня, базовий контекст і кілька запитань до оракула. Платні плани додають повніші читання, сумісність, транзити й глибші розклади.",
    pricingCta: "Порівняти плани",
    oracleCta: "Запитати Оракула",
  },
};

export default function Home() {
  const { locale } = useLocale();
  const copy = locale === "uk" ? HOME_COPY.uk : HOME_COPY.en;

  return (
    <>
      <ConstellationOverlay />
      <MagneticGlow />

      <main id="main-content" className="relative z-10">
        <div id="hero">
          <HeroV3 />
        </div>

        <section className="home-clarity-section" aria-labelledby="home-actions">
          <div className="home-section-heading">
            <p className="readable-label">Start here</p>
            <h2 id="home-actions">{copy.actionsTitle}</h2>
            <p>{copy.actionsSubtitle}</p>
          </div>

          <div className="home-action-grid">
            {copy.actions.map((action) => (
              <TransitionLink key={action.href} href={action.href} className="home-action-card readable-card">
                <span className="home-action-kicker" aria-hidden>
                  ✦
                </span>
                <h3>{action.title}</h3>
                <p>{action.body}</p>
                <span className="home-card-cta">{action.cta}</span>
              </TransitionLink>
            ))}
          </div>
        </section>

        <section className="home-clarity-section home-why-section" aria-labelledby="home-why">
          <div className="home-section-heading">
            <p className="readable-label">Personal context</p>
            <h2 id="home-why">{copy.whyTitle}</h2>
          </div>

          <div className="home-why-list">
            {copy.why.map(([title, body]) => (
              <div key={title} className="home-why-item">
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="home-clarity-section home-sample-section" aria-labelledby="home-sample">
          <div className="readable-panel home-sample-card">
            <p className="readable-label">{copy.sampleEyebrow}</p>
            <h2 id="home-sample">{copy.sampleTitle}</h2>
            <p>{copy.sample}</p>
            <TransitionLink href="/sample" className="home-inline-link">
              {copy.sampleCta}
            </TransitionLink>
          </div>
        </section>

        <section className="home-clarity-section home-pricing-teaser" aria-labelledby="home-pricing">
          <div>
            <p className="readable-label">Plans</p>
            <h2 id="home-pricing">{copy.pricingTitle}</h2>
            <p>{copy.pricingBody}</p>
          </div>
          <div className="home-pricing-actions">
            <TransitionLink href="/pricing" className="home-primary-link">
              {copy.pricingCta}
            </TransitionLink>
            <TransitionLink href="/oracle" className="home-secondary-link">
              {copy.oracleCta}
            </TransitionLink>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .home-clarity-section {
          width: min(100% - 2rem, 1080px);
          margin: 0 auto;
          padding: clamp(3rem, 7vw, 5.5rem) 0;
        }

        .home-section-heading {
          max-width: 640px;
          margin: 0 auto clamp(1.5rem, 4vw, 2.25rem);
          text-align: center;
        }

        .home-section-heading h2,
        .home-sample-card h2,
        .home-pricing-teaser h2 {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(2rem, 5vw, 3.6rem);
          font-weight: 500;
          line-height: 1.05;
          color: #f5f2e1;
        }

        .home-section-heading p:not(.readable-label),
        .home-sample-card p,
        .home-pricing-teaser p {
          margin: 0.85rem auto 0;
          max-width: 58ch;
          color: rgba(220, 212, 240, 0.74);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: clamp(0.95rem, 1.6vw, 1.08rem);
          line-height: 1.65;
        }

        .home-action-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }

        .home-action-card {
          display: flex;
          min-height: 260px;
          flex-direction: column;
          padding: clamp(1.25rem, 3vw, 1.7rem);
          text-decoration: none;
          transition: transform 260ms var(--ease-ritual), border-color 260ms var(--ease-ritual);
        }

        .home-action-card:hover {
          transform: translateY(-4px);
          border-color: rgba(232, 201, 106, 0.35);
        }

        .home-action-kicker {
          color: rgba(232, 201, 106, 0.82);
          font-size: 0.95rem;
          margin-bottom: 1rem;
        }

        .home-action-card h3,
        .home-why-item h3 {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.55rem;
          font-weight: 600;
          color: #f5f2e1;
        }

        .home-action-card p,
        .home-why-item p {
          margin: 0.75rem 0 0;
          color: rgba(220, 212, 240, 0.72);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.95rem;
          line-height: 1.55;
        }

        .home-card-cta {
          margin-top: auto;
          padding-top: 1.5rem;
          color: #e8c96a;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .home-why-section {
          padding-top: clamp(1rem, 3vw, 2rem);
        }

        .home-why-list {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
          border-top: 1px solid rgba(232, 201, 106, 0.16);
          border-bottom: 1px solid rgba(232, 201, 106, 0.16);
        }

        .home-why-item {
          padding: clamp(1.25rem, 3vw, 1.8rem);
        }

        .home-why-item + .home-why-item {
          border-left: 1px solid rgba(232, 201, 106, 0.12);
        }

        .home-sample-section {
          padding-top: clamp(1rem, 3vw, 2rem);
        }

        .home-sample-card {
          max-width: 760px;
          margin: 0 auto;
          padding: clamp(1.5rem, 5vw, 2.4rem);
          text-align: left;
        }

        .home-inline-link,
        .home-secondary-link {
          display: inline-flex;
          margin-top: 1.35rem;
          color: #e8c96a;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-decoration: none;
          text-transform: uppercase;
        }

        .home-pricing-teaser {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 2rem;
          align-items: center;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .home-pricing-teaser p {
          margin-left: 0;
        }

        .home-pricing-actions {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          align-items: stretch;
          min-width: 210px;
        }

        .home-primary-link {
          display: inline-flex;
          min-height: 52px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: linear-gradient(135deg, #f3dd8e, #d4af37);
          color: #08061a;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-decoration: none;
          text-transform: uppercase;
          padding: 0.9rem 1.4rem;
        }

        .home-secondary-link {
          justify-content: center;
          margin-top: 0;
        }

        @media (max-width: 820px) {
          .home-action-grid,
          .home-why-list,
          .home-pricing-teaser {
            grid-template-columns: 1fr;
          }

          .home-action-card {
            min-height: 0;
          }

          .home-why-item + .home-why-item {
            border-left: 0;
            border-top: 1px solid rgba(232, 201, 106, 0.12);
          }

          .home-pricing-actions {
            min-width: 0;
            width: 100%;
          }
        }

        @media (max-width: 520px) {
          .home-clarity-section {
            width: min(100% - 1.25rem, 1080px);
            padding: 2.6rem 0;
          }

          .home-section-heading {
            text-align: left;
          }

          .home-section-heading h2,
          .home-sample-card h2,
          .home-pricing-teaser h2 {
            font-size: clamp(1.85rem, 12vw, 2.45rem);
          }

          .home-section-heading p:not(.readable-label),
          .home-sample-card p,
          .home-pricing-teaser p {
            font-size: 0.95rem;
            line-height: 1.55;
          }
        }
      `}</style>
    </>
  );
}
