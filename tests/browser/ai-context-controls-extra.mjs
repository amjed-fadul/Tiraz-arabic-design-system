import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5217",
  out = process.env.TIRAZ_EVIDENCE || "docs/ai-context-controls/browser";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const results = { checks: [], failures: [], errors: [], diagnostics: [] };
const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  }),
  page = await context.newPage();
page.setDefaultTimeout(6000);
page.on("pageerror", (e) => results.errors.push(e.message));
async function check(name, fn) {
  try {
    const detail = await fn();
    results.checks.push({ name, ...detail });
  } catch (e) {
    results.failures.push({ name, error: e.message });
  }
}
// Scan settled frames: a half-faded message or popover gives transient
// contrast failures.
async function settle() {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    ),
  );
}
async function nav(name) {
  if (await page.locator(".docs-sidebar").isVisible())
    await page
      .locator(".docs-sidebar nav")
      .getByRole("button", { name, exact: true })
      .click();
  else {
    await page.locator(".mobile-navigation button").click();
    await page
      .locator(".docs-drawer nav")
      .getByRole("button", { name, exact: true })
      .click();
    await page.locator(".docs-drawer").waitFor({ state: "hidden" });
  }
  await page.getByRole("heading", { name, level: 1 }).waitFor();
}
try {
  for (const lang of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const size of [
        { width: 1440, height: 900 },
        { width: 320, height: 520 },
        { width: 320, height: 320 },
      ]) {
        await check(
          `documentation ${lang} ${theme} ${size.width}x${size.height}`,
          async () => {
            await page.setViewportSize(size);
            await page.goto(base);
            await page
              .getByLabel(/لغة التوثيق|Documentation language/)
              .selectOption(lang);
            const themeButton = page.getByRole("button", {
              name: /تبديل المظهر|Toggle theme/,
            });
            if (
              ((await themeButton.getAttribute("aria-pressed")) === "true") !==
              (theme === "dark")
            )
              await themeButton.click();
            for (const name of lang === "en"
              ? ["SelectionActions", "ContextMeter", "ModelSelector"]
              : ["إجراءات التحديد", "مقياس السياق", "اختيار النموذج"]) {
              await nav(name);
              await page.evaluate(() => document.fonts.ready);
              const ar = lang === "ar",
                slug =
                  name === "SelectionActions" || name === "إجراءات التحديد"
                    ? "selection"
                    : name === "ContextMeter" || name === "مقياس السياق"
                      ? "context"
                      : "model";
              // Every page is playground → agent prompt → API reference.
              assert.deepEqual(
                await page
                  .locator(".component-page > section")
                  .evaluateAll((els) => els.map((el) => el.className)),
                ["playground-section", "agent-section", "reference-section"],
              );
              assert.equal(await page.locator(".examples-section").count(), 0);
              assert.equal(await page.locator(".usage-section").count(), 0);
              const frame = page.locator(".playground-region .tz-demo-frame");
              assert.equal(await frame.count(), 1);
              const views = frame
                .locator(".tz-demo-header")
                .getByRole("tablist", { name: ar ? "طريقة العرض" : "View" });
              const preview = views.getByRole("tab", {
                  name: ar ? "معاينة" : "Preview",
                }),
                code = views.getByRole("tab", { name: ar ? "الكود" : "Code" });
              assert.equal(await preview.getAttribute("aria-selected"), "true");
              assert.equal(
                await page.evaluate(
                  () => document.documentElement.scrollWidth > innerWidth,
                ),
                false,
              );
              await page
                .locator(".playground-section")
                .scrollIntoViewIfNeeded();
              await page.mouse.move(0, 0);
              await page.screenshot({
                path: `${out}/docs-${lang}-${theme}-${size.width}x${size.height}-${slug}.png`,
              });
              await code.click();
              await frame
                .getByRole("region", {
                  name: `${ar ? "الكود" : "Code"}: src/Example.tsx`,
                })
                .waitFor();
              assert.equal(
                await page.evaluate(
                  () => document.documentElement.scrollWidth > innerWidth,
                ),
                false,
              );
              // The three pages copy the same examples module; one Code
              // screenshot per configuration is enough.
              if (slug === "selection")
                await page.screenshot({
                  path: `${out}/docs-${lang}-${theme}-${size.width}x${size.height}-code.png`,
                });
              await preview.click();
              await frame.locator(".playground-canvas").waitFor();
            }
          },
        );
      }
  await check(
    "live shared customization updates controls and overlay tokens",
    async () => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(base);
      await page
        .getByLabel(/لغة التوثيق|Documentation language/)
        .selectOption("en");
      await nav("SelectionActions");
      const rail = page.locator(".customization-rail");
      if (!(await rail.isVisible()))
        await page
          .getByRole("button", { name: "System settings", exact: true })
          .click();
      await rail
        .getByLabel("Density", { exact: true })
        .selectOption("standard");
      await rail
        .getByLabel("Typography", { exact: true })
        .selectOption("large");
      const radius = rail.getByLabel("Corner radius", { exact: true });
      await radius.focus();
      await radius.press("End");
      const before = await page
        .locator(".playground-region .tz-model-trigger")
        .evaluate((el) => ({
          h: el.getBoundingClientRect().height,
          font: getComputedStyle(el).fontSize,
          radius: getComputedStyle(el).getPropertyValue("--radius"),
        }));
      assert.ok(before.h >= 36);
      assert.equal(before.radius.trim(), "16px");
      const model = page
        .locator(".playground-region")
        .getByRole("combobox", { name: "Model" });
      await model.click();
      const popup = page.locator(".tz-model-popup");
      assert.equal(
        await popup.evaluate((el) =>
          getComputedStyle(el).getPropertyValue("--radius").trim(),
        ),
        "16px",
      );
      await page.keyboard.press("Escape");
      await page.screenshot({ path: `${out}/docs-customization.png` });
      return before;
    },
  );
  await check(
    "OS and application reduced motion each independently stop transitions",
    async () => {
      const rows = [];
      for (const [system, os] of [
        [false, "reduce"],
        [true, "no-preference"],
        [true, "reduce"],
      ]) {
        await page.emulateMedia({ reducedMotion: os });
        await page.goto(
          `${base}/tests/browser/ai-context-controls-fixture.html?motion=${system}`,
        );
        await page.getByRole("heading").waitFor();
        const durations = await page
          .locator(".tz-context-connected button")
          .evaluateAll((els) =>
            els.map((el) => ({
              animation: getComputedStyle(el).animationDuration,
              transition: getComputedStyle(el).transitionDuration,
            })),
          );
        assert.ok(
          durations.every(
            (d) =>
              parseFloat(d.animation) < 0.001 &&
              parseFloat(d.transition) < 0.001,
          ),
        );
        rows.push({ system, os, durations });
      }
      return { rows };
    },
  );
  await check(
    "axe scans connected controls and open model/context details",
    async () => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.goto(`${base}/tests/browser/ai-context-controls-fixture.html`);
      await page.getByRole("heading").waitFor();
      await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
      const scans = [];
      for (const state of ["closed", "model", "context"]) {
        if (state === "model") {
          await page.getByRole("combobox").first().click();
          await page.waitForFunction(
            () => document.activeElement?.getAttribute("role") === "option",
          );
          await page.keyboard.press("Tab");
          assert.equal(
            await page.evaluate(() =>
              document.activeElement?.getAttribute("role"),
            ),
            "option",
          );
          await page.keyboard.press("Shift+Tab");
          assert.equal(
            await page.evaluate(() =>
              document.activeElement?.getAttribute("role"),
            ),
            "option",
          );
          await page
            .locator('input[aria-label="Excluded input"]')
            .evaluate((el) => el.focus());
          assert.equal(
            await page.evaluate(() =>
              document.activeElement?.getAttribute("role"),
            ),
            "option",
          );
          await settle();
          const background = await page.evaluate(async () => {
            const r = await axe.run(document.querySelector(".tiraz-system"), {
              runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa", "wcag21aa"],
              },
            });
            return r.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              nodes: v.nodes.map((n) => n.target),
            }));
          });
          assert.deepEqual(
            background.map((v) => v.id),
            ["aria-hidden-focus"],
          );
          results.diagnostics.push({
            state,
            scope: "whole provider including hidden background",
            violations: background,
            focusContainment:
              "Tab, Shift+Tab and attempted background focus all remain on an option",
            review:
              "Inherited installed Radix Select/axe diagnostic; no full-tree conformance claim.",
          });
        }
        if (state === "context") {
          await page.keyboard.press("Escape");
          await page.getByRole("listbox").waitFor({ state: "hidden" });
          await page.waitForFunction(
            () => !document.querySelector('main[aria-hidden="true"]'),
          );
          await page
            .locator(".tz-context-connected .tz-context-trigger")
            .click();
        }
        await settle();
        const selector =
          state === "model"
            ? ".tz-model-popup"
            : state === "context"
              ? ".tz-context-details"
              : ".tiraz-system";
        const violations = await page.evaluate(async (selector) => {
          const r = await axe.run(document.querySelector(selector), {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
          });
          return r.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => n.target),
          }));
        }, selector);
        scans.push({ state, violations });
        assert.deepEqual(violations, []);
      }
      return { scans };
    },
  );
  await check(
    "simulated touch activation preserves a DOM-constructed selection",
    async () => {
      const touch = await browser.newContext({
        viewport: { width: 320, height: 520 },
        isMobile: true,
        hasTouch: true,
        permissions: ["clipboard-read", "clipboard-write"],
      });
      const tab = await touch.newPage();
      try {
        await tab.goto(
          `${base}/tests/browser/ai-context-controls-fixture.html?lang=en`,
        );
        await tab.getByRole("heading").waitFor();
        const text = await tab.locator(".tz-chat-content p").evaluate((el) => {
          const n = el.firstChild;
          getSelection().setBaseAndExtent(n, 0, n, 30);
          document.dispatchEvent(new Event("selectionchange"));
          return getSelection().toString();
        });
        const button = tab.getByRole("button", {
          name: "Use in draft",
          exact: true,
        });
        await button.waitFor();
        const b = await button.boundingBox();
        await tab.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
        assert.equal(
          await tab
            .getByRole("textbox", { name: "Message draft" })
            .inputValue(),
          text,
        );
        await tab.screenshot({ path: `${out}/simulated-touch.png` });
        return {
          physicalDevice: false,
          selection: "DOM Range simulation",
          activation: "emulated touchscreen tap",
        };
      } finally {
        await touch.close();
      }
    },
  );
} finally {
  await context.close();
  await browser.close();
  await writeFile(
    `${out}/extra-results.json`,
    JSON.stringify(results, null, 2),
  );
}
console.log(JSON.stringify(results, null, 2));
if (results.failures.length || results.errors.length) process.exitCode = 1;
