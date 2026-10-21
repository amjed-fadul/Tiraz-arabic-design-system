export type RGB = readonly [number, number, number];

export interface LoomPalette {
  dark: boolean;
  background: RGB;
  warp: RGB;
  ground: RGB;
  inscription: RGB;
  border: RGB;
  shuttle: RGB;
}

export function hexToRgb(hex: string): RGB {
  const value = hex.replace("#", "");
  return [0, 2, 4].map(
    (offset) => parseInt(value.slice(offset, offset + 2), 16) / 255,
  ) as unknown as RGB;
}

const mix = (a: RGB, b: RGB, amount: number): RGB =>
  a.map(
    (value, index) => value + (b[index] - value) * amount,
  ) as unknown as RGB;

/** Night: ivory inscription on a deep band. Day: ink inscription on ivory. */
export function loomPalette(
  theme: "light" | "dark",
  accent: string,
): LoomPalette {
  const tint = hexToRgb(accent);
  if (theme === "dark") {
    const ground = hexToRgb("#1b221e");
    return {
      dark: true,
      background: hexToRgb("#0b0d0c"),
      warp: hexToRgb("#efe7d6"),
      ground,
      inscription: hexToRgb("#f0e8d6"),
      border: mix(tint, ground, 0.18),
      shuttle: tint,
    };
  }
  const ground = hexToRgb("#e9e0cc");
  return {
    dark: false,
    background: hexToRgb("#f5f2ea"),
    warp: hexToRgb("#3a342a"),
    ground,
    inscription: hexToRgb("#1d2621"),
    border: mix(tint, ground, 0.08),
    shuttle: tint,
  };
}
