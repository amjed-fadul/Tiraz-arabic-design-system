import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5204";
const out = process.env.TIRAZ_EVIDENCE || "docs/data-table-v1/browser";
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
const report = { checks: [], measurements: [], captures: [], errors: [] };
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") report.errors.push(m.text());
});
async function load(c) {
  await page.setViewportSize({ width: c.width, height: 1000 });
  await page.emulateMedia({
    reducedMotion: c.motion ? "reduce" : "no-preference",
  });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate((c) => {
    localStorage.clear();
    localStorage.setItem(
      "tiraz.documentation.v2",
      JSON.stringify({
        language: c.language,
        active: "data-table",
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
        accent: "sage",
        radius: 8,
        reducedMotion: c.motion,
      }),
    );
  }, c);
  await page.reload();
  await page
    .getByRole("heading", {
      level: 1,
      name: c.language === "ar" ? "جدول البيانات" : "DataTable",
      exact: true,
    })
    .waitFor();
  await page.evaluate(() => document.fonts.ready);
}
const canvas = () => page.locator(".playground-canvas");
const table = () => canvas().getByRole("table");
async function shot(name) {
  const dialog = page.getByRole("dialog");
  if (await dialog.count())
    await dialog.evaluate((el) =>
      Promise.all(
        el
          .getAnimations()
          .map((animation) => animation.finished.catch(() => {})),
      ),
    );
  await page.screenshot({ path: `${out}/${name}.png` });
  report.captures.push(`${name}.png`);
}
// The open overlay blocks the rail, so pick the Accent option with the
// Radix Select trigger's closed-state typeahead.
async function chooseAccent(name) {
  const trigger = page.getByLabel("Accent", { exact: true });
  await trigger.evaluate((el, name) => {
    for (const key of name)
      el.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
      );
  }, name);
  await page.waitForFunction(
    ([el, name]) => el.textContent.trim() === name,
    [await trigger.elementHandle(), name],
  );
}
async function preset(value, ar = false) {
  if ((await page.viewportSize()).width < 800) {
    await page
      .getByRole("button", {
        name: ar ? "تخصيص المكوّنات" : "System settings",
        exact: true,
      })
      .click();
    await page
      .locator(".docs-drawer")
      .getByLabel(ar ? "حالة المثال" : "Example state", { exact: true })
      .selectOption(value);
    await page.keyboard.press("Escape");
    await page.locator(".docs-drawer").waitFor({ state: "detached" });
  } else
    await page
      .getByLabel(ar ? "حالة المثال" : "Example state", { exact: true })
      .selectOption(value);
}
try {
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const density of ["compact", "standard"])
        for (const typography of ["standard", "large"])
          for (const width of [1440, 390]) {
            const c = {
              language,
              theme,
              density,
              typography,
              width,
              motion: width === 390,
            };
            await load(c);
            assert.equal(await table().locator("tbody tr").count(), 10);
            const g = await canvas().evaluate((el) => {
              const container = el.querySelector(".tz-table-container"),
                cell = el.querySelector("tbody th"),
                row = cell.parentElement,
                style = getComputedStyle(cell);
              return {
                documentWidth: document.documentElement.scrollWidth,
                viewportWidth: innerWidth,
                scrollWidth: container.scrollWidth,
                containerWidth: container.clientWidth,
                fontSize: style.fontSize,
                padding: style.paddingBlockStart,
                fontFamily: style.fontFamily,
                direction: getComputedStyle(container).direction,
                rowHeight: row.getBoundingClientRect().height,
                animations:
                  el.querySelectorAll("tbody tr").length &&
                  getComputedStyle(row).animationName,
                fontLoaded: document.fonts.check('14px "IBM Plex Sans Arabic"'),
              };
            });
            assert.equal(g.documentWidth, g.viewportWidth, JSON.stringify(g));
            assert.equal(g.fontSize, typography === "large" ? "16px" : "14px");
            assert.equal(g.padding, density === "compact" ? "4px" : "8px");
            assert.equal(g.direction, language === "ar" ? "rtl" : "ltr");
            assert.ok(g.fontLoaded);
            assert.equal(g.animations, "none");
            if (width === 390) {
              assert.ok(g.scrollWidth > g.containerWidth);
              const container = canvas().locator(".tz-table-container");
              await container.focus();
              const before = await container.evaluate((el) => el.scrollLeft);
              await page.keyboard.press(
                language === "ar" ? "ArrowLeft" : "ArrowRight",
              );
              await page.waitForFunction(
                ({ before }) =>
                  document.querySelector(
                    ".playground-canvas .tz-table-container",
                  ).scrollLeft !== before,
                { before },
              );
            }
            if (
              (density === "compact" && typography === "standard") ||
              (density === "standard" && typography === "large")
            ) {
              await canvas()
                .locator(".tz-table-container")
                .evaluate((el) => {
                  el.scrollLeft = 0;
                });
              await page.evaluate(() => window.scrollTo(0, 0));
              await shot(
                `table-${language}-${theme}-${density}-${typography}-${width}`,
              );
            }
            const next = canvas().getByRole("button", {
              name: language === "ar" ? "التالي" : "Next",
              exact: true,
            });
            await next.click();
            assert.match(
              await canvas()
                .locator(".tz-data-pagination [role=status]")
                .textContent(),
              /11.*20/,
            );
            const search = canvas().getByRole("searchbox");
            await search.fill("nadia");
            assert.equal(await table().locator("tbody tr").count(), 1);
            assert.match(await table().textContent(), /Nadia Hassan/);
            assert.ok(
              await search.evaluate((el) => el === document.activeElement),
            );
            const name = canvas().locator("thead button").first();
            await name.focus();
            await page.keyboard.press("Enter");
            assert.equal(
              await table()
                .locator("thead th")
                .first()
                .getAttribute("aria-sort"),
              "ascending",
            );
            assert.ok(
              await name.evaluate((el) => el === document.activeElement),
            );
            await page.keyboard.press("Space");
            assert.equal(
              await table()
                .locator("thead th")
                .first()
                .getAttribute("aria-sort"),
              "descending",
            );
            await search.fill("");
            report.measurements.push({ ...c, ...g });
            report.checks.push({
              ...c,
              check:
                "native semantics, font/tokens, no document overflow, internal keyboard scroll, pagination/search/sort focus",
            });
          }
  const c = {
    language: "en",
    theme: "light",
    density: "compact",
    typography: "standard",
    width: 1440,
    motion: false,
  };
  await load(c);
  // Stable rows and email sorting with a small filtered subset.
  await canvas().getByRole("searchbox").fill("atlas");
  await table()
    .locator("tbody tr")
    .first()
    .evaluate((el) => (el.dataset.identity = "original"));
  await canvas()
    .getByRole("button", { name: "Sort Email ascending", exact: true })
    .click();
  assert.equal(await table().locator("tr[data-identity=original]").count(), 1);
  await canvas().getByRole("combobox", { name: "Customer status" }).click();
  await page.getByRole("option", { name: "Paused", exact: true }).click();
  assert.equal(await table().locator("tbody tr").count(), 1);
  assert.match(await table().textContent(), /Atlas Design/);
  await canvas().getByRole("searchbox").fill("Nadia");
  assert.match(await table().textContent(), /No matching results/);
  await shot("no-matching-results");
  await preset("loading");
  assert.equal(await table().getAttribute("aria-busy"), "true");
  assert.match(await table().textContent(), /Loading customers/);
  await shot("loading");
  await preset("error");
  assert.match(await table().textContent(), /Unable to show/);
  await shot("error");
  await canvas().getByRole("button", { name: "Retry", exact: true }).click();
  assert.equal(await table().locator("tbody tr").count(), 10);
  await preset("empty");
  assert.match(await table().textContent(), /No customers yet/);
  await shot("empty");
  const search = canvas().getByRole("searchbox");
  await search.fill("Copy");
  const create = canvas().getByRole("button", {
    name: "Create customer",
    exact: true,
  });
  await create.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  const name = dialog.getByRole("textbox", {
    name: "Customer name",
    exact: true,
  });
  const email = dialog.getByRole("textbox", { name: "Email", exact: true });
  const save = dialog.getByRole("button", {
    name: "Save customer",
    exact: true,
  });
  await save.click();
  assert.ok(await name.evaluate((el) => el === document.activeElement));
  await name.fill("Copy عميل");
  await email.fill("invalid");
  await save.click();
  assert.ok(await email.evaluate((el) => el === document.activeElement));
  await email.fill("copy@sample.example");
  await save.dblclick();
  await dialog.waitFor({ state: "detached" });
  assert.equal(await table().locator("tbody tr").count(), 1);
  assert.equal(await search.inputValue(), "Copy");
  assert.ok(await create.evaluate((el) => el === document.activeElement));
  await page
    .getByRole("button", { name: "Dismiss notification", exact: true })
    .click();
  const action = canvas().getByRole("button", {
    name: "Actions for Copy عميل",
    exact: true,
  });
  await action.focus();
  await page.keyboard.press("ArrowDown");
  await page
    .getByRole("menuitem", { name: "View details", exact: true })
    .waitFor();
  await page.keyboard.press("Enter");
  await dialog.waitFor();
  assert.match(await dialog.textContent(), /copy@sample.example/);
  await shot("created-customer-details");
  await page.keyboard.press("Tab");
  assert.ok(await dialog.evaluate((el) => el.contains(document.activeElement)));
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  await page.waitForFunction(
    () =>
      document.activeElement?.getAttribute("aria-label") ===
      "Actions for Copy عميل",
  );
  await create.click();
  assert.equal(await name.inputValue(), "");
  await name.fill("Discard draft");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await dialog.waitFor({ state: "detached" });
  await create.click();
  assert.equal(await name.inputValue(), "");
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  report.checks.push({
    check:
      "combined filters, stable row identity/email sort, explicit presets/Retry, validation, double save, filter retention, details identity, keyboard modal focus/dismiss/restore, draft discard",
  });
  // Live customization with open overlays; no remount of records.
  await preset("populated");
  const rowAction = canvas().getByRole("button", {
    name: "Actions for Nadia Hassan",
    exact: true,
  });
  await rowAction.click();
  await chooseAccent("Purple");
  const menuAction = await page
    .locator(".tz-menu")
    .evaluate((el) => getComputedStyle(el).getPropertyValue("--action").trim());
  // accentColors.plum.light in src/system/config.ts.
  assert.equal(menuAction.toUpperCase(), "#6B487A");
  assert.equal(
    menuAction,
    await canvas().evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--action").trim(),
    ),
  );
  await shot("live-menu-plum");
  await page
    .getByRole("menuitem", { name: "View details", exact: true })
    .click();
  await dialog.waitFor();
  // Modal blocks pointer access to settings. Native control change events exercise the same live provider path.
  await page.getByLabel("Density", { exact: true }).evaluate((el) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value",
    ).set;
    setter.call(el, "standard");
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.getByLabel("Typography", { exact: true }).evaluate((el) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value",
    ).set;
    setter.call(el, "large");
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.getByLabel("Corner radius", { exact: true }).evaluate((el) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set;
    setter.call(el, "16");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  assert.match(await dialog.textContent(), /Nadia Hassan/);
  assert.equal(
    await dialog.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--text-body").trim(),
    ),
    "16px",
  );
  await shot("live-sheet-large-standard");
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  await page.getByRole("button", { name: "Copy code", exact: true }).click();
  const code = await page.evaluate(() => navigator.clipboard.readText());
  await writeFile(`${out}/copied-example.tsx`, code);
  assert.match(code, /function CustomerDataTable/);
  await page
    .getByRole("button", { name: "Copy agent prompt", exact: true })
    .click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(prompt.endsWith(code + "```"));
  report.checks.push({
    check:
      "live accent in open menu, density/type/radius in open details Sheet, clipboard code/prompt",
  });
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.errors.push(error.stack || String(error));
  await shot("failure");
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
        captures: report.captures.length,
        errors: report.errors,
      },
      null,
      2,
    ),
  );
  await browser.close();
}
