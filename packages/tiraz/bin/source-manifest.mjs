import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";

const pointers = [
  "entry",
  "styles",
  "patternsEntry",
  "knowledge",
  "docs",
  "examples",
  "instructions",
  "mascotEntry",
];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function safePath(root, path) {
  if (
    typeof path !== "string" ||
    !path ||
    isAbsolute(path) ||
    // Paths must reject control characters as well as separators.
    // eslint-disable-next-line no-control-regex
    /[\\:\x00-\x1f\x7f]/.test(path) ||
    path
      .split("/")
      .some(
        (part) =>
          !part ||
          [".", "..", ".git", "node_modules"].includes(part.toLowerCase()),
      )
  )
    throw new Error(`Expected a safe relative path: ${path}`);
  let current = root;
  for (const part of path.split("/")) {
    current = join(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink())
        throw new Error(`Refusing symlink: ${path}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return current;
}

async function fileHashes(root, directory) {
  const result = {};
  for (const entry of (
    await readdir(resolve(root, directory), { withFileTypes: true })
  ).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = `${directory}/${entry.name}`;
    await safePath(root, path);
    if (entry.isDirectory())
      Object.assign(result, await fileHashes(root, path));
    else if (entry.isFile())
      result[path] = hash(await readFile(resolve(root, path)));
    else throw new Error(`Unsupported source file: ${path}`);
  }
  return result;
}

export async function createSourceManifest(root, directory, release) {
  const system = `${directory}/system`;
  const files = Object.fromEntries(
    Object.entries({
      ...(await fileHashes(root, system)),
      ...(await fileHashes(root, `${directory}/mascot`)),
    }).sort(([a], [b]) => a.localeCompare(b)),
  );
  const manifest = {
    schemaVersion: 1,
    name: release.name,
    version: release.version,
    sourceDigest: hash(JSON.stringify(files)),
    entry: `${system}/index.ts`,
    styles: `${system}/styles.css`,
    patternsEntry: `${system}/patterns/index.ts`,
    knowledge: `${system}/ai/generated/manifest.json`,
    docs: `${system}/ai/README.md`,
    examples: `${system}/ai/examples/TaskStarterExamples.tsx`,
    instructions: `${system}/ai/README.md`,
    mascotEntry: `${directory}/mascot/Khayt.tsx`,
    files,
  };
  for (const pointer of pointers)
    if (!Object.hasOwn(files, manifest[pointer]))
      throw new Error(
        `Incomplete source payload: ${pointer} (${manifest[pointer]}). Reinstall Tiraz.`,
      );
  return manifest;
}

export function relocateSourceManifest(manifest, directory) {
  const relocate = (path) => `${directory}/${path.slice("source/".length)}`;
  const files = Object.fromEntries(
    Object.entries(manifest.files).map(([path, checksum]) => [
      relocate(path),
      checksum,
    ]),
  );
  return {
    ...manifest,
    ...Object.fromEntries(
      pointers.map((pointer) => [pointer, relocate(manifest[pointer])]),
    ),
    files,
    sourceDigest: hash(JSON.stringify(files)),
  };
}

export async function validateSubsetManifest(root, manifest) {
  if (
    manifest.schemaVersion !== 2 ||
    manifest.mode !== "components" ||
    typeof manifest.directory !== "string"
  )
    throw new Error("Unsupported selective source manifest.");
  await safePath(root, manifest.directory);
  const base = `${manifest.directory}/system`;
  const expected = {
    entry: `${base}/index.ts`,
    styles: `${base}/styles.css`,
    docs: `${base}/ai/README.md`,
    instructions: `${base}/ai/README.md`,
    knowledge: `${base}/ai/registry.json`,
    theme: `${manifest.directory}/tiraz.theme.css`,
  };
  for (const [key, path] of Object.entries(expected)) {
    if (manifest[key] !== path)
      throw new Error(`Invalid selective manifest pointer: ${key}.`);
    await safePath(root, path);
  }
  if (
    !Array.isArray(manifest.components) ||
    !manifest.components.length ||
    new Set(manifest.components).size !== manifest.components.length ||
    manifest.components.some(
      (id) => typeof id !== "string" || !/^[a-z][a-z0-9-]*$/.test(id),
    )
  )
    throw new Error("Invalid installed component list.");
  if (
    !manifest.files ||
    typeof manifest.files !== "object" ||
    Array.isArray(manifest.files) ||
    !Object.keys(manifest.files).length
  )
    throw new Error("Invalid installed file inventory.");
  for (const [path, checksum] of Object.entries(manifest.files)) {
    if (
      !path.startsWith(`${base}/`) ||
      typeof checksum !== "string" ||
      !/^[a-f0-9]{64}$/.test(checksum)
    )
      throw new Error(`Invalid installed source entry: ${path}`);
    await safePath(root, path);
  }
  const managed = [
    expected.entry,
    expected.styles,
    expected.docs,
    expected.knowledge,
    `${base}/components.css`,
  ].sort();
  if (
    !Array.isArray(manifest.managed) ||
    JSON.stringify(manifest.managed) !== JSON.stringify(managed) ||
    managed.some((path) => !Object.hasOwn(manifest.files, path))
  )
    throw new Error("Invalid managed file inventory.");
  if (hash(JSON.stringify(manifest.files)) !== manifest.sourceDigest)
    throw new Error("Invalid source manifest digest.");
}

export async function verifySource(project) {
  const root = await realpath(project);
  const manifest = JSON.parse(
    await readFile(await safePath(root, "tiraz.project.json"), "utf8"),
  );
  if (manifest.schemaVersion === 2)
    await validateSubsetManifest(root, manifest);
  if (
    ![1, 2].includes(manifest.schemaVersion) ||
    !manifest.files ||
    typeof manifest.files !== "object" ||
    Array.isArray(manifest.files) ||
    !Object.keys(manifest.files).length
  )
    throw new Error("Unsupported or empty installed manifest.");
  for (const pointer of manifest.schemaVersion === 2
    ? ["entry", "styles", "knowledge", "docs", "instructions"]
    : pointers) {
    await safePath(root, manifest[pointer]);
    if (!Object.hasOwn(manifest.files, manifest[pointer]))
      throw new Error(`Invalid manifest pointer: ${pointer}.`);
  }
  const errors = [];
  for (const [path, expected] of Object.entries(manifest.files)) {
    const target = await safePath(root, path);
    if (typeof expected !== "string" || !/^[a-f0-9]{64}$/.test(expected))
      throw new Error(`Invalid checksum: ${path}`);
    try {
      if (!(await lstat(target)).isFile()) errors.push(`Not a file: ${path}`);
      else if (hash(await readFile(target)) !== expected)
        errors.push(`Modified: ${path}`);
    } catch (error) {
      if (error.code === "ENOENT") errors.push(`Missing: ${path}`);
      else throw error;
    }
  }
  if (hash(JSON.stringify(manifest.files)) !== manifest.sourceDigest)
    errors.push("Invalid source manifest digest.");
  if (errors.length) throw new Error(errors.join("\n"));
  return Object.keys(manifest.files).length;
}
