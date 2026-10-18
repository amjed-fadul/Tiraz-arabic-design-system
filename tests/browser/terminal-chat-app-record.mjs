import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const out = "docs/terminal-and-chat-app/browser",
  base = process.env.TIRAZ_URL || "http://127.0.0.1:5337";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
    slowMo: 180,
  }),
  context = await browser.newContext({
    viewport: { width: 1000, height: 820 },
    recordVideo: { dir: out, size: { width: 1000, height: 820 } },
  }),
  page = await context.newPage();
await page.goto(`${base}/examples/chat-app?lang=en`);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: `${out}/connected-desktop.png`, fullPage: true });
const input = () => page.locator(".tz-chat-app textarea"),
  nav = page.locator(".tz-chat-app-navigation");
await input().fill("Summarize the build output.");
await input().press("Enter");
await page
  .locator('[data-message-id="assistant-1"]')
  .getByText(/Start/)
  .waitFor();
await page.getByRole("button", { name: "Stop generating" }).click();
await input().fill("Draft kept for later");
await nav
  .getByRole("button", { name: "Arabic interface", exact: true })
  .click();
await input().fill("Separate conversation draft");
await nav.getByRole("button", { name: "Build notes", exact: true }).click();
await page.getByRole("combobox", { name: "Model" }).click();
await page.getByRole("option", { name: /Detailed/ }).click();
await nav.getByRole("button", { name: "New conversation" }).click();
await input().fill("Draft the release notes for this build.");
await input().press("Enter");
await page.waitForTimeout(700);
await nav.getByRole("button", { name: "Build notes", exact: true }).click();
await page.waitForTimeout(500);
const video = page.video();
await context.close();
await video.saveAs(`${out}/connected-flow.webm`);
await video.delete();
const mobile = await browser.newPage({ viewport: { width: 320, height: 640 } });
await mobile.goto(`${base}/examples/chat-app?lang=ar&theme=dark`);
await mobile.evaluate(() => document.fonts.ready);
await mobile.screenshot({
  path: `${out}/connected-mobile-ar-dark.png`,
  fullPage: true,
});
await mobile.getByRole("button", { name: "فتح المحادثات" }).click();
await mobile.screenshot({ path: `${out}/connected-mobile-sheet.png` });
await browser.close();
console.log(
  "Recorded supplied Terminal output → send/stop → drafts/switch → model → new/send/switch cancellation. No network execution.",
);
