import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5247",
  evidence = "docs/file-tree/browser";
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
});
let page = await context.newPage();
page.setDefaultTimeout(30000);
const errors = [],
  matrix = [],
  checks = [];
page.on("pageerror", (e) => errors.push(e.message));
const pass = (name) => {
  checks.push(name);
  console.log("PASS " + name);
};
const url = (
  lang = "en",
  theme = "light",
  density = "compact",
  typography = "standard",
  motion = false,
) =>
  `${base}/tests/browser/file-tree-fixture.html?lang=${lang}&theme=${theme}&density=${density}&typography=${typography}&motion=${motion}`;
const focused = async (name) =>
  assert.ok(
    await page
      .getByRole("tree", { name: "Probe files" })
      .getByRole("treeitem", { name, exact: true })
      .evaluate((el) => el === document.activeElement),
    name + " focused",
  );
try {
  for (const lang of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const width of [1440, 320])
        for (const density of ["compact", "standard"])
          for (const typography of ["standard", "large"]) {
            await page.setViewportSize({ width, height: 1000 });
            await page.goto(url(lang, theme, density, typography));
            await page
              .getByRole("heading", { name: "FileTree", exact: true })
              .waitFor();
            await page.evaluate(() => document.fonts.ready);
            const tree = page
              .getByRole("region", { name: "Project example" })
              .getByRole("tree");
            const docs = tree.getByRole("treeitem", {
              name: lang === "ar" ? "التوثيق" : "docs",
              exact: true,
            });
            await docs.click();
            await tree
              .getByRole("treeitem", {
                name: "دليل-project-setup-and-contribution-notes.md",
                exact: true,
              })
              .click();
            const geometry = await page.evaluate(() => ({
              viewport: innerWidth,
              document: document.documentElement.scrollWidth,
              rows: [...document.querySelectorAll(".tz-file-tree-row")].map(
                (el) => ({
                  width: el.clientWidth,
                  scroll: el.scrollWidth,
                  height: el.getBoundingClientRect().height,
                }),
              ),
              font: getComputedStyle(
                document.querySelector(".tz-file-tree-name"),
              ).fontSize,
            }));
            const alignment = await tree
              .locator(".tz-file-tree-item")
              .evaluateAll((items) =>
                items.map((item) => {
                  const row = item.querySelector(".tz-file-tree-row"),
                    icon = row
                      .querySelector(".tz-file-tree-icon")
                      .getBoundingClientRect(),
                    name = row
                      .querySelector(".tz-file-tree-name bdi")
                      .getBoundingClientRect();
                  return getComputedStyle(row).direction === "rtl"
                    ? icon.left - name.right
                    : name.left - icon.right;
                }),
              );
            assert.ok(
              alignment.every((gap) => gap >= 0 && gap < 15),
              JSON.stringify(alignment),
            );
            assert.ok(geometry.document <= width, JSON.stringify(geometry));
            assert.ok(geometry.rows.every((row) => row.width >= row.scroll));
            assert.ok(
              (
                await page
                  .getByRole("region", {
                    name: lang === "ar" ? "معاينة الملف" : "File preview",
                  })
                  .innerText()
              ).includes(lang === "ar" ? "دليل المشروع" : "Project guide"),
            );
            matrix.push({
              lang,
              theme,
              width,
              density,
              typography,
              ...geometry,
            });
            console.log(
              `CAPTURE ${lang} ${theme} ${width} ${density} ${typography}`,
            );
            await page.screenshot({
              path: `${evidence}/${lang}-${theme}-${width}-${density}-${typography}.png`,
              fullPage: true,
              animations: "disabled",
            });
            // Dispose each document between captures to avoid Chrome's long-navigation capture stall.
            await page.close();
            page = await context.newPage();
            page.setDefaultTimeout(30000);
            page.on("pageerror", (e) => errors.push(e.message));
          }
  pass(
    "32 rendered language/theme/width/density/typography cases; mixed long names and preview fit, all rows stay within width",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(url());
  const probe = page.getByRole("region", { name: "Focus probe" }),
    tree = probe.getByRole("tree"),
    item = (name) => tree.getByRole("treeitem", { name, exact: true });
  await item("src").focus();
  await page.keyboard.press("ArrowDown");
  await focused("components");
  await page.keyboard.press("ArrowDown");
  await focused("App.tsx");
  assert.equal(await item("App.tsx").getAttribute("aria-selected"), "false");
  await page.keyboard.press("Space");
  assert.equal(await item("App.tsx").getAttribute("aria-selected"), "true");
  assert.equal(
    await probe.getByLabel("Activation").innerText(),
    "No activation",
  );
  await page.keyboard.press("Enter");
  assert.equal(await probe.getByLabel("Activation").innerText(), "App.tsx");
  await page.keyboard.press("End");
  await focused("README.md");
  await page.keyboard.press("Home");
  await focused("src");
  await page.keyboard.type("b");
  await focused("Button.tsx");
  await page.keyboard.type("b");
  await focused("base.css");
  await page.keyboard.press("ArrowLeft");
  await focused("src");
  await item("components").focus();
  await page.keyboard.press("ArrowLeft");
  assert.equal(await item("components").getAttribute("aria-expanded"), "false");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await focused("App.tsx");
  assert.equal(await tree.locator('[tabindex="0"]').count(), 1);
  await page.keyboard.press("Tab");
  assert.ok(
    await probe
      .getByRole("button", { name: "Outside", exact: true })
      .evaluate((el) => el === document.activeElement),
  );
  pass(
    "LTR visible-node arrows/Home/End, repeated-letter typeahead, one tab stop, selection separate from focus, Space selects and Enter activates",
  );
  await item("App.tsx").focus();
  await page.keyboard.press("ArrowDown");
  await probe.screenshot({
    path: `${evidence}/focus-distinct-from-selection.png`,
  });
  await writeFile(
    `${evidence}/tree-accessibility-snapshot.txt`,
    await tree.ariaSnapshot(),
  );
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const axe = await page.evaluate(async () => {
    const result = await window.axe.run({ include: [[".tz-file-tree"]] });
    return {
      violations: result.violations,
      incomplete: result.incomplete.map((item) => ({
        id: item.id,
        impact: item.impact,
      })),
      passes: result.passes.length,
    };
  });
  assert.deepEqual(axe.violations, []);
  await writeFile(`${evidence}/axe.json`, JSON.stringify(axe, null, 2));
  pass(
    "Axe DOM scan of populated and empty trees: no violations; distinct row focus/selection screenshot and accessible tree snapshot saved",
  );

  await probe.getByRole("button", { name: "Collapse nested later" }).click();
  await item("App.tsx").focus();
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("aria-expanded") === "false",
  );
  await focused("components");
  await probe.getByRole("button", { name: "Restore", exact: true }).click();
  await probe.getByRole("button", { name: "Remove branch later" }).click();
  await item("App.tsx").focus();
  await page.waitForFunction(
    () => document.activeElement?.textContent === "README.md",
  );
  await focused("README.md");
  await probe.getByRole("button", { name: "Clear later" }).click();
  await item("README.md").focus();
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("role") === "tree",
  );
  assert.equal(await tree.getAttribute("tabindex"), "0");
  await probe.getByRole("button", { name: "Supply data later" }).click();
  await tree.focus();
  await page.waitForFunction(
    () =>
      document.activeElement?.textContent?.startsWith("src") &&
      document.activeElement?.getAttribute("role") === "treeitem",
  );
  await focused("src");
  await probe.getByRole("button", { name: "Restore", exact: true }).click();
  await probe.getByRole("button", { name: "Reorder later" }).click();
  await item("App.tsx").focus();
  await page.waitForFunction(
    () =>
      document.querySelector('[aria-label="Probe files"] [role="treeitem"]')
        ?.textContent === "README.md",
  );
  await focused("App.tsx");
  await probe.getByRole("button", { name: "Remove branch later" }).click();
  await item("App.tsx").focus();
  await probe.getByRole("button", { name: "Outside", exact: true }).focus();
  await page.waitForFunction(
    () =>
      document.querySelectorAll('[aria-label="Probe files"] [role="treeitem"]')
        .length === 1,
  );
  assert.ok(
    await probe
      .getByRole("button", { name: "Outside", exact: true })
      .evaluate((el) => el === document.activeElement),
  );
  await probe.getByRole("button", { name: "Restore", exact: true }).click();
  await probe.getByRole("button", { name: "Remove branch later" }).click();
  await item("App.tsx").focus();
  await probe.getByRole("heading", { name: "Nonfocusable outside" }).click();
  await page.waitForFunction(
    () =>
      document.querySelectorAll('[aria-label="Probe files"] [role="treeitem"]')
        .length === 1,
  );
  assert.ok(
    await page.evaluate(() => document.activeElement === document.body),
  );
  pass(
    "Timed controlled nested collapse, branch deletion, empty update, reorder and outside focus/button or nonfocusable heading preserve predictable focus",
  );
  await page.goto(url("ar"));
  const rtl = page.getByRole("tree", { name: "Probe files" });
  await rtl.getByRole("treeitem", { name: "src", exact: true }).focus();
  await page.keyboard.press("ArrowLeft");
  await focused("components");
  await page.keyboard.press("ArrowLeft");
  await focused("App.tsx");
  await page.keyboard.press("ArrowRight");
  await focused("components");
  pass("RTL horizontal arrows expand into child and return to parent");
  await page.goto(url("ar", "dark", "standard", "large", true));
  assert.ok(
    await page
      .locator(".tz-file-tree-chevron")
      .evaluateAll((els) =>
        els.every(
          (el) => parseFloat(getComputedStyle(el).transitionDuration) === 0,
        ),
      ),
  );
  await page.goto(url());
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.ok(
    await page
      .locator(".tz-file-tree-chevron")
      .evaluateAll((els) =>
        els.every(
          (el) => parseFloat(getComputedStyle(el).transitionDuration) < 0.01,
        ),
      ),
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  pass("Provider and OS reduced motion disable chevron transitions");
  await page.goto(base);
  await page.getByRole("button", { name: "شجرة الملفات", exact: true }).click();
  await page
    .getByRole("region", { name: "المعاينة التفاعلية", exact: true })
    .getByRole("treeitem", { name: "tokens.css", exact: true })
    .click();
  await page.screenshot({
    path: `${evidence}/docs-ar-light-desktop.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "نسخ الكود", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('[aria-label="نسخ الكود"]')?.dataset.copyState ===
      "copied",
  );
  const code = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(code.includes("FileTreeExample") && code.includes("onActivate"));
  await page.getByRole("button", { name: "نسخ الطلب", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('[aria-label="نسخ الطلب"]')?.dataset.copyState ===
      "copied",
  );
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(prompt.includes(code));
  await writeFile(`${evidence}/copied-prompt.txt`, prompt);
  await page.setViewportSize({ width: 320, height: 1000 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: `${evidence}/docs-ar-light-320.png`,
    fullPage: true,
  });
  await page.getByRole("combobox", { name: "لغة التوثيق" }).selectOption("en");
  await page.getByRole("button", { name: "Toggle theme", exact: true }).click();
  await page.screenshot({
    path: `${evidence}/docs-en-dark-320.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: `${evidence}/docs-en-dark-desktop.png`,
    fullPage: true,
  });
  pass(
    "Continuous Files docs, application preview, clipboard code/prompt synchronization and 320px documentation",
  );
  assert.deepEqual(errors, []);
  await writeFile(
    `${evidence}/results.json`,
    JSON.stringify({ checks, matrix, errors }, null, 2),
  );
} finally {
  await browser.close();
}
