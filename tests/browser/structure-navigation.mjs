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
page.setDefaultTimeout(10000);
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5208",
  out = process.env.TIRAZ_EVIDENCE || "docs/structure-and-navigation/browser";
await mkdir(out, { recursive: true });
const report = { matrix: [], checks: [], screenshots: [], axe: [], errors: [] };
page.on("pageerror", (error) => report.errors.push(error.message));
const axeSource = require.resolve("axe-core/axe.min.js");
async function snap(name) {
  await page.screenshot({
    path: `${out}/${name}`,
    fullPage: true,
    animations: "disabled",
  });
  report.screenshots.push(name);
}
async function update(fn, arg) {
  await page.evaluate(fn, arg);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}
async function noOverflow() {
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "document overflow",
  );
}
async function axe() {
  await page.addScriptTag({ path: axeSource });
  const violations = await page.evaluate(async () =>
    (
      await window.axe.run(document.querySelector("main"), {
        rules: { region: { enabled: false } },
      })
    ).violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target),
    })),
  );
  assert.deepEqual(violations, []);
  return violations;
}
try {
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const density of ["compact", "standard"])
        for (const typography of ["standard", "large"])
          for (const narrow of [false, true])
            for (const motion of ["no-preference", "reduce"]) {
              const scenario = {
                language,
                theme,
                density,
                typography,
                width: narrow ? 360 : 1280,
                motion,
              };
              await page.setViewportSize({
                width: scenario.width,
                height: 900,
              });
              await page.emulateMedia({ reducedMotion: motion });
              await page.goto(
                `${base}/tests/browser/structure-navigation-fixture.html?${new URLSearchParams({ language, theme, density, typography })}`,
              );
              await page.evaluate(() => document.fonts.ready);
              const ar = language === "ar",
                reading = ar ? "القراءة" : "Reading",
                layout = ar ? "التنسيق" : "Layout";
              const accordion = page.getByRole("region", {
                  name: "Accordion",
                  exact: true,
                }),
                paging = page.getByRole("region", {
                  name: "Pagination",
                  exact: true,
                });
              const first = accordion.getByRole("button", {
                  name: reading,
                  exact: true,
                }),
                last = accordion.getByRole("button", {
                  name: layout,
                  exact: true,
                });
              assert.equal(await first.getAttribute("aria-expanded"), "true");
              const heading = accordion.getByRole("heading", { name: reading });
              assert.equal(await heading.locator("button").count(), 1);
              const panelId = await first.getAttribute("aria-controls");
              assert.equal(
                await accordion
                  .getByRole("region", { name: reading, exact: true })
                  .getAttribute("id"),
                panelId,
              );
              await first.focus();
              await page.keyboard.press("ArrowDown");
              assert(
                await last.evaluate((el) => el === document.activeElement),
              );
              await page.keyboard.press("Home");
              assert(
                await first.evaluate((el) => el === document.activeElement),
              );
              await page.keyboard.press("End");
              assert(
                await last.evaluate((el) => el === document.activeElement),
              );
              await page.keyboard.press("Space");
              assert.equal(await last.getAttribute("aria-expanded"), "true");
              assert.equal(await first.getAttribute("aria-expanded"), "false");
              await page.keyboard.press("Space");
              assert.equal(await last.getAttribute("aria-expanded"), "false");
              await page.keyboard.press("ArrowUp");
              await page.keyboard.press("Enter");
              assert.equal(await first.getAttribute("aria-expanded"), "true");
              const duration = await accordion
                .locator(".tz-accordion-panel[data-state=open]")
                .evaluate((el) =>
                  parseFloat(getComputedStyle(el).animationDuration),
                );
              assert(
                motion === "reduce" ? duration <= 0.0001 : duration > 0.1,
                "OS motion duration",
              );
              await page
                .getByRole("region", { name: "Card", exact: true })
                .getByRole("button", {
                  name: ar ? "عرض الملاحظات" : "Read notes",
                })
                .click();
              assert(
                await page
                  .getByText(
                    ar
                      ? "استخدم القيم المشتركة للمسافات والزوايا."
                      : "Use shared tokens for spacing and corners.",
                    { exact: true },
                  )
                  .isVisible(),
              );
              await paging
                .getByRole("button", {
                  name: ar ? "التالي" : "Next",
                  exact: true,
                })
                .click();
              const number = new Intl.NumberFormat(ar ? "ar-u-nu-arab" : "en");
              assert.equal(
                await paging
                  .getByRole("button", {
                    name: ar ? `الصفحة ${number.format(2)}` : "Page 2",
                    exact: true,
                  })
                  .getAttribute("aria-current"),
                "page",
              );
              assert(
                await paging
                  .getByRole("button", {
                    name: ar ? "التالي" : "Next",
                    exact: true,
                  })
                  .evaluate((el) => el === document.activeElement),
              );
              await update(() => window.setPage(10));
              assert.equal(await paging.locator("li").count(), 9);
              assert.equal(
                await paging.locator(".tz-pagination-gap").count(),
                2,
              );
              await update(() => window.setPage(20));
              assert(
                await paging
                  .getByRole("button", {
                    name: ar ? "التالي" : "Next",
                    exact: true,
                  })
                  .isDisabled(),
              );
              await update(() => {
                window.setPage(99);
                window.setTotal(3);
              });
              assert.equal(
                await paging.locator("[aria-current=page]").textContent(),
                number.format(3),
              );
              await update(() => {
                window.setPage(NaN);
                window.setTotal(Infinity);
              });
              assert(
                await paging
                  .getByRole("button", {
                    name: ar ? "السابق" : "Previous",
                    exact: true,
                  })
                  .isDisabled(),
              );
              assert(
                await paging
                  .getByRole("button", {
                    name: ar ? "التالي" : "Next",
                    exact: true,
                  })
                  .isDisabled(),
              );
              await update(() => {
                window.setPage(10);
                window.setTotal(20);
              });
              const breadcrumbs = page.locator(".tz-breadcrumbs");
              assert.equal(await breadcrumbs.getByRole("link").count(), 2);
              assert.equal(
                await breadcrumbs
                  .locator("[aria-current=page]")
                  .evaluate((el) => el.tagName),
                "SPAN",
              );
              const transform = await breadcrumbs
                .locator("svg")
                .first()
                .evaluate((el) => getComputedStyle(el).transform);
              assert(
                ar ? transform.startsWith("matrix(-1") : transform === "none",
                "separator direction",
              );
              assert(
                await page
                  .locator(".tz-card-content bdi")
                  .evaluate((el) => getComputedStyle(el).direction === "ltr"),
              );
              assert(
                await page
                  .locator(".tiraz-system")
                  .evaluate((el) =>
                    document.fonts.check(
                      `400 ${getComputedStyle(el).fontSize} "IBM Plex Sans Arabic"`,
                    ),
                  ),
                "font loaded",
              );
              await noOverflow();
              if (
                density === "compact" &&
                typography === "standard" &&
                motion === "no-preference"
              ) {
                report.axe.push({ scenario, violations: await axe() });
                if (
                  (ar && narrow && theme === "light") ||
                  (!ar && !narrow && theme === "dark")
                )
                  await snap(
                    `components-${language}-${theme}-${narrow ? "narrow" : "desktop"}.png`,
                  );
              }
              report.matrix.push(scenario);
            }
  report.checks.push(
    "64 fixture combinations: both languages/themes/densities/text scales/widths/OS motion; native semantics, disabled skipping, keyboard, one-open/collapse, boundaries, normalization, ellipses, retained Next focus, no overflow, Arabic font, bidi and separator direction.",
  );
  // Application reduction must override OS no-preference; updates keep active state.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(
    `${base}/tests/browser/structure-navigation-fixture.html?language=ar`,
  );
  await update(() =>
    window.updateTiraz({
      theme: "dark",
      accent: "plum",
      density: "standard",
      typography: "large",
      radius: 16,
      direction: "ltr",
      reducedMotion: true,
    }),
  );
  await page
    .getByRole("region", { name: "Accordion", exact: true })
    .getByRole("button", { name: "التنسيق", exact: true })
    .click();
  assert.equal(
    await page.locator(".tz-accordion-trigger[data-state=open]").count(),
    1,
  );
  assert(
    (await page
      .locator(".tz-accordion-panel[data-state=open]")
      .evaluate((el) => parseFloat(getComputedStyle(el).animationDuration))) <=
      0.0001,
  );
  const settings = await page.locator(".tz-card").evaluate((el) => ({
    radius: getComputedStyle(el).borderRadius,
    size: getComputedStyle(el).fontSize,
    padding: getComputedStyle(el.querySelector(".tz-card-header")).padding,
    action: getComputedStyle(el).getPropertyValue("--action"),
  }));
  // .tz-card is paper at --radius-paper, which stops at 24px: radius 16
  // renders 24px.
  assert.equal(settings.radius, "24px");
  assert.equal(settings.size, "16px");
  // Paper padding at standard density: 16px block × 18px inline.
  assert.equal(settings.padding, "16px 18px");
  assert.match(settings.action, /D6B6E5/i);
  await update(() => window.setPagingDisabled(true));
  assert(
    await page
      .locator(".tz-pagination button")
      .evaluateAll((els) => els.every((el) => el.disabled)),
  );
  report.checks.push(
    "Live provider customization changes theme/accent/density/text/radius/direction; application reduced motion stops disclosure motion; global disabled prevents paging.",
  );
  for (const language of ["ar", "en"])
    for (const narrow of [false, true]) {
      const ar = language === "ar";
      await page.setViewportSize({ width: narrow ? 360 : 1440, height: 1000 });
      for (const [component, name] of [
        ["card", ar ? "البطاقة" : "Card"],
        ["accordion", ar ? "الأكورديون" : "Accordion"],
        ["breadcrumbs", ar ? "مسار التنقل" : "Breadcrumbs"],
        ["pagination", ar ? "تقسيم الصفحات" : "Pagination"],
      ]) {
        await page.goto(base);
        await page.evaluate(
          ({ language, component }) => {
            localStorage.clear();
            localStorage.setItem(
              "tiraz.documentation.v2",
              JSON.stringify({
                language,
                active: component,
                systemPanelOpen: true,
                inspectorOpen: true,
              }),
            );
          },
          { language, component },
        );
        await page.reload();
        await page
          .getByRole("heading", { name, exact: true })
          .first()
          .waitFor();
        const preview = page.getByRole("region", {
          name: ar ? "المعاينة التفاعلية" : "Interactive playground",
        });
        if (component === "card") {
          await preview
            .getByRole("button", {
              name: ar ? "عرض الملاحظات" : "Read notes",
            })
            .click();
          assert(
            await preview
              .getByText(
                ar
                  ? "استخدم القيم المشتركة للمسافات والزوايا."
                  : "Use shared tokens for spacing and corners.",
              )
              .isVisible(),
          );
        }
        if (component === "accordion") {
          await preview
            .getByRole("button", {
              name: ar ? "هل يمكنني تغيير خطتي؟" : "Can I change my plan?",
              exact: true,
            })
            .click();
          assert.equal(
            await preview.locator("[aria-expanded=true]").count(),
            1,
          );
        }
        if (component === "breadcrumbs") {
          const link = preview.getByRole("link").last();
          const href = await link.getAttribute("href");
          await link.click();
          assert.equal(new URL(page.url()).hash, encodeURI(href));
          assert(
            await page.evaluate(
              (href) =>
                document.getElementById(decodeURIComponent(href.slice(1))) !==
                null,
              href,
            ),
          );
        }
        if (component === "pagination") {
          await preview
            .getByRole("button", { name: ar ? "التالي" : "Next", exact: true })
            .click();
          assert(
            await preview
              .getByRole("heading", {
                // The docs page opens on page 6.
                name: ar ? "ملاحظة الدليل ٧" : "Guide note 7",
                exact: true,
              })
              .isVisible(),
          );
        }
        await page
          .getByRole("button", {
            name: ar ? "نسخ الكود" : "Copy code",
            exact: true,
          })
          .click();
        const code = await page.evaluate(() => navigator.clipboard.readText());
        assert.match(code, /SystemProvider/);
        assert(!/fetch\(|setTimeout/.test(code));
        await page
          .getByRole("button", {
            name: ar ? "نسخ الطلب" : "Copy agent prompt",
            exact: true,
          })
          .click();
        const prompt = await page.evaluate(() =>
          navigator.clipboard.readText(),
        );
        assert(prompt.includes(code));
        await noOverflow();
        if ((ar && narrow) || (!ar && !narrow)) {
          await page.evaluate(() => scrollTo(0, 0));
          await snap(
            `docs-${component}-${language}-${narrow ? "narrow" : "desktop"}.png`,
          );
        }
      }
    }
  // Use real workbench controls without reload, including preserving pagination content.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      "tiraz.documentation.v2",
      JSON.stringify({
        language: "en",
        active: "pagination",
        systemPanelOpen: true,
        inspectorOpen: true,
      }),
    );
  });
  await page.reload();
  // Accent is a Radix Select: open it and pick the option by name.
  await page.getByRole("combobox", { name: "Accent", exact: true }).click();
  await page.getByRole("option", { name: "Blue", exact: true }).click();
  await page.getByRole("listbox").waitFor({ state: "detached" });
  await page.getByLabel("Density", { exact: true }).selectOption("standard");
  await page.getByLabel("Typography", { exact: true }).selectOption("large");
  await page.getByLabel("Corner radius").fill("16");
  await page.getByRole("switch", { name: "Reduce motion" }).click();
  await page.getByRole("button", { name: "Toggle theme" }).click();
  const preview = page.getByRole("region", { name: "Interactive playground" });
  // The playground region sits inside its provider.
  const provider = page.locator(".playground-region > .tiraz-system");
  await preview.getByRole("button", { name: "Next", exact: true }).click();
  assert.equal(await preview.locator("[aria-current=page]").textContent(), "2");
  assert.equal(await provider.getAttribute("data-theme"), "dark");
  assert.equal(await provider.getAttribute("data-density"), "standard");
  assert.equal(await provider.getAttribute("data-typography"), "large");
  // accentColors.blue.dark in src/system/config.ts.
  assert.match(
    await provider.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--action"),
    ),
    /A8C6EF/i,
  );
  await snap("docs-pagination-live-customization.png");
  report.checks.push(
    "16 documentation language/viewport/page checks with real connected outcomes and copied prompts; real appearance controls update the live preview.",
  );
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.errors.push(error.stack);
  await snap("failure.png");
  throw error;
} finally {
  await writeFile(`${out}/results.json`, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        scenarios: report.matrix.length,
        checks: report.checks,
        screenshots: report.screenshots,
        errors: report.errors,
      },
      null,
      2,
    ),
  );
  await browser.close();
}
