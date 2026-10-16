// website/src/components/portrait/sections.ts
/**
 * The reading's sections, as the reading bar and the mini-map know them: an
 * id, the title the bar shows, and the lattice positions the section was read
 * from (the mini-map lights them). A section says so on its own element, by
 * spreading `registerSection(…)` on it; the reader watches every such element
 * cross its reading line, so a section added later (a stage landing) is found
 * the same way.
 */

export type Section = { id: string; title: string; lit: number[] };

/** Marks an element as a section of the reading. Spread the result on the element. */
export function registerSection(id: string, title: string, lit: number[]) {
  return { "data-section": id, "data-section-title": title, "data-section-lit": lit.join(" ") };
}

/** The section an element was registered as. */
export function readSection(el: HTMLElement): Section {
  const lit = (el.dataset.sectionLit ?? "").split(" ").filter(Boolean).map(Number);
  return { id: el.dataset.section ?? "", title: el.dataset.sectionTitle ?? "", lit };
}

export const sameSection = (a: Section, b: Section) => a.id === b.id && a.title === b.title && a.lit.join() === b.lit.join();

/** Scrolls to an element (smoothly unless motion is reduced) and gives it focus. */
export function goTo(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
  target.focus({ preventScroll: true });
}
