import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const root = process.env.TIRAZ_URL || "http://127.0.0.1:5212";
const evidence =
  process.env.TIRAZ_EVIDENCE || "docs/sidebar-foundation/browser";
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.TIRAZ_BROWSER ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  permissions: ["clipboard-read", "clipboard-write"],
});
page.setDefaultTimeout(10000);
const checks = [],
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const check = (name) => {
  checks.push(name);
  console.log(`PASS ${name}`);
};
const focus = (locator) =>
  locator.evaluate((el) => el === document.activeElement);
const overflow = () =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
try {
  await page.goto(`${root}/tests/browser/sidebar.html`);
  await page.addStyleTag({
    content: "body{margin:0} *{box-sizing:border-box}",
  });
  const sidebar = page.getByRole("complementary", {
    name: "Stress navigation",
  });
  const nav = page.getByRole("navigation", { name: "Stress notes" });
  for (const direction of ["rtl", "ltr"])
    for (const theme of ["light", "dark"]) {
      await page
        .getByLabel("Direction", { exact: true })
        .selectOption(direction);
      await page.getByLabel("Theme", { exact: true }).selectOption(theme);
      for (const state of ["expanded", "collapsed"]) {
        const collapse = sidebar.getByRole("button", {
          name: "Collapse navigation",
          exact: true,
        });
        if (state === "collapsed") await collapse.click();
        else if (
          await sidebar
            .getByRole("button", { name: "Expand navigation", exact: true })
            .isVisible()
        )
          await sidebar
            .getByRole("button", { name: "Expand navigation", exact: true })
            .click();
        await page.waitForTimeout(200);
        const size = await sidebar.boundingBox();
        assert.equal(size.width, state === "collapsed" ? 56 : 224);
        assert.equal(await sidebar.getAttribute("dir"), direction);
        assert.ok(await overflow());
        assert.equal(
          await sidebar
            .getByRole("button", { name: "Notes", exact: true })
            .getAttribute("data-active"),
          "true",
        );
        const long = nav.getByRole("link", { name: /A very long/ });
        assert.ok(await long.isVisible());
        if (state === "expanded") {
          const boxes = await long.evaluate((el) => {
            const label = el
              .querySelector(".tz-sidebar-label")
              .getBoundingClientRect();
            const count = el
              .querySelector(".tz-sidebar-count")
              .getBoundingClientRect();
            return {
              label: [label.left, label.right],
              count: [count.left, count.right],
            };
          });
          assert.ok(
            boxes.label[1] <= boxes.count[0] + 1 ||
              boxes.count[1] <= boxes.label[0] + 1,
            JSON.stringify(boxes),
          );
        } else {
          assert.equal(
            await nav
              .getByRole("link", { name: "Current child", exact: true })
              .count(),
            0,
          );
          await long.focus();
          assert.equal(
            await page.getByRole("tooltip").innerText(),
            await long.getAttribute("aria-label"),
          );
          await page.keyboard.press("Escape");
          await page.getByRole("tooltip").waitFor({ state: "hidden" });
          await sidebar
            .getByRole("button", { name: "Notes", exact: true })
            .click();
          assert.ok(
            await nav
              .getByRole("link", { name: "Current child", exact: true })
              .isVisible(),
          );
          await collapse.click();
        }
        await page.screenshot({
          path: `${evidence}/${direction}-${theme}-${state}.png`,
        });
      }
    }
  check(
    "RTL/LTR light/dark expanded/rail, fixed widths, long-label/count separation, Tooltip names, active parent and rail disclosure",
  );
  await sidebar
    .getByRole("button", { name: "Expand navigation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Collapse shortly", exact: true })
    .click();
  await nav.getByRole("link", { name: "Current child", exact: true }).focus();
  await page.waitForTimeout(350);
  assert.ok(
    await focus(sidebar.getByRole("button", { name: "Notes", exact: true })),
  );
  await page.keyboard.press("Escape");
  await sidebar
    .getByRole("button", { name: "Notes", exact: true })
    .press("Enter");
  assert.ok(
    await nav
      .getByRole("link", { name: "Current child", exact: true })
      .isVisible(),
  );
  await sidebar
    .getByRole("button", { name: "Notes", exact: true })
    .press("Space");
  assert.equal(
    await nav.getByRole("link", { name: "Current child", exact: true }).count(),
    0,
  );
  check(
    "external controlled collapse preserves child focus; Enter/Space disclosure; hidden descendants absent",
  );
  await page.waitForTimeout(200);
  const headerBefore = await sidebar
    .locator(".tz-sidebar-header")
    .boundingBox();
  const footerBefore = await sidebar
    .locator(".tz-sidebar-footer")
    .boundingBox();
  const navBounds = await nav.boundingBox();
  await page.mouse.move(
    navBounds.x + navBounds.width / 2,
    navBounds.y + navBounds.height / 2,
  );
  await page.mouse.wheel(0, 2000);
  await page.waitForTimeout(100);
  assert.ok(await nav.evaluate((el) => el.scrollTop > 0));
  assert.equal(
    (await sidebar.locator(".tz-sidebar-header").boundingBox()).y,
    headerBefore.y,
  );
  assert.equal(
    (await sidebar.locator(".tz-sidebar-footer").boundingBox()).y,
    footerBefore.y,
  );
  await sidebar.getByRole("button", { name: "Details", exact: true }).click();
  assert.equal(
    await sidebar
      .getByRole("button", { name: "Details", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  check(
    "short bounded navigation scroll leaves header/footer available; footer action works",
  );
  for (const motion of ["no-preference", "reduce"]) {
    await page.emulateMedia({ reducedMotion: motion });
    if (motion === "no-preference")
      await page
        .getByRole("button", { name: "Reduce motion", exact: true })
        .click();
    const duration = await sidebar.evaluate(
      (el) => getComputedStyle(el).transitionDuration,
    );
    assert.equal(duration, "0s");
    if (motion === "no-preference")
      await page
        .getByRole("button", { name: "Reduce motion", exact: true })
        .click();
  }
  check("both system and OS reduced motion remove Sidebar transitions");
  await page.setViewportSize({ width: 320, height: 420 });
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  assert.ok(await dialog.isVisible());
  const navMobile = dialog.getByRole("navigation");
  await navMobile.getByRole("link", { name: "Reading", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.waitForFunction(
    () => document.activeElement?.textContent === "Reading",
  );
  const trigger = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  await trigger.click();
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    assert.ok(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
    );
  }
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  assert.ok(await focus(trigger));
  await trigger.click();
  await page.waitForTimeout(200);
  await page.mouse.click(300, 210);
  await dialog.waitFor({ state: "hidden" });
  assert.ok(await focus(trigger));
  await trigger.click();
  await page.screenshot({ path: `${evidence}/mobile-sheet-short.png` });
  const mobileNav = dialog.locator(".tz-sidebar-content");
  assert.ok(
    await mobileNav.evaluate((el) => el.scrollHeight >= el.clientHeight),
  );
  assert.ok(await overflow());
  check(
    "mobile Sheet destinations focus after dismissal, Tab trap, Escape/outside restoration, short layout",
  );
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(root);
  await page.getByRole("button", { name: "شريط التنقّل", exact: true }).click();
  await page.screenshot({
    path: `${evidence}/docs-ar-light.png`,
    fullPage: true,
  });
  assert.equal(
    await page.getByRole("heading", { level: 1 }).innerText(),
    "شريط التنقّل",
  );
  await page.getByRole("combobox", { name: "لغة التوثيق" }).selectOption("en");
  await page.getByRole("button", { name: "Toggle theme", exact: true }).click();
  const preview = page.getByRole("region", {
    name: "Interactive playground",
    exact: true,
  });
  await preview
    .getByRole("button", { name: "Collapse navigation", exact: true })
    .click();
  await preview.getByRole("button", { name: "Notes", exact: true }).click();
  await preview.getByRole("link", { name: "Layout", exact: true }).click();
  assert.equal(
    await preview
      .getByRole("link", { name: "Layout", exact: true })
      .getAttribute("aria-current"),
    "page",
  );
  await preview.getByRole("link", { name: "Reading", exact: true }).click();
  const readingUrl = page.url();
  await preview.getByRole("link", { name: "Layout", exact: true }).click();
  await page.goBack();
  await page.waitForFunction(
    () =>
      document
        .querySelector('.playground-region a[aria-current="page"]')
        ?.getAttribute("aria-label") === "Reading",
  );
  assert.equal(page.url(), readingUrl);
  await page.reload();
  const restoredPreview = page.getByRole("region", {
    name: "Interactive playground",
    exact: true,
  });
  assert.equal(
    await restoredPreview
      .getByRole("link", { name: "Reading", exact: true })
      .getAttribute("aria-current"),
    "page",
  );
  assert.ok(
    await restoredPreview
      .getByRole("heading", { level: 4, name: "Reading", exact: true })
      .isVisible(),
  );
  check(
    "sample native hash reload and browser Back keep note destination visible/current",
  );
  await preview
    .getByRole("button", { name: "Example details", exact: true })
    .click();
  assert.ok((await preview.innerText()).includes("no service or saved data"));
  await page
    .getByRole("button", { name: "Copy agent prompt", exact: true })
    .click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(
    prompt.includes("SidebarExamples") && prompt.includes("SidebarDisclosure"),
  );
  await page.getByRole("button", { name: "Copy code", exact: true }).click();
  const code = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(
    code.includes("SidebarExample") && code.includes("onCollapsedChange"),
  );
  await page.screenshot({
    path: `${evidence}/docs-en-dark.png`,
    fullPage: true,
  });
  check(
    "continuous documentation, connected nested/footer examples, actual copied code and prompts",
  );
  assert.deepEqual(errors, []);
  await writeFile(
    `${evidence}/results.json`,
    JSON.stringify({ root, checks, errors }, null, 2),
  );
} finally {
  await browser.close();
}
