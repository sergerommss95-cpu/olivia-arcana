import test from 'node:test';
import assert from 'node:assert/strict';
import { revealMotion } from './spread-motion.js';
import { cardQuadMatrix } from './single-card-flow.js';

const near = (actual, expected, message, tolerance = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} ≠ ${expected}`);

function pose(frame) {
  if (frame.transform === 'none') return { y: 0, turn: 0, lean: 0, scale: 1 };
  const value = (name, unit = '') => {
    const match = frame.transform.match(new RegExp(`${name}\\((-?[\\d.]+)${unit}\\)`));
    assert.ok(match, `Missing ${name} in ${frame.transform}`);
    return Number(match[1]);
  };
  return { y: value('translateY', 'px'), turn: value('rotateY', 'deg'), lean: value('rotateZ', 'deg'), scale: value('scale') };
}

for (const [spreadId, count] of [['clarity3', 3], ['crossroads5', 5], ['compass8', 8]]) {
  test(`${spreadId}: every reveal shows a facing surface and swaps only at the continuous edge`, () => {
    for (let index = 0; index < count; index++) {
      const { close, open } = revealMotion({ spreadId, index });
      assert.deepEqual(pose(close[0]), { y: 0, turn: 0, lean: 0, scale: 1 });
      assert.deepEqual(pose(open.at(-1)), { y: 0, turn: 0, lean: 0, scale: 1 });
      for (const [phase, frames, low, high] of [['back', close, 0, 90], ['front', open, -90, 0]]) {
        assert.equal(frames[0].offset, 0);
        assert.equal(frames.at(-1).offset, 1);
        let previousTurn = low;
        let previousOffset = -1;
        for (const frame of frames) {
          const current = pose(frame);
          assert.ok(current.turn >= low && current.turn <= high, `${phase} must not expose its reverse`);
          assert.ok(current.turn >= previousTurn, `${phase} must not reverse direction`);
          assert.ok(frame.offset > previousOffset, 'Keyframe time must advance');
          previousTurn = current.turn;
          previousOffset = frame.offset;
        }
      }
      const edgeBack = pose(close.at(-1)), edgeFront = pose(open[0]);
      near(edgeBack.turn, 90, 'Back reaches the edge');
      near(edgeFront.turn, -90, 'Front begins at the same edge');
      for (const property of ['y', 'lean', 'scale']) near(edgeBack[property], edgeFront[property], `${property} remains continuous through the face swap`);
      assert.ok(edgeBack.y < 0, 'The card remains lifted through the swap');
      // The angular speed must carry through the midpoint, rather than stop and restart.
      near(edgeBack.turn - pose(close.at(-2)).turn, pose(open[1]).turn - edgeFront.turn, 'Turn speed carries through the midpoint', .002);
    }
  });
}

function applyMatrix(matrix, [x, y]) {
  const match = matrix.match(/^matrix3d\((.*)\)$/);
  assert.ok(match, 'Card placement is a CSS 3D matrix');
  const m = match[1].split(',').map(Number);
  assert.equal(m.length, 16);
  assert.ok(m.every(Number.isFinite));
  const w = m[3] * x + m[7] * y + m[15];
  assert.ok(Math.abs(w) > 1e-8, 'Projected corner must not lie at infinity');
  return [(m[0] * x + m[4] * y + m[12]) / w, (m[1] * x + m[5] * y + m[13]) / w];
}

test('the lifted card maps all four source corners onto its projected deck silhouette', () => {
  const width = 320, height = width * 12 / 7;
  const corners = [[0, 0], [width, 0], [width, height], [0, height]];
  const quads = [
    corners,
    [[60, 110], [220, 110], [220, 110 + height / 2], [60, 110 + height / 2]],
    [[143, 97], [397, 151], [352, 563], [76, 497]],
    [[-42, 212], [181, 146], [218, 483], [-16, 612]],
    [[539, 178], [655, 230], [612, 537], [478, 489]],
  ];
  for (const quad of quads) {
    const matrix = cardQuadMatrix(quad);
    corners.forEach((corner, index) => {
      const projected = applyMatrix(matrix, corner);
      near(projected[0], quad[index][0], `Corner ${index} x`);
      near(projected[1], quad[index][1], `Corner ${index} y`);
    });
  }
});
