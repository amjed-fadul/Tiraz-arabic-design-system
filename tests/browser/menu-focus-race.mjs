import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const evidenceDir = process.env.TIRAZ_EVIDENCE || "docs/menu-focus-race";
await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.TIRAZ_BROWSER
    ? { executablePath: process.env.TIRAZ_BROWSER }
    : {}),
});
const results = [];
const page = await browser.newPage({ viewport: { width: 800, height: 400 } });
const matrix = process.env.TIRAZ_MATRIX === "true";
const cases = matrix
  ? ["rtl", "ltr"].flatMap((direction) =>
      ["light", "dark"].flatMap((theme) =>
        [false, true].flatMap((reducedMotion) =>
          [false, true].map((settled) => ({
            direction,
            theme,
            reducedMotion,
            settled,
          })),
        ),
      ),
    )
  : [
      {
        direction: "rtl",
        theme: "light",
        reducedMotion: false,
        settled: false,
      },
    ];
const repeats = Number(process.env.TIRAZ_REPEATS || (matrix ? 1 : 3));

for (const scenario of cases) {
  for (let run = 0; run < repeats; run++) {
    const name = `${scenario.direction}-${scenario.theme}-${scenario.reducedMotion ? "reduced" : "motion"}-${scenario.settled ? "settled" : "early"}-${run}`;
    const result = { name, scenario, failures: [] };
    try {
      await page.goto(
        `${process.env.TIRAZ_URL || "http://127.0.0.1:5176"}/tests/browser/fixture.html`,
      );
      await page.evaluate(() => {
        window.menuTrace = [];
        window.focusSamples = [];
        const record = (entry) =>
          window.menuTrace.push({ time: performance.now(), ...entry });
        // Event-only tracing avoids forcing layout on every animation frame.
        for (const type of [
          "pointermove",
          "pointerover",
          "pointerout",
          "pointerleave",
          "pointerdown",
          "focusin",
          "focusout",
          "scroll",
          "keydown",
          "animationstart",
          "animationend",
        ]) {
          document.addEventListener(
            type,
            (event) => {
              const role = event.target.getAttribute?.("role");
              if (type === "keydown" && event.key === "End") {
                // Sample at the actual key event, not a later protocol roundtrip.
                // A busy machine can finish the animation between those moments.
                window.endAnimations =
                  document
                    .querySelector(".tz-menu")
                    ?.getAnimations()
                    .map((a) => ({
                      name: a.animationName,
                      time: a.currentTime,
                      duration: a.effect.getTiming().duration,
                      playState: a.playState,
                    })) ?? [];
              }
              if (type === "pointerdown" || type === "pointermove")
                window.pointerPosition = { x: event.clientX, y: event.clientY };
              if (type === "focusin") {
                if (event.target.textContent === "Item 40")
                  window.sawLastItem = true;
                if (window.sawLastItem)
                  window.focusSamples.push({
                    time: performance.now(),
                    focused:
                      role === "menuitem" ? event.target.textContent : role,
                  });
              }
              if (
                role !== "menuitem" &&
                role !== "menu" &&
                type !== "keydown" &&
                type !== "pointerdown"
              )
                return;
              record({
                type,
                target: role || event.target.className,
                text:
                  role === "menuitem" ? event.target.textContent : undefined,
                x: event.clientX,
                y: event.clientY,
                movementX: event.movementX,
                movementY: event.movementY,
                key: event.key,
              });
            },
            true,
          );
        }
      });
      await page
        .getByRole("button", { name: "Open sheet", exact: true })
        .click();
      const dialog = page.getByRole("dialog");
      await dialog
        .getByLabel("Fixture direction", { exact: true })
        .selectOption(scenario.direction);
      await dialog
        .getByLabel("Fixture theme", { exact: true })
        .selectOption(scenario.theme);
      if (scenario.reducedMotion)
        await dialog
          .getByLabel("Fixture reducedMotion", { exact: true })
          .selectOption("true");
      // Open the menu from a settled Sheet: its slide-in moves the trigger, and
      // the scenario is the menu's own opening motion.
      await dialog.evaluate((el) =>
        Promise.all(
          el
            .getAnimations({ subtree: true })
            .filter(
              (a) => a.effect?.getComputedTiming().iterations !== Infinity,
            )
            .map((a) => a.finished.catch(() => {})),
        ),
      );
      const trigger = page.getByRole("button", {
        name: "Nested menu trigger",
        exact: true,
      });
      // Mirror the stationary-pointer condition on the opposite side in LTR.
      if (scenario.direction === "ltr") await page.mouse.move(90, 200);
      await trigger.focus();
      await page.keyboard.press("ArrowDown");
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("role") === "menuitem",
      );
      if (scenario.settled) await page.waitForTimeout(300);
      // The regression intentionally does NOT wait for opening motion before End.
      await page.keyboard.press("End");
      await page.waitForTimeout(350);
      result.beforeEnter = await page.evaluate(() => {
        const menu = document.querySelector(".tz-menu"),
          item = document.activeElement;
        const a = item.getBoundingClientRect(),
          b = menu.getBoundingClientRect();
        return {
          focused: item.textContent,
          visible: a.top >= b.top - 1 && a.bottom <= b.bottom + 1,
          scrollTop: menu.scrollTop,
          pointer: window.pointerPosition,
          pointerInMenu:
            window.pointerPosition.x >= b.left &&
            window.pointerPosition.x <= b.right &&
            window.pointerPosition.y >= b.top &&
            window.pointerPosition.y <= b.bottom,
          endAnimations: window.endAnimations,
          samples: window.focusSamples,
        };
      });
      await page.screenshot({ path: join(evidenceDir, `${name}.png`) });
      await page.keyboard.press("Enter");
      result.selected = await page.locator("output").textContent();
      await page.waitForFunction(
        () => document.activeElement?.textContent === "Nested menu trigger",
      );
      result.restored = true;
      const check = (fn) => {
        try {
          fn();
        } catch (error) {
          result.failures.push(error.message);
        }
      };
      if (!scenario.settled && !scenario.reducedMotion)
        check(() =>
          assert.ok(
            result.beforeEnter.endAnimations.some(
              (a) =>
                a.name === "tz-menu-in" &&
                a.playState === "running" &&
                a.time < a.duration,
            ),
            "End must occur during opening animation",
          ),
        );
      check(() =>
        assert.ok(
          result.beforeEnter.pointerInMenu,
          "stationary pointer must be in future menu",
        ),
      );
      check(() =>
        assert.equal(
          result.beforeEnter.focused,
          "Item 40",
          "Item 40 must retain focus",
        ),
      );
      check(() =>
        assert.ok(result.beforeEnter.visible, "Item 40 must be visible"),
      );
      check(() =>
        assert.ok(
          result.beforeEnter.samples.length > 0 &&
            result.beforeEnter.samples.every((s) => s.focused === "Item 40"),
          "Item 40 must stay focused throughout animation after receiving focus",
        ),
      );
      check(() =>
        assert.equal(
          result.selected,
          "Selected 40",
          "Enter must select Item 40",
        ),
      );
      result.trace = await page.evaluate(() => window.menuTrace);
      // Reopen and verify a real movement transfers keyboard focus to hover.
      await trigger.focus();
      await page.keyboard.press("ArrowDown");
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("role") === "menuitem",
      );
      if (scenario.settled) await page.waitForTimeout(300);
      await page.keyboard.press("End");
      await page.waitForFunction(
        () => document.activeElement?.textContent === "Item 40",
      );
      const hovered = page.getByRole("menuitem", {
        name: "Item 38",
        exact: true,
      });
      const rect = await hovered.boundingBox();
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
      await page.waitForFunction(
        () => document.activeElement?.textContent === "Item 38",
      );
      await page.waitForTimeout(300);
      assert.equal(
        await page.evaluate(() => document.activeElement.textContent),
        "Item 38",
        "genuine hover must retain focus",
      );
      await page.mouse.move(
        rect.x + rect.width / 2 + 2,
        rect.y + rect.height / 2,
      );
      assert.equal(
        await page.evaluate(() => document.activeElement.textContent),
        "Item 38",
        "small movement must work after keyboard navigation",
      );
      await page.mouse.move(1, 1);
      assert.equal(
        await page.evaluate(() => document.activeElement.getAttribute("role")),
        "menu",
        "leaving hovered item must retain Radix leave behavior",
      );
      const item39 = page.getByRole("menuitem", {
        name: "Item 39",
        exact: true,
      });
      await item39.hover();
      assert.equal(
        await page.evaluate(() => document.activeElement.textContent),
        "Item 39",
      );
      await page.keyboard.press("Home");
      await page.waitForFunction(
        () => document.activeElement?.textContent === "Item 1",
      );
      await page.keyboard.press("ArrowDown");
      await page.waitForFunction(
        () => document.activeElement?.textContent === "Item 2",
      );
      await page.keyboard.press("Escape");
      await page.waitForFunction(
        () => document.activeElement?.textContent === "Nested menu trigger",
      );
      result.pointerAndKeyboard = "pass";
      await dialog
        .getByRole("button", { name: "Close sheet", exact: true })
        .click();
      await page.waitForFunction(
        () => document.activeElement?.textContent === "Open sheet",
      );
      result.sheetRestored = true;
    } catch (error) {
      result.failures.push(error.message);
    }
    results.push(result);
    console.log(
      `${name}: ${result.failures.length ? "FAIL " + result.failures.join("; ") : "PASS"}`,
    );
  }
}
await browser.close();
await writeFile(
  join(evidenceDir, "results.json"),
  JSON.stringify(results, null, 2),
);
assert.equal(
  results.filter((r) => r.failures.length).length,
  0,
  "nested-menu focus regression failures (see results.json)",
);
