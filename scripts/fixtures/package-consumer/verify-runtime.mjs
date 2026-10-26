import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SystemProvider, defaultConfig, Button, Chip } from "@amjedfadul/tiraz";

const legacy = renderToStaticMarkup(
  createElement(SystemProvider, null, createElement(Button, null, "Continue")),
);
assert.match(legacy, /class="tiraz-system" dir="rtl"/);
assert.doesNotMatch(legacy, /lang=/);
const customized = renderToStaticMarkup(
  createElement(
    SystemProvider,
    {
      className: "embedded",
      lang: "en",
      config: { ...defaultConfig, direction: "ltr", theme: "dark" },
      style: { minHeight: 420, "--action": "red", "--tiraz-radius": "12px" },
    },
    createElement(Chip, { selected: true }, "Selected"),
  ),
);
assert.match(customized, /class="tiraz-system embedded"/);
assert.match(customized, /lang="en"/);
assert.match(customized, /dir="ltr"/);
assert.match(customized, /min-height:420px/);
assert.match(customized, /--action:var\(--tiraz-action, #A5C9B4\)/);
assert.match(customized, /--tiraz-radius:12px/);
assert.match(customized, /aria-pressed="true"/);
console.log("Compiled runtime: legacy and customized providers passed.");
const assets = new URL("./dist/assets/", import.meta.url);
const css = (
  await Promise.all(
    (await readdir(assets))
      .filter((name) => name.endsWith(".css"))
      .map((name) => readFile(new URL(name, assets), "utf8")),
  )
).join("\n");
assert.ok(
  css.includes(":dir(rtl)"),
  "Consumer build must preserve direction selectors independently of language",
);
console.log("Compiled CSS: native direction selectors preserved.");
