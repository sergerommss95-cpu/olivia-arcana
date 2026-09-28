import Link from "next/link";
import Image from "next/image";
import styles from "./studies.module.css";
import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/studies/";
const description = "Two interactive studies in attention: an illustrated tarot ritual and an engraved map of the sky.";
export const metadata: Metadata = {
  title: "The Night Collection | Olivia Arcana",
  description,
  alternates: { canonical: url },
  ...shareMeta({ title: "The Night Collection", description, url, locale: "en", translated: false, type: "website" }),
};

function SkyEngraving() {
  // An editorial constellation specimen, not an observer chart.
  const points = [[92, 91], [145, 65], [164, 139], [191, 148], [220, 153], [243, 221], [158, 244]];
  return (
    <svg viewBox="0 0 340 340" aria-hidden="true" className={styles.engraving}>
      <circle cx="170" cy="170" r="143" />
      <circle cx="170" cy="170" r="136" />
      <circle cx="170" cy="170" r="86" strokeDasharray="1 7" />
      {Array.from({ length: 72 }, (_, i) => {
        const a = i * Math.PI / 36;
        return <line key={i} x1={170 + 143 * Math.cos(a)} y1={170 + 143 * Math.sin(a)} x2={170 + (i % 6 === 0 ? 151 : 146) * Math.cos(a)} y2={170 + (i % 6 === 0 ? 151 : 146) * Math.sin(a)} />;
      })}
      <path d="M92 91L145 65L220 153L191 148L164 139L92 91M164 139L158 244M220 153L243 221" />
      {points.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={i === 1 || i === 5 ? 4 : 2.5} className={styles.star} /><circle cx={x} cy={y} r="9" opacity=".4" /></g>)}
      <text x="170" y="21" textAnchor="middle">N</text>
      <text x="12" y="175" textAnchor="middle">E</text>
      <text x="328" y="175" textAnchor="middle">W</text>
      <text x="170" y="331" textAnchor="middle">S</text>
    </svg>
  );
}

export default function StudiesPage() {
  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.masthead}>
        <Link href="/" className={styles.wordmark}>Olivia Arcana</Link>
        <span>The night collection</span>
        <Link href="/">Return to Olivia <span aria-hidden="true">↗</span></Link>
      </header>
      <div className={styles.opening}>
        <p className={styles.eyebrow}>Interactive studies / Edition II</p>
        <h1>The art of<br /><em>paying attention.</em></h1>
        <p className={styles.intro}>A card in your hand. <br />A sky that belongs to a moment.<br /><span>Two invitations to look a little closer.</span></p>
      </div>
      <div className={styles.collection}>
        <Link href="/studies/tarot/" className={styles.tarot}>
          <div className={styles.plateHeading}><span>I / The living tarot</span><span>Enter the ritual <b aria-hidden="true">↗</b></span></div>
          <div className={styles.deck} aria-hidden="true">
            <Image className={styles.leftCard} src="/cards/18_the_moon.webp" alt="" width={184} height={318} />
            <Image className={styles.centerCard} src="/cards/17_the_star.webp" alt="" width={184} height={318} priority />
            <Image className={styles.rightCard} src="/cards/19_the_sun.webp" alt="" width={184} height={318} />
          </div>
          <div className={styles.plateCopy}><h2>Let one image<br /><em>open a question.</em></h2><p>Choose your intention. Draw from the illustrated deck. Turn a card, then take its question with you.</p></div>
          <div className={styles.plateFoot}><span>78 cards · One or three card readings</span><span aria-hidden="true">01</span></div>
        </Link>
        <Link href="/studies/sky/" className={styles.sky}>
          <div className={styles.plateHeading}><span>II / The celestial atlas</span><span>Open the sky <b aria-hidden="true">↗</b></span></div>
          <SkyEngraving />
          <div className={styles.plateCopy}><h2>A moment,<br /><em>written in stars.</em></h2><p>Set a place and time. Trace the constellations. Discover which worlds are above your horizon.</p></div>
          <div className={styles.plateFoot}><span>An observer’s sky · Time and place</span><span aria-hidden="true">02</span></div>
        </Link>
      </div>
      <footer className={styles.footer}><p>Olivia Arcana <span>—</span> An almanac for the inner life.</p><Link href="/">Explore the full collection <span aria-hidden="true">↗</span></Link></footer>
    </main>
  );
}
