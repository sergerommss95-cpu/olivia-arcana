"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/useLocale";
import { openAtlas } from "./voyage";

/** Keep the optional chart, catalog and ephemeris out of the shared opening. */
export default function SkyAtlasAccess() {
  const { locale } = useLocale();
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const uk = locale === "uk";
  const [open, setOpen] = useState(false);
  const [Atlas, setAtlas] = useState<ComponentType | null>(null);
  const [failed, setFailed] = useState(false);
  const openRef = useRef(false);

  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      // An unfinished optional tool must not open over the destination the reader chose.
      openAtlas(false);
    }
  }, [pathname]);

  useEffect(() => {
    let alive = true;
    let loading = false;
    let loaded = false;
    let invoker: HTMLElement | null = null;
    let restoreFrame = 0;
    const load = () => {
      if (loading || loaded) return;
      loading = true;
      setFailed(false);
      void import("./SkyAtlas").then((module) => {
        if (!alive) return;
        loaded = true;
        setAtlas(() => module.default);
      }).catch(() => {
        if (alive) setFailed(true);
      }).finally(() => { loading = false; });
    };
    const onMap = (event: Event) => {
      const want = Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open);
      cancelAnimationFrame(restoreFrame);
      if (want && !openRef.current) invoker = document.activeElement as HTMLElement | null;
      if (!want && openRef.current) {
        restoreFrame = requestAnimationFrame(() => {
          const target = invoker?.isConnected && invoker !== document.body
            ? invoker : document.querySelector<HTMLElement>(".oa-atlas-access");
          target?.focus({ preventScroll: true });
        });
      }
      openRef.current = want;
      setOpen(want);
      if (want) load();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && openRef.current) {
        event.preventDefault();
        openAtlas(false);
        return;
      }
      if (event.code !== "KeyM" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || target?.closest("input, textarea, select")) return;
      event.preventDefault();
      openAtlas(!openRef.current);
    };
    window.addEventListener("oa-sky-map", onMap);
    window.addEventListener("keydown", onKey);
    return () => {
      alive = false;
      cancelAnimationFrame(restoreFrame);
      window.removeEventListener("oa-sky-map", onMap);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return <>
    {open && Atlas && <Atlas />}
    <button type="button" className="oa-atlas-access" aria-haspopup="dialog"
      aria-expanded={open} aria-keyshortcuts="m"
      aria-label={uk ? "Відкрити атлас неба" : "Open the sky atlas"}
      onClick={() => openAtlas(true)}>
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="12" cy="12" r="8"/><ellipse cx="12" cy="12" rx="3.5" ry="8"/><path d="M4 12h16M12 2v20"/>
      </svg>
      {uk ? "Атлас неба" : "Sky atlas"}<kbd aria-hidden="true">M</kbd>
    </button>
    {open && !Atlas && <div className="oa-atlas-loading" role="status">
      {failed ? <><span>{uk ? "Атлас не завантажився." : "The atlas could not load."}</span>
        <button onClick={() => openAtlas(true)}>{uk ? "Повторити" : "Try again"}</button></>
        : (uk ? "Відкриваємо атлас…" : "Opening the atlas…")}
      <button onClick={() => openAtlas(false)}>{uk ? "Скасувати" : "Cancel"}</button>
    </div>}
    <style jsx>{`
      .oa-atlas-access { position:fixed;right:22px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:90;display:flex;align-items:center;gap:9px;min-height:44px;padding:10px 12px;border:1px solid #535873;border-radius:2px;background:#0c1029;color:#f0eadf;font:12px/1.3 var(--font-body),sans-serif;cursor:pointer;transition:border-color 160ms ease,color 160ms ease; }
      .oa-atlas-access:hover { border-color:#e0b768;color:#e0b768; }
      .oa-atlas-access:focus-visible,.oa-atlas-loading button:focus-visible { outline:2px solid #e0b768;outline-offset:4px; }
      kbd { border:1px solid #535873;border-radius:2px;padding:1px 4px;margin-left:8px;font:10px/1.2 var(--font-mono),monospace;color:#b7bce9; }
      .oa-atlas-loading { position:fixed;right:22px;bottom:calc(70px + env(safe-area-inset-bottom,0px));z-index:91;display:flex;align-items:center;gap:12px;max-width:calc(100vw - 44px);padding:12px 14px;border:1px solid #535873;background:#0c1029;color:#f0eadf;font:12px/1.4 var(--font-body),sans-serif; }
      .oa-atlas-loading button { padding:5px 0;border:0;background:none;color:#e0b768;text-decoration:underline;cursor:pointer; }
      @media (hover:none),(pointer:coarse) { kbd { display:none; } }
      @media (max-width:640px) { .oa-atlas-access { right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px)); }.oa-atlas-loading { right:14px;max-width:calc(100vw - 28px); }kbd { display:none; } }
      @media (prefers-reduced-motion:reduce) { .oa-atlas-access { transition:none; } }
      @media print { .oa-atlas-access,.oa-atlas-loading { display:none; } }
    `}</style>
  </>;
}
