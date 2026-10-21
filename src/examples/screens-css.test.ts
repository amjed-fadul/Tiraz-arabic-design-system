import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "postcss";
import type { AtRule } from "postcss";
import { expect, it } from "vitest";
import { auditFamily, familyRuleCount } from "../system/css-audit";
import { screens } from "./frame/screen";

// main.tsx imports every screen, so these stylesheets load on every page, the
// docs included. The frame's and each screen's hold to the Woven audit
// (tokens only, hover gated), and every rule names its own family, since the
// audit reads only the rules that do. The Dashboard keeps its own stylesheet,
// which this leaves out.
const sheets = [
  { file: "frame/screen-frame.css", prefix: ".screen" },
  ...screens
    .filter((item) => item.slug !== "dashboard")
    .map((item) => ({
      file: `${item.slug}/${item.slug}.css`,
      prefix: `.${item.slug}`,
    })),
];

/** The rules of a stylesheet; a keyframe's frames name no class and don't count. */
function ruleCount(css: string) {
  let count = 0;
  parse(css).walkRules((rule) => {
    const parent = rule.parent as AtRule | undefined;
    if (parent?.type === "atrule" && /keyframes$/i.test(parent.name)) return;
    count += 1;
  });
  return count;
}

for (const { file, prefix } of sheets)
  it(`${file} passes the audit and names ${prefix} in every rule`, () => {
    const css = readFileSync(resolve("src/examples", file), "utf8");
    expect(auditFamily(css, [prefix])).toEqual([]);
    expect(familyRuleCount(css, [prefix])).toBe(ruleCount(css));
  });
