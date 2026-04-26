import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";

export const metadata = {
  title: "Refund Policy — Olivia Arcana",
  description: "When and how Olivia Arcana issues refunds for subscriptions and one-time readings.",
};

export default function RefundPage() {
  return (
    <LegalShell title="Refund Policy" updated="April 25, 2026">
      <p>
        We want you to feel good about every reading. This page explains when
        you can get a refund and how to request one.
      </p>

      <h2>Subscriptions</h2>
      <ul>
        <li><strong>14-day refund</strong> — full refund within 14 days of your initial subscription charge if you have not substantially used paid features.</li>
        <li>&quot;Substantial use&quot; means generating more than 3 personalized readings, completing more than 5 academy lessons, or downloading content for offline use.</li>
        <li><strong>Renewal charges</strong> — annual renewals can be refunded within 7 days of the renewal charge if no paid feature has been used during the new period.</li>
        <li><strong>Cancellation</strong> — you may cancel any time from <Link href="/account/billing">/account/billing</Link>. Cancellation stops the next renewal; the current period stays active until its end.</li>
      </ul>

      <h2>One-time readings (addons)</h2>
      <p>
        One-time readings (Full Natal Chart, Synastry, Celtic Cross, Year-Ahead,
        Solar Return, Video Reading) are non-refundable once delivered, because
        the reading is generated and stored to your account at purchase.
      </p>
      <p>
        If a reading fails to generate due to a technical error on our side, we
        will either redeliver it or refund the purchase. Email{" "}
        <a href="mailto:support@oliviaarcana.com">support@oliviaarcana.com</a>{" "}
        with your order ID.
      </p>

      <h2>Telegram Stars purchases</h2>
      <p>
        Stars purchases are governed by Telegram&apos;s refund policy. We will
        process the refund through Telegram on your behalf upon request, within
        the time window allowed by Telegram.
      </p>

      <h2>How to request a refund</h2>
      <ol>
        <li>Email <a href="mailto:support@oliviaarcana.com">support@oliviaarcana.com</a> from the address on your account.</li>
        <li>Include your order ID or the email of the Google account you signed in with.</li>
        <li>Tell us briefly why you want the refund (we read every one — it helps us improve).</li>
      </ol>
      <p>
        Refunds are processed within 5–10 business days back to your original
        payment method via Paddle.
      </p>

      <h2>Statutory rights</h2>
      <p>
        Nothing in this policy limits any non-waivable consumer-protection
        right you have under your local law (e.g. EU 14-day right of
        withdrawal, UK CCRs).
      </p>
    </LegalShell>
  );
}
