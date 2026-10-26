import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Verify a real archive in a separate consumer, with no workspace aliases or links.
const args = process.argv.slice(2);
if (args.length < 1 || args.length > 2 || (args[1] && args[1] !== "--keep")) {
  throw new Error("Usage: npm run verify:package -- <archive.tgz> [--keep]");
}
const archive = resolve(args[0]);
if (!archive.endsWith(".tgz")) throw new Error("Expected a local .tgz archive");
const bytes = await readFile(archive);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const consumer = await mkdtemp(join(tmpdir(), "tiraz-package-consumer-"));
const keep = args[1] === "--keep";
const installedVersion = async (name) =>
  JSON.parse(
    await readFile(join(root, "node_modules", name, "package.json"), "utf8"),
  ).version;
function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: consumer,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      `${command} ${commandArgs.join(" ")} failed (${result.status})`,
    );
}
try {
  await cp(join(root, "scripts/fixtures/package-consumer"), consumer, {
    recursive: true,
  });
  await writeFile(join(consumer, "tiraz.tgz"), bytes);
  const dependencies = { "@amjedfadul/tiraz": "file:./tiraz.tgz" };
  const devDependencies = {};
  for (const name of ["react", "react-dom"])
    dependencies[name] = await installedVersion(name);
  for (const name of ["typescript", "vite", "@types/react", "@types/react-dom"])
    devDependencies[name] = await installedVersion(name);
  await writeFile(
    join(consumer, "package.json"),
    JSON.stringify(
      {
        name: "tiraz-package-consumer",
        private: true,
        type: "module",
        dependencies,
        devDependencies,
        scripts: { build: "tsc --noEmit && vite build", dev: "vite" },
      },
      null,
      2,
    ) + "\n",
  );
  run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"]);
  run("npm", ["run", "build"]);
  run(process.execPath, ["verify-runtime.mjs"]);
  const pkg = JSON.parse(
    await readFile(
      join(consumer, "node_modules/@amjedfadul/tiraz/package.json"),
      "utf8",
    ),
  );
  const evidence = {
    package: pkg.name,
    version: pkg.version,
    archive,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    node: process.version,
    consumer,
    checks: ["clean-install", "typecheck", "vite-build", "compiled-runtime"],
  };
  await writeFile(
    join(consumer, "verification.json"),
    JSON.stringify(evidence, null, 2) + "\n",
  );
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  if (!keep) await rm(consumer, { recursive: true, force: true });
  else console.log(`Consumer retained at ${consumer}`);
}
