/**
 * The Moon at a given phase, drawn rather than pictured: an ivory disc with
 * its seas where they are (as seen from the northern hemisphere), the unlit
 * part in lapis with a trace of earthshine, and a soft halo.
 */

import { useId } from "react";
import styles from "./astrology.module.css";

/** The lit part of the Moon as seen from the northern hemisphere; `angle` is the Sun–Moon elongation, 0–360. */
export function moonPath(angle: number, r = 46, c = 50): string {
  const waxing = angle < 180;
  const rx = Math.abs(Math.cos((angle * Math.PI) / 180)) * r;
  const crescent = waxing ? angle < 90 : angle > 270;
  const limb = waxing ? 1 : 0;
  const terminator = waxing ? (crescent ? 0 : 1) : crescent ? 1 : 0;
  return `M ${c} ${c - r} A ${r} ${r} 0 0 ${limb} ${c} ${c + r} A ${rx} ${r} 0 0 ${terminator} ${c} ${c - r} Z`;
}

// The larger maria on a 200-unit face: [cx, cy, rx, ry, rotation]
const SEAS: [number, number, number, number, number][] = [
  [70, 64, 24, 17, -15], // Imbrium
  [98, 40, 34, 5, 0], // Frigoris
  [114, 68, 13, 12, 0], // Serenitatis
  [124, 92, 17, 12, 20], // Tranquillitatis
  [154, 76, 9, 7, 0], // Crisium
  [142, 114, 9, 15, 10], // Fecunditatis
  [126, 124, 7, 7, 0], // Nectaris
  [50, 104, 21, 34, 10], // Procellarum
  [88, 140, 15, 10, -10], // Nubium
  [60, 138, 8, 8, 0], // Humorum
  [96, 102, 10, 9, 0], // Insularum
];

export default function MoonDisc({ angle, label, className }: { angle: number | null; label: string; className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="-40 -40 280 280" className={`${styles.moonArt} ${className ?? ""}`} {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}>
      <defs>
        <radialGradient id={`${uid}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0.6" stopColor="#ede4d2" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ede4d2" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-lit`} cx="42%" cy="36%" r="70%">
          <stop offset="0" stopColor="#fbf5e6" />
          <stop offset="0.6" stopColor="#ebdfc4" />
          <stop offset="1" stopColor="#c7b690" />
        </radialGradient>
        <radialGradient id={`${uid}-dark`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#12293f" />
          <stop offset="1" stopColor="#0a1a2b" />
        </radialGradient>
        <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.4" /></filter>
        <filter id={`${uid}-seas`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" /></filter>
        <clipPath id={`${uid}-litClip`}><path d={moonPath(angle ?? 180, 88, 100)} /></clipPath>
      </defs>
      {angle !== null && <circle cx="100" cy="100" r="138" fill={`url(#${uid}-halo)`} opacity={0.35 + 0.65 * (1 - Math.abs(Math.cos((angle * Math.PI) / 360)))} />}
      <circle cx="100" cy="100" r="88" fill={`url(#${uid}-dark)`} />
      <g opacity="0.07" filter={`url(#${uid}-soft)`} fill="#ede4d2">{SEAS.map(([x, y, rx, ry, rot], i) => <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${rot} ${x} ${y})`} />)}</g>
      {angle !== null && (
        <g clipPath={`url(#${uid}-litClip)`}>
          <circle cx="100" cy="100" r="88" fill={`url(#${uid}-lit)`} />
          <g opacity="0.2" filter={`url(#${uid}-seas)`} fill="#9a8d70">{SEAS.map(([x, y, rx, ry, rot], i) => <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${rot} ${x} ${y})`} />)}</g>
          <circle cx="92" cy="164" r="2.6" fill="#fffaf0" opacity="0.8" />
          <circle cx="78" cy="118" r="1.8" fill="#fffaf0" opacity="0.6" />
        </g>
      )}
      <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(216, 196, 156, 0.35)" strokeWidth="0.8" />
    </svg>
  );
}
