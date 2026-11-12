/** WCAG 2.x contrast helpers for #hex, rgb() and rgba() strings. */

export type ContrastLevel = "AAA" | "AA" | "AA large" | "Fails";

function parse(color: string): [number, number, number, number] | undefined {
  const value = color.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3,8})$/.exec(value)?.[1];
  if (hex) {
    const full =
      hex.length === 3 || hex.length === 4
        ? [...hex].map((c) => c + c).join("")
        : hex;
    if (full.length !== 6 && full.length !== 8) return undefined;
    const n = (i: number) => parseInt(full.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), full.length === 8 ? n(6) / 255 : 1];
  }
  const rgb = /^rgba?\(([^)]+)\)$/.exec(value)?.[1];
  if (!rgb) return undefined;
  const parts = rgb
    .replace("/", " ")
    .split(/[\s,]+/)
    .filter(Boolean);
  if (parts.length < 3) return undefined;
  const channel = (part: string) =>
    part.endsWith("%") ? (parseFloat(part) / 100) * 255 : parseFloat(part);
  const alpha = parts[3]
    ? parts[3].endsWith("%")
      ? parseFloat(parts[3]) / 100
      : parseFloat(parts[3])
    : 1;
  const values = [
    channel(parts[0]),
    channel(parts[1]),
    channel(parts[2]),
    alpha,
  ];
  return values.some(Number.isNaN)
    ? undefined
    : (values as [number, number, number, number]);
}

function luminance([r, g, b]: [number, number, number, number]) {
  const lin = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Contrast ratio (1 to 21); NaN when a colour cannot be read. */
export function contrastRatio(a: string, b: string): number {
  const first = parse(a);
  const second = parse(b);
  if (!first || !second) return NaN;
  const [light, dark] = [luminance(first), luminance(second)].sort(
    (x, y) => y - x,
  );
  return (light + 0.05) / (dark + 0.05);
}

export function contrastLevel(ratio: number): ContrastLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA large";
  return "Fails";
}
