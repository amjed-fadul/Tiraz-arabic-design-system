import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const root = process.env.TIRAZ_URL || "http://127.0.0.1:5212";
const phase = process.env.TIRAZ_PHASE || "after";
const evidence = `docs/sidebar-foundation/corrections/${phase}`;
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const records = [],
  checks = [],
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"]) {
      await page.goto(root);
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      if (language === "en")
        await page
          .getByRole("combobox", { name: "لغة التوثيق", exact: true })
          .selectOption("en");
      if (theme === "dark")
        await page
          .getByRole("button", {
            name: language === "ar" ? "تبديل المظهر" : "Toggle theme",
            exact: true,
          })
          .click();
      await page
        .getByRole("navigation", {
          name: language === "ar" ? "المكوّنات" : "Components",
          exact: true,
        })
        .getByRole("button", {
          name: language === "ar" ? "شريط التنقّل" : "Sidebar",
          exact: true,
        })
        .click();
      const preview = page.locator(".playground-region");
      const sidebar = preview.locator(".tz-sidebar");
      for (const state of ["expanded", "collapsed"]) {
        const iconBefore = await sidebar
          .locator(".tz-sidebar-content .tz-sidebar-icon")
          .first()
          .evaluate(
            (el) =>
              el.getBoundingClientRect().x +
              el.getBoundingClientRect().width / 2,
          );
        if (state === "collapsed")
          await sidebar
            .getByRole("button", {
              name:
                language === "ar"
                  ? "طيّ القائمة الجانبية"
                  : "Collapse navigation",
              exact: true,
            })
            .click();
        if (state === "collapsed" && phase === "after") {
          const moving = await sidebar
            .locator(".tz-sidebar-content .tz-sidebar-icon")
            .first()
            .evaluate(
              (el) =>
                el.getBoundingClientRect().x +
                el.getBoundingClientRect().width / 2,
            );
          assert.ok(
            Math.abs(moving - iconBefore) <= 1,
            `Navigation icon jumped horizontally: ${iconBefore} to ${moving}`,
          );
        }
        await page.waitForTimeout(200);
        const geometry = await sidebar.evaluate((el) => {
          const rect = (n) => {
            const r = n.getBoundingClientRect();
            return {
              x: r.x + r.width / 2,
              y: r.y + r.height / 2,
              width: r.width,
              height: r.height,
            };
          };
          return {
            root: rect(el),
            logo: rect(el.querySelector(".tz-sidebar-header > div > svg")),
            toggle: rect(el.querySelector("[data-sidebar-toggle]")),
            avatar: rect(el.querySelector(".tz-sidebar-footer .tz-avatar")),
            icons: [
              ...el.querySelectorAll(".tz-sidebar-content .tz-sidebar-icon"),
            ]
              .filter((n) => n.getBoundingClientRect().height > 0)
              .map(rect),
            action: rect(
              el.querySelector(".tz-sidebar-footer .tz-sidebar-icon"),
            ),
          };
        });
        records.push({ language, theme, state, geometry });
        await preview.screenshot({
          path: `${evidence}/${language}-${theme}-${state}.png`,
        });
      }
    }
  if (phase === "after") {
    const preview = page.locator(".playground-region");
    const sidebar = preview.locator(".tz-sidebar");
    const toggle = sidebar.getByRole("button", {
      name: "Expand navigation",
      exact: true,
    });
    await sidebar.evaluate((el) => {
      el.style.blockSize = "280px";
    });
    const nav = sidebar.locator(".tz-sidebar-content");
    assert.ok(await nav.evaluate((el) => el.scrollHeight > el.clientHeight));
    const anchor = await sidebar.locator(".tz-sidebar-footer").boundingBox();
    const header = await sidebar.locator(".tz-sidebar-header").boundingBox();
    await sidebar.getByRole("link", { name: "Overview", exact: true }).focus();
    for (let index = 0; index < 6; index++) await page.keyboard.press("Tab");
    assert.ok(
      await sidebar
        .getByRole("link", { name: "Settings", exact: true })
        .evaluate((el) => el === document.activeElement),
    );
    assert.ok(await nav.evaluate((el) => el.scrollTop > 0));
    assert.equal(
      (await sidebar.locator(".tz-sidebar-footer").boundingBox()).y,
      anchor.y,
    );
    assert.equal(
      (await sidebar.locator(".tz-sidebar-header").boundingBox()).y,
      header.y,
    );
    const deviations = await sidebar.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const axis = rect.x + rect.width / 2;
      return [...el.querySelectorAll(".tz-sidebar-content .tz-sidebar-icon")]
        .filter((n) => n.getBoundingClientRect().height > 0)
        .map((n) => {
          const r = n.getBoundingClientRect();
          return Math.abs(r.x + r.width / 2 - axis);
        });
    });
    assert.ok(deviations.every((value) => value <= 1));
    await toggle.click();
    const disclosure = sidebar.getByRole("button", {
      name: "Library",
      exact: true,
    });
    assert.equal(await disclosure.getAttribute("aria-expanded"), "true");
    assert.equal(await disclosure.getAttribute("data-active"), "true");
    const child = sidebar.getByRole("link", {
      name: "Components",
      exact: true,
    });
    await child.focus();
    await page.getByRole("switch", { name: "Icon rail", exact: true }).click();
    // Inspector toggles retain their own focus; root must not steal external focus.
    assert.ok(
      await page
        .getByRole("switch", { name: "Icon rail", exact: true })
        .evaluate((el) => el === document.activeElement),
    );
    assert.equal(await child.count(), 0);
    await disclosure.press("Enter");
    assert.ok(await child.isVisible());
    assert.ok(await disclosure.evaluate((el) => el === document.activeElement));
    await child.focus();
    await page.keyboard.press("Tab");
    assert.ok(
      await sidebar
        .getByRole("link", { name: "Resources", exact: true })
        .evaluate((el) => el === document.activeElement),
    );
    await sidebar.locator("[data-sidebar-toggle]").click();
    await page
      .getByRole("switch", { name: "Long labels", exact: true })
      .click();
    await sidebar.locator("[data-sidebar-toggle]").click();
    const long = sidebar.getByRole("link", { name: /Documents and reference/ });
    const separate = await long.evaluate((el) => {
      const label = el
        .querySelector(".tz-sidebar-label")
        .getBoundingClientRect();
      const count = el
        .querySelector(".tz-sidebar-count")
        .getBoundingClientRect();
      return label.right <= count.left + 1 || count.right <= label.left + 1;
    });
    assert.ok(separate);
    await sidebar.locator("[data-sidebar-toggle]").click();
    for (const motion of ["no-preference", "reduce"]) {
      await page.emulateMedia({ reducedMotion: motion });
      if (motion === "no-preference")
        await page
          .getByRole("switch", { name: "Reduce motion", exact: true })
          .click();
      assert.equal(
        await sidebar.evaluate((el) => getComputedStyle(el).transitionDuration),
        "0s",
      );
      if (motion === "no-preference")
        await page
          .getByRole("switch", { name: "Reduce motion", exact: true })
          .click();
    }
    checks.push(
      "short rail keyboard scrolling retains header/footer and centers; disclosure/focus, long-label counts and both motion settings",
    );
    await sidebar.evaluate((el) => {
      el.style.blockSize = "280px";
    });
    await page.screenshot({ path: `${evidence}/short-rail.png` });
    await page.setViewportSize({ width: 390, height: 300 });
    await preview
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    const mobileNav = dialog.locator(".tz-sidebar-content");
    assert.ok(
      await mobileNav.evaluate(
        (el) => el.clientHeight - 12 >= 32 && el.scrollHeight > el.clientHeight,
      ),
    );
    const footer = await dialog.locator(".tz-sidebar-footer").boundingBox();
    assert.ok(footer.y + footer.height <= 300);
    await dialog.getByRole("link", { name: "Settings", exact: true }).focus();
    assert.ok(await mobileNav.evaluate((el) => el.scrollTop > 0));
    await page.screenshot({ path: `${evidence}/short-mobile-sheet.png` });
    await dialog.getByRole("link", { name: "Settings", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    await page.waitForFunction(
      () => document.activeElement?.id === "sidebar-preview-settings",
    );
    await preview
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.ok(
      await preview
        .getByRole("button", { name: "Open navigation", exact: true })
        .evaluate((el) => el === document.activeElement),
    );
    checks.push(
      "300px-high rich mobile Sheet scrolls, contains footer, hands destination focus after dismissal and restores trigger on Escape",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page.goto(`${root}/examples/dashboard`);
  await page.screenshot({ path: `${evidence}/dashboard-expanded.png` });
  await page
    .getByRole("button", { name: "طيّ القائمة الجانبية", exact: true })
    .click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${evidence}/dashboard-collapsed.png` });
  const dashboardGeometry = await page
    .locator(".dashboard-sidebar")
    .evaluate((el) => {
      const box = (n) => {
        const r = n.getBoundingClientRect();
        return { x: r.x + r.width / 2, width: r.width };
      };
      return {
        root: box(el),
        logo: box(el.querySelector(".dashboard-mark")),
        toggle: box(el.querySelector("[data-sidebar-toggle]")),
        avatar: box(el.querySelector(".tz-sidebar-footer .tz-avatar")),
        icons: [...el.querySelectorAll(".tz-sidebar-icon")].map(box),
      };
    });
  if (phase === "after") {
    for (const element of [
      dashboardGeometry.logo,
      dashboardGeometry.toggle,
      dashboardGeometry.avatar,
      ...dashboardGeometry.icons,
    ])
      assert.ok(
        Math.abs(element.x - dashboardGeometry.root.x) <= 1,
        JSON.stringify(dashboardGeometry),
      );
    checks.push(
      "dashboard actual logo/toggle/icons/avatar boxes share the same rail axis; real three destinations retained",
    );
  }

  await writeFile(
    `${evidence}/geometry.json`,
    JSON.stringify(
      { root, records, dashboardGeometry, checks, errors },
      null,
      2,
    ),
  );
  if (phase === "after") {
    for (const record of records) {
      const { geometry: g, state } = record;
      if (state === "collapsed")
        for (const element of [
          g.logo,
          g.toggle,
          g.avatar,
          g.action,
          ...g.icons,
        ])
          assert.ok(
            Math.abs(element.x - g.root.x) <= 1,
            JSON.stringify(record),
          );
      else {
        assert.ok(Math.abs(g.logo.y - g.toggle.y) <= 1, JSON.stringify(record));
        assert.ok(g.logo.x !== g.toggle.x);
      }
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS shared header row/stack and collapsed logo/toggle/icon/avatar/action centers across languages/themes",
    );
  }
} finally {
  await browser.close();
}
