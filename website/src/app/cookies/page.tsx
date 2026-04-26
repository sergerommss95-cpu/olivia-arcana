import LegalShell from "@/components/legal/LegalShell";
import Link from "next/link";

export const metadata = {
  title: "Cookies Policy — Olivia Arcana",
  description: "How Olivia Arcana uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <LegalShell title="Cookies Policy" updated="April 25, 2026">
      <p>
        This Cookies Policy explains how Olivia Arcana LLC uses cookies and
        similar technologies on our website and apps. For broader privacy
        information see our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>What is a cookie</h2>
      <p>
        A cookie is a small text file stored on your device by your browser.
        Similar technologies include <code>localStorage</code>, session
        storage, and pixel tags.
      </p>

      <h2>Categories we use</h2>
      <h3>Strictly necessary</h3>
      <ul>
        <li><strong>Authentication</strong> — Supabase session cookie keeps you signed in.</li>
        <li><strong>Token storage</strong> — <code>olivia-token</code> in <code>localStorage</code> stores your API token.</li>
        <li><strong>Locale</strong> — <code>olivia-locale</code> in <code>localStorage</code> remembers your language choice.</li>
        <li><strong>Security</strong> — CSRF and rate-limit cookies set by Supabase / Paddle.</li>
      </ul>
      <h3>Functional</h3>
      <ul>
        <li><strong>User profile cache</strong> — your sun sign and onboarding state are cached locally so the site personalizes without a server round-trip.</li>
        <li><strong>UI preferences</strong> — billing-period toggle, theme preferences.</li>
      </ul>
      <h3>Analytics</h3>
      <p>
        We may add a privacy-respecting analytics provider (e.g. Plausible or
        Fathom). When we do, this section will list it. We do not use Google
        Analytics.
      </p>
      <h3>Advertising</h3>
      <p>We do not use advertising cookies or third-party ad trackers.</p>

      <h2>Payment provider cookies</h2>
      <p>
        When you check out via Paddle or Telegram Stars, the payment provider
        sets its own cookies on its own domain. We do not control those — refer
        to <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer">Paddle&apos;s privacy policy</a> and{" "}
        <a href="https://telegram.org/privacy" target="_blank" rel="noopener noreferrer">Telegram&apos;s privacy policy</a>.
      </p>

      <h2>Managing cookies</h2>
      <p>
        You can clear cookies and <code>localStorage</code> in your browser at
        any time. Clearing them will sign you out and reset your locale. Most
        browsers let you block all cookies, though that will break login.
      </p>

      <h2>Changes</h2>
      <p>We will update this page when our cookie usage changes.</p>

      <h2>Contact</h2>
      <p><a href="mailto:privacy@oliviaarcana.com">privacy@oliviaarcana.com</a></p>
    </LegalShell>
  );
}
