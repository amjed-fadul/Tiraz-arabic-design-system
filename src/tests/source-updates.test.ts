import { afterAll, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const repo = resolve(import.meta.dirname, "../..");
const scratch = mkdtempSync(join(tmpdir(), "tiraz-updates-test-"));
let sequence = 0;
const original =
  'export const label = "Save";\n// spacing one\n// spacing two\n// spacing three\nexport const size = 8;\n';
const local = original.replace('"Save"', '"حفظ التغييرات"');
const incoming = original.replace("size = 8", "size = 10");
const read = (root: string, path: string) =>
  readFileSync(join(root, path), "utf8");
const write = (root: string, path: string, content: string | Buffer) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
};
const hash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");

function release(
  version: string,
  button = original,
  extras: Record<string, string> = {},
  dependencies = {},
) {
  const root = join(scratch, `release-${sequence++}`);
  mkdirSync(root);
  cpSync(join(repo, "packages/tiraz/bin"), join(root, "bin"), {
    recursive: true,
  });
  symlinkSync(join(repo, "node_modules"), join(root, "node_modules"), "dir");
  write(
    root,
    "package.json",
    JSON.stringify({
      name: "@amjedfadul/tiraz",
      version,
      type: "module",
      dependencies,
    }),
  );
  const files = {
    "Button.tsx": button,
    "tokens.css": ".tiraz-system { --radius: 8px; }\n",
    LICENSE: "MIT\n",
    ...extras,
  };
  for (const [path, bytes] of Object.entries(files))
    write(root, `source/system/${path}`, bytes);
  write(
    root,
    "source/components.json",
    JSON.stringify({
      schemaVersion: 1,
      name: "@amjedfadul/tiraz",
      version,
      files: Object.fromEntries(
        Object.entries(files).map(([path, bytes]) => [path, hash(bytes)]),
      ),
      rules: [".tz-button { border-radius: var(--radius); }"],
      components: {
        button: {
          source: "Button.tsx",
          api: [],
          description: ["زر", "Button"],
          files: Object.keys(files),
          exports: ['export { label, size } from "./Button";'],
          styles: [0],
          dependencies,
        },
      },
    }),
  );
  return root;
}
function run(pkg: string, app: string, ...args: string[]) {
  return spawnSync(process.execPath, [join(pkg, "bin/tiraz.mjs"), ...args], {
    cwd: app,
    encoding: "utf8",
  });
}
function appWith(pkg: string, directory = "src") {
  const app = join(scratch, `app-${sequence++}`);
  write(
    app,
    "package.json",
    JSON.stringify({
      private: true,
      type: "module",
      dependencies: { react: "^19.2.0", "react-dom": "^19.2.0" },
      devDependencies: { vite: "^8.3.0" },
    }),
  );
  const result = run(
    pkg,
    app,
    "add",
    "button",
    "--dir",
    directory,
    "--no-install",
  );
  expect(result.status, result.stderr).toBe(0);
  return app;
}
function reviewId(app: string) {
  return readdirSync(join(app, ".tiraz/reviews"))[0];
}
function backupId(app: string) {
  return readdirSync(join(app, ".tiraz/backups"))[0].replace(/\.json$/, "");
}
function snapshot(root: string): Record<string, string> {
  const result: Record<string, string> = {};
  function walk(path = "") {
    for (const entry of readdirSync(join(root, path), {
      withFileTypes: true,
    })) {
      const next = path ? `${path}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(next);
      else if (entry.isFile())
        result[next] = hash(readFileSync(join(root, next)));
    }
  }
  walk();
  return result;
}
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

it("records original bytes when installing and never replaces them with customized bytes during add", () => {
  const pkg = release("0.1.2"),
    app = appWith(pkg);
  write(app, "src/system/Button.tsx", local);
  expect(run(pkg, app, "add", "button", "--no-install").status).toBe(0);
  const baseline = JSON.parse(read(app, ".tiraz/baseline.json"));
  expect(
    Buffer.from(baseline.files["src/system/Button.tsx"], "base64").toString(),
  ).toBe(original);
  expect(read(app, "src/system/Button.tsx")).toBe(local);
});

it("previews without writes, merges independent edits, preserves the theme and supports a second update", () => {
  const old = release("0.1.2"),
    next = release("0.1.3", incoming),
    app = appWith(old);
  write(app, "src/system/Button.tsx", local);
  write(app, "src/tiraz.theme.css", "/* my brand */\n");
  const before = snapshot(app);
  const preview = run(next, app, "update");
  expect(preview.status, preview.stderr).toBe(0);
  expect(preview.stdout).toMatch(/merge.*src\/system\/Button.tsx/i);
  expect(snapshot(app)).toEqual(before);
  const applied = run(next, app, "update", "--apply");
  expect(applied.status, applied.stderr).toBe(0);
  expect(read(app, "src/system/Button.tsx")).toBe(
    local.replace("size = 8", "size = 10"),
  );
  expect(read(app, "src/tiraz.theme.css")).toBe("/* my brand */\n");
  expect(JSON.parse(read(app, "tiraz.project.json")).version).toBe("0.1.3");
  expect(run(next, app, "verify").stderr).toContain(
    "Modified: src/system/Button.tsx",
  );
  const third = release("0.1.4", incoming.replace("size = 10", "size = 12"));
  const second = run(third, app, "update", "--apply");
  expect(second.status, second.stderr).toBe(0);
  expect(read(app, "src/system/Button.tsx")).toBe(
    local.replace("size = 8", "size = 12"),
  );
});

it("keeps conflicting updates outside app files until an explicit reviewed resolution", () => {
  const old = release("0.1.2"),
    next = release("0.1.3", original.replace('"Save"', '"Save now"')),
    app = appWith(old);
  write(app, "src/system/Button.tsx", local);
  const before = snapshot(app);
  const blocked = run(next, app, "update", "--apply");
  expect(blocked.status).toBe(1);
  expect(blocked.stderr).toMatch(/conflict/i);
  expect(snapshot(app)).toEqual(before);
  expect(run(next, app, "update", "--prepare").status).toBe(0);
  const id = reviewId(app),
    path = `.tiraz/reviews/${id}/plan.json`;
  const plan = JSON.parse(read(app, path));
  expect(plan.resolutions["src/system/Button.tsx"]).toBeNull();
  expect(read(app, "src/system/Button.tsx")).toBe(local);
  expect(run(next, app, "update", "--apply", "--review", id).status).toBe(1);
  plan.resolutions["src/system/Button.tsx"] = "merged";
  write(app, path, JSON.stringify(plan));
  expect(run(next, app, "update", "--apply", "--review", id).status).toBe(1);
  const resolved = original.replace('"Save"', '"احفظ الآن"');
  write(app, `.tiraz/reviews/${id}/merged/src/system/Button.tsx`, resolved);
  const applied = run(next, app, "update", "--apply", "--review", id);
  expect(applied.status, applied.stderr).toBe(0);
  expect(read(app, "src/system/Button.tsx")).toBe(resolved);
});

it("rejects stale reviews and preserves edits made after preparing", () => {
  const old = release("0.1.2"),
    next = release("0.1.3", original.replace('"Save"', '"New"')),
    app = appWith(old);
  write(app, "src/system/Button.tsx", local);
  expect(run(next, app, "update", "--prepare").status).toBe(0);
  const id = reviewId(app);
  write(app, "src/system/Button.tsx", local + "// changed while reviewing\n");
  const before = snapshot(app);
  const result = run(next, app, "update", "--apply", "--review", id);
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/stale|changed/i);
  expect(snapshot(app)).toEqual(before);
});

it("restores an applied update and refuses to overwrite subsequent edits", () => {
  const old = release("0.1.2"),
    next = release("0.1.3", incoming),
    app = appWith(old);
  const source = read(app, "tiraz.project.json"),
    baseline = read(app, ".tiraz/baseline.json");
  expect(run(next, app, "update", "--apply").status).toBe(0);
  const id = backupId(app);
  write(app, "src/system/Button.tsx", incoming + "// later\n");
  const blocked = run(next, app, "update", "--restore", id);
  expect(blocked.status).toBe(1);
  expect(read(app, "src/system/Button.tsx")).toContain("// later");
  write(app, "src/system/Button.tsx", incoming);
  const restored = run(next, app, "update", "--restore", id);
  expect(restored.status, restored.stderr).toBe(0);
  expect(read(app, "src/system/Button.tsx")).toBe(original);
  expect(read(app, "tiraz.project.json")).toBe(source);
  expect(read(app, ".tiraz/baseline.json")).toBe(baseline);
});

it("bootstraps legacy installs only from a hash-matching original package", () => {
  const old = release("0.1.2"),
    next = release("0.1.3", incoming),
    wrong = release("0.1.2", "wrong\n"),
    app = appWith(old, "src/ui");
  unlinkSync(join(app, ".tiraz/baseline.json"));
  write(app, "src/ui/system/Button.tsx", local);
  expect(run(next, app, "update").stderr).toContain("--from");
  const before = snapshot(app);
  expect(run(next, app, "update", "--from", wrong, "--apply").status).toBe(1);
  expect(snapshot(app)).toEqual(before);
  const result = run(next, app, "update", "--from", old, "--apply");
  expect(result.status, result.stderr).toBe(0);
  expect(read(app, "src/ui/system/Button.tsx")).toBe(
    local.replace("size = 8", "size = 10"),
  );
});

it("blocks tampered baselines, unsafe paths and symlinked source before writes", () => {
  const old = release("0.1.2"),
    next = release("0.1.3", incoming),
    app = appWith(old);
  const cache = read(app, ".tiraz/baseline.json");
  const corrupt = JSON.parse(cache);
  corrupt.files["src/system/Button.tsx"] =
    Buffer.from(local).toString("base64");
  write(app, ".tiraz/baseline.json", JSON.stringify(corrupt));
  expect(run(next, app, "update", "--apply").status).toBe(1);
  expect(read(app, "src/system/Button.tsx")).toBe(original);
  write(app, ".tiraz/baseline.json", cache);
  unlinkSync(join(app, "src/system/Button.tsx"));
  const outside = join(scratch, `outside-${sequence++}`);
  writeFileSync(outside, "outside");
  symlinkSync(outside, join(app, "src/system/Button.tsx"));
  expect(run(next, app, "update", "--apply").status).toBe(1);
  expect(readFileSync(outside, "utf8")).toBe("outside");
  expect(run(next, app, "update", "--restore", "../../outside").status).toBe(1);
});

it("adds new dependencies but stops on incompatible host ranges without modifying source", () => {
  const old = release("0.1.2"),
    next = release("0.1.3", incoming, {}, { "lucide-react": "^1.55.0" }),
    app = appWith(old);
  const pkg = JSON.parse(read(app, "package.json"));
  pkg.dependencies["lucide-react"] = "^0.500.0";
  write(app, "package.json", JSON.stringify(pkg));
  const before = snapshot(app);
  expect(run(next, app, "update", "--apply").status).toBe(1);
  expect(snapshot(app)).toEqual(before);
  delete pkg.dependencies["lucide-react"];
  write(app, "package.json", JSON.stringify(pkg));
  const preview = run(next, app, "update");
  expect(preview.stdout).toContain("lucide-react");
  expect(preview.stdout).toContain("^1.55.0");
  const result = run(next, app, "update", "--apply");
  expect(result.status, result.stderr).toBe(0);
  expect(
    JSON.parse(read(app, "package.json")).dependencies["lucide-react"],
  ).toBe("^1.55.0");
  expect(existsSync(join(app, "package-lock.json"))).toBe(false);
});

it("reviews removed customized files and new untracked collisions instead of deleting them", () => {
  const old = release("0.1.2", original, {
    "retired.ts": "original retired\n",
    "clean.ts": "old\n",
  });
  const next = release("0.1.3", incoming, { "new.ts": "incoming new\n" }),
    app = appWith(old);
  write(app, "src/system/retired.ts", "my retired customization\n");
  write(app, "src/system/new.ts", "my unrelated file\n");
  expect(run(next, app, "update", "--apply").status).toBe(1);
  expect(read(app, "src/system/clean.ts")).toBe("old\n");
  expect(run(next, app, "update", "--prepare").status).toBe(0);
  const id = reviewId(app),
    path = `.tiraz/reviews/${id}/plan.json`,
    plan = JSON.parse(read(app, path));
  plan.resolutions["src/system/retired.ts"] = "local";
  plan.resolutions["src/system/new.ts"] = "local";
  write(app, path, JSON.stringify(plan));
  const result = run(next, app, "update", "--apply", "--review", id);
  expect(result.status, result.stderr).toBe(0);
  expect(read(app, "src/system/retired.ts")).toBe("my retired customization\n");
  expect(read(app, "src/system/new.ts")).toBe("my unrelated file\n");
  expect(existsSync(join(app, "src/system/clean.ts"))).toBe(false);
  expect(
    JSON.parse(read(app, "tiraz.project.json")).files["src/system/retired.ts"],
  ).toBeUndefined();
});

it("requires an explicit binary resolution and never treats an edited binary as text", () => {
  const old = release("0.1.2", original, { "asset.bin": "base\u0000" });
  const next = release("0.1.3", incoming, { "asset.bin": "incoming\u0000" }),
    app = appWith(old);
  write(app, "src/system/asset.bin", Buffer.from([0, 255, 13, 10]));
  expect(run(next, app, "update", "--prepare").status).toBe(0);
  const id = reviewId(app),
    path = `.tiraz/reviews/${id}/plan.json`,
    plan = JSON.parse(read(app, path));
  plan.resolutions["src/system/asset.bin"] = "merged";
  write(app, path, JSON.stringify(plan));
  write(
    app,
    `.tiraz/reviews/${id}/merged/src/system/asset.bin`,
    "text is not a binary merge\n",
  );
  expect(run(next, app, "update", "--apply", "--review", id).status).toBe(1);
  plan.resolutions["src/system/asset.bin"] = "local";
  write(app, path, JSON.stringify(plan));
  expect(run(next, app, "update", "--apply", "--review", id).status).toBe(0);
  expect(readFileSync(join(app, "src/system/asset.bin"))).toEqual(
    Buffer.from([0, 255, 13, 10]),
  );
});

it("preserves intentional local deletions and conflicts when upstream also changed the deleted file", () => {
  const old = release("0.1.2"),
    unchanged = release("0.1.3"),
    app = appWith(old);
  unlinkSync(join(app, "src/system/Button.tsx"));
  expect(run(unchanged, app, "update", "--apply").status).toBe(0);
  expect(existsSync(join(app, "src/system/Button.tsx"))).toBe(false);
  const next = release("0.1.4", incoming);
  const result = run(next, app, "update", "--apply");
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/conflict/i);
  expect(existsSync(join(app, "src/system/Button.tsx"))).toBe(false);
});

it("invalidates prepared reviews when only incoming dependencies changed", () => {
  const old = release("0.1.2"),
    next = release("0.1.3", incoming),
    app = appWith(old);
  expect(run(next, app, "update", "--prepare").status).toBe(0);
  const id = reviewId(app),
    catalog = JSON.parse(read(next, "source/components.json"));
  catalog.components.button.dependencies["lucide-react"] = "^1.55.0";
  write(next, "source/components.json", JSON.stringify(catalog));
  const result = run(next, app, "update", "--apply", "--review", id);
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/stale/i);
  expect(
    JSON.parse(read(app, "package.json")).dependencies["lucide-react"],
  ).toBeUndefined();
});

it("does not silently discard edits to a clean proposal in an explicitly applied review", () => {
  const old = release("0.1.2"),
    next = release("0.1.3", incoming),
    app = appWith(old);
  expect(run(next, app, "update", "--prepare").status).toBe(0);
  const id = reviewId(app);
  write(
    app,
    `.tiraz/reviews/${id}/merged/src/system/Button.tsx`,
    "// my reviewed edit\n",
  );
  const before = snapshot(app);
  const result = run(next, app, "update", "--apply", "--review", id);
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/proposal/i);
  expect(snapshot(app)).toEqual(before);
});

it("does not create backups or rewrite files for an already-current installation", () => {
  const pkg = release("0.1.2"),
    app = appWith(pkg),
    before = snapshot(app);
  const result = run(pkg, app, "update", "--apply");
  expect(result.status, result.stderr).toBe(0);
  expect(snapshot(app)).toEqual(before);
});

it("does not permit a modified review to write unrelated application paths", () => {
  const old = release("0.1.2"),
    next = release("0.1.3", incoming),
    app = appWith(old);
  write(app, "src/App.tsx", "// app-owned\n");
  expect(run(next, app, "update", "--prepare").status).toBe(0);
  const id = reviewId(app),
    path = `.tiraz/reviews/${id}/plan.json`,
    plan = JSON.parse(read(app, path));
  plan.resolutions["src/App.tsx"] = "delete";
  write(app, path, JSON.stringify(plan));
  expect(run(next, app, "update", "--apply", "--review", id).status).toBe(1);
  expect(read(app, "src/App.tsx")).toBe("// app-owned\n");
});

it("rejects downgrade and does not overwrite an existing review on a second prepare", () => {
  const old = release("0.1.2"),
    next = release("0.1.3", incoming),
    app = appWith(old);
  expect(run(next, app, "update", "--prepare").status).toBe(0);
  const id = reviewId(app);
  write(
    app,
    `.tiraz/reviews/${id}/merged/src/system/Button.tsx`,
    "my review in progress\n",
  );
  expect(run(next, app, "update", "--prepare").status).toBe(0);
  expect(readdirSync(join(app, ".tiraz/reviews"))).toHaveLength(2);
  expect(read(app, `.tiraz/reviews/${id}/merged/src/system/Button.tsx`)).toBe(
    "my review in progress\n",
  );
  expect(run(next, app, "update", "--apply").status).toBe(0);
  const before = snapshot(app);
  expect(run(old, app, "update", "--apply").status).toBe(1);
  expect(snapshot(app)).toEqual(before);
});

function completeRelease(version: string, button: string) {
  const pkg = release(version, button, {
    "index.ts": 'export { label, size } from "./Button";\n',
    "styles.css": '@import "./tokens.css";\n',
    "patterns/index.ts": "export {};\n",
    "ai/README.md": "Original guidance\n",
    "ai/generated/manifest.json": "{}\n",
    "ai/examples/TaskStarterExamples.tsx": "export {};\n",
    "components.css": ".tz-button {}\n",
  });
  write(pkg, "source/mascot/Khayt.tsx", "export {};\n");
  return pkg;
}

it("updates legacy full-source installs using original package bytes and custom source paths", () => {
  const old = completeRelease("0.1.2", original),
    next = completeRelease("0.1.3", incoming);
  const app = join(scratch, `app-${sequence++}`);
  write(
    app,
    "package.json",
    JSON.stringify({
      private: true,
      dependencies: { react: "^19.2.0", "react-dom": "^19.2.0" },
      devDependencies: { vite: "^8.3.0" },
    }),
  );
  const result = run(old, app, "init", "--dir", "src/ui", "--no-install");
  expect(result.status, result.stderr).toBe(0);
  expect(existsSync(join(app, ".tiraz/baseline.json"))).toBe(true);
  unlinkSync(join(app, ".tiraz/baseline.json"));
  const manifest = JSON.parse(read(app, "tiraz.project.json"));
  delete manifest.theme;
  write(app, "tiraz.project.json", JSON.stringify(manifest));
  write(app, "src/ui/system/Button.tsx", local);
  write(app, "src/ui/tiraz.theme.css", "/* user-owned */\n");
  const updated = run(next, app, "update", "--from", old, "--apply");
  expect(updated.status, updated.stderr).toBe(0);
  expect(read(app, "src/ui/system/Button.tsx")).toBe(
    local.replace("size = 8", "size = 10"),
  );
  expect(read(app, "src/ui/tiraz.theme.css")).toBe("/* user-owned */\n");
  expect(JSON.parse(read(app, "tiraz.project.json")).schemaVersion).toBe(1);
});

it.each([false, true])(
  "keeps a backup on write failure and respects concurrent edits: %s",
  (concurrent) => {
    const old = release("0.1.2"),
      next = release("0.1.3", incoming),
      app = appWith(old);
    const manifest = read(app, "tiraz.project.json"),
      baseline = read(app, ".tiraz/baseline.json");
    const script = `
    import fs from 'node:fs/promises';
    import {syncBuiltinESMExports} from 'node:module';
    const rename = fs.rename;
    fs.rename = async (from, to) => {
      if (to === ${JSON.stringify(join(realpathSync(app), "tiraz.project.json"))}) {
        ${concurrent ? `await fs.writeFile(${JSON.stringify(join(app, "src/system/Button.tsx"))}, '// concurrent user edit\\n');` : ""}
        throw new Error('simulated disk rename failure');
      }
      return rename(from, to);
    };
    syncBuiltinESMExports();
    process.argv = ['node', ${JSON.stringify(join(next, "bin/tiraz.mjs"))}, 'update', '--apply'];
    await import(${JSON.stringify(join(next, "bin/tiraz.mjs"))});
  `;
    const failed = spawnSync(
      process.execPath,
      ["--input-type=module", "-e", script],
      { cwd: app, encoding: "utf8" },
    );
    expect(failed.status).toBe(1);
    expect(failed.stderr).toContain("simulated disk rename failure");
    expect(read(app, "src/system/Button.tsx")).toBe(
      concurrent ? "// concurrent user edit\n" : original,
    );
    expect(read(app, "tiraz.project.json")).toBe(manifest);
    expect(read(app, ".tiraz/baseline.json")).toBe(baseline);
    expect(readdirSync(join(app, ".tiraz/backups"))).toHaveLength(1);
    expect(
      Object.keys(snapshot(app)).some((path) => path.endsWith(".tmp")),
    ).toBe(false);
  },
);

it("rolls back string-generated installation files after a later add write fails", () => {
  const pkg = release("0.1.2", original, {}, { "lucide-react": "^1.55.0" });
  const app = join(scratch, `app-${sequence++}`);
  write(
    app,
    "package.json",
    JSON.stringify({
      private: true,
      dependencies: { react: "^19.2.0", "react-dom": "^19.2.0" },
      devDependencies: { vite: "^8.3.0" },
    }),
  );
  write(app, "AGENTS.md", "# My project instructions\n");
  const before = snapshot(app);
  const script = `
    import fs from 'node:fs/promises';
    import {syncBuiltinESMExports} from 'node:module';
    const rename = fs.rename;
    fs.rename = async (from, to) => {
      if (to === ${JSON.stringify(join(realpathSync(app), ".tiraz/baseline.json"))}) throw new Error('simulated add failure');
      return rename(from, to);
    };
    syncBuiltinESMExports();
    process.argv = ['node', ${JSON.stringify(join(pkg, "bin/tiraz.mjs"))}, 'add', 'button', '--no-install'];
    await import(${JSON.stringify(join(pkg, "bin/tiraz.mjs"))});
  `;
  const failed = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", script],
    { cwd: app, encoding: "utf8" },
  );
  expect(failed.status).toBe(1);
  expect(failed.stderr).toContain("simulated add failure");
  expect(snapshot(app)).toEqual(before);
});
