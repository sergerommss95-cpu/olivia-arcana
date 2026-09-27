"use client";

import { useEffect } from "react";
import { initInteractivePerimeters } from "@/lib/interactive-perimeter";

/** Identical action affordances on the reading experience and native pages. */
export default function InteractivePerimeters() {
  useEffect(() => initInteractivePerimeters(), []);
  return null;
}
