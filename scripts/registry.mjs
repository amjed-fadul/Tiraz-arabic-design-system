import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { decodeText, registrySource } from "./registry-assets.mjs";

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ownedDirectories = ["public/ai", "public/r"];
const json = (value) => JSON.stringify(value, null, 2) + "\n";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function filesUnder(root, directory) {
  const files = [];
  function visit(path) {
    const stat = lstatSync(join(root, path));
    if (stat.isSymbolicLink()) throw new Error(`Refusing symlink: ${path}`);
    if (stat.isDirectory()) {
      for (const name of readdirSync(join(root, path)).sort())
        visit(`${path}/${name}`);
    } else if (stat.isFile()) files.push(path);
    else throw new Error(`Unsupported file: ${path}`);
  }
  visit(directory);
  return files;
}

function publicKnowledge(source) {
  const output = new Map();
  const destinations = new Map();
  for (const path of source.keys()) {
    if (path.startsWith("system/")) {
      const bytes = source.get(path);
      output.set(
        `public/ai/source/${path.slice(7)}`,
        /\.(png|jpe?g)$/i.test(path) ? bytes : decodeText(bytes, path),
      );
    }
    if (path.startsWith("system/ai/"))
      destinations.set(path, `public/ai/${path.slice(10)}`);
    else if (path.startsWith("system/"))
      destinations.set(path, `public/ai/source/${path.slice(7)}`);
  }
  for (const [path, target] of destinations) {
    const bytes = source.get(path);
    if (/\.(png|jpe?g)$/i.test(path)) {
      output.set(target, bytes);
      continue;
    }
    let content = decodeText(bytes, path);
    if (path === "system/ai/generated/manifest.json")
      content = json({ ...JSON.parse(content), sourceRoot: "../source" });
    if (path.endsWith(".md")) {
      content = content.replace(
        /(\]\()([^\s)]+)(\))/g,
        (whole, before, reference, after) => {
          if (/^(?:#|\/|[a-z]+:)/i.test(reference)) return whole;
          const [, pathname, suffix = ""] =
            reference.match(/^([^?#]*)([?#].*)?$/s);
          const original = posix.normalize(
            posix.join(posix.dirname(path), pathname),
          );
          const destination = destinations.get(original);
          if (!destination)
            throw new Error(
              `Missing hosted guidance link: ${path} -> ${reference}`,
            );
          return `${before}${posix.relative(posix.dirname(target), destination)}${suffix}${after}`;
        },
      );
    }
    output.set(target, content);
  }
  output.set(
    "public/llms.txt",
    `# Tiraz\n\nArabic-first React components, task patterns, and editable source.\n\n## Start here\n\n- [Integration and instructions](/ai/README.md)\n- [Composition guidance](/ai/composition.md)\n- [Component and pattern registry](/ai/registry.json)\n- [Generated TypeScript contracts and source hashes](/ai/generated/manifest.json)\n- [Source entry](/ai/source/index.ts)\n- [Source styles](/ai/source/styles.css)\n- [Task starter example](/ai/examples/TaskStarterExamples.tsx)\n- [Complete shadcn source item](/r/tiraz-system.json)\n\nRead the relevant registry entry, then the linked source and exported types. Registry and generated metadata source paths resolve from the library source root, available here under /ai/source/. Authored guidance is separate from generated API facts. Examples are host-owned application code. The shadcn item includes the complete system and optional mascot; its raster artwork is delivered as SVG wrappers preserving the original raster bytes and intrinsic dimensions.\n`,
  );
  return output;
}

function refreshDeliveredHashes(files) {
  const path = "system/ai/generated/manifest.json";
  const manifest = JSON.parse(files.get(path));
  if (!manifest.files || typeof manifest.files !== "object")
    throw new Error(
      "Built knowledge manifest is missing its source file inventory.",
    );
  const hashes = Object.fromEntries(
    Object.keys(manifest.files)
      .sort()
      .map((source) => {
        const content = files.get(`system/${source}`);
        if (content === undefined)
          throw new Error(`Missing knowledge source: ${source}`);
        return [source, hash(content)];
      }),
  );
  files.set(
    path,
    json({
      ...manifest,
      files: hashes,
      sourceDigest: hash(JSON.stringify(hashes)),
    }),
  );
  for (const [name, content] of files) {
    if (!name.startsWith("system/ai/generated/api/") || !name.endsWith(".json"))
      continue;
    const api = JSON.parse(content);
    if (!hashes[api.source])
      throw new Error(`Missing API source: ${name} -> ${api.source}`);
    files.set(name, json({ ...api, sourceHash: hashes[api.source] }));
  }
}

/** Build from the exact editable payload produced by build-package.mjs. */
export function buildRegistry({ root = defaultRoot } = {}) {
  const packageRoot = "packages/tiraz";
  const manifest = JSON.parse(
    readFileSync(join(root, packageRoot, "package.json"), "utf8"),
  );
  const sourceRoot = `${packageRoot}/source`;
  const source = new Map(
    ["system", "mascot"].flatMap((directory) =>
      filesUnder(root, `${sourceRoot}/${directory}`).map((path) => [
        path.slice(sourceRoot.length + 1),
        readFileSync(join(root, path)),
      ]),
    ),
  );
  const files = registrySource(source);
  const dependencies = Object.fromEntries(
    Object.entries({
      ...manifest.dependencies,
      react: manifest.peerDependencies.react,
      "react-dom": manifest.peerDependencies["react-dom"],
    })
      .filter(([name]) => name !== "semver")
      .sort(([a], [b]) => compare(a, b)),
  );
  const pointers = {
    entry: "system/index.ts",
    styles: "system/styles.css",
    patternsEntry: "system/patterns/index.ts",
    knowledge: "system/ai/generated/manifest.json",
    docs: "system/ai/README.md",
    examples: "system/ai/examples/TaskStarterExamples.tsx",
    instructions: "system/ai/README.md",
    mascotEntry: "mascot/Khayt.tsx",
  };
  for (const path of Object.values(pointers)) {
    if (!files.has(path))
      throw new Error(
        `Missing built source file: ${sourceRoot}/${path}. Run npm run build:package first.`,
      );
  }
  refreshDeliveredHashes(files);
  const hashes = Object.fromEntries(
    [...files].map(([path, content]) => [`src/tiraz/${path}`, hash(content)]),
  );
  const project = {
    schemaVersion: 1,
    name: manifest.name,
    version: manifest.version,
    sourceDigest: hash(JSON.stringify(hashes)),
    ...Object.fromEntries(
      Object.entries(pointers).map(([key, path]) => [key, `src/tiraz/${path}`]),
    ),
    dependencies,
    files: hashes,
  };
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "tiraz-system",
    type: "registry:item",
    title: "Tiraz",
    description:
      "Arabic-first React system with complete editable source, task patterns, contracts, examples and optional Khayt mascot.",
    dependencies: Object.entries(dependencies).map(
      ([name, version]) => `${name}@${version}`,
    ),
    docs: "Import ./src/tiraz/system/styles.css once, use SystemProvider, and read src/tiraz/system/ai/README.md. Khayt is optional at src/tiraz/mascot/Khayt.tsx. Artwork uses SVG wrappers preserving the original raster bytes and dimensions. The installation manifest is tiraz.project.json; run npx @amjedfadul/tiraz verify to check installed files.",
    files: [...files]
      .map(([path, content]) => ({
        path: `tiraz/${path}`,
        type: "registry:file",
        target: `~/src/tiraz/${path}`,
        content,
      }))
      .concat({
        path: "tiraz.project.json",
        type: "registry:file",
        target: "~/tiraz.project.json",
        content: json(project),
      }),
  };
  const output = publicKnowledge(source);
  output.set("public/r/tiraz-system.json", json(item));
  // The index needs searchable metadata, not a second copy of every asset.
  const { files: itemFiles, ...metadata } = item;
  output.set(
    "public/r/registry.json",
    json({
      $schema: "https://ui.shadcn.com/schema/registry.json",
      name: "tiraz",
      homepage: manifest.homepage,
      items: [
        {
          ...metadata,
          files: itemFiles.map(({ content: _content, ...file }) => file),
        },
      ],
    }),
  );
  return new Map([...output].sort(([a], [b]) => compare(a, b)));
}

function validateOutput(root, path) {
  if (
    path !== "public/llms.txt" &&
    !ownedDirectories.some((directory) => path.startsWith(`${directory}/`))
  )
    throw new Error(`Registry does not own output: ${path}`);
  const parts = path.split("/");
  if (
    parts.some(
      (part) => !part || part === "." || part === ".." || part.includes("\\"),
    )
  )
    throw new Error(`Invalid registry output path: ${path}`);
  for (let index = 1; index <= parts.length; index++) {
    const current = join(root, ...parts.slice(0, index));
    if (lstatSync(current, { throwIfNoEntry: false })?.isSymbolicLink())
      throw new Error(`Refusing symlink: ${current}`);
  }
}

/** Freshness checks and cleanup are limited to public/ai, public/r and llms.txt. */
export function writeRegistry(
  output,
  { root = defaultRoot, check = false } = {},
) {
  for (const path of [...ownedDirectories, "public/llms.txt"])
    validateOutput(
      root,
      path.endsWith(".txt") ? path : `${path}/.ownership-check`,
    );
  for (const path of output.keys()) validateOutput(root, path);
  const existing = ownedDirectories.flatMap((directory) =>
    existsSync(join(root, directory)) ? filesUnder(root, directory) : [],
  );
  const obsolete = existing.filter((path) => !output.has(path));
  const changed = [...output]
    .filter(
      ([path, content]) =>
        !existsSync(join(root, path)) ||
        !readFileSync(join(root, path)).equals(Buffer.from(content)),
    )
    .map(([path]) => path);
  if (check) {
    if (obsolete.length || changed.length)
      throw new Error(
        `Stale registry delivery. Regenerate with node scripts/registry.mjs.\n${changed
          .map((path) => `Changed or missing: ${path}`)
          .concat(obsolete.map((path) => `Obsolete: ${path}`))
          .join("\n")}`,
      );
    return;
  }
  for (const path of obsolete) rmSync(join(root, path));
  for (const [path, content] of output) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    if (process.argv.slice(2).some((argument) => argument !== "--check"))
      throw new Error("Usage: node scripts/registry.mjs [--check]");
    writeRegistry(buildRegistry(), { check: process.argv.includes("--check") });
    console.log(
      process.argv.includes("--check")
        ? "Registry delivery is current."
        : "Registry and hosted AI guidance generated.",
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
