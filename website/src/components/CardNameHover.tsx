"use client";

/**
 * CardNameHover — wherever the reader points at a tarot card, or moves
 * keyboard focus onto something that shows one, the card's name appears on a
 * small lapis plate just above it. Mounted once, in ClientShell.
 *
 * Nothing per page: delegated pointer and focus listeners find the card art
 * (lib/card-names.js knows the files) in, around or under what was reached.
 * A component may still say more or less on a card's wrapper:
 *   data-card-label="5 · Conscious aim · The Emperor"   the plate's text
 *   data-card-label="off"                                no plate here
 * A card turned face down never names itself: when its back is what faces
 * the reader, there is no plate. Touch has no hover, so it is left alone.
 * The plate is for the eye only (aria-hidden); accessible names stay with
 * each component.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { cardFromSrc, isCardBack } from "@/lib/card-names";
import styles from "./CardNameHover.module.css";

type Found = { anchor: Element; numeral: string; name: string };

/** More art than this under one wrapper is a spread or a list, not a card. */
const MAX_IMGS = 4;
/** Narrower than this, card art is a glyph beside its name, not a card to name. */
const MIN_WIDTH = 24;
/** Card edge to plate (the notch takes about 6 px of it), and the plate's margin inside the window. */
const GAP = 12;
const EDGE = 8;
const LEAVE_MS = 80;
const INTERACTIVE = 'a[href],button,[role="button"],[role="link"],[tabindex]:not([tabindex="-1"])';

const srcOf = (img: HTMLImageElement) => img.currentSrc || img.src;

function localeOf(el: Element): "en" | "uk" {
  const host = el.closest("[lang]");
  const lang = host && host !== document.documentElement ? host.getAttribute("lang")
    : /^\/uk(\/|$)/.test(location.pathname) ? "uk" : document.documentElement.lang;
  return lang?.toLowerCase().startsWith("uk") ? "uk" : "en";
}

/**
 * Whether an image is turned away from the reader: some element on its way up
 * has backface-visibility: hidden and its accumulated 3D turn (through its
 * preserve-3d ancestors) shows its back. Geometry, not hit-testing: in a flip
 * card the hidden face's veil can still be what the pointer hits.
 */
function turnedAway(img: Element): boolean {
  for (let el: Element | null = img; el && el !== document.body; el = el.parentElement) {
    const style = getComputedStyle(el);
    if (style.backfaceVisibility !== "hidden") continue;
    let turn = new DOMMatrix(style.transform === "none" ? undefined : style.transform);
    for (let up = el.parentElement; up; up = up.parentElement) {
      const upStyle = getComputedStyle(up);
      if (upStyle.transformStyle !== "preserve-3d") break;
      if (upStyle.transform !== "none") turn = new DOMMatrix(upStyle.transform).multiply(turn);
    }
    if (turn.m33 < 0) return true;
  }
  return false;
}

const area = (el: Element) => { const r = el.getBoundingClientRect(); return r.width * r.height; };

/**
 * The card shown by, around or under an element, or null. Walks up from it to
 * the nearest wrapper where a card's art faces the reader; a back facing the
 * reader, or more than one card in the wrapper, means no plate.
 */
function resolve(start: Element | null): Found | null {
  const away = new Map<Element, boolean>();
  const shows = (img: HTMLImageElement) => {
    if (!img.getClientRects().length) return false;
    let turned = away.get(img);
    if (turned === undefined) away.set(img, (turned = turnedAway(img)));
    return !turned;
  };
  for (let el = start, depth = 0; el && el !== document.body && depth < 10; el = el.parentElement, depth++) {
    const label = el.getAttribute("data-card-label");
    if (label === "off") return null;
    let imgs: HTMLImageElement[];
    if (el instanceof HTMLImageElement) imgs = [el];
    else {
      const live = el.getElementsByTagName("img");
      if (live[MAX_IMGS]) return null;
      imgs = Array.from(live);
    }
    if (!imgs.length) {
      if (label) return { anchor: el, numeral: "", name: label };
      continue;
    }
    const ids = new Set<number>();
    let face: [HTMLImageElement, NonNullable<ReturnType<typeof cardFromSrc>>] | null = null;
    for (const img of imgs) {
      const src = srcOf(img);
      const card = cardFromSrc(src);
      if (card) { ids.add(card.id); if (!face && shows(img)) face = [img, card]; }
      else if (isCardBack(src) && shows(img)) return null;
    }
    if (ids.size > 1) return null;
    // Nothing of a card faces the reader here (a turned-away face): look wider.
    if (!face) { if (label) return null; continue; }
    const [img, card] = face;
    if (img.getBoundingClientRect().width < MIN_WIDTH) return null;
    // A wrapper much bigger than its card (a section, a text column) is not the
    // card, unless it is the card's own link or button, or it says so.
    if (el !== img && !label && !el.matches(INTERACTIVE) && area(el) > 2.5 * area(img)) return null;
    const text = label ?? el.parentElement?.closest("[data-card-label]")?.getAttribute("data-card-label");
    if (text === "off") return null;
    if (text) return { anchor: img, numeral: "", name: text };
    return { anchor: img, numeral: card.numeral, name: localeOf(img) === "uk" ? card.uk : card.en };
  }
  return null;
}

export default function CardNameHover() {
  const plateRef = useRef<HTMLDivElement>(null);
  const hideRef = useRef<() => void>(() => {});
  const pathname = usePathname();

  useEffect(() => hideRef.current(), [pathname]);

  useEffect(() => {
    const plate = plateRef.current;
    if (!plate) return;
    const numeral = plate.children[0] as HTMLElement;
    const name = plate.children[1] as HTMLElement;
    let current: Element | null = null;
    let source: "pointer" | "focus" | null = null;
    let focused: Element | null = null;
    let dismissed: Element | null = null;
    let timer = 0;

    /** Places the plate on the current card; false when the card is out of the window. */
    const place = () => {
      if (!current) return false;
      const r = current.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return false;
      const w = plate.offsetWidth;
      const h = plate.offsetHeight;
      const cx = r.left + r.width / 2;
      const x = Math.max(EDGE, Math.min(cx - w / 2, vw - EDGE - w));
      let side = "above";
      let y = r.top - GAP - h;
      if (y < EDGE) { side = "below"; y = r.bottom + GAP; }
      if (side === "below" && y + h > vh - EDGE) { side = "inside"; y = Math.max(EDGE, Math.min(r.top + GAP, vh - EDGE - h)); }
      plate.dataset.side = side;
      plate.style.left = `${Math.round(x)}px`;
      plate.style.top = `${Math.round(y)}px`;
      plate.style.setProperty("--notch", `${Math.round(Math.max(14, Math.min(cx - x, w - 14)))}px`);
      return true;
    };

    const show = (found: Found, from: "pointer" | "focus") => {
      if (found.anchor === dismissed) return;
      window.clearTimeout(timer);
      dismissed = null;
      source = from;
      const visible = plate.dataset.state === "on";
      if (found.anchor === current && visible) return;
      current = found.anchor;
      delete plate.dataset.settle;
      numeral.textContent = found.numeral;
      numeral.hidden = !found.numeral;
      name.textContent = found.name;
      if (!place()) { hide(); return; }
      // From hidden, commit the side's starting offset so the plate rises from it;
      // already visible, it moves to the new card at once.
      if (!visible) void plate.offsetWidth;
      plate.dataset.state = "on";
      // Measured in the fallback face while the display serif loads: measure again once it has.
      if (document.fonts?.status === "loading") document.fonts.ready.then(place);
    };

    // A card often lifts as it is hovered: once its motion ends, the plate glides onto where it rests.
    const onSettle = (e: TransitionEvent) => {
      if (!current || plate.dataset.state !== "on" || !(e.target instanceof Element) || !e.target.contains(current)) return;
      plate.dataset.settle = "";
      place();
    };

    const hide = () => {
      window.clearTimeout(timer);
      current = null;
      source = null;
      plate.dataset.state = "off";
    };
    hideRef.current = hide;

    // Scrolling hides the plate. A keyboard-focused card (often scrolled to by
    // its own focus) is named again once the scrolling stops, if it is in view.
    const onScroll = () => {
      if (plate.dataset.state === "on") hide();
      window.clearTimeout(timer);
      if (focused) timer = window.setTimeout(() => {
        const found = focused?.isConnected ? resolve(focused) : null;
        if (found) show(found, "focus");
      }, 150);
    };

    // After the pointer leaves, return to a focused card if there is one.
    const leave = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const found = focused?.isConnected ? resolve(focused) : null;
        if (found) show(found, "focus"); else hide();
      }, LEAVE_MS);
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const found = resolve(e.target as Element);
      if (found) show(found, "pointer");
      else { dismissed = null; if (source === "pointer") leave(); }
    };
    const onOut = (e: PointerEvent) => {
      if (source === "pointer" && !e.relatedTarget) leave();
    };
    const onDown = () => {
      if (source === "pointer") { dismissed = current; hide(); }
    };
    const onFocus = (e: FocusEvent) => {
      const el = e.target as Element;
      const found = el.matches?.(":focus-visible") ? resolve(el) : null;
      focused = found ? el : null;
      if (found) show(found, "focus");
      else if (source === "focus") hide();
    };
    const onBlur = (e: FocusEvent) => {
      if (e.target === focused) focused = null;
      if (source === "focus") leave();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && current) { dismissed = current; hide(); }
    };

    const passive = { passive: true } as const;
    const capture = { passive: true, capture: true } as const;
    document.addEventListener("pointerover", onOver, passive);
    document.addEventListener("pointerout", onOut, passive);
    document.addEventListener("pointerdown", onDown, passive);
    document.addEventListener("focusin", onFocus, passive);
    document.addEventListener("focusout", onBlur, passive);
    document.addEventListener("keydown", onKey, passive);
    document.addEventListener("transitionend", onSettle, passive);
    document.addEventListener("scroll", onScroll, capture);
    window.addEventListener("resize", hide, passive);
    return () => {
      window.clearTimeout(timer);
      hideRef.current = () => {};
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("transitionend", onSettle);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", hide);
    };
  }, []);

  return (
    <div ref={plateRef} className={styles.plate} data-state="off" data-card-plate="" aria-hidden="true">
      <span className={styles.numeral} hidden />
      <span className={styles.name} />
    </div>
  );
}
