/** Homepage section art that a phone holds until its section is near (first-frame.js). */
export const HELD_ART = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/** Show a card, or give a held image the source it will load when its section is near. */
export function showArt(img, src) {
 if (!img || !src) return;
 if (img.dataset.heldSrc !== undefined) img.dataset.heldSrc = src;
 else img.src = src;
}
