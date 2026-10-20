// The loom's arithmetic for WeaveCanvas. It follows the landing page's weft
// clip: an image is woven in as horizontal rows that enter from one edge, the
// bottom row first, like weft passing through warp.

/** How many rows the loom weaves. */
export const weaveRows = 14;

/**
 * How far each row has come, 0 to 1, when the weave as a whole has come
 * `progress` of the way. Rows run top to bottom. The bottom row starts first
 * and every row above it starts a little later, so the front is a staircase;
 * each row eases in and out.
 */
export function rowFronts(progress: number, rows = weaveRows): number[] {
  const whole = Number.isFinite(progress)
    ? Math.min(1, Math.max(0, progress))
    : 0;
  return Array.from({ length: rows }, (_, row) => {
    const start = ((rows - 1 - row) * 0.9) / rows;
    const t = Math.min(1, Math.max(0, whole * 1.9 - start));
    return t * t * (3 - 2 * t);
  });
}

/**
 * The clip-path that shows `progress` (0 to 1) of an image woven in. Rows
 * reveal from the inline-start edge, the right in RTL and the left in LTR, the
 * bottom row first. The polygon is the area between that edge and the rows'
 * fronts, so at 0 it has no area and at 1 nothing is clipped: "none".
 */
export function weaveClip(
  progress: number,
  direction: "rtl" | "ltr",
  rows = weaveRows,
): string {
  if (progress >= 1) return "none";
  const fronts = rowFronts(progress, rows);
  const rtl = direction === "rtl";
  const edge = rtl ? 100 : 0;
  const points = [`${edge}% 0%`, `${edge}% 100%`];
  for (let row = rows - 1; row >= 0; row--) {
    const x = ((rtl ? 1 - fronts[row] : fronts[row]) * 100).toFixed(2);
    points.push(
      `${x}% ${(((row + 1) / rows) * 100).toFixed(2)}%`,
      `${x}% ${((row / rows) * 100).toFixed(2)}%`,
    );
  }
  return `polygon(${points.join(", ")})`;
}
