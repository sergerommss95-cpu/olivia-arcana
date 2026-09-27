import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";

export const metadata = {
  title: "Privacy Policy — Olivia Arcana",
  description: "How Olivia Arcana collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="April 25, 2026">
      <p>
        This Privacy Policy explains how <strong>Olivia Arcana</strong> (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
        collects, uses, stores, and shares your personal information when you use
        our website, mobile apps, and Telegram bot (collectively, the &quot;Service&quot;).
      </p>
      <p>
        By using the Service you agree to the practices described here. If you do
        not agree, please stop using the Service.
      </p>

      <h2>1. Who we are</h2>
      <p>
        Olivia Arcana is operated by Olivia Arcana LLC (a Wyoming, United States
        limited liability company). For privacy questions you may write to{" "}
        <a href="mailto:privacy@oliviaarcana.com">privacy@oliviaarcana.com</a>.
      </p>

      <h2>2. Information we collect</h2>
      <h3>Information you provide</h3>
      <ul>
        <li><strong>Account data</strong> — your name, email address, and Google account identifier when you sign in with Google.</li>
        <li><strong>Birth data</strong> — date, time, and place of birth used to compute your natal chart. Birth time is optional.</li>
        <li><strong>Reading inputs</strong> — questions you ask the AI oracle, journal entries, second-person birth data for compatibility readings, and any feedback you submit.</li>
      </ul>
      <h3>Information collected automatically</h3>
      <ul>
        <li><strong>Usage data</strong> — pages viewed, features used, time stamps, and approximate device/browser type.</li>
        <li><strong>Technical data</strong> — IP address, user agent, and cookie identifiers (see Cookies Policy).</li>
        <li><strong>Payment data</strong> — handled by Paddle (web) and Telegram (Stars). We never see your card details. Paddle and Telegram share with us only the metadata required to fulfill your subscription.</li>
      </ul>

      <h2>3. How we use your data</h2>
      <ul>
        <li>To compute astrological readings unique to your chart.</li>
        <li>To deliver the Service, manage your account, and process payments.</li>
        <li>To improve the Service through aggregate analytics.</li>
        <li>To prevent fraud, abuse, and security incidents.</li>
        <li>To comply with applicable law.</li>
      </ul>

      <h2>4. AI oracle data</h2>
      <p>
        Questions sent to the AI oracle are forwarded to Anthropic, our model
        provider. Anthropic processes prompts under their data policy and does
        not train on your inputs. We retain the conversation in your account so
        you can revisit past readings.
      </p>

      <h2>5. Sharing</h2>
      <p>We share data only with the providers needed to run the Service:</p>
      <ul>
        <li><strong>Supabase</strong> — authentication and primary database.</li>
        <li><strong>Anthropic</strong> — AI model inference.</li>
        <li><strong>Paddle</strong> — Merchant of Record for web payments.</li>
        <li><strong>Telegram</strong> — Stars payments and the Olivia bot.</li>
        <li><strong>ElevenLabs</strong> — voice synthesis (VIP tier).</li>
        <li><strong>Netlify</strong> — site hosting.</li>
      </ul>
      <p>
        We do not sell your personal data. We do not share it for third-party
        advertising.
      </p>

      <h2>6. International transfers</h2>
      <p>
        Your data may be stored in the United States and the European Union.
        Where required, transfers rely on Standard Contractual Clauses or other
        safeguards under the GDPR.
      </p>

      <h2>7. Retention</h2>
      <p>
        We keep account data for as long as your account exists. You can delete
        your account at any time from <Link href="/account/billing">/account/billing</Link>{" "}
        or by emailing us. Upon deletion, personal data is removed within 30
        days; aggregated, anonymized analytics may be retained.
      </p>

      <h2>8. Your rights</h2>
      <p>
        Depending on where you live (GDPR, CCPA, UK GDPR), you have rights to:
        access, correct, delete, port, and restrict processing of your data,
        and to object to processing or withdraw consent. To exercise any of
        these, write to <a href="mailto:privacy@oliviaarcana.com">privacy@oliviaarcana.com</a>.
      </p>

      <h2>9. Children</h2>
      <p>
        The Service is not directed to anyone under 16. We do not knowingly
        collect data from children. If you believe a child has given us data,
        contact us and we will delete it.
      </p>

      <h2>10. Security</h2>
      <p>
        We use TLS in transit, encryption at rest where supported, and
        least-privilege access controls. No system is perfectly secure; we
        encourage strong passwords on your Google account and 2FA.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update this Policy. We will post the new version here and, for
        material changes, notify you in-app or by email. Continued use after the
        change means you accept the new Policy.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions or complaints? <a href="mailto:privacy@oliviaarcana.com">privacy@oliviaarcana.com</a> ·{" "}
        <Link href="/contact">Contact form</Link>
      </p>
    </LegalShell>
  );
}
