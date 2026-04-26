/**
 * MobileBottomNav.tsx — Thumb-reachable bottom navigation for mobile
 *
 * The site's fixed top navbar works OK on desktop but on mobile it's
 * far from the thumb. A bottom nav gives first-class reach to the 4
 * core destinations: Home, Daily, Academy, and Search (Cmd+K).
 *
 * Rules:
 *  - Mobile only (display:none on md+).
 *  - Respects safe-area-inset-bottom for notched devices.
 *  - 48px min height per item for tap comfort.
 *  - Active route gets a subtle gold tint + tiny dot indicator.
 *  - Search opens the global command palette instead of navigating.
 */

"use client";

import React, { useEffect, useState } from "react";
import TransitionLink from "@/components/transitions/TransitionLink";
import { openCommandPalette } from "@/components/CommandPalette";
import { useProfile } from "@/lib/user/profile-store";
import { useLocale } from "@/lib/i18n/useLocale";

const IconHome = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
  </svg>
);
const IconDaily = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);
const IconAcademy = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 7l9-4 9 4-9 4-9-4z" />
    <path d="M7 9v5a5 4 0 0 0 10 0V9" />
  </svg>
);
const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);
const IconProfile = ({ glyph }: { glyph: string }) => (
  <span aria-hidden style={{ fontSize: "1.05rem", lineHeight: 1, color: "currentColor" }}>{glyph}</span>
);

function Tab({
  label, icon, href, onClick, active,
}: {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const activeColor = active ? "rgba(232, 201, 106, 0.95)" : "rgba(220, 212, 240, 0.6)";
  const content = (
    <>
      <span style={{ color: activeColor, display: "inline-flex", alignItems: "center" }}>{icon}</span>
      <span
        style={{
          fontFamily: "var(--font-body, system-ui), sans-serif",
          fontSize: "0.56rem",
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: activeColor,
        }}
      >
        {label}
      </span>
      {active && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: "4px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            background: "rgba(232, 201, 106, 0.95)",
            boxShadow: "0 0 8px rgba(232, 201, 106, 0.6)",
          }}
        />
      )}
    </>
  );

  const style: React.CSSProperties = {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.25rem",
    padding: "0.55rem 0.5rem",
    minHeight: "56px",
    textDecoration: "none",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "inherit",
    flex: 1,
  };

  if (href) {
    return (
      <TransitionLink href={href} style={style}>
        {content}
      </TransitionLink>
    );
  }
  return (
    <button type="button" onClick={onClick} style={style} aria-label={label}>
      {content}
    </button>
  );
}

export default function MobileBottomNav() {
  const { profile } = useProfile();
  const { t } = useLocale();
  const [path, setPath] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflect pathname on mount
    setPath(window.location.pathname.replace(/\/$/, "") || "/");
    const onChange = () => setPath(window.location.pathname.replace(/\/$/, "") || "/");
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, []);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 block md:hidden bg-void-black/82 backdrop-blur-2xl saturate-[1.1] border-t border-celestial-gold/18"
      aria-label="Primary"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0)",
      }}
    >
      <div className="flex max-w-[600px] mx-auto">
        <Tab label={t("common_home") || "Home"} icon={<IconHome />} href="/" active={path === "/"} />
        <Tab label={t("nav_daily")} icon={<IconDaily />} href="/daily" active={path.startsWith("/daily")} />
        <Tab label={t("nav_academy")} icon={<IconAcademy />} href="/academy" active={path.startsWith("/academy")} />
        <Tab label={t("search_open")} icon={<IconSearch />} onClick={openCommandPalette} />
        {profile ? (
          <Tab
            label={profile.signName}
            icon={<IconProfile glyph={profile.signGlyph} />}
            href={`/signs/${profile.signSlug}`}
            active={path.startsWith(`/signs/${profile.signSlug}`)}
          />
        ) : (
          <Tab label="Stars" icon={<span aria-hidden style={{ fontSize: "1rem" }}>✦</span>} href="/portrait" active={path.startsWith("/portrait")} />
        )}
      </div>
    </nav>
  );
}
