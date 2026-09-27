import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";
import { TELEGRAM_BOT_ENABLED, TELEGRAM_CHANNEL_ENABLED, TELEGRAM_BOT_URL, TELEGRAM_CHANNEL_URL } from "@/lib/service-status";

export const metadata: Metadata = {
  title: "Контакти — Olivia Arcana",
  description: "Як зв’язатися з Olivia Arcana: підтримка, конфіденційність, преса й партнерства, правові питання.",
  alternates: { canonical: "/uk/contact", languages: { en: "/contact", uk: "/uk/contact", "x-default": "/contact" } },
};

export default function UkrainianContactPage() {
  return (
    <LegalShell title="Контакти" updated="27 вересня 2026 р." alternateHref="/contact">
      <p>
        Ми читаємо кожне повідомлення. Оберіть адресу, яка відповідає вашому
        запитанню, — вам відповість жива людина, зазвичай протягом двох робочих днів.
      </p>

      <h2>Підтримка</h2>
      <p>
        Читання, ваш альманах, помилки — усе, що не працює.<br />
        <a href="mailto:support@oliviaarcana.com">support@oliviaarcana.com</a>
      </p>

      <h2>Загальні питання</h2>
      <p>
        Запитання, пропозиції, «мені подобається» чи «мені не подобається».<br />
        <a href="mailto:hello@oliviaarcana.com">hello@oliviaarcana.com</a>
      </p>

      <h2>Конфіденційність і дані</h2>
      <p>
        Доступ до даних, їх видалення, права за GDPR / CCPA.<br />
        <a href="mailto:privacy@oliviaarcana.com">privacy@oliviaarcana.com</a>
      </p>

      <h2>Преса й партнерства</h2>
      <p>
        Інтерв’ю, співпраця, робота з брендом.<br />
        <a href="mailto:press@oliviaarcana.com">press@oliviaarcana.com</a>
      </p>

      <h2>Правові питання та DMCA</h2>
      <p>
        Вимоги щодо авторських прав, питання торговельних марок.<br />
        <a href="mailto:legal@oliviaarcana.com">legal@oliviaarcana.com</a> ·{" "}
        <a href="mailto:dmca@oliviaarcana.com">dmca@oliviaarcana.com</a> ·{" "}
        <Link href="/dmca" hrefLang="en">Політика DMCA <span lang="en">(EN)</span></Link>
      </p>

      {(TELEGRAM_BOT_ENABLED || TELEGRAM_CHANNEL_ENABLED) && <>
        <h2>Ми також у Telegram</h2>
        <ul>
          {TELEGRAM_BOT_ENABLED && <li>Telegram-бот — <a href={`${TELEGRAM_BOT_URL}?start=contact`} target="_blank" rel="noopener noreferrer">@OliviaArcanaBot</a></li>}
          {TELEGRAM_CHANNEL_ENABLED && <li>Щоденний канал — <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer">@OliviaArcanaDaily</a></li>}
        </ul>
      </>}

      <h2>Поштова адреса</h2>
      <address style={{ fontStyle: "normal" }}>
        Olivia Arcana LLC<br />
        (Вайомінг, США — повну зареєстровану адресу надаємо на письмовий запит)
      </address>
    </LegalShell>
  );
}
