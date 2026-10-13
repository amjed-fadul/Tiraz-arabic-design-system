import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5175";
const out = process.env.TIRAZ_EVIDENCE || "docs/table-foundation/browser";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.TIRAZ_BROWSER
    ? { executablePath: process.env.TIRAZ_BROWSER }
    : {}),
});
const context = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
const report = { measurements: [], checks: [], captures: [], errors: [] };
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") report.errors.push(m.text());
});
async function load(c, active) {
  await page.setViewportSize({
    width: c.width,
    height: c.width < 500 ? 844 : 1000,
  });
  await page.goto(base);
  await page.evaluate(
    ({ c, active }) => {
      localStorage.clear();
      localStorage.setItem(
        "tiraz.documentation.v2",
        JSON.stringify({
          language: c.language,
          active,
          systemPanelOpen: true,
          inspectorOpen: true,
        }),
      );
      localStorage.setItem("tiraz.theme.v1", JSON.stringify(c.theme));
      localStorage.setItem(
        "tiraz.system.v3",
        JSON.stringify({
          density: c.density,
          typography: c.typography,
          accent: "blue",
          radius: 12,
        }),
      );
    },
    { c, active },
  );
  await page.reload();
  await page
    .getByRole("heading", {
      level: 1,
      name:
        active === "table"
          ? c.language === "ar"
            ? "الجدول"
            : "Table"
          : c.language === "ar"
            ? "اللوحة الجانبية"
            : "Sheet",
      exact: true,
    })
    .waitFor();
  await page.evaluate(() => document.fonts.ready);
}
async function geometry(container, c, active) {
  const g = await container.evaluate((el) => {
    const table = el.querySelector("table"),
      row = table.querySelector("tbody tr"),
      cell = row.querySelector("th,td"),
      s = getComputedStyle(cell),
      cs = getComputedStyle(el),
      r = el.getBoundingClientRect();
    return {
      containerWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      tableWidth: table.getBoundingClientRect().width,
      rowHeight: row.getBoundingClientRect().height,
      paddingBlock: s.paddingBlockStart,
      fontSize: s.fontSize,
      alignment: s.textAlign,
      direction: cs.direction,
      background: cs.backgroundColor,
      radius: cs.borderRadius,
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      left: r.left,
      right: r.right,
      wrap: s.overflowWrap,
      headers: [...table.querySelectorAll("thead th")].map((h) =>
        h.getAttribute("scope"),
      ),
    };
  });
  assert.equal(g.documentWidth, g.viewportWidth, JSON.stringify(g));
  assert.equal(g.fontSize, c.typography === "large" ? "16px" : "14px");
  assert.equal(g.paddingBlock, c.density === "compact" ? "4px" : "8px");
  assert.equal(g.direction, c.language === "ar" ? "rtl" : "ltr");
  assert.equal(g.alignment, "start");
  assert.equal(g.wrap, "anywhere");
  assert.deepEqual(g.headers, ["col", "col", "col"]);
  assert.ok(g.right <= c.width + 1 && g.left >= -1, JSON.stringify(g));
  assert.equal(g.radius, "12px");
  assert.equal(await container.getAttribute("tabindex"), "0");
  if (c.width === 390) {
    assert.ok(g.scrollWidth > g.containerWidth, JSON.stringify(g));
    await container.focus();
    const before = await container.evaluate((el) => el.scrollLeft);
    await page.keyboard.press(c.language === "ar" ? "ArrowLeft" : "ArrowRight");
    await page.waitForFunction(
      ({ id, before }) => document.querySelector(id).scrollLeft !== before,
      {
        id:
          active === "table"
            ? ".playground-canvas .tz-table-container"
            : ".customer-example .tz-table-container",
        before,
      },
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollLeft),
      0,
    );
    await container.evaluate((el) => {
      el.scrollLeft = 0;
    });
  }
  report.measurements.push({ ...c, active, ...g });
}
function capture(c) {
  return (
    (c.density === "compact" && c.typography === "standard") ||
    (c.density === "standard" &&
      c.typography === "large" &&
      ((c.language === "en" && c.theme === "light") ||
        (c.language === "ar" && c.theme === "dark")))
  );
}
async function shot(c, active, suffix = "") {
  const name = `${active}-${c.language}-${c.theme}-${c.density}-${c.typography}-${c.width}${suffix}.png`;
  await page.screenshot({ path: `${out}/${name}` });
  report.captures.push(name);
}
try {
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const density of ["compact", "standard"])
        for (const typography of ["standard", "large"])
          for (const width of [1440, 390]) {
            const c = { language, theme, density, typography, width },
              ar = language === "ar",
              name = ar ? "العملاء" : "Customers";
            await load(c, "table");
            const table = page
              .locator(".playground-canvas")
              .getByRole("table", { name, exact: true });
            assert.equal(await table.locator("tbody tr").count(), 2);
            assert.equal(await table.locator("tbody th[scope=row]").count(), 2);
            await geometry(
              page.locator(".playground-canvas .tz-table-container"),
              c,
              "table",
            );
            if (capture(c)) await shot(c, "table");
            if (width === 390)
              await page
                .getByRole("button", {
                  name: ar ? "تخصيص المكونات" : "System settings",
                  exact: true,
                })
                .click();
            await (width === 390 ? page.locator(".docs-drawer") : page)
              .getByLabel(ar ? "المحتوى" : "Content", { exact: true })
              .selectOption("empty");
            if (width === 390) {
              await page.keyboard.press("Escape");
              await page.locator(".docs-drawer").waitFor({ state: "detached" });
            }
            await table.locator("tbody td[colspan='3']").waitFor();
            assert.equal(
              await table.locator("tbody td[colspan='3']").count(),
              1,
            );
            assert.match(
              await table.textContent(),
              ar ? /لا يوجد عملاء بعد/ : /No customers yet/,
            );
            report.checks.push({
              ...c,
              check:
                "Table populated/empty semantics, shared settings and internal keyboard scrolling",
            });
            await load(c, "sheet");
            const customers = page
              .locator(".customer-example")
              .getByRole("table", { name, exact: true });
            assert.match(
              await customers.textContent(),
              ar ? /لا يوجد عملاء بعد/ : /No customers yet/,
            );
            const create = page.getByRole("button", {
              name: ar ? "إنشاء عميل" : "Create customer",
              exact: true,
            });
            await create.click();
            const dialog = page.getByRole("dialog"),
              save = page.getByRole("button", {
                name: ar ? "حفظ العميل" : "Save customer",
                exact: true,
              });
            const input = dialog.getByRole("textbox", {
              name: ar ? "اسم العميل" : "Customer name",
              exact: true,
            });
            await save.click();
            assert.ok(
              await input.evaluate((el) => el === document.activeElement),
            );
            await input.fill(
              ar
                ? "شركة مدار للتقنية والخدمات"
                : "Madar Technology and Services",
            );
            const email = dialog.getByRole("textbox", {
              name: ar ? "البريد الإلكتروني" : "Email",
              exact: true,
            });
            await email.fill("invalid");
            await save.click();
            assert.ok(
              await email.evaluate((el) => el === document.activeElement),
            );
            await email.fill("hello@madar.example");
            const select = dialog.getByRole("combobox");
            await select.focus();
            await page.keyboard.press("ArrowDown");
            await page.getByRole("listbox").waitFor();
            await page.keyboard.press("End");
            await page.waitForFunction(
              (paused) => document.activeElement?.textContent === paused,
              ar ? "متوقف" : "Paused",
            );
            await page.keyboard.press("Enter");
            await page.getByRole("listbox").waitFor({ state: "detached" });
            await select
              .getByText(ar ? "متوقف" : "Paused", { exact: true })
              .waitFor();
            if (capture(c) && c.width === 390) await shot(c, "sheet", "-form");
            await save.dblclick();
            await dialog.waitFor({ state: "detached" });
            assert.equal(await customers.locator("tbody tr").count(), 1);
            assert.match(await customers.textContent(), /hello@madar.example/);
            assert.match(
              await customers.textContent(),
              ar ? /متوقف/ : /Paused/,
            );
            assert.ok(
              await create.evaluate((el) => el === document.activeElement),
            );
            assert.equal(
              await page
                .getByText(ar ? "تم إنشاء العميل" : "Customer created", {
                  exact: true,
                })
                .count(),
              1,
            );
            await geometry(
              page.locator(".customer-example .tz-table-container"),
              c,
              "sheet",
            );
            if (capture(c)) await shot(c, "sheet");
            await page
              .getByRole("button", {
                name: ar ? "إغلاق التنبيه" : "Dismiss notification",
                exact: true,
              })
              .click();
            await create.click();
            assert.equal(await input.inputValue(), "");
            await input.fill("Discard this draft");
            await page
              .getByRole("button", {
                name: ar ? "إلغاء" : "Cancel",
                exact: true,
              })
              .click();
            await dialog.waitFor({ state: "detached" });
            await create.click();
            assert.equal(await input.inputValue(), "");
            await page.keyboard.press("Escape");
            await dialog.waitFor({ state: "detached" });
            assert.equal(await customers.locator("tbody tr").count(), 1);
            report.checks.push({
              ...c,
              check:
                "Sheet validates/focuses, status selection, saves once/toast, restores focus and cancels drafts",
            });
          }
  // Actual clipboard contents and a saved caption persist across reload.
  await load(
    {
      language: "en",
      theme: "light",
      density: "compact",
      typography: "standard",
      width: 1440,
    },
    "table",
  );
  await page.getByLabel("Caption", { exact: true }).fill("Team records");
  await page.getByLabel("Content", { exact: true }).selectOption("empty");
  await page.getByRole("button", { name: "Copy code", exact: true }).click();
  const code = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(code, /<Table caption=\{"Team records"\}/);
  assert.match(code, /colSpan=\{3\}/);
  await page
    .getByRole("button", { name: "Copy agent prompt", exact: true })
    .click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(prompt.endsWith(code + "```"));
  assert.match(prompt, /ai\/registry.json/);
  await page.reload();
  assert.equal(
    await page.getByLabel("Caption", { exact: true }).inputValue(),
    "Team records",
  );
  report.checks.push({
    check: "Complete clipboard code/prompt and saved Table caption/preset",
  });
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const typography of ["standard", "large"])
        for (const width of [1440, 390]) {
          const find = (density) =>
            report.measurements.find(
              (m) =>
                m.active === "table" &&
                m.language === language &&
                m.theme === theme &&
                m.typography === typography &&
                m.width === width &&
                m.density === density,
            );
          const compact = find("compact"),
            standard = find("standard");
          assert.ok(
            standard.rowHeight > compact.rowHeight,
            JSON.stringify({ compact, standard }),
          );
        }
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.errors.push(error.stack || String(error));
  await page.screenshot({ path: `${out}/failure.png` });
  throw error;
} finally {
  await writeFile(
    `${out}/results.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify(
      {
        measurements: report.measurements.length,
        checks: report.checks.length,
        screenshots: report.captures.length,
        errors: report.errors,
      },
      null,
      2,
    ),
  );
  await browser.close();
}
