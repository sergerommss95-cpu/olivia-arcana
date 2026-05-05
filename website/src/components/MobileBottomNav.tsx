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
import { usePathname } from "next/navigation";
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
  label, icon, href, onClick, active, primary,
}: {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  primary?: boolean;
}) {
  const activeColor = active ? "rgba(245, 242, 225, 1)" : "rgba(196, 185, 228, 0.75)";
  const indicatorColor = active ? "rgba(232, 201, 106, 1)" : "transparent";
  
  const content = (
    <>
      <span style={{ 
        color: primary ? "#d4af37" : activeColor, 
        display: "inline-flex", 
        alignItems: "center",
        transform: primary ? "scale(1.2)" : "none",
        filter: primary ? "drop-shadow(0 0 8px rgba(212,175,55,0.4))" : "none"
      }}>
        {icon}
      </span>
      <span
        style={{
          fontFamily: "var(--font-body, system-ui), sans-serif",
          fontSize: "0.6rem",
          fontWeight: active || primary ? 800 : 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: primary ? "#d4af37" : activeColor,
        }}
      >
        {label}
      </span>
      {active && !primary && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            bottom: "6px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "3px",
            height: "3px",
            borderRadius: "50%",
            background: indicatorColor,
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
    gap: "0.3rem",
    padding: "0.6rem 0.4rem",
    minHeight: "64px",
    textDecoration: "none",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "inherit",
    flex: 1,
    transition: "all 0.3s ease",
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
  const pathname = usePathname();
  const [path, setPath] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflect pathname on mount
    setPath(window.location.pathname.replace(/\/$/, "") || "/");
    const onChange = () => setPath(window.location.pathname.replace(/\/$/, "") || "/");
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, []);

  if (pathname?.startsWith("/oracle")) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] block md:hidden bg-void-black/95 backdrop-blur-xl border-t border-white/5 shadow-[0_-15px_40px_rgba(0,0,0,0.6)]"
      aria-label="Primary"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0)",
      }}
    >
      <div className="flex max-w-[600px] mx-auto items-end">
        <Tab label={t("common_home") || "Home"} icon={<IconHome />} href="/" active={path === "/"} />
        <Tab label={t("nav_daily")} icon={<IconDaily />} href="/daily" active={path.startsWith("/daily")} />
        
        {/* Primary CTA: Ask the Oracle — Center-positioned for thumb reach */}
        <Tab 
          label="Oracle" 
          icon={<span className="text-xl">✦</span>} 
          href="/oracle" 
          primary 
          active={path.startsWith("/oracle")} 
        />
        
        <Tab label={t("nav_academy")} icon={<IconAcademy />} href="/academy" active={path.startsWith("/academy")} />
        
        {profile ? (
          <Tab
            label="You"
            icon={<IconProfile glyph={profile.signGlyph} />}
            href={`/signs/${profile.signSlug}`}
            active={path.startsWith(`/signs/${profile.signSlug}`)}
          />
        ) : (
          <Tab label="Search" icon={<IconSearch />} onClick={openCommandPalette} />
        )}
      </div>
    </nav>
  );
}
