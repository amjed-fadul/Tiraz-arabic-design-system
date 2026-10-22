import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { chromium } from "playwright";
import { install } from "../../scripts/install.mjs";
const { values } = parseArgs({
  options: { consumer: { type: "string" }, record: { type: "string" } },
});
if (values.record && !/^[a-z0-9-]+$/.test(values.record))
  throw new Error("Use a simple record name.");
const consumer =
  values.consumer ?? mkdtempSync(join(tmpdir(), "tiraz screen regression "));
const output = resolve(
  values.record ? `evals/pilot/results/${values.record}` : ".artifacts/pilot",
);
mkdirSync(output, { recursive: true });
const report = {
  startedAt: new Date().toISOString(),
  sourceDigest: null,
  compile: null,
  lint: null,
  checks: [],
  runtimeErrors: [],
  screenshots: [],
};
let server, browser;
const save = () =>
  writeFileSync(
    join(output, "results.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
async function check(name, run) {
  try {
    await run();
    report.checks.push({ name, passed: true });
  } catch (error) {
    report.checks.push({ name, passed: false, error: error.message });
  }
  save();
}
try {
  if (!values.consumer) {
    const manifest = install(consumer, "src/design library");
    const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
    const pin = (names) =>
      Object.fromEntries(
        names.map((n) => [n, lock.packages["node_modules/" + n].version]),
      );
    writeFileSync(
      join(consumer, "package.json"),
      JSON.stringify({
        private: true,
        type: "module",
        scripts: { build: "tsc --noEmit && vite build" },
        dependencies: pin(Object.keys(manifest.dependencies)),
        devDependencies: pin([
          "vite",
          "typescript",
          "@types/react",
          "@types/react-dom",
        ]),
      }),
    );
    writeFileSync(
      join(consumer, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ES2023",
          lib: ["ES2023", "DOM", "DOM.Iterable"],
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          types: ["vite/client"],
        },
        include: ["src"],
      }),
    );
    writeFileSync(
      join(consumer, "index.html"),
      '<!doctype html><html lang="ar"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tiraz business pilot</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>',
    );
    for (const file of ["main.tsx", "api.ts", "Pilot.tsx", "pilot.css"])
      copyFileSync(`evals/pilot/app/${file}`, join(consumer, "src", file));
    execFileSync(
      "npm",
      [
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--prefer-offline",
        "--fetch-timeout=30000",
        "--fetch-retries=1",
      ],
      { cwd: consumer, stdio: "pipe" },
    );
  }
  report.sourceDigest = JSON.parse(
    readFileSync(join(consumer, "tiraz.project.json"), "utf8"),
  ).sourceDigest;
  try {
    const log = execFileSync("npm", ["run", "build"], {
      cwd: consumer,
      encoding: "utf8",
      stdio: "pipe",
    });
    writeFileSync(join(output, "build.log"), log);
    report.compile = { passed: true };
  } catch (error) {
    report.compile = {
      passed: false,
      error: String(error.stdout || error.message),
    };
    save();
    process.exitCode = 1;
  }
  const lint = execFileSync(
    resolve("node_modules/.bin/oxlint"),
    ["src/Pilot.tsx", "src/api.ts", "src/main.tsx"],
    { cwd: consumer, encoding: "utf8", stdio: "pipe" },
  );
  report.lint = { passed: true, output: lint };
  save();
  if (!report.compile.passed) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    const vite = await import(
      pathToFileURL(join(consumer, "node_modules/vite/dist/node/index.js")).href
    );
    server = await vite.preview({
      root: consumer,
      configFile: false,
      preview: { host: "127.0.0.1", port: 0 },
    });
    const base = `http://127.0.0.1:${server.httpServer.address().port}`;
    browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    });
    page.on("pageerror", (error) => report.runtimeErrors.push(error.message));
    // Screen-specific assertions below are maintained independently from generated UI.
    await evaluateScreens({ page, base, report, check, output });
    await check("No browser runtime errors", async () =>
      assert.deepEqual(report.runtimeErrors, []),
    );
    report.finishedAt = new Date().toISOString();
    save();
    console.log(
      JSON.stringify(
        { compile: report.compile, checks: report.checks, output },
        null,
        2,
      ),
    );
    if (report.checks.some((c) => !c.passed)) process.exitCode = 1;
  }
} finally {
  await browser?.close();
  if (server)
    await new Promise((done, fail) =>
      server.httpServer.close((error) => (error ? fail(error) : done())),
    );
  if (!values.consumer) rmSync(consumer, { recursive: true, force: true });
}

async function evaluateScreens({ page, base, report, check, output }) {
  page.setDefaultTimeout(5000);
  const words = {
    en: {
      customers: "Customers",
      preferences: "Preferences",
      invoices: "Invoices",
      edit: "Edit customer",
      name: "Company name",
      email: "Billing email",
      save: "Save changes",
      cancel: "Cancel",
      close: "Close",
      billing: "Billing emails",
      reminders: "Payment reminders",
      saved: "Saved preferences",
      details: "View details",
      actions: "Invoice actions",
      pay: "Mark as paid",
      export: "Export",
      cancelRequest: "Cancel request",
      working: "Recording payment…",
      paid: "Paid",
    },
    ar: {
      customers: "العملاء",
      preferences: "التفضيلات",
      invoices: "الفواتير",
      edit: "تعديل العميل",
      name: "اسم الشركة",
      email: "البريد الإلكتروني للفوترة",
      save: "حفظ التغييرات",
      cancel: "إلغاء",
      close: "إغلاق",
      billing: "رسائل الفوترة",
      reminders: "تذكيرات الدفع",
      saved: "التفضيلات المحفوظة",
      details: "عرض التفاصيل",
      actions: "إجراءات الفاتورة",
      pay: "تحديد كمدفوعة",
      export: "تصدير",
      cancelRequest: "إلغاء الطلب",
      working: "جارٍ تسجيل الدفعة…",
      paid: "مدفوعة",
    },
  };
  let probe = 0;
  const load = async (
    lang = "en",
    dir = "ltr",
    theme = "light",
    screen = "customers",
  ) => {
    await page.goto(
      `${base}/?lang=${lang}&dir=${dir}&theme=${theme}&probe=${++probe}#${screen}`,
    );
    await page
      .getByRole("heading", {
        level: 1,
        name: words[lang][screen],
        exact: true,
      })
      .waitFor();
  };
  const button = (name, scope = page) =>
    scope.getByRole("button", { name, exact: true });
  const settle = async () => {
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    await dialog.evaluate((el) =>
      Promise.all(el.getAnimations().map((a) => a.finished)),
    );
    return dialog;
  };
  const callCount = (operation) =>
    page.evaluate(
      (operation) =>
        window.__pilot.calls.filter((c) => c.operation === operation).length,
      operation,
    );
  const payInside = async (t) => {
    await button(t.actions, page.getByRole("dialog")).click();
    await page.getByRole("menuitem", { name: t.pay, exact: true }).click();
  };
  for (const lang of ["en", "ar"]) {
    const t = words[lang],
      dir = lang === "ar" ? "rtl" : "ltr";
    await check(
      `${lang}: customer failure, retained draft and successful retry`,
      async () => {
        await load(lang, dir);
        await button(t.edit).click();
        await settle();
        await page
          .getByRole("textbox", { name: t.name, exact: true })
          .fill("Pilot customer updated");
        await page.evaluate(() => window.__pilot.next("fail"));
        await button(t.save).click();
        await page.getByRole("dialog").getByRole("alert").waitFor();
        assert.equal(
          await page
            .getByRole("textbox", { name: t.name, exact: true })
            .inputValue(),
          "Pilot customer updated",
        );
        await button(t.save).click();
        await page.getByRole("dialog").waitFor({ state: "hidden" });
        await page
          .getByRole("main")
          .getByText("Pilot customer updated", { exact: true })
          .waitFor();
        assert.equal(await callCount("customer"), 2);
      },
    );
    await check(
      `${lang}: customer duplicate submit, cancel and late completion`,
      async () => {
        await load(lang, dir);
        await button(t.edit).click();
        await settle();
        const field = page.getByRole("textbox", { name: t.name, exact: true }),
          saved = await field.inputValue();
        await field.fill("Must not persist");
        await page.evaluate(() => window.__pilot.next("hold"));
        await button(t.save).click();
        // HTML form submission bypasses the disabled button; the async owner must still guard it.
        await page
          .getByRole("dialog")
          .locator("form")
          .evaluate((form) =>
            form.dispatchEvent(
              new Event("submit", { bubbles: true, cancelable: true }),
            ),
          );
        assert.equal(await callCount("customer"), 1);
        await button(t.cancel).click();
        await page.getByRole("dialog").waitFor({ state: "hidden" });
        assert.equal(
          await page.evaluate(() => window.__pilot.calls[0].aborted),
          true,
        );
        await button(t.edit).click();
        await settle();
        await page.evaluate(() => window.__pilot.resolve());
        assert.equal(await field.inputValue(), saved);
        assert.equal(await page.getByRole("dialog").count(), 1);
        await button(t.close).click();
        await page.getByRole("dialog").waitFor({ state: "hidden" });
        assert.equal(
          await button(t.edit).evaluate((el) => el === document.activeElement),
          true,
        );
      },
    );
    await check(
      `${lang}: preferences failure, cancel restores saved values, successful retry`,
      async () => {
        await load(lang, dir, "light", "preferences");
        const toggle = page.getByRole("switch", {
          name: t.billing,
          exact: true,
        });
        assert.equal(await toggle.getAttribute("aria-checked"), "true");
        await toggle.click();
        await page.evaluate(() => window.__pilot.next("fail"));
        await button(t.save).click();
        await page.getByRole("alert").waitFor();
        assert.equal(await toggle.getAttribute("aria-checked"), "false");
        await button(t.cancel).click();
        assert.equal(await toggle.getAttribute("aria-checked"), "true");
        await toggle.click();
        await button(t.save).click();
        await page
          .getByRole("main")
          .getByRole("status")
          .filter({ hasText: lang === "ar" ? "تم حفظ" : "saved" })
          .waitFor();
        const summary = page.getByRole("region", {
          name: t.saved,
          exact: true,
        });
        assert.ok(
          (await summary.innerText()).includes(
            lang === "ar" ? "غير مفعّل" : "Disabled",
          ),
        );
        assert.equal(await callCount("preferences"), 2);
      },
    );
    await check(
      `${lang}: preferences cancellation and navigation abort pending work`,
      async () => {
        await load(lang, dir, "light", "preferences");
        const toggle = page.getByRole("switch", {
          name: t.reminders,
          exact: true,
        });
        await toggle.click();
        await page.evaluate(() => window.__pilot.next("hold"));
        await button(t.save).click();
        await button(t.cancel).click();
        assert.equal(await toggle.getAttribute("aria-checked"), "false");
        assert.equal(
          await page.evaluate(() => window.__pilot.calls[0].aborted),
          true,
        );
        await page.evaluate(() => window.__pilot.resolve());
        await toggle.click();
        await page.evaluate(() => window.__pilot.next("hold"));
        await button(t.save).click();
        await page
          .getByRole("link", { name: t.customers, exact: true })
          .click();
        await page
          .getByRole("heading", { level: 1, name: t.customers, exact: true })
          .waitFor();
        assert.equal(
          await page.evaluate(() => window.__pilot.calls[1].aborted),
          true,
        );
        await page.evaluate(() => window.__pilot.resolve());
      },
    );
    await check(
      `${lang}: nested invoice menu, disabled export, Escape and focus return`,
      async () => {
        await load(lang, dir, "dark", "invoices");
        await button(t.details).click();
        const dialog = await settle();
        await button(t.actions, dialog).focus();
        await page.keyboard.press("ArrowDown");
        const menu = page.getByRole("menu");
        await menu.waitFor();
        assert.equal(
          await menu.evaluate((el) => !!el.closest(".tz-sheet")),
          true,
        );
        assert.equal(
          await menu.evaluate((el) => getComputedStyle(el).direction),
          dir,
        );
        assert.equal(
          await page
            .getByRole("menuitem", { name: t.export, exact: true })
            .getAttribute("aria-disabled"),
          "true",
        );
        await page.keyboard.press("Escape");
        await menu.waitFor({ state: "hidden" });
        assert.equal(
          await button(t.actions, dialog).evaluate(
            (el) => el === document.activeElement,
          ),
          true,
        );
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "hidden" });
        assert.equal(
          await button(t.details).evaluate(
            (el) => el === document.activeElement,
          ),
          true,
        );
        assert.equal(await callCount("invoice"), 0);
      },
    );
    await check(
      `${lang}: invoice failure and retry update status only after success`,
      async () => {
        await load(lang, dir, "light", "invoices");
        await button(t.details).click();
        await settle();
        await page.evaluate(() => window.__pilot.next("fail"));
        await payInside(t);
        await page.getByRole("dialog").getByRole("alert").waitFor();
        assert.equal(
          await page
            .getByRole("dialog")
            .getByText(t.paid, { exact: true })
            .count(),
          0,
        );
        await payInside(t);
        await page
          .getByRole("dialog")
          .getByText(t.paid, { exact: true })
          .waitFor();
        assert.equal(await callCount("invoice"), 2);
        await button(t.actions, page.getByRole("dialog")).click();
        assert.equal(
          await page
            .getByRole("menuitem", { name: t.pay, exact: true })
            .getAttribute("aria-disabled"),
          "true",
        );
      },
    );
    await check(
      `${lang}: pending invoice cancellation ignores completion`,
      async () => {
        await load(lang, dir, "light", "invoices");
        await button(t.details).click();
        await settle();
        await page.evaluate(() => window.__pilot.next("hold"));
        await payInside(t);
        await button(t.cancelRequest, page.getByRole("dialog")).click();
        await page.evaluate(() => window.__pilot.resolve());
        assert.equal(
          await page.evaluate(() => window.__pilot.calls[0].aborted),
          true,
        );
        assert.equal(
          await page
            .getByRole("dialog")
            .getByText(t.paid, { exact: true })
            .count(),
          0,
        );
      },
    );
  }
  const configurations = [
    ["ar", "rtl", "light"],
    ["ar", "rtl", "dark"],
    ["en", "ltr", "light"],
    ["en", "ltr", "dark"],
    ["ar", "ltr", "light"],
    ["ar", "ltr", "dark"],
  ];
  for (const [lang, dir, theme] of configurations)
    for (const screen of ["customers", "preferences", "invoices"]) {
      await check(
        `${screen} ${lang}/${dir}/${theme}: desktop/mobile layout, locale and axe`,
        async () => {
          await page.setViewportSize({ width: 1280, height: 900 });
          await load(lang, dir, theme, screen);
          assert.equal(
            await page.locator(".tiraz-system").count(),
            1,
            "Reuse the application provider",
          );
          assert.equal(
            await page
              .getByRole("main")
              .evaluate((el) => getComputedStyle(el).direction),
            dir,
          );
          assert.equal(
            await page.locator("[lang]").last().getAttribute("lang"),
            lang,
          );
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            true,
            "Desktop horizontal overflow",
          );
          await page.addScriptTag({
            path: resolve("node_modules/axe-core/axe.min.js"),
          });
          const violations = await page.evaluate(async () =>
            (
              await window.axe.run(document, {
                runOnly: {
                  type: "tag",
                  values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
                },
              })
            ).violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              nodes: v.nodes.map((n) => n.target),
            })),
          );
          assert.deepEqual(violations, [], "axe violations");
          if (screen === "invoices") {
            const expected = new Intl.NumberFormat(
              lang === "ar" ? "ar-AE" : "en-AE",
              { style: "currency", currency: "AED" },
            ).format(4250.75);
            assert.ok(
              (await page.getByRole("main").innerText()).includes(expected),
              "Explicit locale formatting",
            );
          }
          if (
            lang === "ar" &&
            dir === "rtl" &&
            theme === "light" &&
            screen === "customers"
          ) {
            const file = "customers-desktop.png";
            await page.screenshot({ path: join(output, file), fullPage: true });
            report.screenshots.push(file);
          }
          await page.setViewportSize({ width: 390, height: 844 });
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            true,
            "Mobile horizontal overflow",
          );
          if (
            lang === "ar" &&
            dir === "rtl" &&
            theme === "light" &&
            screen === "preferences"
          ) {
            const file = "preferences-mobile.png";
            await page.screenshot({ path: join(output, file), fullPage: true });
            report.screenshots.push(file);
          }
          if (screen !== "preferences") {
            await button(
              screen === "customers" ? words[lang].edit : words[lang].details,
            ).click();
            const dialog = await settle();
            const bounds = await dialog.boundingBox();
            assert.ok(
              bounds && bounds.x >= -1 && bounds.x + bounds.width <= 391,
              "Dialog mobile geometry",
            );
            const modalViolations = await page.evaluate(async () =>
              (
                await window.axe.run(document.querySelector("[role=dialog]"), {
                  runOnly: {
                    type: "tag",
                    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
                  },
                })
              ).violations.map((v) => ({
                id: v.id,
                nodes: v.nodes.map((n) => n.target),
              })),
            );
            assert.deepEqual(modalViolations, [], "Dialog axe violations");
            if (
              lang === "ar" &&
              dir === "rtl" &&
              theme === "dark" &&
              screen === "invoices"
            ) {
              const file = "invoice-mobile-dark.png";
              await page.screenshot({
                path: join(output, file),
                fullPage: true,
              });
              report.screenshots.push(file);
            }
          }
        },
      );
    }
}
