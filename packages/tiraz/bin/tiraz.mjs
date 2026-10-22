#!/usr/bin/env node
import { cp, lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import semver from "semver";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  await readFile(resolve(packageRoot, "package.json"), "utf8"),
);
const help = `Tiraz ${manifest.version} — Arabic-first React components\n\n  npx ${manifest.name} init                    Add source to an existing Vite React TypeScript app\n  npx ${manifest.name} init --new my-app       Create a Vite React TypeScript app\n  --no-install                     Prepare files without running npm install\n  --help                           Show this help\n  --version                        Show the package version\n\nRequires Node >=22.12 and React 19. Existing source is never overwritten.\n`;
const exists = async (path) => {
  try {
    return await lstat(path);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
};
async function safeFile(path) {
  const stat = await exists(path);
  if (stat?.isSymbolicLink() || (stat && !stat.isFile()))
    throw new Error(`Refusing a non-file or symlink destination: ${path}`);
}
function parse(args) {
  if (args.length === 0 || args.includes("--help")) return { help: true };
  if (args.length === 1 && args[0] === "--version") return { version: true };
  if (args[0] !== "init") throw new Error("Unknown command. Run tiraz --help.");
  let name;
  let install = true;
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--no-install") install = false;
    else if (
      args[i] === "--new" &&
      !name &&
      args[i + 1] &&
      !args[i + 1].startsWith("--")
    )
      name = args[++i];
    else throw new Error(`Unknown or incomplete option: ${args[i]}`);
  }
  return { name, install };
}

async function init({ name, install }) {
  const target = name ? resolve(process.cwd(), name) : process.cwd();
  if (name && (await exists(target)))
    throw new Error(`Project folder already exists: ${target}`);
  const src = resolve(target, "src");
  const srcStat = await exists(src);
  if (srcStat && (!srcStat.isDirectory() || srcStat.isSymbolicLink()))
    throw new Error("Refusing a non-directory or symlink src destination.");
  for (const item of ["system", "mascot"])
    if (await exists(resolve(src, item)))
      throw new Error(
        `src/${item} already exists. Review it before installing Tiraz.`,
      );
  const packageFile = resolve(target, "package.json");
  let project;
  if (name) {
    project = {
      name:
        basename(target)
          .toLowerCase()
          .replace(/[^a-z0-9._-]/g, "-") || "tiraz-app",
      version: "0.0.0",
      private: true,
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc --noEmit && vite build",
        preview: "vite preview",
      },
      dependencies: { react: "^19.2.8", "react-dom": "^19.2.8" },
      devDependencies: {
        vite: "^8.3.0",
        typescript: "~6.0.2",
        "@vitejs/plugin-react": "^6.1.1",
        "@types/react": "^19.2.18",
        "@types/react-dom": "^19.2.7",
      },
    };
  } else {
    if (!(await exists(packageFile)))
      throw new Error(
        "No package.json found. Run init inside an app or use --new my-app.",
      );
    await safeFile(packageFile);
    project = JSON.parse(await readFile(packageFile, "utf8"));
    if (!project || typeof project !== "object" || Array.isArray(project))
      throw new Error("Invalid project package.json.");
  }
  for (const section of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ]) {
    const value = project[section];
    if (value != null && (typeof value !== "object" || Array.isArray(value)))
      throw new Error(`Invalid ${section} in package.json.`);
    for (const reactPackage of ["react", "react-dom"]) {
      const range = value?.[reactPackage];
      if (
        range != null &&
        (typeof range !== "string" ||
          !semver.validRange(range) ||
          !semver.subset(range, "^19.0.0"))
      )
        throw new Error(
          `Tiraz requires a React 19 range for ${reactPackage}. Upgrade the app deliberately before installing editable source.`,
        );
    }
  }
  if (!name && !project.dependencies?.vite && !project.devDependencies?.vite)
    throw new Error(
      `Editable-source init requires a Vite React TypeScript app. For other bundlers, use npm install ${manifest.name} and package imports.`,
    );
  if (await exists(resolve(src, "tiraz-env.d.ts")))
    throw new Error(
      "src/tiraz-env.d.ts already exists. Review it before installing Tiraz.",
    );
  for (const path of ["AGENTS.md", "TIRAZ_SETUP.md"])
    await safeFile(resolve(target, path));
  if (await exists(resolve(target, "TIRAZ_SETUP.md")))
    throw new Error(
      "TIRAZ_SETUP.md already exists. Review it before installing Tiraz.",
    );
  for (const item of ["system", "mascot"])
    if (!(await exists(resolve(packageRoot, "source", item))))
      throw new Error(
        "The package source payload is missing; reinstall Tiraz.",
      );
  project.dependencies ??= {};
  for (const [dep, version] of Object.entries({
    ...manifest.dependencies,
    react: "^19.0.0",
    "react-dom": "^19.0.0",
  }))
    if (
      dep !== "semver" &&
      !project.dependencies[dep] &&
      !project.devDependencies?.[dep] &&
      !project.peerDependencies?.[dep] &&
      !project.optionalDependencies?.[dep]
    )
      project.dependencies[dep] = version;
  await mkdir(src, { recursive: true });
  for (const item of ["system", "mascot"])
    await cp(resolve(packageRoot, "source", item), resolve(src, item), {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
  await writeFile(
    resolve(src, "tiraz-env.d.ts"),
    '/// <reference types="vite/client" />\n',
  );
  await writeFile(packageFile, JSON.stringify(project, null, 2) + "\n");
  const instructions =
    "## Tiraz\n\nRead src/system/ai/README.md and query src/system/ai/registry.json before building UI. Use the exported component APIs, semantic tokens, Arabic RTL and English LTR, numberLocale, visible focus and reduced-motion support. Khayt's optional runtime lives in src/mascot; keep its assets and provenance.\n";
  const agentFile = resolve(target, "AGENTS.md");
  const previous = (await exists(agentFile))
    ? await readFile(agentFile, "utf8")
    : "";
  if (!previous.includes("src/system/ai/README.md"))
    await writeFile(
      agentFile,
      previous + (previous ? "\n" : "") + instructions,
    );
  await writeFile(resolve(target, "TIRAZ_SETUP.md"), setupGuide);
  if (name) await scaffold(target);
  console.log(
    `Tiraz source is ready in ${target}.\nRead TIRAZ_SETUP.md for imports and your first prompt.`,
  );
  if (install) {
    const installed = spawnSync(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["install"],
      { cwd: target, stdio: "inherit", shell: process.platform === "win32" },
    );
    if (installed.status !== 0)
      throw new Error(
        "Files are ready, but npm install failed. Fix the reported dependency issue and run npm install in the app.",
      );
  }
  console.log(
    name
      ? `Next: cd ${JSON.stringify(name)} && npm run dev`
      : "Keep your routes and entry files; follow TIRAZ_SETUP.md, then run your app's dev command.",
  );
}

const setupGuide = `# Tiraz setup\n\nRequires Vite, React 19 and TypeScript. Existing routes and entry files were preserved.\n\nLoad these once in your application entry:\n\n\`\`\`tsx\nimport "@fontsource/ibm-plex-sans-arabic/400.css";\nimport "@fontsource/ibm-plex-sans-arabic/500.css";\nimport "@fontsource/ibm-plex-sans-arabic/600.css";\nimport "./system/tokens.css";\nimport "./system/components.css";\nimport { Button, SystemProvider, defaultConfig } from "./system";\n\`\`\`\n\nWrap the app with SystemProvider using the full defaultConfig. Put lang="ar" and dir="rtl" on an ancestor for Arabic; use lang="en" and dir="ltr" for English. Translate application copy. Preserve :dir() in your CSS target (Chrome/Edge 120+, Firefox 114+, Safari 16.4+).\n\nOptional mascot: import { Khayt } from "./mascot/Khayt" and pass it through agentPresentation.avatar. Supply its real state, animated and a color. The existing component keeps its status text and actions.\n\nYour first prompt:\n\nRead src/system/ai/README.md and the registry, then build my first screen with Tiraz. Preserve this app's routes and data. Support Arabic RTL and English LTR, numberLocale, keyboard focus and reduced motion. Use real exported APIs and semantic tokens.\n\nRun your project's typecheck, tests and build, then inspect both languages in a browser.\n`;

async function scaffold(target) {
  const files = {
    "index.html":
      '<!doctype html>\n<html lang="ar" dir="rtl"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Tiraz</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n',
    "vite.config.ts":
      'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nexport default defineConfig({ plugins: [react()], build: { cssTarget: ["chrome120", "edge120", "firefox114", "safari16.4", "ios16.4"] } });\n',
    "tsconfig.json":
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2023",
            lib: ["ES2023", "DOM"],
            module: "ESNext",
            moduleResolution: "bundler",
            jsx: "react-jsx",
            strict: true,
            skipLibCheck: true,
            noEmit: true,
            types: ["vite/client"],
            allowArbitraryExtensions: true,
          },
          include: ["src"],
        },
        null,
        2,
      ) + "\n",
    ".gitignore": "node_modules\ndist\n.env\n.env.*\n*.local\n",
    "src/main.tsx":
      'import { createRoot } from "react-dom/client";\nimport "@fontsource/ibm-plex-sans-arabic/400.css";\nimport "@fontsource/ibm-plex-sans-arabic/500.css";\nimport "@fontsource/ibm-plex-sans-arabic/600.css";\nimport "./system/tokens.css";\nimport "./system/components.css";\nimport { App } from "./App";\ncreateRoot(document.getElementById("root")!).render(<App />);\n',
    "src/App.tsx":
      'import { useEffect, useState } from "react";\nimport { Button, SystemProvider, defaultConfig } from "./system";\nexport function App() {\n  const [ar, setAr] = useState(true);\n  useEffect(() => { document.documentElement.lang = ar ? "ar" : "en"; document.documentElement.dir = ar ? "rtl" : "ltr"; }, [ar]);\n  return <SystemProvider config={{ ...defaultConfig, direction: ar ? "rtl" : "ltr" }}><main style={{ maxInlineSize: "42rem", marginInline: "auto", padding: "var(--space-8)", fontFamily: "var(--font)", color: "var(--text)" }}><h1>{ar ? "طِراز جاهز" : "Tiraz is ready"}</h1><p>{ar ? "افتح مشروعك في أداة البرمجة، واقرأ AGENTS.md، ثم ابدأ بشاشتك الأولى." : "Open your project in your coding tool, read AGENTS.md, and build your first screen."}</p><Button onClick={() => setAr(!ar)}>{ar ? "English" : "العربية"}</Button></main></SystemProvider>;\n}\n',
  };
  for (const [path, content] of Object.entries(files))
    await writeFile(resolve(target, path), content);
}

try {
  const options = parse(process.argv.slice(2));
  if (options.help) console.log(help);
  else if (options.version) console.log(manifest.version);
  else await init(options);
} catch (error) {
  console.error(`Tiraz: ${error.message}`);
  process.exitCode = 1;
}
