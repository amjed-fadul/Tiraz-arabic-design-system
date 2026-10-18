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
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5205";
const out =
  process.env.TIRAZ_EVIDENCE || "docs/form-controls-and-badge/browser";
await mkdir(out, { recursive: true });
const report = { matrix: [], checks: [], errors: [] };
let page;
// After ~115 documents in one tab Vite's HMR socket drops and force-reloads
// the page; the 256-document matrix starts a fresh tab per block.
async function openPage() {
  await page?.close();
  page = await browser.newPage();
  page.setDefaultTimeout(10000);
  page.on("pageerror", (e) => report.errors.push(e.message));
}
await openPage();
async function formData(id) {
  return page.evaluate(
    (id) => Object.fromEntries(new FormData(document.getElementById(id))),
    id,
  );
}
try {
  await page.goto(base + "/tests/browser/small-controls-fixture.html");
  const check = page.getByRole("checkbox", { name: "Consent", exact: true });
  await check.focus();
  await page.keyboard.press("Space");
  assert.equal(await check.isChecked(), false);
  const alpha = page.getByRole("radio", { name: "Alpha", exact: true }),
    beta = page.getByRole("radio", { name: "Beta", exact: true });
  await alpha.focus();
  await page.keyboard.press("ArrowDown");
  assert.equal(await beta.isChecked(), true);
  assert.equal(
    await beta.evaluate((el) => el === document.activeElement),
    true,
  );
  await page.keyboard.press("ArrowDown");
  assert.equal(await alpha.isChecked(), true);
  await page.keyboard.press("ArrowRight");
  assert.equal(await beta.isChecked(), true);
  const notes = page.getByRole("textbox", { name: "Native notes" });
  await notes.fill("edited");
  await notes.evaluate((el) => el.setSelectionRange(1, 3));
  assert.equal(await notes.evaluate((el) => el.selectionStart), 1);
  assert.equal(
    await notes.evaluate((el) => getComputedStyle(el).resize),
    "vertical",
  );
  await page.getByRole("radio", { name: "External Y", exact: true }).check();
  assert.deepEqual(await formData("native"), {
    choice: "b",
    notes: "edited",
    external: "y",
  });
  await page
    .getByRole("checkbox", { name: "Cancel reset", exact: true })
    .check();
  await page.getByRole("button", { name: "Native reset", exact: true }).click();
  assert.equal(await notes.inputValue(), "edited");
  await page
    .getByRole("checkbox", { name: "Cancel reset", exact: true })
    .uncheck();
  await page.getByRole("button", { name: "Native reset", exact: true }).click();
  assert.deepEqual(await formData("native"), {
    consent: "yes",
    choice: "a",
    notes: "original",
    external: "x",
  });
  await page
    .getByRole("checkbox", { name: "Controlled consent", exact: true })
    .uncheck();
  await page.getByRole("radio", { name: "Controlled B", exact: true }).check();
  await page.getByRole("textbox", { name: "Controlled notes" }).fill("edited");
  await page
    .getByRole("button", { name: "Controlled reset", exact: true })
    .click();
  assert.deepEqual(await formData("controlled"), {
    consent: "yes",
    choice: "a",
    notes: "original",
  });
  await page
    .getByRole("button", { name: "Submit required", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("checkbox", { name: "Required checkbox", exact: true })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page
    .getByRole("checkbox", { name: "Required checkbox", exact: true })
    .check();
  await page
    .getByRole("button", { name: "Submit required", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("radio", { name: "Required radio", exact: true })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page
    .getByRole("radio", { name: "Required radio", exact: true })
    .check();
  await page
    .getByRole("button", { name: "Submit required", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("textbox", { name: "Required notes" })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  const before = await check.evaluate((el) => ({
    background: getComputedStyle(el).backgroundColor,
    font: getComputedStyle(el).fontSize,
    corner: getComputedStyle(el).borderRadius,
  }));
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  const after = await check.evaluate((el) => ({
    background: getComputedStyle(el).backgroundColor,
    font: getComputedStyle(el).fontSize,
    corner: getComputedStyle(el).borderRadius,
    motion: getComputedStyle(el).transitionDuration,
  }));
  assert.notEqual(before.background, after.background);
  assert.notEqual(before.font, after.font);
  assert.ok(after.motion.split(", ").every((value) => value === "0s"));
  report.checks.push({
    native:
      "checkbox Space; radios arrows/wrap/skip disabled; uncontrolled submit/reset/cancel/external forms; controlled reset; textarea editing/selection/resize; native required focus",
    customization: { before, after },
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  assert.ok(
    (await check.evaluate((el) => getComputedStyle(el).transitionDuration))
      .split(", ")
      .every((value) => value === "0s"),
  );
  report.checks.push("OS reduced motion overrides config false");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const names = {
    ar: {
      badge: "الشارة",
      checkbox: "مربع الاختيار",
      "radio-group": "مجموعة الخيارات",
      textarea: "مربع النص",
    },
    en: {
      badge: "Badge",
      checkbox: "Checkbox",
      "radio-group": "RadioGroup",
      textarea: "Textarea",
    },
  };
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const density of ["compact", "standard"]) {
        await openPage();
        for (const typography of ["standard", "large"])
          for (const width of [320, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            for (const id of Object.keys(names[language])) {
              await page.goto(base);
              await page.evaluate(
                ({ id, language, theme, density, typography }) => {
                  localStorage.clear();
                  localStorage.setItem(
                    "tiraz.documentation.v2",
                    JSON.stringify({
                      language,
                      active: id,
                      systemPanelOpen: true,
                      inspectorOpen: true,
                    }),
                  );
                  localStorage.setItem("tiraz.theme.v1", JSON.stringify(theme));
                  localStorage.setItem(
                    "tiraz.system.v3",
                    JSON.stringify({
                      density,
                      typography,
                      accent: "sage",
                      radius: 8,
                      reducedMotion: false,
                    }),
                  );
                },
                { id, language, theme, density, typography },
              );
              await page.reload();
              await page.locator(".playground-region .tiraz-system").waitFor();
              await page.evaluate(() => document.fonts.ready);
              const m = await page.evaluate(() => {
                const scope = document.querySelector(
                    ".playground-region .tiraz-system",
                  ),
                  control = scope.querySelector(
                    ".tz-badge,.tz-choice-input,.tz-textarea",
                  );
                return {
                  overflow: document.documentElement.scrollWidth > innerWidth,
                  font: getComputedStyle(control).fontFamily,
                  fontSize: getComputedStyle(control).fontSize,
                  direction: getComputedStyle(scope).direction,
                  theme: scope.dataset.theme,
                  density: scope.dataset.density,
                  typography: scope.dataset.typography,
                  resize: control.matches("textarea")
                    ? getComputedStyle(control).resize
                    : null,
                  controlWidth: control.getBoundingClientRect().width,
                };
              });
              assert.equal(
                m.overflow,
                false,
                `${id} ${language} ${width} overflow`,
              );
              assert.match(m.font, /IBM Plex Sans Arabic/);
              assert.equal(m.direction, language === "ar" ? "rtl" : "ltr");
              assert.equal(m.theme, theme);
              assert.equal(m.density, density);
              assert.equal(m.typography, typography);
              if (id === "radio-group") {
                const radios = page.locator(
                  ".playground-region input[type=radio]",
                );
                await radios.first().focus();
                await page.keyboard.press("ArrowDown");
                assert.equal(await radios.nth(1).isChecked(), true);
              }
              if (id === "checkbox") {
                const c = page.locator(
                  ".playground-region input[type=checkbox]",
                );
                await c.focus();
                await page.keyboard.press("Space");
                assert.equal(await c.isChecked(), true);
              }
              if (id === "badge") {
                // The page shows one badge; cycle its tone in the inspector.
                const tone = page
                  .locator(".inspector-field", {
                    has: page.getByText(language === "ar" ? "النوع" : "Tone", {
                      exact: true,
                    }),
                  })
                  .locator("select");
                const contrasts = [];
                for (const value of ["neutral", "success", "error", "info"]) {
                  await tone.selectOption(value, { force: true });
                  await page
                    .locator(
                      `.playground-region .tz-badge[data-tone="${value}"]`,
                    )
                    .waitFor({ state: "attached" });
                  contrasts.push(
                    ...(await page
                      .locator(".playground-region .tz-badge")
                      .evaluateAll((els) => {
                        const luminance = (color) => {
                          const values = color
                            .match(/[\d.]+/g)
                            .slice(0, 3)
                            .map(Number)
                            .map((v) => {
                              v /= 255;
                              return v <= 0.04045
                                ? v / 12.92
                                : ((v + 0.055) / 1.055) ** 2.4;
                            });
                          return (
                            values[0] * 0.2126 +
                            values[1] * 0.7152 +
                            values[2] * 0.0722
                          );
                        };
                        return els.map((el) => {
                          const css = getComputedStyle(el),
                            a = luminance(css.color),
                            b = luminance(css.backgroundColor);
                          return {
                            tone: el.dataset.tone,
                            ratio:
                              (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
                          };
                        });
                      })),
                  );
                }
                assert.equal(contrasts.length, 4);
                assert.ok(
                  contrasts.every((c) => c.ratio >= 4.5),
                  "Badge text contrast",
                );
                m.badgeContrasts = contrasts;
              }
              if (id === "textarea") {
                const c = page.locator(".playground-region textarea");
                await c.fill(
                  language === "ar"
                    ? "ملاحظة عربية متعددة الأسطر\nتفاصيل مفيدة"
                    : "A multiline note\nUseful details",
                );
                assert.equal(
                  await c.evaluate((el) => el === document.activeElement),
                  true,
                );
                assert.equal(m.resize, "vertical");
              }
              report.matrix.push({
                id,
                language,
                theme,
                density,
                typography,
                width,
                ...m,
              });
              if (
                (density === "compact" &&
                  typography === "standard" &&
                  width === 1440) ||
                (density === "standard" &&
                  typography === "large" &&
                  width === 320)
              )
                await page.screenshot({
                  path: `${out}/${id}-${language}-${theme}-${density}-${typography}-${width}.png`,
                  fullPage: true,
                });
            }
          }
      }
  // Same mounted preview responds to every shared customization setting.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      "tiraz.documentation.v2",
      JSON.stringify({
        language: "en",
        active: "textarea",
        systemPanelOpen: true,
        inspectorOpen: true,
      }),
    );
  });
  await page.reload();
  const rail = page.getByRole("complementary", { name: "Customization" });
  const textarea = page.locator(".playground-region textarea");
  await textarea.fill("Keep this draft");
  const original = await textarea.elementHandle();
  // Accent is a Radix Select: open it and pick the option by name.
  await rail.getByLabel("Accent", { exact: true }).click();
  await page
    .locator(".accent-popup")
    .getByRole("option", { name: "Purple", exact: true })
    .click();
  await page.locator(".accent-popup").waitFor({ state: "detached" });
  await rail.getByLabel("Density", { exact: true }).selectOption("standard");
  await rail.getByLabel("Typography", { exact: true }).selectOption("large");
  await rail.getByLabel("Corner radius", { exact: true }).focus();
  await page.keyboard.press("Home");
  await rail
    .getByRole("switch", { name: "Reduce motion", exact: true })
    .click();
  assert.equal(await textarea.inputValue(), "Keep this draft");
  assert.equal(
    await textarea.evaluate((el, orig) => el === orig, original),
    true,
  );
  report.checks.push(
    "Mounted textarea retains draft and node through live accent/density/text scale/corners/reduced-motion changes",
  );
  const axeSource = require.resolve("axe-core/axe.min.js");
  await page.addScriptTag({ path: axeSource });
  const axe = await page.evaluate(
    async () =>
      await window.axe.run(
        document.querySelector(".doc-page") || document.querySelector("main"),
        { rules: { "color-contrast": { enabled: false } } },
      ),
  );
  assert.deepEqual(
    axe.violations.map((v) => ({ id: v.id, impact: v.impact })),
    [],
  );
  report.checks.push({
    axeViolations: axe.violations.length,
    colorContrast: "All Badge tones measured >=4.5:1 across both themes",
    fonts: await page.evaluate(() => ({
      ready: document.fonts.status,
      arabic: document.fonts.check('14px "IBM Plex Sans Arabic"', "ملاحظات"),
      loaded: performance
        .getEntriesByType("resource")
        .filter((r) => r.name.includes(".woff")).length,
    })),
  });
  // FeedbackForm is not on a docs page; drive the exported example in its own
  // fixture across the same language/theme/density/typography/width matrix.
  await openPage();
  const fixture = (query) =>
    page.goto(
      `${base}/tests/browser/feedback-form-fixture.html?${new URLSearchParams(query)}`,
    );
  report.formGeometry = [];
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const density of ["compact", "standard"])
        for (const typography of ["standard", "large"])
          for (const width of [320, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            await fixture({ lang: language, theme, density, typography });
            await page.evaluate(() => document.fonts.ready);
            const geometry = await page
              .locator("form input[type=radio]")
              .first()
              .evaluate((el) => ({
                input: el.getBoundingClientRect().width,
                label: el.nextElementSibling.getBoundingClientRect().width,
                option: el.parentElement.getBoundingClientRect().width,
                overflow: document.documentElement.scrollWidth > innerWidth,
              }));
            assert.ok(
              geometry.input <= 24,
              "Form radio must retain compact native control geometry",
            );
            assert.ok(
              geometry.label > geometry.input,
              "Form option label must remain readable",
            );
            assert.equal(geometry.overflow, false);
            report.formGeometry.push({
              language,
              theme,
              density,
              typography,
              width,
              ...geometry,
            });
          }
  // Sending validates, then resets the form natively.
  await page.setViewportSize({ width: 1440, height: 900 });
  await fixture({ lang: "en" });
  const form = page.locator("form");
  await form
    .getByRole("button", { name: "Send feedback", exact: true })
    .click();
  assert.equal(
    await form
      .getByRole("textbox", { name: "Notes", exact: true })
      .getAttribute("aria-invalid"),
    "true",
  );
  assert.equal(
    await form
      .getByRole("textbox", { name: "Notes", exact: true })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await form
    .getByRole("textbox", { name: "Notes", exact: true })
    .fill("Useful note");
  await form
    .getByRole("button", { name: "Send feedback", exact: true })
    .click();
  assert.equal(
    await form.getByRole("status").innerText(),
    "Thanks — we received your note.",
  );
  await page.waitForFunction(
    () => document.querySelector("form textarea").value === "",
  );
  await page.addScriptTag({ path: axeSource });
  const formAxe = await page.evaluate(
    async () =>
      await window.axe.run(document.querySelector("main"), {
        rules: { "color-contrast": { enabled: false } },
      }),
  );
  assert.deepEqual(
    formAxe.violations.map((v) => ({ id: v.id, impact: v.impact })),
    [],
  );
  report.checks.push(
    "Connected form checks required notes, focuses error, confirms sending and resets natively (FeedbackForm fixture; no axe violations)",
  );
  assert.deepEqual(report.errors, []);
} finally {
  await writeFile(out + "/results.json", JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(
  JSON.stringify(
    {
      matrix: report.matrix.length,
      checks: report.checks,
      errors: report.errors,
    },
    null,
    2,
  ),
);
