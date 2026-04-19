/**
 * TimeOfDayTheme.tsx — subtle palette shift driven by the user's local hour
 *
 * The site is a "cosmic almanac" — feeling like a different hour of the day
 * *is* part of the product. We don't replace the palette; we add a warm
 * amber bias at dawn, a quieter slate at mid-day, a violet bias at dusk, and
 * a deep indigo at night. The shift is applied via CSS custom properties on
 * <html data-tod="dawn|day|dusk|night"> so existing components can opt in
 * via var(--tod-accent) without knowing about this component.
 *
 * Updates on mount and every 30 minutes. No scroll / animation cost.
 */

"use client";

import { useEffect } from "react";

type TimeOfDay = "dawn" | "day" | "dusk" | "night";

function resolveTimeOfDay(date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 9) return "dawn";       // 5:00 – 8:59
  if (h >= 9 && h < 17) return "day";       // 9:00 – 16:59
  if (h >= 17 && h < 21) return "dusk";     // 17:00 – 20:59
  return "night";                            // 21:00 – 4:59
}

export default function TimeOfDayTheme() {
  useEffect(() => {
    const apply = () => {
      const tod = resolveTimeOfDay();
      document.documentElement.dataset.tod = tod;
    };
    apply();
    const id = setInterval(apply, 30 * 60 * 1000); // refresh every 30 min
    return () => clearInterval(id);
  }, []);

  return null;
}
