import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.TIRAZ_BROWSER ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
page.setDefaultTimeout(8000);
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5210";
const out = process.env.TIRAZ_EVIDENCE || "docs/charts-foundation/browser";
await mkdir(out, { recursive: true });
const report = {
  matrix: [],
  checks: [],
  screenshots: [],
  errors: [],
  failures: [],
};
page.on("pageerror", (error) => report.errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error")
    report.errors.push(`console: ${message.text()}`);
});
const ids = ["line-chart", "area-chart", "bar-chart", "donut-chart"];
const canvas = () => page.locator(".playground-canvas");
async function seed(
  id,
  language = "en",
  theme = "light",
  sample = "multi",
  width = 1440,
) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(
    ({ id, language, theme, sample }) => {
      localStorage.clear();
      localStorage.setItem(
        "tiraz.documentation.v2",
        JSON.stringify({
          active: id,
          language,
          inspectorOpen: true,
          systemPanelOpen: true,
        }),
      );
      localStorage.setItem("tiraz.theme.v1", JSON.stringify(theme));
      localStorage.setItem(
        "tiraz.playgrounds.v2",
        JSON.stringify({ [id]: { sample, legend: true, grid: true } }),
      );
    },
    { id, language, theme, sample },
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await canvas().locator(".tz-chart").waitFor();
}
async function snap(name, element) {
  await (element || page).screenshot({
    path: `${out}/${name}.png`,
    animations: "disabled",
  });
  report.screenshots.push(`${name}.png`);
}
// Accent is a Radix Select: open it and pick the option by name.
const accentNames = { blue: ["أزرق", "Blue"], plum: ["بنفسجي", "Purple"] };
async function selectAccent(scope, accessibleName, value) {
  await scope.getByLabel(accessibleName, { exact: true }).click();
  const popup = page.locator(".accent-popup");
  await popup
    .getByRole("option", {
      name: new RegExp(`^(${accentNames[value].join("|")})$`),
    })
    .click();
  await popup.waitFor({ state: "detached" });
}
async function check(name, fn) {
  try {
    await fn();
    report.checks.push(name);
  } catch (error) {
    report.failures.push({ name, error: error.message });
  }
}
try {
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const width of [1440, 360])
        for (const id of ids) {
          await seed(id, language, theme, "multi", width);
          assert(await canvas().locator("svg.recharts-surface").isVisible());
          assert(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
          );
          const rect = await canvas().locator(".tz-chart-plot").boundingBox();
          assert(rect.height >= 180);
          report.matrix.push({
            id,
            language,
            theme,
            width,
            height: rect.height,
          });
          await snap(
            `${id}-${language}-${theme}-${width}`,
            width === 360 ? page.locator(".playground-section") : undefined,
          );
        }
  for (const id of ids)
    await check(`${id}: keyboard tooltip, legend and bounds`, async () => {
      await seed(id, "ar", "dark");
      const plot = canvas().getByRole("application");
      await plot.focus();
      await page.keyboard.press("ArrowRight");
      const tooltip = canvas().locator(".tz-chart-tooltip");
      await tooltip.waitFor({ state: "visible" });
      const first = await tooltip.innerText();
      await page.keyboard.press("ArrowLeft");
      assert.notEqual(await tooltip.innerText(), first);
      const tipBox = await tooltip.boundingBox(),
        plotBox = await plot.boundingBox();
      assert(
        tipBox.x >= plotBox.x - 1 &&
          tipBox.x + tipBox.width <= plotBox.x + plotBox.width + 1,
      );
      await page.keyboard.press("Escape");
      await tooltip.waitFor({ state: "hidden" });
      const buttons = canvas().locator(".tz-chart-legend button");
      await buttons.nth(0).focus();
      await page.keyboard.press("Enter");
      assert.equal(await buttons.nth(0).getAttribute("aria-pressed"), "false");
      await buttons.nth(1).focus();
      await page.keyboard.press("Space");
      assert(
        (await canvas().locator(".tz-chart-empty").innerText()).includes(
          "كل السلاسل مخفية",
        ),
      );
      await canvas().locator(".tz-chart-table summary").click();
      assert.equal(await canvas().getByRole("table").count(), 1);
      await buttons.nth(0).click();
      assert.equal(await canvas().locator(".tz-chart-empty").count(), 0);
      await snap(`${id}-keyboard-legend`, page.locator(".playground-section"));
    });
  for (const id of ids)
    for (const sample of ["single", "gaps", "point", "zero", "empty", "long"])
      await check(`${id}: ${sample}`, async () => {
        await seed(id, "ar", "light", sample, 360);
        if (sample === "empty" || (id === "donut-chart" && sample === "zero"))
          assert(await canvas().locator(".tz-chart-empty").isVisible());
        else assert(await canvas().locator("svg.recharts-surface").isVisible());
        if (sample !== "empty") {
          await canvas().locator(".tz-chart-table summary").click();
          assert(await canvas().getByRole("table").isVisible());
          if (sample === "gaps")
            assert(
              (await canvas().getByRole("table").innerText()).includes(
                "غير متاح",
              ),
            );
          if (sample === "zero")
            assert(
              (await canvas().getByRole("table").innerText()).includes("٠"),
            );
        }
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        );
        if (sample === "long" || sample === "gaps" || sample === "point")
          await snap(
            `${id}-${sample}-narrow`,
            page.locator(".playground-section"),
          );
      });
  await check(
    "live settings update plots, tooltips, legends without remounting or entrance animation",
    async () => {
      await seed("line-chart", "en");
      const rail = page.locator(".customization-rail");
      async function activateTooltip() {
        const plot = canvas().getByRole("application"),
          tooltip = canvas().locator(".tz-chart-tooltip");
        await plot.focus();
        if (!(await tooltip.isVisible())) await plot.press("Enter");
        await tooltip.waitFor({ state: "visible" });
      }
      await activateTooltip();
      await page.keyboard.press("ArrowRight");
      await page.evaluate(() => {
        window.tirazPlot = document.querySelector(
          ".playground-canvas .recharts-surface",
        );
      });
      const color = () =>
        canvas()
          .locator(".tz-chart-tooltip .tz-chart-swatch")
          .first()
          .evaluate((el) => getComputedStyle(el).backgroundColor);
      const first = await color();
      await selectAccent(rail, "Accent", "blue");
      await activateTooltip();
      assert.notEqual(await color(), first);
      assert.equal(
        await canvas()
          .locator(".tz-chart-legend .tz-chart-swatch")
          .first()
          .evaluate((el) => getComputedStyle(el).backgroundColor),
        await color(),
      );
      await rail
        .getByLabel("Typography", { exact: true })
        .selectOption("large");
      await activateTooltip();
      assert.equal(
        await canvas()
          .locator(".tz-chart-tooltip")
          .evaluate((el) => getComputedStyle(el).fontSize),
        "14px",
      );
      await rail
        .getByLabel("Density", { exact: true })
        .selectOption("standard");
      assert.equal(
        await canvas()
          .locator(".tz-chart-plot")
          .evaluate((el) => el.getBoundingClientRect().height),
        240,
      );
      await rail.getByLabel("Corner radius", { exact: true }).fill("14");
      await activateTooltip();
      assert.equal(
        await canvas()
          .locator(".tz-chart-tooltip")
          .evaluate((el) => getComputedStyle(el).borderRadius),
        "11px",
      );
      assert(
        await page.evaluate(
          () =>
            window.tirazPlot ===
            document.querySelector(".playground-canvas .recharts-surface"),
        ),
      );
      await selectAccent(rail, "Accent", "plum");
      await activateTooltip();
      const palette = await canvas()
        .locator(".tz-chart-legend .tz-chart-swatch")
        .evaluateAll((elements) =>
          elements.map((el) => getComputedStyle(el).backgroundColor),
        );
      assert.notEqual(palette[0], palette[1]);
      await snap("live-customization", page.locator(".playground-section"));
    },
  );
  await check(
    "OS and system reduced motion stop chart transitions",
    async () => {
      await seed("donut-chart", "en");
      await page.emulateMedia({ reducedMotion: "reduce" });
      assert.equal(
        await canvas()
          .locator(".tz-chart-segment")
          .first()
          .evaluate((el) => getComputedStyle(el).transitionDuration),
        "0s",
      );
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page
        .locator(".customization-rail")
        .getByRole("switch", { name: "Reduce motion" })
        .click();
      assert.equal(
        await canvas()
          .locator(".tz-chart-segment")
          .first()
          .evaluate((el) => getComputedStyle(el).transitionDuration),
        "0s",
      );
    },
  );
  await check(
    "connected period selector changes real rows, totals and donut values",
    async () => {
      // AnalyticsExample is not on a docs page; drive it in its own fixture.
      await page.setViewportSize({ width: 360, height: 1000 });
      await page.goto(
        `${base}/tests/browser/charts-fixture.html?dir=ltr&theme=dark`,
        { waitUntil: "networkidle" },
      );
      await page.evaluate(() => document.fonts.ready);
      const example = page.locator(".tz-analytics-example");
      await example.locator(".tz-chart").first().waitFor();
      const before = await example.locator(".tz-analytics-total").innerText();
      await example.getByRole("combobox", { name: "Period" }).click();
      await page.getByRole("option", { name: "October 4–6" }).click();
      assert.notEqual(
        await example.locator(".tz-analytics-total").innerText(),
        before,
      );
      assert(
        (await example.locator(".tz-analytics-total").innerText()).includes(
          "1,052",
        ),
      );
      await example.locator(".tz-chart-table summary").first().click();
      assert.equal(
        await example.getByRole("table").first().getByRole("row").count(),
        4,
      );
      await example.locator(".tz-chart-table summary").nth(1).click();
      assert(
        (await example.getByRole("table").nth(1).innerText()).includes("672"),
      );
      await snap("connected-period-narrow", example);
    },
  );
  await check(
    "copied prompt includes current dataset, toggles, settings and working application code",
    async () => {
      await seed("bar-chart", "en");
      await page
        .locator(".customization-rail")
        .getByLabel("Sample dataset")
        .selectOption("gaps");
      await page
        .getByRole("button", { name: "Copy agent prompt", exact: true })
        .click();
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      for (const value of [
        'sample={"gaps"}',
        'kind={"bar"}',
        "AnalyticsExample",
        "3.10.1",
        "ai/registry.json",
      ])
        assert(copied.includes(value));
    },
  );
  await check(
    "tooltip pointer boundaries and long mixed Arabic labels",
    async () => {
      await seed("bar-chart", "ar", "light", "long", 360);
      const plot = canvas().locator(".tz-chart-plot"),
        rect = await plot.boundingBox();
      await plot.scrollIntoViewIfNeeded();
      const box = await plot.boundingBox();
      for (const x of [box.x + 65, box.x + box.width - 18]) {
        await page.mouse.move(x, box.y + 80);
        const tooltip = canvas().locator(".tz-chart-tooltip");
        await tooltip.waitFor({ state: "visible" });
        const tip = await tooltip.boundingBox();
        assert(
          tip.x >= box.x - 1 && tip.x + tip.width <= box.x + rect.width + 1,
        );
        assert((await tooltip.innerText()).includes("RUH-"));
      }
      await snap(
        "tooltip-long-arabic-boundary",
        page.locator(".playground-section"),
      );
    },
  );
  await check(
    "axe scans chart examples in Arabic dark and English light",
    async () => {
      for (const [language, theme] of [
        ["ar", "dark"],
        ["en", "light"],
      ])
        for (const id of ids) {
          await seed(id, language, theme);
          await page.addScriptTag({
            path: require.resolve("axe-core/axe.min.js"),
          });
          const violations = await page.evaluate(async () =>
            (
              await window.axe.run(
                document.querySelector(".playground-section"),
              )
            ).violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((n) => n.target),
            })),
          );
          assert.deepEqual(violations, []);
        }
    },
  );
} finally {
  await writeFile(`${out}/results.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(
  JSON.stringify(
    {
      scenarios: report.matrix.length,
      checks: report.checks.length,
      failures: report.failures,
      errors: report.errors,
    },
    null,
    2,
  ),
);
assert.deepEqual(report.errors, []);
assert.deepEqual(report.failures, []);
