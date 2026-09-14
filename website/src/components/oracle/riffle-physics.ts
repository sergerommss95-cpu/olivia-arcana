/** Browse displacement does not count against a later vertical pull. */
export type PullGesture = {
  phase: "browsing" | "pulling";
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  originY: number;
  dy: number;
  candidate: number;
  moved: boolean;
};

export function beginPullGesture(x: number, y: number): PullGesture {
  return { phase: "browsing", startX: x, startY: y, lastX: x, lastY: y, originY: y, dy: 0, candidate: -1, moved: false };
}

export function advancePullGesture(grip: PullGesture, x: number, y: number, nearest: number): PullGesture {
  const dx = x - grip.lastX;
  const dy = y - grip.lastY;
  const next = { ...grip, lastX: x, lastY: y };
  if (Math.abs(x - grip.startX) > 8 || Math.abs(y - grip.startY) > 8) next.moved = true;
  if (grip.phase === "browsing") {
    // Deliberate vertical movement locks the card currently under the hand.
    if (Math.abs(y - grip.originY) > 8 && Math.abs(dy) > Math.abs(dx) * 1.2 && nearest >= 0) {
      next.phase = "pulling";
      next.candidate = nearest;
      next.dy = y - grip.originY;
    } else if (Math.abs(dx) >= Math.abs(dy)) {
      next.originY = y;
    }
  } else {
    next.dy = y - grip.originY;
  }
  return next;
}

/** A pull commits only on release; browser cancellation is never a draw. */
export function finishPullGesture(grip: PullGesture, cancelled: boolean, threshold = 56) {
  return !cancelled && grip.phase === "pulling" && Math.abs(grip.dy) >= threshold && grip.candidate >= 0
    ? { index: grip.candidate, reversed: grip.dy < 0 } : null;
}

/** Semi-implicit integration with bounded substeps stays stable after long frames. */
export function stepFlick(position: number, velocity: number, elapsed: number): [number, number] {
  const duration = Math.max(0, Math.min(0.1, elapsed));
  const steps = Math.max(1, Math.ceil(duration / (1 / 120)));
  const dt = duration / steps;
  for (let i = 0; i < steps; i++) {
    velocity += (-900 * position - 26 * velocity) * dt;
    position += velocity * dt;
  }
  return Math.abs(position) < 0.004 && Math.abs(velocity) < 0.05 ? [0, 0] : [position, velocity];
}
