import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AtRule, parse, type Rule } from "postcss";
import { expect, it } from "vitest";
import { accentColors, type Accent } from "./config";

// Checks for the Woven tokens (spec sections 7 to 12 and 15). Names and exact
// text are compared as written. Colors are never compared by value: they are
// resolved the way a browser paints them (var(), color-mix(), a wash over the
// surface beneath it) and held to the contrast and distinguishability rules, so
// a color may move as long as it still passes.

type Theme = "light" | "dark";
const themes: readonly Theme[] = ["light", "dark"];
const accents = Object.keys(accentColors) as Accent[];

// ---------------------------------------------------------------------------
// Reading tokens.css

const stylesheet = parse(
  readFileSync(resolve("src/system/tokens.css"), "utf8"),
);
const BASE = ".tiraz-system";
const DARK = '.tiraz-system[data-theme="dark"]';
const LARGE = '.tiraz-system[data-typography="large"]';
const COMPACT = '.tiraz-system[data-density="compact"]';
const REDUCED = '.tiraz-system[data-reduced-motion="true"]';
const PREFERS_REDUCED = "(prefers-reduced-motion: reduce)";
const KEYBOARD = '.tiraz-system[data-modality="keyboard"]';

/** Prettier wraps long values; compare them with its breaks and indents gone. */
const squash = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim();

function inContext(rule: Rule, media: string | undefined) {
  const parent = rule.parent;
  if (media === undefined) return parent?.type === "root";
  return (
    parent instanceof AtRule &&
    parent.name === "media" &&
    squash(parent.params) === squash(media)
  );
}

/**
 * The declarations of every rule that has `selector` in its selector list,
 * merged in source order so a later rule wins, as property to value with
 * whitespace squashed. Without `media` only top-level rules count; with it only
 * rules inside that `@media` query do, so the plain `.tiraz-system` rule and the
 * one inside the reduced-motion query stay apart.
 */
function readRule(selector: string, media?: string): Record<string, string> {
  const declarations: Record<string, string> = {};
  const wanted = squash(selector);
  let found = 0;
  stylesheet.walkRules((rule) => {
    if (!inContext(rule, media)) return;
    if (!rule.selectors.some((candidate) => squash(candidate) === wanted))
      return;
    found += 1;
    rule.each((node) => {
      if (node.type === "decl") declarations[node.prop] = squash(node.value);
    });
  });
  if (found === 0)
    throw new Error(
      `tokens.css has no rule for ${selector}${media ? ` in @media ${media}` : ""}`,
    );
  return declarations;
}

/** The rule's value for each property named in `expected`, to `toEqual` it. */
function valuesOf(rule: Record<string, string>, expected: object) {
  return Object.fromEntries(Object.keys(expected).map((n) => [n, rule[n]]));
}

// ---------------------------------------------------------------------------
// Resolving colors

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** #rgb, #rgba, #rrggbb or #rrggbbaa. */
function parseHex(text: string): Rgba | undefined {
  const match = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(text);
  if (!match) return undefined;
  const digits =
    match[1].length < 6
      ? [...match[1]].map((digit) => digit + digit).join("")
      : match[1];
  const byte = (at: number) => parseInt(digits.slice(at, at + 2), 16);
  return {
    r: byte(0),
    g: byte(2),
    b: byte(4),
    a: digits.length === 8 ? byte(6) / 255 : 1,
  };
}

function rgbOf(hex: string) {
  const parsed = parseHex(hex);
  if (!parsed) throw new Error(`${hex} is not a hex color`);
  return [parsed.r, parsed.g, parsed.b];
}

const namedColors = new Map<string, Rgba>([
  ["black", { r: 0, g: 0, b: 0, a: 1 }],
  ["white", { r: 255, g: 255, b: 255, a: 1 }],
  ["transparent", { r: 0, g: 0, b: 0, a: 0 }],
]);

/** Split on the commas that are not inside parentheses. */
function splitArguments(text: string) {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let at = 0; at < text.length; at += 1) {
    if (text[at] === "(") depth += 1;
    else if (text[at] === ")") depth -= 1;
    else if (text[at] === "," && depth === 0) {
      parts.push(text.slice(start, at).trim());
      start = at + 1;
    }
  }
  parts.push(text.slice(start).trim());
  return parts;
}

/**
 * `color-mix(in srgb, ...)` of two colors with the CSS Color 5 percentage rules
 * (an omitted share is the rest of 100). Channels mix in gamma-encoded sRGB and
 * premultiplied by alpha, so a mix with `transparent` keeps the color and sets
 * the alpha to its share.
 */
function mixSrgb(
  first: Rgba,
  firstShare: number | undefined,
  second: Rgba,
  secondShare: number | undefined,
): Rgba {
  const x = firstShare ?? (secondShare === undefined ? 50 : 100 - secondShare);
  const y = secondShare ?? (firstShare === undefined ? 50 : 100 - firstShare);
  const total = x + y;
  if (total <= 0) throw new Error("color-mix() shares add up to nothing");
  const wx = x / total;
  const wy = y / total;
  const alpha = first.a * wx + second.a * wy;
  if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const channel = (c: "r" | "g" | "b") =>
    (first[c] * first.a * wx + second[c] * second.a * wy) / alpha;
  return {
    r: channel("r"),
    g: channel("g"),
    b: channel("b"),
    a: alpha * Math.min(1, total / 100),
  };
}

const themeCache = new Map<Theme, Record<string, string>>();
/** Every custom property that applies to a provider root in this theme. */
function themeTokens(theme: Theme) {
  let tokens = themeCache.get(theme);
  if (!tokens) {
    const base = readRule(BASE);
    tokens = theme === "dark" ? { ...base, ...readRule(DARK) } : base;
    themeCache.set(theme, tokens);
  }
  return tokens;
}

const hexByte = (value: number) =>
  Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, "0");

type Tokens = Record<string, string>;

/**
 * A token's color as #rrggbb, resolved from `tokens` the way a browser paints
 * it: `var()` chains, the `color-mix(in srgb, ...)` forms in tokens.css, and
 * `--action` as the accent's color, which the Provider sets inline. A
 * translucent color (a wash, a halo) is composited over `over`, the surface
 * under test, and throws without one.
 */
function paint(
  tokens: Tokens,
  theme: Theme,
  name: string,
  accent?: Accent,
  over?: string,
): string {
  const resolveExpression = (
    expression: string,
    trail: readonly string[],
  ): Rgba => {
    const text = expression.trim();
    const literal = parseHex(text) ?? namedColors.get(text);
    if (literal) return literal;
    const call = /^([a-z-]+)\((.*)\)$/s.exec(text);
    if (call?.[1] === "var") {
      const token = call[2].trim();
      if (trail.includes(token))
        throw new Error(`${[...trail, token].join(" > ")} loops`);
      if (token === "--action") {
        if (!accent) throw new Error("--action comes from an accent; pass one");
        return resolveExpression(accentColors[accent][theme], [
          ...trail,
          token,
        ]);
      }
      const value = tokens[token];
      if (value === undefined)
        throw new Error(`${token} is not defined in the ${theme} theme`);
      return resolveExpression(value, [...trail, token]);
    }
    if (call?.[1] === "color-mix") {
      const [space, ...operands] = splitArguments(call[2]);
      if (space !== "in srgb" || operands.length !== 2)
        throw new Error(`Cannot resolve ${text}`);
      const [a, b] = operands.map((operand) => {
        const parts = /^(.+?)(?:\s+(\d+(?:\.\d+)?)%)?$/s.exec(operand);
        if (!parts) throw new Error(`Cannot resolve ${text}`);
        return {
          color: resolveExpression(parts[1], trail),
          share: parts[2] === undefined ? undefined : Number(parts[2]),
        };
      });
      return mixSrgb(a.color, a.share, b.color, b.share);
    }
    throw new Error(`Cannot resolve "${expression}" to a color`);
  };

  const resolved = resolveExpression(`var(${name})`, []);
  if (resolved.a >= 0.999999)
    return `#${hexByte(resolved.r)}${hexByte(resolved.g)}${hexByte(resolved.b)}`;
  if (over === undefined)
    throw new Error(`${name} is translucent; pass the surface it sits on`);
  const under = rgbOf(over);
  const mixed = [resolved.r, resolved.g, resolved.b].map(
    (value, at) => value * resolved.a + under[at] * (1 - resolved.a),
  );
  return `#${mixed.map(hexByte).join("")}`;
}

/** A token's color in this theme as #rrggbb; see `paint`. */
function color(theme: Theme, name: string, accent?: Accent, over?: string) {
  return paint(themeTokens(theme), theme, name, accent, over);
}

const toLinear = (channel: number) => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

/** WCAG 2.x relative luminance of #rrggbb. */
function luminance(hex: string) {
  const [r, g, b] = rgbOf(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio of two #rrggbb colors, 1 to 21. */
function contrast(a: string, b: string) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/** OKLab (Björn Ottosson) of #rrggbb: sRGB to linear, to LMS, to Lab. */
function oklab(hex: string) {
  const [r, g, b] = rgbOf(hex).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Euclidean distance between two #rrggbb colors in OKLab. */
function oklabDistance(a: string, b: string) {
  const [l1, a1, b1] = oklab(a);
  const [l2, a2, b2] = oklab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

interface Check {
  label: string;
  foreground: string;
  background: string;
}

/** The checks whose contrast ratio is under `minimum`, as readable lines. */
function below(minimum: number, checks: readonly Check[]) {
  return checks.flatMap(({ label, foreground, background }) => {
    const ratio = contrast(foreground, background);
    return ratio < minimum ? [`${label}: ${ratio.toFixed(3)}`] : [];
  });
}

// ---------------------------------------------------------------------------
// The Woven token table (plan 1, task 6, step 3): exact text where the value is
// not a color.

const font = '"IBM Plex Sans Arabic", system-ui, sans-serif';

/** Standard and large sizes. */
const typeScale = {
  "--text-display": ["30px", "34px"],
  "--text-title": ["24px", "26px"],
  "--text-heading": ["18px", "20px"],
  "--text-subheading": ["16px", "18px"],
  "--text-reading": ["15.5px", "17px"],
  "--text-body": ["14px", "16px"],
  "--text-label": ["13px", "15px"],
  "--text-meta": ["12.5px", "14px"],
  "--text-micro": ["11px", "12.5px"],
  "--text-figure": ["28px", "32px"],
  "--text-figure-small": ["20px", "22px"],
} as const;
const sizesAt = (column: 0 | 1) =>
  Object.fromEntries(
    Object.entries(typeScale).map(([name, sizes]) => [name, sizes[column]]),
  );

const leading = {
  "--leading-display": "1.3",
  "--leading-title": "1.35",
  "--leading-heading": "1.5",
  "--line-height": "1.8",
  "--leading-reading": "1.95",
  "--leading-meta": "1.6",
  "--leading-micro": "1.4",
  "--leading-figure": "1.25",
};

const fixedSizes = {
  "--status-size": "22px",
  "--remove-size": "24px",
  "--switch-track-width": "38px",
  "--switch-track-height": "22px",
  "--switch-thumb": "16px",
  "--slider-track": "6px",
  "--slider-thumb": "18px",
  "--avatar-sm": "32px",
  "--avatar-md": "40px",
  "--chat-avatar": "24px",
  "--press-scale": "0.97",
  "--disabled-opacity": "0.5",
};

/** Paper padding at standard and compact density (spec section 9). */
const paperPadding = {
  standard: {
    "--paper-padding-block": "16px",
    "--paper-padding-inline": "18px",
  },
  compact: {
    "--paper-padding-block": "14px",
    "--paper-padding-inline": "16px",
  },
};

/** Table cell padding at standard and compact density (spec section 11). */
const cellPadding = {
  standard: { "--cell-padding": "8px" },
  compact: { "--cell-padding": "4px" },
};

const radii = {
  "--radius-small": "max(2px, calc(var(--radius) - 3px))",
  "--tray-pad": "5px",
  "--radius-item": "var(--radius)",
  "--radius-control": "calc(var(--radius) * 1.25)",
  "--radius-paper":
    "min(24px, max(var(--radius-control), calc(var(--radius) * 1.875)))",
  "--radius-tray":
    "calc(var(--radius-paper) + min(var(--tray-pad), calc(var(--radius) * 0.625)))",
  "--radius-pill": "calc(var(--radius) * 999)",
  "--radius-panel": "var(--radius-paper)",
};

const motion = {
  "--motion-press": "90ms",
  "--motion-release": "160ms",
  "--motion-fast": "120ms",
  "--motion-state": "200ms",
  "--motion-enter": "180ms",
  "--motion-exit": "120ms",
  "--motion-tooltip-exit": "100ms",
  "--motion-dialog-enter": "220ms",
  "--motion-dialog-exit": "150ms",
  "--motion-panel": "280ms",
  "--motion-panel-exit": "200ms",
  "--motion-toast": "240ms",
  "--motion-toast-exit": "150ms",
  "--motion-collapse": "200ms",
  "--motion-collapse-exit": "150ms",
  "--motion-progress": "240ms",
  "--motion-stagger": "40ms",
  "--motion-word": "34ms",
  "--motion-loop-stitch": "800ms",
  "--motion-loop-shimmer": "1900ms",
  "--motion-loop-turn": "1800ms",
  "--motion-loop-skeleton": "1600ms",
  "--motion-loop-caret": "1100ms",
  "--motion-loop-spinner": "800ms",
  "--motion-loop-progress": "1500ms",
};

/** Colors and shadows; their values are held to the rules below, not pinned. */
const colorAndShadowTokens = [
  "--text-secondary",
  "--text-muted",
  "--ai",
  "--ai-soft",
  "--attention",
  "--attention-soft",
  "--surface-tray",
  "--surface-well",
  "--code-surface",
  "--code-literal",
  "--border-field",
  "--shadow-paper",
  "--shadow-chip",
  "--shadow-surface",
];

/** The table's dark column, minus `--shadow-surface`, which dark must drop. */
const darkRedefined = [
  "--text-muted",
  "--ai",
  "--ai-soft",
  "--attention",
  "--attention-soft",
  "--surface-tray",
  "--code-literal",
  "--border-field",
  "--shadow-paper",
  "--shadow-chip",
];

// ---------------------------------------------------------------------------
// Tests

it("measures contrast and color distance, and resolves colors", () => {
  expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 6);
  // The lightest gray that passes AA on white.
  expect(contrast("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  expect(oklabDistance("#000000", "#ffffff")).toBeCloseTo(1, 4);
  // CSS Color 4: red is oklab(62.8% 0.22486 0.12585).
  const [lightness, a, b] = oklab("#ff0000");
  expect(lightness).toBeCloseTo(0.628, 3);
  expect(a).toBeCloseTo(0.225, 3);
  expect(b).toBeCloseTo(0.126, 3);

  // The resolver, on a table of its own so no token in tokens.css can break it.
  // Each answer is arithmetic done by hand, per channel and rounded last: the
  // sage accent is (53, 94, 76) and the ink is (35, 42, 38).
  const table: Tokens = {
    "--paper": "#ffffff",
    "--ink": "#232a26",
    "--accent": "var(--action)",
    "--tint": "color-mix(in srgb, var(--action) 8%, var(--paper))",
    "--deep": "color-mix(in srgb, var(--action), black 12%)",
    "--quarter": "color-mix(in srgb, white 25%, black 75%)",
    "--wash": "color-mix(in srgb, var(--ink) 4%, transparent)",
    "--wash-strong": "color-mix(in srgb, var(--ink) 7%, transparent)",
    "--loop": "var(--again)",
    "--again": "var(--loop)",
  };
  const of = (name: string, over?: string) =>
    paint(table, "light", name, "sage", over);
  expect(of("--accent")).toBe("#355e4c"); // one hop to the accent
  expect(of("--tint")).toBe("#eff2f1"); // (53, 94, 76) * 8% + white * 92%
  expect(of("--deep")).toBe("#2f5343"); // the omitted share is the rest of 100
  expect(of("--quarter")).toBe("#404040");
  expect(of("--wash", "#ffffff")).toBe("#f6f6f6"); // alpha 4% over white
  expect(of("--wash-strong", "#ffffff")).toBe("#f0f0f0"); // alpha 7% over white
  expect(of("--wash", "#000000")).toBe("#010202"); // ink * 4%: (1.4, 1.7, 1.5)
  // The accent follows the theme, and a missing accent is refused.
  expect(paint(table, "dark", "--accent", "sage")).toBe("#a5c9b4");
  expect(() => paint(table, "light", "--accent")).toThrow(/accent/);
  // Refusals that keep a test from passing on a guess.
  expect(() => of("--wash")).toThrow(/translucent/);
  expect(() => of("--missing")).toThrow(/not defined/);
  expect(() => of("--loop")).toThrow(/loops/);
});

it("reads rules that share a selector, and rules inside a media query", () => {
  const base = readRule(BASE);
  // Two top-level rules share .tiraz-system: the main one, and chart colors
  // near the end of the file. Both are merged.
  expect(base["--surface-page"]).toBeDefined();
  expect(base["--chart-sage"]).toBeDefined();
  // The .tiraz-system rule inside the reduced-motion query is a rule of its
  // own; it is neither merged into the top level nor mistaken for it.
  expect(base["--motion-press"]).toBe("90ms");
  expect(readRule(BASE, PREFERS_REDUCED)["--motion-press"]).toBe("0ms");
  expect(readRule(BASE, PREFERS_REDUCED)).not.toHaveProperty("--surface-page");
  expect(() => readRule(".tiraz-system .nothing")).toThrow(/no rule/);
  expect(() => readRule(BASE, "(min-width: 1px)")).toThrow(/no rule/);
});

it("defines every Woven token in both themes", () => {
  const light = readRule(BASE);
  const dark = readRule(DARK);
  const names = [
    "--font",
    ...Object.keys(typeScale),
    ...Object.keys(leading),
    ...Object.keys(fixedSizes),
    ...Object.keys(radii),
    ...Object.keys(motion),
    ...colorAndShadowTokens,
  ];
  const undefinedIn = (rule: Record<string, string>, wanted: string[]) =>
    wanted.filter((name) => !rule[name]);
  expect(undefinedIn(light, names), `missing from ${BASE}`).toEqual([]);
  expect(undefinedIn(dark, darkRedefined), `missing from ${DARK}`).toEqual([]);
  // The alias reaches the dark paper shadow only if dark does not redefine it.
  expect(light["--shadow-surface"]).toBe("var(--shadow-paper)");
  expect(dark, `${DARK} must not define --shadow-surface`).not.toHaveProperty(
    "--shadow-surface",
  );
});

it("sets the type scale and leading", () => {
  const standard = readRule(BASE);
  const large = { ...standard, ...readRule(LARGE) };
  expect(standard["--font"]).toBe(font);
  expect(valuesOf(standard, sizesAt(0))).toEqual(sizesAt(0));
  expect(valuesOf(large, sizesAt(1))).toEqual(sizesAt(1));
  // Leading follows the role, not the size.
  expect(valuesOf(standard, leading)).toEqual(leading);
  expect(valuesOf(large, leading)).toEqual(leading);
});

it("sets the fixed sizes and the press and disabled states", () => {
  expect(valuesOf(readRule(BASE), fixedSizes)).toEqual(fixedSizes);
});

it("pads paper by density", () => {
  const { standard, compact } = paperPadding;
  expect(valuesOf(readRule(BASE), standard)).toEqual(standard);
  expect(valuesOf(readRule(COMPACT), compact)).toEqual(compact);
});

it("pads table cells by density", () => {
  const { standard, compact } = cellPadding;
  expect(valuesOf(readRule(BASE), standard)).toEqual(standard);
  expect(valuesOf(readRule(COMPACT), compact)).toEqual(compact);
});

it("keeps text at 4.5:1 on every surface and soft tone", () => {
  expect(accents).toHaveLength(12);
  const texts = ["--text", "--text-secondary", "--text-muted"];
  const surfaces = [
    "--surface-page",
    "--surface-tray",
    "--surface",
    "--surface-well",
  ];
  const softTones = [
    "--ai-soft",
    "--attention-soft",
    "--success-soft",
    "--danger-soft",
    "--info-soft",
  ];
  const washes = ["--wash", "--wash-strong"];
  const checks: Check[] = [];
  for (const theme of themes) {
    const under = (wash: string, surface: string) =>
      color(theme, wash, undefined, color(theme, surface));
    for (const text of texts) {
      const foreground = color(theme, text);
      const on = (label: string, background: string) =>
        checks.push({
          label: `${theme} ${text} on ${label}`,
          foreground,
          background,
        });
      for (const surface of surfaces) on(surface, color(theme, surface));
      for (const wash of washes)
        for (const surface of ["--surface-page", "--surface"])
          on(`${surface} under ${wash}`, under(wash, surface));
      for (const tone of softTones) on(tone, color(theme, tone));
      // Only the action tint depends on the accent.
      for (const accent of accents)
        on(`--action-soft (${accent})`, color(theme, "--action-soft", accent));
    }
    // On a hovered tray muted text falls below 4.5:1, so rows there keep the
    // two stronger tiers (spec section 12).
    for (const text of ["--text", "--text-secondary"])
      for (const wash of washes)
        checks.push({
          label: `${theme} ${text} on --surface-tray under ${wash}`,
          foreground: color(theme, text),
          background: under(wash, "--surface-tray"),
        });
  }
  expect(below(4.5, checks)).toEqual([]);
});

it("keeps colored text at 4.5:1", () => {
  expect(accents).toHaveLength(12);
  const surfaces = [
    "--surface-page",
    "--surface-tray",
    "--surface",
    "--surface-well",
  ];
  const checks: Check[] = [];
  for (const theme of themes) {
    for (const role of [
      "--ai",
      "--attention",
      "--success",
      "--danger",
      "--info",
    ])
      for (const background of [...surfaces, `${role}-soft`])
        checks.push({
          label: `${theme} ${role} on ${background}`,
          foreground: color(theme, role),
          background: color(theme, background),
        });
    for (const accent of accents)
      for (const background of [...surfaces, "--action-soft"])
        checks.push({
          label: `${theme} --action (${accent}) on ${background}`,
          foreground: color(theme, "--action", accent),
          background: color(theme, background, accent),
        });
  }
  expect(below(4.5, checks)).toEqual([]);
});

it("keeps boundaries and indicators at 3:1", () => {
  expect(accents).toHaveLength(12);
  const checks: Check[] = [];
  for (const theme of themes) {
    const grounds = {
      page: color(theme, "--surface-page"),
      paper: color(theme, "--surface"),
      tray: color(theme, "--surface-tray"),
    };
    const on = (
      label: string,
      foreground: string,
      where: readonly (keyof typeof grounds)[],
    ) => {
      for (const ground of where)
        checks.push({
          label: `${theme} ${label} on ${ground}`,
          foreground,
          background: grounds[ground],
        });
    };
    const everywhere = ["page", "paper", "tray"] as const;
    for (const name of ["--border-field", "--switch-track"])
      on(name, color(theme, name), everywhere);
    for (const accent of accents)
      on(`focus ring (${accent})`, color(theme, "--focus", accent), everywhere);
    // Status discs sit on paper or the tray, and carry a --surface glyph.
    for (const disc of ["--ai", "--attention", "--success", "--danger"]) {
      const fill = color(theme, disc);
      on(`${disc} disc`, fill, ["paper", "tray"]);
      checks.push({
        label: `${theme} --surface glyph on ${disc} disc`,
        foreground: color(theme, "--surface"),
        background: fill,
      });
    }
  }
  expect(below(3, checks)).toEqual([]);
});

it("keeps the five semantic colors apart", () => {
  const roles = ["--ai", "--attention", "--success", "--danger", "--info"];
  const tooClose: string[] = [];
  for (const theme of themes)
    roles.forEach((first, at) =>
      roles.slice(at + 1).forEach((second) => {
        const distance = oklabDistance(
          color(theme, first),
          color(theme, second),
        );
        if (distance < 0.08)
          tooClose.push(
            `${theme} ${first} / ${second}: ${distance.toFixed(3)}`,
          );
      }),
    );
  expect(tooClose).toEqual([]);
});

it("keeps code literals off the AI color", () => {
  // Spec section 8.2: the literal is 0.20 from --ai in OKLab in light (0.203
  // measured) and 0.125 in dark, where it is held to 0.08, the floor that keeps
  // the semantic colors apart.
  const leastApart = { light: 0.15, dark: 0.08 };
  for (const theme of themes) {
    const literal = color(theme, "--code-literal");
    expect(
      oklabDistance(literal, color(theme, "--ai")),
      `${theme} --code-literal against --ai`,
    ).toBeGreaterThanOrEqual(leastApart[theme]);
    // Code sits on the well, and --code-surface is the well.
    expect(color(theme, "--code-surface")).toBe(color(theme, "--surface-well"));
    expect(
      contrast(literal, color(theme, "--surface-well")),
      `${theme} --code-literal on the well`,
    ).toBeGreaterThanOrEqual(4.5);
  }
});

it("derives every radius from --radius", () => {
  expect(valuesOf(readRule(BASE), radii)).toEqual(radii);
});

it("keeps motion in budget and stops it under reduced motion", () => {
  const base = readRule(BASE);
  expect(valuesOf(base, motion)).toEqual(motion);

  // Interface durations stay within 90 to 240 ms. Stagger and word are gaps
  // between items and the loops are decorative (spec section 15). The sheet
  // token is the one named exception: spec section 15 gives sheets 280 ms in
  // and 200 ms out and names them as the exception to the budget. The value is
  // pinned above.
  const sheetEntrance = ["--motion-panel"];
  const outside = Object.entries(base)
    .filter(([name]) => name.startsWith("--motion-"))
    .filter(([name]) => !/^--motion-(stagger|word|loop-)/.test(name))
    .filter(([name]) => !sheetEntrance.includes(name))
    .filter(([, value]) => {
      const milliseconds = /^(\d+(?:\.\d+)?)ms$/.exec(value);
      return !milliseconds || +milliseconds[1] < 90 || +milliseconds[1] > 240;
    })
    .map(([name, value]) => `${name}: ${value}`);
  expect(outside).toEqual([]);

  // Both reduced-motion rules zero every motion token, so none is missed.
  const motionTokens = Object.keys(base).filter((name) =>
    name.startsWith("--motion-"),
  );
  expect(motionTokens.length).toBeGreaterThanOrEqual(
    Object.keys(motion).length,
  );
  const rules = {
    [REDUCED]: readRule(REDUCED),
    [`${BASE} in @media ${PREFERS_REDUCED}`]: readRule(BASE, PREFERS_REDUCED),
  };
  for (const [name, rule] of Object.entries(rules))
    expect(
      motionTokens.filter((token) => rule[token] !== "0ms"),
      `motion tokens that ${name} leaves above 0ms`,
    ).toEqual([]);
});

it("zeroes interaction motion under keyboard modality", () => {
  // Keyboard actions never animate (spec section 15). Toasts are included
  // because the toast stack's height animation is skipped under keyboard
  // modality (section 20).
  const interaction = [
    "--motion-press",
    "--motion-release",
    "--motion-fast",
    "--motion-state",
    "--motion-enter",
    "--motion-exit",
    "--motion-tooltip-exit",
    "--motion-dialog-enter",
    "--motion-dialog-exit",
    "--motion-panel",
    "--motion-panel-exit",
    "--motion-toast",
    "--motion-toast-exit",
    "--motion-collapse",
    "--motion-collapse-exit",
    "--motion-stagger",
  ];
  const keyboard = readRule(KEYBOARD);
  expect(
    interaction.filter((token) => keyboard[token] !== "0ms"),
    `interaction motion tokens that ${KEYBOARD} leaves above 0ms`,
  ).toEqual([]);
  expect(keyboard["--press-scale"]).toBe("1");

  // Every other motion token on the root is a streamed word, the progress fill
  // or a decorative loop, which the system drives, so a new interaction token
  // is not missed, and those keep their time.
  const kept = Object.keys(readRule(BASE)).filter(
    (name) => name.startsWith("--motion-") && !interaction.includes(name),
  );
  expect(kept.sort()).toEqual([
    "--motion-loop-caret",
    "--motion-loop-progress",
    "--motion-loop-shimmer",
    "--motion-loop-skeleton",
    "--motion-loop-spinner",
    "--motion-loop-stitch",
    "--motion-loop-turn",
    "--motion-progress",
    "--motion-word",
  ]);
  expect(
    kept.filter((name) => name in keyboard),
    `streamed word and loop tokens that ${KEYBOARD} changes`,
  ).toEqual([]);
});
