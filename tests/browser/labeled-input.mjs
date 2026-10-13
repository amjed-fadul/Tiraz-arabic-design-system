import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5174";
const stage = process.env.TIRAZ_STAGE || "after";
const out = process.env.TIRAZ_EVIDENCE || `docs/input-convenience/${stage}`;
await mkdir(out, { recursive: true });
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
page.setDefaultTimeout(8000);
const report = { captures: [], checks: [], errors: [] };
page.on("pageerror", (error) => report.errors.push(error.message));
async function load(language, theme, width, active = "input") {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(base);
  await page.evaluate(
    ({ language, theme, active }) => {
      localStorage.clear();
      localStorage.setItem(
        "tiraz.documentation.v2",
        JSON.stringify({
          language,
          active,
          systemPanelOpen: true,
          inspectorOpen: true,
        }),
      );
      localStorage.setItem("tiraz.theme.v1", JSON.stringify(theme));
      localStorage.setItem(
        "tiraz.playgrounds.v2",
        JSON.stringify({
          input: {
            label: language === "ar" ? "اسم العميل" : "Customer name",
            helper:
              language === "ar"
                ? "كما يظهر في الفاتورة"
                : "As shown on the invoice",
            error:
              language === "ar" ? "أدخل اسم العميل." : "Enter a customer name.",
            required: true,
            size: "sm",
          },
        }),
      );
    },
    { language, theme, active },
  );
  await page.reload();
  await page
    .getByRole("heading", {
      level: 1,
      name:
        active === "input"
          ? language === "ar"
            ? "الإدخال"
            : "Input"
          : language === "ar"
            ? "اللوحة الجانبية"
            : "Sheet",
      exact: true,
    })
    .waitFor();
  await page.evaluate(() => document.fonts.ready);
}
try {
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"])
      for (const width of [1440, 390]) {
        await load(language, theme, width);
        const name = `input-${language}-${theme}-${width}.png`;
        await page.screenshot({ path: `${out}/${name}` });
        report.captures.push(name);
        const input = page.locator(".playground-canvas").getByRole("textbox");
        assert.equal(await input.getAttribute("aria-invalid"), "true");
        assert.equal(await input.getAttribute("required"), "");
        const ids = (await input.getAttribute("aria-describedby")).split(" ");
        assert.equal(ids.length, 2);
        for (const id of ids)
          assert.equal(await page.locator(`[id="${id}"]`).count(), 1);
        if (stage === "after") {
          assert.equal(
            await page.locator(".examples-section .customer-example").count(),
            0,
          );
          assert.equal(
            await page.locator(".examples-section .tz-input").count(),
            5,
          );
          // All example controls inherit the same shared appearance as the preview.
          const styles = await page
            .locator(".playground-canvas .tz-input,.examples-section .tz-input")
            .evaluateAll((nodes) =>
              nodes.map((node) => ({
                direction: getComputedStyle(node).direction,
                action: getComputedStyle(node)
                  .getPropertyValue("--action")
                  .trim(),
              })),
            );
          assert.ok(
            styles.every(
              (style) =>
                style.direction === (language === "ar" ? "rtl" : "ltr") &&
                style.action === styles[0].action,
            ),
          );
          report.checks.push(
            `${language} ${theme} ${width}: direct Input examples, associations and shared appearance`,
          );
        }
        await load(language, theme, width, "sheet");
        await page
          .getByRole("button", {
            name: language === "ar" ? "إنشاء عميل" : "Create customer",
            exact: true,
          })
          .click();
        await page.getByRole("dialog").waitFor();
        await page
          .getByRole("dialog")
          .evaluate((el) =>
            Promise.all(
              el.getAnimations().map((animation) => animation.finished),
            ),
          );
        const sheetName = `sheet-${language}-${theme}-${width}.png`;
        await page.screenshot({ path: `${out}/${sheetName}` });
        report.captures.push(sheetName);
        if (stage === "after") {
          await page
            .getByRole("button", {
              name: language === "ar" ? "حفظ العميل" : "Save customer",
              exact: true,
            })
            .click();
          const customerName = page.getByRole("textbox", {
            name: language === "ar" ? "اسم العميل" : "Customer name",
            exact: true,
          });
          assert.ok(
            await customerName.evaluate(
              (node) => node === document.activeElement,
            ),
          );
          await customerName.fill("مدار ACME");
          await page
            .getByRole("textbox", {
              name: language === "ar" ? "البريد الإلكتروني" : "Email",
              exact: true,
            })
            .fill("hello@acme.example");
          await page
            .getByRole("button", {
              name: language === "ar" ? "حفظ العميل" : "Save customer",
              exact: true,
            })
            .dblclick();
          await page.getByRole("dialog").waitFor({ state: "detached" });
          assert.equal(
            await page
              .getByRole("list", {
                name: language === "ar" ? "العملاء" : "Customers",
                exact: true,
              })
              .locator("li")
              .count(),
            1,
          );
          report.checks.push(
            `${language} ${theme} ${width}: Sheet validates, focuses, saves once`,
          );
        }
      }
  if (stage === "after") {
    await load("en", "light", 1440);
    await page.evaluate(() => {
      localStorage.setItem(
        "tiraz.documentation.v2",
        JSON.stringify({
          language: "en",
          active: "field",
          systemPanelOpen: true,
          inspectorOpen: true,
        }),
      );
    });
    await page.reload();
    await page
      .getByRole("heading", { name: "Input", level: 1, exact: true })
      .waitFor();
    assert.equal(
      await page
        .locator(".docs-sidebar")
        .getByRole("button", { name: "Field", exact: true })
        .count(),
      0,
    );
    const rail = page.locator(".customization-rail");
    const preview = page.locator(".playground-canvas").getByRole("textbox");
    const initialId = await preview.getAttribute("id");
    await rail.getByLabel("Label", { exact: true }).fill("Saved label");
    await rail.getByLabel("Helper text", { exact: true }).fill("Saved helper");
    await rail.getByLabel("Error message", { exact: true }).fill("Saved error");
    await rail.getByLabel("Size", { exact: true }).selectOption("md");
    assert.equal(await preview.getAttribute("id"), initialId);
    await rail.getByLabel("Error message", { exact: true }).fill("");
    assert.notEqual(await preview.getAttribute("aria-invalid"), "true");
    assert.ok(
      !(await preview.getAttribute("aria-describedby")).includes("-error"),
    );
    await rail.getByLabel("Error message", { exact: true }).fill("Saved error");
    await rail.getByRole("switch", { name: "Required", exact: true }).click();
    assert.equal(await preview.getAttribute("required"), null);
    await rail.getByRole("switch", { name: "Read only", exact: true }).click();
    assert.equal(await preview.getAttribute("readonly"), "");
    await rail.getByRole("switch", { name: "Disabled", exact: true }).click();
    assert.equal(await preview.isDisabled(), true);
    await rail.getByRole("switch", { name: "Disabled", exact: true }).click();

    assert.equal(
      await rail.getByRole("switch", { name: "Invalid", exact: true }).count(),
      0,
    );
    await rail.getByLabel("Density", { exact: true }).selectOption("standard");
    await rail.getByLabel("Accent", { exact: true }).selectOption("blue");
    await rail.getByLabel("Typography", { exact: true }).selectOption("large");
    await rail.getByLabel("Corner radius", { exact: true }).focus();
    await page.keyboard.press("End");
    const controls = await page
      .locator(".playground-canvas .tz-input,.examples-section .tz-input")
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          height: node.getBoundingClientRect().height,
          font: getComputedStyle(node).fontSize,
          radius: getComputedStyle(node).borderRadius,
          action: getComputedStyle(node).getPropertyValue("--action").trim(),
        })),
      );
    assert.ok(
      controls.every(
        (control) =>
          control.font === "16px" &&
          control.radius === "16px" &&
          control.action === "#365B87",
      ),
    );
    assert.equal(controls[0].height, 40);
    assert.ok(controls.slice(1).every((control) => control.height === 36));
    report.checks.push({ sharedCustomization: controls });
    await page.getByRole("button", { name: "Copy code", exact: true }).click();
    const code = await page.evaluate(() => navigator.clipboard.readText());
    assert.ok(code.includes('<Input label={"Saved label"}'));
    assert.ok(code.includes('helper={"Saved helper"}'));
    assert.ok(code.includes('error={"Saved error"}'));
    assert.ok(!code.includes("<Field"));
    assert.ok(code.includes("export default function Example()"));
    assert.ok(code.includes('density: "standard"'));
    assert.ok(code.includes('accent: "blue"'));
    await page
      .getByRole("button", { name: "Copy agent prompt", exact: true })
      .click();
    const prompt = await page.evaluate(() => navigator.clipboard.readText());
    assert.ok(prompt.includes(code));
    assert.ok(prompt.includes("ai/registry.json"));
    const promptRow = await page.locator(".prompt-row").count();
    assert.equal(promptRow, 1);
    assert.ok((await page.locator(".prompt-row").boundingBox()).height <= 60); // Layout is also inspected visually.
    await page.reload();
    await page
      .getByRole("heading", { name: "Input", level: 1, exact: true })
      .waitFor();
    assert.equal(
      await rail.getByLabel("Label", { exact: true }).inputValue(),
      "Saved label",
    );
    assert.equal(
      await rail.getByLabel("Helper text", { exact: true }).inputValue(),
      "Saved helper",
    );
    assert.equal(
      await rail.getByLabel("Size", { exact: true }).inputValue(),
      "md",
    );
    report.checks.push({
      savedPageRedirect: true,
      customizationPersists: true,
      codeLength: code.length,
      promptLength: prompt.length,
      promptRow,
    });
    await page.getByText("API reference", { exact: true }).click();
    await page
      .getByText("Field · composition helper", { exact: true })
      .waitFor();
    await page
      .locator(".docs-sidebar nav")
      .getByRole("button", { name: "Select", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Create customer", exact: true })
        .count(),
      0,
    );
    report.checks.push(
      "Field composition API disclosed under Input; Select stays component-focused",
    );
  }
  assert.deepEqual(report.errors, []);
} finally {
  await writeFile(
    `${out}/results.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
