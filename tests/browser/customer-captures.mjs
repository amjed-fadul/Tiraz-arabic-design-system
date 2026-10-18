import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.TIRAZ_BROWSER
    ? { executablePath: process.env.TIRAZ_BROWSER }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5198",
  out = process.env.TIRAZ_EVIDENCE || "docs/form-foundation/customer-captures";
await mkdir(out, { recursive: true });
const checks = [];
// Accent is a Radix Select: open it and pick the option by name.
const accentNames = { blue: ["أزرق", "Blue"] };
async function selectAccent(scope, accessibleName, value) {
  await scope.getByLabel(accessibleName, { exact: true }).click();
  const popup = page.locator(".accent-popup");
  await popup
    .getByRole("option", {
      name: new RegExp(`^(${accentNames[value].join("|")})$`),
    })
    .click();
  await popup.waitFor({ state: "detached" });
}
try {
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const density of ["compact", "standard"]) {
        await page.goto(base);
        await page.locator(".language-control").selectOption(language);
        const ar = language === "ar";
        if (
          (await page.locator(".docs-shell").getAttribute("data-doc-theme")) !==
          theme
        )
          await page
            .getByRole("button", {
              name: ar ? "تبديل المظهر" : "Toggle theme",
              exact: true,
            })
            .click();
        // The customer flow lives in the DataTable playground, which follows
        // the rail's system settings.
        await page
          .locator(".docs-sidebar nav")
          .getByRole("button", {
            name: ar ? "جدول البيانات" : "DataTable",
            exact: true,
          })
          .click();
        const rail = page.locator(".customization-rail");
        await rail
          .getByLabel(ar ? "الكثافة" : "Density", { exact: true })
          .selectOption(density);
        await rail
          .getByLabel(ar ? "حجم النص" : "Typography", { exact: true })
          .selectOption("large");
        await selectAccent(rail, ar ? "اللون الأساسي" : "Accent", "blue");
        await page
          .locator(".playground-canvas")
          .getByRole("button", {
            name: ar ? "إضافة عميل" : "Create customer",
            exact: true,
          })
          .click();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(280);
        const dialog = page.getByRole("dialog");
        const controls = await dialog
          .locator(".tz-input,.tz-select-trigger")
          .evaluateAll((elements) =>
            elements.map((el) => {
              const s = getComputedStyle(el),
                r = el.getBoundingClientRect();
              return {
                height: r.height,
                font: s.fontSize,
                radius: s.borderRadius,
                background: s.backgroundColor,
                border: s.borderColor,
                action: s.getPropertyValue("--action"),
                direction: s.direction,
              };
            }),
          );
        assert.ok(
          controls.every(
            (c) =>
              c.height === (density === "compact" ? 32 : 36) &&
              c.font === "16px",
          ),
        );
        await page.screenshot({
          path: `${out}/${language}-${theme}-${density}-form.png`,
        });
        await page
          .getByRole("button", {
            name: ar ? "حفظ العميل" : "Save customer",
            exact: true,
          })
          .click();
        const input = page.getByRole("textbox", {
          name: ar ? "اسم العميل" : "Customer name",
          exact: true,
        });
        assert.equal(await input.getAttribute("aria-invalid"), "true");
        assert.ok(await input.evaluate((el) => el === document.activeElement));
        await page.screenshot({
          path: `${out}/${language}-${theme}-${density}-invalid.png`,
        });
        checks.push({ language, theme, density, controls });
        await page
          .getByRole("button", { name: ar ? "إلغاء" : "Cancel", exact: true })
          .click();
        await page.waitForFunction(() => !document.querySelector(".tz-sheet"));
      }
} catch (error) {
  checks.push({ failure: error.message });
  process.exitCode = 1;
} finally {
  await writeFile(`${out}/results.json`, JSON.stringify(checks, null, 2));
  console.log(JSON.stringify(checks, null, 2));
  await browser.close();
}
