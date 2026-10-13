import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage();
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5208";
const checks = [];
try {
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"]) {
      await page.goto(
        `${base}/tests/browser/structure-navigation-fixture.html?language=${language}&theme=${theme}`,
      );
      const ar = language === "ar",
        group = page.getByRole("region", { name: "Accordion", exact: true });
      const first = group.getByRole("button", {
          name: ar ? "القراءة" : "Reading",
          exact: true,
        }),
        last = group.getByRole("button", {
          name: ar ? "التنسيق" : "Layout",
          exact: true,
        });
      await first.focus();
      await page.keyboard.press("Tab");
      assert(
        await group
          .getByRole("link")
          .evaluate((el) => el === document.activeElement),
      );
      await page.keyboard.press("Tab");
      assert(await last.evaluate((el) => el === document.activeElement));
      const focus = await last.evaluate((el) => ({
        outline: getComputedStyle(el).outlineWidth,
        style: getComputedStyle(el).outlineStyle,
      }));
      assert.equal(focus.outline, "2px");
      assert.equal(focus.style, "solid");
      const before = await last.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      await last.hover();
      await page.waitForFunction(
        ({ selector, before }) =>
          getComputedStyle(document.querySelector(selector)).backgroundColor !==
          before,
        {
          selector: '.tz-accordion-trigger[data-state="closed"]:not(:disabled)',
          before,
        },
      );
      await last.click();
      assert.equal(await last.getAttribute("aria-expanded"), "true");
      const closedPanel = group
        .locator('.tz-accordion-panel[data-state="closed"]')
        .first();
      assert.equal(await closedPanel.getAttribute("inert"), "");
      assert.equal(await closedPanel.getAttribute("aria-hidden"), "true");
      await first.focus();
      await page.keyboard.press("Tab");
      assert(await last.evaluate((el) => el === document.activeElement));
      await page
        .getByRole("region", { name: "Breadcrumbs", exact: true })
        .getByRole("link")
        .first()
        .click();
      assert.equal(new URL(page.url()).hash, "#guide");
      checks.push({ language, theme, focus, passed: true });
    }
} finally {
  await writeFile(
    "docs/structure-and-navigation/browser/focus-hover.json",
    JSON.stringify(checks, null, 2),
  );
  await browser.close();
  console.log(JSON.stringify(checks));
}
