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
const page = await browser.newPage();
page.setDefaultTimeout(10000);
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5197";
const out = process.env.TIRAZ_EVIDENCE || "docs/form-foundation/browser";
await mkdir(out, { recursive: true });
const report = { checks: [], measurements: [], popups: [], errors: [] };
page.on("pageerror", (e) => report.errors.push(e.message));
async function focused(locator) {
  await page.waitForFunction(
    (id) => document.activeElement?.id === id,
    await locator.getAttribute("id"),
  );
}
async function gone(selector) {
  await page.waitForFunction((s) => !document.querySelector(s), selector);
}
async function openSelect(select) {
  await select.focus();
  await page.keyboard.press("ArrowDown");
  await page.getByRole("listbox").waitFor();
}
async function chooseLast(select) {
  await openSelect(select);
  await page.keyboard.press("End");
  await page.waitForFunction(() =>
    document.activeElement?.textContent?.includes("Choice 45"),
  );
  await page.keyboard.press("Enter");
  await gone(".tz-select-popup");
}
try {
  for (const direction of ["rtl", "ltr"])
    for (const theme of ["light", "dark"])
      for (const density of ["compact", "standard"])
        for (const typography of ["standard", "large"]) {
          await page.setViewportSize({ width: 800, height: 700 });
          await page.goto(
            `${base}/tests/browser/forms-fixture.html?dir=${direction}&theme=${theme}&density=${density}&typography=${typography}`,
          );
          await page.evaluate(() => document.fonts.ready);
          const geometry = await page.getByTestId("geometry").evaluate((el) =>
            Array.from(el.children).map((row) => ({
              size: row.dataset.size,
              controls: Array.from(row.querySelectorAll("button,input")).map(
                (c) => {
                  const s = getComputedStyle(c),
                    r = c.getBoundingClientRect();
                  return {
                    class: c.className,
                    height: r.height,
                    font: s.fontSize,
                    padding: s.paddingInline,
                    radius: s.borderRadius,
                    background: s.backgroundColor,
                    action: s.getPropertyValue("--action"),
                  };
                },
              ),
            })),
          );
          for (const row of geometry)
            assert.ok(
              row.controls.every(
                (c) => Math.abs(c.height - row.controls[0].height) < 0.5,
              ),
              JSON.stringify(geometry),
            );
          report.measurements.push({
            direction,
            theme,
            density,
            typography,
            geometry,
          });
          await chooseLast(
            page.getByRole("combobox", {
              name: "Uncontrolled choice",
              exact: true,
            }),
          );
          await page
            .getByRole("button", { name: "Reset", exact: true })
            .click();
          await page
            .getByRole("combobox", { name: "Uncontrolled choice", exact: true })
            .getByText("One", { exact: true })
            .waitFor();
          assert.ok(
            (
              await page
                .getByRole("combobox", {
                  name: "Uncontrolled choice",
                  exact: true,
                })
                .textContent()
            ).includes("One"),
          );
        }
  for (const typography of ["standard", "large"])
    for (const size of ["sm", "md"]) {
      const rows = report.measurements.filter(
        (r) =>
          r.direction === "rtl" &&
          r.theme === "light" &&
          r.typography === typography,
      );
      const h = (d) =>
        rows.find((r) => r.density === d).geometry.find((r) => r.size === size)
          .controls[1].height;
      assert.ok(h("standard") > h("compact"));
    }
  report.checks.push(
    "All 16 provider combinations; aligned Button/Input/Select geometry; density at both typography scales; uncontrolled reset after real selection",
  );
  // Native form submission, required focus, disabled/readOnly, controlled reset.
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await focused(
    page.getByRole("combobox", { name: "Required choice", exact: true }),
  );
  assert.equal(
    await page
      .getByRole("combobox", { name: "Required choice", exact: true })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page
    .getByRole("textbox", { name: "Native text", exact: true })
    .fill("مدار ACME");
  await page
    .getByRole("textbox", { name: "Controlled text", exact: true })
    .fill("Changed");
  await chooseLast(
    page.getByRole("combobox", { name: "Controlled choice", exact: true }),
  );
  const required = page.getByRole("combobox", {
    name: "Required choice",
    exact: true,
  });
  await openSelect(required);
  await page.keyboard.press("Home");
  await page.waitForTimeout(30);
  await page.keyboard.press("Enter");
  await gone(".tz-select-popup");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  assert.deepEqual(
    JSON.parse(await page.getByTestId("form-data").textContent()),
    {
      text: "مدار ACME",
      controlledText: "Changed",
      uncontrolled: "one",
      controlled: "choice44",
      required: "one",
      readonly: "Kept",
    },
  );
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Controlled choice", exact: true })
    .getByText("One", { exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("textbox", { name: "Controlled text", exact: true })
      .inputValue(),
    "Original",
  );
  assert.ok(
    (
      await page
        .getByRole("combobox", { name: "Controlled choice", exact: true })
        .textContent()
    ).includes("One"),
  );
  report.checks.push(
    "Native FormData, required visible focus, disabled exclusion, readonly value, controlled reset callback and host Input reset",
  );
  // Short/narrow nested popup and opening interaction reliability with stationary pointer.
  for (const dir of ["rtl", "ltr"])
    for (const theme of ["light", "dark"])
      for (const density of ["compact", "standard"])
        for (const motion of ["normal", "reduce"])
          for (const viewport of [
            { width: 320, height: 420 },
            { width: 800, height: 340 },
          ]) {
            await page.setViewportSize(viewport);
            await page.goto(
              `${base}/tests/browser/forms-fixture.html?dir=${dir}&theme=${theme}&motion=${motion}&density=${density}`,
            );
            await page.evaluate(() => document.fonts.ready);
            console.log("Nested case", dir, theme, density, motion, viewport);
            const ar = dir === "rtl",
              create = page.getByRole("button", {
                name: ar ? "إنشاء عميل" : "Create customer",
                exact: true,
              });
            await create.click();
            await page.getByRole("dialog").waitFor();
            await page.waitForTimeout(260);
            const status = page.getByRole("combobox", {
              name: ar ? "الحالة" : "Status",
              exact: true,
            });
            await status.scrollIntoViewIfNeeded();
            const box = await status.boundingBox();
            await page.mouse.move(
              box.x + box.width / 2,
              Math.min(viewport.height - 15, box.y + box.height + 15),
            );
            await status.focus();
            await page.keyboard.press("ArrowDown");
            await page.waitForTimeout(15);
            await page.keyboard.press("End");
            await page.waitForFunction(
              (text) =>
                document.activeElement?.getAttribute("role") === "option" &&
                document.activeElement?.textContent?.includes(text),
              ar ? "متوقف" : "Paused",
            );
            assert.ok(
              (await page.locator(":focus").textContent()).includes(
                ar ? "متوقف" : "Paused",
              ),
            );
            await page.keyboard.press("Enter");
            await gone(".tz-select-popup");
            await focused(status);
            assert.ok(
              (await status.textContent()).includes(ar ? "متوقف" : "Paused"),
            );
            assert.ok(
              await status.evaluate((el) => el === document.activeElement),
            );
            await openSelect(status);
            await page.waitForTimeout(160);
            const popup = await page.getByRole("listbox").evaluate((el) => {
              const r = el.getBoundingClientRect(),
                s = getComputedStyle(el);
              return {
                top: r.top,
                bottom: r.bottom,
                height: r.height,
                direction: s.direction,
                background: s.backgroundColor,
                animation: s.animationDuration,
                insideSheet: !!el.closest(".tz-sheet"),
                transform: s.transform,
              };
            });
            assert.ok(popup.insideSheet);
            assert.equal(popup.direction, dir);
            assert.ok(popup.top >= 0 && popup.bottom <= viewport.height + 0.5);
            assert.equal(popup.transform, "none");
            if (motion === "reduce")
              assert.ok(parseFloat(popup.animation) <= 0.00001);
            await page.screenshot({
              path: `${out}/${dir}-${theme}-${density}-${motion}-${viewport.width}-popup.png`,
            });
            report.popups.push({
              dir,
              theme,
              density,
              motion,
              viewport,
              popup,
            });
            await page.keyboard.press("Escape");
            await gone(".tz-select-popup");
            await focused(status);
            assert.ok(
              await status.evaluate((el) => el === document.activeElement),
            );
            await page.keyboard.press("Tab");
            assert.ok(
              await page
                .getByRole("dialog")
                .evaluate((el) => el.contains(document.activeElement)),
            );
            await page
              .getByRole("button", {
                name: ar ? "حفظ العميل" : "Save customer",
                exact: true,
              })
              .click();
            assert.ok(
              await page
                .getByRole("textbox", {
                  name: ar ? "اسم العميل" : "Customer name",
                  exact: true,
                })
                .evaluate((el) => el === document.activeElement),
            );
            await page
              .getByRole("textbox", {
                name: ar ? "اسم العميل" : "Customer name",
                exact: true,
              })
              .fill("مدار ACME");
            const email = page.getByRole("textbox", {
              name: ar ? "البريد الإلكتروني" : "Email",
              exact: true,
            });
            await email.fill("invalid");
            await page
              .getByRole("button", {
                name: ar ? "حفظ العميل" : "Save customer",
                exact: true,
              })
              .click();
            assert.ok(
              await email.evaluate((el) => el === document.activeElement),
            );
            await email.fill("hello@acme.example");
            await page
              .getByRole("button", {
                name: ar ? "حفظ العميل" : "Save customer",
                exact: true,
              })
              .dblclick();
            await gone(".tz-sheet");
            assert.equal(
              await page
                .getByRole("list", {
                  name: ar ? "العملاء" : "Customers",
                  exact: true,
                })
                .locator("li")
                .count(),
              1,
            );
            assert.ok(
              await create.evaluate((el) => el === document.activeElement),
            );
            await page.screenshot({
              path: `${out}/${dir}-${theme}-${density}-${motion}-${viewport.width}-saved.png`,
            });
            await create.click();
            assert.equal(
              await page
                .getByRole("textbox", {
                  name: ar ? "اسم العميل" : "Customer name",
                  exact: true,
                })
                .inputValue(),
              "",
            );
            await page
              .getByRole("textbox", {
                name: ar ? "اسم العميل" : "Customer name",
                exact: true,
              })
              .fill("Discard");
            await page
              .getByRole("button", {
                name: ar ? "إلغاء" : "Cancel",
                exact: true,
              })
              .click();
            await gone(".tz-sheet");
            await create.click();
            assert.equal(
              await page
                .getByRole("textbox", {
                  name: ar ? "اسم العميل" : "Customer name",
                  exact: true,
                })
                .inputValue(),
              "",
            );
            await page
              .getByRole("button", {
                name: ar ? "إغلاق نموذج العميل" : "Close customer form",
                exact: true,
              })
              .click();
            await gone(".tz-sheet");
          }
  report.checks.push(
    "32 compact/standard narrow/short nested popup and customer flow combinations; early End/Enter with stationary pointer; Escape, Tab, validation, cancellation, duplicate save guard and clean reopening",
  );
  await page.goto(`${base}/tests/browser/forms-fixture.html?dir=ltr`);
  await page
    .getByRole("combobox", { name: "Uncontrolled choice", exact: true })
    .evaluate((el) => {
      const native = el.parentElement.querySelector("select");
      native.required = true;
      native.value = "";
    });
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await focused(
    page.getByRole("combobox", { name: "Uncontrolled choice", exact: true }),
  );
  assert.ok(
    await page
      .getByRole("combobox", { name: "Uncontrolled choice", exact: true })
      .evaluate((el) => el === document.activeElement),
  );
  report.checks.push(
    "Multiple invalid native Selects preserve first-control form order",
  );
  // Long list scroll, disabled skip, typeahead and actual pointer hover.
  await page.setViewportSize({ width: 320, height: 340 });
  await page.goto(`${base}/tests/browser/forms-fixture.html?dir=ltr`);
  const long = page.getByRole("combobox", {
    name: "Uncontrolled choice",
    exact: true,
  });
  await openSelect(long);
  await page.keyboard.press("ArrowDown");
  await page.waitForFunction(
    () => document.activeElement?.textContent === "Two",
  );
  await page.keyboard.type("Choice 45");
  await page.waitForFunction(
    () => document.activeElement?.textContent === "Choice 45",
  );
  const scroll = await page.locator(".tz-select-viewport").evaluate((el) => ({
    scroll: el.scrollTop,
    height: el.clientHeight,
    total: el.scrollHeight,
  }));
  assert.ok(scroll.scroll > 0 && scroll.total > scroll.height);
  const target = page.getByRole("option", { name: "Choice 44", exact: true });
  await target.hover();
  assert.ok(await target.evaluate((el) => el === document.activeElement));
  await target.click();
  await gone(".tz-select-popup");
  assert.ok((await long.textContent()).includes("Choice 44"));
  report.checks.push(
    "Long list internal scroll, disabled option skipped, typeahead, real hover/click",
  );
  report.longScroll = scroll;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openSelect(long);
  const duration = await page
    .getByRole("listbox")
    .evaluate((el) => getComputedStyle(el).animationDuration);
  assert.ok(parseFloat(duration) <= 0.00001);
  report.checks.push("OS reduced motion overrides application motion");
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.failure = {
    message: error.message,
    stack: error.stack,
    focus: await page.evaluate(() =>
      document.activeElement?.outerHTML?.slice(0, 1000),
    ),
    url: page.url(),
  };
  await page.screenshot({ path: `${out}/failure.png` });
  process.exitCode = 1;
} finally {
  await writeFile(`${out}/results.json`, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        checks: report.checks,
        measurements: report.measurements.length,
        popups: report.popups.length,
        failure: report.failure,
        errors: report.errors,
      },
      null,
      2,
    ),
  );
  await browser.close();
}
