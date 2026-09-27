# Olivia Arcana — V8 motion references

Research reviewed on 23 September 2026. These primary sources informed the motion principles; their artwork, layouts and code were not copied into Olivia.

## 1. An authored camera path

[Building a Scroll-Driven 3D Gallery Using a Blender Camera Path with Three.js and GSAP](https://tympanus.net/codrops/2026/07/07/building-a-scroll-driven-3d-gallery-using-a-blender-camera-path-with-three-js-and-gsap/) — Gaspard Hedde, 7 July 2026.

The shape of a camera path determines the sequence's rhythm. Objects beside that path establish foreground and background, while a smoothed progress value keeps camera movement continuous. The transferable idea is spatial progression: moving through a composed volume instead of changing arrangements at a fixed viewing distance.

## 2. One coherent motion system

[Reactive Depth: Building a Scroll-Driven 3D Image Tube with React Three Fiber](https://tympanus.net/codrops/2026/02/17/reactive-depth-building-a-scroll-driven-3d-image-tube-with-react-three-fiber/) — Matis Dené, 17 February 2026.

The demonstration coordinates scroll, rotation and interaction through shared motion values. Bounded velocity and damping make the collective form respond smoothly. For Olivia, the relevant principle is that many rigid cards can form one changing spatial structure; the printed artwork need not stretch or deform.

## 3. Continuity and deliberate pacing

[Podium: Building a Website Where Running Becomes Storytelling](https://tympanus.net/codrops/2026/06/23/podium-building-a-website-where-running-becomes-storytelling/) — Julien Sister and Benoît Delorme, 23 June 2026.

This studio case study describes a continuous sequence, with content carrying its own transitions. Deliberate slowness and the removal of competing effects support the subject. For Olivia, this means giving large transformations enough time to register and letting the card artwork remain the focus.

## Original adaptation in V8

Olivia's new sequence uses a camera dolly through an aperture of cards, a helix with 2.4 turns, a ring, and a final convergence around the Moon. There are 32 cards in the landscape composition and 22 in portrait. Depth, occlusion and changes in viewing scale create the spatial effect.

One continuous progress value coordinates the sequence, whether driven by scrolling or the optional 96-second guided journey. The selected Olive Lattice reverse remains in use. Cards stay rigid; no new particle field or ornamental orb has been added.

The source techniques are adapted to the existing native WebGL implementation and Olivia's own artwork. The cited libraries and demonstration assets are not required by the resulting page.
