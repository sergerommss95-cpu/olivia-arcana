# September 14 audio and motion integration

Implemented against upstream `7ba2cfa` while preserving the shared ritual event bus. These files belong to the audio integration lane: `src/components/ParlorLayer.tsx`, `src/lib/ritual-audio.ts`, `src/lib/ritual-audio.test.mjs`, `src/lib/motion.ts`.

## Before → after

- **Mobile first activation race:** the old consent click invoked `unlock`, `resume`, and `droneStart` synchronously. A newly suspended iOS context could reject the drone's scheduling and still display sound on. The engine now returns an awaited readiness result, and the UI displays actual running state. A saved on preference displays **Resume sound** until the visitor activates it in this browser session. No audio context is created on import or page load.
- **Duplicate systems:** the tarot lane removed the independent `AstralAudio` context, separate mute preference/button and direct sound calls. The single `oa-parlor` preference and singleton engine now own oracle cues through `oa-ritual`.
- **Control visibility and reach:** replaced the small oracle-only footnote/mute controls with one 44px button, ivory text on opaque lapis, a visible keyboard focus ring, `aria-pressed`, status feedback on failed activation, and English/Ukrainian labels. The toggle remains available after leaving the oracle while sound is enabled. It sits at bottom left, opposite the existing bottom-right Sky Atlas control.
- **Cancellation:** muting, hiding the tab, pagehide and component disposal invalidate pending activation results. Even if a delayed resume finishes after suspension, the audio engine returns to suspended and refuses to schedule voices. Rapid starts reuse one context; only the latest activation completes.
- **Lifecycle:** page visibility/pagehide pause and stop the drone, visibility/pageshow resume an already unlocked context only, unmount closes it. Reverb sends and completed sound graphs now disconnect. Drone shutdown has no uncancelled delayed timeout, so rapid off/on cannot leave a stale bed alive.
- **Restraint:** removed the unexplained sound after 50 seconds of inactivity. Idle sky facts remain visual, pause while hidden, and decorative idle motion/pointer excitement/haptics respect reduced motion. The fact uses computed Moon illumination and has Ukrainian copy.
- **One motion clock:** synchronized TypeScript duration tokens with the root lane's CSS values: micro .16s, element .36s, reveal .65s, plate .8s, turn .24s. Retained the two existing curves and named motion vocabulary.

## Validation

- `node --test src/lib/ritual-audio.test.mjs`: **6/6 passed**. Delayed mobile resume, single-context reuse, off during resume, competing activation completions, disposal during resume, graph/drone release and browser resume rejection are exercised through a controllable Web Audio test double.
- Focused ESLint: passed for all four files.
- `npx tsc --noEmit`: passed after the integration edits.

## Browser QA still required by root

- Enable sound on `/oracle`, draw/flip cards, mute, and verify only one audible cue/control and no drone after mute.
- Navigate away with sound active and verify the same control remains available; return to the oracle without a second engine.
- Reload with an on preference: button should read Resume sound, with silence until activated.
- Background/foreground the tab, rapidly toggle off/on, and verify correct actual state. Web Audio test doubles cover sequencing but cannot verify real iOS audio-device policy or sound quality.
- At 390px wide, check bottom-left sound control against the full-deck ribbon actions and bottom-right Sky Atlas. Controls have 44px minimum height and distinct sides.
- Repeat with Ukrainian and reduced motion. Haptics should remain silent under reduced motion.

No production deployment performed.
