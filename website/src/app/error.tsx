"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";

/** A calm, bilingual fallback when a page fails to render. Saved readings live on the device and are unaffected. */
export default function Error({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" style={{ minHeight: "70svh", display: "grid", placeItems: "center", padding: "3rem 1.25rem", background: "#0b192a", color: "#ede4d2", textAlign: "center" }}>
      <div style={{ maxWidth: "34rem", display: "grid", gap: "1.1rem", justifyItems: "center" }}>
        <p style={{ margin: 0, color: "#b69a65", fontSize: ".72rem", letterSpacing: ".24em", textTransform: "uppercase" }}>Olivia Arcana</p>
        <h1 style={{ margin: 0, font: "400 clamp(2rem, 6vw, 2.8rem)/1.1 var(--font-heading, 'Cormorant Garamond'), serif" }}>This page could not open</h1>
        <p style={{ margin: 0, color: "#c6c2b7", lineHeight: 1.7 }}>
          Your saved readings are safe on this device. Try again, or return to the beginning.
        </p>
        <p lang="uk" style={{ margin: 0, color: "#c6c2b7", lineHeight: 1.7 }}>
          Сторінку не вдалося відкрити. Ваші збережені читання залишаються на цьому пристрої.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".8rem", justifyContent: "center", marginTop: ".4rem" }}>
          <button type="button" onClick={() => unstable_retry()} style={{ minHeight: 44, padding: ".6rem 1.2rem", borderRadius: 14, border: "1px solid #ead9b8", background: "linear-gradient(155deg, #f2e5c8, #dccaab)", color: "#183043", font: "600 .85rem var(--font-body, sans-serif)", cursor: "pointer" }}>
            Try again · Спробувати ще раз
          </button>
          <a href="/" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", padding: ".6rem 1.2rem", color: "#ede4d2", font: ".85rem var(--font-body, sans-serif)" }}>
            Back to the beginning
          </a>
        </div>
      </div>
    </main>
  );
}
