/**
 * anniversary.ts — Solar Return Recognition
 *
 * Detects if the user's birthday is within 3 days (before or after).
 * When active, returns a configuration for a warm golden-hour nebula shift
 * celebrating their solar return.
 */

import { loadUser } from "./user-store";

export interface SolarReturn {
  active: boolean;
  daysUntil: number;
  nebulaWarmth: number; // 0 = normal, 0.1 = golden hour shift
}

export function getAnniversaryWarmth(birthDate: Date): number {
  const today = new Date();
  const bMonth = birthDate.getMonth();
  const bDay = birthDate.getDate();
  const tMonth = today.getMonth();
  const tDay = today.getDate();
  const diff = Math.abs((tMonth * 30 + tDay) - (bMonth * 30 + bDay));

  if (diff > 3 && diff < 362) return 0;

  return 0.10 * Math.max(0, 1 - diff / 3);
}

/**
 * Check if the user's birthday is within 3 days.
 *
 * Returns null if no user data stored or no birth date available.
 * Otherwise returns a SolarReturn with active=true if within the window.
 */
export function checkSolarReturn(): SolarReturn | null {
  const user = loadUser();
  if (!user?.input) return null;

  const { month, day } = user.input;
  if (!month || !day) return null;

  const now = new Date();
  const currentYear = now.getFullYear();

  // Build this year's birthday date (midnight)
  const birthdayThisYear = new Date(currentYear, month - 1, day);

  // Calculate day difference (in whole days)
  const msPerDay = 86_400_000;
  const nowMidnight = new Date(currentYear, now.getMonth(), now.getDate());
  let diff = Math.round(
    (birthdayThisYear.getTime() - nowMidnight.getTime()) / msPerDay,
  );

  // Handle year boundary: if birthday already passed far back, check next year
  if (diff < -180) {
    const birthdayNextYear = new Date(currentYear + 1, month - 1, day);
    diff = Math.round(
      (birthdayNextYear.getTime() - nowMidnight.getTime()) / msPerDay,
    );
  }
  // If birthday is far in the future (>180 days), check previous year
  if (diff > 180) {
    const birthdayLastYear = new Date(currentYear - 1, month - 1, day);
    diff = Math.round(
      (birthdayLastYear.getTime() - nowMidnight.getTime()) / msPerDay,
    );
  }

  const absDiff = Math.abs(diff);
  const active = absDiff <= 3;
  const nebulaWarmth = getAnniversaryWarmth(
    new Date(currentYear, month - 1, day),
  );

  return {
    active,
    daysUntil: diff,
    nebulaWarmth,
  };
}
