/** Positions of Olivia's three spreads, as the reading experience names them (EN/UK). */
export const SPREAD_POSITIONS = {
  clarity3: [
    { id: "situation", en: "The situation", uk: "Ситуація" },
    { id: "complication", en: "What complicates it", uk: "Що її ускладнює" },
    { id: "next-step", en: "A helpful next step", uk: "Корисний наступний крок" },
  ],
  crossroads5: [
    { id: "heart", en: "At the heart", uk: "У центрі" },
    { id: "path-a", en: "Path A", uk: "Шлях А" },
    { id: "path-b", en: "Path B", uk: "Шлях Б" },
    { id: "overlooked", en: "What to look at again", uk: "На що поглянути ще раз" },
    { id: "next-step", en: "A grounded next step", uk: "Практичний наступний крок" },
  ],
  compass8: [
    { id: "situation", en: "The situation", uk: "Ситуація" },
    { id: "root", en: "At the root", uk: "Біля витоків" },
    { id: "inner", en: "Your perspective", uk: "Ваш погляд" },
    { id: "outer", en: "Outer influences", uk: "Зовнішні впливи" },
    { id: "tension", en: "The tension", uk: "Напруження" },
    { id: "support", en: "What supports you", uk: "Що вас підтримує" },
    { id: "release", en: "What to loosen", uk: "Що можна відпустити" },
    { id: "next-step", en: "Your next step", uk: "Ваш наступний крок" },
  ],
} as const;
export type SpreadId = keyof typeof SPREAD_POSITIONS;
