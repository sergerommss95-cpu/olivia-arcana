import LegalShell from "@/components/legal/LegalShell";
import Link from "next/link";

export const metadata = {
  title: "Contact — Olivia Arcana",
  description: "How to reach Olivia Arcana — support, press, partnerships, legal.",
};

export default function ContactPage() {
  return (
    <LegalShell title="Contact" updated="April 25, 2026">
      <p>
        We read every message. Pick the address that fits — you&apos;ll get a real
        human, usually within two business days.
      </p>

      <h2>Support</h2>
      <p>
        Account, billing, refunds, bugs, broken readings.<br />
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

      <h2>Find us elsewhere</h2>
      <ul>
        <li>Telegram bot — <a href="https://t.me/OliviaArcanaBot" target="_blank" rel="noopener noreferrer">@OliviaArcanaBot</a></li>
        <li>Daily channel — <a href="https://t.me/OliviaArcanaDaily" target="_blank" rel="noopener noreferrer">@OliviaArcanaDaily</a></li>
      </ul>

      <h2>Postal address</h2>
      <address style={{ fontStyle: "normal" }}>
        Olivia Arcana LLC<br />
        (Wyoming, USA — full registered address available on written request)
      </address>
    </LegalShell>
  );
}
