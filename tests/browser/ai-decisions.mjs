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
    .getByRole("radio", {
      name: ar ? /فواتير الموردين/ : /Supplier invoices/,
    })
    .check();
  await page
    .getByRole("button", { name: ar ? "إرسال الإجابات" : "Submit answers" })
    .click();
  await page
    .getByRole("button", { name: ar ? "إبقاء الحالة" : "Keep status" })
    .waitFor();
}
try {
  await page.goto(fixture());
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Submit answers" }).click();
  assert.equal(
    await page
      .getByRole("radio", { name: /Supplier invoices/ })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  checks.push("required error and first-invalid focus");
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await page.getByRole("radio", { name: /Customer invoices/ }).isChecked(),
    true,
  );
  checks.push("native keyboard radio choice");
  await page.getByRole("radio", { name: "Other", exact: true }).check();
  await page
    .getByRole("textbox", { name: "Other answer" })
    .fill("Vendor credit notes");
  await page.screenshot({ path: `${out}/question-en-light-desktop.png` });
  await page.getByRole("button", { name: "Submit answers" }).click();
  await page.getByRole("button", { name: "Mark as paid" }).waitFor();
  assert.equal(
    await page
      .locator(".tz-approval-card")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  assert.match(
    await page.locator(".tz-approval-card").innerText(),
    /Vendor credit notes · October 2026/,
  );
  checks.push(
    "connected question-to-approval focus recovery with answered target",
  );
  await page.getByRole("button", { name: "Keep status" }).click();
  await page.getByText("Request 2 of 2", { exact: true }).waitFor();
  assert.match(
    await page.getByRole("list", { name: "Prior decisions" }).innerText(),
    /Request rejected/,
  );
  assert.equal(
    await page.getByRole("button", { name: "Send summary" }).isEnabled(),
    true,
  );
  await page.screenshot({ path: `${out}/second-independent-request.png` });
  await page.getByRole("button", { name: "Send summary" }).click();
  await page.getByText("All decisions made.", { exact: true }).waitFor();
  assert.match(
    await page
      .getByRole("group", { name: "October reconciliation decisions" })
      .getByRole("status")
      .first()
      .textContent(),
    /All decisions made\./,
  );
  await page.screenshot({ path: `${out}/decisions-recorded.png` });
  checks.push(
    "rejection, independent approval and accurate decision-only receipt",
  );
  await page.goto(fixture("?failing-host"));
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Archive drafts" }).click();
  await page
    .getByText("Decision was not accepted. Review and try again.")
    .waitFor();
  await page.screenshot({ path: `${out}/host-failure.png` });
  assert.equal(
    await page
      .getByRole("button", { name: "Archive drafts" })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.getByRole("button", { name: "Archive drafts" }).click();
  await page.getByText("Request 2 of 2", { exact: true }).waitFor();
  assert.match(
    await page.getByRole("list", { name: "Prior decisions" }).innerText(),
    /Approved/,
  );
  checks.push(
    "host failure keeps the decision open, restores focus and accepts a retry",
  );
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
          radius: getComputedStyle(el.closest(".tz-tray")).borderRadius,
          direction: getComputedStyle(el).direction,
          animations: el
            .getAnimations({ subtree: true })
            .filter((a) => a.playState === "running").length,
        }));
        assert.match(css.font, /IBM Plex Sans Arabic/);
        // The card sits plain on the flow's tray. --radius-tray with radius
        // 2: 2 × 1.875px of paper plus min(5px, 2 × 0.625px).
        assert.equal(css.radius, "5px");
        assert.equal(css.direction, ar ? "rtl" : "ltr");
        assert.equal(css.animations, 0);
        // Scan the resting card, not the button left under the pointer.
        await page.mouse.move(0, 0);
        await page.addScriptTag({
          path: require.resolve("axe-core/axe.min.js"),
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
    ["أسئلة قبل البدء", "Clarifying questions"],
    ["طلب موافقة", "Approval request"],
    ["سلسلة موافقات", "Approval sequence"],
  ]) {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(base);
    await page
      .getByLabel(/لغة التوثيق|Documentation language/)
      .selectOption("ar");
    await page
      .getByRole("navigation", { name: "المكوّنات", exact: true })
      .getByRole("button", { name: ar, exact: true })
      .click();
    await page
      .getByLabel(/لغة التوثيق|Documentation language/)
      .selectOption("en");
    await page.getByRole("heading", { name: en, level: 1 }).waitFor();
    // One playground frame with Preview/Code views, then the API reference.
    assert.equal(await page.locator(".tz-demo-frame").count(), 1);
    assert.equal(
      await page
        .getByRole("tablist", { name: "View" })
        .getByRole("tab")
        .count(),
      2,
    );
    assert.equal(await page.locator(".reference-section").count(), 1);
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
