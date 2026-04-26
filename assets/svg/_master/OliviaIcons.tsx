/**
 * OliviaIcons.tsx — React integration for the Olivia Arcana 16-piece icon system.
 *
 * Usage (Next.js / React / Vite):
 *   import { ZodiacIcon, SuitIcon, type ZodiacSign, type SuitName } from '@/components/OliviaIcons';
 *
 *   <ZodiacIcon sign="taurus" size={64} />
 *   <SuitIcon name="cups" size={128} />
 *
 * Assets: drop the 16 SVG files at `/public/icons/zodiac/*.svg` and
 * `/public/icons/suits/*.svg` in your Next.js project (or equivalent for other
 * frameworks). The component references them via standard `<img>` with public
 * paths. For SSR-heavy setups, use `inline={true}` to inline the raw SVG.
 *
 * Source files:
 *   olivia-arcana/assets/svg/zodiac/v1/<sign>.svg
 *   olivia-arcana/assets/svg/suits/v1/<suit>.svg
 *
 * Animated variants:
 *   olivia-arcana/assets/svg/zodiac-animated/v1/<sign>.svg — ambient SMIL
 *
 * Philosophy: Mystic Cartography (gold-on-navy ornamental, per brain/SVG Protocol.md).
 */

import React from 'react';

export type ZodiacSign =
  | 'aries' | 'taurus' | 'gemini' | 'cancer'
  | 'leo' | 'virgo' | 'libra' | 'scorpio'
  | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export type SuitName = 'cups' | 'wands' | 'swords' | 'pentacles';

export type ZodiacElement = 'fire' | 'earth' | 'air' | 'water';
export type ZodiacQuality = 'cardinal' | 'fixed' | 'mutable';

export const ZODIAC_META: Record<ZodiacSign, {
  symbol: string;
  element: ZodiacElement;
  quality: ZodiacQuality;
  rulingPlanet: string;
  dates: string;
  label: string;
}> = {
  aries:       { symbol: '♈', element: 'fire',  quality: 'cardinal', rulingPlanet: 'Mars',    dates: 'Mar 21 – Apr 19', label: 'Aries' },
  taurus:      { symbol: '♉', element: 'earth', quality: 'fixed',    rulingPlanet: 'Venus',   dates: 'Apr 20 – May 20', label: 'Taurus' },
  gemini:      { symbol: '♊', element: 'air',   quality: 'mutable',  rulingPlanet: 'Mercury', dates: 'May 21 – Jun 20', label: 'Gemini' },
  cancer:      { symbol: '♋', element: 'water', quality: 'cardinal', rulingPlanet: 'Moon',    dates: 'Jun 21 – Jul 22', label: 'Cancer' },
  leo:         { symbol: '♌', element: 'fire',  quality: 'fixed',    rulingPlanet: 'Sun',     dates: 'Jul 23 – Aug 22', label: 'Leo' },
  virgo:       { symbol: '♍', element: 'earth', quality: 'mutable',  rulingPlanet: 'Mercury', dates: 'Aug 23 – Sep 22', label: 'Virgo' },
  libra:       { symbol: '♎', element: 'air',   quality: 'cardinal', rulingPlanet: 'Venus',   dates: 'Sep 23 – Oct 22', label: 'Libra' },
  scorpio:     { symbol: '♏', element: 'water', quality: 'fixed',    rulingPlanet: 'Pluto',   dates: 'Oct 23 – Nov 21', label: 'Scorpio' },
  sagittarius: { symbol: '♐', element: 'fire',  quality: 'mutable',  rulingPlanet: 'Jupiter', dates: 'Nov 22 – Dec 21', label: 'Sagittarius' },
  capricorn:   { symbol: '♑', element: 'earth', quality: 'cardinal', rulingPlanet: 'Saturn',  dates: 'Dec 22 – Jan 19', label: 'Capricorn' },
  aquarius:    { symbol: '♒', element: 'air',   quality: 'fixed',    rulingPlanet: 'Uranus',  dates: 'Jan 20 – Feb 18', label: 'Aquarius' },
  pisces:      { symbol: '♓', element: 'water', quality: 'mutable',  rulingPlanet: 'Neptune', dates: 'Feb 19 – Mar 20', label: 'Pisces' },
};

export const SUIT_META: Record<SuitName, {
  element: ZodiacElement;
  domain: string;
  label: string;
  signs: ZodiacSign[];
}> = {
  cups:      { element: 'water', domain: 'Emotion · Intuition',  label: 'Cups',      signs: ['cancer', 'scorpio', 'pisces'] },
  wands:     { element: 'fire',  domain: 'Will · Creation',      label: 'Wands',     signs: ['aries', 'leo', 'sagittarius'] },
  swords:    { element: 'air',   domain: 'Truth · Intellect',    label: 'Swords',    signs: ['gemini', 'libra', 'aquarius'] },
  pentacles: { element: 'earth', domain: 'Matter · Abundance',   label: 'Pentacles', signs: ['taurus', 'virgo', 'capricorn'] },
};

interface IconBaseProps {
  size?: number | string;
  className?: string;
  alt?: string;
  animated?: boolean;
  inline?: boolean; // reserved for future use — set to true to render inline <svg>
  basePath?: string; // default '/icons' — customize if assets live elsewhere
}

export interface ZodiacIconProps extends IconBaseProps {
  sign: ZodiacSign;
}

export interface SuitIconProps extends IconBaseProps {
  name: SuitName;
}

export const ZodiacIcon: React.FC<ZodiacIconProps> = ({
  sign,
  size = 64,
  className,
  alt,
  animated = false,
  basePath = '/icons',
}) => {
  const folder = animated ? 'zodiac-animated' : 'zodiac';
  const meta = ZODIAC_META[sign];
  return (
    <img
      src={`${basePath}/${folder}/${sign}.svg`}
      alt={alt ?? `${meta.symbol} ${meta.label} — ${meta.element} ${meta.quality}`}
      width={size}
      height={size}
      className={className}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
};

export const SuitIcon: React.FC<SuitIconProps> = ({
  name,
  size = 64,
  className,
  alt,
  basePath = '/icons',
}) => {
  const meta = SUIT_META[name];
  return (
    <img
      src={`${basePath}/suits/${name}.svg`}
      alt={alt ?? `${meta.label} — ${meta.element} suit · ${meta.domain}`}
      width={size}
      height={size}
      className={className}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
};

/**
 * Quick helper: current sun sign from date (approximate, default-era boundaries).
 * Usage: `signForDate(new Date())` → ZodiacSign
 */
export function signForDate(d: Date = new Date()): ZodiacSign {
  const m = d.getMonth() + 1; // 1..12
  const day = d.getDate();
  const ymd = m * 100 + day;
  // Boundaries use conventional Western astrology dates
  if (ymd >= 321 && ymd <= 419) return 'aries';
  if (ymd >= 420 && ymd <= 520) return 'taurus';
  if (ymd >= 521 && ymd <= 620) return 'gemini';
  if (ymd >= 621 && ymd <= 722) return 'cancer';
  if (ymd >= 723 && ymd <= 822) return 'leo';
  if (ymd >= 823 && ymd <= 922) return 'virgo';
  if (ymd >= 923 && ymd <= 1022) return 'libra';
  if (ymd >= 1023 && ymd <= 1121) return 'scorpio';
  if (ymd >= 1122 && ymd <= 1221) return 'sagittarius';
  // capricorn wraps year-end
  if (ymd >= 1222 || ymd <= 119) return 'capricorn';
  if (ymd >= 120 && ymd <= 218) return 'aquarius';
  return 'pisces'; // 219-320
}

/**
 * Wheel component — renders all 12 zodiac icons in a wheel-of-the-year circular layout.
 * Useful as a landing-page hero, "pick your sign" UI, or footer decoration.
 */
export interface ZodiacWheelProps {
  size?: number;
  iconSize?: number;
  onSignClick?: (sign: ZodiacSign) => void;
  highlightedSign?: ZodiacSign;
  animated?: boolean;
  basePath?: string;
  className?: string;
}

const SIGNS_IN_ORDER: ZodiacSign[] = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

export const ZodiacWheel: React.FC<ZodiacWheelProps> = ({
  size = 480,
  iconSize = 80,
  onSignClick,
  highlightedSign,
  animated = false,
  basePath = '/icons',
  className,
}) => {
  const radius = (size - iconSize) / 2;
  const center = size / 2;

  return (
    <div
      className={className}
      style={{ position: 'relative', width: size, height: size }}
      role="group"
      aria-label="Zodiac wheel"
    >
      {SIGNS_IN_ORDER.map((sign, i) => {
        // Start at 12 o'clock (−90°), go clockwise
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x = center + radius * Math.cos(angle) - iconSize / 2;
        const y = center + radius * Math.sin(angle) - iconSize / 2;
        const isHighlighted = highlightedSign === sign;
        return (
          <button
            key={sign}
            onClick={() => onSignClick?.(sign)}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: iconSize,
              height: iconSize,
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: onSignClick ? 'pointer' : 'default',
              opacity: isHighlighted ? 1 : 0.85,
              transform: isHighlighted ? 'scale(1.1)' : 'scale(1)',
              transition: 'opacity 0.2s, transform 0.2s',
            }}
            aria-label={ZODIAC_META[sign].label}
          >
            <ZodiacIcon sign={sign} size={iconSize} animated={animated} basePath={basePath} />
          </button>
        );
      })}
    </div>
  );
};
