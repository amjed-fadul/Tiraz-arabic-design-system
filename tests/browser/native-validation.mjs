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
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5197",
  out = process.env.TIRAZ_EVIDENCE || "docs/form-foundation/native-validation";
await mkdir(out, { recursive: true });
const checks = [];
try {
  for (const method of ["requestSubmit", "click", "enter"])
    for (const order of [
      "selects",
      "select-before-input",
      "input-before-select",
      "external-input-before-select",
      "external-select-before-input",
    ]) {
      await page.goto(`${base}/tests/browser/forms-fixture.html?dir=ltr`);
      await page.evaluate(
        (method) => (window.validationMethod = method),
        method,
      );
      await page.evaluate((order) => {
        const form = document.getElementById("native-form"),
          native = document.querySelector('select[name="uncontrolled"]'),
          trigger = native.parentElement.querySelector("button");
        native.required = true;
        native.value = "";
        trigger.id = "first-choice";
        const input = document.createElement("input");
        input.id = "invalid-native";
        input.required = true;
        if (order === "select-before-input") form.append(input);
        if (order === "input-before-select") form.prepend(input);
        if (order === "external-input-before-select") {
          input.setAttribute("form", form.id);
          form.before(input);
        }
        if (order === "external-select-before-input") {
          native.setAttribute("form", form.id);
          trigger.setAttribute("form", form.id);
          form.before(native.parentElement);
          form.append(input);
        }
        if (window.validationMethod === "requestSubmit") form.requestSubmit();
        return undefined;
      }, order);
      if (method === "click")
        await page.getByRole("button", { name: "Submit", exact: true }).click();
      if (method === "enter") {
        await page
          .getByRole("textbox", { name: "Read only", exact: true })
          .focus();
        await page.keyboard.press("Enter");
      }
      await page.waitForTimeout(50);
      const focused = await page.evaluate(() => document.activeElement.id);
      assert.equal(
        focused,
        order.includes("input-before") ? "invalid-native" : "first-choice",
        `${method}: ${order}`,
      );
      checks.push(`${method}: ${order}`);
    }
} catch (error) {
  checks.push({ failure: error.message });
  process.exitCode = 1;
} finally {
  await writeFile(`${out}/results.json`, JSON.stringify(checks, null, 2));
  console.log(JSON.stringify(checks, null, 2));
  await browser.close();
}
