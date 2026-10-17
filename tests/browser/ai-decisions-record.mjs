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
await page.getByRole("radio", { name: /Concise draft/ }).check();
await page.getByRole("button", { name: "Submit answers" }).click();
await page.getByRole("button", { name: "Approve sample rename" }).click();
await page
  .getByText("Decision was not accepted. Review and try again.")
  .waitFor();
await page.getByRole("button", { name: "Keep sample title" }).click();
await page.getByText("Request 2 of 2", { exact: true }).waitFor();
await page.getByRole("button", { name: "Approve sample note" }).click();
await page
  .getByText("All decisions recorded. No actions executed.", { exact: true })
  .waitFor();
await page.waitForTimeout(1000);
const video = page.video();
await context.close();
await video.saveAs(`${out}/connected-flow.webm`);
await video.delete();
await browser.close();
console.log(
  "Recorded questions → concrete preview → host failure → rejection retry → separate approval; no execution.",
);
