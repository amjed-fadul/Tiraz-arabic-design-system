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
const pageIds = [...catalogSource.slice(start, end).matchAll(/id: "([^"]+)"/g)]
  .map((match) => match[1])
  .filter((id) => id !== "field");

await mkdir(evidence, { recursive: true });
const errorsFile = path.join(evidence, "errors.txt");
const previous = await readFile(errorsFile, "utf8").catch(() => "");
// Drop lines left by earlier runs of the selected variants so a rerun does not duplicate them.
const kept = previous
  .split("\n")
  .filter(
    (line) =>
      line !== "" &&
      !selected.some((variant) => line.startsWith(`${variant.name} `)),
  );
await writeFile(errorsFile, kept.map((line) => `${line}\n`).join(""));

const failures = [];
const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  for (const variant of selected) {
    const context = await browser.newContext({
      viewport: variant.viewport,
      deviceScaleFactor: 1,
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
    let saved = 0;
    for (const id of pageIds) {
      current = id;
      await page.evaluate(
        (entries) => {
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
        await section.first().screenshot({
          path: path.join(evidence, variant.name, `${id}.jpg`),
          type: "jpeg",
          quality: 70,
        });
        saved += 1;
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
