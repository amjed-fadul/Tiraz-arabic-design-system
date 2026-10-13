import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage();
const base = "http://127.0.0.1:5206",
  out =
    process.env.TIRAZ_EVIDENCE || "docs/avatar-overlays-empty-state/browser";
await mkdir(out, { recursive: true });
const report = { checks: [], errors: [] };
page.on("pageerror", (e) => report.errors.push(e.message));
try {
  for (const language of ["ar", "en"])
    for (const active of [
      "avatar",
      "avatar-group",
      "tooltip",
      "modal",
      "empty-state",
    ]) {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto(base);
      await page.evaluate(
        ({ language, active }) => {
          localStorage.clear();
          localStorage.setItem(
            "tiraz.documentation.v2",
            JSON.stringify({
              language,
              active,
              systemPanelOpen: false,
              inspectorOpen: true,
            }),
          );
          localStorage.setItem(
            "tiraz.system.v3",
            JSON.stringify({
              accent: "blue",
              density: "standard",
              typography: "large",
              radius: 16,
              reducedMotion: true,
            }),
          );
        },
        { language, active },
      );
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      const canvas = page.locator(".playground-canvas");
      const c = await canvas.boundingBox();
      assert(c.x >= 0 && c.x + c.width <= 320);
      if (active === "modal") {
        await canvas
          .getByRole("button", {
            name: language === "ar" ? "عرض الخيارات" : "View options",
          })
          .click();
        const dialog = page.getByRole("dialog");
        await dialog.waitFor();
        const r = await dialog.boundingBox();
        assert(
          r.x >= 0 && r.x + r.width <= 320 && r.y >= 0 && r.y + r.height <= 568,
        );
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "detached" });
      }
      if (active === "tooltip") {
        const trigger = canvas.locator("button");
        const tooltip = page.getByRole("tooltip");
        await trigger.hover();
        assert.equal(await tooltip.count(), 0);
        await tooltip.waitFor();
        await trigger.click();
        assert.equal(await tooltip.count(), 0);
        assert.equal(
          await trigger.evaluate((el) => el === document.activeElement),
          true,
        );
        assert.equal(
          await canvas
            .getByText(
              language === "ar"
                ? "هذه معاينة محلية للمكوّن."
                : "This is a local component preview.",
            )
            .count(),
          1,
        );
        await page.waitForTimeout(600);
        assert.equal(await tooltip.count(), 0);
        report.tooltipRecovery = {
          language,
          phase: "click dismissal followed by focused pointer leave/re-entry",
          focused: await trigger.evaluate(
            (el) => el === document.activeElement,
          ),
        };
        await page.mouse.move(0, 0);
        await trigger.hover();
        assert.equal(await tooltip.count(), 0);
        await page.waitForTimeout(250);
        assert.equal(await tooltip.count(), 0);
        await tooltip.waitFor({ timeout: 1500 });
        assert.equal(
          await trigger.evaluate((el) => el === document.activeElement),
          true,
        );
        await page.keyboard.press("Escape");
        assert.equal(await tooltip.count(), 0);
        await page.waitForTimeout(600);
        assert.equal(await tooltip.count(), 0);
        report.tooltipRecovery.phase =
          "Escape dismissal followed by focused pointer leave/re-entry";
        await page.mouse.move(0, 0);
        await trigger.hover();
        assert.equal(await tooltip.count(), 0);
        await page.waitForTimeout(250);
        assert.equal(await tooltip.count(), 0);
        await tooltip.waitFor({ timeout: 1500 });
        assert.equal(
          await trigger.evaluate((el) => el === document.activeElement),
          true,
        );
        await page.screenshot({
          path: out + `/tooltip-focused-rehover-${language}-narrow.png`,
        });
        await tooltip.hover();
        await page.waitForTimeout(125);
        assert.equal(await tooltip.count(), 1);
        await page.keyboard.press("Escape");
        report.checks.push({
          language,
          tooltip:
            "click/Escape stay dismissed under stationary pointer; genuine leave/re-entry reopens after hover delay with trigger focused; content stays hoverable",
        });
      }
      if (active === "empty-state" && language === "ar")
        await page.screenshot({
          path: out + "/docs-empty-narrow-arabic.png",
          fullPage: true,
        });
      report.checks.push({
        language,
        active,
        viewport: "320x568",
        density: "standard",
        typography: "large",
        noOverflow: true,
      });
    }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(base);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      "tiraz.documentation.v2",
      JSON.stringify({
        language: "en",
        active: "modal",
        systemPanelOpen: true,
        inspectorOpen: true,
      }),
    );
  });
  await page.reload({ waitUntil: "networkidle" });
  await page
    .locator(".playground-canvas")
    .getByRole("button", { name: "View options" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  // Set shared application controls as a host config update while the dialog stays mounted.
  for (const [label, value] of [
    ["Accent", "clay"],
    ["Typography", "large"],
    ["Density", "standard"],
    ["Corner radius", "16"],
  ]) {
    await page.getByLabel(label, { exact: true }).evaluate((el, value) => {
      Object.getOwnPropertyDescriptor(
        el.tagName === "INPUT"
          ? HTMLInputElement.prototype
          : HTMLSelectElement.prototype,
        "value",
      ).set.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
  }
  await page
    .locator('button[aria-label="Toggle theme"]')
    .evaluate((el) => el.click());
  const tokens = await dialog.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      theme: el.closest(".tiraz-system").dataset.theme,
      font: s.fontFamily,
      text: s.getPropertyValue("--text-body").trim(),
      radius: s.getPropertyValue("--radius").trim(),
      accent: s.getPropertyValue("--action").trim(),
    };
  });
  assert.equal(tokens.theme, "dark");
  assert.equal(tokens.text, "16px");
  assert.equal(tokens.radius, "16px");
  assert.equal(tokens.accent, "#E8BAA3");
  report.checks.push({ liveCustomization: tokens });
  await page.screenshot({ path: out + "/docs-live-customization.png" });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      "tiraz.documentation.v2",
      JSON.stringify({
        language: "ar",
        active: "empty-state",
        systemPanelOpen: true,
        inspectorOpen: true,
      }),
    );
  });
  await page.reload({ waitUntil: "networkidle" });
  await page
    .locator(".examples-canvas")
    .screenshot({ path: out + "/three-illustrations-arabic-light.png" });
  assert.deepEqual(report.errors, []);
} finally {
  await writeFile(
    out + "/documentation-results.json",
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
console.log(JSON.stringify(report));
