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
page.setDefaultTimeout(5000);
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5201";
const out =
  process.env.TIRAZ_EVIDENCE ||
  "docs/form-foundation/select-association/browser";
await mkdir(out, { recursive: true });
const results = { checks: [], failures: [], errors: [] };
page.on("pageerror", (error) => results.errors.push(error.message));
async function sample() {
  return page.evaluate(() => ({
    display: document.querySelector("#choice").textContent,
    native: document.querySelector('select[name="choice"]').value,
    submitted: new FormData(document.getElementById("choices")).get("choice"),
    application: document.querySelector('[data-testid="application"]')
      .textContent,
    changes: JSON.parse(
      document.querySelector('[data-testid="changes"]').textContent,
    ),
    mounted: document.querySelector("#choice") === window.originalTrigger,
  }));
}
function agree(actual, label, value, changes) {
  assert.ok(actual.display.includes(label), JSON.stringify(actual));
  assert.equal(actual.native, value, JSON.stringify(actual));
  assert.equal(actual.submitted, value, JSON.stringify(actual));
  assert.equal(actual.application, value, JSON.stringify(actual));
  assert.deepEqual(actual.changes, changes, JSON.stringify(actual));
  assert.equal(actual.mounted, true);
}
async function selectBeta() {
  await page.getByRole("combobox", { name: "Choice", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await page.getByRole("listbox").waitFor();
  await page.keyboard.press("End");
  await page.waitForFunction(
    () => document.activeElement.textContent === "Beta",
  );
  await page.keyboard.press("Enter");
  await page.waitForFunction(() =>
    document.querySelector("#choice").textContent.includes("Beta"),
  );
  await page.getByRole("button", { name: "Clear changes" }).click();
}
async function resetForm(method, previous = false) {
  if (method === "reset")
    await page.evaluate(
      (previous) =>
        (previous
          ? window.previousForm
          : document.getElementById("choices")
        ).reset(),
      previous,
    );
  else if (
    !previous ||
    (await page.evaluate(() => window.previousForm.isConnected))
  )
    await page
      .getByRole("button", {
        name: previous ? "Previous reset" : "Reset",
        exact: true,
      })
      .click();
  else
    await page.evaluate(() =>
      window.previousForm.querySelector("button").click(),
    );
  await page.waitForTimeout(60);
}
try {
  for (const mode of ["controlled", "uncontrolled"])
    for (const lifecycle of ["replace", "late", "retain"])
      for (const cancel of ["none", "bubble", "capture"])
        for (const method of ["reset", "click"]) {
          const name = `${mode} ${lifecycle} ${cancel} ${method}`;
          try {
            await page.goto(
              `${base}/tests/browser/select-association-fixture.html?${new URLSearchParams({ mode, lifecycle, cancel })}`,
            );
            await page.getByRole("combobox", { name: "Choice" }).waitFor();
            await page.evaluate(() => {
              window.originalTrigger = document.querySelector("#choice");
              window.previousForm = document.getElementById("choices");
            });
            await selectBeta();
            await page.getByRole("button", { name: "Change form" }).click();
            const before = await sample();
            agree(before, "Beta", "b", []);
            let previousReset;
            if (lifecycle !== "late") {
              await resetForm(method, true);
              previousReset = await sample();
              agree(previousReset, "Beta", "b", []);
            }
            await resetForm(method);
            const after = await sample();
            agree(
              after,
              cancel === "none" ? "Alpha" : "Beta",
              cancel === "none" ? "a" : "b",
              cancel === "none" ? ["a"] : [],
            );
            // Repeat replacement after another value change: Radix may have rebound
            // its reset listener to the now-previous form on the prior commit.
            if (lifecycle === "replace") {
              await selectBeta();
              await page.evaluate(() => {
                window.previousForm = document.getElementById("choices");
              });
              await page.getByRole("button", { name: "Change form" }).click();
              await resetForm(method, true);
              agree(await sample(), "Beta", "b", []);
              await resetForm(method);
              agree(
                await sample(),
                cancel === "none" ? "Alpha" : "Beta",
                cancel === "none" ? "a" : "b",
                cancel === "none" ? ["a"] : [],
              );
            }
            results.checks.push({ name, before, previousReset, after });
          } catch (error) {
            results.failures.push({
              name,
              error: error.message,
              observed: await sample(),
            });
          }
        }
} finally {
  await writeFile(
    `${out}/results.json`,
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(
    JSON.stringify(
      {
        passed: results.checks.length,
        failures: results.failures,
        errors: results.errors,
      },
      null,
      2,
    ),
  );
  await browser.close();
  if (results.failures.length || results.errors.length) process.exitCode = 1;
}
