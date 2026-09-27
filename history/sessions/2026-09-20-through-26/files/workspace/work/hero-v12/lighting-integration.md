# V12 card construction and lighting

`hero.js` is the authoritative renderer. `lighting.inc.js` records the shadow helper; `new-mesh.inc.js` records the rounded mesh generator. Both are already integrated. Run `python3 work/hero-v12/build.py` from the project root to rebuild the standalone HTML.

The face and shadow programs draw the same closed rounded mesh. Two physical face planes at ±CARD_T/2 join six bevel/side profile rings. Geometry controls the silhouette, so the former fragment discard masks and rectangular perimeter have been removed. A 0.045-unit corner radius and 0.0035-unit bevel stay inside the original 1.1667 × 2 × 0.011 bounding box.

Both faces have outward winding. The source normal's Z sign identifies the positive-Z Olive lattice back and negative-Z tarot front; screen-facing triangle winding no longer selects the artwork. Texture coordinates retain the original proportions. Only front images receive a uniform 1.2% inset on each side; the Sun receives 5.8% to remove a photographed surrounding margin. The approved back receives no extra inset. The original asset files are unchanged.

The fixed key, optional 1024/512 packed shadow map and control/lifecycle foundation are retained from V11. This pass changes card construction and artwork fitting, not choreography. GPU rasterization is checked in the browser; standalone QA uses a mock for lifecycle state and mathematical checks for mesh topology.
