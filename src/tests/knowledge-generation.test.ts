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
const generated = "src/system/ai/generated";
const folders: string[] = [];
let output: Map<string, string>;
let buildKnowledge: () => Map<string, string>;
let writeOrCheck: (
  output: Map<string, string>,
  check?: boolean,
  outputRoot?: string,
) => void;
const document = (name: string) =>
  JSON.parse(output.get(`${generated}/${name}`)!);
const api = (name: string) => document(`api/${name}.json`);

beforeAll(async () => {
  // Load the actual Node CLI module, including its native TypeScript imports.
  const moduleUrl = pathToFileURL(resolve(root, "scripts/knowledge.mjs")).href;
  ({ buildKnowledge, writeOrCheck } = await import(
    /* @vite-ignore */ moduleUrl
  ));
  output = buildKnowledge();
}, 30_000);

afterAll(() => folders.forEach((path) => rmSync(path, { recursive: true })));

it("preserves inherited DOM attributes and the icon-only button requirement", () => {
  const button = api("Button");
  expect(button.kind).toBe("component");
  expect(button.props.onClick.type).toContain("MouseEventHandler");
  expect(button.props["aria-describedby"].required).toBe(false);
  expect(button.props["aria-label"].required).toBe(false);
  const iconBranch = button.branches.find(
    (branch: { props: { iconOnly: { type: string } } }) =>
      branch.props.iconOnly.type === "true",
  );
  expect(iconBranch.props["aria-label"]).toMatchObject({
    type: "string",
    required: true,
  });
  expect(button.defaults).toMatchObject({
    variant: '"primary"',
    type: '"button"',
  });
});

it("retains optional union choices and generic parameters without flattening helpers", () => {
  const sheet = api("Sheet");
  expect(sheet.props.side).toMatchObject({ required: false });
  expect(sheet.props.side.members).toEqual(
    expect.arrayContaining(['"left"', '"right"', "undefined"]),
  );
  const table = api("DataTable");
  expect(table.signatures[0].typeParameters).toEqual([{ name: "T" }]);
  expect(table.props.data.type).toBe("readonly T[]");
  expect(table.relatedTypes.DataTableColumn).toBe("DataTableColumn.json");
  expect(api("DataTableColumn").props.cell.type).toContain("(row: T)");
  const helper = api("numberLocale");
  expect(helper.kind).toBe("function");
  expect(helper.props).toBeUndefined();
  expect(
    helper.signatures[0].parameters.map(
      (parameter: { name: string }) => parameter.name,
    ),
  ).toEqual(["config", "language"]);
  expect(helper.signatures[0].parameters[1]).toMatchObject({
    type: "string",
    required: false,
    default: 'config.direction === "rtl" ? "ar" : "en"',
  });
  expect(api("ButtonState").members).toContain('"loading"');
});

it("preserves token selectors, media conditions, references and provider values", () => {
  const inventory = document("tokens.json");
  expect(inventory.format).toBe("tiraz-css-token-inventory");
  expect(inventory.note).toContain("not a DTCG");
  expect(inventory.tokens["--surface"].values).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: '.tiraz-system[data-theme="dark"]',
        value: "#1c221e",
      }),
    ]),
  );
  expect(inventory.tokens["--motion-enter"].values).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".tiraz-system",
        atRules: [
          { name: "media", params: "(prefers-reduced-motion: reduce)" },
        ],
        value: "0ms",
      }),
    ]),
  );
  expect(inventory.tokens["--focus"].references).toContain("--action");
  expect(inventory.defaults).toMatchObject({
    density: "compact",
    numerals: "arab",
  });
  expect(inventory.tokens["--action"].provider.values.ink).toEqual({
    light: "#1F2622",
    dark: "#E6EBE6",
  });
  expect(inventory.tokens["--radius"].provider.default).toBe("8px");
});

it("links every public export to a contract and hashes source bytes without self-reference", () => {
  const manifest = document("manifest.json");
  expect(manifest.sourceRoot).toBe("../..");
  expect(manifest.publicExports).toEqual(
    expect.arrayContaining([
      "Button",
      "DataTable",
      "SystemConfig",
      "approvalRequestKey",
      "CustomerEditSheet",
      "PreferenceSettings",
      "InvoiceActions",
    ]),
  );
  for (const name of manifest.publicExports) {
    const contract = document(manifest.api[name]);
    expect(contract.exportName).toBe(name);
    expect(existsSync(resolve(root, "src/system", contract.source))).toBe(true);
    for (const pointer of Object.values(contract.relatedTypes) as string[]) {
      expect(output.has(`${generated}/api/${pointer}`)).toBe(true);
    }
  }
  expect(output.has(`${generated}/${manifest.tokens}`)).toBe(true);
  const paths = Object.keys(manifest.files);
  expect(paths).toContain("Button.tsx");
  expect(
    paths.some((path) => /ai\/generated\/|\.test\.|css-audit/.test(path)),
  ).toBe(false);
  expect(
    paths.every((path) => !path.startsWith("/") && !path.startsWith("src/")),
  ).toBe(true);
  const portrait = "ai/assets/omar.jpg";
  expect(manifest.files[portrait]).toBe(
    createHash("sha256")
      .update(readFileSync(resolve(root, "src/system", portrait)))
      .digest("hex"),
  );
});

it("detects changed, missing and obsolete artifacts and only cleans its owned directory", () => {
  const destination = mkdtempSync(join(tmpdir(), "tiraz-knowledge-"));
  folders.push(destination);
  const first = `${generated}/api/First.json`;
  const second = `${generated}/tokens.json`;
  const stale = `${generated}/api/Removed.json`;
  const expected = new Map([
    [first, '{"fresh":true}\n'],
    [second, "{}\n"],
  ]);
  const authored = resolve(destination, "src/system/ai/README.md");
  mkdirSync(dirname(authored), { recursive: true });
  writeFileSync(authored, "Caller-owned guidance\n");
  writeOrCheck(expected, false, destination);
  expect(() => writeOrCheck(expected, true, destination)).not.toThrow();
  writeFileSync(resolve(destination, first), "changed\n");
  expect(() => writeOrCheck(expected, true, destination)).toThrow(
    /Stale.*First/s,
  );
  rmSync(resolve(destination, second));
  expect(() => writeOrCheck(expected, true, destination)).toThrow(
    /Missing.*tokens/s,
  );
  writeFileSync(resolve(destination, stale), "obsolete\n");
  expect(() => writeOrCheck(expected, true, destination)).toThrow(
    /Obsolete.*Removed/s,
  );
  writeOrCheck(expected, false, destination);
  expect(existsSync(resolve(destination, stale))).toBe(false);
  expect(readFileSync(authored, "utf8")).toBe("Caller-owned guidance\n");
  expect(() => writeOrCheck(expected, true, destination)).not.toThrow();
  expect(() =>
    writeOrCheck(
      new Map([["src/system/ai/README.md", "overwrite"]]),
      false,
      destination,
    ),
  ).toThrow(/outside.*generated/i);
  expect(() =>
    writeOrCheck(
      new Map([[`${generated}/api/../tokens.json`, "{}\n"]]),
      false,
      destination,
    ),
  ).toThrow(/canonical/i);
  expect(readFileSync(resolve(destination, second), "utf8")).toBe("{}\n");
});

it("refuses cleanup through symlinks even for an empty output map", () => {
  const destination = mkdtempSync(join(tmpdir(), "tiraz-knowledge-link-"));
  folders.push(destination);
  const outside = resolve(destination, "authored");
  mkdirSync(outside);
  writeFileSync(resolve(outside, "keep.json"), "caller-owned\n");
  mkdirSync(resolve(destination, dirname(generated)), { recursive: true });
  symlinkSync(outside, resolve(destination, generated));
  expect(() => writeOrCheck(new Map(), false, destination)).toThrow(/symlink/i);
  expect(readFileSync(resolve(outside, "keep.json"), "utf8")).toBe(
    "caller-owned\n",
  );
});
