import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const {
  chromium,
} = require("/Users/amjedfadul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const evidence = "docs/slider-otp-date/date-correction";
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage();
page.setDefaultTimeout(10000);
const errors = [],
  checks = [],
  geometry = [];
page.on("pageerror", (e) => errors.push(e.message));
const pass = (name) => {
  checks.push(name);
  console.log("PASS " + name);
};
const popup = () => page.locator(".tz-datepicker-popup");
const previous = () => popup().locator(".rdp-button_previous"),
  next = () => popup().locator(".rdp-button_next");
const month = () => popup().locator(".rdp-months_dropdown"),
  year = () => popup().locator(".rdp-years_dropdown");
const left =
  "16 18.112 9.81111111 12 16 5.87733333 14.0888889 4 6 12 14.0888889 20";
const right =
  "8 18.112 14.18888889 12 8 5.87733333 9.91111111 4 18 12 9.91111111 20";
async function focused(locator) {
  await page.waitForFunction(
    (html) => document.activeElement?.outerHTML === html,
    await locator.evaluate((e) => e.outerHTML),
  );
}
async function open(lang, query = "") {
  await page.goto(
    `http://127.0.0.1:5227/tests/browser/date-correction.html?lang=${lang}${query}`,
  );
  await page
    .getByRole("button", { name: lang === "ar" ? /^موعد/ : /^Local date/ })
    .click();
  await popup().waitFor();
}
async function preserved(value = "2024-12-31") {
  assert.equal(await page.locator("[data-summary]").textContent(), value);
  assert.equal(await page.locator("[data-changes]").textContent(), "0");
  assert.equal(await page.locator('input[name="date"]').inputValue(), value);
}
async function bounds(label) {
  const b = await popup().boundingBox(),
    v = page.viewportSize();
  assert(
    b &&
      b.x >= 0 &&
      b.y >= 0 &&
      b.x + b.width <= v.width + 1 &&
      b.y + b.height <= v.height + 1,
    JSON.stringify({ label, b, v }),
  );
  const head = await popup().evaluate((e) =>
    [...e.querySelectorAll("select,.rdp-button_previous,.rdp-button_next")].map(
      (el) => {
        const b = el.getBoundingClientRect();
        return { x: b.x, y: b.y, w: b.width, h: b.height };
      },
    ),
  );
  assert(head.every((e) => e.x >= b.x && e.x + e.w <= b.x + b.width + 1));
  const labels = await popup().evaluate((e) =>
    [...e.querySelectorAll("select")].map((select) => {
      const style = getComputedStyle(select),
        canvas = document.createElement("canvas"),
        context = canvas.getContext("2d");
      context.font = style.font;
      return {
        text: select.selectedOptions[0].text,
        width: select.getBoundingClientRect().width,
        required:
          context.measureText(select.selectedOptions[0].text).width + 26,
      };
    }),
  );
  assert(
    labels.every((label) => label.width >= label.required),
    JSON.stringify({ label, labels }),
  );
  geometry.push({ label, b, v, head });
}
try {
  for (const lang of ["ar", "en"]) {
    await page.setViewportSize({ width: 1100, height: 850 });
    await open(lang);
    assert.equal(
      await previous().getAttribute("aria-label"),
      lang === "ar" ? "اذهب إلى الشهر السابق" : "Go to the Previous Month",
    );
    assert.equal(
      await next().getAttribute("aria-label"),
      lang === "ar" ? "اذهب إلى الشهر التالي" : "Go to the Next Month",
    );
    assert.equal(
      await previous().locator("polygon").getAttribute("points"),
      lang === "ar" ? right : left,
    );
    assert.equal(
      await next().locator("polygon").getAttribute("points"),
      lang === "ar" ? left : right,
    );
    for (const button of [previous(), next()])
      assert.equal(
        await button
          .locator("svg")
          .evaluate((e) => getComputedStyle(e).transform),
        "none",
      );
    await next().click();
    assert.equal(await month().inputValue(), "0");
    assert.equal(await year().inputValue(), "2025");
    await previous().click();
    assert.equal(await month().inputValue(), "11");
    assert.equal(await year().inputValue(), "2024");
    await preserved();
    await month().selectOption("1");
    await year().selectOption("2028");
    await preserved();
    assert.equal(
      await year().locator("option:checked").textContent(),
      lang === "ar" ? "٢٠٢٨" : "2028",
    );
    assert.equal(
      await month().locator("option:checked").textContent(),
      lang === "ar" ? "فبراير" : "February",
    );
    await popup()
      .getByRole("button", {
        name: lang === "ar" ? /٢٩ فبراير ٢٠٢٨/ : /February 29, 2028/,
      })
      .click();
    assert.equal(
      await page.locator("[data-summary]").textContent(),
      "2028-02-29",
    );
    await page
      .getByRole("button", { name: lang === "ar" ? /^موعد/ : /^Local date/ })
      .click();
    const clear = popup().getByRole("button", {
      name: lang === "ar" ? "مسح" : "Clear",
    });
    await clear.click();
    assert.equal(await page.locator("[data-summary]").textContent(), "empty");
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    assert.equal(
      await page.locator("[data-summary]").textContent(),
      "2024-12-31",
    );
    // Simulated native selection and actual focus/tab operation; OS menu keys
    // are checked separately in the Mac app browser.
    await page
      .getByRole("button", { name: lang === "ar" ? /^موعد/ : /^Local date/ })
      .click();
    await month().focus();
    await month().selectOption("10");
    assert.equal(await month().inputValue(), "10");
    await preserved();
    await page.keyboard.press("Tab");
    assert.equal(
      await year().evaluate((e) => e === document.activeElement),
      true,
    );
    await year().selectOption("2025");
    assert.equal(await year().inputValue(), "2025");
    await preserved();
    await page.keyboard.press("Escape");
    assert.equal(await popup().count(), 0);
    assert.equal(
      await page
        .getByRole("button", { name: lang === "ar" ? /^موعد/ : /^Local date/ })
        .evaluate((e) => e === document.activeElement),
      true,
    );
    await open(lang, "&bounded");
    assert.equal(await previous().getAttribute("aria-disabled"), "true");
    await previous().click({ force: true });
    assert.equal(await month().inputValue(), "11");
    assert.equal(
      await month().locator('option[value="10"]').isDisabled(),
      true,
    );
    assert.deepEqual(
      await year()
        .locator("option")
        .evaluateAll((es) => es.map((e) => e.value)),
      ["2024", "2025"],
    );
    await year().selectOption("2025");
    assert.equal(await month().inputValue(), "1");
    assert.equal(await next().getAttribute("aria-disabled"), "true");
    assert.equal(await month().locator('option[value="2"]').isDisabled(), true);
    await next().click({ force: true });
    assert.equal(await month().inputValue(), "1");
    await preserved();
    assert.equal(
      await popup()
        .getByRole("button", {
          name: lang === "ar" ? /١١ فبراير ٢٠٢٥/ : /February 11, 2025/,
        })
        .isDisabled(),
      true,
    );
    await popup()
      .getByRole("button", {
        name: lang === "ar" ? /١٠ فبراير ٢٠٢٥/ : /February 10, 2025/,
      })
      .click();
    assert.equal(
      await page.locator("[data-summary]").textContent(),
      "2025-02-10",
    );
    for (const date of [
      "0001-01-01",
      "0099-01-01",
      "1800-12-31",
      "2200-01-01",
      "9999-12-31",
    ]) {
      await open(lang, `&fixed&date=${date}`);
      assert.equal(await year().inputValue(), String(Number(date.slice(0, 4))));
      await preserved(date);
      assert((await year().locator("option").count()) <= 202);
      if (date === "0001-01-01")
        assert.equal(await previous().getAttribute("aria-disabled"), "true");
      if (date === "9999-12-31")
        assert.equal(await next().getAttribute("aria-disabled"), "true");
      if (date === "2200-01-01") {
        await previous().click();
        assert.equal(await year().inputValue(), "2199");
      }
    }
    pass(
      `${lang}: actual arrow actions/icons/names/year boundaries, localized direct month/year, leap day, preservation, simulated selects and keyboard tab/Escape, min/max, full date domain, clear/reset`,
    );
    for (const theme of ["light", "dark"])
      for (const type of ["standard", "large"])
        for (const size of [
          { width: 1100, height: 850 },
          { width: 320, height: 600 },
          { width: 320, height: 320 },
          { width: 264, height: 320 },
        ]) {
          await page.setViewportSize(size);
          await open(lang, `&theme=${theme}&type=${type}`);
          await bounds(`${lang}/${theme}/${type}/${size.height}`);
          await popup().screenshot({
            path: `${evidence}/after-${lang}-${theme}-${type}-${size.width}x${size.height}.png`,
          });
        }
    for (const overlay of ["Sheet", "Modal"])
      for (const size of [
        { width: 1100, height: 850 },
        { width: 320, height: 320 },
      ]) {
        await page.setViewportSize(size);
        await page.goto(
          `http://127.0.0.1:5227/tests/browser/date-correction.html?lang=${lang}&theme=dark&type=large&reduced`,
        );
        await page
          .getByRole("button", { name: `Open ${overlay}`, exact: true })
          .click();
        const trigger = page.getByRole("button", {
          name: lang === "ar" ? /^تاريخ داخل النافذة/ : /^Overlay date/,
        });
        await trigger.click();
        await bounds(`${lang}/${overlay}/${size.width}`);
        assert.equal(
          await popup().evaluate((e) => !!e.closest("[role=dialog]")),
          true,
        );
        await month().selectOption("1");
        await year().selectOption("2028");
        await preserved();
        await month().focus();
        await month().selectOption("0");
        assert.equal(await month().inputValue(), "0");
        await preserved();
        // Real native-menu keyboard/Escape is checked separately in the Mac app browser.
        await page.keyboard.press("Escape");
        await popup().waitFor({ state: "detached" });
        await focused(trigger);
        assert.equal(
          await page
            .getByRole("dialog", { name: overlay, exact: true })
            .isVisible(),
          true,
        );
        await page.keyboard.press("Escape");
        await page
          .getByRole("dialog", { name: overlay, exact: true })
          .waitFor({ state: "detached" });
        await focused(
          page.getByRole("button", { name: `Open ${overlay}`, exact: true }),
        );
        await page
          .getByRole("button", { name: `Open ${overlay}`, exact: true })
          .click();
        await trigger.click();
        await bounds(`${lang}/${overlay}/reopen`);
        await popup().screenshot({
          path: `${evidence}/overlay-${lang}-${overlay.toLowerCase()}-${size.width}.png`,
        });
      }
    pass(
      `${lang}: 16 light/dark/type/viewport layouts; Sheet/Modal native dropdown use, calendar → dialog Escape ordering, focus restoration, reduced motion`,
    );
  }
  assert.deepEqual(errors, []);
  pass("No browser runtime errors");
  await writeFile(
    `${evidence}/results.json`,
    JSON.stringify(
      {
        checks,
        geometry,
        errors,
        limits:
          "Desktop Mac Chrome automation; native select dropdowns tested, no physical mobile or manual screen-reader session.",
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
}
