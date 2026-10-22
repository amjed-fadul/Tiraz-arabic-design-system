/**
 * A new image is woven in: horizontal rows enter from the right edge, the
 * bottom row first, like weft passing through warp.
 */
export function weftClip(progress: number) {
  if (progress >= 1) return "none";
  const rows = 14;
  const points = ["100% 0%", "100% 100%"];
  for (let row = rows - 1; row >= 0; row--) {
    const start = ((rows - 1 - row) * 0.9) / rows;
    const t = Math.min(1, Math.max(0, progress * 1.9 - start));
    const x = ((1 - t * t * (3 - 2 * t)) * 100).toFixed(2);
    points.push(
      `${x}% ${(((row + 1) / rows) * 100).toFixed(2)}%`,
      `${x}% ${((row / rows) * 100).toFixed(2)}%`,
    );
  }
  return `polygon(${points.join(", ")})`;
}
