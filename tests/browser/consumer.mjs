import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  rmSync,
  renameSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { install, verify } from "../../scripts/install.mjs";
const workspace = mkdtempSync(join(tmpdir(), "tiraz consumer "));
const original = join(workspace, "original app");
const relocated = join(workspace, "relocated app");
const { mkdirSync } = await import("node:fs");
mkdirSync(original);
let browser, server;
try {
  const manifest = install(original, "src/design library");
  // Move before building; every integration path must survive relocation.
  renameSync(original, relocated);
  assert.ok(verify(relocated) > 0);

  const lock = JSON.parse(
    readFileSync(new URL("../../package-lock.json", import.meta.url), "utf8"),
  );
  const pinned = (names) =>
    Object.fromEntries(
      names.map((name) => {
        const version = lock.packages[`node_modules/${name}`]?.version;
        assert.ok(version, `Missing locked version for ${name}`);
        return [name, version];
      }),
    );
  writeFileSync(
    join(relocated, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      scripts: { build: "tsc --noEmit && vite build" },
      dependencies: pinned(Object.keys(manifest.dependencies)),
      devDependencies: pinned([
        "vite",
        "typescript",
        "@types/react",
        "@types/react-dom",
      ]),
    }),
  );
  writeFileSync(
    join(relocated, "tsconfig.json"),
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
    join(relocated, "index.html"),
    '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tiraz consumer check</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>',
  );
  writeFileSync(
    join(relocated, "src/main.tsx"),
    `import {createRoot} from 'react-dom/client';
import {Components} from './design library/src/examples/Components';
import {Patterns} from './design library/src/examples/Patterns';
import {defaultConfig} from './design library/src/system';
import './design library/styles.css';
const params=new URLSearchParams(location.search);
const direction: 'rtl' | 'ltr'=params.get('direction')==='rtl'?'rtl':'ltr';
const language=direction==='rtl'?'ar':'en';
document.documentElement.lang=language;
const config={...defaultConfig,direction,theme:params.get('theme')==='dark'?'dark' as const:'light' as const,reducedMotion:true};
createRoot(document.getElementById('root')!).render(<><button id="outside">Outside control</button><Components config={config} /><Patterns config={config} language={language} /></>);`,
  );
  console.log(
    "Installing the generated runtime dependency list in an isolated, relocated consumer…",
  );
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
    { cwd: relocated, stdio: "inherit" },
  );
  execFileSync("npm", ["run", "build"], { cwd: relocated, stdio: "inherit" });
  const vite = await import(
    pathToFileURL(join(relocated, "node_modules/vite/dist/node/index.js")).href
  );
  server = await vite.preview({
    root: relocated,
    configFile: false,
    preview: { host: "127.0.0.1", port: 0 },
  });
  const address = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1000, height: 900 },
  });
  const failures = [];
  page.on("pageerror", (error) => failures.push(error.message));
  for (const direction of ["ltr", "rtl"])
    for (const theme of ["light", "dark"]) {
      await page.goto(`${address}/?direction=${direction}&theme=${theme}`);
      const ar = direction === "rtl",
        t = (en, arabic) => (ar ? arabic : en);
      await page
        .getByRole("button", {
          name: t("Run action", "تنفيذ إجراء"),
          exact: true,
        })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: t("Action complete", "اكتمل الإجراء") })
        .waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(
        await page
          .locator(".tiraz-system")
          .first()
          .evaluate((el) =>
            getComputedStyle(el).fontFamily.includes("IBM Plex Sans Arabic"),
          ),
        true,
      );
      assert.equal(
        await page.evaluate(() =>
          document.fonts.check('400 14px "IBM Plex Sans Arabic"', "مرحبا"),
        ),
        true,
      );
      const control = page.getByRole("switch", {
        name: t("Enable notifications", "تفعيل الإشعارات"),
        exact: true,
      });
      await control.focus();
      await page.keyboard.press("Space");
      assert.equal(await control.getAttribute("aria-checked"), "true");
      await page
        .getByRole("tab", { name: t("Invoices", "الفواتير"), exact: true })
        .click();
      assert.equal(await page.getByRole("tabpanel").textContent(), "INV-0042");
      const trigger = page.getByRole("button", {
        name: t("Actions", "الإجراءات"),
        exact: true,
      });
      await trigger.focus();
      await page.keyboard.press("ArrowDown");
      const download = page.getByRole("menuitem", {
        name: t("Download", "تنزيل"),
        exact: true,
      });
      await download.waitFor();
      await page.keyboard.press("Enter");
      await page
        .getByRole("status")
        .filter({ hasText: t("Download requested", "طلب التنزيل") })
        .waitFor();
      const sheetTrigger = page.getByRole("button", {
        name: t("Show details", "عرض التفاصيل"),
        exact: true,
      });
      await sheetTrigger.click();
      assert.equal(
        await page.getByRole("dialog").getAttribute("data-side"),
        ar ? "right" : "left",
      );
      await page
        .getByRole("button", {
          name: t("Invoice actions", "إجراءات الفاتورة"),
          exact: true,
        })
        .first()
        .click();
      const menu = page.getByRole("menu");
      await menu.waitFor();
      assert.equal(
        await menu.evaluate((el) => getComputedStyle(el).direction),
        direction,
      );
      assert.equal(
        await menu.evaluate((el) => !!el.closest(".tz-sheet")),
        true,
      );
      assert.equal(
        await menu.evaluate((el) => getComputedStyle(el).backgroundColor),
        theme === "dark" ? "rgb(28, 34, 30)" : "rgb(255, 255, 255)",
      );
      await page.keyboard.press("Escape");
      await menu.waitFor({ state: "hidden" });
      await page
        .getByRole("button", { name: t("Done", "تم"), exact: true })
        .click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      assert.equal(
        await sheetTrigger.evaluate((el) => document.activeElement === el),
        true,
      );
      await page
        .getByRole("button", {
          name: t("Show notification", "إظهار إشعار"),
          exact: true,
        })
        .click();
      await page.locator(".tz-toast").waitFor();
      await page
        .getByRole("button", {
          name: t("Dismiss notification", "إغلاق الإشعار"),
          exact: true,
        })
        .click();
      await page.locator(".tz-toast").waitFor({ state: "hidden" });
      await page
        .getByRole("button", {
          name: t("Edit customer", "تعديل العميل"),
          exact: true,
        })
        .click();
      await page
        .getByRole("textbox", {
          name: t("Customer name", "اسم العميل"),
          exact: true,
        })
        .fill("Updated Noor");
      await page
        .getByRole("button", {
          name: t("Save customer", "حفظ العميل"),
          exact: true,
        })
        .click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      await page
        .getByRole("button", {
          name: t("Edit customer", "تعديل العميل"),
          exact: true,
        })
        .click();
      assert.equal(
        await page
          .getByRole("textbox", {
            name: t("Customer name", "اسم العميل"),
            exact: true,
          })
          .inputValue(),
        "Updated Noor",
      );
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      await page
        .getByRole("switch", {
          name: t("Billing emails", "رسائل الفوترة"),
          exact: true,
        })
        .click();
      await page
        .getByRole("button", {
          name: t("Save preferences", "حفظ التفضيلات"),
          exact: true,
        })
        .click();
      await page
        .getByText(
          t(
            "Saved billing email preference: Disabled",
            "إعداد رسائل الفوترة المحفوظ: معطّل",
          ),
          { exact: true },
        )
        .waitFor();
      await page
        .getByRole("button", {
          name: t("Invoice actions", "إجراءات الفاتورة"),
          exact: true,
        })
        .click();
      await page
        .getByRole("menuitem", {
          name: t("Mark as paid", "تعيين كمدفوعة"),
          exact: true,
        })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: t("Invoice updated.", "تم تحديث الفاتورة.") })
        .waitFor();
      assert.equal(
        await page
          .locator("#outside")
          .evaluate((el) =>
            getComputedStyle(el).getPropertyValue("--surface-page"),
          ),
        "",
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
      assert.deepEqual(violations, [], `${direction}/${theme} axe violations`);
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        true,
        "Consumer overflows mobile viewport",
      );
      await page
        .getByRole("button", {
          name: t("Edit customer", "تعديل العميل"),
          exact: true,
        })
        .click();
      const mobileDialog = page.getByRole("dialog");
      await mobileDialog.waitFor();
      await mobileDialog.evaluate((el) =>
        Promise.all(el.getAnimations().map((animation) => animation.finished)),
      );
      const bounds = await mobileDialog.boundingBox();
      assert.ok(
        bounds && bounds.x >= -1 && bounds.x + bounds.width <= 391,
        `Sheet overflows mobile viewport: ${JSON.stringify(bounds)}`,
      );
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      await page.setViewportSize({ width: 1000, height: 900 });
      console.log(
        `Passed standalone consumer: ${direction}/${theme}, six components, three patterns, mobile layout, nested portals, font/style loading, focus return, scoped CSS and axe.`,
      );
    }
  assert.deepEqual(failures, [], "Browser runtime errors");
  console.log("Fresh consumer build and browser checks passed.");
} finally {
  await browser?.close();
  if (server)
    await new Promise((done, fail) =>
      server.httpServer.close((error) => (error ? fail(error) : done())),
    );
  rmSync(workspace, { recursive: true, force: true });
}
