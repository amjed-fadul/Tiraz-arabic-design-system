export type Direction = "rtl" | "ltr";
export type Accent =
  | "sage"
  | "blue"
  | "plum"
  | "clay"
  | "lime"
  | "amber"
  | "teal"
  | "cyan"
  | "indigo"
  | "rose"
  | "slate"
  | "ink";
export interface SystemConfig {
  theme: "light" | "dark";
  direction: Direction;
  density: "standard" | "compact";
  accent: Accent;
  radius: number;
  reducedMotion: boolean;
  typography?: "standard" | "large";
}
export const defaultConfig: SystemConfig = {
  theme: "light",
  direction: "rtl",
  density: "compact",
  accent: "sage",
  radius: 8,
  reducedMotion: false,
  typography: "standard",
};
export const accentColors: Record<Accent, { light: string; dark: string }> = {
  sage: { light: "#355E4C", dark: "#A5C9B4" },
  blue: { light: "#365B87", dark: "#A8C6EF" },
  plum: { light: "#6B487A", dark: "#D6B6E5" },
  clay: { light: "#88543F", dark: "#E8BAA3" },
  lime: { light: "#4D641A", dark: "#A5F12A" },
  amber: { light: "#805800", dark: "#E6B34A" },
  teal: { light: "#14675F", dark: "#68D8C7" },
  cyan: { light: "#17627B", dark: "#79D1EB" },
  indigo: { light: "#4F4F96", dark: "#B9B8F5" },
  rose: { light: "#8A3F65", dark: "#F1A5CA" },
  slate: { light: "#4C5968", dark: "#B8C6D8" },
  /** Monochrome: actions take the text color, for a quiet, editorial look. */
  ink: { light: "#1F2622", dark: "#E6EBE6" },
};
