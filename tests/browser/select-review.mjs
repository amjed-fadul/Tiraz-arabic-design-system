import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.TIRAZ_BROWSER
    ? { executablePath: process.env.TIRAZ_BROWSER }
    : {}),
});
const page = await browser.newPage();
page.setDefaultTimeout(5000);
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5201",
  out =
    process.env.TIRAZ_EVIDENCE || "docs/form-foundation/select-review/browser";
await mkdir(out, { recursive: true });
const result = { checks: [], failures: [], errors: [] };
page.on("pageerror", (error) => result.errors.push(error.message));
async function check(name, fn) {
  try {
    const detail = await fn();
    result.checks.push({ name, ...detail });
  } catch (error) {
    result.failures.push({ name, error: error.message });
  }
}
async function load(params) {
  await page.goto(
    `${base}/tests/browser/select-review-fixture.html?${new URLSearchParams(params)}`,
  );
  await page.getByRole("combobox", { name: "Choice", exact: true }).waitFor();
}
async function sample() {
  return page.evaluate(() => ({
    display: document.querySelector("#first-choice").textContent,
    submitted: new FormData(document.querySelector("form")).get("choice"),
    application: document.querySelector('[data-testid="application"]')
      .textContent,
    changes: JSON.parse(
      document.querySelector('[data-testid="changes"]').textContent,
    ),
    focus: document.activeElement.id,
  }));
}
async function validate(method) {
  if (method === "click")
    await page.getByRole("button", { name: "Submit", exact: true }).click();
  else if (method === "enter") {
    await page
      .getByRole("textbox", { name: "Enter source", exact: true })
      .focus();
    await page.keyboard.press("Enter");
  } else
    await page.evaluate((method) => {
      const form = document.querySelector("form"),
        native = document.querySelector('select[name="choice"]');
      if (method === "checkValidity") form.checkValidity();
      else if (method === "controlCheckValidity") native.checkValidity();
      else if (method === "controlReportValidity") native.reportValidity();
      else if (method === "reportValidity") form.reportValidity();
      else form.requestSubmit();
    }, method);
  await page.waitForTimeout(60);
}
try {
  for (const mode of ["controlled", "uncontrolled"])
    for (const association of ["nested", "external"])
      for (const reset of ["none", "bubble", "capture"])
        for (const method of ["click", "reset"]) {
          await check(
            `reset ${mode} ${association} ${reset} ${method}`,
            async () => {
              await load({ mode, association, reset });
              await page
                .getByRole("combobox", { name: "Choice", exact: true })
                .focus();
              await page.keyboard.press("ArrowDown");
              await page.getByRole("listbox").waitFor();
              await page.keyboard.press("End");
              await page.waitForFunction(
                () => document.activeElement.textContent === "Beta",
              );
              await page.keyboard.press("Enter");
              await page.waitForFunction(() =>
                document
                  .querySelector("#first-choice")
                  .textContent.includes("Beta"),
              );
              await page
                .getByRole("button", { name: "Clear changes", exact: true })
                .click();
              const before = await sample();
              assert.equal(before.submitted, "b");
              assert.equal(before.application, "b");
              if (method === "click")
                await page
                  .getByRole("button", { name: "Reset", exact: true })
                  .click();
              else
                await page.evaluate(() =>
                  document.querySelector("form").reset(),
                );
              await page.waitForTimeout(60);
              const after = await sample();
              const success = reset === "none";
              assert.ok(
                after.display.includes(success ? "Alpha" : "Beta"),
                JSON.stringify(after),
              );
              assert.equal(after.submitted, success ? "a" : "b");
              assert.equal(after.application, success ? "a" : "b");
              assert.deepEqual(after.changes, success ? ["a"] : []);
              return { before, after };
            },
          );
        }
  for (const association of ["nested", "external"])
    for (const method of ["checkValidity", "controlCheckValidity"]) {
      await check(`static ${association} ${method}`, async () => {
        await load({ scenario: "validation", association });
        await page.getByRole("button", { name: "Anchor", exact: true }).focus();
        await validate(method);
        const after = await sample();
        assert.equal(after.focus, "anchor");
        return { after };
      });
    }
  for (const association of ["nested", "external"])
    for (const invalid of ["bubble", "capture"])
      for (const summary of ["false", "true"])
        for (const method of [
          "checkValidity",
          "reportValidity",
          "requestSubmit",
          "click",
          "enter",
        ]) {
          await check(
            `application ownership ${association} ${invalid} summary=${summary} ${method}`,
            async () => {
              await load({
                scenario: "validation",
                association,
                invalid,
                summary,
              });
              await page
                .getByRole("button", { name: "Anchor", exact: true })
                .focus();
              await validate(method);
              const after = await sample();
              assert.equal(
                after.focus,
                summary === "true"
                  ? "summary"
                  : method === "click"
                    ? "submit"
                    : method === "enter"
                      ? ""
                      : "anchor",
              );
              return { after };
            },
          );
        }
  for (const method of ["reportValidity", "requestSubmit", "click", "enter"])
    for (const order of [
      "selects",
      "select-before-input",
      "input-before-select",
      "external-input-before-select",
      "external-select-before-input",
    ]) {
      await check(`interactive ${method} ${order}`, async () => {
        await load({
          scenario: "validation",
          association:
            order === "external-select-before-input" ? "external" : "nested",
          order,
        });
        await validate(method);
        const after = await sample();
        assert.equal(
          after.focus,
          order.includes("input-before") ? "invalid-input" : "first-choice",
        );
        return { after };
      });
    }
  for (const association of ["nested", "external"])
    await check(`control reportValidity ${association}`, async () => {
      await load({
        scenario: "validation",
        association,
        order: "input-before-select",
      });
      await validate("controlReportValidity");
      assert.equal((await sample()).focus, "first-choice");
    });
} finally {
  await writeFile(`${out}/results.json`, JSON.stringify(result, null, 2));
  console.log(
    JSON.stringify(
      {
        passed: result.checks.length,
        failures: result.failures,
        errors: result.errors,
      },
      null,
      2,
    ),
  );
  await browser.close();
  if (result.failures.length || result.errors.length) process.exitCode = 1;
}
