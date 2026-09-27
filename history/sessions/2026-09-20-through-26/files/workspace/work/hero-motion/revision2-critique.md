# Revision 2 — an encounter with the deck

The lapis artwork is the strongest existing asset. The failure is that the current study presents it as a software demonstration: fixed marketing text on the left, a formation selector across the right, and a conspicuous native scrubber below. The user's narrower preview exposes the actual bug: the right half of the main object is lost while the left half of the stage stays largely empty.

## The three changes that matter most

1. **Compose in the actual viewport.** Do not keep `x=2.1...2.5` and only branch at `w<700`. At aspect 1.1 those values place the subject far to the right. Give each shot a screen-space focal point and projected height. Add `compact = w/h < 1.25` even when the pane is wider than 700px. Lead cards must fit the safe frame; only deliberately designated foreground fragments may be cropped.
2. **Replace formations with five photographic shots.** The fan, accordion, and ribbon all read as a card row with changing spacing. Keep the camera moving through depth, give each shot only one or two large readable faces, and allow most of the 22-card population to be occluded, edge-on, distant, or outside the frame. A moving crowd is not automatically an immersive space.
3. **Remove the test-panel composition.** OLIVIA should be a deliberate light typographic presence in the first and last shots, then disappear. The full paragraph and CTA must not occupy the same rectangle through every shot. Hide the long gold range input until interaction or place it in an unobtrusive expandable control; retain a 1px progress line and a small pause control. Remove “A study in movement · 01” from the principal visual field. Show the film first and its controls second.

## Coordinate system and responsive fitting

The table below specifies normalized screen centers `(sx,sy)`, desired projected height `H` as a fraction of viewport height, world depth `z`, and Euler rotation `(rx,ry,rz)` in radians. It works with the current card size 1.1667 × 2 and the current camera at `cameraZ=10.4`, vertical FOV 38°.

Convert anchors to world positions at the selected depth before applying the card rotation:

```js
const viewHeight = 2 * (cameraZ - z) * Math.tan(19 * Math.PI / 180);
const viewWidth = viewHeight * aspect;
x = (sx - .5) * viewWidth;
y = (.5 - sy) * viewHeight;
scale = H * viewHeight / 2;
```

The height estimate is exact for a front-facing sheet. After rotation, project all four corners and apply a small common fit adjustment. **Safe frame for the lead:** x=.08... .92, y=.12... .87. Fit the whole main stack/envelope, not only its center. For clusters, use their combined projected bounds. The native study controls live below y=.93 and should never overlap the artwork.

Wide layout is aspect >=1.25. Compact landscape/square is .8...1.25. Portrait is <.8. Test at **1100×1000**, **900×900**, **1440×1000**, and **390×844**; a width-only mobile test misses the user's actual pane.

## Five shots, one continuous trajectory

Use settled key poses at p=0, .23, .46, .70, 1. Each should look intentional as a still image. Hold each resolved image for roughly 10–15% of its interval, with the larger camera/card movement in the middle. Maintain velocity continuity, but do not make every card arrive on an identical beat.

### 1. The held object — p=0 to .13

One compressed deck, dominant and quiet. The Moon is the front face. It must read immediately, with enough true side thickness to register as a deck. No fan silhouette at rest.

- Wide lead center **(.65,.49)**; compact center **(.61,.49)**; H=.67, z=1.5, rotation `(-.10,-.26,-.10)`.
- Compact H=.61. Portrait center **(.52,.46)**, H=.54.
- All remaining cards stay behind the lead with local depth pitch .018–.022 and less than .003 lateral drift per layer. Do not spread them diagonally like a hand of playing cards.
- Large ivory OLIVIA sits behind the object across x=.035... .96, top=.13; opacity around .70, not the current unreadable .14. The deck overlaps only the end of the word. No further line of oversized typography behind the card field.
- Short headline at x=.055,y=.66, width .34 on wide screens; compact x=.055,y=.72,width .40, with maximum font size 44px. On portrait place it below the deck at y=.78, 28–31px.
- First motion: the top face lifts forward .15 world units, then two cards quietly shear apart. The word and copy fade by p=.17. The initial image is not continuously wobbling.

This gives the user a clear object before asking them to follow it.

### 2. The aperture — p=.23

Two unequal banks open to reveal a tall empty passage. This replaces both the full fan and the accordion.

- Left near bank center **(.19,.57)**, H=.72, z=2.8, rotation `(.08,.72,-.27)`. Its outer 15–20% may be deliberately cropped at the left edge.
- Right far bank center **(.77,.39)**, H=.51, z=-1.6, rotation `(-.12,-.55,.21)`.
- Nine cards form the left bank, twelve the right, with the Moon temporarily occupying the rear of the left bank. Each bank uses a short spread of at most 24° total; do not expose 21 individual strips at once.
- Clear central void x=.37... .61, y=.22... .78. The camera travels through this opening, slightly left of its center.
- At most three faces are readable. Other cards show a thin edge or the back design; that contrast makes the faces valuable.
- A small italic “Look closer.” can sit at **(.47,.47)** and leave before the camera reaches it. No heading/paragraph/CTA block.
- Compact mode moves the banks inward to centers (.17,.59) and (.80,.33), with H=.62 and .43. It keeps the central passage open rather than making the full composition wider.

The banks are staggered in depth by more than four world units. The change of scale must come from perspective as well as size interpolation.

### 3. Three presences — p=.46

An asymmetric triangular composition with large areas of unoccupied lapis around it. This replaces the all-22-cards constellation screenshot.

- Moon, principal: center **(.68,.47)**, H=.59, z=2.0, rotation `(-.07,-.20,-.07)`.
- Second face: center **(.27,.31)**, H=.31, z=-1.4, rotation `(.17,.48,.16)`.
- Third face: center **(.32,.75)**, H=.25, z=-3.0, rotation `(-.14,-.35,-.19)`.
- Only four distant supporting cards: **(.08,.57)** H=.13; **(.48,.10)** H=.11; **(.89,.78)** H=.16; **(.89,.18)** H=.10. At least two show their backs.
- Remaining cards are held farther back, edge-on, behind the three principal objects, or outside the frame. They still exist and preserve the continuous choreography.
- Compact: principal center (.64,.46), H=.53; second (.19,.23), H=.25; third (.25,.77), H=.22. Supporting cards move toward corners, not into another top and bottom row.
- One sentence at x=.055,y=.49,max-width=.30: “More than one / way to see.” It should not compete in scale with the Moon.

The principal card is roughly four times the height of a distant card. The current field varies mostly between medium and small, which makes it look like an inventory.

### 4. The crossing — p=.70

A single oblique path travels **through depth** from a cropped lower-left foreground object to a small upper-right vanishing point. It is not a horizontal sine-wave row.

Authored visual anchors for eight visible representatives:

| Screen center | H | z | Facing |
|---|---:|---:|---|
| (-.025,.85) | .90 | 3.6 | Mostly back; deliberately cropped |
| (.24,.70) | .48 | 1.2 | Face, ry=-.45 |
| (.40,.53) | .31 | -1.2 | Thin three-quarter edge, ry=.95 |
| (.54,.39) | .23 | -3.0 | Face, ry=.22 |
| (.65,.29) | .17 | -4.5 | Back |
| (.74,.23) | .13 | -5.8 | Face, ry=-.38 |
| (.81,.20) | .095 | -7.0 | Back |
| (.86,.185) | .072 | -8.0 | Edge |

Interleave the other fourteen cards between these stations, mostly edge-on or naturally hidden by nearer ones. Keep their path smooth in 3D, but do not give them the exact same rotation as the path tangent. The varying attitudes are restrained: rz about −.20... .22, independent of where the path curves.

The camera moves across the path from its left side to its right. The foreground card clears the lens; the distant cards should show actual parallax, not merely scale changes. Leave the lower-right quadrant almost empty. Put a single short line there if needed. No OLIVIA background word in this shot.

In the square pane, shorten the screen-space path to end at (.84,.21). Do not crop the far half of the path just to retain wide-desktop world coordinates.

### 5. The invitation — p=1

The Moon returns as one approachable object after the spatial journey. The frame becomes still enough to read and act.

- Lead center wide **(.66,.48)**, compact **(.62,.45)**, H=.66/.59, z=2.1, rotation `(-.055,-.13,-.065)`.
- Four visible echoes only: top-left (.35,.14), H=.16, z=-4; right-edge (.96,.36), H=.24, z=-2; bottom-right (.82,.90), H=.18, z=-5; bottom-left (.25,.88), H=.12, z=-6. Show two as backs and two as near edges. These are fragments of the space, not an evenly spaced orbit.
- Other cards recede into a dark, tightly overlapped diagonal group behind the lead. Do not park them in a row along the top and bottom.
- Bring back OLIVIA at a lower opacity around .25, either high in the background or cropped across the very top. Return the concise headline and CTA at left; keep the deck wholly within its safe frame.
- In compact mode the CTA occupies x=.055... .39, y=.73... .86. Portrait: lead center(.53,.41),H=.53, text y=.75.

## Material and depth discipline

Keep the real lapis-and-ivory artwork. Do not cover it with new illustrations, glows, stars, a cosmic particle layer, or gold diagram lines. Its existing details already provide those associations.

The background should remain lapis but have more depth: a near-black blue base such as #070c23, with one very broad, weak lifted region behind the active subject around #14223d. The current uniform purple-blue field makes every card look pasted onto a flat surface.

The shader's current `.87 + .16*diffuse` lighting range makes card orientation almost irrelevant. Permit a broader but restrained face-light range, roughly .62...1.02, with a cool fill, so a turning card visibly changes illumination. Avoid darkening the lead artwork itself. Distant cards can lose 20–35% contrast and saturation; do not blur every card or make them transparent.

Do not bend a rigid card into a floppy banner. At most use a shallow bend around .025–.045 for a close physical bow. Card positions can describe a curved path while each card remains nearly rigid. The current accordion bend/twist is not adding value at the screenshot scale.

Only promote a card to 50–65vh if its source texture can support that scale. The current atlas tiles are roughly 254×437, while the Moon has a separate high-resolution image. Keep atlas-only faces around 25–32vh until larger source images are available. A blurred giant secondary face would undo the composition improvement.

## What must be visible in the next proof

- Opening and ending lead objects wholly fit a 1100×1000 pane.
- Five still frames look different without reading their labels.
- No frame presents 22 equal-priority front faces.
- At least one transition contains a real near object passing the camera and a far object staying nearly still.
- The study no longer looks like a slider-controlled formation test when opened.
