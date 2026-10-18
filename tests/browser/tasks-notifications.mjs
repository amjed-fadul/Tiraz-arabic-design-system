import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5244";
const evidence = "docs/taskrows-polish/browser";
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
const errors = [],
  checks = [],
  matrix = [];
page.on("pageerror", (error) => errors.push(error.message));
const pass = (name) => {
  checks.push(name);
  console.log("PASS " + name);
};
const fixture = (language, theme, appearance = "capsules") =>
  `${base}/tests/browser/tasks-notifications-fixture.html?lang=${language}&theme=${theme}&appearance=${appearance}`;
try {
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const width of [1440, 320])
        for (const appearance of ["capsules", "list"]) {
          await page.setViewportSize({ width, height: 1000 });
          await page.goto(fixture(language, theme, appearance));
          await page
            .getByRole("heading", { name: "TaskRows", exact: true })
            .waitFor();
          await page.evaluate(() => document.fonts.ready);
          const geometry = await page.evaluate(() => ({
            width: innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            font: getComputedStyle(document.querySelector("main")).fontFamily,
            rows: [
              ...document.querySelectorAll(
                ".tz-task-rows,.tz-notification-list",
              ),
            ].map((el) => ({ width: el.clientWidth, scroll: el.scrollWidth })),
            animations: [
              ...document.querySelectorAll(
                ".tz-agent-task,.tz-notification-row",
              ),
            ].map((el) => getComputedStyle(el).animationName),
            times: document.querySelectorAll("time[datetime]").length,
          }));
          assert.equal(geometry.width, width);
          assert.ok(geometry.documentWidth <= width);
          assert.ok(geometry.rows.every((row) => row.scroll <= row.width));
          assert.ok(geometry.animations.every((name) => name === "none"));
          assert.equal(geometry.times, 2);
          matrix.push({ language, theme, appearance, ...geometry });
          await page.screenshot({
            path: `${evidence}/${language}-${theme}-${width}-${appearance}.jpg`,
            fullPage: true,
          });
        }
  pass(
    "16 language/theme/width/appearance cases: long mixed text, four states, no overflow or row entry motion",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(fixture("en", "light"));
  const tasks = page.getByRole("region", { name: "Task example", exact: true });
  const notices = page.getByRole("region", {
    name: "Notification example",
    exact: true,
  });
  assert.equal(await tasks.getByRole("checkbox").count(), 0);
  const records = tasks.getByRole("button", {
    name: /Reconcile October invoices/,
  });
  const recordPanelId = await records.getAttribute("aria-controls");
  async function sampleHeight(id) {
    return page.evaluate(async (panelId) => {
      const panel = document.getElementById(panelId);
      const values = [],
        start = performance.now();
      return new Promise((resolve) => {
        function frame(now) {
          values.push(panel.getBoundingClientRect().height);
          if (now - start < 260) requestAnimationFrame(frame);
          else resolve(values);
        }
        requestAnimationFrame(frame);
      });
    }, id);
  }
  await records.click();
  const opening = await sampleHeight(recordPanelId);
  assert.ok(
    Math.max(...opening) - Math.min(...opening) > 5,
    `opening must animate: ${opening}`,
  );
  assert.ok((await tasks.innerText()).includes("Matched contacts and tax IDs"));
  const recordRow = records.locator("..");
  await recordRow.locator("dt").first().hover();
  // Hover is a text tint over the surface; derive the expected colour from
  // the live tokens.
  await page.waitForFunction(() => {
    const task = document.querySelector(
      '[aria-label="Task example"] .tz-agent-task',
    );
    const probe = document.createElement("span");
    probe.style.background =
      "color-mix(in srgb, var(--surface), var(--text) 2%)";
    task.parentElement.append(probe);
    const expected = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return getComputedStyle(task).backgroundColor === expected;
  });
  assert.equal(await records.evaluate((el) => el.matches(":hover")), false);
  await page.screenshot({ path: `${evidence}/sample-data-en-hover.jpg` });
  await recordRow.screenshot({ path: `${evidence}/sample-card-en-hover.jpg` });
  await records.click();
  assert.equal(
    await page.locator(`[id="${recordPanelId}"]`).getAttribute("aria-hidden"),
    "true",
  );
  assert.ok(
    await page.locator(`[id="${recordPanelId}"]`).evaluate((el) => el.inert),
  );
  const closing = await sampleHeight(recordPanelId);
  assert.ok(
    Math.max(...closing) - Math.min(...closing) > 5,
    `closing must animate: ${closing}`,
  );
  assert.ok(closing.at(-1) < 1);
  await records.click();
  await records.click();
  await records.click();
  await sampleHeight(recordPanelId);
  assert.equal(await records.getAttribute("aria-expanded"), "true");
  const recordBadge = records.locator(".tz-badge");
  assert.equal(await recordBadge.getAttribute("data-tone"), "success");
  await writeFile(
    `${evidence}/disclosure-motion.json`,
    JSON.stringify({ opening, closing }, null, 2),
  );
  pass(
    "Sample data rows show results; semantic Badges; opening/closing motion and whole-task body hover",
  );
  // The drafting task autoplays once (running -> failed -> running ->
  // completed) and starts completed under reduced motion.
  await page.goto(fixture("en", "light"));
  const first = tasks.getByRole("button", { name: /Draft follow-up emails/ });
  const ids = await tasks
    .locator(".tz-agent-task-trigger")
    .evaluateAll((els) => els.map((el) => el.getAttribute("aria-controls")));
  const firstPanel = page.locator(
    `[id="${await first.getAttribute("aria-controls")}"]`,
  );
  await first.press("Enter");
  assert.equal(await first.getAttribute("aria-expanded"), "true");
  assert.ok((await first.innerText()).includes("Running"));
  await page.screenshot({ path: `${evidence}/running-en-light.jpg` });
  await first.press("Space");
  assert.equal(await first.getAttribute("aria-expanded"), "false");
  assert.equal(await firstPanel.getAttribute("aria-hidden"), "true");
  assert.ok(await firstPanel.evaluate((el) => el.inert));
  await first.press("Enter");
  await page.waitForFunction(
    (el) => el.innerText.includes("Failed"),
    await first.elementHandle(),
    { polling: "raf" },
  );
  assert.ok(
    (await firstPanel.innerText()).includes(
      "The CRM timed out after 30 seconds",
    ),
  );
  assert.ok(await first.evaluate((el) => el === document.activeElement));
  await page.waitForFunction(
    (el) => el.innerText.includes("Completed"),
    await first.elementHandle(),
    { polling: "raf" },
  );
  assert.ok(await first.evaluate((el) => el === document.activeElement));
  assert.equal(await first.getAttribute("aria-expanded"), "true");
  assert.ok(
    (await firstPanel.innerText()).includes(
      "Al Nada Trading — quote follow-up",
    ),
  );
  assert.deepEqual(
    await tasks
      .locator(".tz-agent-task-trigger")
      .evaluateAll((els) => els.map((el) => el.getAttribute("aria-controls"))),
    ids,
  );
  const reducedPage = await context.newPage();
  reducedPage.on("pageerror", (error) => errors.push(error.message));
  await reducedPage.goto(fixture("en", "light") + "&motion=true");
  assert.ok(
    (
      await reducedPage
        .getByRole("region", { name: "Task example", exact: true })
        .getByRole("button", { name: /Draft follow-up emails/ })
        .innerText()
    ).includes("Completed"),
  );
  await reducedPage.close();
  await first.click();
  assert.ok(await first.evaluate((el) => el === document.activeElement));
  const controlled = page.getByRole("region", {
    name: "Controlled focus",
    exact: true,
  });
  await controlled
    .getByRole("button", { name: "Schedule external collapse" })
    .click();
  await controlled.getByRole("textbox", { name: "Detail draft" }).focus();
  await page.waitForFunction(
    () =>
      document
        .querySelector('[aria-label="Controlled task"] button')
        ?.getAttribute("aria-expanded") === "false",
  );
  assert.ok(
    await controlled
      .getByRole("button", { name: /Editable sample/ })
      .evaluate((el) => el === document.activeElement),
  );
  assert.equal(await controlled.getByRole("textbox").count(), 0);
  await controlled.getByRole("button", { name: /Editable sample/ }).click();
  await controlled
    .getByRole("button", { name: "Schedule external collapse" })
    .click();
  await controlled.getByRole("textbox", { name: "Detail draft" }).focus();
  await controlled
    .getByRole("heading", { name: "Controlled panel focus" })
    .click();
  await page.waitForFunction(
    () =>
      document
        .querySelector('[aria-label="Controlled task"] button')
        ?.getAttribute("aria-expanded") === "false",
  );
  assert.ok(
    await page.evaluate(() => document.activeElement === document.body),
  );
  pass(
    "Native disclosure keyboard, hidden panels, controlled collapse focus, focus kept through autoplayed state changes, identity and reduced-motion final state",
  );
  await notices
    .getByRole("button", { name: "Show details: Review requested" })
    .click();
  assert.ok((await notices.innerText()).includes("check the price table"));
  assert.ok((await notices.innerText()).includes("2 unread"));
  await notices.getByRole("button", { name: "Unread", exact: true }).click();
  await notices
    .getByRole("button", {
      name: "Mark as read: New comment on the contract",
      exact: true,
    })
    .press("Enter");
  assert.ok(
    await notices
      .getByRole("button", {
        name: "Mark as read: Review requested",
        exact: true,
      })
      .evaluate((el) => el === document.activeElement),
  );
  await notices
    .getByRole("button", {
      name: "Mark as read: Review requested",
      exact: true,
    })
    .press("Space");
  assert.ok(
    await notices
      .getByRole("button", { name: "Unread", exact: true })
      .evaluate((el) => el === document.activeElement),
  );
  await notices
    .getByRole("heading", { name: "No unread notifications", exact: true })
    .waitFor();
  await page.screenshot({
    path: `${evidence}/en-unread-empty-focus.jpg`,
    fullPage: true,
  });
  await notices
    .getByRole("button", { name: "Show all", exact: true })
    .press("Enter");
  assert.ok(
    await notices
      .getByRole("button", { name: "All", exact: true })
      .evaluate((el) => el === document.activeElement),
  );
  assert.equal(await notices.locator(".tz-notification-row").count(), 3);
  pass(
    "Details do not mark read; Unread last-row fallback, final removal, empty message and Show all focus",
  );
  await page.goto(fixture("ar", "light"));
  await page
    .getByRole("region", { name: "Task example", exact: true })
    .screenshot({ path: `${evidence}/task-rows-ar-light.jpg` });
  await page
    .getByRole("region", { name: "Notification example", exact: true })
    .screenshot({ path: `${evidence}/notification-list-ar-light.jpg` });
  const arNotices = page.getByRole("region", {
    name: "Notification example",
    exact: true,
  });
  await arNotices
    .getByRole("button", { name: "غير المقروءة", exact: true })
    .click();
  await arNotices
    .getByRole("button", { name: "تعليم الكل كمقروء", exact: true })
    .press("Enter");
  assert.ok(
    await arNotices
      .getByRole("button", { name: "غير المقروءة", exact: true })
      .evaluate((el) => el === document.activeElement),
  );
  assert.ok((await arNotices.innerText()).includes("٠ غير مقروءة"));
  await arNotices.getByRole("button", { name: "الكل", exact: true }).click();
  assert.equal(await arNotices.locator(".tz-notification-row").count(), 3);
  pass(
    "Arabic mark all read, derived zero count, focus fallback and supplied order on All",
  );
  await page
    .getByRole("combobox", { name: "Theme", exact: true })
    .selectOption("dark");
  await page.waitForFunction(
    () => document.querySelector(".tiraz-system").dataset.theme === "dark",
  );
  await page
    .getByRole("combobox", { name: "Density", exact: true })
    .selectOption("standard");
  await page.waitForFunction(
    () =>
      document.querySelector(".tiraz-system").dataset.density === "standard",
  );
  await page
    .getByRole("combobox", { name: "Typography", exact: true })
    .selectOption("large");
  await page.waitForFunction(
    () =>
      document.querySelector(".tiraz-system").dataset.typography === "large",
  );
  await page
    .getByRole("combobox", { name: "Accent", exact: true })
    .selectOption("blue");
  await page
    .getByRole("checkbox", { name: "Reduced motion", exact: true })
    .check();
  assert.ok(
    await page.locator(".tz-agent-task-panel").evaluateAll((els) =>
      els.every((el) =>
        getComputedStyle(el)
          .transitionDuration.split(",")
          .every((value) => parseFloat(value) === 0),
      ),
    ),
  );
  const custom = await page.evaluate(() => ({
    theme: document.querySelector(".tiraz-system").dataset.theme,
    density: document.querySelector(".tiraz-system").dataset.density,
    typography: document.querySelector(".tiraz-system").dataset.typography,
    motion: document.querySelector(".tiraz-system").dataset.reducedMotion,
    size: getComputedStyle(document.querySelector(".tz-agent-task-title"))
      .fontSize,
    accent: getComputedStyle(
      document.querySelector(".tiraz-system"),
    ).getPropertyValue("--action"),
  }));
  assert.deepEqual(custom, {
    theme: "dark",
    density: "standard",
    typography: "large",
    motion: "true",
    size: "16px",
    accent: "#A8C6EF",
  });
  await page.screenshot({
    path: `${evidence}/ar-dark-live-customization.jpg`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 1000 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: `${evidence}/ar-dark-large-320.jpg`,
    fullPage: true,
  });
  await page
    .getByRole("checkbox", { name: "Reduced motion", exact: true })
    .uncheck();
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.ok(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  );
  assert.ok(
    await page.evaluate(() =>
      [...document.querySelectorAll(".tz-agent-task-chevron")].every(
        (el) => parseFloat(getComputedStyle(el).transitionDuration) < 0.01,
      ),
    ),
  );
  assert.ok(
    await page.locator(".tz-agent-task-panel").evaluateAll((els) =>
      els.every((el) =>
        getComputedStyle(el)
          .transitionDuration.split(",")
          .every((value) => parseFloat(value) === 0),
      ),
    ),
  );
  pass(
    "Live theme, density, typography, accent; system and OS reduced motion; large Arabic at320 without overflow",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base);
  await page.getByRole("button", { name: "صفوف المهام", exact: true }).click();
  assert.ok(
    await page
      .getByRole("group", { name: "أنماط الذكاء الاصطناعي", exact: true })
      .isVisible(),
  );
  const arRecords = page
    .getByRole("region", { name: "المعاينة التفاعلية", exact: true })
    .getByRole("button", { name: /مطابقة فواتير أكتوبر/ });
  await arRecords.click();
  assert.equal(await arRecords.getAttribute("aria-expanded"), "true");
  await page.screenshot({ path: `${evidence}/after-ar-light-desktop.jpg` });
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.screenshot({ path: `${evidence}/after-ar-light-320.jpg` });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("combobox", { name: "المظهر", exact: true })
    .selectOption("list");
  await page.screenshot({
    path: `${evidence}/after-ar-light-desktop-list.jpg`,
  });
  await page.getByRole("button", { name: "نسخ الكود", exact: true }).click();
  await page
    .locator('[aria-label="نسخ الكود"][data-copy-state="copied"]')
    .waitFor();
  const taskCode = await page.evaluate(() => navigator.clipboard.readText());
  await page.getByRole("button", { name: "نسخ الطلب", exact: true }).click();
  await page
    .locator('[aria-label="نسخ الطلب"][data-copy-state="copied"]')
    .waitFor();
  const taskPrompt = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(taskCode.length > 5000 && taskPrompt.includes(taskCode));
  assert.ok(taskCode.includes('"appearance":"list"'));
  await writeFile(`${evidence}/copied-task-prompt.txt`, taskPrompt);

  await page
    .getByRole("button", { name: "قائمة الإشعارات", exact: true })
    .click();
  await page.getByRole("combobox", { name: "لغة التوثيق" }).selectOption("en");
  await page.getByRole("button", { name: "Toggle theme", exact: true }).click();
  await page.screenshot({ path: `${evidence}/docs-notifications-en-dark.jpg` });
  // Guard against a vacuous pass: the playground must show the per-row
  // controls before Read controls hides them.
  assert.ok(
    (await page
      .getByRole("region", { name: "Interactive playground", exact: true })
      .getByRole("button", { name: /^Mark as read:/ })
      .count()) > 0,
  );
  await page
    .getByRole("switch", { name: "Read controls", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("region", { name: "Interactive playground", exact: true })
      .getByRole("button", { name: /^Mark as read:/ })
      .count(),
    0,
  );
  await page.getByRole("button", { name: "Copy code", exact: true }).click();
  await page
    .locator('[aria-label="Copy code"][data-copy-state="copied"]')
    .waitFor();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(copied.includes('"readControls":false'));
  await page
    .getByRole("button", { name: "Copy agent prompt", exact: true })
    .click();
  await page
    .locator('[aria-label="Copy agent prompt"][data-copy-state="copied"]')
    .waitFor();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(prompt.includes(copied));
  await writeFile(`${evidence}/copied-notification-prompt.txt`, prompt);
  await page
    .getByRole("switch", { name: "Read controls", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Typography", exact: true })
    .selectOption("large");
  await page
    .getByRole("combobox", { name: "Density", exact: true })
    .selectOption("standard");
  await page.screenshot({
    path: `${evidence}/docs-notifications-en-dark-custom.jpg`,
  });
  await page.setViewportSize({ width: 390, height: 1000 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: `${evidence}/docs-notifications-en-dark-390.jpg`,
  });
  await page
    .getByRole("combobox", { name: "Documentation language" })
    .selectOption("ar");
  await page.setViewportSize({ width: 320, height: 1000 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: `${evidence}/docs-notifications-ar-dark-320.jpg`,
  });
  pass(
    "Continuous docs, minimal live inspector, code/full copied prompt synchronization and narrow docs",
  );
  assert.deepEqual(errors, []);
  pass("No uncaught browser errors");
  await writeFile(`${evidence}/matrix.json`, JSON.stringify(matrix, null, 2));
  await writeFile(
    `${evidence}/results.json`,
    JSON.stringify({ checks, custom, errors }, null, 2),
  );
} finally {
  await browser.close();
}
