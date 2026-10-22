import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "postcss";
import type { AtRule } from "postcss";
import { expect, it } from "vitest";
import { auditFamily, familyRuleCount } from "../system/css-audit";
import { screens } from "./frame/screen";

// main.tsx imports every screen, so these stylesheets load on every page, the
// docs included. The frame's and each screen's hold to the Woven audit
// (tokens only, hover gated), and everything they declare is their own: the
// audit reads only the selectors that name the family, so a list such as
// `.invoices-panel, .tz-card` would restyle the system everywhere, and every
// @keyframes name starts with the family, since a `tz-fade-in` would replace
// the system's animation. The Dashboard keeps its own stylesheet, which this
// leaves out.
const sheets = [
  { file: "frame/screen-frame.css", prefix: ".screen" },
  ...screens
    .filter((item) => item.slug !== "dashboard")
    .map((item) => ({
      file: `${item.slug}/${item.slug}.css`,
      prefix: `.${item.slug}`,
    })),
];

/**
 * What a stylesheet declares outside its family: each selector that doesn't
 * name `prefix`, and each @keyframes whose name doesn't start with it. A
 * keyframe's frames (`from`, `50%`) name no class and are skipped.
 */
function strays(css: string, prefix: string) {
  const found: string[] = [];
  const root = parse(css);
  root.walkRules((rule) => {
    const parent = rule.parent as AtRule | undefined;
    if (parent?.type === "atrule" && /keyframes$/i.test(parent.name)) return;
    for (const selector of rule.selectors)
      if (familyRuleCount(`${selector} {}`, [prefix]) !== 1)
        found.push(selector);
  });
  root.walkAtRules(/keyframes$/i, (at) => {
    if (!at.params.startsWith(prefix.slice(1)))
      found.push(`@keyframes ${at.params}`);
  });
  return found;
}

for (const { file, prefix } of sheets)
  it(`${file} passes the audit and keeps every selector and @keyframes name to ${prefix}`, () => {
    const css = readFileSync(resolve("src/examples", file), "utf8");
    expect(auditFamily(css, [prefix])).toEqual([]);
    expect(strays(css, prefix)).toEqual([]);
  });

it("fails a selector list that mixes a system class with the screen's own", () => {
  const css = ".invoices-panel, .tz-card { padding: var(--space-3); }";
  expect(strays(css, ".invoices")).toEqual([".tz-card"]);
});

it("fails a @keyframes name the screen doesn't own", () => {
  const css = `
    @keyframes invoices-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes tz-fade-in { from { opacity: 0; } to { opacity: 1; } }`;
  expect(strays(css, ".invoices")).toEqual(["@keyframes tz-fade-in"]);
});
