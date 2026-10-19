import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import {
  auditFamily,
  familyRuleCount,
  unmatchedPrefixes,
  type AuditIssue,
} from "./css-audit";
import { wovenFamilies } from "./css-audit.families";

// Self-tests for the Woven CSS audit, then the audit itself on every registered
// family. The audit reads CSS with postcss and holds the rules of one component
// family to the Woven visual rules; css-audit.ts lists the eleven checks. Each
// check has a fixture that breaks it exactly once and fixtures that must stay
// clean, so a check can neither miss its violation nor fire on the allowed form.

/** Audits `css` as the family `.tz-demo`. */
const audit = (css: string) => auditFamily(css, [".tz-demo"]);

/** One rule of the family under audit. */
const demo = (declarations: string) => `.tz-demo { ${declarations} }`;

/** Rules wrapped in the gate for a mouse or trackpad, as the audit wants them. */
const gated = (rules: string) =>
  `@media (hover: hover) and (pointer: fine) { ${rules} }`;

/** The start of each check's message, which tells the checks apart. */
const label: Record<number, RegExp> = {
  1: /^Color literal/,
  2: /^Font size/,
  3: /^Radius/,
  4: /^Time literal/,
  5: /^Curve literal/,
  6: /^Hover gating/,
  7: /^Press scale/,
  8: /^Line height/,
  9: /^Font weight/,
  10: /^Arabic letterforms/,
  11: /^Local redefinition/,
};

// ---------------------------------------------------------------------------
// Fixtures. A violation row is a rule that breaks one check exactly once.

/** [check, case, declaration]: a rule holding only this declaration. */
type DeclarationRow = [check: number, name: string, declaration: string];

/** [check, case, css, selector, property, value]: where the context matters. */
type RuleRow = [
  check: number,
  name: string,
  css: string,
  selector: string,
  property: string,
  value: string,
];

/** [check, case, css]: a rule the check must leave alone. */
type AllowedRow = [check: number, name: string, css: string];

const declarationViolations: DeclarationRow[] = [
  // 1. Color literals.
  [1, "a 3-digit hex color", "color: #fff"],
  [1, "a 6-digit hex color", "background: #1a2b3c"],
  [1, "a hex color with alpha", "border-color: #12231a14"],
  [1, "rgb()", "color: rgb(18 35 26 / 7%)"],
  [1, "rgba()", "color: rgba(0, 0, 0, 0.5)"],
  [1, "hsl()", "color: hsl(120 40% 50%)"],
  [1, "hsla()", "color: hsla(120, 40%, 50%, 0.5)"],
  [1, "oklch()", "color: oklch(0.6 0.1 150)"],
  [1, "oklab()", "color: oklab(0.6 0.1 0.1)"],
  [1, "lab(), the same family of notations", "color: lab(50% 40 59)"],
  [1, "lch()", "color: lch(50% 40 59)"],
  [1, "hwb()", "color: hwb(120 10% 20%)"],
  [1, "color()", "color: color(display-p3 1 0 0)"],
  [1, "the keyword white", "background: white"],
  [1, "the keyword black, in any case", "fill: Black"],
  [1, "a literal inside a shadow", "box-shadow: 0 0 0 1px rgb(18 35 26 / 7%)"],
  [
    1,
    "a literal inside a gradient",
    "background: linear-gradient(to right, #fff, transparent)",
  ],
  [1, "a literal as a var() fallback", "color: var(--text, #232a26)"],
  [1, "a literal in a custom property", "--chip-background: #eee"],
  [
    1,
    "a keyword inside color-mix()",
    "background: color-mix(in srgb, var(--action), black 12%)",
  ],
  [1, "several literals in one value", "box-shadow: 0 1px #000, 0 2px #fff"],

  // 2. Font size.
  [2, "a pixel size", "font-size: 13px"],
  [2, "a property written in capitals", "FONT-SIZE: 13px"],
  [2, "a rem size", "font-size: 0.875rem"],
  [2, "an em other than 1", "font-size: 0.9em"],
  [2, "a percentage", "font-size: 100%"],
  [2, "a size keyword", "font-size: smaller"],
  [2, "zero", "font-size: 0"],
  [2, "calc() around a token", "font-size: calc(var(--text-body) + 2px)"],
  [2, "max() around a token", "font-size: max(16px, var(--text-body))"],
  [2, "a literal fallback", "font-size: var(--text-body, 14px)"],
  [2, "a token from another scale", "font-size: var(--size-body)"],
  [2, "a literal size in the font shorthand", "font: 11px var(--font-mono)"],
  [2, "a percentage size in the font shorthand", "font: 100% var(--font)"],
  [2, "a zero size in the font shorthand", "font: 0 var(--font)"],
  [
    2,
    "a calc() size with spaces and a slash inside",
    "font: calc(var(--text-label) / 2) / var(--leading-meta) var(--font)",
  ],
  [
    2,
    "a literal size after a weight token",
    "font: var(--weight-medium) 11px / 1 var(--font)",
  ],

  // 3. Radius.
  [3, "a pixel radius", "border-radius: 6px"],
  [3, "a pill written as 100px", "border-radius: 100px"],
  [3, "a pill written as 999px", "border-radius: 999px"],
  [3, "a rem radius", "border-radius: 0.5rem"],
  [3, "a percentage other than 50", "border-radius: 25%"],
  [3, "the raw base radius", "border-radius: var(--radius)"],
  [
    3,
    "the raw base radius in calc()",
    "border-radius: calc(var(--radius) * 0.5)",
  ],
  [
    3,
    "a length added to a named token",
    "border-radius: calc(var(--radius-panel) + 4px)",
  ],
  [
    3,
    "the raw radius plus a length, which is still one issue",
    "border-radius: calc(var(--radius) + 2px)",
  ],
  [
    3,
    "a length in one corner",
    "border-radius: var(--radius-small) var(--radius-small) 6px 6px",
  ],
  [3, "an elliptical radius", "border-radius: 8px / 4px"],
  [3, "a literal fallback", "border-radius: var(--radius-small, 4px)"],
  [3, "a corner property", "border-top-left-radius: 4px"],
  [3, "a logical corner property", "border-start-start-radius: 2px"],
  [
    3,
    "a logical corner with the raw radius",
    "border-end-end-radius: var(--radius)",
  ],
  [
    3,
    "a unitless factor on a named token",
    "border-radius: calc(var(--radius-control) * 0.5)",
  ],
  [
    3,
    "a factor of 1, which is not 0",
    "border-radius: calc(var(--radius-paper) * 1)",
  ],
  [
    3,
    "a bare 50, which is not 50%",
    "border-radius: calc(var(--radius-small) * 50)",
  ],
  [
    3,
    "a size token added to a named token",
    "border-radius: calc(var(--radius-paper) + var(--space-2))",
  ],
  [3, "a size token as the radius", "border-radius: var(--control-height)"],
  [3, "a size token halved", "border-radius: calc(var(--control-small) / 2)"],
  [3, "a radius name outside the scale", "border-radius: var(--radius-huge)"],
  [
    3,
    "a token as the fallback of a token",
    "border-radius: var(--radius-small, var(--radius-item))",
  ],
  [3, "a var() in capitals", "border-radius: VAR(--radius-huge)"],
  [3, "a radius name that holds digits", "border-radius: var(--radius-2xl)"],
  [
    3,
    "a logical corner with a name outside the scale",
    "border-end-end-radius: var(--radius-huge)",
  ],

  // 4. Times, including offsets inside calc().
  [4, "a decimal seconds time", "transition: opacity 0.2s var(--ease-out)"],
  [4, "a seconds time without a leading zero", "transition: opacity .2s"],
  [4, "a literal duration", "transition-duration: 150ms"],
  [4, "a literal delay", "transition-delay: 40ms"],
  [4, "an animation time", "animation: tz-spin 1s linear infinite"],
  [
    4,
    "a literal beside an animation name that holds digits",
    "animation: tz-fade-2s 2s both",
  ],
  [4, "an animation duration", "animation-duration: 300ms"],
  [4, "a negative animation delay", "animation-delay: -0.5s"],
  [
    4,
    "a literal added to a token inside calc()",
    "transition: transform calc(var(--motion-enter) + 60ms) var(--ease-out)",
  ],
  [
    4,
    "a literal taken from a token inside calc()",
    "transition: transform calc(var(--motion-state) - 20ms) var(--ease-out)",
  ],
  [
    4,
    "a literal factor inside calc()",
    "animation-delay: calc(var(--option-index, 0) * 40ms)",
  ],
  [
    4,
    "a literal delay after a token duration",
    "transition: opacity var(--motion-state) var(--ease-out) 40ms",
  ],
  [4, "a literal fallback", "transition-duration: var(--motion-state, 200ms)"],
  [
    4,
    "several literals in one value",
    "transition: opacity 100ms, transform 200ms",
  ],
  [4, "a literal time in a custom property", "--delay: 120ms"],
  [
    4,
    "a literal inside calc() in a custom property",
    "--shift: calc(var(--motion-state) + 60ms)",
  ],
  [4, "a whole transition in a custom property", "--fade: opacity 0.2s"],
  [
    4,
    "a custom property that only starts like a motion token",
    "--motionless: 1s",
  ],

  // 5. Curves.
  [
    5,
    "a timing function",
    "transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1)",
  ],
  [
    5,
    "a curve in the shorthand",
    "transition: transform var(--motion-press) cubic-bezier(0.23, 1, 0.32, 1)",
  ],
  [
    5,
    "an animation timing function",
    "animation-timing-function: cubic-bezier(0.2, 0, 0, 1)",
  ],
  [
    5,
    "a curve in any case",
    "transition-timing-function: CUBIC-BEZIER(0.2, 0, 0, 1)",
  ],
  [5, "a curve in a custom property", "--curve: cubic-bezier(0.2, 0, 0, 1)"],

  // 8. Line height.
  [8, "a unitless leading", "line-height: 1.5"],
  [8, "a length", "line-height: 20px"],
  [8, "a percentage", "line-height: 150%"],
  [8, "an em", "line-height: 1.6em"],
  [8, "calc()", "line-height: calc(1em + 4px)"],
  [8, "a literal fallback", "line-height: var(--leading-meta, 1.6)"],
  [8, "a token from another scale", "line-height: var(--control-height)"],
  [
    8,
    "a literal leading in the font shorthand",
    "font: var(--text-meta)/1.6 var(--font-mono)",
  ],
  [
    8,
    "a literal leading after a spaced slash",
    "font: var(--text-meta) / 1.8 var(--font-mono)",
  ],

  // 9. Font weight.
  [9, "a bold number", "font-weight: 700"],
  [9, "a light number", "font-weight: 300"],
  [9, "bold", "font-weight: bold"],
  [9, "bolder", "font-weight: bolder"],
  [9, "a literal fallback", "font-weight: var(--weight-bold, 700)"],
  [9, "a token from another scale", "font-weight: var(--emphasis)"],
  [
    9,
    "a bold keyword in the font shorthand",
    "font: bold var(--text-label) var(--font)",
  ],
  [
    9,
    "a bold number in the font shorthand",
    "font: 700 var(--text-label) var(--font)",
  ],

  // 10. Arabic letterforms, on a rule that is not English-only.
  [10, "letter-spacing in em", "letter-spacing: 0.04em"],
  [10, "negative letter-spacing", "letter-spacing: -0.01em"],
  [10, "letter-spacing in px", "letter-spacing: 1px"],
  [10, "uppercase", "text-transform: uppercase"],
  [10, "lowercase", "text-transform: lowercase"],
  [10, "capitalize", "text-transform: capitalize"],
  [10, "italic", "font-style: italic"],
  [10, "oblique", "font-style: oblique"],
  [10, "oblique with an angle", "font-style: oblique 10deg"],
  [
    10,
    "oblique with an angle in the font shorthand",
    "font: oblique 10deg var(--text-label) var(--font)",
  ],
  [
    10,
    "italic in the font shorthand",
    "font: italic var(--text-label) var(--font)",
  ],

  // 11. Local redefinitions of the root's motion tokens.
  [11, "--press-scale", "--press-scale: 0.94"],
  [11, "--press-scale, even the keyboard value", "--press-scale: 1"],
  [11, "a duration token", "--motion-state: 150ms"],
  [11, "a duration token, even zero", "--motion-press: 0ms"],
  [
    11,
    "a duration token set from another",
    "--motion-fast: var(--motion-state)",
  ],
  [11, "a loop token", "--motion-loop-turn: 2s"],
];

const ruleViolations: RuleRow[] = [
  // 6. Hover gating.
  [
    6,
    "a hover rule outside any gate",
    ".tz-demo:hover { background: var(--wash) }",
    ".tz-demo:hover",
    ":hover",
    ".tz-demo:hover",
  ],
  [
    6,
    "a hover in a descendant selector",
    ".tz-demo:hover .tz-demo-label { color: var(--text) }",
    ".tz-demo:hover .tz-demo-label",
    ":hover",
    ".tz-demo:hover .tz-demo-label",
  ],
  [
    6,
    "a hover on an ancestor of the family",
    ".other:hover .tz-demo-label { color: var(--text) }",
    ".other:hover .tz-demo-label",
    ":hover",
    ".other:hover .tz-demo-label",
  ],
  [
    6,
    "a hover under (hover: hover) alone",
    "@media (hover: hover) { .tz-demo:hover { background: var(--wash) } }",
    ".tz-demo:hover",
    ":hover",
    ".tz-demo:hover",
  ],
  [
    6,
    "a hover under (pointer: fine) alone",
    "@media (pointer: fine) { .tz-demo:hover { background: var(--wash) } }",
    ".tz-demo:hover",
    ":hover",
    ".tz-demo:hover",
  ],
  [
    6,
    "a hover under either condition",
    "@media (hover: hover) or (pointer: fine) { .tz-demo:hover { background: var(--wash) } }",
    ".tz-demo:hover",
    ":hover",
    ".tz-demo:hover",
  ],
  [
    6,
    "a hover under a negated query",
    "@media not (hover: none) { .tz-demo:hover { background: var(--wash) } }",
    ".tz-demo:hover",
    ":hover",
    ".tz-demo:hover",
  ],
  [
    6,
    "a hover under the any- variants",
    "@media (any-hover: hover) and (any-pointer: fine) { .tz-demo:hover { background: var(--wash) } }",
    ".tz-demo:hover",
    ":hover",
    ".tz-demo:hover",
  ],
  [
    6,
    "a hover under an unrelated query",
    "@media (min-width: 600px) { .tz-demo:hover { background: var(--wash) } }",
    ".tz-demo:hover",
    ":hover",
    ".tz-demo:hover",
  ],
  [
    6,
    "several hovered selectors, which are still one issue",
    ".tz-demo:hover, .tz-demo-label:hover { background: var(--wash) }",
    ".tz-demo:hover, .tz-demo-label:hover",
    ":hover",
    ".tz-demo:hover, .tz-demo-label:hover",
  ],
  [
    6,
    "a hover on the family selector of a mixed list",
    ".tz-demo:hover, .other { background: var(--wash) }",
    ".tz-demo:hover",
    ":hover",
    ".tz-demo:hover",
  ],

  // 7. Press scale.
  [
    7,
    "a literal scale under :active",
    ".tz-demo:active { transform: scale(0.97) }",
    ".tz-demo:active",
    "transform",
    "scale(0.97)",
  ],
  [
    7,
    "a literal scale without a leading zero",
    ".tz-demo:active { transform: scale(.97) }",
    ".tz-demo:active",
    "transform",
    "scale(.97)",
  ],
  [
    7,
    "a literal scale under [data-pressed]",
    ".tz-demo[data-pressed] { transform: scale(0.97) }",
    ".tz-demo[data-pressed]",
    "transform",
    "scale(0.97)",
  ],
  [
    7,
    "a literal scale under [data-pressed] with a value",
    '.tz-demo[data-pressed="true"] { transform: scale(0.97) }',
    '.tz-demo[data-pressed="true"]',
    "transform",
    "scale(0.97)",
  ],
  [
    7,
    "a growth on press",
    ".tz-demo:not(:disabled):active { transform: scale(1.06) }",
    ".tz-demo:not(:disabled):active",
    "transform",
    "scale(1.06)",
  ],
  [
    7,
    "a literal scale among other transforms",
    ".tz-demo:active { transform: translateY(1px) scale(0.97) }",
    ".tz-demo:active",
    "transform",
    "translateY(1px) scale(0.97)",
  ],
  [
    7,
    "a two-argument scale",
    ".tz-demo:active { transform: scale(0.97, 0.97) }",
    ".tz-demo:active",
    "transform",
    "scale(0.97, 0.97)",
  ],
  [
    7,
    "scaleX()",
    ".tz-demo:active { transform: scaleX(0.9) }",
    ".tz-demo:active",
    "transform",
    "scaleX(0.9)",
  ],
  [
    7,
    "the scale property",
    ".tz-demo:active { scale: 0.97 }",
    ".tz-demo:active",
    "scale",
    "0.97",
  ],
  [
    7,
    "a scale that does not come from --press-scale",
    ".tz-demo:active { transform: scale(var(--my-scale)) }",
    ".tz-demo:active",
    "transform",
    "scale(var(--my-scale))",
  ],
  [
    7,
    "one scale of two that lacks the token",
    ".tz-demo:active { transform: scale(0.9) scale(var(--press-scale)) }",
    ".tz-demo:active",
    "transform",
    "scale(0.9) scale(var(--press-scale))",
  ],
  [
    7,
    "arithmetic on the token",
    ".tz-demo:active { transform: scale(calc(var(--press-scale) * 0.97)) }",
    ".tz-demo:active",
    "transform",
    "scale(calc(var(--press-scale) * 0.97))",
  ],
  [
    7,
    "subtraction from the token",
    ".tz-demo:active { transform: scale(calc(var(--press-scale) - 0.03)) }",
    ".tz-demo:active",
    "transform",
    "scale(calc(var(--press-scale) - 0.03))",
  ],
  [
    7,
    "a scale derived from the token",
    ".tz-demo:active { transform: scale(calc(var(--press-scale) * 1.02)) }",
    ".tz-demo:active",
    "transform",
    "scale(calc(var(--press-scale) * 1.02))",
  ],
  [
    7,
    "a literal second axis beside the token",
    ".tz-demo:active { transform: scale(var(--press-scale), 1) }",
    ".tz-demo:active",
    "transform",
    "scale(var(--press-scale), 1)",
  ],
  [
    7,
    "the token after a nested group",
    ".tz-demo:active { transform: scale(calc(1 + 0), var(--press-scale)) }",
    ".tz-demo:active",
    "transform",
    "scale(calc(1 + 0), var(--press-scale))",
  ],
  [
    7,
    "a literal third axis beside the token",
    ".tz-demo:active { transform: scale3d(var(--press-scale), var(--press-scale), 1) }",
    ".tz-demo:active",
    "transform",
    "scale3d(var(--press-scale), var(--press-scale), 1)",
  ],
  [
    7,
    "the token with a fallback",
    ".tz-demo:active { transform: scale(var(--press-scale, 0.97)) }",
    ".tz-demo:active",
    "transform",
    "scale(var(--press-scale, 0.97))",
  ],
  [
    7,
    "the scale property with a literal second value",
    ".tz-demo:active { scale: var(--press-scale) 1 }",
    ".tz-demo:active",
    "scale",
    "var(--press-scale) 1",
  ],
  [
    7,
    "the scale property with arithmetic",
    ".tz-demo:active { scale: calc(var(--press-scale) * 0.97) }",
    ".tz-demo:active",
    "scale",
    "calc(var(--press-scale) * 0.97)",
  ],
  [
    7,
    "a press selector earlier in the selector",
    ".tz-demo:active .tz-demo-icon { transform: scale(0.9) }",
    ".tz-demo:active .tz-demo-icon",
    "transform",
    "scale(0.9)",
  ],
  [
    7,
    "a literal scale inside a media query",
    "@media not (forced-colors: active) { .tz-demo:active { transform: scale(1.12) } }",
    ".tz-demo:active",
    "transform",
    "scale(1.12)",
  ],

  // 10. Arabic letterforms: only a rule that is English throughout is exempt.
  [
    10,
    "tracking on a selector list that is only partly English",
    ".tz-demo:lang(en), .tz-demo-label { letter-spacing: 0.1em }",
    ".tz-demo:lang(en), .tz-demo-label",
    "letter-spacing",
    "0.1em",
  ],
  [
    10,
    "tracking on another language",
    ".tz-demo:lang(ar) { text-transform: uppercase }",
    ".tz-demo:lang(ar)",
    "text-transform",
    "uppercase",
  ],
  [
    10,
    "tracking on everything but English",
    ".tz-demo:not(:lang(en)) { letter-spacing: 0.1em }",
    ".tz-demo:not(:lang(en))",
    "letter-spacing",
    "0.1em",
  ],
  [
    10,
    "tracking on a negation whose parentheses nest",
    ".tz-demo:not(:is(.a):lang(en)) { letter-spacing: 0.1em }",
    ".tz-demo:not(:is(.a):lang(en))",
    "letter-spacing",
    "0.1em",
  ],
];

const allowed: AllowedRow[] = [
  // 1. Color literals.
  [
    1,
    "transparent, currentColor and inherit",
    demo("color: currentColor; background: transparent; border-color: inherit"),
  ],
  [1, "color tokens", demo("color: var(--text); background: var(--surface)")],
  [
    1,
    "color-mix() of tokens",
    demo("background: color-mix(in srgb, var(--text) 4%, transparent)"),
  ],
  [
    1,
    "system colors",
    demo(
      "border-color: ButtonText; outline-color: Highlight; color: CanvasText",
    ),
  ],
  [1, "a hex-like fragment inside url()", demo("mask: url(#fade)")],
  [
    1,
    "color words inside strings, urls and names",
    demo(
      `content: "white #fff"; background-image: url("data:image/svg+xml,%3Csvg fill='white'/%3E"); animation-name: white-flash; font-family: "Black Ops One"`,
    ),
  ],
  [
    1,
    "tokens whose names contain a color word",
    demo("color: var(--white); background: var(--color-black)"),
  ],

  // 2. Font size.
  [
    2,
    "text tokens, inherit and 1em",
    demo(
      "font-size: var(--text-label); font-size: var(--text-figure-small); font-size: inherit; font-size: 1em",
    ),
  ],
  [
    2,
    "CSS-wide and system keywords as the font shorthand",
    demo("font: inherit; font: initial; font: unset; font: menu"),
  ],
  [
    2,
    "keywords before the size in the font shorthand",
    demo(
      "font: normal small-caps var(--weight-medium) semi-condensed var(--text-label) var(--font)",
    ),
  ],
  [
    2,
    "a size and a family alone in the font shorthand",
    demo("font: var(--text-label) var(--font)"),
  ],
  [
    2,
    "tokens in the font shorthand",
    demo(
      "font: var(--weight-medium) var(--text-label)/var(--leading-meta) var(--font)",
    ),
  ],

  // 3. Radius.
  [
    3,
    "every named radius token",
    demo(
      "border-radius: var(--radius-small); border-radius: var(--radius-item); border-radius: var(--radius-control); border-radius: var(--radius-paper); border-radius: var(--radius-tray); border-radius: var(--radius-pill); border-radius: var(--radius-panel)",
    ),
  ],
  [
    3,
    "the concentric inner corners of paper and tray",
    demo(
      "border-radius: calc(var(--radius-paper) - var(--tray-pad)); border-radius: calc(var(--radius-tray) - var(--tray-pad))",
    ),
  ],
  [
    3,
    "50%, 0 and inherit",
    demo(
      "border-radius: 50%; border-radius: 0; border-radius: 0px; border-radius: inherit",
    ),
  ],
  [
    3,
    "tokens with zero corners",
    demo("border-radius: var(--radius-small) var(--radius-small) 0 0"),
  ],
  [
    3,
    "logical corners",
    demo(
      "border-start-start-radius: inherit; border-end-end-radius: var(--radius-small)",
    ),
  ],

  // 4. Times.
  [
    4,
    "motion tokens",
    demo(
      "transition: opacity var(--motion-state) var(--ease-out), transform var(--motion-press) var(--ease-out)",
    ),
  ],
  [4, "none", demo("transition: none; animation: none")],
  [
    4,
    "zero in either unit",
    demo(
      "transition-duration: 0ms; transition-delay: 0s; transition: opacity 0s",
    ),
  ],
  [
    4,
    "tokens inside calc()",
    demo(
      "transition: transform calc(var(--motion-enter) + var(--motion-exit)) var(--ease-out); animation-delay: calc(var(--option-index, 0) * var(--motion-stagger))",
    ),
  ],
  [
    4,
    "an animation name that holds digits",
    demo("animation: tz-fade-2s var(--motion-state) both"),
  ],
  [
    4,
    "custom properties without a literal time",
    demo(
      "--delay: 0s; --stagger: calc(var(--option-index, 0) * var(--motion-stagger)); --gap: 4px; --count: 3",
    ),
  ],
  [
    4,
    "a loop with a keyword curve",
    demo("animation: tz-spin var(--motion-loop-turn) linear infinite"),
  ],
  [
    4,
    "an iteration count and a stepped curve",
    demo("animation: tz-tick var(--motion-loop-stitch) steps(8, end) 3 both"),
  ],

  // 5. Curves.
  [5, "easing tokens", demo("transition-timing-function: var(--ease-out)")],
  [
    5,
    "linear and steps()",
    demo(
      "animation-timing-function: linear; animation-timing-function: steps(4, end)",
    ),
  ],

  // 6. Hover gating.
  [
    6,
    "a hover rule under the gate",
    gated(".tz-demo:hover { background: var(--wash) }"),
  ],
  [
    6,
    "the gate with its conditions reversed",
    "@media (pointer: fine) and (hover: hover) { .tz-demo:hover { background: var(--wash) } }",
  ],
  [
    6,
    "the gate with other spacing and case",
    "@MEDIA ( Hover : Hover ) AND ( Pointer:Fine ) { .tz-demo:hover { background: var(--wash) } }",
  ],
  [
    6,
    "the gate with a media type",
    "@media screen and (hover: hover) and (pointer: fine) { .tz-demo:hover { background: var(--wash) } }",
  ],
  [
    6,
    "the gate with another condition",
    "@media (hover: hover) and (pointer: fine) and (min-width: 600px) { .tz-demo:hover { background: var(--wash) } }",
  ],
  [
    6,
    "the gate inside @supports",
    `@supports (color: red) { ${gated(".tz-demo:hover { background: var(--wash) }")} }`,
  ],
  [
    6,
    "the gate inside a negated forced-colors query",
    `@media not (forced-colors: active) { ${gated(".tz-demo:hover { background: var(--wash) }")} }`,
  ],
  [
    6,
    "another query inside the gate",
    gated(
      "@media (min-width: 600px) { .tz-demo:hover { background: var(--wash) } }",
    ),
  ],
  [
    6,
    "a hover on a selector of the list outside the family",
    ".tz-demo, .other:hover { background: var(--wash) }",
  ],

  // 7. Press scale.
  [
    7,
    "scale(var(--press-scale)) under :active",
    ".tz-demo:active { transform: scale(var(--press-scale)) }",
  ],
  [
    7,
    "scale(var(--press-scale)) under [data-pressed]",
    ".tz-demo[data-pressed] { transform: scale(var(--press-scale)) }",
  ],
  [
    7,
    "the token among other transforms",
    ".tz-demo:active { transform: translateY(1px) scale(var(--press-scale)) }",
  ],
  [
    7,
    "the scale property from the token",
    ".tz-demo:active { scale: var(--press-scale) }",
  ],
  [
    7,
    "every axis of scale3d() from the token",
    ".tz-demo:active { transform: scale3d(var(--press-scale), var(--press-scale), var(--press-scale)) }",
  ],
  [
    7,
    "a press with no scale",
    ".tz-demo:active { transform: translateY(1px); scale: none; scale: unset }",
  ],
  [
    7,
    "a scale outside a press selector",
    '.tz-demo[data-state="open"] { transform: scale(0.96) }',
  ],

  // 8. Line height.
  [
    8,
    "leading tokens",
    demo("line-height: var(--leading-title); line-height: var(--line-height)"),
  ],
  [
    8,
    "1, 0, inherit and normal",
    demo(
      "line-height: 1; line-height: 0; line-height: inherit; line-height: normal",
    ),
  ],
  [
    8,
    "leading in the font shorthand",
    demo("font: var(--text-meta)/1 var(--font-mono)"),
  ],

  // 9. Font weight.
  [
    9,
    "weight tokens",
    demo(
      "font-weight: var(--weight-regular); font-weight: var(--weight-medium); font-weight: var(--weight-semibold)",
    ),
  ],
  [
    9,
    "the bundled weights",
    demo("font-weight: 400; font-weight: 500; font-weight: 600"),
  ],
  [9, "normal and inherit", demo("font-weight: normal; font-weight: inherit")],

  // 10. Arabic letterforms.
  [
    10,
    "no tracking",
    demo(
      "letter-spacing: 0; letter-spacing: 0px; letter-spacing: 0em; letter-spacing: normal",
    ),
  ],
  [
    10,
    "no transform and no slant",
    demo("text-transform: none; font-style: normal"),
  ],
  [
    10,
    "CSS-wide keywords, which add nothing of their own",
    demo(
      "letter-spacing: inherit; text-transform: inherit; font-style: inherit",
    ),
  ],
  [
    10,
    "tracking, uppercase and italic under :lang(en)",
    ".tz-demo-eyebrow:lang(en) { letter-spacing: 0.08em; text-transform: uppercase; font-style: italic }",
  ],
  [
    10,
    "a regional English tag",
    ".tz-demo:lang(en-US) { letter-spacing: 0.08em }",
  ],
  [
    10,
    "a quoted English tag",
    '.tz-demo:lang("en") { letter-spacing: 0.08em }',
  ],
  [
    10,
    ":lang(en) on an ancestor",
    ":lang(en) .tz-demo { letter-spacing: 0.08em }",
  ],
  [
    10,
    "a list in which every selector is English",
    ".tz-demo:lang(en), .tz-demo-label:lang(en) { letter-spacing: 0.08em }",
  ],

  // 11. Local redefinitions.
  [11, "a fixed size on the component", demo("--status-size: 18px")],
  [
    11,
    "other custom properties, even near the reserved names",
    demo("--tz-demo-gap: 4px; --option-index: 2; --motionless: 1"),
  ],
  [
    11,
    "custom properties are case-sensitive",
    demo("--Press-Scale: 1; --Motion-state: 1"),
  ],
  [
    11,
    "reading the tokens",
    demo(
      "transform: scale(var(--press-scale)); transition: opacity var(--motion-state)",
    ),
  ],
];

// ---------------------------------------------------------------------------
// The checks

it.each(declarationViolations)(
  "check %i flags %s exactly once",
  (check, _name, declaration) => {
    const at = declaration.indexOf(":");
    expect(audit(demo(declaration))).toEqual([
      {
        selector: ".tz-demo",
        property: declaration.slice(0, at),
        value: declaration.slice(at + 1).trim(),
        message: expect.stringMatching(label[check]),
      },
    ]);
  },
);

it.each(ruleViolations)(
  "check %i flags %s exactly once",
  (check, _name, css, selector, property, value) => {
    expect(audit(css)).toEqual([
      {
        selector,
        property,
        value,
        message: expect.stringMatching(label[check]),
      },
    ]);
  },
);

it.each(allowed)("check %i allows %s", (_check, _name, css) => {
  expect(audit(css)).toEqual([]);
});

it("has a violation and a clean fixture for each of the eleven checks", () => {
  const checks = (rows: [number, ...unknown[]][]) => [
    ...new Set(rows.map(([check]) => check)),
  ];
  const all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  expect(
    checks([...declarationViolations, ...ruleViolations]).sort((a, b) => a - b),
  ).toEqual(all);
  expect(checks(allowed).sort((a, b) => a - b)).toEqual(all);
});

it("names the literals it found, so a long value can be fixed from the message", () => {
  // In the order of the value, and a repeated literal once.
  const [color] = audit(
    demo("box-shadow: 0 1px rgb(0 0 0 / 50%), 0 2px #000, 0 3px #000"),
  );
  expect(color.message).toMatch(/^Color literal rgb\(\), #000:/);
  // The zero in `opacity 0s` is fine and is not listed with the offenders.
  const [time] = audit(
    demo(
      "transition: opacity 0s, transform calc(var(--motion-state) + 60ms) ease 40ms",
    ),
  );
  expect(time.message).toMatch(/^Time literal 60ms, 40ms:/);
  const [radius] = audit(demo("border-radius: calc(var(--radius) + 2px)"));
  expect(radius.message).toContain(
    "uses the raw var(--radius) and the literal 2px;",
  );
  // Only what is off the scale is named. A name that holds digits is a name,
  // not a number.
  const [offScale] = audit(
    demo("border-radius: calc(var(--radius-paper) + var(--space-2))"),
  );
  expect(offScale.message).toContain(
    "uses var(--space-2), which is not a radius token;",
  );
  const [factor] = audit(
    demo("border-radius: calc(var(--radius-control) * 0.5)"),
  );
  expect(factor.message).toContain("uses the literal 0.5;");
  const [pair] = audit(demo("border-radius: 2px 3px"));
  expect(pair.message).toContain("uses the literals 2px, 3px;");
  const [digits] = audit(demo("border-radius: var(--radius-2xl)"));
  expect(digits.message).toContain(
    "uses var(--radius-2xl), which is not a radius token;",
  );
});

it("reports one issue for each check a declaration breaks", () => {
  const issues = audit(
    demo("transition: opacity 200ms cubic-bezier(0.2, 0, 0, 1)"),
  );
  expect(issues.map((issue) => issue.message)).toEqual([
    expect.stringMatching(label[4]),
    expect.stringMatching(label[5]),
  ]);
});

it("reports each violation once, in source order", () => {
  const css = `
.tz-demo { color: #fff; font-size: 13px }
.tz-demo-label { border-radius: 6px }
${gated(".tz-demo-label:hover { transition: opacity 200ms }")}
.tz-demo-label:hover { background: var(--wash) }
`;
  expect(audit(css).map((issue) => issue.property)).toEqual([
    "color",
    "font-size",
    "border-radius",
    "transition",
    ":hover",
  ]);
});

it("reports selectors and values on one line, without !important", () => {
  const css = `.tz-demo,
.x
  .tz-demo-label {
  transition:
    opacity 200ms,
    transform 200ms;
  color: #fff !important;
}`;
  expect(audit(css)).toEqual([
    {
      selector: ".tz-demo, .x .tz-demo-label",
      property: "transition",
      value: "opacity 200ms, transform 200ms",
      message: expect.stringMatching(label[4]),
    },
    {
      selector: ".tz-demo, .x .tz-demo-label",
      property: "color",
      value: "#fff",
      message: expect.stringMatching(label[1]),
    },
  ]);
});

// ---------------------------------------------------------------------------
// The clean fixtures

/** A migrated family. Every rule here follows the Woven rules. */
const cleanFamily = `
.tz-demo {
  --status-size: 18px;
  display: inline-flex;
  min-block-size: var(--control-height);
  padding-inline: var(--control-padding);
  border: 1px solid var(--border-field);
  border-radius: var(--radius-control);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-control);
  font: var(--weight-medium) var(--text-label) / var(--leading-meta) var(--font);
  transition:
    background-color var(--motion-state) var(--ease-out),
    transform var(--motion-press) var(--ease-out);
}
.tz-demo-icon {
  border-radius: 50%;
  background: currentColor;
  line-height: 1;
}
.tz-demo-tray {
  border-radius: calc(var(--radius-paper) - var(--tray-pad));
}
.tz-demo-caption {
  font-size: var(--text-meta);
  font-weight: var(--weight-regular);
  line-height: var(--line-height);
  letter-spacing: 0;
  text-transform: none;
  font-style: normal;
}
.tz-demo-eyebrow:lang(en) {
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.tz-demo:active {
  transform: scale(var(--press-scale));
}
.tz-demo[data-pressed] {
  transform: scale(var(--press-scale));
}
@media (hover: hover) and (pointer: fine) {
  .tz-demo:hover {
    background: var(--wash);
  }
}
.tz-demo-spinner {
  animation: tz-spin var(--motion-loop-turn) linear infinite;
}
.tz-demo-row {
  animation: tz-row-in calc(var(--motion-enter) + var(--motion-exit))
    var(--ease-out) both;
  animation-delay: calc(var(--option-index, 0) * var(--motion-stagger));
}
.tz-demo-quiet {
  border-color: inherit;
  background: transparent;
  color: currentColor;
}
@media (forced-colors: active) {
  .tz-demo {
    border: 1px solid ButtonText;
    background: Canvas;
    color: CanvasText;
    outline: 2px solid Highlight;
  }
}
`;

it("finds nothing to flag in a migrated family", () => {
  // Counted, so the fixture cannot pass by being skipped.
  expect(familyRuleCount(cleanFamily, [".tz-demo"])).toBe(12);
  expect(audit(cleanFamily)).toEqual([]);
});

it("accepts the system colors of a forced-colors block", () => {
  const css = `@media (forced-colors: active) {
  .tz-demo { border: 1px solid ButtonText; background: Canvas; color: CanvasText; outline: 2px solid Highlight; fill: LinkText; stroke: GrayText }
  .tz-demo[data-state="checked"] { background: Highlight; color: HighlightText }
}`;
  expect(familyRuleCount(css, [".tz-demo"])).toBe(2);
  expect(audit(css)).toEqual([]);
});

// ---------------------------------------------------------------------------
// Which rules belong to a family

it("matches a prefix as a class and as the start of a longer name", () => {
  for (const selector of [
    ".tz-demo",
    ".tz-demo-label",
    ".tz-demo-label-text",
    ".tz-demo.is-on",
    "button.tz-demo",
    ".x > .tz-demo",
    ".x .tz-demo-icon",
    ".tz-demos .tz-demo",
    '.tz-demo[data-state="open"]',
    ".tz-demo::before",
    ":is(.x, .tz-demo)",
    ".tz-demo, .other",
  ]) {
    expect(audit(`${selector} { color: #fff }`), selector).toHaveLength(1);
  }
});

it("does not match a different class that only starts the same way", () => {
  for (const selector of [
    ".tz-demos",
    ".tz-demo2",
    ".tz-demo_x",
    ".tz-dem",
    ".my-tz-demo",
    "#tz-demo",
    "tz-demo",
    '[data-x=".tz-demo"]',
    "[class*='.tz-demo']",
    ".other",
  ]) {
    expect(audit(`${selector} { color: #fff }`), selector).toEqual([]);
  }
});

it("takes .tz-button to cover .tz-button-label and not .tz-buttons", () => {
  const css = `
.tz-button { color: #fff }
.tz-button-label { color: #fff }
.tz-buttons { color: #fff }
`;
  expect(
    auditFamily(css, [".tz-button"]).map((issue) => issue.selector),
  ).toEqual([".tz-button", ".tz-button-label"]);
});

it("audits the rules of every prefix and no others", () => {
  const css =
    ".tz-a { color: #fff } .tz-b-x { color: #fff } .tz-c { color: #fff }";
  expect(
    auditFamily(css, [".tz-a", ".tz-b"]).map((issue) => issue.selector),
  ).toEqual([".tz-a", ".tz-b-x"]);
});

it("audits rules nested in @media, @supports, @container and @layer", () => {
  const css = `
@media (max-width: 600px) { .tz-demo { color: #fff } }
@supports (background-clip: text) { .tz-demo { color: #fff } }
@container (max-width: 30rem) { .tz-demo { color: #fff } }
@layer components { .tz-demo { color: #fff } }
@media (min-width: 1px) { @supports (color: red) { .tz-demo { color: #fff } } }
`;
  expect(audit(css)).toHaveLength(5);
});

it("reads only the selectors of a list that name the family", () => {
  const issues = (selectors: string) => audit(`${selectors} { color: #fff }`);
  expect(issues(".tz-demo, .other")).toMatchObject([{ selector: ".tz-demo" }]);
  expect(issues(".other, .tz-demo-label")).toMatchObject([
    { selector: ".tz-demo-label" },
  ]);
  expect(issues(".other, .another")).toEqual([]);
});

it("leaves @keyframes alone, since their frames name no class", () => {
  // A known gap, pinned so it is a choice: nothing inside a keyframe is read.
  const css =
    "@keyframes tz-demo-in { from { color: #fff } to { color: #000 } }";
  expect(audit(css)).toEqual([]);
});

it("counts the rules a family owns", () => {
  const css = `
.tz-demo {}
.tz-demo-x:hover {}
.tz-demos {}
@media (min-width: 1px) { .x .tz-demo-y {} }
@keyframes tz-demo { from {} }`;
  expect(familyRuleCount(css, [".tz-demo"])).toBe(3);
  expect(familyRuleCount(css, [".tz-missing"])).toBe(0);
});

it("names the prefixes that own no rule, since one typo in a family must not hide", () => {
  const css = `
.tz-demo {}
.tz-demo-x:hover {}
.tz-other {}
@media (min-width: 1px) { .x .tz-third-y {} }`;
  // The family still owns rules as a whole, which is how a misspelled prefix
  // slips through a count over all of them.
  expect(familyRuleCount(css, [".tz-demo", ".tz-demo-typo"])).toBe(2);
  expect(unmatchedPrefixes(css, [".tz-demo", ".tz-demo-typo"])).toEqual([
    ".tz-demo-typo",
  ]);
  expect(
    unmatchedPrefixes(css, [".tz-demo", ".tz-other", ".tz-third"]),
  ).toEqual([]);
  expect(unmatchedPrefixes(css, [".tz-nada", ".tz-demo", ".tz-zip"])).toEqual([
    ".tz-nada",
    ".tz-zip",
  ]);
  // One selector can name several prefixes.
  expect(
    unmatchedPrefixes(".tz-pair-a .tz-pair-b {}", [".tz-pair-a", ".tz-pair-b"]),
  ).toEqual([]);
  // A longer name of the family counts for its prefix; another class does not.
  expect(unmatchedPrefixes(".tz-button-label {}", [".tz-button"])).toEqual([]);
  expect(unmatchedPrefixes(".tz-buttons {}", [".tz-button"])).toEqual([
    ".tz-button",
  ]);
});

it("ends each message with where its rule sits, so a repeated selector can be found", () => {
  const css = `
.tz-demo { color: #fff }

@media (min-width: 600px) {
  .tz-demo { color: #fff }
}

@media not (forced-colors: active) {
  @media (hover: hover) and (pointer: fine) {
    .tz-demo { color: #000 }
  }
}

@supports (color: red) {
  .tz-demo { color: #fff }
}

@media (min-width: 600px)
  and (max-width: 900px) {
  .tz-demo { color: #fff }
}

.tz-demo:hover {
  font-size: 13px;
}
`;
  const issues = audit(css);
  expect(issues.map((issue) => issue.property)).toEqual([
    "color",
    "color",
    "color",
    "color",
    "color",
    ":hover",
    "font-size",
  ]);
  // The label still opens the message; the location closes it. Only @media
  // conditions are shown, outermost first.
  expect(
    issues.map((issue) =>
      issue.message.slice(issue.message.lastIndexOf(" (line ")),
    ),
  ).toEqual([
    " (line 2)",
    " (line 5, @media (min-width: 600px))",
    " (line 10, @media not (forced-colors: active) > @media (hover: hover) and (pointer: fine))",
    " (line 15)",
    " (line 20, @media (min-width: 600px) and (max-width: 900px))",
    " (line 23)",
    " (line 23)",
  ]);
  expect(issues[0].message).toMatch(label[1]);
  expect(issues[5].message).toMatch(label[6]);
  expect(issues[6].message).toMatch(label[2]);
});

// ---------------------------------------------------------------------------
// Context that changes a verdict

it("exempts literal colors inside @media (forced-colors: active), and only there", () => {
  // Two declarations, two literals: one issue each wherever it is not exempt.
  const literals = ".tz-demo { background: #000; border-color: white }";
  for (const query of [
    "(forced-colors: active)",
    "(forced-colors: active) and (min-width: 600px)",
    "(min-width: 600px) and (forced-colors: active)",
  ]) {
    expect(audit(`@media ${query} { ${literals} }`), query).toEqual([]);
  }
  expect(
    audit(
      `@media (min-width: 600px) { @media (forced-colors: active) { ${literals} } }`,
    ),
  ).toEqual([]);
  for (const query of [
    "not (forced-colors: active)",
    "(forced-colors: none)",
    "(forced-colors: active), (min-width: 600px)",
    "(forced-colors: active) or (min-width: 600px)",
    "not screen and (forced-colors: active)",
    "print",
  ]) {
    expect(audit(`@media ${query} { ${literals} }`), query).toHaveLength(2);
  }
  expect(audit(literals)).toHaveLength(2);
});

it("holds the other checks inside a forced-colors block", () => {
  const css = `@media (forced-colors: active) {
  .tz-demo { background: #000; font-size: 13px; border-radius: 6px }
}`;
  expect(audit(css).map((issue) => issue.property)).toEqual([
    "font-size",
    "border-radius",
  ]);
});

// ---------------------------------------------------------------------------
// What the audit refuses to guess

it("refuses a prefix that is not a class, so a typo cannot pass an empty match", () => {
  expect(() => auditFamily(demo("color: red"), [])).toThrow(/at least one/);
  expect(() => auditFamily(demo("color: red"), ["tz-demo"])).toThrow(
    /class prefix/,
  );
  expect(() => auditFamily(demo("color: red"), [".tz demo"])).toThrow(
    /class prefix/,
  );
  expect(() => familyRuleCount(demo("color: red"), [""])).toThrow(
    /class prefix/,
  );
  expect(() => unmatchedPrefixes(demo("color: red"), ["tz-demo"])).toThrow(
    /class prefix/,
  );
});

it("refuses nesting, which would hide declarations from the audit", () => {
  expect(() => audit(".tz-demo { &:hover { color: #fff } }")).toThrow(/nest/i);
  expect(() =>
    audit(".tz-demo { @media (min-width: 1px) { color: #fff } }"),
  ).toThrow(/nest/i);
  expect(() => audit(".other { .tz-demo { color: #fff } }")).toThrow(/nest/i);
});

it("lets postcss refuse CSS that does not parse", () => {
  expect(() => audit(".tz-demo { color: #fff")).toThrow();
});

// ---------------------------------------------------------------------------
// The registered families, against the real stylesheet

/** An issue as one line, so a failing family reads as a list. */
const line = ({ selector, property, value, message }: AuditIssue) =>
  `${selector} | ${property}: ${value} | ${message}`;

// While the map is empty this creates no tests; the self-tests above keep the
// file from being empty, which vitest would report as a failure.
for (const [name, prefixes] of Object.entries(wovenFamilies)) {
  it(`${name} follows the Woven audit`, () => {
    const css = readFileSync(resolve("src/system/components.css"), "utf8");
    // A prefix that names no rule would pass by auditing nothing, and a typo in
    // one of several prefixes would hide behind the others.
    expect(
      unmatchedPrefixes(css, prefixes),
      "no rule in components.css names these prefixes",
    ).toEqual([]);
    expect(auditFamily(css, prefixes).map(line)).toEqual([]);
  });
}
