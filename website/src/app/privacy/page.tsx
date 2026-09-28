import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";

export const metadata = {
  title: "Privacy Policy — Olivia Arcana",
  description: "What Olivia Arcana keeps on your device, what is sent when you ask for a personal reading, and who processes it.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="September 26, 2026">
      <p>
        This policy explains what <strong>Olivia Arcana</strong> (&quot;we&quot;, &quot;us&quot;) handles when
        you use oliviaarcana.com (the &quot;site&quot;). In short: the readings you keep stay in your
        browser, on your device. A question leaves your device only when you ask for an AI-assisted
        personal reading or use the question conversation, and then only to prepare that response.
      </p>

      <h2>1. Who we are</h2>
      <p>
        Olivia Arcana is operated by Olivia Arcana LLC (a Wyoming, United States limited liability
        company). For privacy questions, write to{" "}
        <a href="mailto:privacy@oliviaarcana.com">privacy@oliviaarcana.com</a>.
      </p>

      <h2>2. What stays on your device</h2>
      <ul>
        <li>
          <strong>Your almanac</strong> — readings you keep: your question, the cards you chose and
          their orientation, dates, your notes and reflections, revisit dates, and any personal reading
          you choose to keep. Also Today&apos;s card, your recent questions and your preferences.
        </li>
        <li>
          These are stored in your browser&apos;s local storage. We do not receive a copy, and there is
          no account that holds them.
        </li>
        <li>
          You can download a backup file, import it on another device, remove single readings, or clear
          everything by clearing this site&apos;s data in your browser. Some browsers, Safari in
          particular, may delete a site&apos;s stored data if you have not visited it for a while, so
          keep a backup of anything you want to keep.
        </li>
        <li>
          Some earlier pages of the site let you enter a birth date. It is stored in your browser and
          used for calculations there; it is not sent to us.
        </li>
        <li>
          The site may keep copies of its own pages and files in your browser (a service worker cache)
          so that they load faster.
        </li>
      </ul>

      <h2>3. What is sent, and when</h2>
      <h3>Personal readings</h3>
      <p>
        When you ask for a personal reading and confirm, we send your question, the cards you chose
        (with their orientation), the spread and your language to our reading service, which runs on
        our host, Netlify. It forwards them to <strong>Anthropic</strong>, our AI provider, to prepare
        the reading. Your notes and your almanac are not sent. The reading returns to your browser; it
        is kept only if you choose to keep it, and then only on your device.
      </p>
      <h3>The question conversation</h3>
      <p>
        On the page for exploring your question, the messages you send in that conversation are sent
        the same way, to prepare each response.
      </p>
      <h3>How the AI provider handles it</h3>
      <p>
        Anthropic processes this content to generate the response under its commercial terms, which do
        not allow content sent through its API to be used to train its models. It may keep that
        content for a limited period for safety and legal purposes, as described in{" "}
        <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer">its privacy policy</a>.
        Please don&apos;t include information you would not want an AI service to process, such as
        other people&apos;s private details.
      </p>
      <h3>Technical data</h3>
      <p>
        Like any website, requests reach our host, Netlify, which processes technical data such as your
        IP address, browser type and the page requested, to deliver the site and keep it secure. To
        apply an hourly limit on personal readings, our reading service holds your IP address
        temporarily in memory; it is not written to storage. When the AI provider fails, the service
        records technical error codes, never your question.
      </p>

      <h2>4. What we don&apos;t do</h2>
      <ul>
        <li>There are no accounts on the site at present, and no payments are taken.</li>
        <li>We don&apos;t use advertising or analytics trackers, and we don&apos;t set cookies (see the <Link href="/cookies">Cookies Policy</Link>).</li>
        <li>We don&apos;t sell personal data or share it for advertising.</li>
      </ul>
      <p>
        If accounts, synchronisation or paid membership open later, this policy will be updated before
        they do.
      </p>

      <h2>5. Service providers</h2>
      <ul>
        <li><strong>Netlify</strong> — hosting and the reading service.</li>
        <li><strong>Anthropic</strong> — AI-assisted responses, only when you ask for one.</li>
      </ul>

      <h2>6. International transfers</h2>
      <p>
        Both providers are based in the United States and may process data there. Where the law
        requires it, transfers rely on appropriate safeguards such as Standard Contractual Clauses.
      </p>

      <h2>7. Retention</h2>
      <p>
        What is on your device stays until you delete it or your browser clears it. We don&apos;t keep
        your questions or readings on our servers. Technical logs are kept by Netlify for a limited
        period under its policies, and AI content by Anthropic as described above.
      </p>

      <h2>8. Your rights</h2>
      <p>
        Depending on where you live (for example under the GDPR or UK GDPR), you may have rights to
        access, correct, delete or port your data, to restrict or object to processing, and to complain
        to your data protection authority. Your almanac is on your device, so you can download or delete
        it yourself at any time. For anything else, write to{" "}
        <a href="mailto:privacy@oliviaarcana.com">privacy@oliviaarcana.com</a>.
      </p>

      <h2>9. Earlier services</h2>
      <p>
        Olivia Arcana earlier offered an astrology service and a Telegram bot. If you used them and want
        to know about, or delete, any data that may remain from them, write to{" "}
        <a href="mailto:privacy@oliviaarcana.com">privacy@oliviaarcana.com</a>.
      </p>

      <h2>10. Children</h2>
      <p>
        The site is not directed to anyone under 16, and we do not knowingly collect children&apos;s
        data.
      </p>

      <h2>11. Security</h2>
      <p>
        The site is served over HTTPS, and only the reading service can call the AI provider. Data kept
        on your device is protected by your device and browser, so use a screen lock if others can use
        it.
      </p>

      <h2>12. Changes</h2>
      <p>
        We will post any update here with a new date. Material changes will be explained on the site
        before they take effect.
      </p>

      <h2>13. Contact</h2>
      <p>
        <a href="mailto:privacy@oliviaarcana.com">privacy@oliviaarcana.com</a> ·{" "}
        <Link href="/contact">Contact</Link>
      </p>
    </LegalShell>
  );
}
