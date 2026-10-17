/* Types for the verbatim card-material.js copy beside this file; the module itself stays untouched. */

/** `reduced` and `enabled` accept a boolean or a function read on every check. */
type Gate = boolean | (() => boolean);

export interface CardMaterial {
  /** Re-reads the artwork and its box; image loads, resizes and src changes already call it. */
  refresh(): void;
  /** A lifecycle gate, not a hover trigger. */
  setActive(next: boolean): void;
  /** Normalised card coordinates; `pressed: false` lets the light fade. */
  touch(x: number, y: number, pressed?: boolean): void;
  /** One 3200ms relief sweep across the pale carving. */
  awaken(): void;
  /** Removes the canvas and listeners and loses the WebGL context. */
  destroy(): void;
}

/** Mount on the artwork's immediate wrapper (`image.parentElement === container`), or get inert no-ops. */
export declare function mountCardMaterial(
  container: HTMLElement | null | undefined,
  options?: {
    image?: HTMLImageElement | null;
    getDeckId?: () => string;
    reduced?: Gate;
    enabled?: Gate;
  },
): CardMaterial;
