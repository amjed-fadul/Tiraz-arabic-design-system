import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
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
const names = {
  ar: [
    "النماذج",
    "التنقّل",
    "البيانات",
    "العرض والتنبيهات",
    "النوافذ",
    "الرسوم",
  ],
  en: [
    "Forms",
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
      assert.equal(await menu.getByRole("button").count(), 32);
      for (const group of await menu.getByRole("group").all())
        assert.ok((await group.getByRole("button").count()) > 0);
      const labels = await menu.getByRole("button").allTextContents();
      assert.equal(new Set(labels).size, 32);
      assert.ok(
        !(await menu.innerText()).includes(
          language === "ar" ? "الملفات" : "Files",
        ),
      );
      assert.ok(
        !(await menu.innerText()).includes(
          language === "ar" ? "أنماط الذكاء الاصطناعي" : "AI patterns",
        ),
      );
      assert.equal(
        await menu
          .locator(".component-nav-heading")
          .first()
          .evaluate((el) => getComputedStyle(el).fontSize),
        "11px",
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
        `${language}/${theme}: implemented expanded groups, compact translated rows, selection, unchanged URL/layout`,
      );
    }
  const enMenu = nav("en");
  for (const name of [
    "Input",
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
  await arMenu.getByRole("button", { name: "الأزرار", exact: true }).focus();
  for (let index = 0; index < 31; index++) await page.keyboard.press("Tab");
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
    "all expanded rows reachable by Tab; short desktop menu scrolls internally",
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
  assert.equal(await dialog.getByRole("button").count(), 33);
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
