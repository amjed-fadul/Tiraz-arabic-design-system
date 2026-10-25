import type { CSSProperties } from "react";
import { accentColors } from "../system/config";
import type { SystemConfig } from "../system/config";

export type BrandColors = Partial<Record<"light" | "dark", string>>;
export function normalizeBrandColors(value: unknown): BrandColors {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: BrandColors = {};
  for (const mode of ["light", "dark"] as const) {
    const color = (value as Record<string, unknown>)[mode];
    if (typeof color !== "string") continue;
    const hex = color.trim();
    if (/^#[\da-f]{6}$/i.test(hex)) result[mode] = hex.toUpperCase();
    else if (/^#[\da-f]{3}$/i.test(hex))
      result[mode] =
        "#" +
        [...hex.slice(1)]
          .map((c) => c + c)
          .join("")
          .toUpperCase();
  }
  return result;
}

/** Choose the higher-contrast opaque black/white foreground for an action fill. */
function actionText(hex: string) {
  const rgb = [1, 3, 5]
    .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  return 1.05 / (luminance + 0.05) > (luminance + 0.05) / 0.05
    ? "#FFFFFF"
    : "#000000";
}

// Move away from the text color, increasing contrast rather than assuming a mode.
function actionHover(hex: string) {
  const lighten = actionText(hex) === "#000000";
  return (
    "#" +
    [1, 3, 5]
      .map((offset) => {
        const value = parseInt(hex.slice(offset, offset + 2), 16);
        return Math.round(lighten ? value * 0.9 + 255 * 0.1 : value * 0.88)
          .toString(16)
          .padStart(2, "0");
      })
      .join("")
      .toUpperCase()
  );
}

export function themeStyle(
  config: SystemConfig,
  colors: BrandColors,
): CSSProperties {
  const color = normalizeBrandColors(colors)[config.theme];
  return color
    ? ({
        "--tiraz-action": color,
        "--preview-action-text": actionText(color),
        "--preview-action-hover": actionHover(color),
      } as CSSProperties)
    : {};
}

export function generateThemeCss(
  config: SystemConfig,
  colors: BrandColors = {},
) {
  const custom = normalizeBrandColors(colors);
  return `/* tiraz.theme.css — import after Tiraz's default styles. */
.tiraz-system {
  --tiraz-radius: ${config.radius}px;
}

${(["light", "dark"] as const)
  .map(
    (mode) => `.tiraz-system[data-theme="${mode}"] {
  --tiraz-action: ${custom[mode] ?? accentColors[config.accent][mode]};${custom[mode] ? `\n  --action-text: ${actionText(custom[mode])};\n  --action-hover: ${actionHover(custom[mode])};` : ""}
}`,
  )
  .join("\n\n")}
`;
}

/** Keep copied TSX runnable on its own; the same CSS is also available as a file. */
export function withCustomTheme(
  code: string,
  config: SystemConfig,
  colors: BrandColors = {},
) {
  if (!Object.keys(normalizeBrandColors(colors)).length) return code;
  const source = code.replace(
    /export default function Example\s*\(/,
    "function TirazThemedExample(",
  );
  if (source === code)
    throw new Error("Generated example has no theme wrapper target");
  return `${source}\n// Move these rules into tiraz.theme.css when sharing the theme across your app.\nconst tirazTheme = ${JSON.stringify(generateThemeCss(config, colors))};\nexport default function Example() {\n  return <><style>{tirazTheme}</style><TirazThemedExample /></>;\n}\n`;
}
