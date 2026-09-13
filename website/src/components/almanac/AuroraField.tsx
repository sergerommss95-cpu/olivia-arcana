"use client";

/**
 * AuroraField — the light the glass refracts.
 *
 * Three slow lobes of cold lapis light drifting behind every surface,
 * so the panes above them have something alive to bend. Pure CSS
 * transforms on a fixed, contained layer: no layout, no per-frame work,
 * paused entirely under reduced motion.
 */

export default function AuroraField() {
  return (
    <div className="lg-aurora" aria-hidden>
      <span />
      <span />
      <span />
    </div>
  );
}
