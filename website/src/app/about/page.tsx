import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";

import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/about/";
const description = "A personal practice of tarot. Learn how Olivia Arcana’s cards, interpretations, AI assistance and private journal work.";
export const metadata: Metadata = {
  title: "About | Olivia Arcana",
  description,
  alternates: { canonical: url },
  ...shareMeta({ title: "About Olivia Arcana", description, url, locale: "en", translated: false, type: "website" }),
};

export default function AboutPage() {
  return (
    <LegalShell title="A personal practice of tarot" updated="September 25, 2026">
      <p>
        Olivia Arcana is a space to bring a question, choose your cards, and spend
        time with what they suggest. The purpose is to help you look at a situation
        from another angle and decide what deserves your attention.
      </p>

      <h2>From the card to your own understanding</h2>
      <p>
        The Olivia deck contains all 78 tarot cards: 22 Major Arcana and 56 Minor
        Arcana. A single card offers one focus. A spread gives different parts of
        a question their own place, then invites you to consider how those parts
        relate. You choose the cards and the pace of the reveal.
      </p>
      <p>
        The olive, ivory and lapis artwork belongs to the same experience as the
        reading: a deliberate moment to pause, notice and reflect. The cards do
        not establish facts about your future or another person’s thoughts.
      </p>

      <h2>How the interpretations are made</h2>
      <p>
        Card meanings and reflection prompts form the reference library. These
        are prepared texts, so a standard card meaning stays the same each time
        you encounter it. A spread also uses the purpose of each position to
        connect the cards.
      </p>
      <p>
        AI assists parts of Olivia’s content and can be used for an additional
        response to a question where that feature is available. AI assistance is
        identified in the reading. It can be mistaken or miss important context;
        you remain the person who decides what fits your experience. We do not
        describe AI-assisted content as entirely written by hand.
      </p>

      <h2>A journal that belongs to you</h2>
      <p>
        The personal almanac keeps your saved readings and reflections in this
        browser. You can return to an earlier question, note what changed, and
        download a copy. Device-local storage does not automatically sync to
        another device, and clearing browser data can remove it.
      </p>
      <p>
        An AI response requires sending the question and relevant reading context
        to the interpretation service. The reading flow explains this before you
        request it. Your private journal is not automatically sent with a question.
      </p>

      <h2>A grounded way to use tarot</h2>
      <p>
        Treat an interpretation as an invitation to reflect. For decisions about
        health, safety, money or legal matters, use relevant evidence and qualified
        advice. Olivia cannot diagnose a condition, guarantee an outcome, or make
        a decision on your behalf.
      </p>

      <h2>Begin where you are</h2>
      <ul>
        <li><Link href="/?experience=question">Begin a reading</Link> — bring a question or leave it open.</li>
        <li><Link href="/?experience=spreads">Explore the spreads</Link> — give a more layered question room.</li>
        <li><Link href="/cards">Meet the 78 cards</Link> — read their meanings at your own pace.</li>
        <li><Link href="/?experience=journal">Open your almanac</Link> — return to what you saved in this browser.</li>
        <li><Link href="/contact">Contact Olivia Arcana</Link> — questions, feedback or help.</li>
      </ul>
    </LegalShell>
  );
}
