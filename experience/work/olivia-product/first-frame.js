import {createMasthead} from './mobile-masthead.js';
import {HELD_ART} from './held-art.js';

/**
 * Inlined at the top of the page and run before the first paint. A phone gets
 * its own composition and masthead from the first frame, instead of the desktop
 * layout until the app bundle arrives. mobile-experience.js adopts both.
 * build.py bundles this file and runs firstFrame(), then holdSectionArt() on phones.
 */
export function firstFrame(doc = document, win = window) {
 if (!win.matchMedia?.('(max-width:700px)').matches) return false;
 const body = doc.body;
 body.classList.add('mobile-experience');
 if (!body.dataset.view) body.dataset.view = 'home';
 body.dataset.mobileImmersive = 'true';
 if (!doc.querySelector('header.mobile-masthead')) {
  const header = createMasthead(doc, doc.documentElement.lang.startsWith('uk') ? 'uk' : 'en');
  // The masthead joins the opening once; later views must not replay it.
  header.dataset.arrival = 'true';
  header.addEventListener('animationend', () => delete header.dataset.arrival, {once: true});
  body.append(header);
 }
 return true;
}

/**
 * Phones: card art in the homepage sections waits until the visitor scrolls,
 * then loads as its section comes within a screen of view. The sections start
 * right below the opening, inside the distance at which browsers fetch lazy
 * images anyway, so those full-size cards (and the full card back, where phones
 * use a smaller one) would otherwise download during the arrival. Code that
 * assigns section art uses showArt() (held-art.js), which leaves a held image
 * waiting.
 */
export function holdSectionArt(doc = document, win = window) {
 const held = new Set();
 const hold = img => {
  if (!img.matches('img[data-home-art]') || img.dataset.heldSrc !== undefined) return;
  img.dataset.heldSrc = img.getAttribute('src') || '';
  img.src = HELD_ART;
  held.add(img);
 };
 // Runs before the lazy loader measures anything: the parser's task ends first.
 const parsing = new win.MutationObserver(records => {
  for (const record of records) for (const node of record.addedNodes) {
   if (node.nodeType !== 1) continue;
   if (node.tagName === 'IMG') hold(node);
   else node.querySelectorAll('img[data-home-art]').forEach(hold);
  }
 });
 parsing.observe(doc.documentElement, {childList: true, subtree: true});
 doc.addEventListener('DOMContentLoaded', () => {
  parsing.disconnect();
  if (!held.size) return;
  const release = img => {
   const src = img.dataset.heldSrc;
   delete img.dataset.heldSrc;
   // Another card may have been shown meanwhile; only the placeholder gives way.
   if (src && img.getAttribute('src') === HELD_ART) img.src = src;
  };
  const approach = () => {
   if (!('IntersectionObserver' in win)) { held.forEach(release); return; }
   // Watch each image's section: Chrome reports no intersection for images
   // inside the 3D sample card or the horizontal practice carousel.
   const sections = new Map();
   for (const img of held) {
    const section = img.closest('section') || img;
    sections.set(section, [...(sections.get(section) || []), img]);
   }
   const near = new win.IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) { near.unobserve(entry.target); sections.get(entry.target).forEach(release); }
   }, {rootMargin: '0px 0px 100% 0px'});
   sections.forEach((_, section) => near.observe(section));
  };
  win.addEventListener('scroll', approach, {once: true, passive: true});
 }, {once: true});
}
