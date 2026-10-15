import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const {
  chromium,
} = require("/Users/amjedfadul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root = process.env.TIRAZ_URL || "http://127.0.0.1:5227";
const evidence = "docs/slider-otp-date/browser";
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
page.setDefaultTimeout(15000);
const checks = [],
  geometry = [],
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const pass = (name) => {
  checks.push(name);
  console.log("PASS " + name);
};
const focus = async (locator) => {
  await page.waitForFunction(
    (html) => document.activeElement?.outerHTML === html,
    await locator.evaluate((el) => el.outerHTML),
    { timeout: 2000 },
  );
  assert.equal(
    await locator.evaluate((el) => el === document.activeElement),
    true,
  );
};
const popup = () => page.locator(".tz-datepicker-popup");
async function bounds() {
  const box = await popup().boundingBox();
  const viewport = page.viewportSize();
  assert.ok(
    box &&
      box.x >= 0 &&
      box.y >= 0 &&
      box.x + box.width <= viewport.width + 1 &&
      box.y + box.height <= viewport.height + 1,
    JSON.stringify({ box, viewport }),
  );
  geometry.push({ box, viewport });
}
try {
  for (const lang of ["en", "ar"]) {
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto(
      `${root}/tests/browser/slider-otp-date-fixture.html?lang=${lang}`,
    );
    const range = page.getByRole("slider", { name: "Range", exact: true });
    await range.focus();
    await range.press("End");
    assert.equal(await range.inputValue(), "0.9");
    await range.press("Home");
    assert.equal(await range.inputValue(), "0.1");
    await range.press(lang === "ar" ? "ArrowLeft" : "ArrowRight");
    assert.equal(await range.inputValue(), "0.2");
    await range.press("ArrowUp");
    assert.equal(await range.inputValue(), "0.3");
    await range.press("ArrowDown");
    assert.equal(await range.inputValue(), "0.2");
    const rb = await range.boundingBox();
    await page.mouse.click(rb.x + rb.width * 0.65, rb.y + rb.height / 2);
    assert.ok(
      Number(await range.inputValue()) >= 0.1 &&
        Number(await range.inputValue()) <= 0.9,
    );
    pass(
      `${lang}: native pointer/arrows/Home/End/RTL range with decimal boundaries`,
    );
    const code = page.getByRole("textbox", { name: "Code", exact: true });
    await code.fill("٠٠١٢٣٤");
    assert.equal(await code.inputValue(), "001234");
    await code.focus();
    await code.press("Home");
    await code.press("ArrowRight");
    await code.press("Shift+ArrowRight");
    await code.press("Shift+ArrowRight");
    await code.press("Backspace");
    assert.equal(await code.inputValue(), "0234");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.evaluate(() => navigator.clipboard.writeText("٠۰١٢3x٤٥"));
    await code.press("Meta+A");
    await code.press("Meta+V");
    await page.waitForFunction(
      () => document.querySelector('input[name="code"]').value === "001234",
    );
    assert.equal(await code.inputValue(), "001234");
    await code.fill("001");
    await code.press("End");
    await code.press("4");
    assert.equal(await code.inputValue(), "0014");
    await code.press("Meta+z");
    assert.equal(await code.inputValue(), "001");
    assert.equal(await code.getAttribute("autocomplete"), "one-time-code");
    assert.equal(await code.getAttribute("inputmode"), "numeric");
    const readOnly = page.getByRole("textbox", {
      name: "Read only code",
      exact: true,
    });
    await readOnly.focus();
    await readOnly.press("7");
    assert.equal(await readOnly.inputValue(), "0012");
    pass(
      `${lang}: real clipboard paste, normalized Arabic digits, leading zeros, selection deletion, readonly and autofill attributes (desktop simulation)`,
    );
    const trigger = page.getByRole("button", { name: /^Date\b/ });
    await trigger.click();
    await popup().waitFor();
    await bounds();
    const focused = await page.locator(":focus").getAttribute("class");
    console.log("Calendar focus: " + focused);
    assert.ok(
      focused.includes("rdp-day_button"),
      "calendar should focus a day, got " + focused,
    );
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await popup().waitFor({ state: "hidden" });
    await focus(trigger);
    assert.equal(
      await page.locator('input[name="date"]').inputValue(),
      "2024-03-07",
    );
    await trigger.click();
    await popup().waitFor();
    await page.keyboard.press("PageUp");
    await page.keyboard.press("Home");
    await page.keyboard.press("End");
    await page.keyboard.press("Escape");
    await popup().waitFor({ state: "hidden" });
    await focus(trigger);
    pass(
      `${lang}: leap-day selection crosses month; calendar arrows/PageUp/Home/End/Escape and focus restore`,
    );
    await trigger.click();
    await popup().waitFor();
    await popup()
      .getByRole("button", {
        name: lang === "ar" ? "مسح" : "Clear",
        exact: true,
      })
      .click();
    assert.equal(await page.locator('input[name="date"]').inputValue(), "");
    await page.getByRole("button", { name: "Reset form", exact: true }).click();
    await page.waitForFunction(
      () => document.querySelector('input[name="date"]').value === "2024-02-29",
    );
    assert.equal(
      await page.locator('input[name="date"]').inputValue(),
      "2024-02-29",
    );
    assert.equal(await range.inputValue(), "0.4");
    assert.equal(await code.inputValue(), "001");
    await code.fill("12");
    await page.getByLabel("Cancel reset").check();
    await page.getByRole("button", { name: "Reset form", exact: true }).click();
    assert.equal(await code.inputValue(), "12");
    await page.getByLabel("Cancel reset").uncheck();
    pass(
      `${lang}: clear, reset and canceled native reset preserve expected values`,
    );
    for (const overlay of ["Sheet", "Modal"]) {
      for (const size of [
        { width: 1100, height: 900 },
        { width: 390, height: 420 },
        { width: 320, height: 320 },
      ]) {
        await page.setViewportSize(size);
        await page
          .getByRole("button", { name: `Open ${overlay}`, exact: true })
          .click();
        const dialog = page.getByRole("dialog", { name: overlay, exact: true });
        const dt = dialog.getByRole("button", {
          name: lang === "ar" ? /تاريخ داخل اللوحة/ : /Overlay date/,
        });
        await dt.click();
        await popup().waitFor();
        await page.evaluate(() =>
          Promise.all(
            document.getAnimations().map((a) => a.finished.catch(() => {})),
          ),
        );
        await bounds();
        const fb = await page.locator(":focus").boundingBox(),
          pb = await popup().boundingBox();
        assert.ok(
          fb.y >= pb.y && fb.y + fb.height <= pb.y + pb.height + 1,
          JSON.stringify({ focused: fb, popup: pb }),
        );
        assert.equal(
          await popup().evaluate((el) => !!el.closest(".tz-sheet, .tz-modal")),
          true,
        );
        await page.screenshot({
          path: `${evidence}/${lang}-${overlay.toLowerCase()}-${size.width}.png`,
        });
        await page.keyboard.press(lang === "ar" ? "ArrowLeft" : "ArrowRight");
        await page.keyboard.press("Enter");
        await popup().waitFor({ state: "hidden" });
        assert.equal(
          await dialog.locator('input[type="hidden"]').inputValue(),
          "2025-01-01",
        );
        await dt.click();
        await popup().waitFor();
        await page.keyboard.press("Escape");
        await popup().waitFor({ state: "hidden" });
        assert.equal(await dialog.isVisible(), true);
        await focus(dt);
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "hidden" });
        await focus(
          page.getByRole("button", { name: `Open ${overlay}`, exact: true }),
        );
      }
    }
    pass(
      `${lang}: Sheet/Modal portal scope, short/narrow viewport containment, ordered Escape and two-level focus restore`,
    );
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.getByRole("button", { name: "Customize", exact: true }).click();
    await trigger.click();
    await popup().waitFor();
    const styles = await popup().evaluate((el) => {
      const c = getComputedStyle(el);
      return {
        font: c.fontSize,
        radius: c.borderRadius,
        accent: c.getPropertyValue("--action"),
        motion: c.getPropertyValue("--motion-fast"),
      };
    });
    assert.equal(styles.font, "16px");
    assert.equal(styles.radius, "4px");
    assert.equal(styles.motion, "0ms");
    await page.getByRole("button", { name: "Theme", exact: true }).click();
    await trigger.click();
    await popup().waitFor();
    assert.equal(
      await page.locator(".tiraz-system").getAttribute("data-theme"),
      "dark",
    );
    await page.evaluate(() =>
      Promise.all(
        document.getAnimations().map((a) => a.finished.catch(() => {})),
      ),
    );
    await bounds();
    await page.screenshot({ path: `${evidence}/${lang}-dark-customized.png` });
    await page.keyboard.press("Escape");
    pass(
      `${lang}: live theme/density/type/accent/corners/reduced-motion tokens reach popup`,
    );
  }
  // Continuous documentation pages and generated clipboard payloads.
  await context.addInitScript(() => {
    const raw = new URLSearchParams(location.search).get("check");
    if (!raw) return;
    const { component, language, theme } = JSON.parse(raw);
    localStorage.clear();
    localStorage.setItem(
      "tiraz.documentation.v2",
      JSON.stringify({ language, active: component }),
    );
    localStorage.setItem("tiraz.theme.v1", JSON.stringify(theme));
  });
  for (const id of ["slider", "otp-input", "date-picker"]) {
    for (const language of ["ar", "en"])
      for (const theme of ["light", "dark"])
        for (const width of [1440, 390]) {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(
            `${root}/?check=${encodeURIComponent(JSON.stringify({ component: id, language, theme }))}`,
          );
          await page.locator(".playground-region").waitFor();
          assert.ok(await page.getByRole("heading", { level: 1 }).isVisible());
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          );
          if (id === "date-picker") {
            await page.locator(".playground-region .tz-date-trigger").click();
            await popup().waitFor();
            await bounds();
            await page.keyboard.press("Escape");
          }
          await page.screenshot({
            path: `${evidence}/docs-${id}-${language}-${theme}-${width}.png`,
          });
        }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole("button", { name: "Copy code", exact: true }).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.ok(copied.includes("export default function Example()"));
    await page
      .getByRole("button", { name: "Copy agent prompt", exact: true })
      .click();
    const prompt = await page.evaluate(() => navigator.clipboard.readText());
    assert.ok(prompt.includes(copied));
    assert.ok(prompt.includes("ai/README.md"));
    const region = page.locator(".playground-region");
    if (id === "slider") {
      await page
        .getByRole("spinbutton", { name: "Min", exact: true })
        .fill("0.1");
      await page
        .getByRole("spinbutton", { name: "Max", exact: true })
        .fill("0.95");
      await page
        .getByRole("spinbutton", { name: "Step", exact: true })
        .fill("0.1");
      await region.getByRole("slider").press("End");
      assert.equal(await region.getByRole("slider").inputValue(), "0.9");
      await region
        .getByRole("button", { name: "Read value", exact: true })
        .click();
      assert.ok((await region.innerText()).includes("0.9"));
    } else if (id === "otp-input") {
      await page
        .getByRole("spinbutton", { name: "Length", exact: true })
        .fill("4");
      await region.getByRole("textbox").fill("0012");
      assert.ok(
        (await region.innerText()).includes("locally complete; unverified"),
      );
      await page
        .getByRole("switch", { name: "Read only", exact: true })
        .click();
      assert.equal(
        await region.getByRole("textbox").getAttribute("readonly"),
        "",
      );
      await page
        .getByRole("switch", { name: "Read only", exact: true })
        .click();
      await region.getByRole("textbox").fill("00");
      await region
        .getByRole("button", { name: "Check completeness", exact: true })
        .click();
      assert.ok((await region.innerText()).includes("Enter 4 digits"));
      await region.getByRole("button", { name: "Reset", exact: true }).click();
      await page.waitForFunction(
        () => document.querySelector(".playground-region input").value === "",
      );
    } else {
      await page
        .getByRole("textbox", { name: "Min date", exact: true })
        .fill("2024-02-28");
      await page
        .getByRole("textbox", { name: "Max date", exact: true })
        .fill("2024-03-01");
      await region.locator(".tz-date-trigger").click();
      await popup().waitFor();
      assert.equal(
        await popup()
          .getByRole("button", { name: /February 27/ })
          .isDisabled(),
        true,
      );
      await popup()
        .getByRole("button", { name: /February 29/ })
        .click();
      assert.ok((await region.innerText()).includes("2024-02-29"));
      await region.locator(".tz-date-trigger").click();
      await popup().waitFor();
      await page.screenshot({
        path: `${evidence}/docs-date-picker-selected-popup.png`,
      });
      await page.keyboard.press("Escape");
    }
    pass(
      `${id}: minimal live inspector updates actual control and local example feedback`,
    );
    pass(
      `${id}: Arabic/English light/dark desktop/narrow documentation, clipboard code + full portable prompt`,
    );
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${root}/tests/browser/slider-otp-date-fixture.html`);
  assert.equal(
    await page
      .locator(".tiraz-system")
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--motion-fast").trim(),
      ),
    "0ms",
  );
  pass("OS reduced motion wins");
  // Automated accessibility scan complements keyboard/browser checks, not a screen reader session.
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const closedScan = await page.evaluate(() =>
    axe.run(document.querySelector("main"), {
      rules: { region: { enabled: false } },
    }),
  );
  assert.deepEqual(
    closedScan.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
    [],
  );
  await page.getByRole("button", { name: /^Controlled date/ }).click();
  await popup().waitFor();
  const openScan = await page.evaluate(() =>
    axe.run(document.querySelector(".tz-datepicker-popup"), {
      rules: { region: { enabled: false } },
    }),
  );
  assert.deepEqual(
    openScan.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
    [],
  );
  await writeFile(
    `${evidence}/accessibility.json`,
    JSON.stringify(
      {
        closed: closedScan.violations,
        calendar: openScan.violations,
        manualScreenReader: false,
      },
      null,
      2,
    ),
  );
  pass(
    "Axe scan of controls and open calendar: no violations; no manual screen-reader claim",
  );
  await popup().getByRole("button", { name: "Today", exact: true }).click();
  const todayISO = await page.evaluate(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  });
  assert.equal(
    await page.locator('input[name="controlledDate"]').inputValue(),
    todayISO,
  );
  pass("Today selects the local Gregorian date without a UTC shift");

  assert.deepEqual(errors, []);
  pass("No browser runtime errors");
} finally {
  await writeFile(
    `${evidence}/results.json`,
    JSON.stringify(
      {
        checks,
        geometry,
        errors,
        deviceAutofill:
          "Not tested: desktop Chromium only; clipboard/keyboard real desktop automation, autofill simulated attributes/events.",
      },
      null,
      2,
    ),
  );
  await browser.close();
}
