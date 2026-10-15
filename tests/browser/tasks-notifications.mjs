import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const {
  chromium,
} = require("/Users/amjedfadul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5244";
const evidence = "docs/tasks-and-notifications/browser";
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
const fixture = (language, theme) =>
  `${base}/tests/browser/tasks-notifications-fixture.html?lang=${language}&theme=${theme}`;
try {
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(fixture(language, theme));
        await page
          .getByRole("heading", { name: "TaskRows", exact: true })
          .waitFor();
        await page.evaluate(() => document.fonts.ready);
        const geometry = await page.evaluate(() => ({
          width: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          font: getComputedStyle(document.querySelector("main")).fontFamily,
          rows: [
            ...document.querySelectorAll(".tz-task-rows,.tz-notification-list"),
          ].map((el) => ({ width: el.clientWidth, scroll: el.scrollWidth })),
          animations: [
            ...document.querySelectorAll(".tz-task-row,.tz-notification-row"),
          ].map((el) => getComputedStyle(el).animationName),
          times: document.querySelectorAll("time[datetime]").length,
        }));
        assert.equal(geometry.width, width);
        assert.ok(geometry.documentWidth <= width);
        assert.ok(geometry.rows.every((row) => row.scroll <= row.width));
        assert.ok(geometry.animations.every((name) => name === "none"));
        assert.equal(geometry.times, 2);
        matrix.push({ language, theme, ...geometry });
        await page.screenshot({
          path: `${evidence}/${language}-${theme}-${width}.jpg`,
          fullPage: true,
        });
      }
  pass(
    "12 exact CSS viewport language/theme cases: long mixed text, no overflow or row entry motion",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(fixture("en", "light"));
  const tasks = page.getByRole("region", { name: "Task example", exact: true });
  const notices = page.getByRole("region", {
    name: "Notification example",
    exact: true,
  });
  const first = tasks.getByRole("checkbox", { name: /^Review all/ });
  const originalIds = await tasks
    .getByRole("checkbox")
    .evaluateAll((els) => els.map((el) => el.id));
  await first.press("Space");
  assert.equal(await tasks.getByRole("status").innerText(), "2 of 3 completed");
  assert.ok(await first.evaluate((el) => el === document.activeElement));
  assert.deepEqual(
    await tasks
      .getByRole("checkbox")
      .evaluateAll((els) => els.map((el) => el.id)),
    originalIds,
  );
  await first.press("Space");
  assert.equal(await tasks.getByRole("status").innerText(), "1 of 3 completed");
  await first.press("Tab");
  assert.ok(
    await tasks
      .getByRole("button", { name: "Task details" })
      .evaluate((el) => el === document.activeElement),
  );
  await page.keyboard.press("Tab");
  assert.ok(
    await tasks
      .getByRole("checkbox", { name: "Prepare local preview" })
      .evaluate((el) => el === document.activeElement),
  );
  assert.ok(
    await tasks
      .getByRole("checkbox", { name: "Approve copy — locked" })
      .isDisabled(),
  );
  pass(
    "Task completion/reopening, derived count, stable identities/order, focus and disabled Tab skipping",
  );
  await notices
    .getByRole("button", { name: "Show details: Review requested" })
    .click();
  assert.ok((await notices.innerText()).includes("Spacing and naming"));
  assert.ok((await notices.innerText()).includes("2 unread"));
  await notices.getByRole("button", { name: "Unread", exact: true }).click();
  await notices
    .getByRole("button", {
      name: "Mark as read: New package note",
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
    .getByRole("button", { name: "تحديد الكل كمقروء", exact: true })
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
  await page
    .getByRole("combobox", { name: "Density", exact: true })
    .selectOption("standard");
  await page
    .getByRole("combobox", { name: "Typography", exact: true })
    .selectOption("large");
  await page
    .getByRole("combobox", { name: "Accent", exact: true })
    .selectOption("blue");
  await page
    .getByRole("checkbox", { name: "Reduced motion", exact: true })
    .check();
  const custom = await page.evaluate(() => ({
    theme: document.querySelector(".tiraz-system").dataset.theme,
    density: document.querySelector(".tiraz-system").dataset.density,
    typography: document.querySelector(".tiraz-system").dataset.typography,
    motion: document.querySelector(".tiraz-system").dataset.reducedMotion,
    size: getComputedStyle(document.querySelector(".tz-task-static")).fontSize,
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
      [...document.querySelectorAll(".tz-choice-input")].every(
        (el) => parseFloat(getComputedStyle(el).transitionDuration) < 0.01,
      ),
    ),
  );
  pass(
    "Live theme, density, typography, accent; system and OS reduced motion; large Arabic at320 without overflow",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base);
  await page.getByRole("button", { name: "صفوف المهام", exact: true }).click();
  await page.screenshot({ path: `${evidence}/docs-tasks-ar-light.jpg` });
  await page
    .getByRole("button", { name: "قائمة الإشعارات", exact: true })
    .click();
  await page.getByRole("combobox", { name: "لغة التوثيق" }).selectOption("en");
  await page.getByRole("button", { name: "Toggle theme", exact: true }).click();
  await page.screenshot({ path: `${evidence}/docs-notifications-en-dark.jpg` });
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
