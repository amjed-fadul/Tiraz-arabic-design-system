import { createRequire } from "node:module";
import { writeFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5227";
const out = "docs/slider-otp-date/otp-correction";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
page.setDefaultTimeout(15000);
const checks = [],
  geometry = [],
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const pass = (name) => {
  checks.push(name);
  console.log("PASS " + name);
};
const input = () => page.locator('input[name="code"]'),
  group = () => input().locator("..");
async function snapshot(control = input()) {
  return control.evaluate((el) => ({
    value: el.value,
    start: el.selectionStart,
    end: el.selectionEnd,
    direction: el.selectionDirection,
    active: [...el.parentElement.querySelectorAll("[data-active]")].map((s) =>
      [...s.parentElement.children].indexOf(s),
    ),
    selected: [...el.parentElement.querySelectorAll("[data-selected]")].map(
      (s) => [...s.parentElement.children].indexOf(s),
    ),
  }));
}
async function expectSelection(
  start,
  end = start,
  active = Math.min(5, start),
  control = input(),
) {
  await page.waitForFunction(
    ({ name, start, end, active }) => {
      const input = document.querySelector(`input[name="${name}"]`),
        slots = [
          ...input.parentElement.querySelector(".tz-otp-slots").children,
        ];
      return (
        input.selectionStart === start &&
        input.selectionEnd === end &&
        slots.findIndex((s) => s.hasAttribute("data-active")) === active
      );
    },
    { name: await control.getAttribute("name"), start, end, active },
  );
}
async function clickSlot(index, control = input(), modifiers = []) {
  const box = await control
    .locator("..")
    .locator(".tz-otp-slot")
    .nth(index)
    .boundingBox();
  await control.click({
    position: {
      x: box.x + box.width / 2 - (await control.boundingBox()).x,
      y: box.height / 2,
    },
    modifiers,
  });
}
async function centers(label) {
  // Measure settled slots (the caret blink is the only infinite animation).
  await group().evaluate((el) =>
    Promise.all(
      el
        .getAnimations({ subtree: true })
        .filter((a) => a.effect.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished),
    ),
  );
  const result = await group().evaluate((el) => {
    const slots = [...el.querySelectorAll(".tz-otp-slot")];
    const probe = document.createElement("span");
    probe.style.borderColor = "var(--focus)";
    el.append(probe);
    const focus = getComputedStyle(probe).borderColor;
    probe.remove();
    return {
      value: el.querySelector("input").value,
      focus,
      slots: slots.map((slot) => {
        const digit = slot.querySelector(".tz-otp-digit"),
          s = slot.getBoundingClientRect(),
          d = digit.getBoundingClientRect(),
          style = getComputedStyle(slot);
        return {
          digit: digit.textContent,
          dx: d.left + d.width / 2 - (s.left + s.width / 2),
          dy: d.top + d.height / 2 - (s.top + s.height / 2),
          border: style.borderColor,
          outline: style.outlineWidth,
          outlineStyle: style.outlineStyle,
          shadow: style.boxShadow,
          active: slot.hasAttribute("data-active"),
        };
      }),
      inputOpacity: getComputedStyle(el.querySelector("input")).opacity,
      inputOutline: getComputedStyle(el.querySelector("input")).outlineStyle,
      letterSpacing: getComputedStyle(el.querySelector("input")).letterSpacing,
    };
  });
  for (const slot of result.slots) {
    if (slot.digit) {
      assert.ok(Math.abs(slot.dx) <= 0.5, JSON.stringify({ label, slot }));
      assert.ok(Math.abs(slot.dy) <= 0.5, JSON.stringify({ label, slot }));
    }
  }
  assert.equal(result.inputOpacity, "0");
  assert.equal(result.inputOutline, "none");
  assert.ok(result.slots.filter((s) => s.active).length === 1);
  // Only the active slot takes the accent edge plus the 3px focus halo
  // (.tz-otp-slot[data-active]); no slot draws an outline.
  assert.ok(result.slots.every((s) => s.outlineStyle === "none"));
  const rings = result.slots.filter((s) => /0px 0px 0px 3px/.test(s.shadow));
  assert.ok(
    rings.length === 1 && rings[0].active,
    JSON.stringify({ label, slots: result.slots }),
  );
  // Woven §17.1 OTPInput: a changed, complete, valid code takes the success
  // edge; an empty or partial code keeps the focus edge.
  const success = label.includes("/dark/")
    ? "rgb(165, 212, 179)"
    : "rgb(49, 103, 70)";
  assert.equal(
    rings[0].border,
    result.value.length === 6 ? success : result.focus,
  );
  assert.equal(
    new Set(result.slots.filter((s) => !s.active).map((s) => s.border)).size,
    1,
  );
  geometry.push({ label, ...result });
}
try {
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const typography of ["standard", "large"])
        for (const density of ["compact", "standard"])
          for (const width of [1100, 320]) {
            await page.setViewportSize({ width, height: 850 });
            const query = new URLSearchParams({
              language,
              theme,
              typography,
              density,
            });
            await page.goto(
              `${base}/tests/browser/otp-correction.html?${query}`,
            );
            await page.evaluate(() => document.fonts.ready);
            assert.equal(await input().getAttribute("dir"), "ltr");
            assert.equal(await input().count(), 1);
            assert.equal(
              await group()
                .locator(".tz-otp-slots")
                .getAttribute("aria-hidden"),
              "true",
            );
            for (const value of ["", "001", "001234", "000000"]) {
              await input().fill(value);
              await input().press("End");
              await expectSelection(
                value.length,
                value.length,
                Math.min(5, value.length),
              );
              await centers(
                `${language}/${theme}/${typography}/${density}/${width}/${value || "empty"}`,
              );
              if (
                language === "en" &&
                theme === "light" &&
                typography === "standard" &&
                density === "compact" &&
                width === 1100 &&
                ["", "001", "000000"].includes(value)
              )
                await page.screenshot({
                  path: `${out}/after-${value === "" ? "empty" : value === "001" ? "partial" : "full"}.png`,
                });
            }
            if (
              typography === "standard" &&
              density === "compact" &&
              (width === 320 || language === "en")
            )
              await page.screenshot({
                path: `${out}/after-${language}-${theme}-${width}.png`,
              });
            const read = page.locator('input[name="readonly"]');
            await clickSlot(2, read);
            await expectSelection(2, 2, 2, read);
            await read.press("7");
            assert.equal(await read.inputValue(), "001234");
            const error = page.locator('input[name="error"]');
            await clickSlot(1, error);
            await expectSelection(1, 1, 1, error);
            const states = await error.locator("..").evaluate((el) => ({
              border: getComputedStyle(el.querySelector(".tz-otp-slot"))
                .borderColor,
              neutral: getComputedStyle(document.querySelector(".tz-otp-slot"))
                .borderColor,
              rings: el.querySelectorAll("[data-active]").length,
            }));
            assert.notEqual(states.border, states.neutral);
            assert.equal(states.rings, 1);
            assert.equal(
              await page.locator('input[name="disabled"]').isDisabled(),
              true,
            );
            assert.equal(
              await page
                .locator('input[name="disabled"]')
                .locator("..")
                .locator("[data-active]")
                .count(),
              0,
            );
            assert.ok(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
            );
          }
  pass(
    "32 layout combinations × empty/partial/full/000000: digit centers within 0.5px in both axes, single active ring, neutral borders, no duplicate native paint",
  );
  for (const language of ["ar", "en"]) {
    await page.setViewportSize({ width: 1100, height: 850 });
    await page.goto(
      `${base}/tests/browser/otp-correction.html?language=${language}`,
    );
    for (const value of ["", "001", "001234", "000000"]) {
      await input().fill(value);
      for (let i = 0; i < 6; i++) {
        await clickSlot(i);
        const caret = Math.min(i, value.length);
        await expectSelection(caret, caret, Math.min(5, caret));
      }
    }
    await input().fill("001234");
    await input().press("Home");
    await expectSelection(0);
    await input().press("ArrowRight");
    await expectSelection(1);
    await input().press("End");
    await expectSelection(6, 6, 5);
    await input().press("ArrowLeft");
    await expectSelection(5);
    await input().press("Shift+ArrowLeft");
    await expectSelection(4, 5, 4);
    assert.deepEqual((await snapshot()).selected, [4]);
    await input().press("Shift+ArrowLeft");
    await expectSelection(3, 5, 3);
    assert.deepEqual((await snapshot()).selected, [3, 4]);
    await input().press("9");
    assert.equal(await input().inputValue(), "00194");
    await expectSelection(4);
    await clickSlot(1);
    await input().press("Delete");
    assert.equal(await input().inputValue(), "0194");
    await expectSelection(1);
    await input().press("Backspace");
    assert.equal(await input().inputValue(), "194");
    await expectSelection(0);
    await input().fill("001234");
    await clickSlot(1);
    await clickSlot(4, input(), ["Shift"]);
    await expectSelection(1, 4, 3);
    assert.deepEqual((await snapshot()).selected, [1, 2, 3]);
    // Pointer drag uses the same native selection range as Shift+arrows.
    const slots = group().locator(".tz-otp-slot"),
      a = await slots.nth(1).boundingBox(),
      b = await slots.nth(4).boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
    await page.mouse.up();
    await expectSelection(1, 4, 3);
    await page.evaluate(() => navigator.clipboard.writeText("٠۰١٢3x٤٥"));
    await input().press("Meta+A");
    await input().press("Meta+V");
    await page.waitForFunction(
      () => document.querySelector('input[name="code"]').value === "001234",
    );
    await expectSelection(6, 6, 5);
    await input().press("Meta+A");
    await input().press("Meta+C");
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      "001234",
    );
    assert.equal((await snapshot()).selected.length, 6);
    await input().press("ArrowLeft");
    await expectSelection(0);
    await input().fill("001");
    await input().press("End");
    await input().press("4");
    await input().press("Meta+z");
    assert.equal(await input().inputValue(), "001");
    await input().evaluate((el) => el.setSelectionRange(1, 2, "backward"));
    await expectSelection(1, 2, 1);
    await page.getByRole("button", { name: "Outside", exact: true }).click();
    assert.equal(await group().locator("[data-active]").count(), 0);
    pass(
      `${language}: every slot click with empty/partial/full/zeros; arrows/Home/End, backward/forward selection, Shift-click, drag, Delete/Backspace, replacement, clipboard paste/copy, undo and imperative selection`,
    );
    const read = page.locator('input[name="readonly"]');
    await clickSlot(2, read);
    await expectSelection(2, 2, 2, read);
    await clickSlot(3, read, ["Shift"]);
    await expectSelection(2, 3, 2, read);
    await read.press("7");
    assert.equal(await read.inputValue(), "001234");
    assert.deepEqual((await snapshot(read)).selected, [2]);
    await read.press("Meta+C");
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      "1",
    );
    const disabled = page.locator('input[name="disabled"]');
    assert.equal(await disabled.isDisabled(), true);
    assert.equal(
      await disabled.locator("..").locator("[data-active]").count(),
      0,
    );
    const error = page.locator('input[name="error"]');
    await clickSlot(1, error);
    const state = await error.locator("..").evaluate((el) => ({
      borders: [...el.querySelectorAll(".tz-otp-slot")].map(
        (s) => getComputedStyle(s).borderColor,
      ),
      danger: getComputedStyle(el).getPropertyValue("--danger").trim(),
      rings: el.querySelectorAll("[data-active]").length,
    }));
    assert.equal(new Set(state.borders).size, 1);
    assert.equal(state.rings, 1);
    await page.screenshot({ path: `${out}/after-${language}-error.png` });
    const controlled = page.locator('input[name="controlled"]');
    await page.getByLabel("Freeze controlled value").check();
    await clickSlot(2, controlled);
    await controlled.press("7");
    assert.equal(await controlled.inputValue(), "001234");
    await page.waitForFunction(() => {
      const input = document.querySelector('input[name="controlled"]'),
        slots = [
          ...input.parentElement.querySelector(".tz-otp-slots").children,
        ];
      return (
        slots.findIndex((s) => s.hasAttribute("data-active")) ===
        Math.min(5, input.selectionStart)
      );
    });
    await page
      .getByRole("button", { name: "External value", exact: true })
      .click();
    assert.equal(await controlled.inputValue(), "000000");
    assert.equal(
      await controlled
        .locator("..")
        .locator(".tz-otp-digit")
        .allTextContents()
        .then((v) => v.join("")),
      "000000",
    );
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await page.waitForFunction(
      () => document.querySelector('input[name="code"]').value === "",
    );
    pass(
      `${language}: disabled/readonly selection, separate error borders and active focus, controlled rejection/external value, reset`,
    );
  }
  await page.goto(`${base}/tests/browser/otp-correction.html`);
  await input().fill("000000");
  await input().press("End");
  await expectSelection(6, 6, 5);
  await page
    .locator(".tz-field")
    .filter({ has: input() })
    .screenshot({ path: `${out}/after-focused-closeup.png` });
  assert.deepEqual(errors, []);
  pass(
    "No browser runtime errors; autofill attributes retained (no actual mobile/SMS autofill test)",
  );
} finally {
  await writeFile(
    `${out}/results.json`,
    JSON.stringify(
      {
        checks,
        geometry,
        errors,
        autofill:
          "Native autocomplete=one-time-code and numeric input mode preserved; normalization/paste use desktop automation. No physical-device autofill tested.",
      },
      null,
      2,
    ),
  );
  await browser.close();
}
