import { afterAll, beforeAll, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  mkdirSync,
  rmSync,
  renameSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const cli = resolve(root, "packages/tiraz/bin/tiraz.mjs");
const folders: string[] = [];
const folder = () => {
  const path = mkdtempSync(join(tmpdir(), "tiraz-installer-"));
  folders.push(path);
  return path;
};
const read = (path: string) => readFileSync(path, "utf8");
const run = (cwd: string, ...args: string[]) =>
  spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });

function componentApp() {
  const app = folder();
  mkdirSync(join(app, "src"));
  writeFileSync(join(app, "src/App.tsx"), "// existing routes\n");
  writeFileSync(
    join(app, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      scripts: { dev: "vite", test: "existing-test" },
      dependencies: { react: "^19.2.0", "react-dom": "^19.2.0" },
      devDependencies: { vite: "^8.3.0", typescript: "~6.0.2" },
    }),
  );
  return app;
}

it("installs only selected components, their dependencies and a user-owned theme", () => {
  const app = componentApp();
  const result = run(app, "add", "button", "input", "badge", "--no-install");
  expect(result.status, result.stderr).toBe(0);
  const files = readdirSync(join(app, "src/system"));
  expect(files).toEqual(
    expect.arrayContaining([
      "Button.tsx",
      "Input.tsx",
      "Badge.tsx",
      "Field.tsx",
      "Provider.tsx",
    ]),
  );
  expect(files).not.toContain("Charts.tsx");
  expect(files).not.toContain("Markdown.tsx");
  expect(existsSync(join(app, "src/mascot"))).toBe(false);
  const pkg = JSON.parse(read(join(app, "package.json")));
  expect(pkg.dependencies["lucide-react"]).toBeTruthy();
  expect(pkg.dependencies["@radix-ui/react-direction"]).toBeTruthy();
  expect(pkg.dependencies.recharts).toBeUndefined();
  expect(pkg.dependencies["react-markdown"]).toBeUndefined();
  expect(pkg.dependencies["@radix-ui/react-dialog"]).toBeUndefined();
  expect(pkg.scripts.test).toBe("existing-test");
  expect(read(join(app, "src/App.tsx"))).toBe("// existing routes\n");
  const css = read(join(app, "src/system/components.css"));
  expect(css).toContain(".tz-button");
  expect(css).toContain(".tz-input");
  expect(css).toContain(".tz-badge");
  expect(css).not.toContain(".tz-chart {");
  expect(css).not.toContain("patterns/patterns.css");
  expect(read(join(app, "src/system/styles.css"))).toContain(
    "../tiraz.theme.css",
  );
  expect(read(join(app, "src/tiraz.theme.css"))).toContain("--tiraz-action");
  const manifest = JSON.parse(read(join(app, "tiraz.project.json")));
  expect(manifest.schemaVersion).toBe(2);
  expect(manifest.components).toEqual(["badge", "button", "input"]);
  expect(manifest.files[manifest.theme]).toBeUndefined();
  expect(run(app, "verify").status).toBe(0);
});

it("installs Chip with both native modes and its styles without unrelated component dependencies", () => {
  const app = componentApp();
  const result = run(app, "add", "chip", "--no-install");
  expect(result.status, result.stderr).toBe(0);
  expect(read(join(app, "src/system/index.ts"))).toContain(
    'export * from "./Chip"',
  );
  expect(existsSync(join(app, "src/system/Chip.tsx"))).toBe(true);
  expect(existsSync(join(app, "src/system/Button.tsx"))).toBe(false);
  const css = read(join(app, "src/system/components.css"));
  expect(css).toContain(".tz-chip[data-selected=");
  expect(css).toContain(".tz-chip[data-disabled]");
  expect(css).toContain(".tz-chip-label");
  const pkg = JSON.parse(read(join(app, "package.json")));
  expect(pkg.dependencies["lucide-react"]).toBeUndefined();
  expect(pkg.dependencies.recharts).toBeUndefined();
  expect(run(app, "verify").status).toBe(0);
});

it("adds incrementally without changing custom source, theme or their upstream baseline", () => {
  const app = componentApp();
  expect(run(app, "add", "button", "--no-install").status).toBe(0);
  const before = JSON.parse(read(join(app, "tiraz.project.json")));
  const button =
    read(join(app, "src/system/Button.tsx")) + "\n// My custom button\n";
  const theme = ".tiraz-system { --tiraz-radius: 12px; --font: sans-serif; }\n";
  writeFileSync(join(app, "src/system/Button.tsx"), button);
  writeFileSync(join(app, "src/tiraz.theme.css"), theme);
  expect(run(app, "add", "input", "--no-install").status).toBe(0);
  expect(read(join(app, "src/system/Button.tsx"))).toBe(button);
  expect(read(join(app, "src/tiraz.theme.css"))).toBe(theme);
  const after = JSON.parse(read(join(app, "tiraz.project.json")));
  expect(after.files["src/system/Button.tsx"]).toBe(
    before.files["src/system/Button.tsx"],
  );
  expect(read(join(app, "src/system/index.ts"))).toContain("./Input");
  expect(run(app, "verify").stderr).toContain(
    "Modified: src/system/Button.tsx",
  );
  expect(run(app, "verify").stderr).not.toContain("tiraz.theme.css");
  const index = read(join(app, "src/system/index.ts"));
  expect(run(app, "add", "input", "button", "--no-install").status).toBe(0);
  expect(read(join(app, "src/system/index.ts"))).toBe(index);
});

it("uses a recorded custom directory for later additions and preserves an existing theme", () => {
  const app = componentApp();
  mkdirSync(join(app, "src/ui"));
  writeFileSync(join(app, "src/ui/tiraz.theme.css"), "/* My theme */\n");
  expect(
    run(app, "add", "button", "--dir", "src/ui", "--no-install").status,
  ).toBe(0);
  expect(run(app, "add", "input", "--no-install").status).toBe(0);
  expect(existsSync(join(app, "src/ui/system/Input.tsx"))).toBe(true);
  expect(read(join(app, "src/ui/tiraz.theme.css"))).toBe("/* My theme */\n");
  expect(run(app, "verify").status).toBe(0);
  const mismatch = run(
    app,
    "add",
    "badge",
    "--dir",
    "src/other",
    "--no-install",
  );
  expect(mismatch.status).toBe(1);
  expect(existsSync(join(app, "src/other"))).toBe(false);
});

it.each(["index.ts", "components.css", "styles.css"])(
  "refuses to overwrite customized managed %s before writing anything",
  (file) => {
    const app = componentApp();
    expect(run(app, "add", "button", "--no-install").status).toBe(0);
    const manifest = read(join(app, "tiraz.project.json"));
    const packageText = read(join(app, "package.json"));
    writeFileSync(join(app, "src/system", file), "/* My customization */\n");
    const result = run(app, "add", "input", "--no-install");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("customized");
    expect(read(join(app, "tiraz.project.json"))).toBe(manifest);
    expect(read(join(app, "package.json"))).toBe(packageText);
    expect(existsSync(join(app, "src/system/Input.tsx"))).toBe(false);
  },
);

it("refuses unknown components and lists available names without touching the project", () => {
  const app = componentApp();
  expect(
    run(app, "add", "button", "does-not-exist", "--no-install").status,
  ).toBe(1);
  expect(existsSync(join(app, "src/system"))).toBe(false);
  const listed = run(app, "add", "--list");
  expect(listed.status, listed.stderr).toBe(0);
  expect(listed.stdout).toContain("button");
  expect(listed.stdout).toContain("date-picker");
  expect(existsSync(join(app, "tiraz.project.json"))).toBe(false);
});

it.each([
  "../outside",
  "src/../../outside",
  "node_modules/ui",
  "src\\ui",
  "src/App.tsx",
])("rejects unsafe selective destinations: %s", (directory) => {
  const app = componentApp();
  const before = read(join(app, "package.json"));
  expect(
    run(app, "add", "button", "--dir", directory, "--no-install").status,
  ).toBe(1);
  expect(read(join(app, "package.json"))).toBe(before);
  expect(existsSync(join(app, "tiraz.project.json"))).toBe(false);
});

it("rejects a symlinked theme and existing untracked source", () => {
  const app = componentApp();
  const elsewhere = folder();
  writeFileSync(join(elsewhere, "theme.css"), "owner theme");
  symlinkSync(join(elsewhere, "theme.css"), join(app, "src/tiraz.theme.css"));
  expect(run(app, "add", "button", "--no-install").status).toBe(1);
  expect(existsSync(join(app, "src/system"))).toBe(false);
  expect(read(join(elsewhere, "theme.css"))).toBe("owner theme");
  unlinkSync(join(app, "src/tiraz.theme.css"));
  mkdirSync(join(app, "src/system"));
  writeFileSync(join(app, "src/system/Button.tsx"), "owner source");
  expect(run(app, "add", "button", "--no-install").status).toBe(1);
  expect(read(join(app, "src/system/Button.tsx"))).toBe("owner source");
});

it("refuses mixed-release additions and missing installed files", () => {
  const app = componentApp();
  expect(run(app, "add", "button", "--no-install").status).toBe(0);
  const original = read(join(app, "tiraz.project.json"));
  const manifest = JSON.parse(original);
  manifest.version = "0.0.0";
  writeFileSync(join(app, "tiraz.project.json"), JSON.stringify(manifest));
  expect(run(app, "add", "input", "--no-install").stderr).toContain("version");
  writeFileSync(join(app, "tiraz.project.json"), original);
  unlinkSync(join(app, "src/system/Button.tsx"));
  expect(run(app, "add", "input", "--no-install").status).toBe(1);
  expect(existsSync(join(app, "src/system/Input.tsx"))).toBe(false);
});

it("creates a theme for complete starters and keeps theme edits outside verify", () => {
  const parent = folder();
  const result = run(
    parent,
    "init",
    "--new",
    "app",
    "--dir",
    "src/ui",
    "--no-install",
  );
  expect(result.status, result.stderr).toBe(0);
  const app = join(parent, "app");
  expect(read(join(app, "src/main.tsx"))).toContain(
    'import "./ui/tiraz.theme.css"',
  );
  const manifest = JSON.parse(read(join(app, "tiraz.project.json")));
  expect(manifest.theme).toBe("src/ui/tiraz.theme.css");
  writeFileSync(
    join(app, manifest.theme),
    ".tiraz-system { --tiraz-radius: 12px; }\n",
  );
  expect(run(app, "verify").status).toBe(0);
});

it.each(["theme", "entry", "directory", "managed", "sourceDigest"])(
  "rejects tampered selective manifest field %s before writes",
  (field) => {
    const app = componentApp();
    expect(run(app, "add", "button", "--no-install").status).toBe(0);
    const manifest = JSON.parse(read(join(app, "tiraz.project.json")));
    manifest[field] = field === "managed" ? ["src/App.tsx"] : "../outside";
    const tampered = JSON.stringify(manifest);
    writeFileSync(join(app, "tiraz.project.json"), tampered);
    expect(run(app, "add", "input", "--no-install").status).toBe(1);
    expect(read(join(app, "tiraz.project.json"))).toBe(tampered);
    expect(read(join(app, "src/App.tsx"))).toBe("// existing routes\n");
    expect(existsSync(join(app, "src/system/Input.tsx"))).toBe(false);
    expect(run(app, "verify").status).toBe(1);
  },
);

it.each(["0.1.0", "^1.0.0", "*", ">=1.0.0", "1.0.0 || ^1.55.0"])(
  "rejects unsupported dependency range %s before creating selective files",
  (range) => {
    const app = componentApp();
    const pkg = JSON.parse(read(join(app, "package.json")));
    pkg.dependencies["lucide-react"] = range;
    const original = JSON.stringify(pkg);
    writeFileSync(join(app, "package.json"), original);
    const result = run(app, "add", "button", "--no-install");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("lucide-react");
    expect(read(join(app, "package.json"))).toBe(original);
    expect(existsSync(join(app, "src/system"))).toBe(false);
  },
);

it("includes shared loading animation and conditional accessibility rules in selective styles", () => {
  const app = componentApp();
  expect(run(app, "add", "button", "--no-install").status).toBe(0);
  const css = read(join(app, "src/system/components.css"));
  expect(css).toContain("@keyframes tz-spin");
  expect(css).toContain("prefers-reduced-motion");
  expect(css).toContain("focus-visible");
  expect(css).toContain("forced-colors");
  expect(css).toContain("(hover: hover) and (pointer: fine)");
});

beforeAll(() => {
  const built = spawnSync(process.execPath, ["scripts/build-package.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  expect(built.status, built.stderr || built.stdout).toBe(0);
}, 30000);
afterAll(() => folders.forEach((path) => rmSync(path, { recursive: true })));

it("renders the artifact in production even when built from the test environment", () => {
  const rendered = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import React from "react";
    import { renderToString } from "react-dom/server";
    import { Button, SystemProvider } from "./packages/tiraz/dist/index.js";
    const html = renderToString(React.createElement(SystemProvider, null, React.createElement(Button, null, "Tiraz")));
    if (!html.includes("Tiraz")) process.exit(1);
  `,
    ],
    {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, NODE_ENV: "production" },
    },
  );
  expect(rendered.status, rendered.stderr).toBe(0);
});

it("creates an Arabic-first starter with complete source and portable guidance", () => {
  const parent = folder();
  const result = run(parent, "init", "--new", "my-app", "--no-install");
  expect(result.status, result.stderr).toBe(0);
  const app = join(parent, "my-app");
  expect(read(join(app, "src/system/ai/README.md"))).toContain("numberLocale");
  expect(existsSync(join(app, "src/mascot/assets/khayt-body.png"))).toBe(true);
  expect(read(join(app, "src/main.tsx"))).toContain("./system/tokens.css");
  expect(read(join(app, "index.html"))).toContain('dir="rtl"');
  expect(read(join(app, "vite.config.ts"))).toContain("chrome120");
  expect(read(join(app, "AGENTS.md"))).toContain("src/system/ai/README.md");
  expect(JSON.parse(read(join(app, "package.json"))).scripts.dev).toBe("vite");
});

it("adds to an existing app without changing routes, scripts or existing versions", () => {
  const app = folder();
  mkdirSync(join(app, "src"));
  writeFileSync(join(app, "src/App.tsx"), "existing route");
  writeFileSync(join(app, "AGENTS.md"), "# Existing instructions\n");
  writeFileSync(
    join(app, "package.json"),
    JSON.stringify({
      name: "existing-app",
      scripts: { dev: "custom dev", test: "custom test" },
      dependencies: { react: "^19.2.0", "lucide-react": "^1.55.0" },
      devDependencies: { vite: "^8.3.0" },
    }),
  );
  const result = run(app, "init", "--no-install");
  expect(result.status, result.stderr).toBe(0);
  const manifest = JSON.parse(read(join(app, "package.json")));
  expect(manifest.scripts).toEqual({ dev: "custom dev", test: "custom test" });
  expect(manifest.dependencies.react).toBe("^19.2.0");
  expect(manifest.dependencies["lucide-react"]).toBe("^1.55.0");
  expect(manifest.dependencies["@radix-ui/react-dialog"]).toBeTruthy();
  expect(read(join(app, "src/App.tsx"))).toBe("existing route");
  expect(read(join(app, "AGENTS.md"))).toMatch(/^# Existing instructions/);
  expect(read(join(app, "TIRAZ_SETUP.md"))).toContain("tokens.css");
});

it("refuses a source collision before writing a partial installation", () => {
  const app = folder();
  mkdirSync(join(app, "src/system"), { recursive: true });
  writeFileSync(join(app, "src/system/owner.txt"), "owner work");
  const manifest = '{"name":"existing","private":true}';
  writeFileSync(join(app, "package.json"), manifest);
  const result = run(app, "init", "--no-install");
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("already exists");
  expect(read(join(app, "package.json"))).toBe(manifest);
  expect(read(join(app, "src/system/owner.txt"))).toBe("owner work");
  expect(existsSync(join(app, "src/mascot"))).toBe(false);
  expect(existsSync(join(app, "AGENTS.md"))).toBe(false);
});

it("rejects symlinked destinations and existing new-project folders", () => {
  const app = folder();
  const elsewhere = folder();
  symlinkSync(elsewhere, join(app, "src"));
  writeFileSync(join(app, "package.json"), '{"private":true}');
  expect(run(app, "init", "--no-install").status).toBe(1);
  expect(existsSync(join(elsewhere, "system"))).toBe(false);
  const result = run(app, "init", "--new", "src", "--no-install");
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("already exists");
});

it("rejects invalid commands and missing project manifests without writing", () => {
  const app = folder();
  expect(run(app, "init", "--unknown").status).toBe(1);
  expect(run(app, "init", "--no-install").status).toBe(1);
  expect(existsSync(join(app, "src"))).toBe(false);
  expect(run(app, "--help").status).toBe(0);
});

it.each([
  { dependencies: { react: "^18.3.0" } },
  { dependencies: { react: "18" } },
  { dependencies: { react: "^18" } },
  { peerDependencies: { react: "^18.3.0" } },
  { dependencies: { react: "^19", "react-dom": "^18" } },
  { dependencies: [] },
])(
  "rejects an incompatible or malformed app before copying source: %j",
  (manifest) => {
    const app = folder();
    const original = JSON.stringify({
      devDependencies: { vite: "^8.3.0" },
      ...manifest,
    });
    writeFileSync(join(app, "package.json"), original);
    expect(run(app, "init", "--no-install").status).toBe(1);
    expect(read(join(app, "package.json"))).toBe(original);
    expect(existsSync(join(app, "src"))).toBe(false);
  },
);

it("directs non-Vite existing apps to package imports before writing source", () => {
  const app = folder();
  writeFileSync(
    join(app, "package.json"),
    JSON.stringify({ dependencies: { react: "^19", "react-dom": "^19" } }),
  );
  const result = run(app, "init", "--no-install");
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Vite");
  expect(existsSync(join(app, "src"))).toBe(false);
});

it("verifies a custom source installation after moving the whole application", () => {
  const parent = folder();
  const installed = run(
    parent,
    "init",
    "--new",
    "before",
    "--dir",
    "src/ui",
    "--no-install",
  );
  expect(installed.status, installed.stderr).toBe(0);
  const app = join(parent, "after");
  renameSync(join(parent, "before"), app);
  const manifest = JSON.parse(read(join(app, "tiraz.project.json")));
  expect(manifest.entry).toBe("src/ui/system/index.ts");
  expect(manifest.mascotEntry).toBe("src/ui/mascot/Khayt.tsx");
  expect(read(join(app, "src/App.tsx"))).toContain('from "./ui/system"');
  expect(read(join(app, "AGENTS.md"))).toContain("src/ui/system/ai/README.md");
  expect(run(app, "verify").status).toBe(0);
  writeFileSync(join(app, manifest.entry), "// owner customization\n");
  const modified = run(app, "verify");
  expect(modified.status).toBe(1);
  expect(modified.stderr).toContain("Modified: src/ui/system/index.ts");
  expect(read(join(app, manifest.entry))).toBe("// owner customization\n");
  unlinkSync(join(app, manifest.styles));
  expect(run(app, "verify").stderr).toContain(`Missing: ${manifest.styles}`);
});

it.each([
  "../outside",
  "/tmp/outside",
  "src/../../outside",
  "src//ui",
  "node_modules/ui",
  ".GIT/config",
  "NODE_MODULES/ui",
  "src\\ui",
])(
  "refuses unsafe source destinations before creating an app: %s",
  (directory) => {
    const parent = folder();
    const result = run(
      parent,
      "init",
      "--new",
      "app",
      "--dir",
      directory,
      "--no-install",
    );
    expect(result.status).toBe(1);
    expect(existsSync(join(parent, "app"))).toBe(false);
  },
);

it.each([
  "src/App.tsx",
  "src/app.tsx",
  "SRC/MAIN.TSX/nested",
  "Package.JSON",
  "src/main.tsx/nested",
  "package.json",
  "AGENTS.md",
  "TIRAZ_SETUP.md/nested",
  "tiraz.project.json",
  "tsconfig.json",
  ".gitignore",
])(
  "refuses a source folder that collides with generated files: %s",
  (directory) => {
    const parent = folder();
    const result = run(
      parent,
      "init",
      "--new",
      "app",
      "--dir",
      directory,
      "--no-install",
    );
    expect(result.status).toBe(1);
    expect(existsSync(join(parent, "app"))).toBe(false);
  },
);

it("writes relative imports for a hidden source directory", () => {
  const parent = folder();
  const result = run(
    parent,
    "init",
    "--new",
    "app",
    "--dir",
    "src/.ui",
    "--no-install",
  );
  expect(result.status, result.stderr).toBe(0);
  expect(read(join(parent, "app/src/App.tsx"))).toContain(
    'from "./.ui/system"',
  );
  expect(read(join(parent, "app/TIRAZ_SETUP.md"))).toContain(
    'from "./.ui/system"',
  );
  expect(run(join(parent, "app"), "verify").status).toBe(0);
});

it("refuses manifest collisions and tampered manifest pointers or symlinks", () => {
  const parent = folder();
  const result = run(parent, "init", "--new", "app", "--no-install");
  expect(result.status, result.stderr).toBe(0);
  const app = join(parent, "app");
  const original = read(join(app, "package.json"));
  expect(run(app, "init", "--dir", "src/other", "--no-install").status).toBe(1);
  expect(read(join(app, "package.json"))).toBe(original);
  expect(existsSync(join(app, "src/other"))).toBe(false);
  const manifestPath = join(app, "tiraz.project.json");
  const manifest = JSON.parse(read(manifestPath));
  writeFileSync(
    manifestPath,
    JSON.stringify({ ...manifest, entry: "../outside" }),
  );
  expect(run(app, "verify").status).toBe(1);
  writeFileSync(manifestPath, JSON.stringify(manifest));
  const source = join(app, manifest.entry);
  const elsewhere = join(parent, "elsewhere.ts");
  writeFileSync(elsewhere, read(source));
  unlinkSync(source);
  symlinkSync(elsewhere, source);
  const linked = run(app, "verify");
  expect(linked.status).toBe(1);
  expect(linked.stderr).toContain("symlink");
});

it("packs runtime, types, source and licenses without website or private files", () => {
  const pack = spawnSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: join(root, "packages/tiraz"),
    encoding: "utf8",
  });
  expect(pack.status, pack.stderr).toBe(0);
  const files = JSON.parse(pack.stdout)[0].files.map(
    (file: { path: string }) => file.path,
  );
  expect(files).toEqual(
    expect.arrayContaining([
      "dist/index.js",
      "dist/types/system/index.d.ts",
      "source/system/ai/registry.json",
      "source/mascot/assets/README.md",
      "source/system/ai/assets/LICENSE.txt",
      "LICENSE",
      "bin/tiraz.mjs",
    ]),
  );
  expect(files.join("\n")).not.toMatch(
    /workbench|landing|\.test\.|\.env|\.claude/,
  );
});

it("selectively installs a compiling compound Tooltip with portable scope and public entrypoints", () => {
  const app = componentApp();
  const added = run(app, "add", "tooltip", "--no-install");
  expect(added.status, added.stderr).toBe(0);
  expect(existsSync(join(app, "src/system/portal-scope.tsx"))).toBe(true);
  expect(read(join(app, "src/system/components.css"))).toContain(".tz-tooltip");
  const source = `import {Tooltip,TooltipRoot,TooltipTrigger,TooltipContent,SystemProvider} from "./src/system";
    export const example = <SystemProvider portalContainer={null} lang="ar"><TooltipRoot open={false} onOpenChange={() => {}}>
    <TooltipTrigger asChild><button>Details</button></TooltipTrigger><TooltipContent collisionPadding={8}>شرح</TooltipContent>
    </TooltipRoot><Tooltip trigger={<button>Legacy</button>} content="Legacy help" /></SystemProvider>;`;
  writeFileSync(join(app, "example.tsx"), source);
  symlinkSync(join(root, "node_modules"), join(app, "node_modules"), "dir");
  const compiled = spawnSync(
    process.execPath,
    [
      join(root, "node_modules/typescript/bin/tsc"),
      "--noEmit",
      "--strict",
      "--skipLibCheck",
      "--jsx",
      "react-jsx",
      "--moduleResolution",
      "bundler",
      "--module",
      "esnext",
      "--target",
      "es2023",
      "example.tsx",
    ],
    { cwd: app, encoding: "utf8" },
  );
  expect(compiled.status, compiled.stdout || compiled.stderr).toBe(0);
  expect(run(app, "verify").status).toBe(0);
  const manifest = JSON.parse(read(join(root, "packages/tiraz/package.json")));
  for (const path of [
    "./source/*",
    "./ai/*",
    "./tokens.css",
    "./components.css",
  ])
    expect(manifest.exports[path]).toBeDefined();
});
