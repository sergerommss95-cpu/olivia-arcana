"use client";

/**
 * Keeping a finished portrait, in the reading's closing band: its title set
 * once more under "Keep this portrait", then save it in this browser (the
 * button then reads «Saved»), download it as one standalone page, or print
 * it. A portrait reopened from the saved list says it is saved and offers to
 * forget it. Results are spoken through the reader's live region (`onSay`).
 */

import { useState } from "react";
import type { MajorCard } from "@/lib/astrology/deck";
import { buildExport, exportImages, fileName } from "@/lib/portrait/export.js";
import type { PortraitPacket, PortraitStages, PortraitStatus } from "./client";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import styles from "./keep.module.css";

/** A same-origin image as a data: URI, or null when it cannot be fetched. */
async function inline(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function Keep({ locale, reopened, kept, packet, stages, teachings, cards, onSave, onForget, onSay }: {
  locale: PortraitLocale;
  /** Opened from the saved list: it says so, and offers to forget it. */
  reopened: boolean;
  /** Saved on this device now. */
  kept: boolean;
  packet: PortraitPacket;
  stages: PortraitStages;
  teachings: PortraitStatus["teachings"];
  cards: MajorCard[];
  onSave: () => void;
  onForget: () => void;
  onSay: (text: string) => void;
}) {
  const k = PORTRAIT_COPY[locale].keeping;
  const [busy, setBusy] = useState(false);

  async function download() {
    if (busy) return;
    setBusy(true);
    try {
      const urls = exportImages(packet, cards) as string[];
      const pairs = await Promise.all(urls.map(async (url) => [url, await inline(url)] as const));
      const images = Object.fromEntries(pairs.filter((p): p is readonly [string, string] => Boolean(p[1])));
      const html = buildExport({ locale, packet, stages, teachings, cards, images });
      const href = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = href;
      link.download = fileName(stages.a?.title ?? "");
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 60_000);
      onSay(k.downloaded);
    } catch {
      onSay(k.downloadFailed);
    } finally {
      setBusy(false);
    }
  }

  const stamped = reopened && kept;
  return (
    <section className={styles.keep} aria-labelledby="portrait-keeping-title">
      <div className={styles.keepHead}>
        <h2 id="portrait-keeping-title" className={styles.kicker}>{k.title}</h2>
        {stages.a?.title && <p className={styles.keepTitle}>{stages.a.title}</p>}
      </div>
      <div className={styles.tools}>
        {/* Reopened from the saved list: a statement, not a button, and the way to forget it. */}
        {stamped && (
          <div className={styles.stampRow}>
            <p className={styles.stamp}><span className={styles.tick} aria-hidden="true" />{k.savedHere}</p>
            <button type="button" className={`${styles.text} ${styles.soft}`} data-keep-forget="" onClick={onForget}>{k.forget}</button>
          </div>
        )}
        <div className={styles.actions}>
          {!stamped && (
            // Saved, it keeps its place, its width and its focus: the same button, now reading «Saved».
            // Both labels share one cell, so the row does not move; the one not shown is hidden from everyone.
            <button type="button" className={`${styles.save} ${styles.swap}`} data-keep-save="" data-done={kept || undefined} aria-disabled={kept || undefined}
              onClick={() => { if (!kept) onSave(); }}>
              <span className={styles.label} data-off={kept || undefined}>{k.save}</span>
              <span className={styles.label} data-off={!kept || undefined}><span className={styles.tick} aria-hidden="true" />{k.saved}</span>
            </button>
          )}
          <button type="button" className={styles.text} aria-busy={busy || undefined} onClick={download}>{busy ? k.downloading : k.download}</button>
          <button type="button" className={styles.text} onClick={() => window.print()}>{k.print}</button>
        </div>
        <p className={styles.note}>{k.note}</p>
      </div>
    </section>
  );
}
