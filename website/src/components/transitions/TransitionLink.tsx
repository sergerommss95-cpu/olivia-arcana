"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface TransitionLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/** Native link semantics with intent prefetch, press feedback and direct routing. */
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
    const isExternal = !href.startsWith("/") && !href.startsWith("#") || href.startsWith("//");
    const isAnchor = href.startsWith("#");
    if (!isExternal && !isAnchor) {
      router.prefetch(href);
    }
  }, [href, router]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Don't intercept external links, modifier clicks, or same-page anchors
      const isExternal = !href.startsWith("/") && !href.startsWith("#") || href.startsWith("//");
      const isModified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
      const isAnchor = href.startsWith("#");
      // trailingSlash: true in next.config — '/oracle' vs '/oracle/' must
      // still count as the same page, or the sheet wipes over nothing.
      const norm = (u: string) => (u.length > 1 ? u.replace(/\/+$/, "") : u);
      const isSamePage = norm(href) === norm(window.location.pathname);

      if (e.defaultPrevented || e.button !== 0 || isExternal || isModified || isAnchor || isSamePage) return;

      e.preventDefault();
      onClick?.();

      // The ink dot: the press is acknowledged before anything moves.
      setPressed(true);
      if (pressTimer.current) window.clearTimeout(pressTimer.current);
      pressTimer.current = window.setTimeout(() => setPressed(false), 420);

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
      onFocus={handleMouseEnter}
      className={className}
      style={pressed ? { position: "relative", ...style } : style}
    >
      {children}
      {pressed && <span aria-hidden className="oa-press-ink" />}
    </a>
  );
}
