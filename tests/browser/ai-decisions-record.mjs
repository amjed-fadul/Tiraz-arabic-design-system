import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright"),
  out = "docs/ai-decisions/browser";
const browser = await chromium.launch({
  headless: true,
  channel: "chrome",
  slowMo: 220,
});
const context = await browser.newContext({
    viewport: { width: 1000, height: 850 },
    recordVideo: { dir: out, size: { width: 1000, height: 850 } },
  }),
  page = await context.newPage();
await page.goto(
  `${process.env.TIRAZ_URL || "http://127.0.0.1:5237"}/tests/browser/ai-decisions-fixture.html`,
);
await page.evaluate(() => document.fonts.ready);
await page.getByRole("radio", { name: /Supplier invoices/ }).check();
await page.getByRole("button", { name: "Submit answers" }).click();
await page.getByRole("button", { name: "Keep status" }).click();
await page.getByText("Request 2 of 2", { exact: true }).waitFor();
await page.getByRole("button", { name: "Send summary" }).click();
await page.getByText("All decisions made.", { exact: true }).waitFor();
await page.waitForTimeout(1000);
const video = page.video();
await context.close();
await video.saveAs(`${out}/connected-flow.webm`);
await video.delete();
await browser.close();
console.log(
  "Recorded question → answered approval target → rejection → separate approval; no execution.",
);
