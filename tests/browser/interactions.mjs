import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.TIRAZ_BROWSER
    ? { executablePath: process.env.TIRAZ_BROWSER }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 800, height: 400 } });
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5176";
const result = { overlays: [], actions: [], toast: [], failures: [] };
async function check(name, fn) {
  try {
    await fn();
  } catch (e) {
    result.failures.push({ name, error: e.message, stack: e.stack });
  }
}
await page.goto(`${base}/tests/browser/fixture.html`);
await page.getByRole("button", { name: "Open sheet", exact: true }).click();
await page
  .getByRole("button", { name: "Nested menu trigger", exact: true })
  .focus();
await page.keyboard.press("ArrowDown");
await page.waitForTimeout(300);
await check(
  "every global setting updates already open nested overlays",
  async () => {
    const dialog = page.getByRole("dialog");
    for (const [key, values] of Object.entries({
      theme: ["dark", "light"],
      accent: ["blue", "plum", "clay", "sage"],
      typography: ["large", "standard"],
      density: ["standard", "compact"],
      radius: ["16", "0", "8"],
      reducedMotion: ["true", "false"],
      direction: ["ltr", "rtl"],
    }))
      for (const value of values) {
        await dialog
          .getByLabel(`Fixture ${key}`, { exact: true })
          .selectOption(value);
        assert.equal(await page.getByRole("menu").count(), 1);
        assert.equal(await page.getByRole("dialog").count(), 1);
        const styles = await page.getByRole("menu").evaluate((el) => {
          const s = getComputedStyle(el),
            item = el.querySelector("[role=menuitem]");
          return {
            font: s.fontSize,
            direction: s.direction,
            radius: s.borderTopLeftRadius,
            surface: s.backgroundColor,
            action: s.getPropertyValue("--action"),
            motion: s.animationDuration,
            itemHeight: item.getBoundingClientRect().height,
            insideSheet: !!el.closest(".tz-sheet"),
            sheetSide: el.closest(".tz-sheet").dataset.side,
          };
        });
        assert.ok(styles.insideSheet);
        if (key === "theme")
          assert.equal(
            styles.surface,
            value === "dark" ? "rgb(28, 34, 30)" : "rgb(255, 255, 255)",
          );
        if (key === "accent")
          assert.equal(
            styles.action,
            {
              blue: "#365B87",
              plum: "#6B487A",
              clay: "#88543F",
              sage: "#355E4C",
            }[value],
          );
        if (key === "typography")
          assert.equal(styles.font, value === "large" ? "16px" : "14px");
        if (key === "density")
          assert.equal(styles.itemHeight, value === "standard" ? 40 : 36);
        if (key === "radius")
          assert.equal(styles.radius, `${Number(value) + 4}px`);
        if (key === "reducedMotion" && value === "true")
          assert.ok(parseFloat(styles.motion) <= 0.00001);
        if (key === "direction") {
          assert.equal(styles.direction, value);
          assert.equal(styles.sheetSide, value === "rtl" ? "right" : "left");
        }
        result.overlays.push({ key, value, styles });
      }
    await page.screenshot({
      path: "docs/review-evidence/live-nested-overlay.png",
    });
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector(".tz-menu"));
    assert.equal(await page.getByRole("dialog").count(), 1);
    await page.mouse.click(10, 200);
    await page.waitForFunction(() => !document.querySelector(".tz-sheet"));
    assert.ok(
      await page
        .getByRole("button", { name: "Open sheet", exact: true })
        .evaluate((el) => el === document.activeElement),
    );
  },
);
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto(base);
await page.locator(".language-control").selectOption("en");
const rail = page.locator(".customization-rail"),
  button = page.locator(".playground-canvas .tz-button");
await check(
  "live action settings, edits, reset, repeated actions and navigation",
  async () => {
    await button.click();
    await rail.getByLabel("Accent", { exact: true }).selectOption("blue");
    await rail.getByLabel("Typography", { exact: true }).selectOption("large");
    await rail.getByLabel("Density", { exact: true }).selectOption("standard");
    await rail.getByLabel("Corner radius", { exact: true }).focus();
    await page.keyboard.press("End");
    await page
      .getByRole("button", { name: "Toggle theme", exact: true })
      .click();
    const loading = await button.evaluate((el) => ({
      state: el.dataset.state,
      font: getComputedStyle(el).fontSize,
      radius: getComputedStyle(el).borderRadius,
      action: getComputedStyle(el).getPropertyValue("--action"),
    }));
    assert.equal(loading.state, "loading");
    assert.equal(loading.font, "16px");
    assert.equal(loading.action, "#A8C6EF");
    assert.equal(loading.radius, "16px");
    await page.screenshot({
      path: "docs/review-evidence/live-action-loading.png",
    });
    await page.waitForFunction(
      () =>
        document.querySelector(".playground-canvas .tz-button").dataset
          .state === "success",
    );
    await page.screenshot({
      path: "docs/review-evidence/live-action-success.png",
    });
    await page.waitForFunction(
      () =>
        document.querySelector(".playground-canvas .tz-button").dataset
          .state === "idle",
    );
    await page.screenshot({
      path: "docs/review-evidence/live-action-idle.png",
    });
    result.actions.push({ loading, sequence: ["loading", "success", "idle"] });
    await button.click();
    await rail.getByLabel("Label", { exact: true }).fill("New choice");
    assert.equal(await button.getAttribute("data-state"), "idle");
    await page.waitForTimeout(1350);
    assert.equal(await button.getAttribute("data-state"), "idle");
    assert.equal(await button.textContent(), "New choice");
    await button.click();
    await rail
      .getByRole("button", { name: "Reset playground", exact: true })
      .click();
    assert.equal(await button.getAttribute("data-state"), "idle");
    await button.click();
    await page
      .locator(".docs-sidebar nav")
      .getByRole("button", { name: "Tabs", exact: true })
      .click();
    await page.waitForTimeout(1350);
    await page
      .locator(".docs-sidebar nav")
      .getByRole("button", { name: "Button", exact: true })
      .click();
    assert.equal(await button.getAttribute("data-state"), "idle");
    await rail.getByLabel("State", { exact: true }).selectOption("error");
    await button.click();
    await page.waitForFunction(
      () =>
        document.querySelector(".playground-canvas .tz-button").dataset
          .state === "success",
    );
    await page.waitForFunction(
      () =>
        document.querySelector(".playground-canvas .tz-button").dataset
          .state === "error",
    );
    assert.equal(
      await rail.getByLabel("State", { exact: true }).inputValue(),
      "error",
    );
    await rail
      .getByRole("button", { name: "Reset playground", exact: true })
      .click();
    await rail
      .getByRole("button", { name: "Reset system", exact: true })
      .click();
  },
);
await check("simulated error feedback returns to idle", async () => {
  await page.evaluate(() => {
    const props = JSON.parse(localStorage.getItem("tiraz.playgrounds.v2"));
    props.button.outcome = "error";
    localStorage.setItem("tiraz.playgrounds.v2", JSON.stringify(props));
  });
  await page.reload();
  await button.click();
  assert.equal(await button.getAttribute("data-state"), "loading");
  await page.waitForFunction(
    () =>
      document.querySelector(".playground-canvas .tz-button").dataset.state ===
      "error",
  );
  await page.screenshot({ path: "docs/review-evidence/live-action-error.png" });
  await page.waitForFunction(
    () =>
      document.querySelector(".playground-canvas .tz-button").dataset.state ===
      "idle",
  );
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("tiraz.playgrounds.v2")).button.state,
    ),
    "idle",
  );
  result.actions.push({
    sequence: ["loading", "error", "idle"],
    persisted: "idle",
  });
  await rail
    .getByRole("button", { name: "Reset playground", exact: true })
    .click();
});
await check(
  "Sheet example saves changes and discards cancelled drafts",
  async () => {
    await page
      .locator(".docs-sidebar nav")
      .getByRole("button", { name: "Sheet", exact: true })
      .click();
    const trigger = page
      .locator(".examples-canvas")
      .getByRole("button", { name: "Edit customer information", exact: true });
    await trigger.click();
    await page.getByLabel("Company name", { exact: true }).fill("QA Company");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page.waitForFunction(() => !document.querySelector(".tz-sheet"));
    assert.ok(
      (
        await page.locator(".examples-canvas .example-feedback").textContent()
      ).includes("Saved for this session"),
    );
    await trigger.click();
    assert.equal(
      await page.getByLabel("Company name", { exact: true }).inputValue(),
      "QA Company",
    );
    await page
      .getByLabel("Company name", { exact: true })
      .fill("Discard this draft");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.waitForFunction(() => !document.querySelector(".tz-sheet"));
    await trigger.click();
    assert.equal(
      await page.getByLabel("Company name", { exact: true }).inputValue(),
      "QA Company",
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector(".tz-sheet"));
    assert.ok(await trigger.evaluate((el) => el === document.activeElement));
    result.overlays.push({
      example: "Sheet form",
      save: true,
      cancel: true,
      focusRestored: true,
    });
  },
);
await page
  .locator(".docs-sidebar nav")
  .getByRole("button", { name: "Toast", exact: true })
  .click();
await rail.getByLabel("Duration · ms", { exact: true }).fill("1000");
await check(
  "toast focus/hover pause, pointer-only dismissal, repeated expiry and live tokens",
  async () => {
    const trigger = page.locator(".playground-canvas .tz-button");
    await trigger.click();
    let toast = page.locator(".playground-region .tz-toast");
    await toast.hover();
    await page.waitForTimeout(1200);
    assert.equal(await toast.getAttribute("data-state"), "open");
    await toast.locator("button").evaluate((el) => el.click());
    await page.waitForFunction(
      () => !document.querySelector(".playground-region .tz-toast"),
    );
    await trigger.click();
    await page.mouse.move(1, 1);
    await page.locator(".language-control").focus();
    await page.waitForTimeout(1350);
    assert.equal(await toast.count(), 0);
    result.toast.push("pointer-only dismissal then next toast expires");
    await trigger.click();
    await page.keyboard.press("F8");
    await page.keyboard.press("Tab");
    assert.ok(
      await page
        .locator(".playground-region .tz-toast-viewport")
        .evaluate((el) => el.contains(document.activeElement)),
    );
    await page.waitForTimeout(1200);
    assert.equal(await toast.getAttribute("data-state"), "open");
    await page.locator(".language-control").focus();
    await page.mouse.move(1, 1);
    await page.waitForTimeout(1350);
    assert.equal(await toast.count(), 0);
    result.toast.push("focus pauses and leaving resumes expiry");
    await trigger.click();
    await rail.getByLabel("Accent", { exact: true }).selectOption("plum");
    await rail.getByLabel("Typography", { exact: true }).selectOption("large");
    await page
      .getByRole("button", { name: "Toggle theme", exact: true })
      .click();
    const m = await toast.evaluate((el) => ({
      surface: getComputedStyle(el).backgroundColor,
      font: getComputedStyle(el).fontSize,
      tone: el.dataset.tone,
      icon: getComputedStyle(el.querySelector("svg")).color,
    }));
    assert.equal(m.surface, "rgb(28, 34, 30)");
    assert.equal(m.font, "16px");
    assert.equal(m.tone, "success");
    assert.equal(m.icon, "rgb(165, 212, 179)");
    result.toast.push(m);
    await toast.locator("button").click();
    await page.waitForFunction(
      () => !document.querySelector(".playground-region .tz-toast"),
    );
    assert.ok(await trigger.evaluate((el) => el === document.activeElement));
  },
);
await writeFile(
  "docs/review-evidence/interactions.json",
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (result.failures.length) process.exitCode = 1;
