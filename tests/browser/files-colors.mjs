import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const root = process.env.TIRAZ_URL || "http://127.0.0.1:5214";
const evidence = "docs/files-and-colors/browser";
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
});
await context.addInitScript(() => {
  const raw = new URLSearchParams(location.search).get("check");
  if (!raw) return;
  const { component, language, theme, extra, model } = JSON.parse(raw);
  localStorage.clear();
  localStorage.setItem(
    "tiraz.documentation.v2",
    JSON.stringify({ language, active: component }),
  );
  localStorage.setItem("tiraz.theme.v1", JSON.stringify(theme));
  localStorage.setItem("tiraz.system.v3", JSON.stringify(extra || {}));
  if (model)
    localStorage.setItem(
      "tiraz.playgrounds.v2",
      JSON.stringify({ [component]: model }),
    );
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [],
  checks = [],
  geometry = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
const pass = (name) => {
  checks.push(name);
  console.log("PASS " + name);
};
const preview = () => page.locator(".playground-region");
async function start(
  component,
  language = "en",
  theme = "light",
  width = 1440,
  extra = {},
  model,
) {
  // The documentation page opens with sample files; these checks start empty.
  if (component === "file-dropzone") model = { filled: false, ...model };
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(
    root +
      "/?check=" +
      encodeURIComponent(
        JSON.stringify({ component, language, theme, extra, model }),
      ),
  );
  await preview().waitFor();
  await page.evaluate(() => document.fonts.ready);
}
async function sendDrop(files) {
  const dt = await page.evaluateHandle((files) => {
    const data = new DataTransfer();
    for (const f of files)
      data.items.add(
        new File([f.text || "local notes"], f.name, {
          type: f.type || "text/plain",
          lastModified: 1,
        }),
      );
    return data;
  }, files);
  await preview()
    .locator(".tz-file-drop")
    .dispatchEvent("drop", { dataTransfer: dt });
  await dt.dispose();
}
async function capture(name) {
  await preview().scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${evidence}/${name}.png` });
  const box = await preview().boundingBox();
  const sizes = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert.ok(sizes.scroll <= sizes.width + 1, JSON.stringify(sizes));
  geometry.push({ name, box, ...sizes });
}
const long =
  "تقرير-المراجعة-العربية-والإنجليزية-very-long-local-filename-".repeat(3) +
  ".txt";
for (const component of ["file-dropzone", "color-picker"])
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"]) {
      const width =
        (language === "ar" && theme === "dark") ||
        (language === "en" && theme === "light")
          ? 320
          : 1440;
      await start(component, language, theme, width);
      if (component === "file-dropzone") {
        await sendDrop([{ name: long }]);
        assert.equal(
          await preview().locator(".tz-selected-files li").count(),
          1,
        );
        const bounds = await preview().locator(".tz-file-name").boundingBox();
        assert.ok(bounds.width < width);
      } else {
        await preview().locator("input[type=text]").fill("#a3c");
        await preview().locator("input[type=text]").press("Enter");
        assert.equal(
          await preview().locator("input[type=text]").inputValue(),
          "#AA33CC",
        );
      }
      await capture(`${component}-${language}-${theme}-${width}`);
      pass(`${component} ${language} ${theme} ${width}px shaping/wrapping`);
    }
await start("file-dropzone");
await writeFile(
  "/tmp/tiraz-local-browse.txt",
  "Local selection fixture; no upload.",
);
const chooserPromise = page.waitForEvent("filechooser");
await preview()
  .getByRole("button", { name: /Browse files/ })
  .click();
const chooser = await chooserPromise;
assert.equal(chooser.isMultiple(), true);
await chooser.setFiles("/tmp/tiraz-local-browse.txt");
assert.equal(
  await preview().locator(".tz-file-name").innerText(),
  "tiraz-local-browse.txt",
);
assert.equal(await preview().locator("input[type=file]").inputValue(), "");
pass(
  "real Browse button emits native filechooser; existing local file selected via chooser.setFiles (OS panel not automated)",
);
// The component's own file list shows the selection.
await sendDrop([
  { name: "second.txt" },
  { name: "bad.exe", type: "application/octet-stream" },
  { name: "third.txt" },
  { name: "extra.txt" },
]);
assert.equal(await preview().locator(".tz-selected-files li").count(), 3);
assert.match(
  await preview().locator(".tz-entry-feedback").innerText(),
  /type.*maximum/is,
);
pass("drop partial rejection/count caps preserve valid files");
await sendDrop([{ name: "second.txt" }]);
assert.match(
  await preview().locator(".tz-entry-feedback").innerText(),
  /already selected/,
);
pass("duplicates rejected with explanation");
await preview().getByRole("button", { name: "Remove second.txt" }).click();
assert.equal(
  await preview()
    .getByRole("button", { name: /Browse files/ })
    .evaluate((e) => e === document.activeElement),
  true,
);
pass("removal returns focus to Browse");
await preview()
  .getByRole("button", { name: /Browse files/ })
  .press("Tab");
assert.equal(
  await preview()
    .getByRole("button", { name: "Remove tiraz-local-browse.txt" })
    .evaluate((e) => e === document.activeElement),
  true,
);
pass("keyboard order skips hidden picker and reaches removal");
// Clear through the component; form reset is covered by
// src/system/files-colors.test.tsx.
for (const name of ["tiraz-local-browse.txt", "third.txt"])
  await preview()
    .getByRole("button", { name: `Remove ${name}`, exact: true })
    .click();
assert.equal(await preview().locator(".tz-selected-files li").count(), 0);
assert.equal(
  await preview()
    .getByRole("button", { name: /Browse files/ })
    .evaluate((e) => e === document.activeElement),
  true,
);
pass("removing every file through the component clears selection");
await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)));
const dt = await page.evaluateHandle(() => {
  const d = new DataTransfer();
  d.items.add(new File(["x"], "x.txt"));
  return d;
});
const zone = preview().locator(".tz-file-drop");
await zone.dispatchEvent("dragenter", { dataTransfer: dt });
await zone.locator("button").dispatchEvent("dragenter", { dataTransfer: dt });
await zone.locator("button").dispatchEvent("dragleave", { dataTransfer: dt });
assert.equal(await zone.getAttribute("data-dragging"), "true");
await zone.dispatchEvent("dragleave", { dataTransfer: dt });
assert.equal(await zone.getAttribute("data-dragging"), null);
await dt.dispose();
pass("nested synthetic dragenter/dragleave does not flicker");
await sendDrop([{ name: long }]);
await page
  .getByRole("complementary", { name: "Customization" })
  .getByRole("textbox", { name: "Label", exact: true })
  .fill("Local documents");
assert.equal(await preview().locator(".tz-selected-files li").count(), 1);
pass("live file inspector label edits preserve selection");
await page
  .getByRole("complementary", { name: "Customization" })
  .getByRole("switch", { name: "Disabled", exact: true })
  .click();
assert.equal(
  await preview()
    .getByRole("button", { name: /Browse files/ })
    .isDisabled(),
  true,
);
await sendDrop([{ name: "disabled.txt" }]);
assert.equal(await preview().locator(".tz-selected-files li").count(), 1);
pass("live disabled state blocks drop and native buttons");
await start("color-picker");
const hex = preview().locator("input[type=text]");
const native = preview().locator("input[type=color]");
await hex.fill("#1");
assert.equal(await native.inputValue(), "#805475");
await hex.press("Tab");
assert.match(
  await preview().locator(".tz-entry-feedback").innerText(),
  /#RGB.*#RRGGBB/,
);
assert.equal(await native.inputValue(), "#805475");
pass("incomplete invalid HEX retains draft and selected color");
await hex.fill("#abc");
await hex.press("Enter");
assert.equal(await hex.inputValue(), "#AABBCC");
assert.equal(await native.inputValue(), "#aabbcc");
pass("HEX Enter normalizes and synchronizes native color");
await preview().getByRole("button", { name: "Blue", exact: true }).click();
assert.equal(await hex.inputValue(), "#355C87");
assert.equal(
  await preview()
    .getByRole("button", { name: "Blue", exact: true })
    .getAttribute("aria-pressed"),
  "true",
);
assert.equal(
  await preview()
    .getByRole("button", { name: "Blue", exact: true })
    .locator("svg")
    .count(),
  1,
);
// The native color input mirrors the picker.
assert.equal(await native.inputValue(), "#355c87");
pass("named swatch check/pressed state and native color synchronize");
await hex.press("Shift+Tab");
await capture("color-native-keyboard-focus");
assert.equal(
  await native.evaluate((e) => getComputedStyle(e).outlineStyle),
  "none",
);
assert.equal(
  await native.evaluate((e) => getComputedStyle(e).appearance),
  "none",
);
await native.evaluate((e) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(
    e,
    "#ae6747",
  );
  e.dispatchEvent(new Event("input", { bubbles: true }));
  e.dispatchEvent(new Event("change", { bubbles: true }));
});
assert.equal(await hex.inputValue(), "#AE6747");
pass(
  "SIMULATED native color input/change synchronizes HEX/swatches/sample; no OS chooser selection claimed",
);
// Read the named hidden input FormData submits; form reset is covered by
// src/system/files-colors.test.tsx.
const submitted = preview().locator('input[type=hidden][name="brandColor"]');
assert.equal(await submitted.inputValue(), "#AE6747");
pass("named form value carries the committed color");
await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)));
await hex.fill("#12345678");
await hex.press("Tab");
assert.equal(await submitted.inputValue(), "#AE6747");
pass("invalid draft submits previous committed value as documented");
await page
  .getByRole("complementary", { name: "Customization" })
  .getByRole("textbox", { name: "Label", exact: true })
  .fill("Illustration color");
assert.equal(await hex.inputValue(), "#12345678");
pass("live color inspector preserves editing draft");
// Accent is a Radix Select: open it and pick the option by name.
await page.getByRole("combobox", { name: "Accent", exact: true }).click();
await page.getByRole("option", { name: "Blue", exact: true }).click();
await page.getByLabel("Typography", { exact: true }).selectOption("large");
await page.getByLabel("Density", { exact: true }).selectOption("standard");
await page.getByLabel("Corner radius", { exact: true }).fill("0");
await capture("color-customized");
const custom = await preview()
  .locator(".tiraz-system")
  .evaluate((e) => ({
    height: getComputedStyle(e).getPropertyValue("--control-small"),
    body: getComputedStyle(e).getPropertyValue("--text-body"),
    radius: e.style.getPropertyValue("--radius"),
    accent: e.style.getPropertyValue("--action"),
  }));
pass("live accent/typography/density/corners customization renders");
await page.getByRole("switch", { name: "Reduce motion", exact: true }).click();
assert.equal(
  await preview().locator(".tiraz-system").getAttribute("data-reduced-motion"),
  "true",
);
pass("application reduced motion reaches composite");
await start("file-dropzone", "en", "dark", 1440, { reducedMotion: false });
await page.emulateMedia({ reducedMotion: "reduce" });
assert.equal(
  await zone.evaluate((e) => getComputedStyle(e).transitionDuration),
  "0s",
);
pass("OS reduced motion overrides application motion");
await preview()
  .getByRole("button", { name: /Browse files/ })
  .press("Shift+Tab");
await page.keyboard.press("Tab");
await capture("file-keyboard-focus");
await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
const axe = await page.evaluate(async () => {
  const r = await axe.run(document.querySelector(".playground-region"));
  return r.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
  }));
});
assert.deepEqual(axe, []);
pass("axe scoped file preview: no violations");
await start("color-picker");
await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
const axeColor = await page.evaluate(async () => {
  const r = await axe.run(document.querySelector(".playground-region"));
  return r.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
  }));
});
assert.deepEqual(axeColor, []);
pass("axe scoped color preview: no violations");
assert.deepEqual(errors, []);
await writeFile(
  `${evidence}/results.json`,
  JSON.stringify(
    {
      checks,
      geometry,
      custom,
      errors,
      nativeFile:
        "Browse button + Playwright filechooser.setFiles using a real local text file; OS file panel not inspected",
      nativeColor:
        "Synthetic DOM input/change in script. Actual Chrome native RGB channel UI separately verified; see ../native-checks.md",
      drag: "DOM DataTransfer/drag events; physical OS drag not automated",
    },
    null,
    2,
  ),
);
await browser.close();
