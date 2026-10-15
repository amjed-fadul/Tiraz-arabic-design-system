import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const {
  chromium,
} = require("/Users/amjedfadul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5241";
const evidence = "docs/steps-and-timeline/browser";
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
const checks = [],
  geometry = [],
  errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const pass = (name) => {
  checks.push(name);
  console.log("PASS " + name);
};
const fixture = `${base}/tests/browser/steps-timeline-fixture.html`;
try {
  for (const lang of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const width of [1440, 360])
        for (const orientation of ["horizontal", "vertical"]) {
          await page.setViewportSize({ width, height: 1000 });
          await page.goto(
            `${fixture}?lang=${lang}&theme=${theme}&orientation=${orientation}`,
          );
          await page.getByRole("heading", { level: 1 }).waitFor();
          await page.evaluate(() => document.fonts.ready);
          const measured = await page.evaluate(() => {
            const list = document.querySelector(
              '[aria-label="Long steps"] .tz-steps',
            );
            const rows = [...list.children];
            const rect = (el) => {
              const r = el.getBoundingClientRect();
              return { x: r.x, y: r.y, w: r.width, h: r.height };
            };
            return {
              width: innerWidth,
              documentWidth: document.documentElement.scrollWidth,
              list: rect(list),
              indicators: rows.map((row) =>
                rect(row.querySelector(".tz-step-indicator")),
              ),
              labels: rows.map((row) =>
                rect(row.querySelector(".tz-step-copy")),
              ),
              rails: rows.map((row) => {
                const s = getComputedStyle(row, "::after");
                return {
                  content: s.content,
                  inline: s.insetInlineStart,
                  block: s.insetBlockStart,
                  end: s.insetBlockEnd,
                  borderInline: s.borderInlineStartWidth,
                  borderBlock: s.borderBlockStartWidth,
                };
              }),
              timeline: [...document.querySelectorAll(".tz-timeline")].map(
                (list) => ({
                  trailing: getComputedStyle(list.lastElementChild, "::after")
                    .content,
                  order: [...list.querySelectorAll(".tz-timeline-title")].map(
                    (title) => title.textContent,
                  ),
                }),
              ),
              font: getComputedStyle(list).fontFamily,
            };
          });
          assert.ok(
            measured.documentWidth <= width + 1,
            JSON.stringify(measured),
          );
          assert.match(measured.font, /IBM Plex Sans Arabic/);
          const vertical = width < 640 || orientation === "vertical";
          const first = measured.indicators[0];
          for (const [index, indicator] of measured.indicators.entries()) {
            assert.ok(
              Math.abs(
                (vertical ? indicator.x : indicator.y) -
                  (vertical ? first.x : first.y),
              ) < 1,
              JSON.stringify(measured),
            );
            if (index && !vertical)
              assert.ok(
                lang === "ar"
                  ? indicator.x < measured.indicators[index - 1].x
                  : indicator.x > measured.indicators[index - 1].x,
              );
            if (index && vertical)
              assert.ok(indicator.y > measured.indicators[index - 1].y);
            const copy = measured.labels[index];
            assert.ok(
              copy.x >= measured.list.x - 1 &&
                copy.x + copy.w <= measured.list.x + measured.list.w + 1,
              JSON.stringify(measured),
            );
          }
          assert.equal(measured.rails.at(-1).content, "none");
          assert.ok(
            measured.timeline.every((item) => item.trailing === "none"),
          );
          assert.deepEqual(measured.timeline.at(-1).order, [
            "Later supplied first",
            "Earlier supplied second",
          ]);
          assert.equal(
            await page
              .locator('.tz-timeline time[datetime="2026-10-15"]')
              .count(),
            1,
          );
          geometry.push({ lang, theme, width, orientation, ...measured });
          if (
            (width === 1440 && orientation === "horizontal") ||
            (width === 360 && orientation === "vertical")
          )
            await page.screenshot({
              path: `${evidence}/${lang}-${theme}-${width}-${orientation}.png`,
              fullPage: true,
            });
          pass(
            `${lang}/${theme}/${width}/${orientation}: order, multiline alignment, rails, dates, font and overflow`,
          );
        }
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto(`${fixture}?lang=ar&theme=dark`);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await page.screenshot({
    path: `${evidence}/ar-dark-320.png`,
    fullPage: true,
  });
  pass("320px long-content overflow");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${fixture}?lang=en`);
  const form = page.getByRole("region", { name: "Local form" });
  await form.getByRole("button", { name: "Next", exact: true }).click();
  const name = form.getByRole("textbox", { name: /Name/ });
  assert.equal(
    await name.evaluate((el) => el === document.activeElement),
    true,
  );
  assert.equal(await name.getAttribute("aria-invalid"), "true");
  await name.fill("Sara");
  await form.getByRole("button", { name: "Next", exact: true }).click();
  await form.getByRole("button", { name: "Next", exact: true }).click();
  const email = form.getByRole("textbox", { name: /Email/ });
  assert.equal(
    await email.evaluate((el) => el === document.activeElement),
    true,
  );
  await email.fill("bad");
  await form.getByRole("button", { name: "Next", exact: true }).click();
  assert.equal(
    await email.evaluate((el) => el === document.activeElement),
    true,
  );
  await email.fill("sara@example.com");
  await form.getByRole("button", { name: "Back", exact: true }).click();
  assert.equal(await form.getByRole("textbox").inputValue(), "Sara");
  await form.getByRole("button", { name: "Next", exact: true }).click();
  assert.equal(
    await form.getByRole("textbox").inputValue(),
    "sara@example.com",
  );
  await form.getByRole("button", { name: "Next", exact: true }).click();
  await form.getByRole("button", { name: "Complete local example" }).click();
  assert.match(
    await form.getByRole("status").innerText(),
    /Nothing was saved or sent/,
  );
  assert.equal(await form.locator('[aria-current="step"]').count(), 0);
  pass("Browser form validation/focus, Back values and accurate completion");
  const activation = page.getByRole("list", { name: "Choose a preview step" });
  const review = activation.getByRole("button", { name: /Review/ });
  await activation.getByRole("button", { name: /Information/ }).focus();
  await page.keyboard.press("Tab");
  assert.equal(
    await review.evaluate((el) => el === document.activeElement),
    true,
  );
  assert.equal(
    await review.evaluate((el) => getComputedStyle(el).outlineStyle),
    "solid",
  );
  await page.keyboard.press("Space");
  assert.equal(await review.getAttribute("aria-current"), "step");
  pass(
    "Native Tab/Space activation, current semantics and visible keyboard focus",
  );
  await page.screenshot({
    path: `${evidence}/en-complete-keyboard.png`,
    fullPage: true,
  });
  const activity = page.getByRole("region", { name: "Activity", exact: true });
  const list = activity.getByRole("list");
  const before = await list.getByRole("listitem").allTextContents();
  const clickTime = Date.now();
  await activity.getByRole("button", { name: "Append local event" }).click();
  const after = await list.getByRole("listitem").allTextContents();
  assert.deepEqual(after.slice(0, 2), before);
  assert.equal(after.length, 3);
  const date = await list.locator("time").last().getAttribute("datetime");
  assert.ok(
    Date.parse(date) >= clickTime - 1000 && Date.parse(date) <= Date.now(),
  );
  const empty = page.getByRole("region", { name: "Empty activity" });
  assert.ok(await empty.getByText("No local events yet.").isVisible());
  await empty.getByRole("button", { name: "Append local event" }).click();
  assert.equal(await empty.getByRole("listitem").count(), 1);
  await activity.getByRole("button", { name: "Show local details" }).click();
  assert.ok(
    await activity
      .getByText("These are sample details held only in memory.")
      .isVisible(),
  );
  pass(
    "Local timestamped append preserves order; empty state and application content work",
  );
  await page.getByLabel("Orientation").selectOption("vertical");
  await page.getByLabel("Theme").selectOption("dark");
  await page.getByLabel("Accent").selectOption("blue");
  const indicator = page.locator(
    '[aria-label="Long steps"] [data-current] .tz-step-indicator',
  );
  assert.equal(
    await indicator.evaluate((el) => getComputedStyle(el).outlineColor),
    "rgb(168, 198, 239)",
  );
  assert.equal(
    await page.locator(".tiraz-system").getAttribute("data-theme"),
    "dark",
  );
  await page.getByLabel("Reduced motion").check();
  assert.equal(
    await indicator.evaluate((el) => getComputedStyle(el).transitionDuration),
    "0s",
  );
  await page.getByLabel("Reduced motion").uncheck();
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await indicator.evaluate((el) => getComputedStyle(el).transitionDuration),
    "0s",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  pass("Live orientation/theme/accent and application/OS reduced motion");
  await page.screenshot({
    path: `${evidence}/en-dark-live-customization.png`,
    fullPage: true,
  });
  // Actual continuous documentation and copied clipboard payload.
  await page.goto(base);
  await page.getByRole("button", { name: "الخطوات", exact: true }).click();
  await page.screenshot({
    path: `${evidence}/docs-steps-ar-light.png`,
    fullPage: false,
  });
  await page.getByRole("combobox", { name: "لغة التوثيق" }).selectOption("en");
  await page
    .getByRole("combobox", { name: "Orientation", exact: true })
    .selectOption("vertical");
  await page
    .getByRole("combobox", { name: "Current state", exact: true })
    .selectOption("error");
  await page.getByRole("button", { name: "Copy code", exact: true }).click();
  const code = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(code, /StepsFormExample/);
  assert.match(code, /"orientation":"vertical"/);
  await page
    .getByRole("button", { name: "Copy agent prompt", exact: true })
    .click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(prompt.includes(code) && prompt.includes("ai/README.md"));
  await page.getByRole("button", { name: "Timeline", exact: true }).click();
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await page.waitForFunction(() =>
    [
      ...document.querySelectorAll('.tz-button[data-variant="secondary"]'),
    ].every(
      (button) =>
        getComputedStyle(button).backgroundColor === "rgb(28, 34, 30)",
    ),
  );
  await page.screenshot({
    path: `${evidence}/docs-timeline-en-dark.png`,
    fullPage: false,
  });
  assert.ok(
    await page.getByRole("heading", { name: "Usage example" }).isVisible(),
  );
  pass(
    "Continuous documentation, category navigation, live inspector and full copied prompt/code",
  );
  const axe = require(`${process.cwd()}/node_modules/axe-core`);
  await page.addScriptTag({ content: axe.source });
  const a11y = await page.evaluate(() =>
    axe.run(document.querySelector("main")),
  );
  assert.deepEqual(
    a11y.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })),
    [],
  );
  pass("Documentation axe structure, names and contrast");
  assert.deepEqual(errors, []);
} finally {
  await writeFile(
    `${evidence}/results.json`,
    JSON.stringify({ checks, geometry, errors }, null, 2),
  );
  await browser.close();
}
