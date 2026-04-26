import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";

export const metadata = {
  title: "About — Olivia Arcana",
  description: "Astrology and tarot, written by hand, computed from real planetary positions.",
};

export default function AboutPage() {
  return (
    <LegalShell title="About Olivia Arcana" updated="April 25, 2026">
      <blockquote>
        &quot;Astrology is the algebra of the soul.&quot; — written on the studio wall.
      </blockquote>

      <h2>Why we exist</h2>
      <p>
        Most astrology apps are template horoscopes, recycled monthly. Most
        tarot apps are random-card-flippers. Olivia Arcana is the third option:
        readings calculated from your exact planetary positions, written in a
        voice that takes you seriously.
      </p>
      <p>
        Olivia is the persona — the warm, literate astrologer in your pocket.
        Behind her is a real astronomy engine (NASA JPL DE440/DE441 ephemeris),
        a real tarot deck, and a real curriculum (207 lessons across 14
        courses). The AI helps her work at the speed you expect from an app;
        the wisdom is the wisdom.
      </p>

      <h2>What you&apos;ll find here</h2>
      <ul>
        <li><strong>Daily ritual</strong> — a single card, drawn under the right sky, with text written for that hour.</li>
        <li><strong>Your chart</strong> — full natal breakdown with houses, aspects, transits, and a story you can read.</li>
        <li><strong>The Academy</strong> — long-form lessons that earn the word <em>education</em>, not &quot;tips.&quot;</li>
        <li><strong>Olivia AI</strong> — ask anything. She remembers your chart and writes back like a person.</li>
        <li><strong>Voice readings</strong> — VIP members hear their reading narrated.</li>
      </ul>

      <h2>Not magic. Not science. Both.</h2>
      <p>
        We compute the sky exactly. We interpret it traditionally. The
        astronomy is precise to fractions of a degree; the meaning is what
        humans have argued over for two thousand years. We pick the
        interpretations we find useful and tell you when something is symbolic
        rather than literal.
      </p>

      <h2>Built by</h2>
      <p>
        Olivia Arcana LLC, a Wyoming, USA company. A small team of astrologers,
        designers, engineers, and one cat. Reach us at{" "}
        <a href="mailto:hello@oliviaarcana.com">hello@oliviaarcana.com</a>.
      </p>

      <h2>Where to start</h2>
      <ul>
        <li><Link href="/onboarding">Set up your chart</Link> — takes 90 seconds.</li>
        <li><Link href="/sample">Read a sample reading</Link> — see what we mean by &quot;written by hand.&quot;</li>
        <li><Link href="/academy">Browse the Academy</Link> — 14 courses from &quot;what is astrology&quot; to deep advanced interpretation.</li>
        <li><Link href="/#pricing">See pricing</Link> — Free forever; paid tiers from $4.99/mo.</li>
      </ul>
    </LegalShell>
  );
}
