import { expect, it } from "vitest";
import { accentColors } from "./config";

function luminance(hex: string) {
  const rgb = hex
    .slice(1)
    .match(/../g)!
    .map((channel) => {
      const s = parseInt(channel, 16) / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
it.each(["light", "dark"] as const)(
  "keeps every accent readable for %s actions and links",
  (theme) => {
    expect(Object.keys(accentColors)).toEqual([
      "sage",
      "blue",
      "plum",
      "clay",
      "lime",
      "amber",
      "teal",
      "cyan",
      "indigo",
      "rose",
      "slate",
      "ink",
    ]);
    for (const [name, colors] of Object.entries(accentColors)) {
      expect(
        contrast(colors[theme], theme === "light" ? "#FFFFFF" : "#17241C"),
        `${name} action text`,
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(colors[theme], theme === "light" ? "#FFFFFF" : "#1C221E"),
        `${name} accent text`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  },
);
