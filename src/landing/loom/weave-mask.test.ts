import { describe, expect, it } from "vitest";
import {
  CELL,
  INSCRIPTION_ROWS,
  WEAVE_ROWS,
  composeWeaveMask,
} from "./weave-mask";

const at = (mask: Uint8Array, cols: number, row: number, col: number) =>
  mask[row * cols + col];

describe("woven band mask", () => {
  it("frames the band with ivory selvedges on both edges", () => {
    const cols = 60;
    const mask = composeWeaveMask(cols, WEAVE_ROWS);
    expect(mask).toHaveLength(cols * WEAVE_ROWS);
    for (const row of [0, 1, WEAVE_ROWS - 2, WEAVE_ROWS - 1])
      for (let col = 0; col < cols; col++)
        expect(at(mask, cols, row, col)).toBe(CELL.text);
  });

  it("mirrors the stepped border motif above and below the inscription", () => {
    const cols = 61;
    const mask = composeWeaveMask(cols, WEAVE_ROWS);
    let border = 0;
    for (let row = 2; row < INSCRIPTION_ROWS[0]; row++)
      for (let col = 0; col < cols; col++) {
        const value = at(mask, cols, row, col);
        if (value === CELL.border) border++;
        expect(value).toBe(at(mask, cols, WEAVE_ROWS - 1 - row, col));
        // The motif is centred, so the band reads the same from both ends.
        expect(value).toBe(at(mask, cols, row, cols - 1 - col));
      }
    expect(border).toBeGreaterThan(cols);
  });

  it("weaves inscription coverage only inside the inscription rows", () => {
    const cols = 40;
    const coverage = new Uint8Array(cols * WEAVE_ROWS).fill(CELL.text);
    const mask = composeWeaveMask(cols, WEAVE_ROWS, coverage);
    const [start, end] = INSCRIPTION_ROWS;
    expect(at(mask, cols, start, 5)).toBe(CELL.text);
    expect(at(mask, cols, end - 1, 5)).toBe(CELL.text);
    expect(at(mask, cols, start - 1, 5)).not.toBe(CELL.text);
    expect(at(mask, cols, end, 5)).not.toBe(CELL.text);
  });

  it("leaves the inscription rows as plain ground when no text is available", () => {
    const cols = 30;
    const mask = composeWeaveMask(cols, WEAVE_ROWS);
    const [start, end] = INSCRIPTION_ROWS;
    for (let row = start; row < end; row++)
      for (let col = 0; col < cols; col++)
        expect(at(mask, cols, row, col)).toBe(CELL.ground);
  });
});
