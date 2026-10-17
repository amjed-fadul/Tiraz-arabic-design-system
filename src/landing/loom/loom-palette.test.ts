import { describe, expect, it } from "vitest";
import { hexToRgb, loomPalette } from "./loom-palette";

const luminance = ([r, g, b]: readonly number[]) =>
  0.2126 * r + 0.7152 * g + 0.0722 * b;

describe("loom palette", () => {
  it("parses six-digit hex colors into unit RGB", () => {
    expect(hexToRgb("#ff8000")).toEqual([1, 128 / 255, 0]);
    expect(hexToRgb("#A5C9B4")).toEqual([165 / 255, 201 / 255, 180 / 255]);
  });

  it("weaves a light inscription on a dark band at night and the reverse by day", () => {
    const night = loomPalette("dark", "#a5c9b4");
    const day = loomPalette("light", "#355e4c");
    expect(luminance(night.inscription)).toBeGreaterThan(
      luminance(night.ground) + 0.5,
    );
    expect(luminance(day.inscription)).toBeLessThan(
      luminance(day.ground) - 0.4,
    );
    expect(luminance(night.background)).toBeLessThan(0.1);
    expect(luminance(day.background)).toBeGreaterThan(0.85);
  });

  it("follows the selected accent for the border and the shuttle", () => {
    const sage = loomPalette("dark", "#a5c9b4");
    const plum = loomPalette("dark", "#d6b6e5");
    expect(plum.border).not.toEqual(sage.border);
    expect(plum.shuttle).toEqual(hexToRgb("#d6b6e5"));
    expect(plum.ground).toEqual(sage.ground);
  });
});
