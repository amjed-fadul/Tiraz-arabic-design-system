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
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const sample = () =>
  page.evaluate(() => ({
    display: document.querySelector("#choice").textContent,
    native: document.querySelector('select[name="choice"]').value,
    data: new FormData(document.getElementById("choices")).get("choice"),
    app: document.querySelector('[data-testid="application"]').textContent,
    changes: JSON.parse(
      document.querySelector('[data-testid="changes"]').textContent,
    ),
  }));
function agree(s, label, value, changes) {
  assert.ok(s.display.includes(label), JSON.stringify(s));
  assert.equal(s.native, value);
  assert.equal(s.data, value);
  assert.equal(s.app, value);
  assert.deepEqual(s.changes, changes);
}
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
try {
  for (const mode of ["controlled", "uncontrolled"])
    for (const cancel of [false, true]) {
      await page.goto(
        `http://127.0.0.1:5201/tests/browser/select-association-fixture.html?mode=${mode}&lifecycle=replace&cancel=none`,
      );
      await page.getByRole("combobox").waitFor();
      await beta();
      await page.evaluate(() => {
        window.forms = [];
        window.original = document.querySelector("#choice");
      });
      for (let cycle = 0; cycle < 4; cycle++) {
        await page.evaluate((cancel) => {
          const old = document.getElementById("choices");
          window.forms.push(old);
          if (window.forms.length % 2) {
            old.id = "old-" + window.forms.length;
          } else old.remove();
          const next = document.createElement("form");
          next.id = "choices";
          next.innerHTML = '<button type="reset">Native reset</button>';
          if (cancel) next.addEventListener("reset", (e) => e.preventDefault());
          document.body.append(next);
        }, cancel);
        const preserved = await sample();
        agree(preserved, "Beta", "b", []);
        await page.evaluate(() =>
          window.forms.forEach((f) => {
            f.reset();
            f.querySelector("button").click();
          }),
        );
        await page.waitForTimeout(60);
        agree(await sample(), "Beta", "b", []);
        if (cycle % 2)
          await page
            .locator("#choices")
            .getByRole("button", { name: "Native reset", exact: true })
            .click();
        else
          await page.evaluate(() => document.getElementById("choices").reset());
        await page.waitForTimeout(60);
        agree(
          await sample(),
          cancel ? "Beta" : "Alpha",
          cancel ? "b" : "a",
          cancel ? [] : ["a"],
        );
        assert.ok(
          await page.evaluate(
            () => window.original === document.querySelector("#choice"),
          ),
        );
        if (!cancel) await beta();
      }
      results.push({
        mode,
        cancel,
        scenario:
          "4 DOM-only replacements; mixed connected/detached historical resets; native reset and button",
        sample: await sample(),
      });
    }
  for (const mode of ["controlled", "uncontrolled"]) {
    await page.goto(
      `http://127.0.0.1:5201/tests/browser/select-association-fixture.html?mode=${mode}&lifecycle=late&cancel=none`,
    );
    await page.getByRole("combobox").waitFor();
    await beta();
    await page.evaluate(() => {
      const f = document.createElement("form");
      f.id = "choices";
      f.innerHTML = '<button type="reset">Native late reset</button>';
      document.body.append(f);
    });
    agree(await sample(), "Beta", "b", []);
    await page.getByRole("button", { name: "Native late reset" }).click();
    await page.waitForTimeout(60);
    agree(await sample(), "Alpha", "a", ["a"]);
    results.push({
      mode,
      scenario: "native form mounts late without React rerender",
      sample: await sample(),
    });
  }
} finally {
  await writeFile(
    "/tmp/tiraz-association-independent/extra-results.json",
    JSON.stringify({ results, errors }, null, 2),
  );
  await browser.close();
  console.log(JSON.stringify({ passed: results.length, errors }));
}
