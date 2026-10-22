import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hash } from "./knowledge.mjs";
import { distribution } from "./distribution.mjs";
function safePath(root, path) {
  if (
    typeof path !== "string" ||
    !path ||
    isAbsolute(path) ||
    path.includes("\\") ||
    path.includes(":") ||
    path
      .split("/")
      .some(
        (p) =>
          !p || p === "." || p === ".." || p === ".git" || p === "node_modules",
      )
  )
    throw new Error(`Expected a safe relative path: ${path}`);
  let current = root;
  for (const segment of path.split("/")) {
    current = join(current, segment);
    // lstat also detects a dangling link, which existsSync does not.
    try {
      if (lstatSync(current).isSymbolicLink())
        throw new Error(`Refusing symlink: ${path}`);
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
  }
  return current;
}
export function install(project, destination = "src/tiraz") {
  const consumer = realpathSync(project);
  if (!lstatSync(consumer).isDirectory())
    throw new Error("Consumer project must be a directory.");
  const target = safePath(consumer, destination);
  const manifestPath = safePath(consumer, "tiraz.project.json");
  if (existsSync(manifestPath) || existsSync(target))
    throw new Error(
      "Destination or tiraz.project.json already exists; install into a separate project and review a diff.",
    );
  const { files, manifest } = distribution(destination);
  // Claim the manifest exclusively before any source writes; never overwrite user files.
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", {
    flag: "wx",
  });
  let claimedTarget = false;
  try {
    mkdirSync(dirname(target), { recursive: true });
    mkdirSync(target);
    claimedTarget = true;
    for (const [path, contents] of files) {
      const output = safePath(consumer, `${destination}/${path}`);
      mkdirSync(dirname(output), { recursive: true });
      writeFileSync(output, contents, { flag: "wx" });
    }
  } catch (e) {
    if (claimedTarget) rmSync(target, { recursive: true, force: true });
    rmSync(manifestPath);
    throw e;
  }
  return manifest;
}
export function verify(project) {
  const consumer = realpathSync(project);
  const manifest = JSON.parse(
    readFileSync(safePath(consumer, "tiraz.project.json"), "utf8"),
  );
  if (
    manifest.schemaVersion !== 1 ||
    !manifest.files ||
    !Object.keys(manifest.files).length
  )
    throw new Error("Unsupported or empty installed manifest.");
  const errors = [];
  for (const [path, expected] of Object.entries(manifest.files)) {
    const target = safePath(consumer, path);
    if (!existsSync(target)) errors.push(`Missing: ${path}`);
    else if (hash(readFileSync(target)) !== expected)
      errors.push(`Modified: ${path}`);
  }
  for (const key of [
    "entry",
    "styles",
    "patternsEntry",
    "knowledge",
    "docs",
    "examples",
    "instructions",
  ]) {
    safePath(consumer, manifest[key]);
    if (!Object.hasOwn(manifest.files, manifest[key]))
      errors.push(
        `Invalid manifest pointer: ${key} (${manifest[key]}) is not a recorded file.`,
      );
  }
  if (errors.length) throw new Error(errors.join("\n"));
  return Object.keys(manifest.files).length;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const args = process.argv.slice(2);
    if (args[0] === "--verify" && args.length === 2)
      console.log(`Verified ${verify(args[1])} installed files.`);
    else if (
      args.length >= 1 &&
      args.length <= 2 &&
      !args[0].startsWith("--")
    ) {
      const manifest = install(args[0], args[1]);
      console.log(
        `Installed Tiraz. Read tiraz.project.json and ${manifest.docs}.\nInstall compatible dependencies with your package manager:\n${Object.entries(
          manifest.dependencies,
        )
          .map(([name, version]) => `${name}@${version}`)
          .join(" ")}`,
      );
    } else
      throw new Error(
        "Usage: node scripts/install.mjs <existing-project> [relative-destination]\n       node scripts/install.mjs --verify <project>",
      );
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
