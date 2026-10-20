import { createRequire } from "node:module";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Captures every documentation page for each evidence variant.
// Needs TIRAZ_PLAYWRIGHT (a Playwright package) and TIRAZ_EVIDENCE (output root).
const require = createRequire(import.meta.url);
if (!process.env.TIRAZ_PLAYWRIGHT) {
  throw new Error("TIRAZ_PLAYWRIGHT must name a Playwright package.");
}
if (!process.env.TIRAZ_EVIDENCE) {
  throw new Error("TIRAZ_EVIDENCE must name the output folder.");
}
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT);

const repo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const base = process.env.TIRAZ_URL || "http://127.0.0.1:5411";
const appOrigin = new URL(base).origin;
const evidence = path.resolve(process.env.TIRAZ_EVIDENCE);
const desktop = { width: 1280, height: 900 };
const systemDefaults = {
  density: "compact",
  accent: "sage",
  typography: "standard",
  radius: 8,
  reducedMotion: false,
};
const variants = [
  {
    name: "ar-light",
    language: "ar",
    theme: "light",
    viewport: desktop,
    overrides: {},
  },
  {
    name: "ar-dark",
    language: "ar",
    theme: "dark",
    viewport: desktop,
    overrides: {},
  },
  {
    name: "en-light",
    language: "en",
    theme: "light",
    viewport: desktop,
    overrides: {},
  },
  {
    name: "en-dark",
    language: "en",
    theme: "dark",
    viewport: desktop,
    overrides: {},
  },
  {
    name: "ar-light-r0",
    language: "ar",
    theme: "light",
    viewport: desktop,
    overrides: { radius: 0 },
  },
  {
    name: "ar-light-r16",
    language: "ar",
    theme: "light",
    viewport: desktop,
    overrides: { radius: 16 },
  },
  {
    name: "ar-light-standard",
    language: "ar",
    theme: "light",
    viewport: desktop,
    overrides: { density: "standard" },
  },
  {
    name: "ar-light-large",
    language: "ar",
    theme: "light",
    viewport: desktop,
    overrides: { typography: "large" },
  },
  {
    name: "ar-light-390",
    language: "ar",
    theme: "light",
    viewport: { width: 390, height: 844 },
    overrides: {},
  },
  {
    name: "ar-light-forced",
    language: "ar",
    theme: "light",
    viewport: desktop,
    overrides: {},
    context: { forcedColors: "active" },
  },
];

const requested = process.env.TIRAZ_VARIANTS
  ? process.env.TIRAZ_VARIANTS.split(",").map((name) => name.trim())
  : variants.map((variant) => variant.name);
const selected = requested.map((name) => {
  const variant = variants.find((item) => item.name === name);
  if (!variant) throw new Error(`Unknown variant: ${name}`);
  return variant;
});

const catalogSource = await readFile(
  path.join(repo, "src/workbench/catalog.ts"),
  "utf8",
);
const start = catalogSource.indexOf("export const catalog = [");
const end = catalogSource.indexOf("] as const", start);
if (start < 0 || end < 0) {
  throw new Error("src/workbench/catalog.ts: catalog array not found");
}
const catalogIds = [
  ...catalogSource.slice(start, end).matchAll(/id: "([^"]+)"/g),
]
  .map((match) => match[1])
  .filter((id) => id !== "field");
// TIRAZ_PAGES limits the run to a comma list of page ids.
const pageIds = process.env.TIRAZ_PAGES
  ? process.env.TIRAZ_PAGES.split(",").map((id) => id.trim())
  : catalogIds;
const unknownPage = pageIds.find((id) => !catalogIds.includes(id));
if (unknownPage) throw new Error(`Unknown page: ${unknownPage}`);
// TIRAZ_FULLPAGE=1 captures the whole page instead of the playground section.
const fullPage = process.env.TIRAZ_FULLPAGE === "1";
// TIRAZ_STATES=1 also presses each of a page's state buttons in turn after its
// resting capture, and captures each state as <id>--state-<n>.jpg, n from 1.
const withStates = process.env.TIRAZ_STATES === "1";

await mkdir(evidence, { recursive: true });
const errorsFile = path.join(evidence, "errors.txt");
const previous = await readFile(errorsFile, "utf8").catch(() => "");
// Drop lines left by earlier runs of the selected variants and pages (and
// their boot, logged with an empty page id) so a rerun does not duplicate them.
const kept = previous
  .split("\n")
  .filter(
    (line) =>
      line !== "" &&
      !selected.some((variant) =>
        ["", ...pageIds].some((id) =>
          line.startsWith(`${variant.name} ${id}: `),
        ),
      ),
  );
await writeFile(errorsFile, kept.map((line) => `${line}\n`).join(""));

const failures = [];
const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  for (const variant of selected) {
    const context = await browser.newContext({
      viewport: variant.viewport,
      deviceScaleFactor: 1,
      ...variant.context,
    });
    const page = await context.newPage();
    const pending = [];
    let current = "";
    const flush = () =>
      appendFile(
        errorsFile,
        pending
          .splice(0)
          .map((line) => `${line}\n`)
          .join(""),
      );
    page.on("pageerror", (error) => {
      pending.push(
        `${variant.name} ${current}: ${error.message.replace(/\s*\n\s*/g, " ")}`,
      );
    });
    context.on("request", (request) => {
      if (
        request.resourceType() === "font" &&
        new URL(request.url()).origin !== appOrigin
      ) {
        failures.push(
          `${variant.name} ${current}: remote font ${request.url()}`,
        );
      }
    });

    await mkdir(path.join(evidence, variant.name), { recursive: true });
    await page.goto(base);
    await page
      .locator(".playground-section")
      .first()
      .waitFor({ state: "visible" });
    // The first mount writes all four keys. Wait for them, so the seed below
    // cannot be overwritten by that write.
    await page.waitForFunction(() =>
      [
        "tiraz.theme.v1",
        "tiraz.documentation.v2",
        "tiraz.system.v3",
        "tiraz.playgrounds.v2",
      ].every((key) => localStorage.getItem(key) !== null),
    );
    let saved = 0;
    for (const id of pageIds) {
      current = id;
      await page.evaluate(
        (entries) => {
          // Clear first, so no playground state from an earlier page or boot survives.
          localStorage.clear();
          for (const [key, value] of Object.entries(entries)) {
            localStorage.setItem(key, value);
          }
        },
        {
          "tiraz.documentation.v2": JSON.stringify({
            language: variant.language,
            active: id,
            systemPanelOpen: false,
            inspectorOpen: false,
          }),
          "tiraz.theme.v1": JSON.stringify(variant.theme),
          "tiraz.system.v3": JSON.stringify({
            ...systemDefaults,
            ...variant.overrides,
          }),
        },
      );
      await page.reload();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1200);
      const section = page.locator(".playground-section");
      if ((await section.count()) === 0) {
        failures.push(`${variant.name} ${id}: no .playground-section`);
      } else {
        const capture = async (name) => {
          const shot = {
            path: path.join(evidence, variant.name, `${name}.jpg`),
            type: "jpeg",
            quality: 70,
          };
          if (fullPage) await page.screenshot({ ...shot, fullPage: true });
          else await section.first().screenshot(shot);
          saved += 1;
        };
        await capture(id);
        if (withStates) {
          const buttons = page.locator(".tz-demo-states button");
          const count = await buttons.count();
          for (let index = 0; index < count; index += 1) {
            await buttons.nth(index).click();
            await page.waitForTimeout(1200);
            await capture(`${id}--state-${index + 1}`);
          }
        }
      }
      await flush();
    }
    await flush();
    console.log(`${variant.name}: ${saved} screenshots`);
    await context.close();
  }
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
