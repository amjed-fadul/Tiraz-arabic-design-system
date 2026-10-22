import {
  AtRule,
  parse,
  type Container,
  type Document,
  type Rule,
} from "postcss";

// The Woven CSS audit. It reads a stylesheet with postcss and holds the rules of
// one component family to the Woven visual rules, so a family can be switched on
// (css-audit.families.ts) once it is restyled and stay honest afterwards.
//
// A family is a list of class prefixes. A rule belongs to it when one of its
// selectors names a class that is a prefix or continues one with "-": ".tz-button"
// covers ".tz-button" and ".tz-button-label", never ".tz-buttons". Rules inside
// @media, @supports, @container and @layer count. @keyframes frames name no
// class, so nothing inside a keyframe is read.
//
// Only the selectors of a rule that name the family are judged for the checks
// that read selectors (hover, press, English), so a shared rule such as
// `.tz-a:hover, .tz-b { … }` is held against `.tz-a` and `.tz-b` separately.
//
// The checks. Each issue carries one message that starts with the check's name
// and ends with where its rule sits, "(line 6799, @media …)", since many rules
// share one selector.
//   1. Color literal: a hex color, rgb(), rgba(), hsl(), hsla(), hwb(), lab(),
//      lch(), oklab(), oklch(), color(), or the keywords white and black, in any
//      value. Exempt inside @media (forced-colors: active). transparent,
//      currentColor and inherit are fine.
//   2. Font size: a font-size that is not var(--text-…), inherit or 1em.
//   3. Radius: a radius built from anything but the radius scale. Only
//      var(--radius-small|item|control|paper|tray|pill|panel) and var(--tray-pad)
//      may be referenced, without a fallback, and the only numbers are 0 and 50%.
//      So the raw var(--radius), a token from another scale, a multiplier and an
//      offset are all flagged, while calc(var(--radius-paper) - var(--tray-pad))
//      is the concentric corner.
//   4. Time literal: a literal time other than 0ms or 0s in a transition, an
//      animation or a custom property, calc() included: an offset such as
//      `+ 60ms` survives keyboard and reduced-motion zeroing. Times are
//      var(--motion-…). The --motion- tokens themselves are check 11's.
//   5. Curve literal: any cubic-bezier(). Easings are var(--ease-…).
//   6. Hover gating: a selector with :hover outside
//      @media (hover: hover) and (pointer: fine).
//   7. Press scale: a scale in an :active or [data-pressed] selector whose
//      arguments are not each exactly var(--press-scale). Keyboard modality sets
//      the token to 1, so arithmetic on it, a fallback or a literal second axis
//      would let a press survive it.
//   8. Line height: a line-height that is not var(--leading-…), var(--line-height),
//      1, 0, inherit or normal.
//   9. Font weight: a font-weight that is not var(--weight-…), 400, 500, 600,
//      normal or inherit, the weights that are bundled.
//  10. Arabic letterforms: letter-spacing other than 0 or normal, text-transform
//      other than none, or an italic or oblique font-style, unless every
//      selector that names the family is :lang(en). CSS-wide keywords (inherit,
//      initial, unset, revert) add nothing of their own and pass.
//  11. Local redefinition: a component rule that declares --press-scale or any
//      --motion-… property. It shadows the root rules for keyboard modality and
//      reduced motion (tokens.css), which zero those tokens.
//
// Checks 2, 8, 9 and 10 also read the `font` shorthand, which sets all of them:
// `font: 11px var(--font-mono)` is a literal size and `font: …/1.6 …` a literal
// leading. Native CSS nesting is refused rather than skipped, because nested
// declarations would otherwise go unread.
//
// What it does not read: @keyframes frames; named colors other than white and
// black; and keyword easings such as `ease`.
//
// Besides auditFamily, unmatchedPrefixes names the prefixes of a family that no
// rule names, and familyRuleCount counts the rules a family owns.

export interface AuditIssue {
  /** The rule's selectors that name the family, on one line. */
  selector: string;
  /** The property at fault, or ":hover" for a hover rule outside the gate. */
  property: string;
  /** The value at fault, or the hovered selectors for a hover rule. */
  value: string;
  /** Opens with the check's name and closes with where the rule sits: "(line 12, @media …)". */
  message: string;
}

// ---------------------------------------------------------------------------
// Reading text

/** Whitespace collapsed to single spaces, and none just inside parentheses. */
const squash = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim();

/** Strings and url() bodies blanked, so text inside them is never read as CSS. */
const blank = (text: string) =>
  text
    .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""')
    .replace(/url\([^)]*\)/gi, "url()");

interface Quantity {
  text: string;
  amount: number;
  /** "%", a unit such as "px" or "ms", or "" for a bare number. */
  unit: string;
}

/**
 * The numbers in a value with their units. Digits inside a name, such as
 * `--space-2` or `tz-fade-2s`, are not numbers.
 */
function quantities(value: string): Quantity[] {
  const number =
    /(?<![\w.-])[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(%|[a-z]+)?/gi;
  return [...value.matchAll(number)].map((match) => ({
    text: match[0],
    amount: parseFloat(match[0]),
    unit: match[1] ?? "",
  }));
}

/** The index just past the parenthesis that closes the one at `open`. */
function closing(text: string, open: number): number {
  let depth = 0;
  for (let at = open; at < text.length; at += 1) {
    if (text[at] === "(") depth += 1;
    else if (text[at] === ")") {
      depth -= 1;
      if (depth === 0) return at + 1;
    }
  }
  return text.length;
}

/** The text of every `name(…)` call in `value`; `name` is a regex source. */
function calls(value: string, name: string): string[] {
  const open = new RegExp(`(?<![\\w-])${name}\\(`, "gi");
  return [...value.matchAll(open)].map((match) =>
    value.slice(match.index, closing(value, match.index + match[0].length - 1)),
  );
}

/** Splits at whitespace and at "/" outside parentheses, keeping each "/". */
function tokens(value: string): string[] {
  const found: string[] = [];
  let depth = 0;
  let start = 0;
  const push = (end: number) => {
    const token = value.slice(start, end).trim();
    if (token !== "") found.push(token);
  };
  for (let at = 0; at < value.length; at += 1) {
    const character = value[at];
    if (character === "(") depth += 1;
    else if (character === ")") depth -= 1;
    else if (depth === 0 && (character === "/" || /\s/.test(character))) {
      push(at);
      if (character === "/") found.push("/");
      start = at + 1;
    }
  }
  push(value.length);
  return found;
}

// ---------------------------------------------------------------------------
// Reading selectors and media queries

const PREFIX = /^\.-?[A-Za-z_][\w-]*$/;

function checkPrefixes(prefixes: readonly string[]) {
  if (prefixes.length === 0)
    throw new Error("css-audit: a family needs at least one class prefix");
  for (const prefix of prefixes)
    if (!PREFIX.test(prefix))
      throw new Error(
        `css-audit: ${JSON.stringify(prefix)} is not a class prefix such as ".tz-button"`,
      );
}

/**
 * Letters, digits, "_", escapes and non-ASCII: the characters that make
 * `.tz-buttons` a different class from `.tz-button`. A "-" is not one of them,
 * because `.tz-button-label` is the same family.
 */
const NAME_CHARACTER = /[\w\\\u0080-\uffff]/;

/** Whether blanked selector text names a class that is `prefix` or continues it with "-". */
function namesClass(selector: string, prefix: string): boolean {
  for (
    let at = selector.indexOf(prefix);
    at !== -1;
    at = selector.indexOf(prefix, at + 1)
  ) {
    const next = selector[at + prefix.length];
    if (next === undefined || !NAME_CHARACTER.test(next)) return true;
  }
  return false;
}

const isHover = (selector: string) => /:hover(?![\w-])/i.test(blank(selector));

const isPress = (selector: string) =>
  /:active(?![\w-])|\[\s*data-pressed(?![\w-])[^\]]*\]/i.test(blank(selector));

/** The selector without its :not(…) groups, which say what an element is not. */
function withoutNegations(selector: string): string {
  let rest = selector;
  for (let at = rest.search(/:not\(/i); at !== -1; at = rest.search(/:not\(/i))
    rest = rest.slice(0, at) + rest.slice(closing(rest, at + 4));
  return rest;
}

/** `:lang(en)` or a regional tag such as `:lang(en-US)`, quoted or not. */
const isEnglish = (selector: string) =>
  /:lang\(\s*(["']?)en(?:-[\w-]+)?\1\s*\)/i.test(withoutNegations(selector));

/**
 * Whether every query of a media query list needs all of `terms`, joined by
 * "and". A query that starts with "not" never qualifies, so `not (forced-colors:
 * active)` is not a forced-colors block. An "or" query cannot hold a term on
 * its own, so it falls out without a rule.
 */
function requires(params: string, terms: readonly string[]): boolean {
  return params
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s*:\s*/g, ": ")
    .split(",")
    .map((query) => query.trim())
    .every((query) => {
      if (/^not /.test(query)) return false;
      const conditions = query.split(" and ");
      return terms.every((term) => conditions.includes(term));
    });
}

/** What the @media rules around a rule say about it. */
function mediaOf(rule: Rule) {
  const queries: string[] = [];
  let node: Container | Document | undefined = rule.parent;
  for (; node; node = node.parent)
    if (node instanceof AtRule && node.name.toLowerCase() === "media")
      queries.push(node.params);
  return {
    hoverGated: queries.some((query) =>
      requires(query, ["(hover: hover)", "(pointer: fine)"]),
    ),
    forcedColors: queries.some((query) =>
      requires(query, ["(forced-colors: active)"]),
    ),
    /** The conditions around the rule as written, outermost first. */
    conditions: queries.map(squash).reverse(),
  };
}

/**
 * Where a rule sits, for the end of each message: its line, and the @media
 * conditions around it. Many rules share one selector, so the selector alone
 * does not find them.
 */
function whereIs(rule: Rule, conditions: readonly string[]): string {
  const line = rule.source?.start?.line;
  const parts = [
    ...(line === undefined ? [] : [`line ${line}`]),
    ...(conditions.length === 0
      ? []
      : [conditions.map((condition) => `@media ${condition}`).join(" > ")]),
  ];
  return parts.length === 0 ? "" : ` (${parts.join(", ")})`;
}

// ---------------------------------------------------------------------------
// The declaration checks

/** What the rule around a declaration says about it. */
interface Context {
  /** Inside @media (forced-colors: active), where system colors rule. */
  forcedColors: boolean;
  /** A selector of the rule is :active or [data-pressed]. */
  pressed: boolean;
  /** Every selector of the rule is English. */
  english: boolean;
}

/** A message when `value` of `property` breaks the check; `value` is blanked. */
type Check = (
  property: string,
  value: string,
  context: Context,
) => string | undefined;

const HEX = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})(?![\w-])/gi;
const COLOR_FUNCTION =
  /(?<![\w-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/gi;
const COLOR_WORD = /(?<![\w-])(?:white|black)(?![\w-])/gi;

// 1.
const colorLiteral: Check = (_property, value, { forcedColors }) => {
  if (forcedColors) return undefined;
  const found = [
    ...value.matchAll(HEX),
    ...value.matchAll(COLOR_FUNCTION),
    ...value.matchAll(COLOR_WORD),
  ]
    .sort((a, b) => a.index - b.index)
    .map((match) => (match[1] ? `${match[1]}()` : match[0]));
  if (found.length === 0) return undefined;
  return `Color literal ${[...new Set(found)].join(", ")}: use a color token, var(--…); only transparent, currentColor and inherit are allowed.`;
};

// 2.
const fontSize: Check = (property, value) => {
  if (property !== "font-size") return undefined;
  if (/^(?:inherit|1em)$/i.test(value)) return undefined;
  if (/^var\(\s*--text-[\w-]+\s*\)$/.test(value)) return undefined;
  return `Font size ${value}: use var(--text-…), inherit or 1em.`;
};

const RADII = new Set([
  "border-radius",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
  "border-start-start-radius",
  "border-start-end-radius",
  "border-end-start-radius",
  "border-end-end-radius",
]);

/**
 * The radius scale of tokens.css, and the pad that makes a tray's corners
 * concentric with its paper. Nothing else may stand in a radius: a token from
 * another scale, a multiplier or an offset is an off-scale radius.
 */
const RADIUS_TOKENS = new Set([
  "--radius-small",
  "--radius-item",
  "--radius-control",
  "--radius-paper",
  "--radius-tray",
  "--radius-pill",
  "--radius-panel",
  "--tray-pad",
]);

// 3.
const radius: Check = (property, value) => {
  if (!RADII.has(property)) return undefined;
  const problems = new Set<string>();
  for (const [, name, next] of value.matchAll(
    /var\(\s*(--[\w-]+)\s*([,)])/gi,
  )) {
    if (name === "--radius") problems.add("the raw var(--radius)");
    else if (!RADIUS_TOKENS.has(name))
      problems.add(`var(${name}), which is not a radius token`);
    else if (next === ",") problems.add(`a fallback on var(${name})`);
  }
  const literals = quantities(value).filter(
    ({ amount, unit }) => amount !== 0 && !(unit === "%" && amount === 50),
  );
  if (literals.length > 0)
    problems.add(
      `the literal${literals.length > 1 ? "s" : ""} ${literals.map(({ text }) => text).join(", ")}`,
    );
  if (problems.size === 0) return undefined;
  return `Radius: ${value} uses ${[...problems].join(" and ")}; use var(--radius-small|item|control|paper|tray|pill|panel), with var(--tray-pad) in arithmetic, or 50% or 0.`;
};

const MOTION = new Set([
  "transition",
  "transition-duration",
  "transition-delay",
  "animation",
  "animation-duration",
  "animation-delay",
]);

/**
 * Where a time is read: the motion properties, and any custom property that
 * holds one. The --motion- tokens are left to check 11, which reports them.
 */
const holdsTimes = (property: string) =>
  MOTION.has(property) ||
  (property.startsWith("--") && !property.startsWith("--motion-"));

// 4.
const timeLiteral: Check = (property, value) => {
  if (!holdsTimes(property)) return undefined;
  const times = quantities(value).filter(
    ({ amount, unit }) => /^m?s$/i.test(unit) && amount !== 0,
  );
  if (times.length === 0) return undefined;
  return `Time literal ${times.map(({ text }) => text).join(", ")}: use var(--motion-…), alone or in calc(), so keyboard modality and reduced motion can zero it.`;
};

// 5.
const curveLiteral: Check = (_property, value) =>
  /cubic-bezier\(/i.test(value)
    ? "Curve literal: use an easing token, var(--ease-…)."
    : undefined;

const PRESS_TOKEN = String.raw`var\(\s*--press-scale\s*\)`;
/**
 * The arguments of a scale call, each exactly the token. Keyboard modality sets
 * --press-scale to 1, so arithmetic on it, a fallback or a literal second axis
 * would let a press survive it.
 */
const PRESS_ARGUMENTS = new RegExp(
  `^${PRESS_TOKEN}(?:\\s*,\\s*${PRESS_TOKEN})*$`,
);
const PRESS_VALUE = new RegExp(`^${PRESS_TOKEN}$`);
const CSS_WIDE = /^(?:inherit|initial|unset|revert|revert-layer)$/i;

// 7.
const pressScale: Check = (property, value, { pressed }) => {
  if (!pressed) return undefined;
  let loose: string[] = [];
  if (property === "transform")
    loose = calls(value, "scale(?:x|y|z|3d)?").filter(
      (call) =>
        !PRESS_ARGUMENTS.test(
          call.slice(call.indexOf("(") + 1, call.lastIndexOf(")")),
        ),
    );
  else if (
    property === "scale" &&
    !CSS_WIDE.test(value) &&
    !/^none$/i.test(value) &&
    !PRESS_VALUE.test(value)
  )
    loose = [value];
  if (loose.length === 0) return undefined;
  return `Press scale: ${loose.join(", ")}; every press scales by scale(var(--press-scale)) and by nothing else.`;
};

// 8.
const lineHeight: Check = (property, value) => {
  if (property !== "line-height") return undefined;
  if (/^(?:0|1|inherit|normal)$/i.test(value)) return undefined;
  if (/^var\(\s*--(?:line-height|leading-[\w-]+)\s*\)$/.test(value))
    return undefined;
  return `Line height ${value}: use var(--leading-…), var(--line-height), 1, 0, inherit or normal.`;
};

// 9.
const fontWeight: Check = (property, value) => {
  if (property !== "font-weight") return undefined;
  if (/^(?:400|500|600|normal|inherit)$/i.test(value)) return undefined;
  if (/^var\(\s*--weight-[\w-]+\s*\)$/.test(value)) return undefined;
  return `Font weight ${value}: use var(--weight-…), 400, 500, 600, normal or inherit; no other weight is bundled.`;
};

const ZERO = /^[+-]?(?:0+\.?0*|\.0+)(?:[a-z]+|%)?$/i;

// 10.
const letterforms: Check = (property, value, { english }) => {
  if (english) return undefined;
  let found: string | undefined;
  if (
    property === "letter-spacing" &&
    !CSS_WIDE.test(value) &&
    !/^normal$/i.test(value) &&
    !ZERO.test(value)
  )
    found = `letter-spacing ${value}`;
  else if (
    property === "text-transform" &&
    !CSS_WIDE.test(value) &&
    !/^none$/i.test(value)
  )
    found = `text-transform ${value}`;
  else if (property === "font-style" && /^(?:italic|oblique)\b/i.test(value))
    found = `font-style ${value}`;
  if (found === undefined) return undefined;
  return `Arabic letterforms: ${found} is for Latin text only, since tracking, case and slant break Arabic joining; keep it on selectors that are :lang(en).`;
};

// 11.
const localRedefinition: Check = (property) =>
  property === "--press-scale" || property.startsWith("--motion-")
    ? `Local redefinition of ${property}: a component must not set it, or the root rules for keyboard modality and reduced motion cannot reach the component.`
    : undefined;

/** In the order of the checks: 1, 2, 3, 4, 5, 7, 8, 9, 10, 11. Check 6 reads selectors. */
const CHECKS: readonly Check[] = [
  colorLiteral,
  fontSize,
  radius,
  timeLiteral,
  curveLiteral,
  pressScale,
  lineHeight,
  fontWeight,
  letterforms,
  localRedefinition,
];

/** The checks for what the `font` shorthand sets. */
const FONT_CHECKS: readonly Check[] = [
  fontSize,
  lineHeight,
  fontWeight,
  letterforms,
];

// ---------------------------------------------------------------------------
// The font shorthand

const SYSTEM_FONT =
  /^(?:caption|icon|menu|message-box|small-caption|status-bar)$/i;
const FONT_FILLER =
  /^(?:normal|small-caps|(?:ultra-|extra-|semi-)?(?:condensed|expanded))$/i;

/** A weight before the size: a keyword, a --weight token or a positive number. */
const isWeight = (part: string) =>
  /^(?:bold|bolder|lighter)$/i.test(part) ||
  /^var\(\s*--weight-/.test(part) ||
  (/^(?:\d+\.?\d*|\.\d+)$/.test(part) && parseFloat(part) > 0);

/**
 * What a `font` shorthand sets, as longhands: `[style] [variant] [weight]
 * [stretch] size[/leading] family`. The size is the first token that is none of
 * the optional ones before it. `inherit` and the system fonts set nothing here.
 */
function fontLonghands(value: string): [property: string, value: string][] {
  const parts = tokens(value);
  if (
    parts.length === 1 &&
    (CSS_WIDE.test(parts[0]) || SYSTEM_FONT.test(parts[0]))
  )
    return [];
  const longhands: [string, string][] = [];
  let at = 0;
  for (; at < parts.length; at += 1) {
    const part = parts[at];
    if (FONT_FILLER.test(part)) continue;
    if (/^(?:italic|oblique)$/i.test(part)) {
      longhands.push(["font-style", part]);
      continue;
    }
    if (isWeight(part)) {
      longhands.push(["font-weight", part]);
      continue;
    }
    if (/^[+-]?\d*\.?\d+(?:deg|grad|rad|turn)$/i.test(part)) continue; // oblique 10deg
    break;
  }
  if (at < parts.length) {
    longhands.push(["font-size", parts[at]]);
    if (parts[at + 1] === "/" && parts[at + 2] !== undefined)
      longhands.push(["line-height", parts[at + 2]]);
  }
  return longhands;
}

// ---------------------------------------------------------------------------
// The audit

interface FamilyRule {
  rule: Rule;
  /** The rule's selectors that name the family. */
  selectors: string[];
  /** The prefixes those selectors name. */
  named: Set<string>;
}

/** Native CSS nesting would hide declarations from the walk, so it is refused. */
function checkFlat(rule: Rule) {
  const nested = rule.nodes.find(
    (child) =>
      child.type === "rule" || (child.type === "atrule" && child.nodes),
  );
  if (nested)
    throw new Error(
      `css-audit: ${rule.selector} contains a nested rule; the audit reads flat CSS only`,
    );
}

function familyRules(css: string, prefixes: readonly string[]): FamilyRule[] {
  checkPrefixes(prefixes);
  const found: FamilyRule[] = [];
  parse(css).walkRules((rule) => {
    checkFlat(rule);
    const selectors: string[] = [];
    const named = new Set<string>();
    for (const selector of rule.selectors.map(squash)) {
      const text = blank(selector);
      const hits = prefixes.filter((prefix) => namesClass(text, prefix));
      if (hits.length === 0) continue;
      selectors.push(selector);
      for (const prefix of hits) named.add(prefix);
    }
    if (selectors.length > 0) found.push({ rule, selectors, named });
  });
  return found;
}

/** How many rules of `css` belong to the family: zero means the prefixes match nothing. */
export function familyRuleCount(
  css: string,
  prefixes: readonly string[],
): number {
  return familyRules(css, prefixes).length;
}

/**
 * The prefixes of the family that no rule names. A family that owns rules as a
 * whole can still hold one misspelled prefix, which would audit nothing, so the
 * registry test asks every prefix on its own.
 */
export function unmatchedPrefixes(
  css: string,
  prefixes: readonly string[],
): string[] {
  const owned = familyRules(css, prefixes);
  return prefixes.filter(
    (prefix) => !owned.some(({ named }) => named.has(prefix)),
  );
}

export function auditFamily(
  css: string,
  prefixes: readonly string[],
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  for (const { rule, selectors } of familyRules(css, prefixes)) {
    const selector = selectors.join(", ");
    const media = mediaOf(rule);
    const where = whereIs(rule, media.conditions);
    const add = (property: string, value: string, message: string) =>
      issues.push({ selector, property, value, message: message + where });

    // 6.
    const hovered = selectors.filter(isHover);
    if (hovered.length > 0 && !media.hoverGated)
      add(
        ":hover",
        hovered.join(", "),
        "Hover gating: a :hover rule must sit inside @media (hover: hover) and (pointer: fine), so touch screens never see a stuck hover.",
      );

    const context: Context = {
      forcedColors: media.forcedColors,
      pressed: selectors.some(isPress),
      english: selectors.every(isEnglish),
    };
    for (const node of rule.nodes) {
      if (node.type !== "decl") continue;
      const property = node.prop.startsWith("--")
        ? node.prop
        : node.prop.toLowerCase();
      const value = squash(node.value);
      const text = blank(value);
      for (const check of CHECKS) {
        const message = check(property, text, context);
        if (message !== undefined) add(node.prop, value, message);
      }
      if (property !== "font") continue;
      for (const [longhand, part] of fontLonghands(text))
        for (const check of FONT_CHECKS) {
          const message = check(longhand, part, context);
          if (message !== undefined) add(node.prop, value, message);
        }
    }
  }
  return issues;
}
