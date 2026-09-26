"use client";
import { useEffect, useRef, useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { shouldRefreshSubscription, subscriptionRequestId, subscriptionState } from "@/lib/experience-subscription";

declare global { interface Window { oliviaNativeBoot?: HTMLElement; OLIVIA_NATIVE?: boolean; OLIVIA_LOCALE?: "en" | "uk"; } }
export default function NativeExperienceRuntime({scripts, atmosphere, locale}: {scripts: string[]; atmosphere: string; locale: "en" | "uk"}) {
  const {data, isLoading, error, refresh} = useSubscription();
  const lastRequest = useRef<string | null>(null);
  const mounted = useRef(false);
  const refreshPending = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    const origin = location.origin;
    const state = subscriptionState(data, isLoading || refreshing, error || refreshFailed);
    const reply = (requestId: string, response = state) => window.postMessage({
      type: "olivia:subscription:state", requestId, ...response,
    }, origin);
    const listener = (event: MessageEvent) => {
      const requestId = subscriptionRequestId(event, origin, window);
      if (requestId === null) return;
      const repeat = shouldRefreshSubscription(lastRequest.current, requestId, isLoading || refreshPending.current);
      lastRequest.current = requestId;
      if (repeat) {
        // Revoke any earlier client entitlement before a fresh server check.
        refreshPending.current = true;
        setRefreshing(true);
        setRefreshFailed(false);
        reply(requestId, subscriptionState(null, true, null));
        void refresh().catch(() => {
          if (mounted.current) setRefreshFailed(true);
        }).finally(() => {
          refreshPending.current = false;
          if (mounted.current) setRefreshing(false);
        });
      } else {
        reply(requestId, refreshPending.current ? subscriptionState(null, true, null) : state);
      }
    };
    window.addEventListener("message", listener);
    // React publishes the fresh server state before this response. Never reply
    // from a refresh promise with the previous render's paid entitlement.
    if (lastRequest.current !== null) reply(lastRequest.current);
    return () => window.removeEventListener("message", listener);
  }, [data, isLoading, error, refresh, refreshing, refreshFailed]);
  useEffect(() => {
    const host = document.getElementById("native-experience");
    if (!host) return;
    if (window.oliviaNativeBoot) {
      // The original renderer owns document listeners. A new document prevents
      // duplicate WebGL contexts when a Next link returns to the native ritual.
      if (window.oliviaNativeBoot !== host) location.reload();
      return;
    }
    window.oliviaNativeBoot = host;
    window.OLIVIA_NATIVE = true;
    window.OLIVIA_LOCALE = locale;
    document.documentElement.lang = locale;
    document.body.dataset.view = "home";
    const entry = new URLSearchParams(location.search).get("experience");
    if (!location.hash && ["question","journal","spreads","today"].includes(entry || ""))
      history.replaceState(null, "", location.pathname + location.search + "#" + entry);
    let cancelled = false;
    const pendingScripts = new Set<HTMLScriptElement>();
    const active = () => !cancelled && !!host?.isConnected && window.oliviaNativeBoot === host;
    // async=false keeps execution in insertion order while the files download in parallel.
    const load = (src: string) => new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      pendingScripts.add(script);
      script.src = src; script.async = false;
      script.onload = () => { pendingScripts.delete(script); resolve(); };
      script.onerror = () => { pendingScripts.delete(script); reject(new Error("Experience could not load")); };
      document.body.append(script);
    });
    async function boot() {
      if (!active()) return;
      await Promise.all(scripts.map(load));
      if (!active()) return;
      // The living atmosphere needs a working WebGPU adapter. Elsewhere the static
      // palette is the designed fallback, so the 2.5 MB shader bundle is never fetched.
      const canvas = document.getElementById("atmosphere");
      const staticBackground = new URLSearchParams(location.search).get("background") === "static";
      const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
      const adapter = !staticBackground && gpu ? await gpu.requestAdapter().catch(() => null) : null;
      if (!active()) return;
      if (adapter) await load(atmosphere).catch(() => {});
      else if (canvas) { canvas.dataset.state = "fallback"; document.documentElement.classList.add("atmosphere-fallback"); }
    }
    void boot().catch(() => {
      if (cancelled || !host.isConnected) return;
      const status = document.getElementById("native-load-status");
      if (status) { status.hidden = false; status.textContent = locale === "uk"
        ? "Інтерактивне читання не завантажилося. Оновіть сторінку або відкрийте бібліотеку карт."
        : "The interactive reading could not load. Refresh the page or explore the card library."; }
    });
    return () => {
      // Strict Mode rehearses effects while the same host stays connected.
      // Only an actual document removal terminates this boot. Since the
      // preserved renderer owns global listeners, route exits need a new
      // document rather than leaving its listeners attached to another page.
      queueMicrotask(() => {
        if (host.isConnected) return;
        cancelled = true;
        for (const script of pendingScripts) {
          script.onload = null;
          script.onerror = null;
          script.remove();
        }
        pendingScripts.clear();
        if (window.oliviaNativeBoot === host) location.reload();
      });
    };
  }, [scripts, atmosphere, locale]);
  return null;
}
