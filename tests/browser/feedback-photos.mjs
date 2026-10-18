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
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5207",
  out = process.env.TIRAZ_EVIDENCE || "docs/feedback-and-avatar-photos/browser";
await mkdir(out, { recursive: true });
const report = { checks: [], matrix: [], screenshots: [], errors: [] };
page.on("pageerror", (error) => report.errors.push(error.message));
const fixture = base + "/tests/browser/feedback-photos-fixture.html";
async function loaded(locator) {
  await locator.locator("img").waitFor({ state: "visible" });
  assert(
    await locator
      .locator("img")
      .evaluate((img) => img.complete && img.naturalWidth === 256),
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
async function snap(name) {
  await page.screenshot({
    path: out + "/" + name,
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
async function animations() {
  return page
    .locator(
      ".tz-skeleton, .tz-loading-spinner .tz-spinner, .tz-progress-track[data-indeterminate] .tz-progress-indicator",
    )
    .evaluateAll((els) =>
      els.map(
        (el) =>
          // The skeleton's shimmer runs on its ::after layer.
          getComputedStyle(el, el.matches(".tz-skeleton") ? "::after" : null)
            .animationName,
      ),
    );
}
try {
  await page.setViewportSize({ width: 1280, height: 900 });
  // Hold a local asset request to inspect loading before it succeeds.
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  let held = 0;
  await page.route("**/src/system/ai/assets/sara.jpg", async (route) => {
    held++;
    await gate;
    await route.continue();
  });
  await page.goto(fixture + "?language=en", { waitUntil: "domcontentloaded" });
  const photo = page
    .getByRole("region", { name: "Photos" })
    .getByRole("img", { name: "Sara Ali" })
    .first();
  await photo.waitFor();
  assert.equal(await photo.textContent(), "SA");
  release();
  await page.unrouteAll({ behavior: "wait" });
  await loaded(photo);
  assert(held > 0);
  await page.getByRole("button", { name: "Fail image", exact: true }).click();
  await photo.locator("img").waitFor({ state: "detached" });
  assert.equal(await photo.textContent(), "SA");
  await page.getByRole("button", { name: "Replace image" }).click();
  await loaded(photo);
  assert.match(await photo.locator("img").getAttribute("src"), /omar/);
  await page.getByRole("button", { name: "Remove image" }).click();
  assert.equal(await photo.textContent(), "SA");
  assert.equal(await photo.locator("img").count(), 0);
  await page.getByRole("button", { name: "Restore image" }).click();
  await loaded(photo);
  assert.equal(await photo.locator("img").getAttribute("alt"), "");
  assert.equal(await photo.locator("img").getAttribute("aria-hidden"), "true");
  report.checks.push(
    "Local portrait loading, failure, replacement, removal and restored cached source; decorative internals and one name.",
  );
  const alerts = page.getByRole("region", { name: "Alerts" });
  assert.equal(await alerts.getByRole("alert").count(), 0);
  assert.equal(await alerts.getByRole("status").count(), 0);
  await update(() => window.setAnnouncement("polite"));
  assert.equal(await alerts.getByRole("status").count(), 1);
  await update(() => window.setAnnouncement("assertive"));
  assert.equal(await alerts.getByRole("alert").count(), 1);
  await update(() => window.setAnnouncement("off"));
  await page.getByRole("button", { name: "Dismiss note" }).click();
  assert.match(
    await alerts.getByRole("status").textContent(),
    /Note dismissed/,
  );
  assert(
    await page
      .getByRole("button", { name: "Show note" })
      .evaluate((el) => el === document.activeElement),
  );
  await page.getByRole("button", { name: "Show note" }).click();
  assert(
    await page
      .getByRole("button", { name: "Dismiss note" })
      .evaluate((el) => el === document.activeElement),
  );
  await page.getByRole("button", { name: "Show content" }).click();
  assert.equal(await page.locator('[aria-busy="false"]').count(), 1);
  assert.equal(
    await page
      .getByRole("region", { name: "Skeletons" })
      .locator(".tz-feedback-placeholder .tz-skeleton")
      .count(),
    0,
  );
  await page.getByRole("button", { name: "Show loading state" }).click();
  assert.equal(await page.locator('[aria-busy="true"]').count(), 1);
  report.checks.push(
    "Static Alert silence, explicit status/alert urgency, application-owned dismissal/restoration, explicit Skeleton ready/loading action with one host announcement.",
  );
  const progress = page.getByRole("progressbar", { name: "Preparing report" });
  for (const [input, want] of [
    [0, 0],
    [100, 100],
    [-5, 0],
    [120, 100],
    [42.5, 42.5],
  ]) {
    await update((v) => window.setProgress(v), input);
    assert.equal(await progress.getAttribute("aria-valuenow"), String(want));
  }
  for (const input of [null, NaN, Infinity, -Infinity]) {
    await update((v) => window.setProgress(v), input);
    assert.equal(await progress.getAttribute("aria-valuenow"), null);
    assert.equal(await progress.getAttribute("aria-valuetext"), null);
  }
  await update(() => window.setProgress(64));
  assert.equal(
    await page
      .getByRole("region", { name: "Spinners" })
      .getByRole("status")
      .count(),
    2,
  );
  assert.equal(
    await page.locator('.tz-loading-spinner[aria-hidden="true"]').count(),
    1,
  );
  assert((await animations()).every((name) => name !== "none"));
  await update(() => window.updateTiraz({ reducedMotion: true }));
  assert((await animations()).every((name) => name === "none"));
  await update(() => window.updateTiraz({ reducedMotion: false }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert((await animations()).every((name) => name === "none"));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  report.checks.push(
    "Progress zero/completion/clamping/fractions/nonfinite modes; named and decorative Spinner; app and OS reductions stop all loading animation.",
  );
  const color = await alerts
    .locator('.tz-alert[data-tone="success"]')
    .evaluate((el) => getComputedStyle(el).color);
  await update(() =>
    window.updateTiraz({
      accent: "plum",
      radius: 16,
      density: "standard",
      typography: "large",
      theme: "dark",
    }),
  );
  const darkColor = await alerts
    .locator('.tz-alert[data-tone="success"]')
    .evaluate((el) => getComputedStyle(el).color);
  assert.notEqual(color, darkColor);
  await update(() => window.updateTiraz({ accent: "clay" }));
  assert.equal(
    await alerts
      .locator('.tz-alert[data-tone="success"]')
      .evaluate((el) => getComputedStyle(el).color),
    darkColor,
  );
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const axe = await page.evaluate(
    async () => await window.axe.run(document.querySelector("main")),
  );
  assert.deepEqual(
    axe.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
    [],
  );
  report.checks.push(
    "Axe checks on composed feedback/photo examples; semantic tone independent of live accent changes.",
  );
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const density of ["compact", "standard"])
        for (const typography of ["standard", "large"])
          for (const width of [1280, 320]) {
            await page.setViewportSize({ width, height: 900 });
            await page.goto(
              `${fixture}?language=${language}&theme=${theme}&density=${density}&typography=${typography}`,
              { waitUntil: "networkidle" },
            );
            await noOverflow();
            assert(
              await page.evaluate(() =>
                document.fonts.check('14px "IBM Plex Sans Arabic"'),
              ),
            );
            const name =
              language === "ar" ? "تجهيز التقرير" : "Preparing report";
            const bar = page.getByRole("progressbar", { name });
            assert.equal(await bar.getAttribute("aria-valuenow"), "64");
            assert.equal(
              await bar.getAttribute("aria-valuetext"),
              language === "ar" ? "٦٤٪؜" : "64%",
            );
            const bounds = await bar.boundingBox(),
              fill = await bar.locator(".tz-progress-indicator").boundingBox();
            assert(Math.abs(fill.width / bounds.width - 0.64) < 0.02);
            assert(
              Math.abs(
                language === "ar"
                  ? fill.x + fill.width - (bounds.x + bounds.width)
                  : fill.x - bounds.x,
              ) < 1,
            );
            assert.equal(
              await page.locator(".tz-avatar img:not([hidden])").count(),
              3,
            );
            report.matrix.push({ language, theme, density, typography, width });
            if (
              theme === "light" &&
              density === "compact" &&
              typography === "standard"
            )
              await snap(
                `feedback-photos-${language}-${width === 320 ? "narrow" : "desktop"}.png`,
              );
          }
  // Inspect focused documentation in both locales; every page keeps the approved continuous sections.
  for (const language of ["ar", "en"])
    for (const width of [1280, 320])
      for (const active of [
        "alert",
        "skeleton",
        "progress",
        "spinner",
        "avatar",
        "avatar-group",
      ]) {
        await page.setViewportSize({ width, height: 900 });
        await page.addInitScript(
          ({ language, active }) => {
            localStorage.setItem(
              "tiraz.documentation.v2",
              JSON.stringify({
                language,
                active,
                systemPanelOpen: true,
                inspectorOpen: true,
              }),
            );
            localStorage.setItem("tiraz.theme.v1", JSON.stringify("light"));
            localStorage.removeItem("tiraz.playgrounds.v2");
            localStorage.removeItem("tiraz.system.v3");
          },
          { language, active },
        );
        await page.goto(base, { waitUntil: "networkidle" });
        await noOverflow();
        assert.equal(
          await page.locator(".component-page > section").count(),
          4,
        );
        if (language === "en" && width === 1280 && active === "avatar") {
          await page
            .getByLabel("Appearance", { exact: true })
            .selectOption("photo");
          await loaded(
            page
              .getByRole("region", { name: "Interactive playground" })
              .getByRole("img", { name: "Sara Ali" }),
          );
          await page
            .getByRole("button", { name: "Copy code", exact: true })
            .click();
          const code = await page.evaluate(() =>
            navigator.clipboard.readText(),
          );
          assert.match(code, /\.\/system\/ai\/assets\/sara.jpg/);
          await page
            .getByRole("button", { name: "Copy agent prompt", exact: true })
            .click();
          const prompt = await page.evaluate(() =>
            navigator.clipboard.readText(),
          );
          assert(prompt.includes(code));
          assert.match(prompt, /ai\/assets\/LICENSE.txt/);
          await page
            .getByLabel("Image URL · optional")
            .fill("/missing-documentation-photo.jpg");
          await page
            .getByRole("region", { name: "Interactive playground" })
            .locator("img")
            .waitFor({ state: "detached" });
          await page.getByLabel("Image URL · optional").fill("");
          await loaded(
            page
              .getByRole("region", { name: "Interactive playground" })
              .getByRole("img", { name: "Sara Ali" }),
          );
          await page
            .getByLabel("Appearance", { exact: true })
            .selectOption("initials");
          assert.equal(
            await page
              .getByRole("region", { name: "Interactive playground" })
              .locator("img")
              .count(),
            0,
          );
          report.checks.push(
            "Documentation photo selector, custom URL failure/removal, local imports and matching copied code/prompt.",
          );
        }
        if (language === "en" && width === 1280 && active === "progress") {
          await page.getByLabel("Value · %").fill("0");
          assert.equal(
            await page
              .getByRole("region", { name: "Interactive playground" })
              .getByRole("progressbar")
              .getAttribute("aria-valuenow"),
            "0",
          );
          await page
            .getByRole("switch", { name: "Indeterminate", exact: true })
            .click();
          assert.equal(
            await page
              .getByRole("region", { name: "Interactive playground" })
              .getByRole("progressbar")
              .getAttribute("aria-valuenow"),
            null,
          );
          await page
            .getByRole("switch", { name: "Indeterminate", exact: true })
            .click();
          await page.getByLabel("Value · %").fill("64");
          await page.getByLabel("Accent", { exact: true }).selectOption("plum");
          await page
            .getByLabel("Density", { exact: true })
            .selectOption("standard");
          await page
            .getByLabel("Typography", { exact: true })
            .selectOption("large");
          await page
            .getByRole("switch", { name: "Reduce motion", exact: true })
            .click();
          assert.equal(
            await page
              .locator(".playground-region .tiraz-system")
              .getAttribute("data-reduced-motion"),
            "true",
          );
          report.checks.push(
            "Live documentation Progress state, accent, density, text scale and motion controls update the preview.",
          );
        }
        await page.locator(".api-reference > summary").click();
        await noOverflow();
        assert(await page.locator(".api-reference table").isVisible());
        await page.locator(".api-reference > summary").click();
        if (
          (language === "en" && width === 1280) ||
          (language === "ar" && width === 320)
        )
          await snap(
            `docs-${active}-${language}-${width === 320 ? "narrow" : "desktop"}.png`,
          );
      }
  assert.deepEqual(report.errors, []);
  report.checks.push(
    "32 complete component locale/theme/density/text-scale/width combinations, 24 focused documentation views, font loading and no horizontal clipping.",
  );
} catch (error) {
  report.failure = error.stack;
  await page
    .screenshot({ path: out + "/failure.png", fullPage: true })
    .catch(() => {});
  throw error;
} finally {
  await writeFile(out + "/results.json", JSON.stringify(report, null, 2));
  await browser.close();
}
