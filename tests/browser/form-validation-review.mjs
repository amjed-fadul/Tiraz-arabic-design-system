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
// Sending validates, then resets the form natively.
const copies = [
  {
    language: "en",
    action: "Send feedback",
    notes: "Notes",
    helper: "Tell us what we could improve.",
    error: "Write your note before sending.",
    success: "Thanks — we received your note.",
    updates: "Receive updates",
    weekly: "Weekly",
    monthly: "Monthly",
  },
  {
    language: "ar",
    action: "إرسال الملاحظات",
    notes: "ملاحظات",
    helper: "أخبرنا بما يمكننا تحسينه.",
    error: "اكتب ملاحظتك قبل الإرسال.",
    success: "شكرًا لك، وصلتنا ملاحظتك.",
    updates: "تلقّي التحديثات",
    weekly: "أسبوعيًا",
    monthly: "شهريًا",
  },
];
try {
  for (const copy of copies)
    for (const width of [1440, 320]) {
      const theme = width === 1440 ? "light" : "dark";
      await page.setViewportSize({ width, height: 1000 });
      // FeedbackForm is not on a docs page; drive the exported example in its
      // own fixture with the same language/theme/density/typography coverage.
      const query = new URLSearchParams({
        lang: copy.language,
        theme,
        density: width === 1440 ? "compact" : "standard",
        typography: width === 1440 ? "standard" : "large",
      });
      await page.goto(
        `${base}/tests/browser/feedback-form-fixture.html?${query}`,
      );
      const section = page.locator("main section"),
        form = section.locator("form"),
        notes = form.getByRole("textbox", { name: copy.notes, exact: true });
      const action = form.getByRole("button", {
          name: copy.action,
          exact: true,
        }),
        status = form.getByRole("status");
      await action.waitFor();
      await page.evaluate(() => document.fonts.ready);
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
      // Sending resets the native form values itself.
      await page.waitForFunction(() => {
        const form = document.querySelector("main section form");
        return (
          form.elements.notes.value === "" &&
          !form.elements.updates.checked &&
          form.elements.frequency.value === "weekly"
        );
      });
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
      await section.screenshot({
        path: `${out}/${copy.language}-${width}-valid.png`,
      });
      // Sending the now-empty form again replaces the confirmation with the
      // associated error.
      await action.click();
      assert.equal(await notes.getAttribute("aria-invalid"), "true");
      assert.equal(await status.innerText(), "");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      assert.equal(overflow, false);
      report.cases.push({
        language: copy.language,
        width,
        theme,
        action: copy.action,
        associatedError: descriptions,
        firstInvalidFocused: true,
        whitespaceRejected: true,
        success: copy.success,
        sendResetsNatively: true,
        resendClearsFeedbackAndShowsError: true,
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
