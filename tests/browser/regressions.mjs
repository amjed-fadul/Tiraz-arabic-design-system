import { createRequire } from "node:module";
import { writeFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const evidenceDir = process.env.TIRAZ_EVIDENCE || "docs/review-evidence";
await mkdir(evidenceDir, { recursive: true });
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.TIRAZ_BROWSER
    ? { executablePath: process.env.TIRAZ_BROWSER }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const evidence = { metrics: [], checks: [], failures: [] };
async function check(name, fn) {
  try {
    await fn();
    evidence.checks.push(name);
  } catch (e) {
    evidence.failures.push({ name, error: e.message });
  }
}
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5176";
await page.goto(base);
await page.getByLabel("لغة التوثيق").selectOption("en");
await page.evaluate(() => document.fonts.ready);
const rail = page.locator(".customization-rail"),
  button = page.locator(".playground-canvas .tz-button");
for (const typography of ["standard", "large"]) {
  await rail.getByLabel("Typography", { exact: true }).selectOption(typography);
  for (const density of ["standard", "compact"]) {
    await rail.getByLabel("Density", { exact: true }).selectOption(density);
    for (const size of ["sm", "md"]) {
      await rail.getByLabel("Size", { exact: true }).selectOption(size);
      for (const variant of ["primary", "secondary", "ghost", "destructive"]) {
        await rail.getByLabel("Variant", { exact: true }).selectOption(variant);
        await rail.getByLabel("Icon", { exact: true }).selectOption("plus");
        evidence.metrics.push(
          await button.evaluate(
            (el, args) => {
              const s = getComputedStyle(el),
                r = el.getBoundingClientRect(),
                icon = el.querySelector("svg").getBoundingClientRect();
              return {
                ...args,
                height: r.height,
                width: r.width,
                paddingInline: s.paddingInline,
                paddingBlock: s.paddingBlock,
                gap: s.gap,
                fontSize: s.fontSize,
                lineHeight: s.lineHeight,
                border: s.borderWidth,
                iconWidth: icon.width,
                iconHeight: icon.height,
              };
            },
            { typography, density, size, variant },
          ),
        );
      }
    }
  }
}
for (const typography of ["standard", "large"])
  for (const size of ["sm", "md"]) {
    await check(`${typography} ${size} visibly changes density`, () => {
      const m = evidence.metrics.filter(
        (r) =>
          r.typography === typography &&
          r.size === size &&
          r.variant === "primary",
      );
      assert.ok(
        m[0].height > m[1].height,
        "standard must be taller than compact",
      );
      assert.ok(
        parseFloat(m[0].paddingInline) > parseFloat(m[1].paddingInline),
        "inline padding must respond",
      );
    });
    for (const density of ["standard", "compact"])
      await check(
        `${typography} ${size} ${density} equivalent variants`,
        () => {
          const m = evidence.metrics.filter(
            (r) =>
              r.typography === typography &&
              r.size === size &&
              r.density === density,
          );
          for (const r of m) {
            assert.equal(r.height, m[0].height);
            assert.equal(r.width, m[0].width);
            assert.equal(r.iconWidth, 16);
            assert.equal(r.iconHeight, 16);
            assert.ok(r.height >= 32);
          }
        },
      );
  }
await rail.getByLabel("State", { exact: true }).selectOption("idle");
await button.click();
await check(
  "simulation returns to idle without persisting feedback",
  async () => {
    assert.equal(await button.getAttribute("data-state"), "loading");
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("tiraz.playgrounds.v2")).button.state,
      ),
      "idle",
    );
    await page.waitForTimeout(1250);
    assert.equal(await button.getAttribute("data-state"), "success");
    await page.screenshot({ path: `${evidenceDir}/after-success.png` });
    await page.waitForTimeout(1050);
    assert.equal(await button.getAttribute("data-state"), "idle");
  },
);
for (const direction of ["rtl", "ltr"]) {
  await page.setViewportSize({ width: 800, height: 400 });
  await page.goto(`${base}/tests/browser/fixture.html`);
  if (direction === "ltr")
    await page
      .getByRole("button", { name: "Change direction", exact: true })
      .click();
  await page.getByRole("button", { name: "Long menu", exact: true }).click();
  await page.waitForTimeout(300);
  await check(`long menu fits short viewport ${direction}`, async () => {
    const m = await page.getByRole("menu").evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {
        top: r.top,
        bottom: r.bottom,
        height: r.height,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        overflowY: getComputedStyle(el).overflowY,
      };
    });
    evidence.checks.push({ direction, long: m });
    assert.ok(m.top >= 11);
    assert.ok(m.bottom <= 389);
    assert.equal(m.overflowY, "auto");
    assert.ok(m.scrollHeight > m.clientHeight);
    await page.keyboard.press("End");
    await page.waitForTimeout(100);
    assert.equal(
      await page
        .getByRole("menuitem", { name: "Item 40", exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    assert.ok(
      await page
        .getByRole("menuitem", { name: "Item 40", exact: true })
        .evaluate((el) => {
          const a = el.getBoundingClientRect(),
            m = el.closest("[role=menu]").getBoundingClientRect();
          return a.top >= m.top && a.bottom <= m.bottom;
        }),
    );
  });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open sheet", exact: true }).click();
  await page
    .getByRole("button", { name: "Nested menu trigger", exact: true })
    .focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(300);
  await check(`nested menu is visible and focusable ${direction}`, async () => {
    assert.ok(
      await page
        .getByRole("menu")
        .evaluate((el) => !!el.closest("[role=dialog]")),
    );
    assert.ok(
      await page
        .getByRole("menuitem", { name: "Item 1", exact: true })
        .evaluate((el) => {
          const r = el.getBoundingClientRect();
          return (
            el.contains(
              document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2),
            ) && el === document.activeElement
          );
        }),
    );
    await page.keyboard.press("End");
    await page.waitForTimeout(100);
    assert.ok(
      await page
        .getByRole("menuitem", { name: "Item 40", exact: true })
        .evaluate((el) => {
          const r = el.getBoundingClientRect(),
            m = el.closest("[role=menu]").getBoundingClientRect();
          return el === document.activeElement && r.bottom <= m.bottom;
        }),
    );
    await page.screenshot({
      path: `${evidenceDir}/after-nested-${direction}.png`,
    });
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("output").textContent(), "Selected 40");
    await page.waitForFunction(
      () => document.activeElement?.textContent === "Nested menu trigger",
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Nested menu trigger", exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page
      .getByRole("button", { name: "Nested menu trigger", exact: true })
      .click();
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector(".tz-menu"));
    assert.equal(await page.getByRole("dialog").count(), 1);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);
    assert.equal(
      await page
        .getByRole("button", { name: "Open sheet", exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
    );
  });
}

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(base);
await page.locator(".language-control").selectOption("en");
for (const [name, selector] of [
  ["Tabs", ".playground-canvas .tz-tab"],
  ["Switch", ".playground-canvas .tz-switch-field"],
  ["Dropdown menu", ".tz-menu-item"],
]) {
  await page
    .locator(".docs-sidebar nav")
    .getByRole("button", { name, exact: true })
    .click();
  await rail
    .getByRole("switch", { name: "Reduce motion", exact: true })
    .check();
  const measurements = [];
  for (const typography of ["standard", "large"]) {
    await rail
      .getByLabel("Typography", { exact: true })
      .selectOption(typography);
    for (const density of ["standard", "compact"]) {
      await rail.getByLabel("Density", { exact: true }).selectOption(density);
      if (name === "Dropdown menu" && !(await page.locator(selector).count()))
        await page.locator(".playground-canvas button").click();
      measurements.push(
        await page
          .locator(selector)
          .first()
          .evaluate(
            (el, args) => ({
              ...args,
              height: el.getBoundingClientRect().height,
              gap: getComputedStyle(el).gap,
              padding: getComputedStyle(el).paddingBlock,
            }),
            { name, typography, density },
          ),
      );
    }
  }
  evidence.checks.push({ densityMeasurements: measurements });
  await check(
    `${name} density changes rendered geometry at both text scales`,
    () => {
      for (let i = 0; i < 4; i += 2)
        if (name === "Switch")
          assert.notEqual(measurements[i].gap, measurements[i + 1].gap);
        else assert.ok(measurements[i].height > measurements[i + 1].height);
    },
  );
  if (name === "Dropdown menu") await page.keyboard.press("Escape");
}
await page
  .locator(".docs-sidebar nav")
  .getByRole("button", { name: "Button", exact: true })
  .click();
await rail.getByLabel("Icon", { exact: true }).selectOption("settings");
await rail.getByRole("switch", { name: "Icon only", exact: true }).check();
for (const density of ["standard", "compact"])
  for (const size of ["sm", "md"])
    for (const state of ["idle", "loading", "success", "error"]) {
      await rail.getByLabel("Density", { exact: true }).selectOption(density);
      await rail.getByLabel("Size", { exact: true }).selectOption(size);
      await rail.getByLabel("State", { exact: true }).selectOption(state);
      await check(
        `icon-only ${density} ${size} ${state} stays square and contains one icon`,
        async () => {
          const m = await button.evaluate((el) => {
            const r = el.getBoundingClientRect();
            return {
              height: r.height,
              width: r.width,
              icons: [...el.querySelectorAll("svg")].map((icon) => {
                const i = icon.getBoundingClientRect();
                return { left: i.left, right: i.right };
              }),
              left: r.left,
              right: r.right,
              name: el.getAttribute("aria-label"),
            };
          });
          assert.equal(m.height, m.width);
          assert.equal(m.icons.length, 1);
          assert.ok(m.icons[0].left >= m.left && m.icons[0].right <= m.right);
          assert.ok(m.name);
        },
      );
    }
for (const theme of ["light", "dark"]) {
  const current = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("tiraz.theme.v1")),
  );
  if (current !== theme)
    await page
      .getByRole("button", { name: "Toggle theme", exact: true })
      .click();
  for (const variant of ["primary", "secondary", "ghost", "destructive"])
    for (const state of ["success", "error"]) {
      await rail.getByLabel("Variant", { exact: true }).selectOption(variant);
      await rail.getByLabel("State", { exact: true }).selectOption(state);
      await button.hover();
      await check(
        `${theme} ${variant} ${state} retains semantic feedback on hover`,
        async () =>
          assert.equal(
            await button.evaluate((el) => getComputedStyle(el).backgroundColor),
            theme === "light"
              ? state === "success"
                ? "rgb(237, 245, 238)"
                : "rgb(251, 239, 239)"
              : state === "success"
                ? "rgb(36, 55, 42)"
                : "rgb(62, 39, 41)",
          ),
      );
    }
}
await page.goto(`${base}/tests/browser/fixture.html`);
await check("nested standard provider keeps its own density gap", async () =>
  assert.equal(
    await page
      .getByRole("button", { name: "Scoped standard", exact: true })
      .evaluate((el) => getComputedStyle(el).gap),
    "8px",
  ),
);
await mkdir(evidenceDir, { recursive: true });
await writeFile(
  `${evidenceDir}/regressions.json`,
  JSON.stringify(evidence, null, 2),
);
console.log(
  JSON.stringify(
    { checks: evidence.checks, failures: evidence.failures },
    null,
    2,
  ),
);
await browser.close();
if (evidence.failures.length) process.exitCode = 1;
