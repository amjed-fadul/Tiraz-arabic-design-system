import { createRequire } from "node:module";
import { writeFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const evidenceDir = process.env.TIRAZ_EVIDENCE || "docs/review-evidence";
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.TIRAZ_BROWSER
    ? { executablePath: process.env.TIRAZ_BROWSER }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5176";
const report = {
  system: [],
  contextual: [],
  pages: [],
  overlays: [],
  clipboard: [],
  persistence: [],
  resets: [],
  errors: [],
  failures: [],
};
page.on("pageerror", (e) => report.errors.push(e.message));
import { ids, names } from "./inventory.mjs";
let lang = "en";
const label = (en, ar) => (lang === "en" ? en : ar);
const rail = () => page.locator(".customization-rail");
const canvas = () => page.locator(".playground-canvas");
const code = () => page.locator(".usage-section pre code");
async function check(name, fn) {
  try {
    await fn();
  } catch (e) {
    report.failures.push({ name, error: e.message, stack: e.stack });
  }
}
async function nav(i) {
  if (await page.locator(".docs-sidebar").isVisible())
    await page
      .locator(".docs-sidebar nav")
      .getByRole("button", { name: names[lang][i], exact: true })
      .click();
  else {
    await page.locator(".mobile-navigation button").click();
    await page
      .locator(".docs-drawer nav")
      .getByRole("button", { name: names[lang][i], exact: true })
      .click();
    await page.waitForFunction(() => !document.querySelector(".docs-drawer"));
  }
  await page
    .getByRole("heading", { name: names[lang][i], level: 1, exact: true })
    .waitFor();
}
async function select(en, ar, value) {
  await rail().getByLabel(label(en, ar), { exact: true }).selectOption(value);
}
async function fill(en, ar, value) {
  const el = rail().getByLabel(label(en, ar), { exact: true });
  if ((await el.getAttribute("type")) === "range") {
    await el.focus();
    await el.press(value === "0" ? "Home" : "End");
  } else await el.fill(value);
}
async function setMotion(value) {
  const el = rail().getByRole("switch", {
    name: label("Reduce motion", "تقليل الحركة"),
    exact: true,
  });
  if ((await el.getAttribute("aria-checked")) !== String(value))
    await el.click();
}
async function metrics() {
  return await page.evaluate(() => {
    function read(el) {
      const s = getComputedStyle(el),
        r = el.getBoundingClientRect();
      return {
        class: el.className,
        height: r.height,
        width: r.width,
        color: s.color,
        background: s.backgroundColor,
        font: s.fontSize,
        radius: s.borderRadius,
        padding: s.paddingBlock,
        gap: s.gap,
        transition: s.transitionDuration,
        animation: s.animationDuration,
        direction: s.direction,
        action: s.getPropertyValue("--action"),
        surface: s.getPropertyValue("--surface"),
        control: s.getPropertyValue("--control-height"),
      };
    }
    return {
      preview: [
        ...document.querySelectorAll(
          ".playground-canvas :is(.tz-button,.tz-tab,.tz-switch,.tz-switch-field,.tz-input,.tz-select-trigger)",
        ),
      ].map(read),
      examples: [
        ...document.querySelectorAll(
          ".examples-canvas :is(.tz-button,.tz-tab,.tz-switch,.tz-input,.tz-select-trigger)",
        ),
      ].map(read),
      providers: [
        ...document.querySelectorAll(
          ".playground-region .tiraz-system,.examples-section .tiraz-system",
        ),
      ].map((el) => ({
        ...el.dataset,
        action: getComputedStyle(el).getPropertyValue("--action"),
        radius: getComputedStyle(el).getPropertyValue("--radius"),
        font: getComputedStyle(el).fontSize,
      })),
    };
  });
}
async function saved() {
  return page.evaluate(() => ({
    system: JSON.parse(localStorage.getItem("tiraz.system.v3")),
    theme: JSON.parse(localStorage.getItem("tiraz.theme.v1")),
    props: JSON.parse(localStorage.getItem("tiraz.playgrounds.v2")),
    docs: JSON.parse(localStorage.getItem("tiraz.documentation.v2")),
  }));
}
await mkdir(evidenceDir, { recursive: true });
await page.goto(base);
await page.getByLabel("لغة التوثيق").selectOption("en");
for (let i = 0; i < ids.length; i++) {
  await nav(i);
  await check(`${ids[i]} system controls`, async () => {
    await rail()
      .getByRole("button", { name: "Reset system", exact: true })
      .click();
    await select("Density", "الكثافة", "standard");
    let before = await metrics();
    await select("Density", "الكثافة", "compact");
    let after = await metrics();
    report.system.push({
      component: ids[i],
      control: "density",
      before,
      after,
    });
    await select("Typography", "حجم النص", "large");
    const large = await metrics();
    assert.equal(large.providers[0].font, "16px");
    assert.equal(large.providers[1].font, "16px");
    report.system.push({
      component: ids[i],
      control: "typography",
      metrics: large,
    });
    await select("Typography", "حجم النص", "standard");
    for (const accent of ["sage", "blue", "plum", "clay"]) {
      await select("Accent", "اللون الأساسي", accent);
      const m = await metrics();
      assert.equal(m.providers[0].action, m.providers[1].action);
      report.system.push({
        component: ids[i],
        control: "accent",
        accent,
        metrics: m,
      });
    }
    await fill("Corner radius", "استدارة الزوايا", "16");
    let m = await metrics();
    assert.equal(m.providers[0].radius, "16px");
    assert.equal(m.providers[1].radius, "16px");
    report.system.push({ component: ids[i], control: "corners", metrics: m });
    await setMotion(true);
    m = await metrics();
    for (const r of [...m.preview, ...m.examples]) {
      assert.ok(r.transition.split(",").every((s) => parseFloat(s) === 0));
      assert.ok(r.animation.split(",").every((s) => parseFloat(s) <= 0.00001));
    }
    report.system.push({ component: ids[i], control: "motion", metrics: m });
    await page
      .getByRole("button", { name: "Toggle theme", exact: true })
      .click();
    m = await metrics();
    assert.ok(
      await page
        .locator(".tiraz-system")
        .evaluateAll((els) => els.every((el) => el.dataset.theme === "dark")),
    );
    report.system.push({ component: ids[i], control: "theme", metrics: m });
    await page
      .getByRole("button", { name: "Toggle theme", exact: true })
      .click();
    await rail()
      .getByRole("button", { name: "Reset system", exact: true })
      .click();
  });
}
for (const language of ["en", "ar"]) {
  lang = language;
  await page.locator(".language-control").selectOption(lang);
  for (let i = 0; i < ids.length; i++) {
    await nav(i);
    await check(`${ids[i]} contextual controls ${lang}`, async () => {
      await rail()
        .getByRole("button", {
          name: label("Reset playground", "إعادة ضبط المعاينة"),
          exact: true,
        })
        .click();
      if (i === 0) {
        await fill("Label", "التسمية", "QA · حفظ الفاتورة");
        assert.ok((await canvas().textContent()).includes("QA · حفظ الفاتورة"));
        for (const v of ["primary", "secondary", "ghost", "destructive"]) {
          await select("Variant", "النوع", v);
          assert.equal(
            await canvas().locator(".tz-button").getAttribute("data-variant"),
            v,
          );
        }
        for (const size of ["sm", "md"]) {
          await select("Size", "الحجم", size);
          assert.equal(
            await canvas().locator(".tz-button").getAttribute("data-size"),
            size,
          );
        }
        for (const state of [
          "loading",
          "success",
          "error",
          "disabled",
          "idle",
        ]) {
          await select("State", "الحالة", state);
          assert.equal(
            await canvas().locator(".tz-button").getAttribute("data-state"),
            state === "disabled" ? "idle" : state,
          );
          assert.equal(
            await canvas().locator(".tz-button").isDisabled(),
            ["loading", "disabled"].includes(state),
          );
        }
        for (const icon of ["plus", "download", "settings", "none"]) {
          await select("Icon", "الأيقونة", icon);
          assert.equal(
            await canvas().locator("svg").count(),
            icon === "none" ? 0 : 1,
          );
        }
        await select("Icon", "الأيقونة", "settings");
        await rail()
          .getByRole("switch", {
            name: label("Icon only", "أيقونة فقط"),
            exact: true,
          })
          .click();
        assert.equal(
          await canvas().locator(".tz-button").getAttribute("aria-label"),
          "QA · حفظ الفاتورة",
        );
        assert.equal(await canvas().locator("bdi").count(), 0);
      } else if (i === 1) {
        for (const variant of ["segment", "underline"]) {
          await select("Variant", "النمط", variant);
          assert.equal(
            await canvas().locator(".tz-tabs").getAttribute("data-variant"),
            variant,
          );
        }
        for (const value of ["invoices", "activity", "overview"]) {
          await select("Selection", "التحديد", value);
          assert.equal(
            await canvas()
              .locator("[role=tab][aria-selected=true]")
              .getAttribute("data-state"),
            "active",
          );
          assert.ok(
            (await canvas().getByRole("tabpanel").textContent()).length > 0,
          );
        }
        await canvas().getByRole("tab").first().focus();
        await page.keyboard.press(lang === "ar" ? "ArrowLeft" : "ArrowRight");
        await page.waitForTimeout(100);
        assert.equal(
          await canvas().getByRole("tab").nth(1).getAttribute("aria-selected"),
          "true",
        );
      } else if (i === 2) {
        await fill("Label", "التسمية", "QA switch");
        assert.ok(
          (await canvas()
            .getByRole("switch", { name: "QA switch" })
            .count()) === 1,
        );
        const checked = rail().getByRole("switch", {
          name: label("Checked", "مفعّل"),
          exact: true,
        });
        await checked.click();
        assert.equal(
          await canvas().getByRole("switch").getAttribute("aria-checked"),
          "false",
        );
        await canvas().getByRole("switch").focus();
        await page.keyboard.press("Space");
        assert.equal(
          await canvas().getByRole("switch").getAttribute("aria-checked"),
          "true",
        );
        await rail()
          .getByRole("switch", {
            name: label("Disabled", "معطّل"),
            exact: true,
          })
          .click();
        assert.equal(await canvas().getByRole("switch").isDisabled(), true);
      } else if (i === 3) {
        await fill("Trigger label", "زر الفتح", "QA menu");
        for (const align of ["end", "start"]) {
          await select("Alignment", "المحاذاة", align);
          await canvas().getByRole("button").click();
          assert.equal(
            await page.getByRole("menu").getAttribute("data-align"),
            align,
          );
          await page.keyboard.press("Escape");
          await page.waitForFunction(() => !document.querySelector(".tz-menu"));
        }
        const items = [
          { id: "a", label: "QA first", icon: "plus", shortcut: "A" },
          { id: "disabled", label: "QA disabled", disabled: true },
          {
            id: "b",
            label: "QA last",
            destructive: true,
            separatorBefore: true,
          },
        ];
        await rail()
          .getByLabel(label("Items", "العناصر"), { exact: true })
          .fill(JSON.stringify(items));
        await rail()
          .getByRole("button", {
            name: label("Apply collection", "تطبيق البيانات"),
            exact: true,
          })
          .click();
        await canvas().getByRole("button").focus();
        await page.keyboard.press("ArrowDown");
        await page.waitForFunction(
          () =>
            document.activeElement?.getAttribute("role") === "menuitem" &&
            document.activeElement?.textContent?.includes("QA first"),
        );
        await page.keyboard.press("ArrowDown");
        await page.waitForFunction(
          () =>
            document.activeElement?.getAttribute("role") === "menuitem" &&
            document.activeElement?.textContent === "QA last",
        );
        assert.equal(
          await page
            .getByRole("menuitem", { name: "QA last", exact: true })
            .evaluate((el) => el === document.activeElement),
          true,
        );
        await page.keyboard.press("Enter");
        await page.waitForFunction(() => !document.querySelector(".tz-menu"));
        assert.ok(
          (await page.locator(".event-feedback").textContent()).includes('"b"'),
        );
        await rail()
          .getByLabel(label("Items", "العناصر"), { exact: true })
          .fill('[{"id":"same","label":"A"},{"id":"same","label":"B"}]');
        await rail()
          .getByRole("button", {
            name: label("Apply collection", "تطبيق البيانات"),
            exact: true,
          })
          .click();
        assert.equal(await rail().getByRole("alert").count(), 1);
        await rail()
          .getByLabel(label("Items", "العناصر"), { exact: true })
          .fill(JSON.stringify(items));
        await rail()
          .getByRole("button", {
            name: label("Apply collection", "تطبيق البيانات"),
            exact: true,
          })
          .click();
      } else if (i === 4) {
        await fill("Title", "العنوان", "QA sheet");
        await fill("Content", "المحتوى", "QA sheet content · محتوى");
        for (const side of ["left", "right", "auto"]) {
          await select("Side", "الجانب", side);
          await canvas().getByRole("button").click();
          const dialog = page.getByRole("dialog", {
            name: "QA sheet",
            exact: true,
          });
          assert.ok((await dialog.textContent()).includes("QA sheet content"));
          assert.equal(
            await dialog.getAttribute("data-side"),
            side === "auto" ? (lang === "ar" ? "right" : "left") : side,
          );
          await page.keyboard.press("Escape");
          await page.waitForFunction(
            () => !document.querySelector(".tz-sheet"),
          );
          assert.ok(
            await canvas()
              .getByRole("button")
              .evaluate((el) => el === document.activeElement),
          );
        }
      } else if (i === 6) {
        await fill("Label", "التسمية", "QA field");
        await fill("Helper text", "النص المساعد", "QA helper");
        await fill("Error message", "رسالة الخطأ", "QA error");
        const input = canvas().getByRole("textbox", { name: "QA field" });
        assert.equal(await input.getAttribute("aria-invalid"), "true");
        assert.ok(
          (await input.getAttribute("aria-describedby")).includes("-help"),
        );
        assert.ok(
          (await input.getAttribute("aria-describedby")).includes("-error"),
        );
      } else if (i === 7) {
        await fill("Placeholder", "النص المؤقت", "QA placeholder");
        await select("Size", "الحجم", "md");
        const input = canvas().getByRole("textbox");
        await input.fill("QA input · مدار");
        assert.equal(await input.inputValue(), "QA input · مدار");
        await rail()
          .getByRole("switch", {
            name: label("Read only", "للقراءة فقط"),
            exact: true,
          })
          .click();
        assert.equal(await input.getAttribute("readonly"), "");
        await rail()
          .getByRole("switch", {
            name: label("Invalid", "غير صالح"),
            exact: true,
          })
          .click();
        assert.equal(await input.getAttribute("aria-invalid"), "true");
      } else if (i === 8) {
        await fill("Placeholder", "النص المؤقت", "QA choose");
        await select("Size", "الحجم", "md");
        const options = [
          { value: "one", label: "QA One" },
          { value: "off", label: "QA Disabled", disabled: true },
          { value: "two", label: "QA Two" },
        ];
        await rail()
          .getByLabel(label("Options", "الخيارات"), { exact: true })
          .fill(JSON.stringify(options));
        await rail()
          .getByRole("button", {
            name: label("Apply collection", "تطبيق البيانات"),
            exact: true,
          })
          .click();
        await canvas().getByRole("combobox").focus();
        await page.keyboard.press("ArrowDown");
        await page.getByRole("listbox").waitFor();
        await page.keyboard.press("End");
        await page.waitForFunction(() =>
          document.activeElement?.textContent?.includes("QA Two"),
        );
        await page.keyboard.press("Enter");
        await page.waitForFunction(
          () => !document.querySelector(".tz-select-popup"),
        );
        assert.ok(
          (await canvas().getByRole("combobox").textContent()).includes(
            "QA Two",
          ),
        );
      } else {
        await fill("Title", "العنوان", "QA toast");
        await fill("Description", "الوصف", "QA description · وصف");
        await fill("Duration · ms", "المدة · ms", "1000");
        for (const tone of ["error", "info", "success"]) {
          await select("Tone", "النوع", tone);
          await canvas().getByRole("button").click();
          const toast = page.locator(".playground-region .tz-toast");
          assert.equal(await toast.getAttribute("data-tone"), tone);
          assert.ok((await toast.textContent()).includes("QA description"));
          await toast.locator("button").click();
          await page.waitForFunction(
            () => !document.querySelector(".playground-region .tz-toast"),
          );
        }
        await canvas().getByRole("button").click();
        await page.mouse.move(1, 1);
        await page.locator(".language-control").focus();
        await page.waitForTimeout(1450);
        assert.equal(
          await page.locator(".playground-region .tz-toast").count(),
          0,
        );
      }
      const customized = await saved();
      report.contextual.push({
        component: ids[i],
        language: lang,
        props: customized.props[ids[i]],
        metrics: await metrics(),
      });
      await nav((i + 1) % ids.length);
      await nav(i);
      assert.deepEqual((await saved()).props[ids[i]], customized.props[ids[i]]);
      await page.reload();
      await page
        .getByRole("heading", { name: names[lang][i], level: 1, exact: true })
        .waitFor();
      assert.deepEqual((await saved()).props[ids[i]], customized.props[ids[i]]);
      report.persistence.push({
        component: ids[i],
        language: lang,
        navigation: true,
        reload: true,
      });
      await select("Accent", "اللون الأساسي", "plum");
      await select("Typography", "حجم النص", "large");
      await select("Density", "الكثافة", "standard");
      await fill("Corner radius", "استدارة الزوايا", "16");
      await setMotion(true);
      const configBeforeReload = await saved();
      await page.reload();
      await page
        .getByRole("heading", { name: names[lang][i], level: 1, exact: true })
        .waitFor();
      assert.deepEqual((await saved()).system, configBeforeReload.system);
      assert.equal((await saved()).theme, configBeforeReload.theme);
      const generated = await code().textContent();
      for (const token of [
        'accent: "plum"',
        'typography: "large"',
        'density: "standard"',
        "radius: 16",
        "reducedMotion: true",
      ])
        assert.ok(generated.includes(token));
      await page
        .getByRole("button", {
          name: label("Copy code", "نسخ الكود"),
          exact: true,
        })
        .click();
      const copiedCode = await page.evaluate(() =>
        navigator.clipboard.readText(),
      );
      assert.equal(copiedCode, generated);
      await page
        .getByRole("button", {
          name: label("Copy agent prompt", "نسخ الطلب"),
          exact: true,
        })
        .click();
      const prompt = await page.evaluate(() => navigator.clipboard.readText());
      assert.ok(prompt.includes(copiedCode));
      assert.ok(prompt.includes('"accent":"plum"'));
      assert.ok(!prompt.includes("/Users/"));
      report.clipboard.push({
        component: ids[i],
        language: lang,
        codeMatches: true,
        promptIncludesCode: true,
        bytes: prompt.length,
      });
      await rail()
        .getByRole("button", {
          name: label("Copy system configuration", "نسخ إعدادات النظام"),
          exact: true,
        })
        .click();
      const copiedConfig = JSON.parse(
        await page.evaluate(() => navigator.clipboard.readText()),
      );
      assert.equal(copiedConfig.direction, lang === "ar" ? "rtl" : "ltr");
      assert.equal(copiedConfig.accent, "plum");
      await rail()
        .getByRole("button", {
          name: label("Reset playground", "إعادة ضبط المعاينة"),
          exact: true,
        })
        .click();
      assert.equal((await saved()).system.accent, "plum");
      const props = (await saved()).props;
      await rail()
        .getByRole("button", {
          name: label("Reset system", "إعادة ضبط النظام"),
          exact: true,
        })
        .click();
      assert.deepEqual((await saved()).props, props);
      assert.equal((await saved()).theme, "light");
      assert.equal((await saved()).system.accent, "sage");
      assert.equal((await saved()).docs.language, lang);
      report.resets.push({
        component: ids[i],
        language: lang,
        separateScopes: true,
      });
    });
  }
}
for (const language of ["ar", "en"])
  for (const theme of ["light", "dark"])
    for (const viewport of [
      { name: "desktop", width: 1440, height: 1000 },
      { name: "narrow", width: 320, height: 640 },
      { name: "short", width: 1280, height: 400 },
    ]) {
      lang = language;
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.locator(".language-control").selectOption(lang);
      if ((await saved()).theme !== theme)
        await page
          .getByRole("button", {
            name: label("Toggle theme", "تبديل المظهر"),
            exact: true,
          })
          .click();
      for (let i = 0; i < ids.length; i++)
        await check(`${ids[i]} ${lang} ${theme} ${viewport.name}`, async () => {
          await nav(i);
          await page.evaluate(() => document.fonts.ready);
          const doc = await page.evaluate(() => ({
            dir: document.documentElement.dir,
            lang: document.documentElement.lang,
            width: document.documentElement.scrollWidth,
            inner: innerWidth,
            themes: [...document.querySelectorAll(".tiraz-system")].map(
              (el) => el.dataset.theme,
            ),
          }));
          assert.equal(doc.lang, lang);
          assert.equal(doc.dir, lang === "ar" ? "rtl" : "ltr");
          assert.ok(doc.width <= doc.inner);
          assert.ok(doc.themes.every((t) => t === theme));
          if (i === 3) {
            await canvas().getByRole("button").click();
            assert.equal(
              await page
                .getByRole("menu")
                .evaluate((el) => getComputedStyle(el).direction),
              doc.dir,
            );
            await page.keyboard.press("End");
            await page.keyboard.press("Escape");
            await page.waitForFunction(
              () => !document.querySelector(".tz-menu"),
            );
          }
          if (i === 4) {
            await canvas().getByRole("button").click();
            assert.equal(
              await page
                .getByRole("dialog")
                .evaluate((el) => getComputedStyle(el).direction),
              doc.dir,
            );
            await page.keyboard.press("Tab");
            assert.ok(
              await page
                .getByRole("dialog")
                .evaluate((el) => el.contains(document.activeElement)),
            );
            await page.keyboard.press("Escape");
            await page.waitForFunction(
              () => !document.querySelector(".tz-sheet"),
            );
          }
          if (i === 5) {
            await canvas().getByRole("button").click();
            await page.locator(".playground-region .tz-toast button").focus();
            await page.locator(".playground-region .tz-toast button").click();
            await page.waitForFunction(
              () => !document.querySelector(".playground-region .tz-toast"),
            );
          }
          await page.screenshot({
            path: `${evidenceDir}/${ids[i]}-${lang}-${theme}-${viewport.name}.jpg`,
            quality: 65,
          });
          report.pages.push({
            component: ids[i],
            language: lang,
            theme,
            viewport,
            document: doc,
          });
        });
    }
// The responsive customization drawer must expose the same controls and both reset scopes.
for (const language of ["ar", "en"]) {
  lang = language;
  await page.setViewportSize({ width: 320, height: 420 });
  await page.locator(".language-control").selectOption(lang);
  for (let i = 0; i < ids.length; i++)
    await check(`${ids[i]} responsive customization ${lang}`, async () => {
      await nav(i);
      const trigger = page.locator(".mobile-settings button");
      await trigger.click();
      const drawer = page.locator(".docs-drawer");
      await drawer
        .getByLabel(label("Accent", "اللون الأساسي"), { exact: true })
        .selectOption("blue");
      await drawer
        .getByLabel(label("Typography", "حجم النص"), { exact: true })
        .selectOption("large");
      await drawer
        .getByLabel(label("Density", "الكثافة"), { exact: true })
        .selectOption("standard");
      const motion = drawer.getByRole("switch", {
        name: label("Reduce motion", "تقليل الحركة"),
        exact: true,
      });
      if ((await motion.getAttribute("aria-checked")) !== "true")
        await motion.click();
      const corners = drawer.getByLabel(
        label("Corner radius", "استدارة الزوايا"),
        { exact: true },
      );
      await corners.focus();
      await corners.press("End");
      await drawer
        .getByRole("button", {
          name: label("Reset playground", "إعادة ضبط المعاينة"),
          exact: true,
        })
        .click();
      assert.equal((await saved()).system.accent, "blue");
      const props = (await saved()).props;
      await drawer
        .getByRole("button", {
          name: label("Reset system", "إعادة ضبط النظام"),
          exact: true,
        })
        .click();
      assert.deepEqual((await saved()).props, props);
      assert.equal((await saved()).system.accent, "sage");
      await page.screenshot({
        path: `${evidenceDir}/drawer-${ids[i]}-${lang}.jpg`,
        quality: 65,
      });
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector(".docs-drawer"));
      assert.ok(await trigger.evaluate((el) => el === document.activeElement));
      report.resets.push({
        component: ids[i],
        language: lang,
        responsiveDrawer: true,
        separateScopes: true,
      });
    });
}
// A reduced-motion OS preference must remain authoritative even when the inspector is off.
await page.setViewportSize({ width: 1440, height: 900 });
await page.emulateMedia({ reducedMotion: "reduce" });
lang = "en";
await page.locator(".language-control").selectOption("en");
await nav(0);
await check("OS reduced motion overrides enabled animation", async () => {
  await select("State", "الحالة", "loading");
  const duration = await canvas()
    .locator(".tz-spinner")
    .evaluate((el) => getComputedStyle(el).animationDuration);
  assert.ok(parseFloat(duration) <= 0.00001);
  report.system.push({ control: "OS reduced motion", duration });
  await select("State", "الحالة", "idle");
});
await writeFile(
  `${evidenceDir}/customization.json`,
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify(
    {
      system: report.system.length,
      contextual: report.contextual.length,
      pages: report.pages.length,
      clipboard: report.clipboard.length,
      persistence: report.persistence.length,
      resets: report.resets.length,
      errors: report.errors,
      failures: report.failures,
    },
    null,
    2,
  ),
);
await browser.close();
if (report.failures.length || report.errors.length) process.exitCode = 1;
