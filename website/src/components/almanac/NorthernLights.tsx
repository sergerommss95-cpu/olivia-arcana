"use client";

/**
 * The night ground — Arrival edition.
 *
 * The aurora shader is retired: the new system stands on flat, printed
 * ultramarine. What remains is a still wash — abyss deepening toward
 * the foot of the page — so the plates and instruments read against a
 * quiet, opaque night. (Component name kept so every mount stays valid.)
 */

export default function NorthernLights() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(120% 90% at 50% -10%, rgba(24,29,122,0.4) 0%, rgba(16,19,77,0.3) 46%, rgba(10,13,56,0.5) 100%)",
      }}
    />
  );
}
