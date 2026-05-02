import LegalShell from "@/components/legal/LegalShell";
import Link from "next/link";

export const metadata = {
  title: "Disclaimer — Olivia Arcana",
  description: "Astrology and tarot readings on Olivia Arcana are for entertainment and self-reflection.",
};

export default function DisclaimerPage() {
  return (
    <LegalShell title="Disclaimer" updated="April 25, 2026">
      <blockquote>
        Olivia Arcana is a tool for self-reflection. The stars do not decide
        for you — you do.
      </blockquote>

      <h2>Entertainment & self-reflection only</h2>
      <p>
        All readings, horoscopes, tarot interpretations, transit alerts,
        compatibility reports, journal prompts, and oracle conversations on
        Olivia Arcana are provided for <strong>entertainment, education,
        and personal reflection</strong>. They are not factual predictions
        of future events.
      </p>

      <h2>Not professional advice</h2>
      <p>
        Nothing on Olivia Arcana is medical, psychological, legal, financial,
        relationship, or professional advice. Do not delay seeking advice from
        a qualified professional because of a reading. If you are in distress
        or facing a serious decision, consult a licensed expert.
      </p>
      <ul>
        <li><strong>Medical/mental health</strong> — talk to a licensed clinician.</li>
        <li><strong>Legal</strong> — consult a licensed attorney.</li>
        <li><strong>Financial/investment</strong> — consult a qualified financial advisor.</li>
        <li><strong>Crisis</strong> — if you are in danger, contact your local emergency services or a crisis hotline.</li>
      </ul>

      <h2>AI-generated content</h2>
      <p>
        Parts of the Service use AI models (Anthropic Claude). AI output may
        contain errors, omissions, or unexpected interpretations. Use your own
        judgment.
      </p>

      <h2>Astronomical data</h2>
      <p>
        Planetary positions are computed from the <strong>JPL DE440/DE441
        Ephemeris</strong>. The astronomy is precise based on scientific 
        models; the astrological interpretation built on top is symbolic 
        and traditional. Olivia Arcana is not affiliated with, endorsed by,
        or connected to NASA or the Jet Propulsion Laboratory.
      </p>

      <h2>No guarantee of results</h2>
      <p>
        We make no guarantee that any reading or feature will produce a
        specific outcome in your life. You are solely responsible for the
        choices you make.
      </p>

      <h2>Third-party content</h2>
      <p>
        Some lesson material references traditional sources (Rider-Waite,
        Marseille, Hellenistic and modern astrology). Where third-party
        material is used, attribution is given.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this Disclaimer? <Link href="/contact">Contact us</Link>.
      </p>
    </LegalShell>
  );
}
