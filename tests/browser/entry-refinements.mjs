import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const root = process.env.TIRAZ_URL || "http://127.0.0.1:5213";
const phase = process.env.TIRAZ_PHASE || "after";
const evidence =
  process.env.TIRAZ_EVIDENCE || `docs/tags-filters-copy/refinements/${phase}`;
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
});
await context.addInitScript(() => {
  const p = JSON.parse(new URLSearchParams(location.search).get("entry-check"));
  localStorage.clear();
  localStorage.setItem(
    "tiraz.documentation.v2",
    JSON.stringify({ active: p.component, language: p.language }),
  );
  localStorage.setItem("tiraz.theme.v1", JSON.stringify(p.theme));
  localStorage.setItem(
    "tiraz.playgrounds.v2",
    JSON.stringify(p.props ? { [p.component]: p.props } : {}),
  );
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [],
  warnings = [],
  checks = [],
  measurements = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
  if (message.type() === "warning") warnings.push(message.text());
});
const preview = () => page.locator(".playground-region");
// The stage frame has its own copy button and status; scope to InputCopy.
const copyField = () =>
  preview()
    .locator(".tz-field")
    .filter({ has: page.locator(".tz-input-copy") });
const pass = (name) => {
  checks.push(name);
  console.log("PASS " + name);
};
async function start(
  component,
  language = "en",
  theme = "light",
  width = 1440,
  props,
) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(
    `${root}/?entry-check=${encodeURIComponent(JSON.stringify({ component, language, theme, props }))}`,
  );
  await preview().waitFor();
  await page.evaluate(() => document.fonts.ready);
}
async function settled() {
  await preview().evaluate(async (el) =>
    Promise.all(
      el
        .getAnimations({ subtree: true })
        .map((a) => a.finished.catch(() => {})),
    ),
  );
}
async function geometry() {
  return page.evaluate(() => {
    const el = document.querySelector(".playground-region .tz-input-copy"),
      input = el.querySelector("input"),
      button = el.querySelector("button");
    const box = (node) => {
      const b = node.getBoundingClientRect();
      return {
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        right: b.right,
        bottom: b.bottom,
      };
    };
    const style = getComputedStyle(input),
      bs = getComputedStyle(button);
    return {
      root: box(el),
      input: box(input),
      button: box(button),
      paddingEnd: parseFloat(style.paddingInlineEnd),
      buttonOutline: bs.outlineWidth,
      buttonOutlineStyle: bs.outlineStyle,
      buttonOffset: bs.outlineOffset,
      buttonPosition: bs.position,
      body: document.documentElement.scrollWidth,
      viewport: innerWidth,
    };
  });
}
try {
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const width of [1440, 390]) {
        const t = (ar, en) => (language === "ar" ? ar : en);
        await start("tag-input", language, theme, width);
        const input = preview().getByRole("textbox"),
          buttons = preview().locator(".tz-remove-button");
        await buttons.first().focus();
        await page.keyboard.press("Tab");
        for (let i = 1; i < 2; i++) {
          assert.equal(
            await buttons
              .nth(i)
              .evaluate((el) => el === document.activeElement),
            true,
          );
          const styles = await buttons.nth(i).evaluate((el) => ({
            outline: getComputedStyle(el).outlineWidth,
            style: getComputedStyle(el).outlineStyle,
          }));
          assert.equal(styles.outline, "2px");
          assert.equal(styles.style, "solid");
        }
        await page.keyboard.press("Tab");
        assert.equal(
          await input.evaluate((el) => el === document.activeElement),
          true,
        );
        // Measure the settled focus halo, not its transition's first frame.
        await settled();
        const styles = await input.evaluate((el) => {
          const parent = el.closest(".tz-tag-input"),
            style = getComputedStyle(el),
            outer = getComputedStyle(parent),
            rules = [];
          function visit(list, source) {
            for (const rule of list) {
              if (rule.cssRules) visit(rule.cssRules, source);
              if (
                rule.selectorText &&
                rule.style &&
                (rule.style.outline || rule.style.boxShadow)
              ) {
                try {
                  if (el.matches(rule.selectorText))
                    rules.push({
                      selector: rule.selectorText,
                      outline: rule.style.outline,
                      boxShadow: rule.style.boxShadow,
                      source,
                    });
                } catch {}
              }
            }
          }
          for (const sheet of document.styleSheets) {
            try {
              visit(
                sheet.cssRules,
                sheet.ownerNode?.dataset?.viteDevId || sheet.href,
              );
            } catch {}
          }
          return {
            inner: {
              outline: style.outlineWidth,
              outlineStyle: style.outlineStyle,
              shadow: style.boxShadow,
            },
            outer: {
              outline: outer.outlineWidth,
              outlineStyle: outer.outlineStyle,
              offset: outer.outlineOffset,
              shadow: outer.boxShadow,
              border: outer.borderColor,
              overflow: outer.overflow,
            },
            rules,
          };
        });
        measurements.push({
          component: "tag-input",
          language,
          theme,
          width,
          styles,
        });
        await preview().scrollIntoViewIfNeeded();
        await page.screenshot({
          path: `${evidence}/tag-${language}-${theme}-${width}.png`,
        });
        if (phase === "before") continue;
        assert.equal(
          styles.inner.outline,
          "0px",
          "draft must defer to the outer ring",
        );
        assert.equal(styles.inner.shadow, "none");
        // The composite shows the shared field focus: accent edge plus halo.
        assert.equal(styles.outer.outlineStyle, "none");
        assert.match(styles.outer.shadow, /0px 0px 0px 3px/);
        assert.equal(styles.outer.overflow, "visible");
        // Every remove action keeps its own native keyboard indicator.
        await page.keyboard.press("Shift+Tab");
        await page.keyboard.press("Shift+Tab");
        assert.equal(
          await buttons.first().evaluate((el) => el === document.activeElement),
          true,
        );
        assert.equal(
          await buttons
            .first()
            .evaluate((el) => getComputedStyle(el).outlineWidth),
          "2px",
        );
        assert.equal(
          await preview()
            .locator(".tz-tag-input")
            .evaluate((el) => getComputedStyle(el).outlineStyle),
          "none",
        );
        await page.keyboard.press("Tab");
        await page.keyboard.press("Tab");
        const before = await preview().locator(".tz-tag-input").boundingBox();
        await input.blur();
        const unfocused = await preview()
          .locator(".tz-tag-input")
          .boundingBox();
        assert.deepEqual(unfocused, before);
        await input.click();
        await input.fill("طويل " + "UnbrokenLongTag".repeat(10));
        await input.press("Enter");
        assert.equal(
          await input.evaluate((el) => el === document.activeElement),
          true,
        );
        const remove = buttons.last();
        await remove.click();
        assert.equal(
          await input.evaluate((el) => el === document.activeElement),
          true,
        );
        await input.fill("Wrapped " + "LongTag".repeat(25));
        await input.press("Enter");
        if (width < 1100) {
          // Structural, so it does not depend on the label.
          await page.locator(".mobile-settings .doc-button").click();
          await page
            .getByRole("dialog")
            .getByLabel(t("الخطأ", "Error"), { exact: true })
            .fill(t("خطأ من التطبيق", "Application error"));
          await page.keyboard.press("Escape");
          await page.getByRole("dialog").waitFor({ state: "hidden" });
        } else {
          await page
            .getByLabel(t("الخطأ", "Error"), { exact: true })
            .fill(t("خطأ من التطبيق", "Application error"));
        }
        await input.click();
        await settled();
        const invalid = await preview()
          .locator(".tz-tag-input")
          .evaluate((el) => ({
            border: getComputedStyle(el).borderColor,
            outlineStyle: getComputedStyle(el).outlineStyle,
            shadow: getComputedStyle(el).boxShadow,
            danger: getComputedStyle(el).getPropertyValue("--danger"),
          }));
        // Invalid focus keeps the danger edge and adds the 3px focus halo.
        assert.equal(invalid.outlineStyle, "none");
        const halo = invalid.shadow.match(/^(.*?) 0px 0px 0px 3px/)?.[1];
        assert.ok(halo && halo !== invalid.border, JSON.stringify(invalid));
        assert.equal(await input.getAttribute("aria-invalid"), "true");
        assert.ok(
          (await input.getAttribute("aria-describedby")).includes("-error"),
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        await preview().scrollIntoViewIfNeeded();
        await page.screenshot({
          path: `${evidence}/tag-invalid-wrapped-${language}-${theme}-${width}.png`,
        });
      }
  if (phase !== "before")
    pass(
      "TagInput: one outer ring, native remove-button keyboard rings, click/add/remove focus, no focus layout shift, wrapped invalid states across languages/themes/widths",
    );
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const width of [1440, 320]) {
        const long =
          "  src/system/ai/examples/InputCopyExamples.tsx?full=" +
          "نسخ-ExactValue".repeat(10) +
          "  ";
        await start("input-copy", language, theme, width, { value: long });
        const input = copyField().getByRole("textbox"),
          copy = copyField().getByRole("button");
        await input.focus();
        await page.keyboard.press("Tab");
        assert.equal(
          await copy.evaluate((el) => el === document.activeElement),
          true,
          JSON.stringify({
            language,
            theme,
            width,
            active: await page.evaluate(
              () => document.activeElement?.outerHTML,
            ),
            url: page.url(),
          }),
        );
        const prior = await geometry();
        measurements.push({
          component: "input-copy",
          language,
          theme,
          width,
          geometry: prior,
        });
        await preview().scrollIntoViewIfNeeded();
        await page.screenshot({
          path: `${evidence}/copy-${language}-${theme}-${width}.png`,
        });
        if (phase === "before") continue;
        assert.equal(prior.buttonPosition, "absolute");
        assert.equal(prior.buttonOutline, "2px");
        assert.equal(prior.buttonOutlineStyle, "solid");
        assert.ok(
          prior.button.x > prior.input.x &&
            prior.button.right < prior.input.right,
        );
        assert.ok(
          prior.button.y >= prior.input.y &&
            prior.button.bottom <= prior.input.bottom,
        );
        if (language === "ar")
          assert.ok(prior.button.right < prior.input.x + prior.input.width / 2);
        else assert.ok(prior.button.x > prior.input.x + prior.input.width / 2);
        assert.ok(prior.paddingEnd >= prior.button.width + 8);
        assert.ok(prior.body <= prior.viewport);
        await page.keyboard.press("Enter");
        assert.equal(
          await page.evaluate(() => navigator.clipboard.readText()),
          long,
        );
        const status = copyField().getByRole("status");
        await status
          .getByText(language === "ar" ? "تم النسخ." : "Copied.", {
            exact: true,
          })
          .waitFor({ state: "attached" });
        assert.equal(await status.getAttribute("aria-live"), "polite");
        assert.ok(
          (await status.getAttribute("class")).includes("tz-visually-hidden"),
        );
        assert.equal(await copy.locator(".lucide-check").count(), 1);
        assert.equal(
          await copy.evaluate((el) => el === document.activeElement),
          true,
          JSON.stringify({
            language,
            theme,
            width,
            active: await page.evaluate(
              () => document.activeElement?.outerHTML,
            ),
            url: page.url(),
          }),
        );
        assert.equal(
          await copy.evaluate((el) => getComputedStyle(el).outlineStyle),
          "solid",
        );
        const next = await geometry();
        assert.deepEqual(next.input, prior.input);
        assert.deepEqual(next.button, prior.button);
        assert.deepEqual(next.root, prior.root);
        assert.equal(
          await status.evaluate((el) => getComputedStyle(el).position),
          "absolute",
        );
        await page.screenshot({
          path: `${evidence}/copy-success-${language}-${theme}-${width}.png`,
        });
        await input.focus();
        await page.keyboard.press("Meta+A");
        assert.equal(
          await input.evaluate((el) => el.selectionEnd - el.selectionStart),
          long.length,
        );
        await status
          .getByText(language === "ar" ? "تم النسخ." : "Copied.", {
            exact: true,
          })
          .waitFor({ state: "detached" });
        assert.equal(await copy.locator(".lucide-copy").count(), 1);
      }
  if (phase !== "before") {
    pass(
      "InputCopy: logical-end internal button, reserved text space, keyboard ring, exact real clipboard, check-only success with no geometry change and polite hidden status",
    );
    await start("input-copy", "en", "light");
    const copy = copyField().getByRole("button"),
      input = copyField().getByRole("textbox"),
      status = copyField().getByRole("status");
    for (const outcome of ["reject", "unavailable"]) {
      await page.evaluate(
        (outcome) =>
          Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value:
              outcome === "unavailable"
                ? undefined
                : { writeText: () => Promise.reject(new Error("Denied")) },
          }),
        outcome,
      );
      await copy.click();
      await status
        .getByText("Could not copy. Select the value and copy it manually.")
        .waitFor();
      assert.equal(await copy.locator(".lucide-check").count(), 0);
      await input.focus();
      await page.keyboard.press("Meta+A");
      assert.equal(
        await input.evaluate((el) => el.selectionEnd - el.selectionStart),
        (await input.inputValue()).length,
      );
    }
    await page.screenshot({ path: `${evidence}/copy-failure.png` });
    await page.evaluate(() =>
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: () =>
            new Promise((resolve) => (window.finishCopy = resolve)),
        },
      }),
    );
    await copy.click();
    await page.getByLabel("Value", { exact: true }).fill("replacement");
    await page.evaluate(() => window.finishCopy());
    assert.equal(await status.innerText(), "");
    assert.equal(await copy.locator(".lucide-check").count(), 0);
    pass(
      "Honest simulated clipboard failures and manual selection; stale pending result ignored after value replacement",
    );
    // The native Input shows the shared field focus: accent edge plus halo.
    await start("input", "en", "light");
    const native = preview().getByRole("textbox");
    await native.focus();
    await settled();
    assert.equal(
      await native.evaluate((el) => getComputedStyle(el).outlineStyle),
      "none",
    );
    assert.match(
      await native.evaluate((el) => getComputedStyle(el).boxShadow),
      /0px 0px 0px 3px/,
    );
    pass("Native Input uses the shared field focus");
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  await writeFile(
    `${evidence}/results.json`,
    JSON.stringify({ phase, checks, measurements, errors, warnings }, null, 2),
  );
  console.log("Computed style sample:", JSON.stringify(measurements[0]));
} finally {
  await browser.close();
}
