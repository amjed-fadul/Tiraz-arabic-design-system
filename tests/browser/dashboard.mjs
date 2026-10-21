import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const root = process.env.TIRAZ_URL || "http://127.0.0.1:5211";
const evidence = process.env.TIRAZ_EVIDENCE || "docs/dashboard-example/browser";
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.TIRAZ_BROWSER ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage();
page.setDefaultTimeout(10000);
const errors = [],
  warnings = [],
  checks = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
  if (message.type() === "warning") warnings.push(message.text());
});
const check = (name) => {
  checks.push(name);
  console.log(`PASS ${name}`);
};
const select = async (label, option) => {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
  // Woven §17.1 Select: the popup plays its 120 ms exit, and the page stays
  // aria-hidden until it unmounts.
  await page.locator("[role=listbox]").waitFor({ state: "detached" });
};
const table = () =>
  page.getByRole("table", { name: "Customer directory", exact: true });
const assertFocus = async (locator) =>
  assert.equal(
    await locator.evaluate((el) => document.activeElement === el),
    true,
  );
const waitClosed = async () =>
  page.getByRole("dialog").waitFor({ state: "hidden" });
const metric = (name) => page.getByTestId(name).innerText();
const overflow = async () => {
  const result = await page.evaluate(() => ({
    width: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(
    result.document <= result.width && result.body <= result.width,
    JSON.stringify(result),
  );
  return result;
};
try {
  await page.goto(root);
  await page
    .getByRole("button", { name: /مثال لوحة العملاء|Dashboard example/ })
    .click();
  // The Dashboard opens as a page of the docs, at the same address, with the
  // standalone route embedded in its iframe.
  assert.equal(page.url().replace(/\/$/, ""), root.replace(/\/$/, ""));
  assert.equal(
    await page.getByRole("heading", { level: 1 }).innerText(),
    "لوحة العملاء",
  );
  assert.equal(
    await page.locator(".docs-screen-stage iframe").getAttribute("src"),
    "/examples/dashboard?embed=1",
  );
  await page
    .frameLocator(".docs-screen-stage iframe")
    .locator(".recharts-area-curve")
    .waitFor();
  check("documentation header opens the Dashboard's page in the docs");
  for (const width of [1440, 768, 390, 320]) {
    for (const language of ["ar", "en"]) {
      for (const theme of ["light", "dark"]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${root}/examples/dashboard`);
        if (language === "en")
          await page
            .getByRole("button", { name: "English", exact: true })
            .click();
        if (theme === "dark")
          await page
            .getByRole("button", {
              name: language === "ar" ? "الوضع الداكن" : "Dark mode",
              exact: true,
            })
            .click();
        await page.evaluate(() => document.fonts.ready);
        await page.locator(".recharts-area-curve").waitFor();
        await page.waitForFunction(
          (expected) =>
            document.documentElement.lang === expected &&
            document.documentElement.dir ===
              (expected === "ar" ? "rtl" : "ltr"),
          language,
        );
        assert.equal(await page.locator("html").getAttribute("lang"), language);
        assert.equal(
          await page.locator("html").getAttribute("dir"),
          language === "ar" ? "rtl" : "ltr",
        );
        assert.equal(
          await page.locator(".tiraz-system").getAttribute("data-theme"),
          theme,
        );
        assert.equal(
          await page.evaluate(() =>
            document.fonts.check('500 14px "IBM Plex Sans Arabic"'),
          ),
          true,
        );
        await overflow();
        if (
          width === 1440 ||
          (width === 390 &&
            ((language === "ar" && theme === "light") ||
              (language === "en" && theme === "dark"))) ||
          (width === 768 && language === "ar" && theme === "light")
        ) {
          await page.screenshot({
            path: `${evidence}/${language}-${theme}-${width}.png`,
            fullPage: true,
          });
        }
        check(
          `${language}/${theme}/${width}: direction, font, charts and no page overflow`,
        );
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const language of ["ar", "en"])
    for (const theme of ["light", "dark"]) {
      await page.goto(`${root}/examples/dashboard`);
      if (language === "en")
        await page
          .getByRole("button", { name: "English", exact: true })
          .click();
      if (theme === "dark")
        await page
          .getByRole("button", {
            name: language === "ar" ? "الوضع الداكن" : "Dark mode",
            exact: true,
          })
          .click();
      const sidebar = page.locator(".dashboard-sidebar");
      const originalPosition = await sidebar.boundingBox();
      assert.equal(originalPosition.x, language === "ar" ? 1216 : 0);
      await sidebar
        .getByRole("button", {
          name:
            language === "ar" ? "طيّ القائمة الجانبية" : "Collapse navigation",
          exact: true,
        })
        .click();
      await page.waitForTimeout(200);
      assert.equal((await sidebar.boundingBox()).width, 56);
      const orders = sidebar.getByRole("link", {
        name: language === "ar" ? "الطلبات" : "Orders",
        exact: true,
      });
      await orders.click();
      assert.equal(await orders.getAttribute("aria-current"), "page");
      await page.waitForFunction(() => document.activeElement?.id === "orders");
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: `${evidence}/${language}-${theme}-rail.png`,
      });
      await overflow();
    }
  check(
    "dashboard rail in both languages/themes: inline-start placement, active links, destination focus and no overflow",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${root}/examples/dashboard`);
  await page.getByRole("button", { name: "English", exact: true }).click();
  assert.equal(await metric("order-count"), "71");
  assert.equal(await metric("revenue"), "AED 22,160");
  await select("Period", "14 days");
  assert.equal(await metric("order-count"), "116");
  for (const disclosure of await page
    .getByText("Show data table", { exact: true })
    .all())
    await disclosure.click();
  const trend = page.getByRole("region", { name: "Daily orders", exact: true });
  const channel = page.getByRole("region", {
    name: "Orders by channel",
    exact: true,
  });
  assert.equal(await trend.getByRole("table").getByRole("row").count(), 15);
  const values = await trend
    .getByRole("table")
    .locator("tbody td")
    .allTextContents();
  assert.equal(
    values.reduce((total, value) => total + Number(value), 0),
    116,
  );
  const channelValues = await channel
    .getByRole("table")
    .locator("tbody td")
    .allTextContents();
  assert.equal(
    channelValues.reduce((total, value) => total + Number(value), 0),
    116,
  );
  await select("Period", "7 days");
  assert.equal(await trend.getByRole("table").getByRole("row").count(), 8);
  assert.ok((await channel.innerText()).includes("Website 37"));
  check("period synchronizes both chart tables, summaries, orders and revenue");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  assert.ok(
    (
      await page.getByRole("navigation", { name: "Customer pages" }).innerText()
    ).includes("7–12 of 18"),
  );
  await page.getByRole("searchbox").fill("MADAR");
  assert.ok((await table().innerText()).includes("شركة مدار"));
  await select("Customer status", "Paused");
  assert.ok((await table().innerText()).includes("No matching customers"));
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Sort Customer ascending", exact: true })
    .click();
  assert.equal(await table().locator('th[aria-sort="ascending"]').count(), 1);
  await page
    .getByRole("button", { name: "Sort Customer descending", exact: true })
    .click();
  assert.equal(await table().locator('th[aria-sort="descending"]').count(), 1);
  check("combined search/status filters reset pages; sorting works both ways");
  const trigger = page.getByRole("button", {
    name: "Create customer",
    exact: true,
  });
  for (const dismissal of ["Cancel", "Close customer form", "Escape"]) {
    await trigger.click();
    await page
      .getByRole("textbox", { name: "Customer name", exact: true })
      .fill("Unsaved draft");
    if (dismissal === "Escape") await page.keyboard.press("Escape");
    else
      await page.getByRole("button", { name: dismissal, exact: true }).click();
    await waitClosed();
    await assertFocus(trigger);
    await trigger.click();
    assert.equal(
      await page
        .getByRole("textbox", { name: "Customer name", exact: true })
        .inputValue(),
      "",
    );
    await page.keyboard.press("Escape");
    await waitClosed();
  }
  check("cancel/close/Escape discard drafts and restore trigger focus");
  await page.getByRole("searchbox").fill("unmatched");
  await select("Customer status", "Paused");
  const orderCount = await metric("order-count"),
    revenue = await metric("revenue");
  await trigger.click();
  await page
    .getByRole("button", { name: "Save customer", exact: true })
    .click();
  await assertFocus(
    page.getByRole("textbox", { name: "Customer name", exact: true }),
  );
  assert.equal(
    await page
      .getByRole("textbox", { name: "Customer name", exact: true })
      .getAttribute("aria-invalid"),
    "true",
  );
  await page
    .getByRole("textbox", { name: "Customer name", exact: true })
    .fill("مدار New");
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("invalid");
  await page
    .getByRole("button", { name: "Save customer", exact: true })
    .click();
  await assertFocus(page.getByRole("textbox", { name: "Email", exact: true }));
  await page.screenshot({
    path: `${evidence}/customer-validation.png`,
    fullPage: true,
  });
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("new@madar.example");
  await page.locator(".dashboard-form").evaluate((form) => {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
  await waitClosed();
  await assertFocus(trigger);
  assert.equal(await metric("customer-count"), "19");
  assert.equal(await metric("order-count"), orderCount);
  assert.equal(await metric("revenue"), revenue);
  assert.ok(
    await page.getByText("Customer created", { exact: true }).isVisible(),
  );
  assert.ok(
    await page
      .getByText("Your filters hide the new customer.", { exact: true })
      .isVisible(),
  );
  await page
    .getByRole("button", { name: "Show customer", exact: true })
    .click();
  assert.ok((await table().innerText()).includes("مدار New"));
  assert.equal(await table().locator("tbody tr").count(), 1);
  await page.screenshot({
    path: `${evidence}/created-customer.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Dismiss notification", exact: true })
    .click();
  check(
    "validation, repeated save guard, Toast, accurate metrics and filtered customer reveal",
  );
  await select("Preview state", "Loading");
  assert.equal(await table().getAttribute("aria-busy"), "true");
  assert.ok(
    await page
      .getByText("Loading preview — no request is running.", { exact: true })
      .isVisible(),
  );
  assert.equal(await trigger.isDisabled(), true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const motion = await page
    .locator(".tz-skeleton")
    .first()
    .evaluate((el) => ({
      animation: getComputedStyle(el).animationName,
      transition: getComputedStyle(el).transitionDuration,
    }));
  assert.equal(motion.animation, "none");
  await page.screenshot({
    path: `${evidence}/loading-reduced-motion.png`,
    fullPage: true,
  });
  await select("Preview state", "Error");
  await page.screenshot({ path: `${evidence}/error.png`, fullPage: true });
  assert.equal(await metric("order-count"), "—");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  assert.equal(await metric("customer-count"), "18");
  assert.equal(await metric("order-count"), "71");
  await select("Preview state", "Empty dataset");
  await page.screenshot({ path: `${evidence}/empty.png`, fullPage: true });
  assert.ok((await table().innerText()).includes("No customers yet"));
  assert.equal(await metric("order-count"), "0");
  await trigger.click();
  await page
    .getByRole("textbox", { name: "Customer name", exact: true })
    .fill("First customer");
  await page
    .getByRole("button", { name: "Save customer", exact: true })
    .click();
  await waitClosed();
  assert.equal(await metric("customer-count"), "1");
  assert.equal(await metric("order-count"), "0");
  check(
    "all preview states, working Retry, empty create without orders, OS reduced motion",
  );
  await page.reload();
  // Woven §18 #15: Arabic counts use Arabic-Indic digits.
  assert.equal(await metric("customer-count"), "١٨");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.getByRole("button", { name: "Dark mode", exact: true }).click();
  assert.equal(
    await page.locator(".tiraz-system").getAttribute("data-theme"),
    "dark",
  );
  await trigger.click();
  assert.equal(await page.getByRole("dialog").getAttribute("dir"), "ltr");
  assert.equal(
    await page
      .getByRole("dialog")
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--surface").trim(),
      ),
    "#1c221e",
  );
  await page.getByRole("combobox", { name: "Status", exact: true }).click();
  await page.keyboard.press("Escape");
  assert.ok(await page.getByRole("dialog").isVisible());
  await assertFocus(
    page.getByRole("combobox", { name: "Status", exact: true }),
  );
  await page.keyboard.press("Escape");
  await waitClosed();
  await assertFocus(trigger);
  check(
    "reload restores sample; live theme reaches Sheets; nested Select Escape respects focus/layers",
  );
  await page.setViewportSize({ width: 320, height: 700 });
  const navTrigger = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  for (const motion of ["no-preference", "reduce"]) {
    await page.emulateMedia({ reducedMotion: motion });
    for (const destination of ["Orders", "Overview", "Customers"]) {
      await navTrigger.click();
      await page
        .getByRole("dialog")
        .getByRole("link", { name: destination, exact: true })
        .click();
      await waitClosed();
      await page.waitForFunction(
        (id) => document.activeElement?.id === id,
        destination.toLowerCase(),
      );
    }
    await navTrigger.click();
    await page.keyboard.press("Escape");
    await waitClosed();
    await assertFocus(navTrigger);
  }
  await overflow();
  const scrolling = await table().evaluate((el) => ({
    region: el.parentElement.clientWidth,
    content: el.parentElement.scrollWidth,
    tabIndex: el.parentElement.tabIndex,
  }));
  assert.ok(scrolling.content > scrolling.region);
  assert.equal(scrolling.tabIndex, 0);
  check(
    "mobile navigation focuses real destination; wide table stays keyboard-scrollable inside page",
  );
  await page.setViewportSize({ width: 390, height: 300 });
  await navTrigger.click();
  const shortNav = page.getByRole("dialog").locator(".tz-sidebar-content");
  assert.ok(await shortNav.evaluate((el) => el.clientHeight - 16 >= 32));
  assert.ok(
    (await page.getByRole("dialog").locator(".tz-sidebar-footer").boundingBox())
      .y +
      (
        await page
          .getByRole("dialog")
          .locator(".tz-sidebar-footer")
          .boundingBox()
      ).height <=
      300,
  );
  await shortNav.hover();
  await page.mouse.wheel(0, 250);
  await page.waitForTimeout(100);
  assert.ok(await shortNav.evaluate((el) => el.scrollTop > 0));
  await page.screenshot({ path: `${evidence}/short-mobile-sheet.png` });
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Customers", exact: true })
    .click();
  await waitClosed();
  await page.waitForFunction(() => document.activeElement?.id === "customers");
  await navTrigger.click();
  await page.keyboard.press("Escape");
  await waitClosed();
  await assertFocus(navTrigger);
  check(
    "300px-high mobile Sheet retains usable scrolling navigation and contained footer",
  );
  await page.setViewportSize({ width: 320, height: 700 });
  // Reuse must not inherit link appearance from the documentation's global reset.
  await page.evaluate(() => {
    document
      .querySelector('style[data-vite-dev-id$="/workbench/workbench.css"]')
      ?.remove();
    const reset = document.createElement("style");
    reset.textContent = "body { margin: 0; } * { box-sizing: border-box; }";
    document.head.append(reset);
  });
  await navTrigger.click();
  const portalLink = page
    .getByRole("dialog")
    .getByRole("link", { name: "Customers", exact: true });
  const linkStyle = await portalLink.evaluate((el) => ({
    color: getComputedStyle(el).color,
    parentColor: (() => {
      const probe = document.createElement("span");
      // Woven §17.3 Sidebar and §12 Selection: the active item is a paper
      // chip in --text.
      probe.style.color =
        el.dataset.active === "true" ? "var(--text)" : "inherit";
      el.parentElement.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    })(),
    decoration: getComputedStyle(el).textDecorationLine,
  }));
  assert.equal(linkStyle.color, linkStyle.parentColor);
  assert.equal(linkStyle.decoration, "none");
  await page.keyboard.press("Escape");
  await waitClosed();
  await assertFocus(navTrigger);
  check(
    "reused dashboard portal links retain token appearance without documentation CSS",
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const axe = await page.evaluate(async () =>
    (
      await axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      })
    ).violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      nodes: nodes.map((node) => node.target),
    })),
  );
  assert.deepEqual(axe, []);
  check(
    "automated accessibility scan: no WCAG A/AA findings (manual screen reader unverified)",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  check("no browser console errors or warnings");
  await writeFile(
    `${evidence}/results.json`,
    JSON.stringify(
      {
        root,
        browser: await browser.version(),
        checks,
        errors,
        warnings,
        axe,
        motion,
        scrolling,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
