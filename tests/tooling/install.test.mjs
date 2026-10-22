import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  symlinkSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
const run = (...args) =>
  execFileSync(process.execPath, ["scripts/install.mjs", ...args], {
    encoding: "utf8",
    stdio: "pipe",
  });
test("install into a custom path, verify and detect drift without overwriting", () => {
  const root = mkdtempSync(join(tmpdir(), "tiraz consumer "));
  try {
    run(root, "src/design library");
    const manifest = JSON.parse(
      readFileSync(join(root, "tiraz.project.json"), "utf8"),
    );
    assert.equal(manifest.entry, "src/design library/src/system/index.ts");
    assert.ok(existsSync(join(root, manifest.styles)));
    assert.ok(manifest.dependencies["@radix-ui/react-direction"]);
    assert.ok(!manifest.dependencies.tailwindcss);
    assert.ok(
      !Object.keys(manifest.files).some(
        (p) => p.includes("workbench") || p.includes(".test."),
      ),
    );
    run("--verify", root);
    writeFileSync(
      join(root, "tiraz.project.json"),
      JSON.stringify({ ...manifest, entry: "missing.ts" }),
    );
    assert.throws(
      () => run("--verify", root),
      /Invalid manifest pointer: entry/,
    );
    writeFileSync(join(root, "tiraz.project.json"), JSON.stringify(manifest));
    assert.throws(() => run(root, "another"), /already exists/);
    writeFileSync(join(root, manifest.entry), "// local customization");
    assert.throws(() => run("--verify", root), /Modified/);
    assert.equal(
      readFileSync(join(root, manifest.entry), "utf8"),
      "// local customization",
    );
    rmSync(join(root, manifest.styles));
    assert.throws(() => run("--verify", root), /Missing/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("reject traversal, symlinks and occupied destinations before writing", () => {
  const root = mkdtempSync(join(tmpdir(), "tiraz safe "));
  const outside = mkdtempSync(join(tmpdir(), "tiraz outside "));
  try {
    assert.throws(() => run(root, "../escape"), /relative path/);
    assert.throws(() => run(root, "/absolute"), /relative path/);
    mkdirSync(join(root, "occupied"));
    assert.throws(() => run(root, "occupied"), /already exists/);
    symlinkSync(outside, join(root, "linked"));
    assert.throws(() => run(root, "linked/tiraz"), /symlink/);
    assert.equal(existsSync(join(root, "tiraz.project.json")), false);
    assert.equal(existsSync(join(outside, "tiraz")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test("verification rejects a manifest path outside the project", () => {
  const root = mkdtempSync(join(tmpdir(), "tiraz manifest "));
  try {
    writeFileSync(
      join(root, "tiraz.project.json"),
      JSON.stringify({ schemaVersion: 1, files: { "../outside": "digest" } }),
    );
    assert.throws(() => run("--verify", root), /relative path/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
