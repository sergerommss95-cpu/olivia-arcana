"use client";

/**
 * Relief light on one card figure, from the homepage's card-material module (a verbatim copy in ./material).
 * `hostRef` must be the <img>'s immediate wrapper: the module refuses any other container.
 *
 * - Never in the critical path: `pointer: true` loads the module and creates its context only when a pointer
 *   first enters the card; otherwise the module loads after first paint (an idle callback) and the context
 *   is created only by awaken().
 * - At most two WebGL contexts live page-wide (hero plate and card of the day). A further request does
 *   nothing until one is destroyed; a waiting pointer light then mounts by itself.
 * - `pointer: true` lights the carving under a fine pointer only. Otherwise the card stays unlit until
 *   awaken(), whose single 3200ms pass mounts a context for itself and gives it back once the pass fades.
 * - Reduced motion, `enabled: false`, no WebGL or only software WebGL (a major performance caveat: its
 *   context blocks the main thread for seconds) leave the plain artwork; every context is destroyed on unmount.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import type { CardMaterial } from "./material/card-material.js";
import { prefersReducedMotion } from "./useEntry";
// App Router components may import global CSS (Next 16 docs, getting-started/css). It is static rather than
// lazy: twenty lines, and the canvas must already be absolutely positioned whenever it unhides.
import "./material/card-material.css";

type MaterialModule = typeof import("./material/card-material.js");

const LIVE_LIMIT = 2;
/** A pointer-free pass that has not lit within this time is not coming (it normally shows on the next frame). */
const SHOW_DEADLINE = 2500;
/** Ceiling for one pointer-free pass: the 3200ms sweep, its fade and a slow image decode. */
const PASS_CEILING = 12000;
const POINTER_EVENTS = ["pointerenter", "pointermove", "pointerdown"] as const;

let live = 0;
let loading: Promise<MaterialModule> | null = null;
const waiting = new Set<() => void>();

function loadMaterial(): Promise<MaterialModule> {
  // A failed chunk is not cached as a rejection: the next request may try again.
  loading ??= import("./material/card-material.js").catch((error: unknown) => {
    loading = null;
    throw error;
  });
  return loading;
}

let capable: boolean | null = null;
/** Hardware WebGL, probed once per page with a throwaway context (released at once) before any light is created. */
function webglCapable(): boolean {
  if (capable === null) {
    try {
      const probe = document.createElement("canvas").getContext("webgl", { failIfMajorPerformanceCaveat: true });
      // a software rasteriser can still pass the caveat test (a blocklist override): name it from the renderer
      const info = probe?.getExtension("WEBGL_debug_renderer_info");
      const renderer = probe && info ? String(probe.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
      probe?.getExtension("WEBGL_lose_context")?.loseContext();
      capable = !!probe && !/swiftshader|llvmpipe|software/i.test(renderer);
    } catch {
      capable = false;
    }
  }
  return capable;
}

function releaseSlot() {
  live = Math.max(0, live - 1);
  const queue = [...waiting];
  waiting.clear();
  for (const retry of queue) retry();
}

function afterFirstPaint(run: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(run, { timeout: 1500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(run, 200);
  return () => window.clearTimeout(id);
}

function createLight(hostRef: RefObject<HTMLElement | null>, pointer: boolean) {
  // Pointer light needs a precise primary pointer; touch keeps the plain art and its caption.
  const follow = pointer && window.matchMedia("(pointer: fine)").matches;
  let mod: MaterialModule | null = null;
  let material: CardMaterial | null = null;
  let host: HTMLElement | null = null;
  let image: HTMLImageElement | null = null;
  let cleanup: (() => void) | null = null;
  let disposed = false;
  let queued = false;

  const usable = () => !disposed && !prefersReducedMotion() && typeof WebGLRenderingContext !== "undefined";

  function teardown() {
    if (!material) return;
    cleanup?.();
    cleanup = null;
    material.destroy();
    material = host = image = null;
    releaseSlot();
  }

  function mount(): CardMaterial | null {
    const el = hostRef.current;
    const img = el?.querySelector<HTMLImageElement>(":scope > img") ?? null;
    if (!mod || !el || !img || !usable() || !webglCapable()) return null;
    if (live >= LIVE_LIMIT) {
      if (follow) waiting.add(sync);
      return null;
    }
    live++;
    const mounted = mod.mountCardMaterial(el, { image: img });
    material = mounted;
    host = el;
    image = img;
    if (!follow) {
      // The module always follows the pointer. Re-centring after its own listeners (registered first, so
      // they run first) leaves it nothing to follow: only awaken() can light this card.
      const calm = () => mounted.touch(0.5, 0.5, false);
      for (const type of POINTER_EVENTS) el.addEventListener(type, calm, { passive: true });
      cleanup = () => { for (const type of POINTER_EVENTS) el.removeEventListener(type, calm); };
    }
    return mounted;
  }

  /** Keeps the mount on the current host and image, which may appear, change or vanish between renders. */
  function sync() {
    if (disposed) return;
    const el = hostRef.current;
    if (material && (!el || el !== host || !el.isConnected || image?.parentElement !== el)) teardown();
    if (!material && follow) mount();
  }

  function retireAfterPass() {
    // The module hides its canvas once the sweep has faded, or when it is cut short offscreen or in a
    // hidden tab. Then the context and its slot go back, and later hovers cost nothing. A pass that never
    // shows (a failed context, art that never decodes) is given up early rather than holding a slot.
    const canvas = host?.querySelector<HTMLCanvasElement>(":scope > canvas.card-material-light");
    let shown = false;
    const watch = new MutationObserver(() => {
      if (canvas && !canvas.hidden) shown = true;
      else if (shown) teardown();
    });
    if (canvas) watch.observe(canvas, { attributes: true, attributeFilter: ["hidden"] });
    const unshown = window.setTimeout(() => { if (!shown) teardown(); }, SHOW_DEADLINE);
    const ceiling = window.setTimeout(teardown, PASS_CEILING);
    const previous = cleanup;
    cleanup = () => {
      previous?.();
      watch.disconnect();
      window.clearTimeout(unshown);
      window.clearTimeout(ceiling);
    };
  }

  function run() {
    queued = false;
    if (!usable()) return;
    sync();
    if (material) {
      material.awaken();
      return;
    }
    const pass = mount();
    if (!pass) return;
    pass.awaken();
    retireAfterPass();
  }

  const load = () => {
    loadMaterial().then((loaded) => { mod = loaded; sync(); }, () => { /* No light: the art is unchanged. */ });
  };
  // A pointer light costs nothing until a pointer first enters its card; an awaken() light's module waits for idle.
  const entered = follow ? hostRef.current : null;
  entered?.addEventListener("pointerenter", load, { once: true });
  const cancelIdle = usable() && !pointer ? afterFirstPaint(load) : null;

  return {
    sync,
    awaken() {
      if (!usable()) return;
      if (mod) { run(); return; }
      if (queued) return;
      // Called before the module arrived: one queued pass, run as soon as it loads.
      queued = true;
      loadMaterial().then((loaded) => { mod = loaded; if (queued) run(); }, () => { queued = false; });
    },
    dispose() {
      disposed = true;
      queued = false;
      cancelIdle?.();
      entered?.removeEventListener("pointerenter", load);
      waiting.delete(sync);
      teardown();
    },
  };
}

export function useCardLight(
  hostRef: RefObject<HTMLElement | null>,
  { pointer, enabled = true }: { pointer: boolean; enabled?: boolean },
): { awaken: () => void } {
  const light = useRef<ReturnType<typeof createLight> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const current = createLight(hostRef, pointer);
    light.current = current;
    return () => {
      current.dispose();
      if (light.current === current) light.current = null;
    };
  }, [hostRef, pointer, enabled]);

  // After every render: the host or its <img> may have been swapped without the options changing.
  useEffect(() => { light.current?.sync(); });

  const awaken = useCallback(() => { light.current?.awaken(); }, []);
  return useMemo(() => ({ awaken }), [awaken]);
}
