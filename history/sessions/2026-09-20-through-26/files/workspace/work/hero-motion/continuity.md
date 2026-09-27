# Hero motion continuity results

Pure extraction of `work/hero-motion/study.js`; source SHA-256 `608642a0948f41460a641520564f37c26079340e4fc3d6bbc588e35a159c478d`. No implementation changes. The camera is fixed within each layout. Extraction uses desktop height 1000px and mobile height 844px.

The nine authored channels (XYZ position, XYZ Euler rotation, scale, bend, twist) are C1 at every inner knot. Shared derivatives and the interval-width factors are implemented correctly. The smooth Euler-to-matrix composition preserves C1; it does not require replacing these limited, unwrapped angles with quaternions. All 176 inner junctions across two layouts have an analytic derivative mismatch below `9 × 10⁻¹⁶`, ordinary floating-point roundoff.

For the unlagged Moon (`i = 0`, card 18), assume uniform preview progress `p = time / 10 seconds`. Speeds below divide world-space center speed by the Moon’s **current unrotated width**, `1.1667 × scale`; they are not projected screen speeds. The JSON also supplies speeds relative to the unscaled card width.

| Inner knot | Time | Desktop derivative left = right, world units / progress | Desktop card widths/s | Mobile card widths/s |
| --- | ---: | --- | ---: | ---: |
| 0.16 | 1.6s | (-4.691176, 0.938235, -1.455882) | 0.396870 | 0.358680 |
| 0.34 | 3.4s | (-6.417142, 2.282588, -2.115385) | 0.694651 | 0.634140 |
| 0.55 | 5.5s | (4.220930, -0.511628, 2.430233) | 0.488094 | 0.512044 |
| 0.77 | 7.7s | (7.272222, -1.100000, 3.055556) | 0.437592 | 0.408199 |

Interior speed is nonzero at these four knots. This is not a constant-speed path; the Moon can slow or reverse between knots as the composition changes. Both endpoint derivatives are zero.

The global lag `qᵢ = p − δᵢ16p²(1−p)²` has `δᵢ ≤ .018`, so `qᵢ′` stays between `0.944574` and `1.055426`. It visits the full `[0,1]` track monotonically. Its delay vanishes only at the endpoints; cards do not resynchronize at internal knots.

| Track bounds | Desktop | Mobile |
| --- | --- | --- |
| x | -3.622955 … 6.434603 | -2.923937 … 2.305994 |
| y | -2.789460 … 2.750704 | -0.587887 … 2.625408 |
| z | -3.658282 … 2.051930 | -3.808282 … 1.901930 |
| scale | 0.537090 … 1.700000 | 0.343737 … 1.141000 |
| bend | -0.129973 … 0.129861 | -0.129973 … 0.129861 |
| twist | -0.049939 … 0.049770 | -0.049939 … 0.049770 |

Bounds were first sampled at 10,001 global progress values per layout (220,022 poses), then checked against exact scalar cubic extrema. Scale stays positive. Position bounds describe **centers**, not deformed mesh extents or guaranteed viewport containment. The scale and center bounds include Hermite overshoot; they are not merely extrema of the key poses.

The updated deformation and ambient math resolves the three earlier findings:

- Ambient gain at line 74 is now cubic smoothstep over progress 0–.16. Its derivative is zero at both boundaries, so the ambient blend is C1 in progress and smooth in time while its clock runs continuously.
- Bend positions at line 37 use branchless polynomials, including at zero bend. Over the actual tracks, the maximum bend angle is `0.075820` radians, below `.08`. The alternating-series error bounds relative to the ideal trigonometric bend are below `1.76 × 10⁻¹⁵` local units for X and `2.09 × 10⁻¹³` for Z. These are analytic truncation bounds, not GPU precision measurements; both the positions and trig normals vary smoothly.
- The sheet normal at line 38 now includes the Y derivative of the twist. For deformed coordinates X/Z, bend angle a and twist angle t, it is proportional to `(-sin(a+t), -twist × (cos(a+t)X + sin(a+t)Z), cos(a+t))`, the cross product of the two analytic surface tangents. The branch depends only on a fixed vertex type, so it introduces no progress threshold.

For short portrait heights below 650px, all mobile Y keys receive a constant extra `+.39`. Extraction at 600px confirms unchanged other channels and unchanged tangents to floating-point precision; the speed table remains valid. The height threshold selects a layout and does not promise an interpolated resize transition. The revised accordion rotation reaches `−1.402024 … 1.404227` radians around Y, including Hermite overshoot; its rotation channels remain C1.

Depth testing at line 93 resolves visibility. It does not prove collision-free paths, nonintersecting surfaces, or a collision-free swept volume. No mesh-intersection proof was performed. C1 here concerns authored channels and geometric deformation within a fixed layout under continuous progress/time; it does not assert smooth pixel derivatives at visibility boundaries or time-domain continuity across arbitrary user-control jumps.

Source line numbers and hash refer to the extracted version; regeneration is needed after any implementation edits.
