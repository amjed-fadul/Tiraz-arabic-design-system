import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.TIRAZ_BROWSER
    ? { executablePath: process.env.TIRAZ_BROWSER }
    : {}),
});
const page = await browser.newPage();
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5205";
const out =
  process.env.TIRAZ_EVIDENCE ||
  "docs/form-controls-and-badge/review-fixes/browser";
await mkdir(out, { recursive: true });
const report = { cases: [], errors: [] };
page.on("pageerror", (error) => report.errors.push(error.message));
const copies = [
  {
    language: "en",
    action: "Check form",
    notes: "Notes",
    helper: "Add a short note.",
    error: "Enter a note to complete the form check.",
    success: "Form check passed.",
    description: "Small form · application-owned validation",
    updates: "Receive updates",
    weekly: "Weekly",
    monthly: "Monthly",
    reset: "Reset",
  },
  {
    language: "ar",
    action: "تحقق من النموذج",
    notes: "ملاحظات",
    helper: "أضف ملاحظة قصيرة.",
    error: "أدخل ملاحظة لإكمال التحقق من النموذج.",
    success: "تم التحقق من النموذج بنجاح.",
    description: "نموذج صغير · التطبيق يملك التحقق",
    updates: "تلقي التحديثات",
    weekly: "أسبوعيًا",
    monthly: "شهريًا",
    reset: "إعادة الضبط",
  },
];
try {
  for (const copy of copies)
    for (const width of [1440, 320]) {
      const theme = width === 1440 ? "light" : "dark";
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base);
      await page.evaluate(
        ({ language, theme, width }) => {
          localStorage.clear();
          localStorage.setItem(
            "tiraz.documentation.v2",
            JSON.stringify({
              language,
              active: "textarea",
              systemPanelOpen: true,
              inspectorOpen: true,
            }),
          );
          localStorage.setItem("tiraz.theme.v1", JSON.stringify(theme));
          localStorage.setItem(
            "tiraz.system.v3",
            JSON.stringify({
              density: width === 1440 ? "compact" : "standard",
              typography: width === 1440 ? "standard" : "large",
              accent: "sage",
              radius: 8,
              reducedMotion: false,
            }),
          );
        },
        { language: copy.language, theme, width },
      );
      await page.reload();
      const section = page.locator(".examples-section"),
        form = section.locator("form"),
        notes = form.getByRole("textbox", { name: copy.notes, exact: true });
      const action = form.getByRole("button", {
          name: copy.action,
          exact: true,
        }),
        status = form.getByRole("status");
      await action.waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(
        await section.locator(".example-caption").innerText(),
        copy.description,
      );
      await action.click();
      assert.equal(await notes.getAttribute("aria-invalid"), "true");
      assert.equal(
        await notes.evaluate((el) => el === document.activeElement),
        true,
      );
      const descriptions = await notes.evaluate((el) =>
        el
          .getAttribute("aria-describedby")
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent),
      );
      assert.deepEqual(descriptions, [copy.helper, copy.error]);
      assert.equal(await status.innerText(), "");
      await section.screenshot({
        path: `${out}/${copy.language}-${width}-error.png`,
      });
      await notes.fill("   ");
      await action.click();
      assert.equal(await status.innerText(), "");
      assert.equal(
        await notes.evaluate((el) => el === document.activeElement),
        true,
      );
      await notes.fill(
        copy.language === "ar" ? "ملاحظة للتحقق" : "A note to validate",
      );
      await form
        .getByRole("checkbox", { name: copy.updates, exact: true })
        .check();
      await form
        .getByRole("radio", { name: copy.monthly, exact: true })
        .check();
      await action.click();
      assert.equal(await status.innerText(), copy.success);
      assert.notEqual(await notes.getAttribute("aria-invalid"), "true");
      const successDescriptions = await notes.evaluate((el) =>
        el
          .getAttribute("aria-describedby")
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent),
      );
      assert.deepEqual(successDescriptions, [copy.helper]);
      await section.screenshot({
        path: `${out}/${copy.language}-${width}-valid.png`,
      });
      await form.getByRole("button", { name: copy.reset, exact: true }).click();
      assert.equal(await notes.inputValue(), "");
      assert.equal(
        await form
          .getByRole("checkbox", { name: copy.updates, exact: true })
          .isChecked(),
        false,
      );
      assert.equal(
        await form
          .getByRole("radio", { name: copy.weekly, exact: true })
          .isChecked(),
        true,
      );
      assert.equal(await status.innerText(), "");
      await action.click();
      await form.getByRole("button", { name: copy.reset, exact: true }).click();
      assert.notEqual(await notes.getAttribute("aria-invalid"), "true");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      assert.equal(overflow, false);
      report.cases.push({
        language: copy.language,
        width,
        theme,
        action: copy.action,
        description: copy.description,
        associatedError: descriptions,
        firstInvalidFocused: true,
        whitespaceRejected: true,
        success: copy.success,
        resetClearsFeedbackAndErrors: true,
        nativeValuesRestored: true,
        overflow,
      });
    }
  assert.deepEqual(report.errors, []);
} finally {
  await writeFile(
    `${out}/results.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
  await browser.close();
}
console.log(JSON.stringify(report, null, 2));
