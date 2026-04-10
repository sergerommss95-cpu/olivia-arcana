export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles';
export type Element = 'fire' | 'water' | 'air' | 'earth';
export type Arcana = 'major' | 'minor';
export type CourtRank = 'page' | 'knight' | 'queen' | 'king';

export interface TarotCard {
  id: string;
  number: number | string;
  name: string;
  arcana: Arcana;
  suit?: Suit;
  element?: Element;
  keywords: string[];
  uprightMeaning: string;
  reversedMeaning: string;
  cosmicNote: string;
  imagePath: string;
  generationPrompt: string;
}

export const SUIT_ELEMENTS: Record<Suit, Element> = {
  wands: 'fire',
  cups: 'water',
  swords: 'air',
  pentacles: 'earth',
};

export const SUIT_VISUAL_THEMES: Record<Suit, string> = {
  wands: 'warm plasma-gold light, solar corona energy, fire-pillar motifs, solar flares',
  cups: 'cold lunar light, tidal water, obsidian-glass chalice forms, nebula reflections',
  swords: 'crystalline starlight, cold blue-silver, razor-sharp geometry, cosmic winds',
  pentacles: 'warm earth-tone nebulae, planetary ring structures, mineral formations, gravitational fields',
};

export const PALETTE = {
  voidBlack: '#0A0A1A',
  deepIndigo: '#1A1040',
  cosmicPurple: '#2D1B69',
  cosmicGold: '#C9A96E',
  auroraTeal: '#7EC8C8',
  stellarWhite: '#F0E6FF',
  deepViolet: '#4B0082',
  darkNebula: '#1B0035',
  darkCelestial: '#0D2137',
  solarGold: '#FFD700',
  electricCyan: '#00FFFF',
} as const;
