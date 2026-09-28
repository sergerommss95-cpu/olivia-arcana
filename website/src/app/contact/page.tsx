import LegalShell from "@/components/legal/LegalShell";
import Link from "next/link";
import { TELEGRAM_BOT_ENABLED, TELEGRAM_CHANNEL_ENABLED, TELEGRAM_BOT_URL, TELEGRAM_CHANNEL_URL } from "@/lib/service-status";

export const metadata = {
  title: "Contact — Olivia Arcana",
  description: "How to reach Olivia Arcana — support, press, partnerships, legal.",
  alternates: { canonical: "/contact", languages: { en: "/contact", uk: "/uk/contact", "x-default": "/contact" } },
};

export default function ContactPage() {
  return (
    <LegalShell title="Contact" updated="September 27, 2026" alternateHref="/uk/contact">
      <p>
        We read every message. Pick the address that fits — you&apos;ll get a real
        human, usually within two business days.
      </p>

      <h2>Support</h2>
      <p>
        Readings, your almanac, bugs — anything that isn’t working.<br />
        <a href="mailto:support@oliviaarcana.com">support@oliviaarcana.com</a>
      </p>

      <h2>General / hello</h2>
      <p>
        Questions, suggestions, &quot;I love this,&quot; &quot;I hate this.&quot;<br />
        <a href="mailto:hello@oliviaarcana.com">hello@oliviaarcana.com</a>
      </p>

      <h2>Privacy & data</h2>
      <p>
        Data access, deletion, GDPR / CCPA rights.<br />
        <a href="mailto:privacy@oliviaarcana.com">privacy@oliviaarcana.com</a>
      </p>

      <h2>Press & partnerships</h2>
      <p>
        Interviews, collaborations, brand work.<br />
        <a href="mailto:press@oliviaarcana.com">press@oliviaarcana.com</a>
      </p>

      <h2>Legal & DMCA</h2>
      <p>
        Copyright takedowns, trademark issues.<br />
        <a href="mailto:legal@oliviaarcana.com">legal@oliviaarcana.com</a> ·{" "}
        <a href="mailto:dmca@oliviaarcana.com">dmca@oliviaarcana.com</a> ·{" "}
        <Link href="/dmca">DMCA Policy</Link>
      </p>

      {(TELEGRAM_BOT_ENABLED || TELEGRAM_CHANNEL_ENABLED) && <>
        <h2>Find us elsewhere</h2>
        <ul>
          {TELEGRAM_BOT_ENABLED && <li>Telegram bot — <a href={`${TELEGRAM_BOT_URL}?start=contact`} target="_blank" rel="noopener noreferrer">@OliviaArcanaBot</a></li>}
          {TELEGRAM_CHANNEL_ENABLED && <li>Daily channel — <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer">@OliviaArcanaDaily</a></li>}
        </ul>
      </>}

      <h2>Postal address</h2>
      <address style={{ fontStyle: "normal" }}>
        Olivia Arcana LLC<br />
        (Wyoming, USA — full registered address available on written request)
      </address>
    </LegalShell>
  );
}
