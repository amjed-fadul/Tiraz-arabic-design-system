import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const out =
  resolve(process.env.TIRAZ_EVIDENCE || "./tiraz-exercise-evidence") + "/";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.TIRAZ_BROWSER
    ? { executablePath: process.env.TIRAZ_BROWSER }
    : {}),
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "no-preference",
});
const evidence = {
  checks: [],
  errors: [],
  fonts: [],
  requests: [],
  limitations: [],
};
page.on("pageerror", (error) => evidence.errors.push(error.message));
page.on("response", (response) => {
  if (/woff/.test(response.url()))
    evidence.fonts.push({ url: response.url(), status: response.status() });
});
page.on("requestfailed", (request) =>
  evidence.requests.push({ url: request.url(), failure: request.failure() }),
);
async function check(name, fn) {
  await fn();
  evidence.checks.push(name);
  console.log("PASS", name);
}
function assert(value, message) {
  if (!value) throw new Error(message);
}
const focusName = () =>
  page.evaluate(() => document.activeElement?.textContent?.trim());
const scope = () => page.locator(".tiraz-system");
await page.goto(process.env.TIRAZ_URL || "http://127.0.0.1:5189/");
await page.evaluate(() => document.fonts.ready);
await check("Arabic RTL compact light default and local fonts", async () => {
  assert((await scope().getAttribute("dir")) === "rtl", "rtl default");
  assert(
    (await page.locator("main").getAttribute("lang")) === "ar",
    "Arabic lang",
  );
  assert((await scope().getAttribute("data-density")) === "compact", "compact");
  assert((await scope().getAttribute("data-theme")) === "light", "light");
  assert((await page.locator("table tbody tr").count()) === 3, "3 rows");
  assert(
    await page.evaluate(
      () =>
        document.fonts.check('400 14px "IBM Plex Sans Arabic"') &&
        document.fonts.check('500 14px "IBM Plex Sans Arabic"') &&
        document.fonts.check('600 14px "IBM Plex Sans Arabic"'),
    ),
    "fonts loaded",
  );
  assert(
    evidence.fonts.length >= 3 && evidence.fonts.every((r) => r.status === 200),
    "font file requests",
  );
});
await page.screenshot({
  path: out + "01-arabic-rtl-light.png",
  fullPage: true,
});
await check("RTL Tabs ArrowLeft, automatic activation, Home, End", async () => {
  await page.getByRole("tab", { name: "كل الفواتير", exact: true }).focus();
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(30);
  assert(
    (await page
      .getByRole("tab", { name: "المدفوعة", exact: true })
      .getAttribute("aria-selected")) === "true",
    "RTL next tab",
  );
  assert((await page.locator("table tbody tr").count()) === 1, "paid view");
  await page.keyboard.press("Home");
  await page.waitForTimeout(30);
  assert(
    (await page
      .getByRole("tab", { name: "كل الفواتير", exact: true })
      .getAttribute("aria-selected")) === "true",
    "Home",
  );
  await page.keyboard.press("End");
  await page.waitForTimeout(10);
  assert(
    (await page
      .getByRole("tab", { name: "المدفوعة", exact: true })
      .getAttribute("aria-selected")) === "true",
    "End",
  );
  await page.keyboard.press("Home");
  await page.waitForTimeout(30);
});
await check("Keyboard Switch Space and shared customization", async () => {
  await page.locator("#dark-mode").focus();
  await page.keyboard.press("Space");
  assert(
    (await scope().getAttribute("data-theme")) === "dark",
    "Space toggles dark",
  );
  await page.selectOption("#accent", "plum");
  await page.selectOption("#density", "standard");
  await page.selectOption("#typography", "large");
  await page.selectOption("#radius", "16");
  await page.waitForTimeout(200);
  const values = await page.locator('button[type="submit"]').evaluate((el) => ({
    bg: getComputedStyle(el).backgroundColor,
    radius: getComputedStyle(el).borderRadius,
    font: getComputedStyle(el).fontSize,
    height: el.getBoundingClientRect().height,
  }));
  assert(
    values.bg === "rgb(214, 182, 229)" &&
      values.radius === "16px" &&
      values.font === "16px" &&
      values.height >= 36,
    JSON.stringify(values),
  );
  evidence.customization = values;
});
await page.screenshot({
  path: out + "02-arabic-rtl-dark-custom.png",
  fullPage: true,
});
await check(
  "Form validation persists inline, success creates actual local invoice, rapid repetition",
  async () => {
    await page
      .getByRole("button", { name: "إنشاء مسودة", exact: true })
      .click();
    assert(
      (await page.locator("#client").getAttribute("aria-invalid")) === "true",
      "invalid associated input",
    );
    assert(
      (await page.locator("#draft-help").getAttribute("role")) === "alert",
      "inline error retained",
    );
    await page.locator("#client").fill("استوديو فلك");
    await page
      .getByRole("button", { name: "إنشاء مسودة", exact: true })
      .click();
    assert((await page.locator("table tbody tr").count()) === 4, "draft added");
    assert(
      (await page
        .getByRole("button", { name: "إنشاء مسودة", exact: true })
        .getAttribute("data-state")) === "success",
      "caller success",
    );
    for (let i = 0; i < 3; i++) {
      await page.locator("#client").fill(`عميل ${i}`);
      await page
        .getByRole("button", { name: "إنشاء مسودة", exact: true })
        .click();
    }
    assert(
      (await page.locator("table tbody tr").count()) === 7,
      "unique rapid local additions",
    );
    assert(
      (await page.locator('.tz-toast[data-state="open"]').count()) <= 3,
      "toast cap",
    );
    assert(
      (await scope().getAttribute("data-theme")) === "dark",
      "config retained",
    );
  },
);
await check(
  "Sheet keyboard, reminder Space, early 40ms End then Enter in scrolling menu",
  async () => {
    await page.getByTestId("sheet-trigger").focus();
    await page.keyboard.press("Enter");
    await page.getByRole("dialog").waitFor();
    await page.locator("#sheet-reminders").focus();
    await page.keyboard.press("Space");
    assert(
      (await page.locator("#sheet-reminders").getAttribute("aria-checked")) ===
        "false",
      "reminder state",
    );
    await page.getByTestId("project-menu").focus();
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(40);
    await page.keyboard.press("End");
    await page.waitForTimeout(10);
    const early = await page.locator(".tz-menu").evaluate((menu) => ({
      focused: document.activeElement?.textContent,
      scroll: menu.scrollTop,
      scrollHeight: menu.scrollHeight,
      height: menu.clientHeight,
      insideSheet: !!menu.closest(".tz-sheet"),
      action: getComputedStyle(menu).getPropertyValue("--action"),
      body: getComputedStyle(menu).fontSize,
      radius: getComputedStyle(menu).borderRadius,
    }));
    assert(early.focused?.trim() === "تعيين المشروع 48", JSON.stringify(early));
    assert(
      early.scroll > 0 &&
        early.scrollHeight > early.height &&
        early.insideSheet,
      "scroll & nested portal",
    );
    assert(
      early.action === "#D6B6E5" &&
        early.body === "16px" &&
        early.radius === "20px",
      "overlay shared tokens",
    );
    evidence.earlyEnd40 = early;
    await page.keyboard.press("Enter");
    await page.getByRole("menu").waitFor({ state: "hidden" });
    assert(
      (await page.getByTestId("project").innerText()).includes("48"),
      "selection changed state",
    );
    assert(
      await page
        .getByTestId("project-menu")
        .evaluate((el) => el === document.activeElement),
      "menu trigger restoration",
    );
  },
);
await check("Real pointer hover after keyboard menu navigation", async () => {
  await page.getByTestId("project-menu").focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("End");
  await page.waitForTimeout(10);
  await page.waitForTimeout(300);
  const item = page.getByRole("menuitem", {
    name: "تعيين المشروع 47",
    exact: true,
  });
  const bounds = await item.boundingBox();
  assert(bounds, "visible near last item");
  await page.mouse.move(5, 5);
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
    { steps: 5 },
  );
  assert(
    (await focusName()) === "تعيين المشروع 47",
    "actual pointer focuses item47",
  );
  await page.screenshot({
    path: out + "03-sheet-scrolling-menu-hover.png",
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await page.getByRole("menu").waitFor({ state: "hidden" });
  assert(
    await page
      .getByTestId("project-menu")
      .evaluate((el) => el === document.activeElement),
    "Escape restore",
  );
});
await check(
  "Nested focus scope and Tab dismissal, Sheet Escape restoration",
  async () => {
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Tab");
    await page.getByRole("menu").waitFor({ state: "hidden" });
    assert(
      await page
        .getByTestId("project-menu")
        .evaluate((el) => el === document.activeElement),
      "Tab menu dismissal restore",
    );
    await page.locator(".tz-menu").waitFor({ state: "detached" });
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      assert(
        await page.evaluate(
          () => !!document.activeElement?.closest(".tz-sheet"),
        ),
        "modal focus trapped",
      );
    }
    evidence.escapeBefore = await page.evaluate(() => ({
      focus: document.activeElement?.outerHTML,
      menus: document.querySelectorAll(".tz-menu").length,
      toasts: [...document.querySelectorAll(".tz-toast")].map(
        (el) => el.dataset.state,
      ),
    }));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(30);
    if (await page.locator('.tz-sheet[data-state="open"]').count()) {
      evidence.limitations.push(
        "Active Toast is a newer Radix DismissableLayer and consumes first Escape before Sheet.",
      );
      await page.waitForFunction(
        () => document.querySelectorAll(".tz-toast").length === 0,
        null,
        { timeout: 5000 },
      );
      await page.keyboard.press("Escape");
    }
    await page.locator(".tz-sheet").waitFor({ state: "detached" });
    assert(
      await page
        .getByTestId("sheet-trigger")
        .evaluate((el) => el === document.activeElement),
      "sheet restore external trigger",
    );
  },
);
await check("Contextual menu changes payment data", async () => {
  await page
    .getByRole("button", { name: "إجراءات INV-1042", exact: true })
    .focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  const row = page.locator("table tbody tr").filter({ hasText: "INV-1042" });
  assert((await row.innerText()).includes("مدفوعة"), "actual paid mutation");
});
await check(
  "English LTR labels, Tabs ArrowRight, theme switching",
  async () => {
    await page.getByTestId("language").click();
    assert((await scope().getAttribute("dir")) === "ltr", "LTR");
    assert(
      (await page.locator("main").getAttribute("lang")) === "en",
      "en lang",
    );
    await page.getByRole("tab", { name: "All invoices", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(30);
    assert(
      (await page
        .getByRole("tab", { name: "Paid", exact: true })
        .getAttribute("aria-selected")) === "true",
      "LTR ArrowRight",
    );
    assert(
      (await page.locator("table tbody tr").count()) === 2,
      "paid data retained",
    );
    await page.keyboard.press("Home");
    await page.waitForTimeout(30);
    await page.locator("#dark-mode").focus();
    await page.keyboard.press("Space");
    assert(
      (await scope().getAttribute("data-theme")) === "light",
      "English light",
    );
  },
);
await page.waitForTimeout(200);
await page.screenshot({
  path: out + "04-english-ltr-light-custom.png",
  fullPage: true,
});
await check(
  "Reduced motion app config and OS preference, English overlay placement",
  async () => {
    await page.locator("#reduced-motion").focus();
    await page.keyboard.press("Space");
    assert(
      (await scope().evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--motion-enter").trim(),
      )) === "0ms",
      "app reduced motion",
    );
    await page.getByTestId("sheet-trigger").click();
    await page.getByRole("dialog").waitFor();
    assert(
      (await page.getByRole("dialog").getAttribute("data-side")) === "left",
      "LTR default left",
    );
    assert(
      (await page
        .getByRole("dialog")
        .evaluate((el) => el.closest("[lang]")?.getAttribute("lang"))) === "en",
      "dialog inherited language",
    );
    await page.getByTestId("project-menu").click();
    await page.getByRole("menu").waitFor();
    assert(
      await page.getByRole("menu").evaluate((el) => !!el.closest(".tz-sheet")),
      "English nested scope",
    );
    assert(
      (await page
        .getByRole("menu")
        .evaluate((el) => el.closest("[lang]")?.getAttribute("lang"))) === "en",
      "menu inherited language",
    );
    await page.keyboard.press("Escape");
    await page.locator(".tz-menu").waitFor({ state: "detached" });
    await page.waitForFunction(
      () => document.querySelectorAll(".tz-toast").length === 0,
      null,
      { timeout: 5000 },
    );
    await page.keyboard.press("Escape");
    await page.locator("#reduced-motion").focus();
    await page.keyboard.press("Space");
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert(
      (await scope().evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--motion-enter").trim(),
      )) === "0ms",
      "OS reduction despite false config",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
  },
);
await check(
  "English dark and reset compact/light, all accent values propagate",
  async () => {
    await page.locator("#dark-mode").click();
    for (const [accent, rgb] of [
      ["sage", "rgb(165, 201, 180)"],
      ["blue", "rgb(168, 198, 239)"],
      ["plum", "rgb(214, 182, 229)"],
      ["clay", "rgb(232, 186, 163)"],
    ]) {
      await page.selectOption("#accent", accent);
      await page.waitForTimeout(200);
      assert(
        (await page
          .locator("#dark-mode")
          .evaluate((el) => getComputedStyle(el).backgroundColor)) === rgb,
        accent,
      );
    }
    await page.screenshot({
      path: out + "05-english-ltr-dark.png",
      fullPage: true,
    });
    await page.locator("#dark-mode").click();
    await page.selectOption("#accent", "sage");
    await page.selectOption("#density", "compact");
    await page.selectOption("#typography", "standard");
    await page.selectOption("#radius", "8");
  },
);
await check("Toast close, subsequent expiry, accessible viewport", async () => {
  for (const close of await page
    .getByRole("button", { name: "Close notification", exact: true })
    .all()) {
    if (await close.isVisible()) await close.click();
  }
  await page.locator("#client").fill("Fresh client");
  await page.getByRole("button", { name: "Create draft", exact: true }).click();
  await page.locator('.tz-toast[data-state="open"]').waitFor();
  assert(
    (await page
      .getByRole("region", { name: "Notifications", exact: true })
      .count()) === 1,
    "localized viewport region",
  );
  assert(
    (await page
      .locator('.tz-toast[data-state="open"]')
      .evaluate((el) => el.closest("[lang]")?.getAttribute("lang"))) === "en",
    "toast inherited language",
  );
  await page
    .getByRole("button", { name: "Close notification", exact: true })
    .click();
  await page
    .locator('.tz-toast[data-state="open"]')
    .waitFor({ state: "hidden" });
  await page.locator("#client").fill("Expiry client");
  await page.getByRole("button", { name: "Create draft", exact: true }).click();
  await page.mouse.move(5, 5);
  await page.locator("#client").focus();
  await page
    .locator('.tz-toast[data-state="open"]')
    .waitFor({ state: "hidden", timeout: 5000 });
});
await check(
  "Narrow/short viewport wrapping, internal table and menu scroll",
  async () => {
    await page.setViewportSize({ width: 390, height: 620 });
    await page.getByTestId("language").click();
    const widths = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      view: innerWidth,
      table: document.querySelector(".table-scroll").scrollWidth,
      tableBox: document.querySelector(".table-scroll").clientWidth,
    }));
    assert(widths.doc <= widths.view, "no document overflow");
    assert(
      widths.table > widths.tableBox,
      "table internal scroll " + JSON.stringify(widths),
    );
    evidence.narrow = widths;
    await page.screenshot({
      path: out + "06-narrow-arabic.png",
      fullPage: true,
    });
    await page.getByTestId("sheet-trigger").click();
    await page.getByTestId("project-menu").focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("End");
    await page.waitForTimeout(10);
    await page.waitForTimeout(280);
    assert((await focusName()) === "تعيين المشروع 48", "short menu End48");
    await page.screenshot({
      path: out + "07-short-sheet-menu.png",
      fullPage: false,
    });
    await page.keyboard.press("Escape");
    await page.locator(".tz-menu").waitFor({ state: "detached" });
    await page.waitForFunction(
      () => document.querySelectorAll(".tz-toast").length === 0,
      null,
      { timeout: 5000 },
    );
    await page.keyboard.press("Escape");
  },
);
assert(evidence.errors.length === 0, JSON.stringify(evidence.errors));
assert(evidence.requests.length === 0, JSON.stringify(evidence.requests));
await writeFile(
  out + "browser-results.json",
  JSON.stringify(evidence, null, 2),
);
await browser.close();
