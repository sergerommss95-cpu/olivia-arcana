import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";

export const metadata = {
  title: "Terms of Service — Olivia Arcana",
  description: "The agreement between you and Olivia Arcana when you use the Service.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="April 25, 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of the Olivia Arcana
        website, mobile apps, and Telegram bot (the &quot;Service&quot;) operated by
        Olivia Arcana LLC (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;).
      </p>
      <p>
        By creating an account or using the Service you agree to these Terms.
        If you do not agree, do not use the Service.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 16 years old. By using the Service you represent
        that you meet this requirement and have the legal capacity to enter
        into these Terms.
      </p>

      <h2>2. Account</h2>
      <p>
        You sign in with Google. You are responsible for keeping your Google
        account secure. You may not share, sell, or transfer your account.
      </p>

      <h2>3. Subscriptions and one-time purchases</h2>
      <ul>
        <li>Plans: Free, Insight, Premium, VIP. Pricing is shown on the <Link href="/#pricing">pricing page</Link>.</li>
        <li>Subscriptions auto-renew at the displayed cadence (monthly or annual) until you cancel.</li>
        <li>Cancellation takes effect at the end of the current billing period; we do not refund the unused portion except as described in the Refund Policy.</li>
        <li>One-time readings (&quot;addons&quot;) are delivered to your account permanently after purchase.</li>
        <li>Web payments are processed by <strong>Paddle</strong>, our Merchant of Record. Paddle handles tax. In-Telegram purchases use <strong>Telegram Stars</strong>.</li>
      </ul>

      <h2>4. Refunds</h2>
      <p>
        Subscriptions: 14-day refund from the initial charge if you have not
        substantially used the Service. One-time readings are non-refundable
        once delivered. See the <Link href="/refund">Refund Policy</Link> for details.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for unlawful purposes.</li>
        <li>Reverse-engineer, scrape, or attempt to extract our content beyond reading it normally.</li>
        <li>Resell, sublicense, or redistribute readings, lessons, or other content.</li>
        <li>Submit content that is illegal, harassing, defamatory, or infringes third-party rights.</li>
        <li>Use the Service to circumvent rate limits or our payment system.</li>
      </ul>

      <h2>6. Entertainment, not advice</h2>
      <p>
        Readings, horoscopes, and oracle responses are provided for{" "}
        <strong>entertainment and self-reflection only</strong>. They are not
        substitutes for medical, legal, financial, psychological, or professional
        advice. Do not make material life decisions based solely on a reading.
        See the <Link href="/disclaimer">Disclaimer</Link>.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        All content provided by Olivia Arcana — text, imagery, software, brand,
        and the Olivia persona — is owned by us or our licensors and protected
        by copyright and trademark law. You receive a personal, non-exclusive,
        non-transferable license to access and view the content while your
        account is active.
      </p>

      <h2>8. User content</h2>
      <p>
        You retain ownership of journal entries, questions, and feedback you
        submit. By submitting them, you grant us a worldwide, royalty-free,
        non-exclusive license to host, store, and display that content for the
        purpose of operating the Service.
      </p>

      <h2>9. Termination</h2>
      <p>
        You may close your account at any time. We may suspend or terminate
        accounts that violate these Terms or applicable law, with or without
        notice. Upon termination, sections that by their nature should
        survive (intellectual property, disclaimers, liability limits, governing
        law) remain in effect.
      </p>

      <h2>10. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
        OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR
        A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
      </p>

      <h2>11. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, OLIVIA ARCANA LLC IS NOT LIABLE
        FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
        DAMAGES. OUR TOTAL LIABILITY FOR ANY CLAIM IS LIMITED TO THE GREATER OF
        $100 USD OR THE AMOUNT YOU PAID US IN THE 12 MONTHS BEFORE THE CLAIM.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of Wyoming, USA,
        without regard to conflict-of-laws rules. Disputes will be resolved in
        the state or federal courts located in Wyoming, except where
        applicable consumer-protection law gives you the right to use your
        local courts.
      </p>

      <h2>13. Changes</h2>
      <p>
        We may update these Terms. Material changes will be announced in-app
        or by email at least 14 days before they take effect. Continued use
        after the effective date means you accept the new Terms.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions? <a href="mailto:hello@oliviaarcana.com">hello@oliviaarcana.com</a> ·{" "}
        <Link href="/contact">Contact form</Link>
      </p>
    </LegalShell>
  );
}
