"use client";

/**
 * Read the image: the card with a numbered pin on every described element,
 * and a lens that settles on whichever element the reader is looking at —
 * the entry at the reading line (just below the card on phones, a little
 * under the middle of the screen on wider layouts), a hovered entry, or a
 * pressed pin. Any further scrolling hands the lens back to the reading line.
 */

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./card-leaf.module.css";

export interface PlateSymbol {
  key: string;
  x: number;
  y: number;
  name: string;
  seen: string;
  meaning: string;
  /** Accessible name for the pin, e.g. "3. The gold star". */
  pinLabel: string;
  trail?: { href: string; label: string };
}

interface Labels {
  seen: string;
  meaning: string;
  list: string;
}

const SCROLL_KEYS = new Set([" ", "PageUp", "PageDown", "ArrowUp", "ArrowDown", "Home", "End"]);

export default function SymbolPlate({
  image,
  alt,
  symbols,
  labels,
}: {
  image: string;
  alt: string;
  symbols: PlateSymbol[];
  labels: Labels;
}) {
  const [active, setActive] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const figure = useRef<HTMLElement | null>(null);
  const shown = pinned ?? active;

  // Follow the reader: pick the entry that crosses the reading line, measured live each frame.
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const nodes = items.current;
      if (!nodes.length) return;
      const plate = figure.current;
      const stacked = plate ? getComputedStyle(plate).position === "sticky" && plate.getBoundingClientRect().width < window.innerWidth * 0.6 && window.innerWidth <= 800 : false;
      const line = stacked && plate ? plate.getBoundingClientRect().bottom + 48 : window.innerHeight * 0.5;
      let best = -1;
      let bestDistance = Infinity;
      nodes.forEach((node, index) => {
        if (!node) return;
        const box = node.getBoundingClientRect();
        if (box.bottom < 0 || box.top > window.innerHeight) return;
        const distance = box.top <= line && box.bottom >= line ? 0 : Math.min(Math.abs(box.top - line), Math.abs(box.bottom - line));
        if (distance < bestDistance) { bestDistance = distance; best = index; }
      });
      const first = nodes[0]?.getBoundingClientRect();
      const last = nodes[nodes.length - 1]?.getBoundingClientRect();
      // Before the list or after it, nothing is being read.
      if (!first || !last || first.top > window.innerHeight || last.bottom < 0) best = -1;
      setActive(best >= 0 ? best : null);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [symbols.length]);

  // A pressed pin holds the lens until the reader scrolls on.
  useEffect(() => {
    if (pinned === null) return;
    const release = () => setPinned(null);
    const onKey = (event: KeyboardEvent) => { if (SCROLL_KEYS.has(event.key)) release(); };
    window.addEventListener("wheel", release, { passive: true });
    window.addEventListener("touchmove", release, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchmove", release);
      window.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  const choosePin = useCallback((index: number) => {
    const node = items.current[index];
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    node.querySelector<HTMLElement>("h3")?.focus({ preventScroll: true });
    // Set after the scroll starts so its own events do not release the pin.
    requestAnimationFrame(() => setPinned(index));
  }, []);

  const lens = shown === null ? null : symbols[shown];

  return (
    <div className={styles.plateWrap}>
      <figure className={styles.plate} data-lens={lens ? "on" : "off"} ref={figure}>
        <Image src={image} alt={alt} width={896} height={1536} className={styles.plateArt} sizes="(max-width: 800px) 40vw, 420px" />
        <span
          className={styles.lens}
          aria-hidden
          style={lens ? ({ "--lx": lens.x, "--ly": lens.y } as React.CSSProperties) : undefined}
        />
        {symbols.map((symbol, index) => (
          <button
            key={index}
            type="button"
            className={styles.pin}
            data-active={shown === index ? "true" : undefined}
            style={{ left: `${symbol.x}%`, top: `${symbol.y}%` }}
            aria-label={symbol.pinLabel}
            aria-controls={`symbol-${index}`}
            onClick={() => choosePin(index)}
          >
            <span aria-hidden>{index + 1}</span>
          </button>
        ))}
      </figure>

      <ol className={styles.symbolList} aria-label={labels.list}>
        {symbols.map((symbol, index) => (
          <li
            key={index}
            id={`symbol-${index}`}
            data-index={index}
            data-active={shown === index ? "true" : undefined}
            ref={(node) => { items.current[index] = node; }}
            className={styles.symbol}
            onPointerEnter={(event) => { if (event.pointerType === "mouse") setPinned(index); }}
            onPointerLeave={(event) => { if (event.pointerType === "mouse") setPinned(null); }}
          >
            <h3 className={styles.symbolName} tabIndex={-1}>
              <span className={styles.symbolNo} aria-hidden>{String(index + 1).padStart(2, "0")}</span>
              {symbol.name}
            </h3>
            <p className={styles.symbolSeen}><span className={styles.symbolLabel}>{labels.seen}</span>{symbol.seen}</p>
            <p className={styles.symbolMeaning}><span className={styles.symbolLabel}>{labels.meaning}</span>{symbol.meaning}</p>
            {symbol.trail && (
              <a className={styles.symbolTrail} href={symbol.trail.href}>{symbol.trail.label}</a>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
