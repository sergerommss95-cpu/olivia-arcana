/**
 * GlobalBackground.tsx — Shared cosmic background for ALL pages
 *
 * Renders Starfield WebGL canvas globally so every page has the
 * nebula, stars, constellations, and shooting stars.
 * Falls back to dark gradient on non-WebGL devices.
 */

"use client";

import React from "react";
import Starfield from "./Starfield";

export default function GlobalBackground() {
  return <Starfield />;
}
