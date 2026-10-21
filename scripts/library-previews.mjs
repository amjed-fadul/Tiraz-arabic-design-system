// Regenerates only public/library-previews. No tracked test evidence is touched.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
if (!process.env.TIRAZ_PLAYWRIGHT)
  throw new Error(
    "Set TIRAZ_PLAYWRIGHT to the installed playwright directory.",
  );
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT);
const fs = require("node:fs");
const root = fileURLToPath(new URL("..", import.meta.url));
const baseUrl = process.env.TIRAZ_URL || "http://127.0.0.1:5411";
(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const seed = await browser.newPage();
  await seed.goto(`${baseUrl}/library`);
  const entries = await seed.evaluate(
    async () =>
      (await import("/src/workbench/library-entries.ts")).libraryEntries,
  );
  await seed.close();
  fs.mkdirSync(`${root}/public/library-previews`, { recursive: true });
  const jobs = entries.flatMap((entry) =>
    ["ar", "en"].flatMap((language) =>
      ["light", "dark"].map((theme) => ({ entry, language, theme })),
    ),
  );
  let next = 0,
    done = 0;
  try {
    await Promise.all(
      [0, 1].map(async () => {
        while (next < jobs.length) {
          const { entry, language, theme } = jobs[next++];
          const file = `${root}/public/library-previews/${entry.key}-${language}-${theme}.jpg`;
          if (fs.existsSync(file) && !process.argv.includes("--overwrite")) {
            done++;
            continue;
          }
          const isScreen =
            entry.route.kind === "screen" || entry.key === "chat-app";
          const page = await browser.newPage({
            viewport: {
              width: isScreen ? 1280 : 720,
              height: isScreen ? 800 : 450,
            },
            reducedMotion: "reduce",
          });
          try {
            await page.addInitScript(
              ({ language, theme }) => {
                localStorage.clear();
                localStorage.setItem(
                  "tiraz.documentation.v2",
                  JSON.stringify({ language }),
                );
                localStorage.setItem("tiraz.theme.v1", JSON.stringify(theme));
                localStorage.setItem(
                  "tiraz.system.v3",
                  JSON.stringify({ reducedMotion: true }),
                );
              },
              { language, theme },
            );
            const path = isScreen
              ? `/examples/${entry.key}?lang=${language}&theme=${theme}`
              : `/examples/playground/${entry.key}`;
            await page.goto(`${baseUrl}${path}`);
            await page.locator("h1").first().waitFor();
            // Charts are lazy loaded: the page heading precedes their module.
            if (
              ["line-chart", "area-chart", "bar-chart", "donut-chart"].includes(
                entry.key,
              )
            )
              await page.locator(".recharts-surface").first().waitFor();
            await page.evaluate(() => document.fonts.ready);
            if (!isScreen)
              await page.addStyleTag({
                content:
                  ".standalone-playground{padding:0;gap:0}.standalone-playground>.doc-button{display:none}.standalone-playground>.playground-canvas{min-block-size:450px;block-size:450px;overflow:hidden;border:0;border-radius:0;padding:24px;box-shadow:none;background:var(--surface)}.standalone-playground>.playground-canvas>*{max-block-size:100%;overflow:hidden}",
              });
            await page.evaluate(
              () =>
                new Promise((resolve) =>
                  requestAnimationFrame(() => requestAnimationFrame(resolve)),
                ),
            );
            await page.evaluate(() => {
              document.body.style.backgroundColor = getComputedStyle(
                document.querySelector(".tiraz-system"),
              ).getPropertyValue("--surface");
            });
            await page.screenshot({
              path: file,
              type: "jpeg",
              quality: 65,
              animations: "disabled",
            });
            done++;
            if (done % 20 === 0) console.log(`${done}/${jobs.length}`);
          } finally {
            await page.close();
          }
        }
      }),
    );
    console.log(`Captured ${done} previews`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
