"use client";

import React, { useCallback } from "react";

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
 */
export default function TransitionLink({
  href,
  children,
  className,
  style,
  onClick,
}: TransitionLinkProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Don't intercept external links, modifier clicks, or same-page anchors
      const isExternal = href.startsWith("http") || href.startsWith("//");
      const isModified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
      const isAnchor = href.startsWith("#");
      const isSamePage = href === window.location.pathname;

      if (isExternal || isModified || isAnchor || isSamePage) return;

      e.preventDefault();
      onClick?.();

      // Dispatch transition event — PageTransition will handle the rest
      window.dispatchEvent(
        new CustomEvent("page:transition", { detail: { href } })
      );
    },
    [href, onClick]
  );

  return (
    <a href={href} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  );
}
