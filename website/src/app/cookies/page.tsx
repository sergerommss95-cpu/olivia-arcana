import LegalShell from "@/components/legal/LegalShell";
import Link from "next/link";

export const metadata = {
  title: "Cookies Policy — Olivia Arcana",
  description: "Olivia Arcana sets no cookies. What the site stores in your browser, and how to remove it.",
};

export default function CookiesPage() {
  return (
    <LegalShell title="Cookies Policy" updated="September 26, 2026">
      <p>
        Olivia Arcana does not set cookies, and it uses no advertising or analytics trackers. The
        site does keep some information in your browser so that your almanac works without an
        account. This page lists it. For the full picture, see the{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>What the site stores in your browser</h2>
      <h3>Local storage (strictly necessary for the features you use)</h3>
      <ul>
        <li><strong>Your almanac</strong> — readings and spreads you keep, with your notes, reflections and revisit dates.</li>
        <li><strong>Your practice</strong> — Today&apos;s card, recent questions, a draft you have not finished, and the question you carry from the question page to the cards.</li>
        <li><strong>Preferences</strong> — your language and display choices, and whether you dismissed an install suggestion.</li>
        <li><strong>Earlier pages</strong> — some earlier astrology pages keep a birth date you enter, used for calculations in your browser.</li>
      </ul>
      <h3>Service worker cache</h3>
      <p>
        On some pages the site stores copies of its own pages and files so they load faster and
        keep working on a weak connection.
      </p>
      <p>None of this is sent to us or used to track you.</p>

      <h2>Removing it</h2>
      <p>
        You can remove single readings in your almanac, or clear everything by clearing this
        site&apos;s data in your browser settings. Download a backup first if you want to keep your
        readings. Some browsers, Safari in particular, may clear a site&apos;s data after a period
        without a visit.
      </p>

      <h2>If this changes</h2>
      <p>
        If we ever add cookies or a privacy-respecting analytics service, this page will list them
        before they are used.
      </p>

      <h2>Contact</h2>
      <p><a href="mailto:privacy@oliviaarcana.com">privacy@oliviaarcana.com</a></p>
    </LegalShell>
  );
}
