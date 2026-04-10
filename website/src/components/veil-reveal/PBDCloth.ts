/**
 * Position-Based Dynamics cloth simulation.
 *
 * Based on Muller 2007 / XPBD Macklin 2016 with:
 *   - Structural constraints (H+V, stiffness 1.0)
 *   - Shear constraints (diagonals, 0.55)
 *   - Bending constraints (skip-one, 0.22)
 *
 * Data layout uses typed arrays for cache efficiency and zero-copy
 * integration with Three.js BufferAttribute.
 */

export class PBDCloth {
  readonly cols: number;
  readonly rows: number;
  readonly width: number;
  readonly height: number;
  readonly n: number;

  readonly positions: Float32Array;
  readonly previous: Float32Array;
  readonly velocities: Float32Array;
  readonly pinned: Uint8Array;

  /** Flat constraint array: [a, b, restLength, stiffness, ...] */
  private readonly cons: Float32Array;
  /** Number of constraints (cons.length / 4) */
  private readonly conLen: number;

  private static readonly SOLVER_ITERATIONS = 10;
  private static readonly DAMPING = 0.94;

  constructor(cols: number, rows: number, width: number, height: number) {
    this.cols = cols;
    this.rows = rows;
    this.width = width;
    this.height = height;
    this.n = cols * rows;

    this.positions = new Float32Array(this.n * 3);
    this.previous = new Float32Array(this.n * 3);
    this.velocities = new Float32Array(this.n * 3);
    this.pinned = new Uint8Array(this.n);

    // Initial flat grid
    const restX = width / (cols - 1);
    const restY = height / (rows - 1);

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const idx3 = (j * cols + i) * 3;
        const x = (i / (cols - 1) - 0.5) * width;
        const y = (0.5 - j / (rows - 1)) * height;
        this.positions[idx3] = x;
        this.positions[idx3 + 1] = y;
        this.positions[idx3 + 2] = 0;
        this.previous[idx3] = x;
        this.previous[idx3 + 1] = y;
        this.previous[idx3 + 2] = 0;
      }
    }

    // Pin the top row
    for (let i = 0; i < cols; i++) this.pinned[i] = 1;

    // Build constraints as a flat array for the hot loop
    const cons: number[] = [];
    const push = (a: number, b: number, rest: number, stiff: number) =>
      cons.push(a, b, rest, stiff);
    const idx = (i: number, j: number) => j * cols + i;
    const restD = Math.hypot(restX, restY);

    // Structural -- horizontal + vertical (highest stiffness)
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        if (i < cols - 1) push(idx(i, j), idx(i + 1, j), restX, 1.0);
        if (j < rows - 1) push(idx(i, j), idx(i, j + 1), restY, 1.0);
      }
    }

    // Shear -- both diagonals of every quad (moderate stiffness)
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        push(idx(i, j), idx(i + 1, j + 1), restD, 0.55);
        push(idx(i + 1, j), idx(i, j + 1), restD, 0.55);
      }
    }

    // Bending -- skip-one along rows and columns (soft, resists fold collapse)
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols - 2; i++) {
        push(idx(i, j), idx(i + 2, j), restX * 2, 0.22);
      }
    }
    for (let j = 0; j < rows - 2; j++) {
      for (let i = 0; i < cols; i++) {
        push(idx(i, j), idx(i, j + 2), restY * 2, 0.22);
      }
    }

    this.conLen = cons.length / 4;
    this.cons = new Float32Array(cons.length);
    this.cons.set(cons);
  }

  /** Apply a uniform force to all unpinned particles. */
  addForce(fx: number, fy: number, fz: number): void {
    const { n, velocities: vs, pinned } = this;
    for (let p = 0; p < n; p++) {
      if (pinned[p]) continue;
      const i = p * 3;
      vs[i] += fx;
      vs[i + 1] += fy;
      vs[i + 2] += fz;
    }
  }

  /** Apply a spherical repulsive/attractive force around a world-space point. */
  applyPointForce(
    cx: number,
    cy: number,
    cz: number,
    strength: number,
    radius: number,
  ): void {
    const { n, positions: ps, velocities: vs, pinned } = this;
    const r2 = radius * radius;
    for (let p = 0; p < n; p++) {
      if (pinned[p]) continue;
      const i = p * 3;
      const dx = ps[i] - cx;
      const dy = ps[i + 1] - cy;
      const dz = ps[i + 2] - cz;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > r2 || d2 < 1e-6) continue;
      const falloff = 1 - d2 / r2;
      const inv = 1 / Math.sqrt(d2);
      vs[i] += dx * inv * falloff * strength;
      vs[i + 1] += dy * inv * falloff * strength;
      vs[i + 2] += dz * inv * falloff * strength;
    }
  }

  /** Advance simulation by dt seconds with given gravity. */
  step(dt: number, gravityY: number): void {
    const { n, positions: ps, previous: prev, velocities: vs, pinned } = this;

    // --- PREDICT (explicit Euler) ---
    for (let p = 0; p < n; p++) {
      if (pinned[p]) continue;
      const i = p * 3;
      vs[i + 1] += gravityY * dt;
      prev[i] = ps[i];
      prev[i + 1] = ps[i + 1];
      prev[i + 2] = ps[i + 2];
      ps[i] += vs[i] * dt;
      ps[i + 1] += vs[i + 1] * dt;
      ps[i + 2] += vs[i + 2] * dt;
    }

    // --- SOLVE CONSTRAINTS (Gauss-Seidel) ---
    const { cons, conLen: L } = this;
    const ITER = PBDCloth.SOLVER_ITERATIONS;
    for (let iter = 0; iter < ITER; iter++) {
      for (let k = 0; k < L; k++) {
        const base = k * 4;
        const a = cons[base] | 0;
        const b = (cons[base + 1]) | 0;
        const rest = cons[base + 2];
        const stiff = cons[base + 3];
        const ai = a * 3;
        const bi = b * 3;
        const dx = ps[bi] - ps[ai];
        const dy = ps[bi + 1] - ps[ai + 1];
        const dz = ps[bi + 2] - ps[ai + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < 1e-7) continue;
        const diff = ((d - rest) / d) * 0.5 * stiff;
        const ox = dx * diff;
        const oy = dy * diff;
        const oz = dz * diff;
        const pa = pinned[a];
        const pb = pinned[b];
        if (!pa) {
          ps[ai] += ox;
          ps[ai + 1] += oy;
          ps[ai + 2] += oz;
        }
        if (!pb) {
          ps[bi] -= ox;
          ps[bi + 1] -= oy;
          ps[bi + 2] -= oz;
        }
      }
    }

    // --- UPDATE VELOCITIES (from position delta) + DAMPING ---
    const damping = PBDCloth.DAMPING;
    const invDt = 1 / dt;
    for (let p = 0; p < n; p++) {
      if (pinned[p]) {
        vs[p * 3] = 0;
        vs[p * 3 + 1] = 0;
        vs[p * 3 + 2] = 0;
        continue;
      }
      const i = p * 3;
      vs[i] = (ps[i] - prev[i]) * invDt * damping;
      vs[i + 1] = (ps[i + 1] - prev[i + 1]) * invDt * damping;
      vs[i + 2] = (ps[i + 2] - prev[i + 2]) * invDt * damping;
    }
  }

  /** Release a single pin by particle index. */
  releasePin(index: number): void {
    this.pinned[index] = 0;
  }

  /** Release all pins. */
  releaseAll(): void {
    for (let i = 0; i < this.n; i++) this.pinned[i] = 0;
  }
}
