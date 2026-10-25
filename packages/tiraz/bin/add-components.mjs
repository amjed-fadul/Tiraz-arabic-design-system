import { lstat, readFile, realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import semver from "semver";
import { safePath, validateSubsetManifest } from "./source-manifest.mjs";
import { themeSource } from "./theme.mjs";

import {
  baselinePath,
  commitPlan,
  decodeBaseline,
  encodeBaseline,
  hash,
  json,
  readOptional,
  withSourceLock,
} from "./source-files.mjs";
const sorted = (items) => [...new Set(items)].sort();
const sections = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];
async function stat(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export async function readComponentCatalog(packageRoot, release) {
  const catalog = JSON.parse(
    await readFile(resolve(packageRoot, "source/components.json"), "utf8"),
  );
  if (
    catalog.schemaVersion !== 1 ||
    catalog.name !== release.name ||
    catalog.version !== release.version
  )
    throw new Error(
      "Component catalog does not match this package. Rebuild or reinstall Tiraz.",
    );
  return catalog;
}

export function validateProject(project) {
  if (!project || typeof project !== "object" || Array.isArray(project))
    throw new Error("Invalid project package.json.");
  for (const section of sections) {
    const values = project[section];
    if (values != null && (typeof values !== "object" || Array.isArray(values)))
      throw new Error(`Invalid ${section} in package.json.`);
    for (const name of ["react", "react-dom"]) {
      if (
        values?.[name] != null &&
        (typeof values[name] !== "string" ||
          !semver.validRange(values[name]) ||
          !semver.subset(values[name], "^19.0.0"))
      )
        throw new Error(
          `Tiraz requires a React 19 range for ${name}. Upgrade deliberately before adding source.`,
        );
    }
  }
  if (!project.dependencies?.vite && !project.devDependencies?.vite)
    throw new Error(
      "Editable-source add requires a Vite React TypeScript app. Use package imports for other bundlers.",
    );
}

function subsetDocuments(directory, components, catalog) {
  const base = `${directory}/system`;
  const records = components.map((id) => ({
    id,
    source: catalog.components[id].source,
    api: catalog.components[id].api,
    purpose: catalog.components[id].description,
  }));
  return {
    [`${base}/ai/registry.json`]: json({
      schemaVersion: 1,
      sourceRoot: "..",
      components: records,
    }),
    [`${base}/ai/README.md`]: `# Your installed Tiraz components\n\nThis is a selective source installation. Follow tiraz.project.json at the application root for installed paths. Registry source paths resolve from the system directory.\n\nInstalled selections: ${components.join(", ")}.\n\nRead [registry.json](registry.json), then the linked source and its exported types before building. Shared source modules may export related components. Only exports in [../index.ts](../index.ts) are available from the barrel.\n\nUse SystemProvider and defaultConfig. Put lang and dir on an ancestor, use Arabic RTL and English LTR, and format numbers with numberLocale. Preserve keyboard focus and reduced motion. Application data, copy and actions belong to the host.\n\nImport [../styles.css](../styles.css) once. Customize [../../tiraz.theme.css](../../tiraz.theme.css); it is yours and is never rewritten by add. Source files are editable too. index.ts, components.css, styles.css and this subset guidance are managed assembly files: if you change them, add stops for review rather than overwriting them.\n\nUse the same installed release for further additions. See https://tiraz.dev for the complete library. Source updates are separate from add.\n`,
  };
}

export async function addComponents({
  packageRoot,
  release,
  names,
  directory,
  install,
}) {
  const root = await realpath(process.cwd());
  const catalog = await readComponentCatalog(packageRoot, release);
  for (const name of names) {
    if (!Object.hasOwn(catalog.components, name))
      throw new Error(`Unknown component: ${name}. Run tiraz add --list.`);
  }
  const packagePath = await safePath(root, "package.json");
  if (!(await stat(packagePath))?.isFile())
    throw new Error(
      "No package.json found. Run add inside an existing Vite React TypeScript app.",
    );
  const packageBefore = await readFile(packagePath);
  const project = JSON.parse(packageBefore.toString());
  validateProject(project);
  const installedPath = await safePath(root, "tiraz.project.json");
  const installedStat = await stat(installedPath);
  if (installedStat && !installedStat.isFile())
    throw new Error("tiraz.project.json must be a regular file.");
  const installed = installedStat
    ? JSON.parse(await readFile(installedPath, "utf8"))
    : null;
  if (installed) {
    if (installed.schemaVersion !== 2 || installed.mode !== "components")
      throw new Error(
        "This is a complete source installation. It already includes the components; add does not convert or overwrite it.",
      );
    await validateSubsetManifest(root, installed);
    if (
      installed.name !== release.name ||
      installed.version !== release.version
    )
      throw new Error(
        `Installed version ${installed.version} differs from CLI version ${release.version}. Use the CLI for the installed version; add does not upgrade source.`,
      );
    if (directory && directory !== installed.directory)
      throw new Error(
        `Source directory is already ${installed.directory}. Omit --dir for subsequent additions.`,
      );
    directory = installed.directory;
  }
  directory ??= "src";
  const sourceParent = await safePath(root, directory);
  if ((await stat(sourceParent)) && !(await stat(sourceParent)).isDirectory())
    throw new Error("Source destination must be a directory.");
  if (
    ["package.json", "AGENTS.md", "tiraz.project.json", "TIRAZ_SETUP.md"].some(
      (path) =>
        directory.toLowerCase() === path.toLowerCase() ||
        directory.toLowerCase().startsWith(`${path.toLowerCase()}/`),
    )
  )
    throw new Error("Source directory conflicts with a project file.");
  const components = sorted([...(installed?.components ?? []), ...names]);
  for (const id of components)
    if (!Object.hasOwn(catalog.components, id))
      throw new Error(`Installed component ${id} is absent from this release.`);
  const { files, sourceHashes, managedFiles, dependencies } =
    await createComponentPayload({
      packageRoot,
      release,
      names: components,
      directory,
    });
  const base = `${directory}/system`;
  const theme = `${directory}/tiraz.theme.css`;

  const writes = new Map();
  async function prepare(path, content, policy = "new") {
    const target = await safePath(root, path);
    const current = await stat(target);
    if (current && !current.isFile())
      throw new Error(`Expected a regular file: ${path}`);
    const before = current ? await readFile(target) : null;
    if (before && policy === "preserve") return;
    if (before && policy === "new")
      throw new Error(
        `Untracked file already exists: ${path}. Review it before installing.`,
      );
    if (!before?.equals(Buffer.from(content)))
      writes.set(path, { before, content });
  }
  if (installed) {
    for (const [path, expected] of Object.entries(installed.files)) {
      const target = await safePath(root, path);
      if (!(await stat(target))?.isFile())
        throw new Error(
          `Missing installed file: ${path}. Restore or review it before adding components.`,
        );
      if (
        installed.managed.includes(path) &&
        hash(await readFile(target)) !== expected
      )
        throw new Error(
          `Managed file was customized: ${path}. Keep a copy of your changes and reconcile it before adding; nothing was overwritten.`,
        );
      if (!files.has(path))
        throw new Error(
          `Installed manifest contains an unexpected file: ${path}.`,
        );
      if (!installed.managed.includes(path) && sourceHashes[path] !== expected)
        throw new Error(
          `Installed baseline differs from this package: ${path}. Add does not upgrade source.`,
        );
    }
  }
  const baselines = { ...installed?.files };
  for (const [path, bytes] of files) {
    if (
      Object.hasOwn(installed?.files ?? {}, path) &&
      !installed.managed.includes(path)
    )
      continue;
    await prepare(
      path,
      bytes,
      Object.hasOwn(installed?.files ?? {}, path) ? "replace" : "new",
    );
    baselines[path] = hash(bytes);
  }
  await prepare(theme, themeSource, "preserve");
  project.dependencies ??= {};
  for (const [name, version] of Object.entries(dependencies)) {
    const existing = sections.flatMap((section) =>
      project[section]?.[name] == null ? [] : [project[section][name]],
    );
    for (const range of existing) {
      if (
        typeof range !== "string" ||
        !semver.validRange(range) ||
        !semver.subset(range, version)
      )
        throw new Error(
          `Dependency ${name} (${range}) is incompatible with ${version}. Resolve it deliberately before adding source.`,
        );
    }
    if (!existing.length) project.dependencies[name] = version;
  }
  const agentPath = await safePath(root, "AGENTS.md");
  const agentStat = await stat(agentPath);
  if (agentStat && !agentStat.isFile())
    throw new Error("AGENTS.md must be a regular file.");
  const previous = agentStat ? await readFile(agentPath, "utf8") : "";
  if (!previous.includes(`${base}/ai/README.md`))
    await prepare(
      "AGENTS.md",
      `${previous}${previous ? "\n" : ""}## Tiraz\n\nRead tiraz.project.json and ${base}/ai/README.md before using installed components. The theme at ${theme} belongs to this application; preserve its customizations.\n`,
      "replace",
    );
  const setup = `# Tiraz selective source setup\n\nRequires Vite, React 19 and TypeScript. Your entry files and routes are unchanged.\n\nImport ${base}/styles.css once from your application entry (adjust its relative path). It loads fonts, defaults, installed component styles, and your theme in order. Import SystemProvider, defaultConfig and your components from ${base}/index.ts. Wrap the app in SystemProvider with the full defaultConfig. Set lang="ar" dir="rtl" on a host ancestor for Arabic and lang="en" dir="ltr" for English. Preserve :dir() in the CSS build target (Chrome/Edge 120+, Firefox 114+, Safari 16.4+).\n\nEdit ${theme} to customize colors, fonts and radius. Add never overwrites it. Use --tiraz-action and --tiraz-radius to override provider presets; use the other semantic tokens for surfaces and text. Check contrast in both themes.\n\nUsing the same CLI that installed these files (release ${release.version}), run add input to add another component or add --list to browse. Run verify to see changed or missing source; theme edits are intentional and excluded. Source updates are a separate workflow.\n\nRead ${base}/ai/README.md and the real exported types. Build and inspect Arabic/English layouts and keyboard focus after customization.\n`;
  await prepare("TIRAZ_SETUP.md", setup, "preserve");
  const orderedFiles = Object.fromEntries(
    Object.entries(baselines).sort(([a], [b]) => a.localeCompare(b)),
  );
  const next = {
    schemaVersion: 2,
    mode: "components",
    name: release.name,
    version: release.version,
    directory,
    components,
    theme,
    entry: `${base}/index.ts`,
    styles: `${base}/styles.css`,
    docs: `${base}/ai/README.md`,
    instructions: `${base}/ai/README.md`,
    knowledge: `${base}/ai/registry.json`,
    managed: Object.keys(managedFiles).sort(),
    files: orderedFiles,
    sourceDigest: hash(JSON.stringify(orderedFiles)),
  };
  await prepare("package.json", json(project), "replace");
  await prepare("tiraz.project.json", json(next), "replace");
  // Every path, collision, dependency and existing file has been checked before
  // any writes. Recheck each file during commit and roll back on a write failure.
  const cache = await readOptional(root, baselinePath);
  if (cache && installed) decodeBaseline(installed, cache);
  if (cache && !installed)
    throw new Error(
      "Original source cache exists without an installed manifest.",
    );
  await prepare(baselinePath, encodeBaseline(next, files), "replace");
  await withSourceLock(root, () => commitPlan(root, writes));
  console.log(
    `Tiraz components ready: ${components.join(", ")}.\nYour theme: ${theme}\nRead TIRAZ_SETUP.md for imports. Existing component edits were preserved.`,
  );
  if (install) {
    const result = spawnSync(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["install"],
      { cwd: root, stdio: "inherit", shell: process.platform === "win32" },
    );
    if (result.status !== 0)
      throw new Error(
        "Source is ready, but npm install failed. Resolve the dependency error and run npm install in your app.",
      );
  }
}

export async function createComponentPayload({
  packageRoot,
  release,
  names,
  directory,
}) {
  const catalog = await readComponentCatalog(packageRoot, release);
  const components = sorted(names);
  for (const id of components)
    if (!Object.hasOwn(catalog.components, id))
      throw new Error(`Installed component ${id} is absent from this release.`);
  const selections = components.map((id) => catalog.components[id]);
  const base = `${directory}/system`;
  const theme = `${directory}/tiraz.theme.css`;
  const files = new Map();
  const sourceHashes = {};
  for (const path of sorted(
    selections.flatMap((item) => item.files).concat(["tokens.css", "LICENSE"]),
  )) {
    const from = await safePath(resolve(packageRoot, "source/system"), path);
    if (!(await stat(from))?.isFile())
      throw new Error(
        `Missing package source: ${path}. Rebuild or reinstall Tiraz.`,
      );
    const bytes = await readFile(from);
    if (hash(bytes) !== catalog.files[path])
      throw new Error(
        `Package source does not match its catalog: ${path}. Rebuild or reinstall Tiraz.`,
      );
    files.set(`${base}/${path}`, bytes);
    sourceHashes[`${base}/${path}`] = catalog.files[path];
  }
  const exports = sorted(selections.flatMap((item) => item.exports));
  const styleIds = [...new Set(selections.flatMap((item) => item.styles))].sort(
    (a, b) => a - b,
  );
  const managedFiles = {
    [`${base}/index.ts`]: `// Tiraz-managed exports. Component implementations remain yours to edit.\n${exports.join("\n")}\n`,
    [`${base}/components.css`]: `/* Tiraz-managed styles for the installed selections. Customize ../tiraz.theme.css. */\n${styleIds.map((id) => catalog.rules[id]).join("\n")}\n`,
    [`${base}/styles.css`]:
      [400, 500, 600]
        .map(
          (weight) =>
            `@import "@fontsource/ibm-plex-sans-arabic/${weight}.css";`,
        )
        .concat([
          '@import "./tokens.css";',
          '@import "./components.css";',
          '@import "../tiraz.theme.css";',
        ])
        .join("\n") + "\n",
    ...subsetDocuments(directory, components, catalog),
  };
  for (const [path, text] of Object.entries(managedFiles))
    files.set(path, Buffer.from(text));

  const dependencies = Object.assign(
    {},
    ...selections.map((item) => item.dependencies),
  );
  const baselines = Object.fromEntries(
    [...files].map(([path, bytes]) => [path, hash(bytes)]),
  );
  const orderedFiles = Object.fromEntries(
    Object.entries(baselines).sort(([a], [b]) => a.localeCompare(b)),
  );
  const next = {
    schemaVersion: 2,
    mode: "components",
    name: release.name,
    version: release.version,
    directory,
    components,
    theme,
    entry: `${base}/index.ts`,
    styles: `${base}/styles.css`,
    docs: `${base}/ai/README.md`,
    instructions: `${base}/ai/README.md`,
    knowledge: `${base}/ai/registry.json`,
    managed: Object.keys(managedFiles).sort(),
    files: orderedFiles,
    sourceDigest: hash(JSON.stringify(orderedFiles)),
  };

  return { files, manifest: next, sourceHashes, managedFiles, dependencies };
}
