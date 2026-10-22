import { afterAll, beforeAll, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "../..");
let buildRegistry: (options?: {
  root?: string;
}) => Map<string, string | Buffer>;
let writeRegistry: (
  output: Map<string, string | Buffer>,
  options?: { root?: string; check?: boolean },
) => void;
beforeAll(async () => {
  const moduleUrl = pathToFileURL(resolve(root, "scripts/registry.mjs")).href;
  ({ buildRegistry, writeRegistry } = await import(
    /* @vite-ignore */ moduleUrl
  ));
});
const folders: string[] = [];
const hash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
);
const put = (folder: string, path: string, content: string | Buffer) => {
  mkdirSync(dirname(join(folder, path)), { recursive: true });
  writeFileSync(join(folder, path), content);
};
function fixture() {
  const folder = mkdtempSync(join(tmpdir(), "tiraz-registry-"));
  folders.push(folder);
  const files: Record<string, string | Buffer> = {
    "system/index.ts": 'export const version = "test";\n',
    "system/styles.css": '@import "./tokens.css";\n',
    "system/tokens.css": ":root { --color: red; }\n",
    "system/patterns/index.ts": 'export const pattern = "test";\n',
    "system/ai/README.md":
      "# Tiraz\n[Compose](composition.md) [Source](../index.ts) [Portrait](assets/sara.jpg)\n",
    "system/ai/composition.md": "# Composition\n",
    "system/ai/registry.json": '{"components":[]}\n',
    "system/ai/generated/manifest.json":
      JSON.stringify({
        schemaVersion: 1,
        sourceRoot: "../..",
        files: {
          "ai/assets/sara.jpg": "original-hash",
          "index.ts": "original-hash",
        },
        sourceDigest: "original-digest",
      }) + "\n",
    "system/ai/examples/TaskStarterExamples.tsx":
      "export default () => null;\n",
    "system/ai/examples/portraits.ts":
      'import portrait from "../assets/sara.jpg";\nexport { portrait };\n',
    "system/ai/assets/sara.jpg": readFileSync(
      join(root, "src/system/ai/assets/sara.jpg"),
    ),
    "system/LICENSE": "MIT\n",
    "mascot/Khayt.tsx":
      'import sprite from "./assets/body.png";\nconst query = "./assets/body.png?url#preview";\nconst unrelated = "other/body.png";\nexport { sprite, query, unrelated };\n',
    "mascot/assets/body.png": png,
  };
  for (const [path, content] of Object.entries(files))
    put(folder, `packages/tiraz/source/${path}`, content);
  put(
    folder,
    "packages/tiraz/package.json",
    JSON.stringify({
      name: "@amjedfadul/tiraz",
      version: "0.1.0",
      homepage: "https://tiraz.dev",
      dependencies: { "lucide-react": "^1.55.0", semver: "7.8.5" },
      peerDependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
    }),
  );
  return folder;
}
interface RegistryFile {
  path: string;
  type: string;
  target: string;
  content: string;
}
const itemFrom = (
  output: Map<string, string | Buffer>,
): {
  name: string;
  dependencies: string[];
  files: RegistryFile[];
} => JSON.parse(String(output.get("public/r/tiraz-system.json")));

afterAll(() => folders.forEach((path) => rmSync(path, { recursive: true })));

it("delivers a complete text registry with project-relative, verifiable files", () => {
  const folder = fixture();
  const output = buildRegistry({ root: folder });
  const item = itemFrom(output);
  expect(item).toMatchObject({
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "tiraz-system",
    type: "registry:item",
  });
  expect(item.dependencies).toEqual([
    "lucide-react@^1.55.0",
    "react@^19.0.0",
    "react-dom@^19.0.0",
  ]);
  const files = new Map(
    item.files.map((file) => {
      expect(file.type).toBe("registry:file");
      expect(file.target).toMatch(/^~\/(?:src\/tiraz\/|tiraz\.project\.json$)/);
      expect(typeof file.content).toBe("string");
      return [file.target.slice(2), file.content] as const;
    }),
  );
  expect(files.size).toBe(item.files.length);
  const manifest = JSON.parse(String(files.get("tiraz.project.json")));
  expect(manifest).toMatchObject({
    schemaVersion: 1,
    name: "@amjedfadul/tiraz",
    version: "0.1.0",
    entry: "src/tiraz/system/index.ts",
    styles: "src/tiraz/system/styles.css",
    patternsEntry: "src/tiraz/system/patterns/index.ts",
    mascotEntry: "src/tiraz/mascot/Khayt.tsx",
  });
  for (const key of [
    "entry",
    "styles",
    "patternsEntry",
    "knowledge",
    "docs",
    "examples",
    "instructions",
    "mascotEntry",
  ])
    expect(manifest.files[manifest[key]]).toBeTruthy();
  for (const [path, digest] of Object.entries(manifest.files))
    expect(hash(String(files.get(path)))).toBe(digest);
  expect(manifest.sourceDigest).toBe(hash(JSON.stringify(manifest.files)));
  expect(Object.keys(manifest.files)).toEqual(
    Object.keys(manifest.files).sort(),
  );
  expect(files.has("src/tiraz/system/LICENSE")).toBe(true);
  const index = JSON.parse(String(output.get("public/r/registry.json")));
  expect(index.items[0].name).toBe(item.name);
  expect(buildRegistry({ root: folder })).toEqual(output);
});

it("preserves raster bytes and dimensions inside SVG assets and rewrites exact references", () => {
  const item = itemFrom(buildRegistry({ root: fixture() }));
  const get = (path: string) =>
    item.files.find((file) => file.target === `~/src/tiraz/${path}`)!.content;
  expect(get("mascot/assets/body.svg")).toContain(
    'width="1" height="1" viewBox="0 0 1 1"',
  );
  expect(get("mascot/assets/body.svg")).toContain(
    `data:image/png;base64,${png.toString("base64")}`,
  );
  expect(get("mascot/Khayt.tsx")).toContain('from "./assets/body.svg"');
  expect(get("mascot/Khayt.tsx")).toContain('"other/body.png"');
  expect(get("mascot/Khayt.tsx")).toContain('"./assets/body.svg?url#preview"');
  expect(get("system/ai/assets/sara.svg")).toContain(
    'width="256" height="256"',
  );
  expect(get("system/ai/examples/portraits.ts")).toContain(
    'from "../assets/sara.svg"',
  );
  expect(get("system/ai/README.md")).toContain("(assets/sara.svg)");
  expect(item.files.some((file) => /\.(png|jpe?g)$/.test(file.target))).toBe(
    false,
  );
  const knowledge = JSON.parse(get("system/ai/generated/manifest.json"));
  expect(knowledge.files["ai/assets/sara.svg"]).toBe(
    hash(get("system/ai/assets/sara.svg")),
  );
  expect(knowledge.files["index.ts"]).toBe(hash(get("system/index.ts")));
  expect(knowledge.sourceDigest).toBe(hash(JSON.stringify(knowledge.files)));
});

it("hosts current guidance, facts, examples and their linked files without mascot raster duplication", () => {
  const folder = fixture();
  const output = buildRegistry({ root: folder });
  expect(
    JSON.parse(String(output.get("public/ai/generated/manifest.json")))
      .sourceRoot,
  ).toBe("../source");
  expect(output.get("public/ai/source/ai/generated/manifest.json")).toBe(
    readFileSync(
      join(folder, "packages/tiraz/source/system/ai/generated/manifest.json"),
      "utf8",
    ),
  );
  expect(output.has("public/ai/source/ai/assets/sara.jpg")).toBe(true);
  expect(output.get("public/ai/examples/portraits.ts")).toContain(
    "../assets/sara.jpg",
  );
  expect(output.get("public/ai/assets/sara.jpg")).toEqual(
    readFileSync(
      join(folder, "packages/tiraz/source/system/ai/assets/sara.jpg"),
    ),
  );
  expect(String(output.get("public/ai/README.md"))).toContain(
    "(source/index.ts)",
  );
  expect(output.has("public/ai/source/index.ts")).toBe(true);
  expect(
    [...output.keys()].some((path) =>
      path.startsWith("public/ai/mascot/assets/"),
    ),
  ).toBe(false);
  for (const match of String(output.get("public/llms.txt")).matchAll(
    /\]\((\/[^)]+)\)/g,
  ))
    expect(output.has(`public${match[1]}`), match[1]).toBe(true);
});

it("refuses unsupported binary files, malformed images and conversion collisions", () => {
  for (const [path, contents, message] of [
    ["system/bad.bin", Buffer.from([0, 255, 0]), /Unsupported binary/],
    ["system/empty.txt", "", /Empty source file/],
    ["mascot/assets/bad.png", Buffer.from("not a PNG"), /Invalid PNG/],
    ["mascot/assets/body.svg", "<svg/>", /collision/i],
  ] as const) {
    const folder = fixture();
    put(folder, `packages/tiraz/source/${path}`, contents);
    expect(() => buildRegistry({ root: folder })).toThrow(message);
  }
});

it("refuses source symlinks and missing manifest targets before producing output", () => {
  const folder = fixture();
  symlinkSync(
    join(folder, "packages/tiraz/package.json"),
    join(folder, "packages/tiraz/source/system/link.json"),
  );
  expect(() => buildRegistry({ root: folder })).toThrow(/symlink/i);
  rmSync(join(folder, "packages/tiraz/source/system/link.json"));
  rmSync(join(folder, "packages/tiraz/source/system/styles.css"));
  expect(() => buildRegistry({ root: folder })).toThrow(/styles\.css/);
});

it("checks freshness and removes obsolete generated files only inside its owned directories", () => {
  const folder = fixture();
  const output = buildRegistry({ root: folder });
  put(folder, "public/owner.txt", "keep me");
  writeRegistry(output, { root: folder });
  expect(() =>
    writeRegistry(output, { root: folder, check: true }),
  ).not.toThrow();
  put(folder, "public/r/obsolete.json", "{}");
  expect(() => writeRegistry(output, { root: folder, check: true })).toThrow(
    /obsolete/i,
  );
  writeRegistry(output, { root: folder });
  expect(existsSync(join(folder, "public/r/obsolete.json"))).toBe(false);
  expect(readFileSync(join(folder, "public/owner.txt"), "utf8")).toBe(
    "keep me",
  );
  put(folder, "public/llms.txt", "stale");
  expect(() => writeRegistry(output, { root: folder, check: true })).toThrow(
    /llms\.txt/,
  );
});

it("refuses dangling output symlinks and writes outside its owned destinations", () => {
  const folder = fixture();
  const output = buildRegistry({ root: folder });
  mkdirSync(join(folder, "public"));
  symlinkSync(join(folder, "owner.txt"), join(folder, "public/llms.txt"));
  expect(() => writeRegistry(output, { root: folder })).toThrow(/symlink/i);
  expect(existsSync(join(folder, "owner.txt"))).toBe(false);
  expect(existsSync(join(folder, "public/r"))).toBe(false);
  rmSync(join(folder, "public/llms.txt"));
  expect(() =>
    writeRegistry(new Map([["public/owner.txt", "bad"]]), { root: folder }),
  ).toThrow(/does not own/);
  expect(() =>
    writeRegistry(new Map([["public/ai/../owner.txt", "bad"]]), {
      root: folder,
    }),
  ).toThrow(/Invalid registry output path/);
});
