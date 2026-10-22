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
const page = await browser.newPage();
page.setDefaultTimeout(10000);
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5206";
const out =
  process.env.TIRAZ_EVIDENCE || "docs/avatar-overlays-empty-state/browser";
await mkdir(out, { recursive: true });
const report = { checks: [], matrix: [], errors: [] };
page.on("pageerror", (error) => report.errors.push(error.message));
const fixture = base + "/tests/browser/avatar-overlays-fixture.html";
async function settle(locator) {
  await locator.evaluate((el) =>
    Promise.all(el.getAnimations().map((a) => a.finished.catch(() => {}))),
  );
}
async function assertFocused(locator) {
  await page.waitForFunction(
    (el) => el === document.activeElement,
    await locator.elementHandle(),
  );
}
async function fits(locator, width, height) {
  const r = await locator.boundingBox();
  assert(
    r &&
      r.x >= -1 &&
      r.y >= -1 &&
      r.x + r.width <= width + 1 &&
      r.y + r.height <= height + 1,
    JSON.stringify(r),
  );
}
try {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(fixture + "?language=en", { waitUntil: "networkidle" });
  await page.getByRole("img", { name: "Sara Ali" }).first().waitFor();
  assert.match(
    await page.getByRole("img", { name: "Sara Ali" }).first().textContent(),
    /SA/,
  );
  await page.getByRole("button", { name: "Replace image" }).click();
  await page.waitForFunction(
    () =>
      document.querySelector(".tz-avatar img")?.complete &&
      !document.querySelector(".tz-avatar img")?.hidden,
  );
  assert.equal(
    await page.getByRole("img", { name: "Sara Ali" }).first().textContent(),
    "",
  );
  await page.getByRole("button", { name: "Remove image" }).click();
  assert.match(
    await page.getByRole("img", { name: "Sara Ali" }).first().textContent(),
    /SA/,
  );
  report.checks.push(
    "Avatar failed local source, replacement load, removal; one accessible image name and deliberate fallback",
  );
  const details = page.getByRole("button", { name: "Details", exact: true });
  await details.hover();
  assert.equal(await page.getByRole("tooltip").count(), 0);
  await page.getByRole("tooltip").waitFor();
  const tip = page.getByRole("tooltip");
  await tip.hover();
  await page.waitForTimeout(125);
  assert.equal(await tip.count(), 1);
  await page.keyboard.press("Escape");
  // Woven §17.6 Tooltip: it stays mounted through its 100 ms exit.
  await tip.waitFor({ state: "detached" });
  await page.mouse.move(0, 800);
  await details.focus();
  await tip.waitFor();
  assert.equal(
    await details.getAttribute("aria-describedby"),
    "external-help " + (await tip.getAttribute("id")),
  );
  assert.equal(
    await details.evaluate((el) => el === window.tooltipRef()),
    true,
  );
  await page.keyboard.press("Escape");
  assert.equal(await details.getAttribute("aria-describedby"), "external-help");
  assert.equal(
    await details.evaluate((el) => el === document.activeElement),
    true,
  );
  await details.click();
  assert.equal(await page.locator("output").textContent(), "Details shown");
  const edge = page.getByRole("button", { name: "Edge help" });
  await edge.focus();
  // Woven §17.6 Tooltip: the Details tooltip may still be leaving through its
  // 100 ms exit, so target the open one.
  const edgeTip = page.locator("[role=tooltip]:not([data-state=closed])");
  await edgeTip.waitFor();
  await fits(edgeTip, 1280, 900);
  assert.equal(await edgeTip.getAttribute("data-side"), "bottom");
  await page.keyboard.press("Escape");
  report.checks.push(
    "Tooltip true pointer delay, hoverable content, focus/ref/merged descriptions, Escape without focus loss, edge collision flip, trigger action",
  );
  const open = page.getByRole("button", { name: "Open long modal" });
  await open.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  assert.equal(
    await page
      .getByRole("textbox", { name: "Initial input" })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    assert.equal(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
      true,
    );
  }
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Shift+Tab");
    assert.equal(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
      true,
    );
  }
  const select = page.getByRole("combobox", { name: "Nested view" });
  await select.focus();
  await page.keyboard.press("ArrowDown");
  const listbox = page.getByRole("listbox");
  await listbox.waitFor();
  assert.equal(await listbox.evaluate((el) => !!el.closest(".tz-modal")), true);
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("role") === "option",
  );
  await page.keyboard.press("End");
  await page.waitForFunction(
    () => document.activeElement?.textContent === "Cards",
  );
  await page.keyboard.press("Enter");
  assert.match(await select.textContent(), /Cards/);
  await assertFocused(select);
  const menuTrigger = page.getByRole("button", { name: "Nested actions" });
  await menuTrigger.focus();
  await page.keyboard.press("ArrowDown");
  const menu = page.getByRole("menu");
  await menu.waitFor();
  assert.equal(await menu.evaluate((el) => !!el.closest(".tz-modal")), true);
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("role") === "menuitem",
  );
  await page.keyboard.press("End");
  await page.waitForFunction(
    () => document.activeElement?.textContent === "Last",
  );
  assert.equal(
    await page
      .getByRole("menuitem", { name: "Last" })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.keyboard.press("Escape");
  await menu.waitFor({ state: "detached" });
  await assertFocused(menuTrigger);
  await menuTrigger.click();
  await menu.waitFor();
  await page.getByRole("menuitem", { name: "First" }).hover();
  await page.getByRole("menuitem", { name: "First" }).click();
  await menu.waitFor({ state: "detached" });
  assert.equal(await page.locator("output").textContent(), "First chosen");
  await page.getByText("Nested explanation", { exact: true }).focus();
  await tip.waitFor();
  assert.equal(await tip.evaluate((el) => !!el.closest(".tz-modal")), true);
  await page.keyboard.press("Escape");
  // Woven §17.6 Tooltip: it stays mounted through its 100 ms exit.
  await tip.waitFor({ state: "detached" });
  assert.equal(await dialog.count(), 1);
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  await assertFocused(open);
  await open.click();
  await dialog.waitFor();
  await settle(dialog);
  await page.mouse.click(5, 5);
  await dialog.waitFor({ state: "detached" });
  await assertFocused(open);
  report.checks.push(
    "Modal initial focus, forward/backward Tab containment, Escape/outside restoration; nested Select keyboard selection, menu pointer/keyboard, focus restoration, tooltip Escape closes one layer",
  );
  await page.getByRole("button", { name: "View options", exact: true }).click();
  await dialog.waitFor();
  const layout = page.getByRole("combobox", { name: "Layout", exact: true });
  await assertFocused(layout);
  await layout.click();
  await page.getByRole("option", { name: "Cards", exact: true }).click();
  await page.getByRole("button", { name: "More options" }).click();
  await page.getByRole("menuitem", { name: "Restore default" }).click();
  assert.match(await layout.textContent(), /List/);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await dialog.waitFor({ state: "detached" });
  await page
    .getByRole("button", { name: "View getting started guide" })
    .click();
  assert.equal(
    await page
      .getByRole("heading", { name: "Getting started guide", exact: true })
      .count(),
    1,
  );
  await page.getByRole("button", { name: "Back", exact: true }).click();
  assert.equal(
    await page
      .getByRole("button", { name: "View getting started guide" })
      .count(),
    1,
  );
  report.checks.push(
    "Portable focused Modal Select/menu reset/Done and EmptyState guide/Back produce stated results",
  );
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const density of ["compact", "standard"])
        for (const typography of ["standard", "large"])
          for (const viewport of [
            { width: 1280, height: 900 },
            { width: 320, height: 568 },
            { width: 640, height: 280 },
          ]) {
            report.activeCase = {
              language,
              theme,
              density,
              typography,
              ...viewport,
            };
            report.activeCase = {
              language,
              theme,
              density,
              typography,
              ...viewport,
            };
            await page.setViewportSize(viewport);
            await page.goto(
              `${fixture}?language=${language}&theme=${theme}&density=${density}&typography=${typography}`,
              { waitUntil: "networkidle" },
            );
            assert.equal(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
              true,
            );
            const group = page.getByRole("group", { name: "Narrow team" });
            const groupRect = await group.boundingBox();
            const children = await group.locator(":scope > *").all();
            for (const child of children) {
              const r = await child.boundingBox();
              assert(
                r.x >= groupRect.x - 1 &&
                  r.x + r.width <= groupRect.x + groupRect.width + 1,
                "Group child clipping",
              );
            }
            const names = await page
              .getByRole("group", {
                name: language === "ar" ? "فريق المشروع" : "Project team",
              })
              .getByRole("img")
              .all();
            const first = await names[0].boundingBox(),
              second = await names[1].boundingBox();
            assert(language === "ar" ? first.x > second.x : first.x < second.x);
            await page.getByRole("button", { name: "Edge help" }).focus();
            await page.getByRole("tooltip").waitFor();
            await fits(
              page.getByRole("tooltip"),
              viewport.width,
              viewport.height,
            );
            await page.keyboard.press("Escape");
            await page.getByRole("button", { name: "Open long modal" }).click();
            await dialog.waitFor();
            await settle(dialog);
            await fits(dialog, viewport.width, viewport.height);
            const body = dialog.locator(".tz-modal-scroll");
            assert.equal(
              await body.evaluate((el) => el.scrollHeight > el.clientHeight),
              true,
            );
            assert.equal(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
              true,
            );
            await page.getByRole("combobox", { name: "Nested view" }).focus();
            await page.keyboard.press("ArrowDown");
            await page.getByRole("listbox").waitFor();
            await page.waitForFunction(
              () => document.activeElement?.getAttribute("role") === "option",
            );
            await fits(
              page.getByRole("listbox"),
              viewport.width,
              viewport.height,
            );
            await page.keyboard.press("Escape");
            await page.getByRole("listbox").waitFor({ state: "detached" });
            await assertFocused(
              page.getByRole("combobox", { name: "Nested view" }),
            );
            await page.getByRole("button", { name: "Nested actions" }).focus();
            await page.keyboard.press("ArrowDown");
            await menu.waitFor();
            await page.waitForFunction(
              () => document.activeElement?.getAttribute("role") === "menuitem",
            );
            await fits(menu, viewport.width, viewport.height);
            await page.keyboard.press("Escape");
            await menu.waitFor({ state: "detached" });
            await assertFocused(
              page.getByRole("button", { name: "Nested actions" }),
            );
            await page.keyboard.press("Escape");
            await dialog.waitFor({ state: "detached" });
            report.matrix.push({
              language,
              theme,
              density,
              typography,
              ...viewport,
              pass: true,
            });
            if (
              language === "ar" &&
              theme === "dark" &&
              density === "compact" &&
              typography === "large" &&
              viewport.width === 320
            )
              await page.screenshot({
                path: out + "/narrow-arabic-dark-large.png",
                fullPage: true,
              });
          }
  report.checks.push(
    "48 combinations: both languages/themes/densities/text scales x desktop/narrow/short; no page overflow/group clipping, RTL visual order, tooltip/menu/Select collisions, Modal bounds and internal scrolling",
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(fixture + "?language=en");
  await open.click();
  await dialog.waitFor();
  await page.evaluate(() =>
    window.updateTiraz({
      theme: "dark",
      direction: "rtl",
      density: "standard",
      typography: "large",
      accent: "plum",
      radius: 16,
      reducedMotion: true,
    }),
  );
  const tokens = await dialog.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      theme: el.closest(".tiraz-system").dataset.theme,
      direction: s.direction,
      body: s.getPropertyValue("--text-body").trim(),
      radius: s.getPropertyValue("--radius").trim(),
      action: s.getPropertyValue("--action").trim(),
      motion: s.getPropertyValue("--motion-enter").trim(),
    };
  });
  assert.deepEqual(tokens, {
    theme: "dark",
    direction: "rtl",
    body: "16px",
    radius: "16px",
    action: "#D6B6E5",
    motion: "0ms",
  });
  await page.screenshot({ path: out + "/live-modal-customization.png" });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  await page.evaluate(() => window.updateTiraz({ reducedMotion: false }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open.click();
  await dialog.waitFor();
  assert.equal(
    await dialog.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--motion-enter").trim(),
    ),
    "0ms",
  );
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  assert.equal(
    await page.evaluate(() =>
      document.fonts.check('14px "IBM Plex Sans Arabic"'),
    ),
    true,
  );
  report.checks.push({
    check:
      "Live theme/direction/density/text/accent/corners/application reduction in open Modal; OS reduction overrides false; local IBM Plex Arabic loaded",
    tokens,
  });
  // Inspect actual documentation pages and capture the approved continuous layout.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const [active, language, theme, file] of [
    ["empty-state", "ar", "light", "docs-empty-arabic-light.png"],
    ["avatar-group", "en", "dark", "docs-group-english-dark.png"],
    ["modal", "ar", "dark", "docs-modal-arabic-dark.png"],
    ["tooltip", "en", "light", "docs-tooltip-english-light.png"],
  ]) {
    await page.goto(base);
    await page.evaluate(
      ({ active, language, theme }) => {
        localStorage.clear();
        localStorage.setItem(
          "tiraz.documentation.v2",
          JSON.stringify({
            active,
            language,
            systemPanelOpen: true,
            inspectorOpen: true,
          }),
        );
        localStorage.setItem("tiraz.theme.v1", JSON.stringify(theme));
      },
      { active, language, theme },
    );
    await page.reload({ waitUntil: "networkidle" });
    if (active === "modal") {
      await page
        .locator(".playground-canvas")
        .getByRole("button", { name: "عرض الخيارات" })
        .click();
      await dialog.waitFor();
      await settle(dialog);
    }
    if (active === "tooltip") {
      await page
        .locator(".playground-canvas")
        .getByRole("button", { name: "Show details" })
        .focus();
      await tip.waitFor();
    }
    await page.screenshot({ path: out + "/" + file });
  }
  assert.deepEqual(report.errors, []);
} finally {
  await writeFile(out + "/results.json", JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(
  JSON.stringify({
    combinations: report.matrix.length,
    checks: report.checks.length,
    errors: report.errors,
  }),
);
