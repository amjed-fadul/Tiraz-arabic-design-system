import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const out = process.env.TIRAZ_EVIDENCE || "docs/ai-context-controls/browser",
  base = process.env.TIRAZ_URL || "http://127.0.0.1:5217";
await mkdir(out, { recursive: true });
const result = {
  checks: [],
  failures: [],
  errors: [],
  limitations: [
    "DOM Range and emulated touch checks are simulated; no physical touch device tested.",
    "Automated accessibility and keyboard checks do not establish screen-reader conformance.",
  ],
};
const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  }),
  page = await context.newPage();
page.on("pageerror", (error) => result.errors.push(error.message));
page.setDefaultTimeout(6000);
async function check(name, fn) {
  try {
    const detail = await fn();
    result.checks.push({ name, ...detail });
  } catch (error) {
    result.failures.push({ name, error: error.message });
  }
}
async function load(params = {}) {
  await page.goto(
    `${base}/tests/browser/ai-context-controls-fixture.html?${new URLSearchParams(params)}`,
  );
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.evaluate(() => document.fonts.ready);
}
async function select(selector, { backwards = false, start = 0, end } = {}) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  // Let the native scroll event finish before constructing a simulated range.
  // Otherwise intentional scroll-dismissal correctly removes the new toolbar.
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  return page.locator(selector).evaluate(
    (el, opts) => {
      const node = el.firstChild;
      el.closest("[data-tz-selection-scope]")?.focus({ preventScroll: true });
      const sel = getSelection();
      sel.setBaseAndExtent(
        node,
        opts.backwards ? (opts.end ?? node.length) : opts.start,
        node,
        opts.backwards ? opts.start : (opts.end ?? node.length),
      );
      document.dispatchEvent(new Event("selectionchange"));
      return sel.toString();
    },
    { backwards, start, end },
  );
}
async function bounds(locator) {
  const b = await locator.boundingBox(),
    size = page.viewportSize();
  assert.ok(
    b &&
      b.x >= -1 &&
      b.y >= -1 &&
      b.x + b.width <= size.width + 1 &&
      b.y + b.height <= size.height + 1,
    JSON.stringify({ b, size }),
  );
  return b;
}
try {
  await page.setViewportSize({ width: 1100, height: 800 });
  await load();
  await check(
    "connected model keyboard navigation skips disabled and persists through editing",
    async () => {
      const model = page.getByRole("combobox", { name: "Model", exact: true });
      await model.focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("role") === "option",
      );
      await page.keyboard.press("End");
      await page.waitForFunction(() =>
        document.activeElement?.textContent?.includes("Review"),
      );
      await page.keyboard.press("Home");
      await page.waitForFunction(() =>
        document.activeElement?.textContent?.includes("Draft"),
      );
      await page.keyboard.press("ArrowDown");
      await page.waitForFunction(() =>
        document.activeElement?.textContent?.includes("Review"),
      );
      await page.keyboard.press("Enter");
      await page.getByRole("listbox").waitFor({ state: "hidden" });
      assert.match(await model.textContent(), /Review/);
      const draft = page.getByRole("textbox", { name: "Message draft" });
      await draft.fill("Existing draft");
      await draft.press("Shift+Enter");
      await draft.press("End");
      assert.match(await model.textContent(), /Review/);
      return { selected: "studio-review" };
    },
  );
  await check(
    "connected selection appends without replacing draft and preserves selected text",
    async () => {
      await page
        .getByRole("textbox", { name: "Message draft" })
        .fill("Existing draft");
      const before = await page
        .getByRole("textbox", { name: "Message draft" })
        .inputValue();
      const text = await select(".tz-context-connected .tz-chat-content p", {
        end: 34,
      });
      await page.getByRole("toolbar").waitFor();
      await bounds(page.getByRole("toolbar"));
      await page
        .getByRole("button", { name: "Use in draft", exact: true })
        .click();
      assert.equal(await page.evaluate(() => getSelection().toString()), text);
      assert.equal(
        await page.getByRole("textbox", { name: "Message draft" }).inputValue(),
        before + "\n" + text,
      );
      await page.screenshot({
        path: `${out}/connected-selection-en-light.png`,
      });
    },
  );
  await check(
    "copy writes the actual selected text and More reveals a connected quotation action",
    async () => {
      const text = await select(".tz-context-connected .tz-chat-content p", {
        start: 4,
        end: 44,
      });
      await page.getByRole("button", { name: "Copy", exact: true }).click();
      assert.equal(
        await page.evaluate(() => navigator.clipboard.readText()),
        text,
      );
      await page.getByRole("button", { name: "More actions" }).click();
      await page.getByRole("button", { name: "Quote", exact: true }).click();
      assert.ok(
        (
          await page
            .getByRole("textbox", { name: "Message draft" })
            .inputValue()
        ).endsWith(`> ${text}`),
      );
    },
  );
  await check(
    "mixed-direction backward selection and keyboard activation preserve payload",
    async () => {
      const text = await select("#boundary", {
        backwards: true,
        start: 2,
        end: 39,
      });
      await page.keyboard.press("ControlOrMeta+c");
      assert.equal(
        await page.evaluate(() => navigator.clipboard.readText()),
        text,
      );
      await page.keyboard.press("Alt+Enter");
      await page.keyboard.press("ArrowRight");
      assert.equal(
        await page.evaluate(() =>
          document.activeElement.getAttribute("aria-label"),
        ),
        "More actions",
      );
      await page.keyboard.press("ArrowLeft");
      assert.equal(
        await page.evaluate(() => document.activeElement.textContent),
        "Capture",
      );
      await page.keyboard.press("Enter");
      assert.equal(await page.locator("#captured").textContent(), text);
      assert.equal(await page.evaluate(() => getSelection().toString()), text);
      await page.keyboard.press("End");
      assert.equal(
        await page.evaluate(() =>
          document.activeElement.getAttribute("aria-label"),
        ),
        "More actions",
      );
      await page.keyboard.press("Escape");
      assert.equal(
        await page.evaluate(() =>
          document.activeElement.getAttribute("aria-label"),
        ),
        "Boundary scope",
      );
      assert.equal(await page.getByRole("toolbar").count(), 0);
    },
  );
  await check(
    "outside, code, editable and interactive selections are excluded including crossing ranges",
    async () => {
      for (const selector of [
        "#outside",
        "#code",
        "#editable",
        "#excluded-button",
        "#custom",
        "#excluded",
      ]) {
        await select(selector);
        assert.equal(await page.getByRole("toolbar").count(), 0, selector);
      }
      await page.evaluate(() => {
        const a = document.querySelector("#cross-start").firstChild,
          b = document.querySelector("#cross-end").firstChild;
        getSelection().setBaseAndExtent(a, 0, b, b.length);
        document.dispatchEvent(new Event("selectionchange"));
      });
      assert.equal(await page.getByRole("toolbar").count(), 0);
    },
  );
  await check(
    "clearing, changing, scrolling and resizing dismiss the row",
    async () => {
      await select("#boundary");
      await page.getByRole("toolbar").waitFor();
      await page.evaluate(() => {
        getSelection().removeAllRanges();
        document.dispatchEvent(new Event("selectionchange"));
      });
      assert.equal(await page.getByRole("toolbar").count(), 0);
      await select("#boundary", { end: 12 });
      await page.getByRole("toolbar").waitFor();
      await page.evaluate(() =>
        window.scrollBy(0, window.scrollY > 50 ? -50 : 50),
      );
      await page.waitForFunction(
        () => !document.querySelector("[role=toolbar]"),
      );
      await select("#boundary");
      await page.getByRole("toolbar").waitFor();
      await page.setViewportSize({ width: 1000, height: 700 });
      await page.waitForFunction(
        () => !document.querySelector("[role=toolbar]"),
      );
    },
  );
  await check(
    "context edge cases have accessible full values and status",
    async () => {
      const cases = [
        [/^Over:/, /120 of 100 tokens/, /Over capacity/],
        [/^Zero:/, /0 of 0 tokens/, /Capacity is zero/],
        [/^Missing:/, /Usage unavailable/, /Capacity unavailable/],
        [/^Invalid:/, /Usage unavailable/, /Capacity unavailable/],
        [/^Estimate:/, /Estimated/, /12 of 100 tokens/],
        [/^Empty usage:/, /0 of 100 tokens/, /0%/],
      ];
      for (const [name, a, b] of cases) {
        const trigger = page.getByRole("button", { name });
        await trigger.click();
        const popup = page.getByRole("dialog");
        assert.match(await popup.textContent(), a);
        assert.match(await popup.textContent(), b);
        await page.keyboard.press("Escape");
        await page.waitForFunction(
          (el) => el === document.activeElement,
          await trigger.elementHandle(),
        );
      }
    },
  );
  await check(
    "nested Select, context and selection Escape preserve their containing Modal",
    async () => {
      await page.getByRole("button", { name: "Open settings" }).click();
      const dialog = page.getByRole("dialog", { name: "Model settings" });
      const model = page.getByRole("combobox", { name: "Nested model" });
      await model.click();
      assert.equal(
        await page
          .getByRole("option", { name: /Offline/ })
          .getAttribute("aria-disabled"),
        "true",
      );
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("role") === "option",
      );
      await page.keyboard.press("End");
      await page.waitForFunction(() =>
        document.activeElement?.textContent?.includes("Review"),
      );
      await page.keyboard.press("Home");
      await page.waitForFunction(() =>
        document.activeElement?.textContent?.includes("Draft"),
      );
      await page.keyboard.press("ArrowDown");
      await page.waitForFunction(() =>
        document.activeElement?.textContent?.includes("Review"),
      );
      await page.keyboard.press("Enter");
      await page.getByRole("listbox").waitFor({ state: "hidden" });
      assert.match(await model.textContent(), /Review/);
      await model.click();
      await page.keyboard.press("Escape");
      await page.waitForFunction(
        (el) => el === document.activeElement,
        await model.elementHandle(),
      );
      assert.equal(await dialog.isVisible(), true);
      await page.getByRole("button", { name: /Nested context:/ }).click();
      await page.keyboard.press("Escape");
      assert.equal(await dialog.isVisible(), true);
      await select("#nested-text");
      await page.keyboard.press("Alt+Enter");
      await page.keyboard.press("Escape");
      assert.equal(await dialog.isVisible(), true);
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
    },
  );
  for (const lang of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const size of [
        { width: 1100, height: 800 },
        { width: 320, height: 520 },
        { width: 320, height: 320 },
      ]) {
        await check(
          `${lang} ${theme} ${size.width}x${size.height}: bounds, menus, shared customization and motion`,
          async () => {
            await page.setViewportSize(size);
            await load({ lang, theme, custom: "true", motion: "true" });
            await page.emulateMedia({ reducedMotion: "reduce" });
            const model = page.getByRole("combobox").first();
            await model.click();
            await bounds(page.locator(".tz-model-popup"));
            await page.screenshot({
              path: `${out}/model-${lang}-${theme}-${size.width}x${size.height}.png`,
            });
            await page.keyboard.press("Escape");
            const text = await select("#boundary", {
              backwards: lang === "ar",
            });
            await page.getByRole("toolbar").waitFor();
            await bounds(page.getByRole("toolbar"));
            await page.keyboard.press("Alt+Enter");
            await page.keyboard.press("Enter");
            assert.equal(await page.locator("#captured").textContent(), text);
            await page.screenshot({
              path: `${out}/selection-${lang}-${theme}-${size.width}x${size.height}.png`,
            });
            await page.keyboard.press("Escape");
            const geometry = await page.evaluate(() => ({
              overflow: document.documentElement.scrollWidth > innerWidth,
              fonts: document.fonts.check('14px "IBM Plex Sans Arabic"'),
              animations: [
                ...document.querySelectorAll(
                  ".tz-model-trigger,.tz-context-trigger,.tz-selection-actions",
                ),
              ].map((el) => [
                getComputedStyle(el).animationDuration,
                getComputedStyle(el).transitionDuration,
              ]),
            }));
            assert.equal(geometry.overflow, false);
            assert.equal(geometry.fonts, true);
            return geometry;
          },
        );
      }
  await check(
    "native mouse drag creates actionable text selection",
    async () => {
      await page.setViewportSize({ width: 1100, height: 800 });
      await load();
      const el = page.locator("#boundary");
      await el.scrollIntoViewIfNeeded();
      const b = await el.boundingBox();
      await page.mouse.move(b.x + 2, b.y + b.height / 2);
      await page.mouse.down();
      await page.mouse.move(b.x + b.width * 0.7, b.y + b.height / 2, {
        steps: 15,
      });
      await page.mouse.up();
      const text = await page.evaluate(() => getSelection().toString());
      assert.ok(text.length > 2);
      await page.getByRole("toolbar").waitFor();
      await page.waitForFunction(() => {
        const row = document.querySelector('[role="toolbar"]');
        if (!row) return false;
        const measured = parseFloat(
          row.parentElement.style.getPropertyValue(
            "--radix-popper-anchor-width",
          ),
        );
        return (
          Math.abs(
            measured -
              getSelection().getRangeAt(0).getBoundingClientRect().width,
          ) < 1
        );
      });
      await page.screenshot({ path: `${out}/native-drag.png` });
      return { selectedText: text };
    },
  );
  await check(
    "documentation pages stay continuous with shared frames and small inspectors",
    async () => {
      await page.goto(base);
      await page
        .getByLabel(/لغة التوثيق|Documentation language/)
        .selectOption("en");
      for (const name of [
        "SelectionActions",
        "ContextMeter",
        "ModelSelector",
      ]) {
        await page
          .getByRole("navigation", { name: "Components", exact: true })
          .getByRole("button", { name, exact: true })
          .click();
        await page.getByRole("heading", { name, level: 1 }).waitFor();
        for (const heading of [
          "Interactive playground",
          "Examples",
          "Usage example",
        ])
          assert.equal(
            await page
              .getByRole("heading", { name: heading, exact: true })
              .isVisible(),
            true,
          );
        await page
          .locator(".playground-section")
          .screenshot({ path: `${out}/docs-${name}.png` });
      }
    },
  );
} finally {
  await context.close();
  await browser.close();
  await writeFile(`${out}/results.json`, JSON.stringify(result, null, 2));
}
console.log(JSON.stringify(result, null, 2));
if (result.failures.length || result.errors.length) process.exitCode = 1;
