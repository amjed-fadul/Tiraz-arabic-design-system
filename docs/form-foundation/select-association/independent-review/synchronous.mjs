import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const {
  chromium,
} = require("/Users/amjedfadul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage();
const results = [];
async function beta() {
  await page.getByRole("combobox").focus();
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
async function sample() {
  return page.evaluate(() => ({
    display: document.querySelector("#choice").textContent,
    native: document.querySelector('select[name="choice"]').value,
    form: new FormData(document.getElementById("choices")).get("choice"),
    app: document.querySelector('[data-testid="application"]').textContent,
    changes: JSON.parse(
      document.querySelector('[data-testid="changes"]').textContent,
    ),
  }));
}
try {
  for (const mode of ["controlled", "uncontrolled"])
    for (const life of ["replace", "late"])
      for (const canceled of [false, true])
        for (const method of ["reset", "click"]) {
          await page.goto(
            `http://127.0.0.1:5201/tests/browser/select-association-fixture.html?mode=${mode}&lifecycle=${life}&cancel=none`,
          );
          await page.getByRole("combobox").waitFor();
          await beta();
          await page.evaluate(
            ({ canceled, method }) => {
              const previous = document.getElementById("choices");
              if (previous) previous.remove();
              const f = document.createElement("form");
              f.id = "choices";
              f.innerHTML = '<button type="reset">Native sync reset</button>';
              if (canceled)
                f.addEventListener("reset", (e) => e.preventDefault());
              document.body.append(f);
              if (previous) {
                previous.reset();
                previous.querySelector("button").click();
              }
              if (method === "reset") f.reset();
              else f.querySelector("button").click();
              if (previous) previous.reset();
            },
            { canceled, method },
          );
          await page.waitForTimeout(60);
          const actual = await sample();
          assert.ok(
            actual.display.includes(canceled ? "Beta" : "Alpha"),
            JSON.stringify(actual),
          );
          for (const key of ["native", "form", "app"])
            assert.equal(actual[key], canceled ? "b" : "a");
          assert.deepEqual(actual.changes, canceled ? [] : ["a"]);
          results.push({ mode, life, canceled, method, actual });
        }
} finally {
  await writeFile(
    "/tmp/tiraz-association-independent/synchronous-results.json",
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify({ passed: results.length }));
  await browser.close();
}
