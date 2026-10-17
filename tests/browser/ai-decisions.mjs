import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5237",
  out = "docs/ai-decisions/browser";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const checks = [],
  errors = [];
const context = await browser.newContext({
    viewport: { width: 1000, height: 800 },
    recordVideo: { dir: out, size: { width: 1000, height: 800 } },
  }),
  page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
const fixture = (query = "") =>
  `${base}/tests/browser/ai-decisions-fixture.html${query}`;
async function start(ar = false) {
  await page
    .getByRole("radio", { name: ar ? /النسخة الموجزة/ : /Concise draft/ })
    .check();
  await page
    .getByRole("button", { name: ar ? "إرسال الإجابات" : "Submit answers" })
    .click();
  await page
    .getByRole("button", {
      name: ar ? "الإبقاء على العنوان" : "Keep sample title",
    })
    .waitFor();
}
try {
  await page.goto(fixture());
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Submit answers" }).click();
  assert.equal(
    await page
      .getByRole("radio", { name: /Concise draft/ })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  checks.push("required error and first-invalid focus");
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await page.getByRole("radio", { name: /Full draft/ }).isChecked(),
    true,
  );
  checks.push("native keyboard radio choice");
  await page.getByRole("radio", { name: "Other", exact: true }).check();
  await page
    .getByRole("textbox", { name: "Other answer" })
    .fill("A harmless sample draft");
  await page.screenshot({ path: `${out}/question-en-light-desktop.png` });
  await page.getByRole("button", { name: "Submit answers" }).click();
  await page.getByRole("button", { name: "Approve sample rename" }).waitFor();
  assert.equal(
    await page
      .locator(".tz-approval-card")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  checks.push("connected question-to-approval focus recovery");
  await page.getByRole("button", { name: "Approve sample rename" }).click();
  await page
    .getByText("Decision was not accepted. Review and try again.")
    .waitFor();
  await page.screenshot({ path: `${out}/host-failure.png` });
  assert.equal(
    await page
      .getByRole("button", { name: "Approve sample rename" })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.getByRole("button", { name: "Keep sample title" }).click();
  await page.getByText("Request 2 of 2", { exact: true }).waitFor();
  assert.match(
    await page.getByRole("list", { name: "Prior decisions" }).innerText(),
    /Rejected/,
  );
  assert.equal(
    await page.getByRole("button", { name: "Approve sample note" }).isEnabled(),
    true,
  );
  await page.screenshot({ path: `${out}/second-independent-request.png` });
  await page.getByRole("button", { name: "Approve sample note" }).click();
  await page
    .getByText("All decisions recorded. No actions executed.", { exact: true })
    .waitFor();
  await page.screenshot({ path: `${out}/decisions-recorded.png` });
  checks.push(
    "rejected acknowledgement, retry rejection, independent approval, accurate decision-only receipt",
  );
  await page.getByRole("button", { name: "Reset example" }).click();
  await start();
  await page.getByRole("button", { name: "Approve sample rename" }).click();
  await page.getByRole("button", { name: "Reset example" }).click();
  await page.waitForTimeout(800);
  assert.equal(
    await page.getByRole("radio", { name: /Concise draft/ }).isChecked(),
    false,
  );
  assert.equal(await page.locator(".tz-approval-card").count(), 0);
  checks.push("reset during pending decision discards stale completion");
  for (const width of [1280, 320])
    for (const ar of [false, true])
      for (const theme of ["light", "dark"]) {
        await page.setViewportSize({
          width,
          height: width === 320 ? 480 : 800,
        });
        await page.goto(
          fixture(
            `?lang=${ar ? "ar" : "en"}&theme=${theme}&custom=1&motion=true`,
          ),
        );
        await page.evaluate(() => document.fonts.ready);
        await start(ar);
        await page.getByRole("checkbox").uncheck();
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        for (const button of await page
          .locator(".tz-approval-card button")
          .all()) {
          await button.scrollIntoViewIfNeeded();
          const box = await button.boundingBox();
          assert.ok(box.x >= 0 && box.x + box.width <= width);
        }
        const screenshot = `${out}/approval-${ar ? "ar" : "en"}-${theme}-${width}.png`;
        await page
          .locator(".tz-approval-card")
          .screenshot({ path: screenshot });
        const css = await page.locator(".tz-approval-card").evaluate((el) => ({
          font: getComputedStyle(el).fontFamily,
          radius: getComputedStyle(el).borderRadius,
          direction: getComputedStyle(el).direction,
          animations: el
            .getAnimations({ subtree: true })
            .filter((a) => a.playState === "running").length,
        }));
        assert.match(css.font, /IBM Plex Sans Arabic/);
        assert.equal(css.radius, "2px");
        assert.equal(css.direction, ar ? "rtl" : "ltr");
        assert.equal(css.animations, 0);
        await page.addScriptTag({
          path: require.resolve("axe-core/axe.min.js", {
            paths: [process.cwd()],
          }),
        });
        const axe = await page.evaluate(async () => {
          const r = await axe.run(document.querySelector("main"));
          return r.violations.map((x) => ({ id: x.id, nodes: x.nodes.length }));
        });
        assert.deepEqual(axe, []);
        checks.push(
          `${ar ? "Arabic" : "English"} ${theme} ${width}x${width === 320 ? 480 : 800}: no overflow, actions reachable, typography/accent/radius customization, axe and explicit reduced motion`,
        );
      }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(fixture());
  await start();
  assert.equal(
    await page
      .locator(".tz-approval-card")
      .evaluate(
        (el) =>
          el
            .getAnimations({ subtree: true })
            .filter((a) => a.playState === "running").length,
      ),
    0,
  );
  checks.push("OS reduced motion");
  for (const [ar, en] of [
    ["أسئلة المستخدم", "AskUserQuestions"],
    ["بطاقة القرار", "ApprovalCard"],
    ["تسلسل القرارات", "ApprovalFlow"],
  ]) {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(base);
    await page
      .getByLabel(/لغة التوثيق|Documentation language/)
      .selectOption("ar");
    await page.getByRole("button", { name: ar, exact: true }).click();
    await page
      .getByLabel(/لغة التوثيق|Documentation language/)
      .selectOption("en");
    await page.getByRole("heading", { name: en, level: 1 }).waitFor();
    assert.equal((await page.locator(".tz-demo-frame").count()) >= 2, true);
    await page.screenshot({ path: `${out}/docs-${en}.png` });
    checks.push(`${en} continuous docs in AI patterns`);
  }
  assert.deepEqual(errors, []);
  const video = page.video();
  await context.close();
  await video.saveAs(`${out}/connected-flow.webm`);
  await video.delete();
  await writeFile(
    `${out}/results.json`,
    JSON.stringify(
      { browser: "Google Chrome on macOS (automated)", checks, errors },
      null,
      2,
    ),
  );
  console.log(`${checks.length} browser checks passed`);
} finally {
  await browser.close();
}
