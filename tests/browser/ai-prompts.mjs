import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { join } from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const evidence =
  process.env.TIRAZ_EVIDENCE || "docs/ai-instruction-evidence/prompts";
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.TIRAZ_BROWSER
    ? { executablePath: process.env.TIRAZ_BROWSER }
    : {}),
});
const context = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
const checks = [];
try {
  for (const width of [1440, 320])
    for (const language of ["ar", "en"]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(process.env.TIRAZ_URL || "http://127.0.0.1:5187");
      await page
        .getByLabel(/لغة التوثيق|Documentation language/)
        .selectOption(language);
      await page.evaluate(() => document.fonts.ready);
      const row = page.locator(".prompt-row");
      await row.getByRole("button").click();
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      const codeName = language === "ar" ? "الكود" : "Code";
      await page.getByRole("tab", { name: codeName, exact: true }).click();
      const code = await page
        .getByRole("region", { name: `${codeName}: src/Example.tsx` })
        .locator("pre code")
        .textContent();
      for (const path of [
        "ai/README.md",
        "ai/registry.json",
        "ai/composition.md",
        "index.ts",
        "config.ts",
        "Provider.tsx",
      ])
        assert.ok(copied.includes(path), path);
      assert.ok(
        copied.includes(code.trim()),
        "clipboard must include complete generated usage code",
      );
      assert.ok(copied.includes("SystemProvider:"));
      assert.ok(!copied.includes("/Users/"));
      assert.ok(
        copied.includes(language === "ar" ? "نسخة المصدر" : "source copy"),
      );
      assert.ok(copied.includes(language === "ar" ? "عدّل" : "Adjust"));
      const geometry = await row.evaluate((el) => {
        const text = el.querySelector(".prompt-preview"),
          button = el.querySelector("button");
        const a = text.getBoundingClientRect(),
          b = button.getBoundingClientRect(),
          s = getComputedStyle(text);
        return {
          whiteSpace: s.whiteSpace,
          overflow: s.overflow,
          sameRow: Math.abs(a.top + a.height / 2 - (b.top + b.height / 2)) < 2,
          buttonInsideViewport: b.left >= 0 && b.right <= innerWidth,
          isolatedPaths: Array.from(text.querySelectorAll("bdi[dir=ltr]")).map(
            (node) => node.textContent,
          ),
          documentOverflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      assert.equal(geometry.whiteSpace, "nowrap");
      assert.equal(geometry.overflow, "hidden");
      assert.ok(geometry.sameRow && geometry.buttonInsideViewport);
      assert.equal(geometry.documentOverflow, false);
      for (const path of [
        "ai/README.md",
        "ai/registry.json",
        "ai/composition.md",
        "./system/tokens.css",
      ])
        assert.ok(geometry.isolatedPaths.includes(path));
      await page.screenshot({
        path: join(evidence, `${language}-${width}.png`),
      });
      checks.push({
        language,
        width,
        clipboardLength: copied.length,
        codeLength: code.length,
        geometry,
      });
    }
  await writeFile(
    join(evidence, "results.json"),
    JSON.stringify({ checks, failures: [] }, null, 2),
  );
  console.log(
    `Passed ${checks.length} bilingual desktop/narrow prompt and clipboard checks.`,
  );
} finally {
  await browser.close();
}
