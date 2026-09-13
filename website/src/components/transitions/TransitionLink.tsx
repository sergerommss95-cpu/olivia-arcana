"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { portFor, flyTo } from "@/components/sky/voyage";

interface TransitionLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * Drop-in <a> replacement that dispatches a custom event
 * to trigger the page transition overlay before navigating.
 *
 * The PageTransition component listens for this event,
 * shows the overlay, waits for the animation, then navigates.
 *
 * On press it drops a gilt ink dot beneath the link — the press is
 * acknowledged in the beat before the veil starts moving. (The dot's
 * keyframes live in PageTransition's global block; reduced motion
 * hides it there, and navigation is instant anyway.)
 */
export default function TransitionLink({
  href,
  children,
  className,
  style,
  onClick,
}: TransitionLinkProps) {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);
  const pressTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (pressTimer.current) window.clearTimeout(pressTimer.current);
    },
    []
  );

  const handleMouseEnter = useCallback(() => {
    // Only prefetch if it's an internal link
    const isExternal = href.startsWith("http") || href.startsWith("//");
    const isAnchor = href.startsWith("#");
    if (!isExternal && !isAnchor) {
      router.prefetch(href);
    }
  }, [href, router]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Don't intercept external links, modifier clicks, or same-page anchors
      const isExternal = href.startsWith("http") || href.startsWith("//");
      const isModified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
      const isAnchor = href.startsWith("#");
      // trailingSlash: true in next.config — '/oracle' vs '/oracle/' must
      // still count as the same page, or the sheet wipes over nothing.
      const norm = (u: string) => (u.length > 1 ? u.replace(/\/+$/, "") : u);
      const isSamePage = norm(href) === norm(window.location.pathname);

      if (isExternal || isModified || isAnchor || isSamePage) return;

      e.preventDefault();
      onClick?.();

      // The ink dot: the press is acknowledged before anything moves.
      setPressed(false); // restart the animation on a rapid second press
      requestAnimationFrame(() => setPressed(true));
      if (pressTimer.current) window.clearTimeout(pressTimer.current);
      pressTimer.current = window.setTimeout(() => setPressed(false), 420);

      // CARTA COELI — if the destination berths at a different
      // constellation, start the sky flight now so it is already under
      // way beneath the page-turn. Concurrent: adds no delay, and the
      // canvas itself honors prefers-reduced-motion (instant jump).
      const fromPort = portFor(norm(window.location.pathname));
      const toPort = portFor(norm(href));
      if (toPort && fromPort !== toPort) {
        flyTo(norm(href));
      }

      // Dispatch transition event — PageTransition will handle the rest
      window.dispatchEvent(
        new CustomEvent("page:transition", { detail: { href } })
      );
    },
    [href, onClick]
  );

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={className}
      style={pressed ? { position: "relative", ...style } : style}
    >
      {children}
      {pressed && <span aria-hidden className="oa-press-ink" />}
    </a>
  );
}
