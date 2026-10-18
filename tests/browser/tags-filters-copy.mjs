import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const root = process.env.TIRAZ_URL || "http://127.0.0.1:5213";
const evidence = process.env.TIRAZ_EVIDENCE || "docs/tags-filters-copy/browser";
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.TIRAZ_BROWSER ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
});
// Seed before React mounts, so persistence effects cannot overwrite test settings.
await context.addInitScript(() => {
  const encoded = new URLSearchParams(location.search).get("tiraz-check");
  if (!encoded) return;
  const { component, language, theme, density, extra } = JSON.parse(encoded);
  localStorage.clear();
  localStorage.setItem(
    "tiraz.documentation.v2",
    JSON.stringify({ language, active: component }),
  );
  localStorage.setItem("tiraz.theme.v1", JSON.stringify(theme));
  localStorage.setItem(
    "tiraz.system.v3",
    JSON.stringify({ density, ...extra }),
  );
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [],
  warnings = [],
  checks = [],
  geometry = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
  if (m.type() === "warning") warnings.push(m.text());
});
const pass = (name) => {
  checks.push(name);
  console.log("PASS " + name);
};
const preview = () => page.locator(".playground-region");
async function start(
  component,
  language = "en",
  theme = "light",
  density = "compact",
  width = 1440,
  extra = {},
) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(
    `${root}/?tiraz-check=${encodeURIComponent(JSON.stringify({ component, language, theme, density, extra }))}`,
  );
  await page.evaluate(() => document.fonts.ready);
  await preview().waitFor();
  const name =
    component === "tag-input"
      ? language === "ar"
        ? "إدخال الوسوم"
        : "TagInput"
      : component === "filter-bar"
        ? language === "ar"
          ? "شريط التصفية"
          : "FilterBar"
        : language === "ar"
          ? "حقل النسخ"
          : "InputCopy";
  await page.getByRole("heading", { level: 1, name, exact: true }).waitFor();
  assert.equal(
    await page.getByRole("heading", { level: 1, name, exact: true }).count(),
    1,
  );
  assert.equal(
    await preview().locator(".tiraz-system").getAttribute("data-theme"),
    theme,
  );
  assert.equal(
    await preview().locator(".tiraz-system").getAttribute("data-density"),
    density,
  );
}
async function bounds() {
  const data = await page.evaluate(() => ({
    width: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    controls: [
      ...document.querySelectorAll(
        ".playground-region .tz-tag-input,.playground-region .tz-input-copy,.playground-region .tz-filter-bar",
      ),
    ].map((el) => ({
      width: el.getBoundingClientRect().width,
      scroll: el.scrollWidth,
      client: el.clientWidth,
    })),
    chips: [...document.querySelectorAll(".playground-region .tz-tag")].map(
      (el) => {
        const label = el.querySelector("bdi").getBoundingClientRect(),
          button = el.querySelector("button").getBoundingClientRect();
        return {
          separated: label.right <= button.left || button.right <= label.left,
        };
      },
    ),
  }));
  assert.ok(
    data.document <= data.width && data.body <= data.width,
    JSON.stringify(data),
  );
  // Guard against a vacuous pass if the stage stops rendering the control.
  assert.equal(data.controls.length, 1, JSON.stringify(data));
  for (const c of data.controls)
    assert.ok(c.scroll <= c.client + 1, JSON.stringify(c));
  for (const c of data.chips) assert.ok(c.separated, JSON.stringify(c));
  return data;
}
try {
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const density of ["compact", "standard"])
        for (const width of [1440, 390]) {
          for (const component of ["tag-input", "filter-bar", "input-copy"]) {
            await start(component, language, theme, density, width);
            const t = (ar, en) => (language === "ar" ? ar : en);
            if (component === "tag-input") {
              const input = preview().getByRole("textbox");
              await input.fill("دليل طويل " + "LongMixedLabel".repeat(8));
              await input.press("Enter");
              assert.equal(await input.inputValue(), "");
            } else if (component === "filter-bar") {
              await preview()
                .getByRole("searchbox")
                .fill("عنوان طويل " + "LongMixedLabel".repeat(8));
            } else {
              const input = preview().getByRole("textbox");
              assert.equal(await input.getAttribute("readonly"), "");
            }
            const measurements = await bounds();
            geometry.push({
              language,
              theme,
              density,
              width,
              component,
              ...measurements,
            });
            if (
              density === "compact" &&
              (width === 390 ||
                (language === "ar" && theme === "light") ||
                (language === "en" && theme === "dark"))
            ) {
              await preview().scrollIntoViewIfNeeded();
              await page.screenshot({
                path: `${evidence}/${component}-${language}-${theme}-${width}.png`,
              });
            }
            await preview().evaluate(async (el) => {
              await Promise.all(
                el
                  .getAnimations({ subtree: true })
                  .map((animation) => animation.finished.catch(() => {})),
              );
            });
            await page.addScriptTag({
              path: require.resolve("axe-core/axe.min.js"),
            });
            const violations = await page.evaluate(async () =>
              (
                await axe.run(document.querySelector(".playground-region"), {
                  runOnly: {
                    type: "tag",
                    values: ["wcag2a", "wcag2aa", "wcag21aa"],
                  },
                })
              ).violations.map((v) => ({
                id: v.id,
                nodes: v.nodes.map((n) => ({
                  target: n.target,
                  summary: n.failureSummary,
                  html: n.html,
                })),
              })),
            );
            assert.deepEqual(
              violations,
              [],
              JSON.stringify({
                component,
                language,
                theme,
                density,
                width,
                violations,
              }),
            );
            if (component === "input-copy" && width === 1440) {
              await preview()
                .getByRole("button", {
                  name: t("نسخ رابط الدعوة", "Copy Invite link"),
                  exact: true,
                })
                .click();
              assert.equal(
                await page.evaluate(() => navigator.clipboard.readText()),
                "https://madar.sa/invite/7KQ2-RX9",
              );
              assert.ok(
                (await preview().innerText()).includes(
                  t("تم النسخ.", "Copied."),
                ),
              );
            }
          }
        }
  pass(
    "48 component/language/theme/density/viewport layouts: no overflow/overlap or axe A/AA findings; real clipboard succeeds in both directions/themes/densities",
  );
  await start("tag-input");
  const input = preview().getByRole("textbox");
  await input.fill("  Local  ");
  await input.press("Enter");
  await input.fill("Local");
  await input.press("Enter");
  assert.ok((await preview().innerText()).includes("already added"));
  await input.fill("");
  await input.press("Backspace");
  assert.equal(
    await preview().getByRole("button", { name: "Remove Local" }).count(),
    0,
  );
  await input.fill("IME");
  await input.dispatchEvent("compositionstart");
  await input.press("Enter");
  assert.equal(
    await preview().getByRole("button", { name: "Remove IME" }).count(),
    0,
  );
  await input.dispatchEvent("compositionend");
  await input.press("Enter");
  await preview().getByRole("button", { name: "Remove IME" }).focus();
  await page.keyboard.press("Enter");
  assert.equal(
    await input.evaluate((el) => el === document.activeElement),
    true,
  );
  await input.fill("draft");
  // Read the named hidden inputs FormData submits; reset is covered by
  // src/system/TagInput.test.tsx.
  assert.deepEqual(
    await preview()
      .locator('input[type=hidden][name="tags"]')
      .evaluateAll((els) => els.map((el) => el.value)),
    ["Design", "Urgent"],
  );
  await input.fill("");
  assert.equal(await input.inputValue(), "");
  // Native paste inserts literal delimiters; no tag creation until Enter.
  await page.evaluate(() => navigator.clipboard.writeText("alpha, beta"));
  await input.focus();
  await page.keyboard.press("Meta+V");
  assert.equal(await input.inputValue(), "alpha, beta");
  assert.equal(
    await preview().getByRole("button", { name: "Remove alpha, beta" }).count(),
    0,
  );
  await input.press("Enter");
  assert.equal(
    await preview().getByRole("button", { name: "Remove alpha, beta" }).count(),
    1,
  );
  pass(
    "tag trimming, duplicate announcement, IME, keyboard removal/focus, committed form data without draft and native literal paste",
  );
  await page.getByLabel("Maximum tags", { exact: true }).fill("3");
  await input.fill("Too many");
  await input.press("Enter");
  assert.ok((await preview().innerText()).includes("Maximum of 3"));
  await page.getByRole("switch", { name: "Read only", exact: true }).click();
  assert.equal(await input.getAttribute("readonly"), "");
  assert.equal(
    await preview().getByRole("button", { name: "Remove Design" }).isDisabled(),
    true,
  );
  await page.getByRole("switch", { name: "Read only", exact: true }).click();
  await page.getByRole("switch", { name: "Disabled", exact: true }).click();
  assert.equal(await input.isDisabled(), true);
  pass("live maximum/read-only/disabled controls preserve existing tags");
  await start("filter-bar");
  const search = preview().getByRole("searchbox");
  await search.fill("guide");
  await preview().getByRole("combobox").click();
  await page.getByRole("option", { name: "Notes", exact: true }).click();
  assert.ok((await preview().innerText()).includes("0 documents"));
  await preview().getByRole("button", { name: "Remove kind" }).click();
  assert.ok((await preview().innerText()).includes("2 documents"));
  assert.equal(
    await search.evaluate((el) => el === document.activeElement),
    true,
  );
  await preview().getByRole("button", { name: "Clear all" }).click();
  assert.ok((await preview().innerText()).includes("3 documents"));
  assert.equal(await search.inputValue(), "");
  pass("combined local filters, individual removal, Clear all and focus");
  await start("input-copy");
  // The stage also holds the frame's buttons and a hidden status; scope to
  // the InputCopy itself.
  const copy = preview().locator(".tz-input-copy").getByRole("button");
  const copyStatus = preview().locator(".tz-input-copy + [role=status]");
  const value = preview().getByRole("textbox");
  const long =
    "  src/system/ai/examples/InputCopyExamples.tsx?value=" +
    "完整-Exact".repeat(25) +
    "  ";
  await page.getByLabel("Value", { exact: true }).fill(long);
  await copy.focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), long);
  await page.getByLabel("Value", { exact: true }).fill("replacement");
  assert.equal(await copyStatus.innerText(), "");
  await value.focus();
  await page.keyboard.press("Meta+A");
  assert.equal(
    await value.evaluate((el) => el.selectionEnd - el.selectionStart),
    11,
  );
  // Failure/unavailable/pending outcomes are deliberately simulated; success above uses real Chrome clipboard.
  for (const mode of ["unavailable", "reject", "pending"]) {
    await page.evaluate((mode) => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value:
          mode === "unavailable"
            ? undefined
            : {
                writeText: () =>
                  mode === "reject"
                    ? Promise.reject(new Error("Denied"))
                    : new Promise((resolve) => (window.finishCopy = resolve)),
              },
      });
    }, mode);
    await copy.click();
    if (mode === "pending") {
      await page.getByLabel("Value", { exact: true }).fill("newer");
      await page.evaluate(() => window.finishCopy());
      assert.equal(await copyStatus.innerText(), "");
    } else {
      assert.ok((await preview().innerText()).includes("Could not copy"));
      await value.focus();
      await page.keyboard.press("Meta+A");
      assert.equal(
        await value.evaluate((el) => el.selectionEnd - el.selectionStart),
        11,
      );
    }
  }
  pass(
    "exact long clipboard value, keyboard selection, honest simulated failure/unavailable access and cancellation of a pending write",
  );
  for (const component of ["tag-input", "filter-bar", "input-copy"]) {
    await start(component, "en", "dark", "standard", 1440, {
      accent: "plum",
      typography: "large",
      radius: 16,
      reducedMotion: true,
    });
    const before = await preview()
      .locator("input")
      .first()
      .evaluate((el) => getComputedStyle(el).fontSize);
    assert.equal(before, "16px");
    const transition = await preview()
      .locator("input")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    assert.ok(transition.split(",").every((t) => parseFloat(t) === 0));
    // Accent is a Radix Select: open it and pick the option by name.
    await page.getByRole("combobox", { name: "Accent", exact: true }).click();
    await page.getByRole("option", { name: "Blue", exact: true }).click();
    await page
      .getByLabel("Typography", { exact: true })
      .selectOption("standard");
    assert.equal(
      await preview()
        .locator("input")
        .first()
        .evaluate((el) => getComputedStyle(el).fontSize),
      "14px",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page
      .getByRole("switch", { name: "Reduce motion", exact: true })
      .uncheck();
    assert.ok(
      (
        await preview()
          .locator("input")
          .first()
          .evaluate((el) => getComputedStyle(el).transitionDuration)
      )
        .split(",")
        .every((t) => parseFloat(t) === 0),
    );
    await bounds();
  }
  pass("live accent/typography/corners, app and OS reduced-motion settings");
  for (const component of ["tag-input", "filter-bar", "input-copy"]) {
    await start(component, "en", "light", "standard", 320);
    await bounds();
    await preview().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${evidence}/${component}-320.png` });
  }
  pass("all three examples fit a 320px viewport");
  await start("tag-input", "ar");
  await preview().scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${evidence}/tag-input-ar-default.png` });
  await start("filter-bar", "en", "dark");
  await preview().getByRole("searchbox").fill("guide");
  await preview().getByRole("combobox").click();
  await page.getByRole("option", { name: "Guides", exact: true }).click();
  await preview().scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${evidence}/filter-bar-en-applied.png` });
  await start("input-copy", "ar", "dark");
  await preview()
    .getByRole("button", { name: "نسخ رابط الدعوة", exact: true })
    .click();
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    "https://madar.sa/invite/7KQ2-RX9",
  );
  await preview().scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${evidence}/input-copy-ar-success.png` });
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  await writeFile(
    `${evidence}/results.json`,
    JSON.stringify(
      {
        checks,
        geometry,
        errors,
        warnings,
        clipboard:
          "Real Chrome write/read for success; failure/unavailable/pending results simulated explicitly",
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
