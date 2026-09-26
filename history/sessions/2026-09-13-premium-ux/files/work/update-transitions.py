from pathlib import Path
b=Path('work/olivia-arcana/website/src')
p=b/'components/transitions/PageTransition.tsx';s=p.read_text();css=s[s.index('      <style jsx global>'):s.index('      `}</style>')+len('      `}</style>')]
p.write_text('''"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import TransitionOverlay from "./TransitionOverlay";

/** A brief turn of the leaf. Routing starts on press; content never waits for motion. */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [turning, setTurning] = useState(false);
  const routeRef = useRef(pathname);
  const cleanupRef = useRef<(() => void) | null>(null);
  const focusOnArrival = useRef(false);

  useEffect(() => {
    const handleTransition = (event: Event) => {
      const href = (event as CustomEvent<{ href?: string }>).detail?.href;
      if (!href) return;
      let destination: URL;
      try { destination = new URL(href, window.location.href); } catch { return; }
      if (destination.origin !== window.location.origin) return;
      const normalize = (path: string) => path.replace(/\\/+$/, "") || "/";
      if (normalize(destination.pathname) === normalize(window.location.pathname)) {
        router.push(href);
        return;
      }
      cleanupRef.current?.();
      focusOnArrival.current = true;
      setPending(true);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTurning(!reduced);
      // The decorative veil has a bounded lifetime even if a chunk is slow.
      const reveal = window.setTimeout(() => setTurning(false), 240);
      const safety = window.setTimeout(() => {
        setPending(false);
        setTurning(false);
        window.dispatchEvent(new CustomEvent("page:transition-abort"));
      }, 5000);
      cleanupRef.current = () => { window.clearTimeout(reveal); window.clearTimeout(safety); };
      router.push(href);
    };
    window.addEventListener("page:transition", handleTransition);
    return () => {
      window.removeEventListener("page:transition", handleTransition);
      cleanupRef.current?.();
    };
  }, [router]);

  useEffect(() => {
    if (routeRef.current === pathname) return;
    routeRef.current = pathname;
    setPending(false);
    // Preserve Next's page tree and scroll handling. No transformed ancestor
    // around fixed tarot tables, no cached children, no hydration remount.
    if (!focusOnArrival.current) return;
    focusOnArrival.current = false;
    const frame = requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>("main h1, #main-content h1, h1, main, #main-content");
      if (target) {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <>
      <TransitionOverlay isVisible={turning} variant="to-night" />
      <div aria-busy={pending || undefined}>{children}</div>
      <span className="oa-navigation-progress" data-pending={pending} aria-hidden />
''' + css + '''
      <style jsx>{`
        .oa-navigation-progress { position: fixed; z-index: 9991; left: 0; top: 0; width: 100%; height: 2px; background: #e0b768; transform: scaleX(0); transform-origin: left; opacity: 0; transition: transform 240ms ease-out, opacity 160ms; pointer-events: none; }
        .oa-navigation-progress[data-pending="true"] { opacity: 1; transform: scaleX(.72); }
        @media (prefers-reduced-motion: reduce) { .oa-navigation-progress { transition: none; } }
      `}</style>
    </>
  );
}
''')
p=b/'components/transitions/TransitionOverlay.tsx';s=p.read_text().replace('duration: prefersReduced ? 0.18 : 0.55', 'duration: prefersReduced ? 0 : 0.24').replace('duration: 0.55', 'duration: 0.24');s=s.replace('          style={{\n            position: "fixed",', '          aria-hidden="true"\n          style={{\n            position: "fixed",');p.write_text(s)
p=b/'components/ClientShell.tsx';s=p.read_text().replace('import React, { useEffect, useState }','import React, { useEffect }');a=s.index('  // Tier 2 gate');z=s.index('  return (',a);s=s[:a]+s[z:];a=s.index('          {mounted ? (');z=s.index('\n        </div>',a);s=s[:a]+'          <PageTransition>{children}</PageTransition>'+s[z:];p.write_text(s)
p=b/'components/transitions/TransitionLink.tsx';s=p.read_text();s=s.replace('      const isExternal = href.startsWith("http") || href.startsWith("//");', '      const isExternal = !href.startsWith("/") && !href.startsWith("#") || href.startsWith("//");');s=s.replace('    const isExternal = href.startsWith("http") || href.startsWith("//");','    const isExternal = !href.startsWith("/") && !href.startsWith("#") || href.startsWith("//");');s=s.replace('      if (isExternal || isModified || isAnchor || isSamePage) return;', '      if (e.defaultPrevented || e.button !== 0 || isExternal || isModified || isAnchor || isSamePage) return;');s=s.replace('      setPressed(false); // restart the animation on a rapid second press\n      requestAnimationFrame(() => setPressed(true));','      setPressed(true);');s=s.replace('      onMouseEnter={handleMouseEnter}', '      onMouseEnter={handleMouseEnter}\n      onFocus={handleMouseEnter}');p.write_text(s)
