/* Seven sculptural reliefs, in Fool / Magician / Priestess / Moon / Star / Sun / World order.
   The geometries are already positioned for a 2.5 × 3.8 card whose face is at z=.052.
   Each returned asset is an array of { geometry, materialKey }. Share these geometries.
   No scene, materials, textures, renderer, or external merge helper is required. */
function buildReliefAssets(THREE, mergeGeometry) {
  const Z = 0.052;
  const TAU = Math.PI * 2;
  const collections = [];
  let pieces;

  function part(key, geometry, x = 0, y = 0, z = Z, rx = 0, ry = 0, rz = 0) {
    geometry.rotateX(rx);
    geometry.rotateY(ry);
    geometry.rotateZ(rz);
    geometry.translate(x, y, z);
    pieces[key].push(geometry);
  }
  function ring(x, y, radius, tube, key, z = Z + 0.013, start = 0, sweep = TAU) {
    const segments = Math.max(16, Math.ceil(56 * sweep / TAU));
    part(key, new THREE.TorusGeometry(radius, tube, 5, segments, sweep), x, y, z, 0, 0, start);
  }
  function disk(x, y, radius, depth, key, z = Z + depth / 2, topRadius = radius) {
    part(key, new THREE.CylinderGeometry(topRadius, radius, depth, 40, 1), x, y, z, Math.PI / 2);
  }
  function bead(x, y, radius, key, z = Z + radius * 0.35, sx = 1, sy = 1) {
    const g = new THREE.SphereGeometry(radius, 12, 8);
    g.scale(sx, sy, 0.66);
    part(key, g, x, y, z);
  }
  function line(x, y, length, width, key, angle = 0, z = Z + 0.005, depth = 0.012) {
    part(key, new THREE.BoxGeometry(length, width, depth), x, y, z, 0, 0, angle);
  }
  function slab(x, y, width, height, radius, depth, key, z = Z) {
    const s = new THREE.Shape();
    const l = -width / 2, r = width / 2, b = -height / 2, t = height / 2;
    s.moveTo(l + radius, b);
    s.lineTo(r - radius, b); s.quadraticCurveTo(r, b, r, b + radius);
    s.lineTo(r, t - radius); s.quadraticCurveTo(r, t, r - radius, t);
    s.lineTo(l + radius, t); s.quadraticCurveTo(l, t, l, t - radius);
    s.lineTo(l, b + radius); s.quadraticCurveTo(l, b, l + radius, b);
    const g = new THREE.ExtrudeGeometry(s, {
      depth, steps: 1, curveSegments: 3, bevelEnabled: true,
      bevelThickness: Math.min(depth * 0.22, 0.01), bevelSize: 0.014, bevelSegments: 1
    });
    part(key, g, x, y, z);
  }
  function hollow(x, y, radius, key = 'platinum') {
    // A shallow dark well, a porcelain lip, and a fine metal inner edge.
    disk(x, y, radius, 0.005, 'dark', Z + 0.004);
    ring(x, y, radius, 0.027, 'ivory', Z + 0.026);
    ring(x, y, radius * 0.88, 0.006, key, Z + 0.014);
  }
  function pin(x, y, radius = 0.013, key = 'dark') {
    disk(x, y, radius, 0.006, key, Z + 0.004);
  }
  function merge(parts) {
    // Keep a small local merger so the delivered file has no utility dependency.
    const converted = parts.map(g => g.index ? g.toNonIndexed() : g);
    const total = converted.reduce((sum, g) => sum + g.attributes.position.count, 0);
    const output = new THREE.BufferGeometry();
    for (const [name, size] of [['position', 3], ['normal', 3], ['uv', 2]]) {
      const values = new Float32Array(total * size);
      let offset = 0;
      for (const g of converted) {
        const attr = g.getAttribute(name);
        if (attr) values.set(attr.array, offset);
        offset += g.attributes.position.count * size;
      }
      output.setAttribute(name, new THREE.BufferAttribute(values, size));
    }
    output.computeBoundingBox();
    output.computeBoundingSphere();
    for (let i = 0; i < parts.length; i++) {
      parts[i].dispose();
      if (converted[i] !== parts[i]) converted[i].dispose();
    }
    return output;
  }
  function begin() { pieces = { ivory: [], platinum: [], gold: [], dark: [] }; }
  function finish() {
    collections.push(Object.entries(pieces).filter(([, list]) => list.length)
      .map(([materialKey, list]) => ({ geometry: merge(list), materialKey })));
  }

  // 0 — THE FOOL. An open path, a point beyond it, three quiet interruptions.
  begin();
  ring(-0.15, 0.17, 0.72, 0.038, 'ivory', Z + 0.031, Math.PI * 0.16, Math.PI * 1.11);
  ring(-0.15, 0.17, 0.80, 0.008, 'platinum', Z + 0.016, Math.PI * 0.13, Math.PI * 1.16);
  ring(-0.15, 0.17, 0.58, 0.006, 'dark', Z + 0.004, Math.PI * 0.28, Math.PI * 0.70);
  bead(0.62, 1.06, 0.065, 'gold');
  ring(0.62, 1.06, 0.115, 0.006, 'platinum');
  line(-0.18, -1.10, 1.17, 0.022, 'ivory', -0.13, Z + 0.015, 0.026);
  line(-0.18, -1.10, 1.16, 0.008, 'platinum', -0.13, Z + 0.033, 0.008);
  pin(0.68, -0.47, 0.021); pin(0.49, -0.70, 0.015); pin(0.87, -0.39, 0.012);
  line(-0.77, -0.97, 0.10, 0.008, 'gold', Math.PI / 2, Z + 0.030);
  finish();

  // 1 — THE MAGICIAN. A vertical axis passing through a finely worked aperture.
  begin();
  slab(0, 0.03, 0.12, 2.40, 0.025, 0.030, 'ivory');
  line(0, 0.02, 2.45, 0.009, 'gold', Math.PI / 2, Z + 0.041, 0.009);
  ring(0, 0.22, 0.59, 0.036, 'ivory', Z + 0.034);
  ring(0, 0.22, 0.65, 0.008, 'platinum', Z + 0.022);
  ring(0, 0.22, 0.49, 0.006, 'dark', Z + 0.006);
  bead(0, 1.30, 0.065, 'platinum', Z + 0.031);
  hollow(-0.53, -0.87, 0.21); hollow(0.53, -0.87, 0.21);
  line(-0.53, -1.18, 0.21, 0.008, 'gold');
  line(0.53, -1.18, 0.21, 0.008, 'platinum');
  finish();

  // 2 — THE HIGH PRIESTESS. Two carved columns and a narrow, unbroken threshold.
  begin();
  slab(-0.48, 0.04, 0.35, 2.17, 0.11, 0.070, 'ivory');
  slab(0.48, 0.04, 0.35, 2.17, 0.11, 0.070, 'ivory');
  line(-0.48, 0.02, 1.77, 0.008, 'platinum', Math.PI / 2, Z + 0.084, 0.006);
  line(0.48, 0.02, 1.77, 0.008, 'platinum', Math.PI / 2, Z + 0.084, 0.006);
  slab(0, 0.02, 0.095, 2.02, 0.024, 0.012, 'dark');
  line(0, 0.03, 1.90, 0.009, 'gold', Math.PI / 2, Z + 0.020, 0.007);
  ring(-0.48, 1.25, 0.14, 0.008, 'platinum');
  ring(0.48, 1.25, 0.14, 0.008, 'platinum');
  bead(0, 1.27, 0.032, 'gold');
  line(0, -1.25, 1.73, 0.011, 'platinum');
  line(0, -1.34, 1.23, 0.006, 'dark');
  finish();

  // 3 — THE MOON. Offset wells, a porcelain lens, and a broken horizon.
  begin();
  hollow(-0.24, 0.42, 0.57);
  hollow(0.33, -0.17, 0.44, 'gold');
  ring(-0.24, 0.42, 0.66, 0.007, 'platinum', Z + 0.015, 0.25, Math.PI * 1.58);
  disk(0.12, 0.03, 0.25, 0.070, 'ivory', Z + 0.058, 0.19);
  ring(0.12, 0.03, 0.23, 0.014, 'platinum', Z + 0.087);
  disk(0.12, 0.03, 0.125, 0.016, 'ivory', Z + 0.104, 0.11);
  bead(0.70, 1.13, 0.036, 'gold');
  line(-0.39, -1.14, 0.86, 0.010, 'platinum', -0.07);
  line(0.57, -1.21, 0.44, 0.010, 'platinum', -0.07);
  pin(0.23, -1.17, 0.014, 'gold');
  finish();

  // 4 — THE STAR. A central relief and seven deliberately irregular distant points.
  begin();
  disk(-0.04, 0.12, 0.23, 0.060, 'ivory', Z + 0.029, 0.18);
  ring(-0.04, 0.12, 0.27, 0.007, 'platinum', Z + 0.014);
  bead(-0.04, 0.12, 0.061, 'gold', Z + 0.079);
  // Four long and four short tapered rays, flattened against the porcelain face.
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    const inner = 0.34, outer = i % 2 === 0 ? 0.78 : 0.58;
    const len = outer - inner, r = (outer + inner) / 2;
    line(-0.04 + Math.cos(angle) * r, 0.12 + Math.sin(angle) * r,
      len, i % 2 === 0 ? 0.016 : 0.009, i % 2 === 0 ? 'platinum' : 'ivory', angle,
      Z + (i % 2 === 0 ? 0.015 : 0.025), 0.014);
  }
  for (const [x, y, r] of [[-.77,1.02,.026],[.78,.88,.019],[.86,-.37,.022],[-.80,-.29,.015],[-.52,-1.11,.021],[.41,-1.19,.019],[.05,1.30,.014]]) {
    pin(x, y, r);
    ring(x, y, r * 1.9, 0.004, 'platinum', Z + 0.010);
  }
  line(-0.04, 0.12, 1.66, 0.007, 'platinum', 0.28, Z + 0.012);
  finish();

  // 5 — THE SUN. The hero: low porcelain relief, nested metal circles, unequal rays.
  begin();
  const sx = -0.07, sy = 0.23;
  disk(sx, sy, 0.56, 0.060, 'ivory', Z + 0.033, 0.51);
  ring(sx, sy, 0.54, 0.025, 'ivory', Z + 0.060);
  ring(sx, sy, 0.64, 0.008, 'platinum', Z + 0.020);
  ring(sx, sy, 0.69, 0.0045, 'dark', Z + 0.006);
  ring(sx + 0.075, sy - 0.045, 0.405, 0.012, 'gold', Z + 0.077);
  ring(sx + 0.075, sy - 0.045, 0.355, 0.006, 'dark', Z + 0.068);
  disk(sx - 0.065, sy + 0.07, 0.215, 0.040, 'ivory', Z + 0.085, 0.19);
  ring(sx - 0.065, sy + 0.07, 0.225, 0.009, 'platinum', Z + 0.099);
  bead(sx - 0.065, sy + 0.07, 0.055, 'gold', Z + 0.123);
  for (let i = 0; i < 24; i++) {
    const a = i * TAU / 24 + Math.PI / 24;
    const inner = 0.76;
    const outer = i % 3 === 0 ? 1.02 : i % 3 === 1 ? 0.93 : 0.88;
    const r = (inner + outer) / 2;
    line(sx + Math.cos(a) * r, sy + Math.sin(a) * r,
      outer - inner, i % 3 === 0 ? 0.031 : 0.021, 'ivory', a, Z + 0.019, 0.028);
    line(sx + Math.cos(a) * r, sy + Math.sin(a) * r,
      outer - inner - 0.012, 0.006, i % 3 === 0 ? 'gold' : 'platinum', a, Z + 0.035, 0.005);
  }
  line(0.03, -1.22, 1.54, 0.010, 'platinum', 0.075, Z + 0.015);
  line(0.03, -1.34, 0.77, 0.005, 'dark', 0.075);
  pin(-0.91, -1.22, 0.018, 'gold');
  finish();

  // 6 — THE WORLD. A large unfinished boundary and a small inward counterweight.
  begin();
  ring(0.27, -0.21, 0.99, 0.033, 'ivory', Z + 0.028, Math.PI * 0.16, Math.PI * 1.18);
  ring(0.27, -0.21, 1.035, 0.008, 'platinum', Z + 0.018, Math.PI * 0.14, Math.PI * 1.22);
  ring(0.27, -0.21, 0.91, 0.005, 'dark', Z + 0.006, Math.PI * 0.20, Math.PI * 0.85);
  hollow(-0.60, -0.67, 0.265);
  bead(0.10, 0.58, 0.062, 'gold', Z + 0.035);
  ring(0.10, 0.58, 0.135, 0.006, 'platinum');
  line(-0.09, 1.14, 0.70, 0.008, 'platinum', 0.17);
  pin(0.56, -1.30, 0.016, 'gold');
  finish();

  return collections;
}
