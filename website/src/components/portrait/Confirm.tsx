"use client";

/**
 * A question asked before something is lost: a native modal dialog, so the
 * page behind is inert. It opens on its safest choice; Tab and Shift+Tab stay
 * among its buttons; Esc, a click outside, or the quiet choice leaves things
 * as they were and returns focus to what opened it.
 */

import { useEffect, useId, useLayoutEffect, useRef } from "react";
import styles from "./keep.module.css";

export type Choice = { label: string; onChoose: () => void; tone: "primary" | "plain" | "quiet"; first?: boolean };

export default function Confirm({ title, body, choices, onCancel }: {
  title: string;
  body: string;
  /** In order; the one marked `first` takes focus as the dialog opens. */
  choices: Choice[];
  /** Esc, a click on the backdrop: nothing happens. */
  onCancel: () => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const box = dialog.current;
    if (!box) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    box.showModal();
    box.querySelector<HTMLElement>("[data-first]")?.focus();
    return () => {
      if (box.open) box.close();
      // Back to what opened it, unless the choice took the reader elsewhere.
      const at = document.activeElement;
      if (opener?.isConnected && (!at || at === document.body || box.contains(at))) opener.focus({ preventScroll: true });
    };
  }, []);

  // Tab wraps among the choices: the page behind is inert, and focus never leaves for the browser's own controls.
  useEffect(() => {
    const box = dialog.current;
    if (!box) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = [...box.querySelectorAll<HTMLElement>("button")];
      if (!items.length) return;
      const at = items.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (at <= 0 ? items.length - 1 : at - 1) : (at === -1 || at === items.length - 1 ? 0 : at + 1);
      e.preventDefault();
      items[next].focus();
    };
    box.addEventListener("keydown", onKey);
    return () => box.removeEventListener("keydown", onKey);
  }, []);

  const button = (c: Choice) => (
    // A quiet choice is set in capitals; it is named in sentence case.
    <button key={c.label} type="button" className={styles[c.tone]} aria-label={c.tone === "quiet" ? c.label : undefined} data-first={c.first || undefined} onClick={c.onChoose}>{c.label}</button>
  );

  return (
    <dialog ref={dialog} className={styles.confirm} role="alertdialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-body`}
      onCancel={(e) => { e.preventDefault(); onCancel(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className={styles.confirmInner}>
        <p className={styles.fleuron} aria-hidden="true">❦</p>
        <h2 id={`${id}-title`} className={styles.confirmTitle}>{title}</h2>
        <p id={`${id}-body`} className={styles.confirmBody}>{body}</p>
        {/* The quiet choice (leave things as they are) sits on its own line beneath; Tab still meets them in order. */}
        <div className={styles.confirmChoices}>
          {choices.filter((c) => c.tone !== "quiet").map(button)}
        </div>
        {choices.some((c) => c.tone === "quiet") && <div className={styles.confirmQuiet}>{choices.filter((c) => c.tone === "quiet").map(button)}</div>}
      </div>
    </dialog>
  );
}
