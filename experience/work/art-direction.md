# Olivia Arcana: a photographed object, then an impossible unfolding

The current opening still reads as a pale rectangle rotated over a poster. Its plane is close to the screen plane, its side band is a uniform extrusion, and nothing receives its shadow. The thin border and small centered symbol reinforce the impression of a stationery mockup. The typography, deck, and two bottom captions occupy independent rectangles instead of belonging to a single composed photograph. A richer face image will improve the object, but the camera and contact must change at the same time.

## Commit to a tabletop hero

Photograph the compressed deck lying on a black surface from a high three-quarter angle. The camera supplies the perspective; the deck has only a restrained eight-degree yaw. The surface has no horizon, pedestal, plinth, or decorative geometry. It is simply where this object rests. The deck occupies the right half and overlaps the large word as an actual volume, with a continuous soft contact shadow tying its lower layers to the surface.

Use these exact initial values (tested by projecting the eight extreme corners):

```js
camera.fov = 26;
camera.position.set(0, 13, 9.5);
camera.lookAt(0, .3, 0);
camera.updateProjectionMatrix();

const heroScale = 1.28;
const deckBase = new THREE.Vector3(2.22, 0, .15);
const heroQ = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(-Math.PI / 2, 0, -.14)
);

// First thin the physical body: depth .011, bevelThickness .002, translation z=.037.
// Its resulting range is z=.035...050; the printed face remains at z=.052.
// The .021 pitch gives every physical card a .006 separation, with no intersections.
for (let i = 0; i < 22; i++) {
  const layer = new THREE.Vector3(0, 0, (21 - i) * .021 - .035);
  cards[i].position.copy(layer.multiplyScalar(heroScale).applyQuaternion(heroQ).add(deckBase));
  cards[i].quaternion.copy(heroQ);
  cards[i].scale.setScalar(heroScale);
}
```

At 1440 × 1000 this gives a complete-object envelope of **x 53–87% and y 23–86%**. The visible face is foreshortened by perspective rather than skewed through an exaggerated screen-space rotation. The total stack has about .59 world units of real height, making the side band substantial but not brick-like. Keep the top face and all card edges opaque. Avoid a fan offset in the opening: the compressed object must feel precisely made.

Move the rear artwork and foil rim to match that thinner body (rear texture just below z=.035). If a different physical thickness is retained, derive layer spacing from `boundingBox.max.z - boundingBox.min.z + .006` and offset the lowest layer by `-boundingBox.min.z`. Never set layer pitch below the real bevel-to-bevel thickness.

## A real receiving surface, without obscuring the lettering

The canvas sits above the HTML word. An opaque ground would cover that word, so use a shadow-only receiving plane:

```js
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.ShadowMaterial({color: 0x000000, opacity: .30, depthWrite: false})
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -.008;
ground.receiveShadow = true;
```

Keep the key broad and high, at `(-5, 12, -5)`, aimed at `(2, .25, .2)`. It throws a short shadow toward the lower-right of the deck. Give its shadow a restrained soft radius around 4 rather than a hard product cutout. Use the existing environment for the broad reflection and a weaker front-right fill near `(6, 5, 9)` at approximately one quarter of the key intensity. The ivory must keep a visible midtone sidewall; clipping every illuminated face to white destroys the material again.

Set the backdrop to a quiet near-black sweep, for example `linear-gradient(125deg, #111310 8%, #272b23 67%, #181b16 100%)`. The slight lift behind the deck lets the black shadow remain visible. Remove the green circular spotlight shape. Let ground opacity fade only as the cards leave the surface, from progress .14 to .29.

## Recompose the typography around that photograph

Desktop CSS starting values:

```css
.hero-word {
  top: 11%;
  left: 2.6%;
  font-size: 33vw;
  line-height: .77;
  letter-spacing: -.078em;
}
.arcana {
  left: 4.4%;
  top: 48%;
  font-size: 10px;
  letter-spacing: .58em;
}
.hero-bottom {
  left: 4.4%;
  bottom: 18%;
  max-width: 350px;
}
.hero-bottom h2 { font-size: clamp(42px, 3.8vw, 64px); }
.hero-note { display: none; }
.scroll-cue { left: 4.4%; bottom: 7%; }
```

The word becomes one nearly edge-to-edge typographic plane. The photograph interrupts its right half, while its first letters remain unmistakable. Keep the short existing headline at bottom left, followed by its two plain-language lines. Remove the separate lower-right italic slogan: it competes with the object and makes the opening look like a presentation slide. Header and footer should stay very small.

Do not add hover tilt, idle vertical bobbing, or continuously oscillating camera motion to this initial composition. A grounded object remains grounded. Restrict pointer motion in the hero to at most .025 world units of camera parallax, or disable it until the deck lifts. The meaningful motion is the user's first scroll.

## Make the first scroll a physical reveal

Preserve the current normalized spine and later field/celestial poses, but rewrite the opening as a lift from the surface. The contact shadow establishes reality; the subsequent release becomes surprising because that reality existed.

Use these camera/look values at the existing pose times:

| Progress | Camera | Look target | Physical action |
|---|---|---|---|
| 0 | `(0,13,9.5)` | `(0,.3,0)` | Complete compressed deck, in contact with ground. |
| .15 | `(.2,11.0,9.2)` | `(.35,.65,.1)` | Top five cards lift along their shared face normal; the lower seventeen remain a coherent stack. |
| .285 | `(.45,2.2,5.8)` | `(.55,1.1,-3.3)` | Cards have stood into two staggered banks; camera enters the gap between them. |
| .47 | `(.1,.3,-3.2)` | `(.1,.1,-14)` | Arrive at the authored asymmetrical card field. |
| .69 | `(-.1,.1,-7.7)` | `(0,0,-20)` | Existing edge/celestial transition. |
| .925 | `(0,0,-11.6)` | `(0,0,-24)` | Existing Oracle composition. |
| 1 | `(0,0,-11.7)` | `(0,0,-24)` | Settled Oracle and reading action. |

At .15, lift the top five by **.72, .49, .31, .17, .07 units** in world Y beyond their compressed position. Keep their orientation identical. This is one precisely separated object, not a cloud of independently rotating cards. The camera descends enough to see between these real surfaces.

At .285, the two bank centers can be `x = ±3.0`, `y = 1.1 + ((i % 3) - 1) * .22`, `z = -.55*i`, with card Euler `(-.12, side*.48, side*.08)` and scale `1.0`. The gap is wide enough for the camera; the cards remain visible at the frame edges as large tangible planes. Interpolate the original horizontal hero orientation to this upright pose with quaternions. Fade the receiving plane by this point. Use FOV 26 through .15 and ease to the current 35 by .285, updating the projection matrix only when the value changes.

At .47 retain the current distinct field locations rather than rebuilding a symmetric wall. The atlas artwork needs at least one held, readable large face and a few partially cropped supporting faces; distant cards provide depth. Keep four or five deliberate voids. After the detailed card faces have had time to register, let their actual gilded edges create the celestial lines.

## Portrait mobile is the same photograph, recropped

At 390 × 844, retain the same camera and FOV but use deck base `(.10,0,.05)` and scale `.91`. The verified projected envelope is **x 10–91%, y 30–75%**. Put OLIVIA at top 13% with font-size 27vw, ARCANA immediately below, and move the bottom headline to bottom 11.8% at 31–33px so it starts after the object rather than on top of it. On heights below 650px use deck scale `.78` and move its base z to `-.10`; let the copy stay readable instead of forcing the large desktop deck crop.

Mobile should not get a different card pose or a frontal billboard. It needs the same grounded perspective and a tighter crop.

## Texture and geometry must agree

The new atlas can supply the elaborate authored carving that the primitive-generated symbols never achieved. Use one consistent face treatment across the deck. Avoid combining a baked raised motif with a second thick live extrusion of the same motif: the silhouette, shadows, and highlights will disagree. If live relief is retained, use only the very shallow continuous shape or derive its height/normal directly from the atlas. Keep real thickness, bevels, card-to-card gaps, and receiving shadows in geometry. These are the cues the previous diagonal card lacked.

The new opening should be judged first with all copy hidden. It should already read as a carefully lit photograph of a manufactured object on a surface. Then restore the gigantic word and the small copy. That is the point at which the art direction will feel like a redesign rather than another shader adjustment.
