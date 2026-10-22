import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { ids } from "./inventory.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const root = process.env.TIRAZ_URL || "http://127.0.0.1:5212";
const evidence =
  process.env.TIRAZ_EVIDENCE || "docs/sidebar-foundation/menu-browser";
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.TIRAZ_BROWSER ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const checks = [],
  errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const check = (name) => {
  checks.push(name);
  console.log(`PASS ${name}`);
};
// Groups and rows follow navigationGroups in src/workbench/catalog.ts. Every
// page is a button, the fifteen AI parts only while the Parts disclosure is
// open, and the disclosure is one more. So is each of the eleven screens of
// src/examples/frame/screen.ts, which open as pages of the docs.
const pageCount = ids.length;
const partCount = 15;
const screenCount = 11;
const closedRows = pageCount - partCount + 1 + screenCount;
const openRows = pageCount + 1 + screenCount;
const names = {
  ar: [
    "أنماط الذكاء الاصطناعي",
    "النماذج",
    "الملفات",
    "التنقّل",
    "البيانات",
    "العرض والتنبيهات",
    "النوافذ",
    "الرسوم",
  ],
  en: [
    "AI patterns",
    "Forms",
    "Files",
    "Navigation",
    "Data",
    "Display & feedback",
    "Overlays",
    "Charts",
  ],
};
const nav = (language) =>
  page.getByRole("navigation", {
    name: language === "ar" ? "المكوّنات" : "Components",
    exact: true,
  });
const noOverflow = () =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
try {
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"]) {
      await page.goto(root);
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      if (language === "en")
        await page
          .getByRole("combobox", { name: "لغة التوثيق", exact: true })
          .selectOption("en");
      if (theme === "dark")
        await page
          .getByRole("button", {
            name: language === "ar" ? "تبديل المظهر" : "Toggle theme",
            exact: true,
          })
          .click();
      const menu = nav(language);
      assert.deepEqual(
        await menu
          .getByRole("group")
          .evaluateAll((groups) =>
            groups.map((group) => group.getAttribute("aria-label")),
          ),
        names[language],
      );
      assert.equal(await menu.getByRole("button").count(), closedRows);
      for (const group of await menu.getByRole("group").all())
        assert.ok((await group.getByRole("button").count()) > 0);
      // A screen opens as a page of the docs, with the screen in an iframe
      // that follows the docs' language and theme; nothing is a link.
      assert.equal(await menu.getByRole("link").count(), 0);
      const dashboard = menu.getByRole("button", {
        name: language === "ar" ? "لوحة العملاء" : "Customer dashboard",
        exact: true,
      });
      await dashboard.click();
      assert.equal(await dashboard.getAttribute("aria-current"), "page");
      assert.equal(
        await page.getByRole("heading", { level: 1 }).innerText(),
        language === "ar" ? "لوحة العملاء" : "Customer dashboard",
      );
      assert.equal(
        await page.locator(".docs-screen-stage iframe").getAttribute("src"),
        `/examples/dashboard?embed=1${language === "en" ? "&lang=en" : ""}${theme === "dark" ? "&theme=dark" : ""}`,
      );
      const parts = menu.getByRole("button", {
        name: language === "ar" ? "الأجزاء" : "Parts",
        exact: true,
      });
      assert.equal(await parts.getAttribute("aria-expanded"), "false");
      await parts.click();
      assert.equal(await parts.getAttribute("aria-expanded"), "true");
      assert.equal(await menu.getByRole("button").count(), openRows);
      const labels = await menu.getByRole("button").allTextContents();
      assert.equal(new Set(labels).size, openRows);
      assert.equal(
        await menu
          .locator(".component-nav-heading")
          .first()
          .evaluate((el) => getComputedStyle(el).fontSize),
        "12.5px",
      );
      assert.equal(
        await menu
          .getByRole("button")
          .first()
          .evaluate((el) => el.getBoundingClientRect().height),
        32,
      );
      const sidebarButton = menu.getByRole("button", {
        name: language === "ar" ? "شريط التنقّل" : "Sidebar",
        exact: true,
      });
      const previousUrl = page.url();
      await sidebarButton.click();
      assert.equal(page.url(), previousUrl);
      assert.equal(await sidebarButton.getAttribute("aria-current"), "page");
      assert.equal(
        await page.getByRole("heading", { level: 1 }).innerText(),
        language === "ar" ? "شريط التنقّل" : "Sidebar",
      );
      const navBox = await page.locator(".docs-sidebar").boundingBox();
      assert.equal(navBox.width, 190);
      assert.ok(await noOverflow());
      await page.screenshot({ path: `${evidence}/${language}-${theme}.png` });
      check(
        `${language}/${theme}: implemented groups, folded and opened Parts, compact translated rows, selection, unchanged URL/layout`,
      );
    }
  const enMenu = nav("en");
  for (const name of [
    "Terminal",
    "Input",
    "FileTree",
    "Sidebar",
    "DataTable",
    "Alert",
    "Sheet",
    "Line chart",
  ]) {
    const before = page.url();
    await enMenu.getByRole("button", { name, exact: true }).click();
    assert.equal(
      await page.getByRole("heading", { level: 1 }).innerText(),
      name,
    );
    assert.equal(page.url(), before);
    assert.equal(
      await enMenu
        .getByRole("button", { name, exact: true })
        .getAttribute("aria-current"),
      "page",
    );
  }
  await page
    .getByRole("combobox", { name: "Documentation language", exact: true })
    .selectOption("ar");
  assert.equal(
    await nav("ar")
      .getByRole("button", { name: "الرسم الخطي", exact: true })
      .getAttribute("aria-current"),
    "page",
  );
  check(
    "representative pages in every group retain destinations and selection through language change",
  );
  await page.setViewportSize({ width: 1440, height: 380 });
  const arMenu = nav("ar");
  // Parts stays open, as saved; every row takes Tab.
  await arMenu.getByRole("button", { name: "ابدأ مهمة", exact: true }).focus();
  for (let index = 1; index < openRows; index++)
    await page.keyboard.press("Tab");
  assert.equal(
    await arMenu
      .getByRole("button", { name: "الرسم الحلقي", exact: true })
      .evaluate((el) => document.activeElement === el),
    true,
  );
  assert.ok(
    await page
      .locator(".docs-sidebar")
      .evaluate((el) => el.scrollTop > 0 && el.scrollHeight > el.clientHeight),
  );
  await page.screenshot({ path: `${evidence}/short-keyboard-scroll.png` });
  check(
    "all rows, Parts open, reachable by Tab; short desktop menu scrolls internally",
  );
  await page.setViewportSize({ width: 390, height: 440 });
  const trigger = page.getByRole("button", { name: "المكوّنات", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  assert.deepEqual(
    await dialog
      .getByRole("group")
      .evaluateAll((groups) =>
        groups.map((group) => group.getAttribute("aria-label")),
      ),
    names.ar,
  );
  // The drawer shares the saved Parts state, and has its close button.
  assert.equal(await dialog.getByRole("button").count(), openRows + 1);
  await dialog
    .getByRole("button", { name: "الرسم الحلقي", exact: true })
    .focus();
  assert.ok(
    await dialog
      .locator(".docs-drawer-body")
      .evaluate((el) => el.scrollTop > 0),
  );
  await page.screenshot({ path: `${evidence}/mobile-groups-scroll.png` });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  assert.equal(
    await trigger.evaluate((el) => document.activeElement === el),
    true,
  );
  await trigger.click();
  await dialog
    .getByRole("button", { name: "شريط التنقّل", exact: true })
    .click();
  await dialog.waitFor({ state: "hidden" });
  assert.equal(
    await page.getByRole("heading", { level: 1 }).innerText(),
    "شريط التنقّل",
  );
  assert.ok(await noOverflow());
  check(
    "mobile menu shares groups, scrolls, dismisses/restores trigger and selects existing Sidebar page",
  );
  assert.deepEqual(errors, []);
  await writeFile(
    `${evidence}/results.json`,
    JSON.stringify({ root, checks, errors }, null, 2),
  );
} finally {
  await browser.close();
}
