import { createRequire } from "node:module";
import { mkdtemp, writeFile, symlink, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const require = createRequire(resolve(root, "package.json"));
const { createServer } = await import(require.resolve("vite"));
const { default: react } = await import(
  require.resolve("@vitejs/plugin-react")
);
const { chromium } = require(process.env.TIRAZ_PLAYWRIGHT || "playwright");
const evidence = resolve(
  process.env.TIRAZ_EVIDENCE || "docs/ai-instruction-evidence/cleanup",
);
await mkdir(evidence, { recursive: true });
const host = await mkdtemp(resolve(tmpdir(), "tiraz-example-cleanup-"));
let server;
let browser;
try {
  await symlink(
    resolve(root, "node_modules"),
    resolve(host, "node_modules"),
    "dir",
  );
  await writeFile(
    resolve(host, "index.html"),
    '<!doctype html><html lang="ar"><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>',
  );
  await writeFile(
    resolve(host, "main.tsx"),
    `import { createRoot } from "react-dom/client";
import { UsageExample } from ${JSON.stringify(resolve(root, "src/system/ai/examples/usage.tsx"))};
createRoot(document.getElementById("root")!).render(<UsageExample />);
`,
  );
  server = await createServer({
    configFile: false,
    root: host,
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      port: 5192,
      strictPort: true,
      fs: { allow: [host, root] },
    },
  });
  await server.listen();
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.TIRAZ_BROWSER,
  });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:5192");
  await page.getByRole("heading", { name: "إدارة الحساب" }).waitFor();
  const initialStorage = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
  }));
  const showPreferences = async (description) => {
    await page.getByRole("button", { name: "الإجراءات", exact: true }).click();
    const command = page.getByRole("menuitem", {
      name: "عرض التفضيلات الحالية",
      exact: true,
    });
    await command.waitFor();
    assert.equal(await page.getByRole("menuitem", { name: /حفظ/ }).count(), 0);
    await command.click();
    const notice = page
      .locator('.tz-toast[data-state="open"]')
      .filter({ hasText: "التفضيلات الحالية" });
    await notice.getByText(description, { exact: true }).waitFor();
    assert.equal(
      await notice.getByText("التفضيلات الحالية", { exact: true }).count(),
      1,
    );
    await page.getByRole("menu").waitFor({ state: "hidden" });
    await notice.evaluate((element) =>
      Promise.all(
        element.getAnimations().map((animation) => animation.finished),
      ),
    );
    await page.screenshot({
      path: resolve(
        evidence,
        description === "الإشعارات مفعلة"
          ? "example-enabled.png"
          : "example-disabled.png",
      ),
    });
    await notice.getByRole("button", { name: "إغلاق التنبيه" }).click();
    await notice.waitFor({ state: "hidden" });
  };
  await showPreferences("الإشعارات مفعلة");
  const toggle = page.getByRole("switch", { name: "إشعارات البريد" });
  await toggle.click();
  assert.equal(await toggle.getAttribute("aria-checked"), "false");
  await showPreferences("الإشعارات متوقفة");
  assert.deepEqual(
    await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage },
    })),
    initialStorage,
  );
  // A fresh page restores the example's in-memory default, not a saved setting.
  await page.reload();
  await page.getByRole("switch", { name: "إشعارات البريد" }).waitFor();
  assert.equal(
    await page
      .getByRole("switch", { name: "إشعارات البريد" })
      .getAttribute("aria-checked"),
    "true",
  );
  assert.deepEqual(errors, []);
  const results = {
    passed: true,
    checks: [
      "Honest current-preferences action and accessible menu name",
      "Enabled preference displayed",
      "Disabled preference displayed",
      "Local/session storage unchanged",
      "Reload resets in-memory preference",
    ],
    pageErrors: errors,
    screenshots: ["example-enabled.png", "example-disabled.png"],
  };
  await writeFile(
    resolve(evidence, "example-results.json"),
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser?.close();
  await server?.close();
  await rm(host, { recursive: true, force: true });
}
