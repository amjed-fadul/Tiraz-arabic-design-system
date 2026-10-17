/**
 * The woven band is a grid of weft cells. Each cell is ground, border motif or
 * inscription. Rows count from the top edge; the loom weaves from the bottom.
 */
export const WEAVE_ROWS = 56;
/** Half-open row range that carries the inscription. */
export const INSCRIPTION_ROWS: readonly [number, number] = [11, 45];
export const CELL = { ground: 0, border: 140, text: 255 } as const;

const MOTIF_ROWS = 7;
const MOTIF_PERIOD = 12;

/** Selvedges, a mirrored stepped-lozenge border and optional inscription coverage. */
export function composeWeaveMask(
  cols: number,
  rows: number,
  inscription?: Uint8Array,
) {
  const mask = new Uint8Array(cols * rows);
  const [start, end] = INSCRIPTION_ROWS;
  if (inscription)
    for (let row = start; row < Math.min(end, rows); row++)
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        if (inscription[index] >= CELL.text) mask[index] = CELL.text;
      }
  const centre = (cols - 1) / 2;
  const motif = (top: number) => {
    for (let col = 0; col < cols; col++) {
      // Distance from the centre keeps the band symmetric from both ends.
      const across = Math.floor(Math.abs(col - centre));
      const d = Math.abs(((across + MOTIF_PERIOD / 2) % MOTIF_PERIOD) - 6);
      for (let k = 0; k < MOTIF_ROWS; k++) {
        const dy = Math.abs(k - 3);
        const on =
          d + dy === 3 || (d === 0 && dy === 0) || (dy === 0 && d >= 5);
        if (on) mask[(top + k) * cols + col] = CELL.border;
      }
    }
  };
  motif(3);
  motif(rows - 3 - MOTIF_ROWS);
  for (const row of [0, 1, rows - 2, rows - 1])
    mask.fill(CELL.text, row * cols, (row + 1) * cols);
  return mask;
}

export interface InscriptionFont {
  family: string;
  weight: number;
}

/**
 * Renders real text with the page font, then snaps its coverage to the weave
 * grid. The Arabic is never drawn by hand, so letterforms stay correct.
 */
export function rasterizeInscription(
  cols: number,
  rows: number,
  text: string,
  font: InscriptionFont,
) {
  const scale = 6;
  const width = cols * scale;
  const height = rows * scale;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  let context: CanvasRenderingContext2D | null = null;
  try {
    context = canvas.getContext("2d", { willReadFrequently: true });
  } catch {
    return undefined;
  }
  if (!context) return undefined;
  const [start, end] = INSCRIPTION_ROWS;
  const setFont = (size: number) =>
    (context.font = `${font.weight} ${size}px ${font.family}`);
  context.fillStyle = "#000";
  context.fillRect(0, 0, width, height);
  context.direction = "rtl";
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.fillStyle = "#fff";
  let size = 100;
  setFont(size);
  let metrics = context.measureText(text);
  const box = (end - start) * scale * 0.98;
  size *=
    box /
    (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent || 1);
  setFont(size);
  metrics = context.measureText(text);
  const maxWidth = width * 0.86;
  if (metrics.width > maxWidth) {
    size *= maxWidth / metrics.width;
    setFont(size);
    metrics = context.measureText(text);
  }
  const glyphHeight =
    metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  const baseline =
    start * scale +
    ((end - start) * scale - glyphHeight) / 2 +
    metrics.actualBoundingBoxAscent;
  context.fillText(text, width / 2, baseline);
  const pixels = context.getImageData(0, 0, width, height).data;
  const coverage = new Uint8Array(cols * rows);
  for (let row = start; row < end; row++)
    for (let col = 0; col < cols; col++) {
      let sum = 0;
      for (let y = 0; y < scale; y++)
        for (let x = 0; x < scale; x++)
          sum += pixels[((row * scale + y) * width + col * scale + x) * 4];
      if (sum / (scale * scale) > 110) coverage[row * cols + col] = CELL.text;
    }
  return coverage;
}
