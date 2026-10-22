import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const out = process.env.TIRAZ_EVIDENCE || "docs/ai-context-controls/browser",
  base = process.env.TIRAZ_URL || "http://127.0.0.1:5217";
const browser = await chromium.launch({ headless: true, channel: "chrome" }),
  context = await browser.newContext({
    viewport: { width: 1000, height: 700 },
    permissions: ["clipboard-read", "clipboard-write"],
    recordVideo: { dir: out, size: { width: 1000, height: 700 } },
  }),
  page = await context.newPage();
await page.goto(`${base}/tests/browser/ai-context-controls-fixture.html`);
await page.getByRole("heading").waitFor();
// Keep the deliverable recording focused on the connected composition. The
// additional boundary-test controls remain available in the verification fixture.
await page.addStyleTag({
  content:
    "main > :not(h1):not(.tz-context-connected) { display: none !important; }",
});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(700);
const model = page.getByRole("combobox", { name: "Model", exact: true });
await model.click();
await page.waitForTimeout(800);
await page.keyboard.press("End");
await page.waitForTimeout(450);
await page.keyboard.press("Enter");
await page.waitForTimeout(650);
await page.locator(".tz-context-connected .tz-context-trigger").click();
await page.waitForTimeout(1000);
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
const text = page.locator(".tz-context-connected .tz-chat-content p");
await text.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const b = await text.boundingBox();
await page.mouse.move(b.x + 1, b.y + 12);
await page.mouse.down();
await page.mouse.move(b.x + 250, b.y + 12, { steps: 18 });
await page.mouse.up();
await page.getByRole("toolbar").waitFor();
await page.waitForTimeout(900);
await page.keyboard.press("Alt+Enter");
await page.waitForTimeout(600);
await page.keyboard.press("Enter");
await page.waitForTimeout(900);
await page.screenshot({ path: `${out}/connected-final.png` });
const draft = page.getByRole("textbox", { name: "Message draft" });
await draft.click();
await draft.press("ControlOrMeta+End");
await draft.pressSequentially(" — ready for review", { delay: 45 });
await page.waitForTimeout(900);
await draft.press("Enter");
await page.waitForTimeout(1000);
const video = page.video();
await context.close();
await video.saveAs(`${out}/connected-interactions.webm`);
await video.delete();
await browser.close();
console.log("Saved short connected interactions recording.");
