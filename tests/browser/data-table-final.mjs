import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.TIRAZ_BROWSER
    ? { executablePath: process.env.TIRAZ_BROWSER }
    : {}),
});
const page = await browser.newPage();
page.setDefaultTimeout(10000);
const out = "docs/data-table-v1/browser";
const report = { checks: [], errors: [] };
page.on("pageerror", (e) => report.errors.push(e.message));
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5204";
const canvas = () => page.locator(".playground-canvas");
async function setValue(label, value) {
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
async function capture(path) {
  const dialog = page.getByRole("dialog");
  if (await dialog.count())
    await dialog.evaluate((el) =>
      Promise.all(
        el
          .getAnimations()
          .map((animation) => animation.finished.catch(() => {})),
      ),
    );
  await page.screenshot({ path });
}
try {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      "tiraz.documentation.v2",
      JSON.stringify({
        language: "en",
        active: "data-table",
        systemPanelOpen: true,
        inspectorOpen: true,
      }),
    );
  });
  await page.reload({ waitUntil: "networkidle" });
  const search = canvas().locator('input[type="search"]');
  await search.fill("Nadia");
  await canvas()
    .getByRole("button", { name: "Sort Name ascending", exact: true })
    .click();
  await canvas()
    .getByRole("button", { name: "Actions for Nadia Hassan", exact: true })
    .click();
  await setValue("Accent", "blue");
  const menu = page.getByRole("menu");
  assert.equal(await menu.count(), 1);
  const actionToken = await menu.evaluate((el) =>
    getComputedStyle(el).getPropertyValue("--action").trim(),
  );
  assert.equal(
    actionToken,
    await canvas().evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--action").trim(),
    ),
  );
  await page
    .getByRole("menuitem", { name: "View details", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await setValue("Density", "standard");
  await setValue("Typography", "large");
  await setValue("Corner radius", "16");
  await page
    .locator('button[aria-label="Toggle theme"]')
    .evaluate((el) => el.click());
  await setValue("Documentation language", "ar");
  assert.equal(await search.inputValue(), "Nadia");
  assert.match(await dialog.textContent(), /Nadia Hassan/);
  assert.equal(await dialog.getAttribute("dir"), "rtl");
  const tokens = await dialog.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      text: s.getPropertyValue("--text-body").trim(),
      radius: s.getPropertyValue("--radius").trim(),
      control: s.getPropertyValue("--control-small").trim(),
      theme: el.closest(".tiraz-system").dataset.theme,
      direction: s.direction,
    };
  });
  assert.equal(tokens.text, "16px");
  assert.equal(tokens.radius, "16px");
  assert.equal(tokens.control, "36px");
  assert.equal(tokens.theme, "dark");
  assert.equal(tokens.direction, "rtl");
  await page.screenshot({ path: `${out}/live-sheet-dark-arabic-custom.png` });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  assert.equal(
    await canvas().getByRole("table").locator("tbody tr").count(),
    1,
  );
  report.checks.push({
    check:
      "live accent in menu; density/type/radius/theme/language/direction in open Sheet; filter, sort and records preserved",
    tokens,
  });
  // OS reduction with app setting false; narrow 320px layout and create Sheet.
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const create = canvas().getByRole("button", {
    name: "إنشاء عميل",
    exact: true,
  });
  await create.click();
  await dialog.waitFor();
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth),
    320,
  );
  const duration = await dialog.evaluate(
    (el) => getComputedStyle(el).animationDuration,
  );
  assert.equal(duration, "1e-05s");
  await capture(`${out}/arabic-320-os-reduced-sheet.png`);
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  report.checks.push({
    check:
      "320px Arabic no document overflow; OS reduced motion with application reduction false",
    duration,
  });
  // Build/serve the exact clipboard code against only a relocated system directory.
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("http://127.0.0.1:5205", { waitUntil: "networkidle" });
  const table = page.getByRole("table");
  assert.equal(await table.locator("tbody tr").count(), 10);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  assert.match(await page.getByRole("status").textContent(), /11.*20/);
  await page.getByRole("searchbox").fill("Portable");
  assert.match(await table.textContent(), /No matching results/);
  await page
    .getByRole("button", { name: "Create customer", exact: true })
    .click();
  const form = page.getByRole("dialog");
  await form
    .getByRole("textbox", { name: "Customer name", exact: true })
    .fill("Portable عميل");
  await form
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("portable@example.com");
  await form
    .getByRole("button", { name: "Save customer", exact: true })
    .dblclick();
  await form.waitFor({ state: "detached" });
  assert.equal(await table.locator("tbody tr").count(), 1);
  assert.match(await table.textContent(), /Portable عميل/);
  await page
    .getByRole("button", { name: "Dismiss notification", exact: true })
    .click();
  const trigger = page.getByRole("button", {
    name: "Actions for Portable عميل",
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await page
    .getByRole("menuitem", { name: "View details", exact: true })
    .waitFor();
  await page.keyboard.press("Enter");
  await form.waitFor();
  assert.match(await form.textContent(), /portable@example.com/);
  await capture(`${out}/source-copy-details.png`);
  await page.keyboard.press("Escape");
  await form.waitFor({ state: "detached" });
  await page.waitForFunction(
    () =>
      document.activeElement?.getAttribute("aria-label") ===
      "Actions for Portable عميل",
  );
  report.checks.push({
    check:
      "actual clipboard source in standalone copied library app: pagination/search/create-once/Toast/details/keyboard focus restoration",
  });
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.errors.push(error.stack || String(error));
  await page.screenshot({ path: `${out}/final-failure.png` });
  throw error;
} finally {
  await writeFile(
    `${out}/final-results.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
