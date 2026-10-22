import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5227";
const evidence = "docs/slider-otp-date/year-menu";
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage();
page.setDefaultTimeout(10000);
const errors = [],
  geometry = [],
  checks = [];
page.on("pageerror", (e) => errors.push(e.message));
const pass = (s) => {
  checks.push(s);
  console.log("PASS " + s);
};
const year = () =>
  page.getByRole("combobox", { name: /Choose the Year|اختر السنة/ });
const list = () => page.getByRole("listbox");
async function openYear() {
  await year().click();
  await list().waitFor();
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector(".tz-date-years-popup"))
        .opacity === "1",
  );
}
async function focused(locator) {
  await page.waitForFunction(
    (html) => document.activeElement.outerHTML === html,
    await locator.evaluate((e) => e.outerHTML),
  );
}
async function measure(label) {
  const value = await page.locator(".tz-date-years-viewport").evaluate((e) => {
    const b = e.getBoundingClientRect(),
      parent = e.closest(".tz-datepicker-popup"),
      list = e.closest("[role=listbox]"),
      row = e.firstElementChild.getBoundingClientRect().height;
    return {
      viewport: b.toJSON(),
      list: list.getBoundingClientRect().toJSON(),
      height: e.clientHeight,
      row,
      scroll: e.scrollHeight,
      top: e.scrollTop,
      parentScroll: parent.scrollTop,
      count: e.children.length,
      insideCalendar: !!parent,
      visible: [...e.children]
        .filter((n) => {
          const r = n.getBoundingClientRect();
          return r.top >= b.top - 0.5 && r.bottom <= b.bottom + 0.5;
        })
        .map((n) => n.textContent),
    };
  });
  const viewport = page.viewportSize(),
    b = value.list;
  assert(
    b.x >= 0 &&
      b.y >= 0 &&
      b.right <= viewport.width + 1 &&
      b.bottom <= viewport.height + 1,
    JSON.stringify({ label, value, viewport }),
  );
  assert(value.height <= value.row * 5 + 0.5, JSON.stringify(value));
  assert(value.visible.length <= 5);
  assert(value.insideCalendar);
  assert(value.scroll > value.height);
  assert.equal(value.count, 201);
  geometry.push({ label, ...value });
  return value;
}
try {
  for (const lang of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const type of ["standard", "large"])
        for (const density of ["compact", "standard"])
          for (const size of [
            { width: 1100, height: 850 },
            { width: 264, height: 320 },
          ]) {
            await page.setViewportSize(size);
            await page.goto(
              `${base}/tests/browser/date-correction.html?lang=${lang}&theme=${theme}&type=${type}&density=${density}`,
            );
            await page
              .getByRole("button", {
                name: lang === "ar" ? /^موعد/ : /^Local date/,
              })
              .click();
            await openYear();
            const label = `${lang}/${theme}/${type}/${density}/${size.width}`;
            const metrics = await measure(label);
            if (size.width === 1100) {
              assert.equal(metrics.height, 5 * metrics.row);
              assert.equal(metrics.visible.length, 5);
            }
            if (density === "compact" && type === "standard") {
              if (size.width === 1100) {
                const b = await page
                  .locator(".tz-datepicker-popup")
                  .boundingBox();
                await page.screenshot({
                  path: `${evidence}/${lang}-${theme}-five.png`,
                  clip: {
                    x: Math.max(0, b.x - 4),
                    y: Math.max(0, b.y - 4),
                    width: b.width + 8,
                    height: b.height + 8,
                  },
                });
              } else
                await page.screenshot({
                  path: `${evidence}/${lang}-${theme}-short.png`,
                });
            }
            await page.locator(".tz-date-years-viewport").hover();
            await page.mouse.wheel(0, 96);
            await page.waitForFunction(
              (top) =>
                document.querySelector(".tz-date-years-viewport").scrollTop >
                top,
              metrics.top,
            );
            assert.equal(
              await page.locator("[data-summary]").textContent(),
              "2024-12-31",
            );
            assert.equal(
              await page.locator("[data-changes]").textContent(),
              "0",
            );
            await page.keyboard.press("Escape");
            await list().waitFor({ state: "hidden" });
            await focused(year());
            assert.equal(await page.locator(".tz-datepicker-popup").count(), 1);
          }
  pass(
    "32 ar/en × light/dark × typography × density × desktop/264px-short layouts: at most5rows, all201years scroll, viewport containment, preserved date and Escape focus",
  );
  for (const lang of ["ar", "en"])
    for (const overlay of ["Sheet", "Modal"]) {
      await page.setViewportSize({ width: 320, height: 320 });
      await page.goto(
        `${base}/tests/browser/date-correction.html?lang=${lang}&theme=dark&type=large&reduced`,
      );
      await page
        .getByRole("button", { name: `Open ${overlay}`, exact: true })
        .click();
      const trigger = page.getByRole("button", {
        name: lang === "ar" ? /^تاريخ داخل النافذة/ : /^Overlay date/,
      });
      await trigger.click();
      await openYear();
      await measure(`${lang}/${overlay}`);
      await page.keyboard.press("End");
      await page.waitForFunction(
        () =>
          document.activeElement?.textContent?.includes("٢١٢٤") ||
          document.activeElement?.textContent?.includes("2124"),
      );
      await measure(`${lang}/${overlay}/End`);
      await page.keyboard.press("Home");
      await page.waitForFunction(() =>
        ["1924", "١٩٢٤"].includes(document.activeElement?.textContent?.trim()),
      );
      await page.keyboard.press("ArrowDown");
      await page.waitForFunction(() =>
        ["1925", "١٩٢٥"].includes(document.activeElement?.textContent?.trim()),
      );
      await page.keyboard.press("Enter");
      await list().waitFor({ state: "hidden" });
      await focused(year());
      assert.equal(await year().getAttribute("value"), "1925");
      assert.equal(
        await page.locator("[data-summary]").textContent(),
        "2024-12-31",
      );
      assert.equal(await page.locator("[data-changes]").textContent(), "0");
      await openYear();
      await page.keyboard.press("Escape");
      await list().waitFor({ state: "hidden" });
      await focused(year());
      await page.keyboard.press("Escape");
      await page.locator(".tz-datepicker-popup").waitFor({ state: "hidden" });
      await focused(trigger);
      assert(
        await page
          .getByRole("dialog", { name: overlay, exact: true })
          .isVisible(),
      );
      await page.keyboard.press("Escape");
      await page
        .getByRole("dialog", { name: overlay, exact: true })
        .waitFor({ state: "hidden" });
      await focused(
        page.getByRole("button", { name: `Open ${overlay}`, exact: true }),
      );
    }
  pass(
    "Sheet/Modal in both languages: short viewport, Home/End/arrow/Enter, no date commit, year→calendar→dialog Escape ordering and focus restoration",
  );
  await page.setViewportSize({ width: 1100, height: 850 });
  await page.goto(`${base}/tests/browser/date-correction.html?lang=en&bounded`);
  await page.getByRole("button", { name: /^Local date/ }).click();
  await openYear();
  assert.deepEqual(await list().getByRole("option").allTextContents(), [
    "2024",
    "2025",
  ]);
  await page.getByRole("option", { name: "2025", exact: true }).click();
  await list().waitFor({ state: "hidden" });
  assert.equal(
    await page.getByRole("combobox", { name: "Choose the Month" }).inputValue(),
    "1",
  );
  assert.equal(
    await page.locator("[data-summary]").textContent(),
    "2024-12-31",
  );
  await openYear();
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const axe = await page.evaluate(() =>
    axe.run(document.querySelector(".tz-datepicker-popup"), {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
    }),
  );
  assert.deepEqual(
    axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })),
    [],
  );
  pass(
    "Min/max two-year menu stays bounded; open year menu Axe scan has zero violations",
  );
  assert.deepEqual(errors, []);
  pass("No browser runtime errors");
  await writeFile(
    `${evidence}/results.json`,
    JSON.stringify({ checks, geometry, errors }, null, 2) + "\n",
  );
} finally {
  await browser.close();
}
