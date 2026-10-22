export type Direction = "rtl" | "ltr";
export type Accent = "sage" | "blue" | "plum" | "clay";
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
};
