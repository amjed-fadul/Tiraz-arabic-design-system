import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5337",
  out = "docs/terminal-and-chat-app/browser";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "chrome" }),
  context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  }),
  page = await context.newPage();
page.setDefaultTimeout(15000);
const result = {
  checks: [],
  failures: [],
  errors: [],
  engine: "Installed Chrome (Chromium) on macOS; headless automated checks.",
  limitations: [
    "No screen-reader session or physical mobile device. Narrow layouts emulate viewport size. Firefox and WebKit not tested. OS reduced-motion preference emulated; no OS settings changed.",
  ],
};
page.on("pageerror", (error) => result.errors.push(error.message));
async function check(name, fn) {
  try {
    const detail = await fn();
    result.checks.push({ name, ...detail });
  } catch (error) {
    result.failures.push({
      name,
      error: error.message,
      url: page.url(),
      body: (await page.locator("body").innerText()).slice(0, 1200),
    });
    await page.screenshot({
      path: `${out}/failure-${name.replace(/[^a-z0-9]+/gi, "-").slice(0, 70)}.png`,
      fullPage: true,
    });
  }
}
async function load(query = "") {
  await page.goto(
    `${base}/tests/browser/terminal-chat-app-fixture.html?${query}`,
  );
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.evaluate(() => document.fonts.ready);
}
const nav = () =>
  page.locator(".tz-chat-app-navigation").getByRole("navigation");
const input = () => page.locator(".tz-chat-app textarea");
await page.setViewportSize({ width: 1280, height: 900 });
await load("lang=en");
await check("exact unsafe output copy and safe literal text", async () => {
  const region = page.getByRole("region", { name: "Unsafe supplied text" }),
    raw =
      "  echo sample  \n  a\t b\n<img src=x onerror=alert(1)>\n\u001b[31mred\u001b[0m\n<script>alert(1)</script>\n";
  assert.equal(await region.textContent(), raw);
  assert.equal(await region.locator("img,script").count(), 0);
  assert.equal(await region.getAttribute("dir"), "ltr");
  const terminal = region.locator("..");
  assert.ok(
    (await terminal.boundingBox()).width >=
      (await terminal.locator("..").boundingBox()).width - 2,
  );
  await region
    .locator("..")
    .getByRole("button", { name: "Copy output" })
    .click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), raw);
  assert.equal(
    await region.locator("..").locator("button .lucide-check").count(),
    1,
  );
});
await check(
  "keyboard scrolling, old-output reading, follow and selected text",
  async () => {
    const log = page.getByRole("region", { name: "Long supplied log" });
    await log.focus();
    await log.press("Control+Home");
    await log.press("PageDown");
    await page.waitForTimeout(150);
    assert.ok((await log.evaluate((el) => el.scrollTop)) > 0);
    await log.evaluate((el) => {
      el.scrollTop = 60;
      el.dispatchEvent(new Event("scroll"));
    });
    const older = await log.evaluate((el) => el.scrollTop);
    await page
      .getByRole("button", { name: "Append ten supplied lines" })
      .click();
    assert.equal(await log.evaluate((el) => el.scrollTop), older);
    await log.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event("scroll"));
    });
    await log.evaluate((el) => {
      const node = el.querySelector("code").lastChild.firstChild;
      const range = document.createRange();
      range.setStart(node, 0);
      range.setEnd(node, 20);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
    });
    const before = await log.evaluate((el) => ({
      top: el.scrollTop,
      selected: getSelection().toString(),
    }));
    await page
      .getByRole("button", { name: "Append ten supplied lines" })
      .click();
    assert.equal(await log.evaluate((el) => el.scrollTop), before.top);
    assert.equal(
      await page.evaluate(() => getSelection().toString()),
      before.selected,
    );
    await page.evaluate(() => getSelection().removeAllRanges());
    await log.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event("scroll"));
    });
    await page
      .getByRole("button", { name: "Append ten supplied lines" })
      .click();
    assert.ok(
      (await log.evaluate(
        (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
      )) <= 2,
    );
  },
);
await check("clipboard denied gives accessible visible failure", async () => {
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("denied")) },
    });
  });
  const terminal = page
    .getByRole("region", { name: "Unsafe supplied text" })
    .locator("..");
  await terminal.getByRole("button", { name: "Copy output" }).click();
  await terminal
    .getByRole("status")
    .filter({ hasText: "Could not copy" })
    .waitFor();
  assert.ok(await terminal.getByRole("status").isVisible());
});
await check(
  "drafts, model, send duplicate guard, stable stream and switch cancellation",
  async () => {
    await load("lang=en");
    await input().fill("  Exact draft / مرحبا  ");
    await nav().getByRole("button", { name: "Arabic interface" }).click();
    assert.equal(await input().inputValue(), "");
    await input().fill("other draft");
    await nav().getByRole("button", { name: "Build notes" }).click();
    assert.equal(await input().inputValue(), "  Exact draft / مرحبا  ");
    await page.getByRole("combobox", { name: "Model" }).click();
    await page.getByRole("option", { name: /Detailed sample/ }).click();
    assert.match(
      await page.getByRole("combobox", { name: "Model" }).innerText(),
      /Detailed/,
    );
    await input().press("Enter");
    await input().press("Enter");
    assert.equal(await page.locator('[data-role="user"]').count(), 2);
    const assistant = page.locator('[data-message-id="assistant-1"]');
    await assistant.getByText(/Start/).waitFor();
    const handle = await assistant.elementHandle();
    await page.waitForTimeout(350);
    assert.ok(await assistant.evaluate((el, old) => el === old, handle));
    const content = await assistant.textContent();
    await nav().getByRole("button", { name: "Arabic interface" }).click();
    assert.equal(await input().inputValue(), "other draft");
    await page.waitForTimeout(600);
    await nav().getByRole("button", { name: "Build notes" }).click();
    assert.equal(await assistant.textContent(), content);
    assert.match(
      await page.getByRole("combobox", { name: "Model" }).innerText(),
      /Detailed/,
    );
  },
);
await check(
  "stop preserves content; new cancels; reset restores samples",
  async () => {
    await input().fill("Stop sample");
    await input().press("Enter");
    await page
      .locator('[data-message-id="assistant-2"]')
      .getByText(/Start/)
      .waitFor();
    await page.getByRole("button", { name: "Stop generating" }).click();
    const assistant = page.locator('[data-message-id="assistant-2"]'),
      text = await assistant.textContent();
    await page.waitForTimeout(600);
    assert.equal(await assistant.textContent(), text);
    await input().fill("Cancel on new");
    await input().press("Enter");
    await nav().getByRole("button", { name: "New conversation" }).click();
    assert.equal(await input().inputValue(), "");
    await page.waitForTimeout(600);
    assert.equal(await page.locator("[data-message-id]").count(), 0);
    await input().fill("Reset pending");
    await input().press("Enter");
    await page.getByRole("button", { name: "Reset example" }).click();
    await page.waitForTimeout(600);
    assert.equal(await page.locator("[data-message-id]").count(), 2);
  },
);
await check(
  "desktop and 320px Arabic/English light/dark shared customization and short viewport",
  async () => {
    for (const lang of ["ar", "en"])
      for (const theme of ["light", "dark"])
        for (const [width, height] of [
          [1280, 900],
          [320, 640],
          [320, 320],
        ]) {
          await page.setViewportSize({ width, height });
          await load(`lang=${lang}&theme=${theme}&custom=1&motion=1`);
          assert.equal(
            await input().getAttribute("dir"),
            lang === "ar" ? "rtl" : "ltr",
          );
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
          );
          const mobile = page.getByRole("button", {
            name: lang === "ar" ? "فتح المحادثات" : "Open conversations",
          });
          assert.equal(await mobile.isVisible(), width === 320);
          await input().fill(
            Array.from({ length: 15 }, () =>
              lang === "ar" ? "مسودة عربية طويلة" : "Long multiline draft",
            ).join("\n"),
          );
          const footer = page.locator(".tz-chat-app-composer");
          assert.ok(
            await footer.evaluate(
              (el) => el.clientHeight <= el.parentElement.clientHeight * 0.61,
            ),
          );
          if (height === 320) {
            await input().focus();
            for (const name of [
              lang === "ar" ? "إرسال" : "Send",
              lang === "ar" ? "النموذج" : "Model",
            ]) {
              await page.keyboard.press("Tab");
              const focused = page.locator(":focus");
              assert.equal(await focused.getAttribute("aria-label"), name);
              const bounds = await focused.boundingBox(),
                container = await footer.boundingBox();
              assert.ok(
                bounds.y >= container.y - 1 &&
                  bounds.y + bounds.height <=
                    container.y + container.height + 1,
              );
            }
          }
          await page.screenshot({
            path: `${out}/${lang}-${theme}-${width}x${height}.png`,
            fullPage: true,
          });
        }
  },
);
await check(
  "mobile Sheet selection, new, Escape, outside dismissal and focus restoration in RTL/LTR",
  async () => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const lang of ["en", "ar"]) {
      await load(`lang=${lang}`);
      const trigger = page.getByRole("button", {
          name: lang === "ar" ? "فتح المحادثات" : "Open conversations",
        }),
        select = lang === "ar" ? "الواجهة العربية" : "Arabic interface";
      await trigger.click();
      const dialog = page.getByRole("dialog");
      const close = dialog.getByRole("button", {
        name: lang === "ar" ? "إغلاق المحادثات" : "Close conversations",
      });
      await close.focus();
      await page.keyboard.press("Shift+Tab");
      assert.ok(
        await dialog.evaluate((el) => el.contains(document.activeElement)),
      );
      await page.keyboard.press("Tab");
      assert.ok(await close.evaluate((el) => el === document.activeElement));
      await dialog.getByRole("button", { name: select, exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      assert.ok(await trigger.evaluate((el) => el === document.activeElement));
      await trigger.click();
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      assert.ok(await trigger.evaluate((el) => el === document.activeElement));
      await trigger.click();
      await dialog
        .getByRole("button", {
          name: lang === "ar" ? "محادثة جديدة" : "New conversation",
          exact: true,
        })
        .click();
      await dialog.waitFor({ state: "hidden" });
      assert.equal(await page.locator("[data-message-id]").count(), 0);
      assert.ok(await trigger.evaluate((el) => el === document.activeElement));
      await trigger.click();
      await page.screenshot({ path: `${out}/${lang}-mobile-sheet.png` });
      const rect = await dialog.boundingBox();
      await page.mouse.click(lang === "ar" ? 5 : 315, rect.y + 100);
      await dialog.waitFor({ state: "hidden" });
      assert.ok(await trigger.evaluate((el) => el === document.activeElement));
    }
  },
);
await check(
  "OS/system reduced motion and automated accessibility",
  async () => {
    for (const [preference, query] of [
      ["reduce", "lang=en"],
      ["no-preference", "lang=en&motion=1"],
    ]) {
      await page.emulateMedia({ reducedMotion: preference });
      await load(query);
      await page.getByRole("button", { name: "Open conversations" }).click();
      const dialog = page.getByRole("dialog");
      const duration = await dialog.evaluate(
        (el) => getComputedStyle(el).animationDuration,
      );
      assert.ok(
        duration.split(",").every((value) => parseFloat(value) <= 0.001),
      );
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await load("lang=en&motion=1");
    assert.equal(
      await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
      true,
    );
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const axe = await page.evaluate(async () =>
      axe.run(document.querySelector("main"), {
        rules: { "color-contrast": { enabled: true } },
      }),
    );
    await writeFile(`${out}/axe.json`, JSON.stringify(axe.violations, null, 2));
    assert.deepEqual(
      axe.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
    );
  },
);
await check("continuous documentation pages", async () => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(base);
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.getByRole("button", { name: "الطرفية", exact: true }).click();
  await page
    .getByRole("heading", { name: "الطرفية", exact: true, level: 1 })
    .waitFor();
  await page.screenshot({
    path: `${out}/terminal-docs-ar.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "تطبيق المحادثة", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "تطبيق المحادثة", exact: true, level: 1 })
    .waitFor();
  const canvas = page.locator(".playground-chat-app"),
    app = canvas.locator(".tz-chat-app");
  assert.ok(
    (await app.boundingBox()).width >= (await canvas.boundingBox()).width - 2,
  );
  await page.screenshot({
    path: `${out}/chat-app-docs-ar.png`,
    fullPage: true,
  });
});
await writeFile(`${out}/results.json`, JSON.stringify(result, null, 2));
await browser.close();
console.log(JSON.stringify(result, null, 2));
if (result.failures.length || result.errors.length) process.exitCode = 1;
