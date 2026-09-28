// A magnified crop of one card (896 × 1536), centred on a point given in
// percentages, for a square frame; `zoom` is the artwork's width as a multiple
// of the frame's width. Returns CSS background-size and background-position.
const ASPECT = 1536 / 896;

export function loupeBackground({ x, y }, zoom = 3.2) {
  const clamp = (value) => Math.max(0, Math.min(100, value));
  const across = (0.5 - (x / 100) * zoom) / (1 - zoom);
  const down = (0.5 - (y / 100) * zoom * ASPECT) / (1 - zoom * ASPECT);
  return { size: `${Math.round(zoom * 100)}% auto`, position: `${clamp(across * 100).toFixed(1)}% ${clamp(down * 100).toFixed(1)}%` };
}
