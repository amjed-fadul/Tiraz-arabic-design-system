import {
  readFileSync,
  existsSync,
  cpSync,
  mkdtempSync,
  mkdirSync,
  symlinkSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import * as ts from "typescript";
import { expect, it } from "vitest";
import { aiParts, catalog, patternJobs } from "../workbench/catalog";
import { defaultConfig } from "./config";
import { generateCode } from "../workbench/generate";
import { defaultPlaygrounds } from "../workbench/model";

const root = resolve("src/system");
const readRegistry = () =>
  JSON.parse(readFileSync(resolve(root, "ai/registry.json"), "utf8"));
it("recommends the available Tiraz Checkbox for Switch form choices", () => {
  const registry = readRegistry();
  const alternative = registry.components.find(
    (c: { id: string }) => c.id === "switch",
  ).alternative;
  expect(
    registry.components.some(
      (c: { id: string; api: string }) =>
        c.id === "checkbox" && c.api === "Checkbox",
    ),
  ).toBe(true);
  expect(alternative).toContain("Tiraz Checkbox for a form choice");
  expect(alternative).not.toContain("no Tiraz Checkbox");
});
// The same source-based validator is exercised by the integrity check and
// corrupted metadata cases below; mutations never alter registry.json.
let contract:
  | { checker: ts.TypeChecker; source: ts.SourceFile; symbols: ts.Symbol[] }
  | undefined;
function sourceContract() {
  if (!contract) {
    const program = ts.createProgram([resolve(root, "index.ts")], {
      target: ts.ScriptTarget.ES2023,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      types: ["vite/client"],
    });
    const checker = program.getTypeChecker();
    const source = program.getSourceFile(resolve(root, "index.ts"))!;
    contract = {
      checker,
      source,
      symbols: checker.getExportsOfModule(checker.getSymbolAtLocation(source)!),
    };
  }
  return contract;
}
function validateRequiredFlags(registry: ReturnType<typeof readRegistry>) {
  const { checker, source, symbols } = sourceContract();
  for (const component of registry.components) {
    let symbol = symbols.find((s) => s.name === component.api)!;
    if (symbol.flags & ts.SymbolFlags.Alias)
      symbol = checker.getAliasedSymbol(symbol);
    const fn = checker
      .getTypeOfSymbolAtLocation(symbol, source)
      .getCallSignatures()[0];
    const props = checker.getTypeOfSymbolAtLocation(fn.parameters[0], source);
    for (const prop of component.props) {
      const actual = checker.getPropertyOfType(props, prop.name)!;
      expect(
        !(actual.flags & ts.SymbolFlags.Optional),
        `${component.id}.${prop.name} required/optional`,
      ).toBe(prop.required);
    }
    if (component.id === "button") {
      const aria = component.props.find(
        (prop: { name: string }) => prop.name === "aria-label",
      );
      expect(
        aria.requiredWhen,
        "button.aria-label conditional requirement",
      ).toEqual({ iconOnly: true });
      // The union-level property is optional; only the icon-only branch
      // requires a name. Check the actual exported branches as well.
      expect(props.isUnion()).toBe(true);
      const branches = (props as ts.UnionType).types;
      expect(branches).toHaveLength(2);
      const requiredByBranch = branches.map((branch) => {
        const iconOnly = branch.getProperty("iconOnly")!;
        const iconType = checker.getTypeOfSymbolAtLocation(iconOnly, source);
        const name = branch.getProperty("aria-label")!;
        return {
          iconOnly: checker.typeToString(iconType),
          required: !(name.flags & ts.SymbolFlags.Optional),
        };
      });
      expect(requiredByBranch).toEqual(
        expect.arrayContaining([
          { iconOnly: "true", required: true },
          { iconOnly: "false | undefined", required: false },
        ]),
      );
    }
  }
  let configSymbol = symbols.find((symbol) => symbol.name === "SystemConfig")!;
  if (configSymbol.flags & ts.SymbolFlags.Alias)
    configSymbol = checker.getAliasedSymbol(configSymbol);
  const config = checker.getDeclaredTypeOfSymbol(configSymbol);
  for (const field of registry.configuration.fields) {
    const actual = config.getProperty(field.name)!;
    expect(
      !(actual.flags & ts.SymbolFlags.Optional),
      `configuration.${field.name} required/optional`,
    ).toBe(field.required);
  }
}
for (const [group, field, incorrect] of [
  ["tabs", "label", false],
  ["tabs", "value", true],
  ["configuration", "radius", false],
  ["configuration", "typography", true],
] as const) {
  it(`rejects incorrect required=${incorrect} for ${group}.${field}`, () => {
    const registry = readRegistry();
    const props =
      group === "configuration"
        ? registry.configuration.fields
        : registry.components.find((c: { id: string }) => c.id === group).props;
    props.find((p: { name: string }) => p.name === field).required = incorrect;
    expect(() => validateRequiredFlags(registry)).toThrow(
      `${group}.${field} required/optional`,
    );
  });
}
it("rejects making Button's accessible name unconditionally required or dropping its conditional requirement", () => {
  for (const mutation of ["unconditional", "missing-condition"] as const) {
    const registry = readRegistry();
    const aria = registry.components
      .find((c: { id: string }) => c.id === "button")
      .props.find((p: { name: string }) => p.name === "aria-label");
    if (mutation === "unconditional") aria.required = true;
    else delete aria.requiredWhen;
    expect(() => validateRequiredFlags(registry)).toThrow();
  }
});
it("compiles the bundled example after copying only the library to a different application path", () => {
  const temporary = mkdtempSync(resolve(tmpdir(), "tiraz-source-consumer-"));
  try {
    const copiedRoot = resolve(temporary, "app/ui/vendor/tiraz");
    mkdirSync(dirname(copiedRoot), { recursive: true });
    cpSync(root, copiedRoot, {
      recursive: true,
      filter: (path) => !/\.test\.[cm]?[jt]sx?$/.test(path),
    });
    symlinkSync(
      resolve("node_modules"),
      resolve(temporary, "node_modules"),
      "dir",
    );
    expect(existsSync(resolve(temporary, "README.md"))).toBe(false);
    expect(existsSync(resolve(temporary, "src/main.tsx"))).toBe(false);
    const registry = JSON.parse(
      readFileSync(resolve(copiedRoot, "ai/registry.json"), "utf8"),
    );
    const examplePaths: string[] = [
      ...new Set<string>(
        registry.components.flatMap((c: { examples: string[] }) => c.examples),
      ),
    ].map((path) => resolve(copiedRoot, path));
    // Compile copied snippets in the host, with only the relocated source bundle.
    for (const language of ["ar", "en"] as const) {
      for (const component of [
        "terminal",
        "chat-app",
        "ask-user-questions",
        "approval-card",
        "approval-flow",
        "selection-actions",
        "context-meter",
        "model-selector",
        "image-result",
        "sources",
        "insight-cards",
        "chat-thread",
        "chat-composer",
        "prompt-bar",
        "loading-state",
        "thinking-indicator",
        "thinking-state",
        "tool-call",
        "tool-chips",
        "file-tree",
        "task-rows",
        "notification-list",
        "steps",
        "timeline",
      ] as const) {
        const path = resolve(temporary, `app/${component}-${language}.tsx`);
        const code = generateCode(
          component,
          defaultPlaygrounds(language)[component],
          {
            ...defaultConfig,
            direction: language === "ar" ? "rtl" : "ltr",
          },
          language,
        ).replaceAll('"./system', '"./ui/vendor/tiraz');
        writeFileSync(path, code);
        examplePaths.push(path);
      }
    }
    const program = ts.createProgram(examplePaths, {
      target: ts.ScriptTarget.ES2023,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      types: ["vite/client"],
      typeRoots: [
        resolve(temporary, "node_modules/@types"),
        resolve(temporary, "node_modules"),
      ],
    });
    expect(
      ts
        .getPreEmitDiagnostics(program)
        .map((d) => ts.flattenDiagnosticMessageText(d.messageText, " ")),
    ).toEqual([]);
    expect(
      program
        .getSourceFiles()
        .some((file) => resolve(file.fileName).startsWith(root + "/")),
    ).toBe(false);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}, 45000);
it("resolves every registry source and example from a movable library root", () => {
  const registry = readRegistry();
  expect(registry.components.map((c: { id: string }) => c.id)).toEqual(
    catalog.map((c) => c.id),
  );
  const paths = [
    registry.entry,
    registry.composition,
    ...registry.assets.flatMap(
      (asset: { path: string; provenance: string; license: string }) => [
        asset.path,
        asset.provenance,
        asset.license,
      ],
    ),
    ...registry.publicExports.map((e: { source: string }) => e.source),
    ...registry.components.flatMap(
      (c: { source: string; examples: string[] }) => [c.source, ...c.examples],
    ),
  ];
  for (const path of paths) {
    expect(isAbsolute(path)).toBe(false);
    expect(relative(root, resolve(root, path)).startsWith("..")).toBe(false);
    expect(existsSync(resolve(root, path)), path).toBe(true);
  }
  expect(registry.configuration.defaults).toEqual(defaultConfig);
});

it("classifies AI families and links patterns and parts both ways", () => {
  type Entry = {
    id: string;
    kind?: string;
    parts?: string[];
    usedBy?: string[];
  };
  const registry = readRegistry();
  const components: Entry[] = registry.components;
  const entries = new Map<string, Entry>(
    [...components, ...registry.support].map((entry: Entry) => [
      entry.id,
      entry,
    ]),
  );
  // Only AI families carry a kind (Decision 22); the other families stay bare.
  const kinds: Record<string, readonly string[]> = {
    pattern: Object.keys(patternJobs),
    screen: ["chat-app"],
    part: aiParts,
    content: ["loading-state", "code-block", "markdown", "terminal"],
  };
  const expected = new Map(
    Object.entries(kinds).flatMap(([kind, ids]) =>
      ids.map((id) => [id, kind] as const),
    ),
  );
  for (const id of expected.keys())
    expect(
      components.some((component) => component.id === id),
      `${id} is a registry family`,
    ).toBe(true);
  for (const component of components)
    expect(component.kind, `${component.id}.kind`).toBe(
      expected.get(component.id),
    );
  // A pattern names its parts, and each part names the pattern back.
  for (const pattern of components.filter((c) => c.kind === "pattern"))
    for (const part of pattern.parts ?? [])
      expect(
        entries.get(part)?.usedBy,
        `${part} is used by ${pattern.id}`,
      ).toContain(pattern.id);
  for (const entry of entries.values())
    for (const id of entry.usedBy ?? []) {
      const pattern = components.find((component) => component.id === id);
      expect(pattern?.kind, `${entry.id} is used by ${id}`).toBe("pattern");
      expect(pattern?.parts, `${id} names ${entry.id}`).toContain(entry.id);
    }
  // Every part lists its patterns, even when no pattern builds on it.
  for (const part of components.filter((c) => c.kind === "part"))
    expect(Array.isArray(part.usedBy), `${part.id}.usedBy`).toBe(true);
});

it("documents real public exports and supported prop values and compiles the linked examples", () => {
  const registry = readRegistry();
  const files = [
    resolve(root, "index.ts"),
    ...new Set<string>(
      registry.components
        .flatMap((c: { examples: string[] }) => c.examples)
        .map((path: string) => resolve(root, path)),
    ),
  ];
  const program = ts.createProgram(files, {
    target: ts.ScriptTarget.ES2023,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    types: ["vite/client"],
  });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(files[0])!;
  const symbols = checker.getExportsOfModule(
    checker.getSymbolAtLocation(source)!,
  );
  expect(
    registry.publicExports.map((e: { name: string }) => e.name).sort(),
  ).toEqual(symbols.map((s) => s.name).sort());
  const named = (name: string) => {
    let symbol = symbols.find((s) => s.name === name)!;
    expect(symbol, name).toBeDefined();
    if (symbol.flags & ts.SymbolFlags.Alias)
      symbol = checker.getAliasedSymbol(symbol);
    return symbol;
  };
  for (const entry of registry.publicExports) {
    const symbol = named(entry.name);
    expect(
      symbol.declarations?.some(
        (d) =>
          resolve(d.getSourceFile().fileName) === resolve(root, entry.source),
      ),
      entry.name,
    ).toBe(true);
  }
  const literalValues = (type: ts.Type): unknown[] =>
    (type.isUnion() ? type.types : [type]).flatMap<unknown>((t) =>
      t.isStringLiteral() || t.isNumberLiteral()
        ? [t.value]
        : t.flags & ts.TypeFlags.BooleanLiteral
          ? [
              (t as ts.Type & { intrinsicName: string }).intrinsicName ===
                "true",
            ]
          : [],
    );
  for (const component of registry.components) {
    const symbol = named(component.api);
    const fn = checker
      .getTypeOfSymbolAtLocation(symbol, source)
      .getCallSignatures()[0];
    const props = checker.getTypeOfSymbolAtLocation(fn.parameters[0], source);
    for (const prop of component.props) {
      const actual = checker.getPropertyOfType(props, prop.name);
      expect(actual, `${component.id}.${prop.name}`).toBeDefined();
      if (prop.values)
        expect([...prop.values].sort()).toEqual(
          literalValues(
            checker.getTypeOfSymbolAtLocation(actual!, source),
          ).sort(),
        );
    }
    // Curated wrappers must document their complete explicit interface.
    if (
      [
        "line-chart",
        "area-chart",
        "bar-chart",
        "donut-chart",
        "alert",
        "skeleton",
        "progress",
        "spinner",
        "tabs",
        "accordion",
        "dropdown",
        "sheet",
        "toast",
        "avatar-group",
        "tooltip",
        "modal",
        "empty-state",
      ].includes(component.id)
    )
      expect(
        component.props.map((p: { name: string }) => p.name).sort(),
      ).toEqual(
        props
          .getProperties()
          .map((p) => p.name)
          .sort(),
      );
    for (const name of component.exports) named(name);
  }
  for (const record of registry.records) {
    const type = checker.getDeclaredTypeOfSymbol(named(record.type));
    expect(record.props.map((p: { name: string }) => p.name).sort()).toEqual(
      type
        .getProperties()
        .map((p) => p.name)
        .sort(),
    );
    for (const prop of record.props) {
      const actual = type.getProperty(prop.name)!;
      expect(!(actual.flags & ts.SymbolFlags.Optional)).toBe(prop.required);
      if (prop.values)
        expect([...prop.values].sort()).toEqual(
          literalValues(
            checker.getTypeOfSymbolAtLocation(actual, source),
          ).sort(),
        );
    }
  }
  validateRequiredFlags(registry);
  const configType = checker.getDeclaredTypeOfSymbol(named("SystemConfig"));
  expect(
    registry.configuration.fields.map((f: { name: string }) => f.name).sort(),
  ).toEqual(
    configType
      .getProperties()
      .map((p) => p.name)
      .sort(),
  );
  for (const field of registry.configuration.fields) {
    const prop = configType.getProperty(field.name)!;
    if (field.values)
      expect([...field.values].sort()).toEqual(
        literalValues(checker.getTypeOfSymbolAtLocation(prop, source)).sort(),
      );
  }
  expect(
    ts
      .getPreEmitDiagnostics(program)
      .map(
        (d) =>
          `${dirname(d.file?.fileName ?? "")}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`,
      ),
  ).toEqual([]);
}, 45000);

it("bundles relocated chat examples and portraits from copied source with provenance and license", async () => {
  const temporary = mkdtempSync(resolve(tmpdir(), "tiraz-photo-consumer-"));
  try {
    const copied = resolve(temporary, "app/ui/vendor/tiraz");
    mkdirSync(dirname(copied), { recursive: true });
    cpSync(root, copied, {
      recursive: true,
      filter: (path) => !/\.test\.[cm]?[jt]sx?$/.test(path),
    });
    symlinkSync(
      resolve("node_modules"),
      resolve(temporary, "node_modules"),
      "dir",
    );
    writeFileSync(
      resolve(temporary, "index.html"),
      '<div id="root"></div><script type="module" src="/entry.tsx"></script>',
    );
    writeFileSync(
      resolve(temporary, "entry.tsx"),
      `import {createRoot} from "react-dom/client";import {SystemProvider} from "./app/ui/vendor/tiraz";import {AvatarExamples} from "./app/ui/vendor/tiraz/ai/examples/AvatarExamples";import {ImageResultStates,SourcesExample,InsightCardsExample} from "./app/ui/vendor/tiraz/ai/examples/AIResultsExamples";import {ChatAppExample} from "./app/ui/vendor/tiraz/ai/examples/ChatAppExample";import {TerminalExample} from "./app/ui/vendor/tiraz/ai/examples/TerminalExamples";import "./app/ui/vendor/tiraz/tokens.css";import "./app/ui/vendor/tiraz/components.css";createRoot(document.getElementById("root")!).render(<SystemProvider><AvatarExamples/><ImageResultStates/><SourcesExample/><InsightCardsExample/><ChatAppExample/><TerminalExample/></SystemProvider>);`,
    );
    const { build } = await import("vite");
    const { default: react } = await import("@vitejs/plugin-react");
    const result = await build({
      root: temporary,
      configFile: false,
      plugins: [react()],
      logLevel: "silent",
      build: { write: false },
    });
    const output = (Array.isArray(result) ? result[0] : result) as {
      output: Array<{
        type: string;
        fileName: string;
        source?: Uint8Array | string;
      }>;
    };
    for (const name of ["sara", "omar"]) {
      const asset = output.output.find(
        (file) =>
          file.type === "asset" &&
          file.fileName.includes(name) &&
          file.fileName.endsWith(".jpg"),
      );
      expect(asset, name).toBeDefined();
      expect(Buffer.from(asset!.source!)).toEqual(
        readFileSync(resolve(root, `ai/assets/${name}.jpg`)),
      );
    }
    for (const name of [
      "coffee-sage",
      "coffee-clay",
      "coffee-night",
      "menu-audit",
      "menu-brief",
    ]) {
      const asset = output.output.find(
        (file) => file.type === "asset" && file.fileName.includes(name),
      );
      expect(asset, name).toBeDefined();
      const extension = name.startsWith("coffee") ? "svg" : "txt";
      expect(Buffer.from(asset!.source!)).toEqual(
        readFileSync(resolve(root, `ai/assets/results/${name}.${extension}`)),
      );
    }
    for (const file of ["README.md", "LICENSE.txt"])
      expect(readFileSync(resolve(copied, "ai/assets", file))).toEqual(
        readFileSync(resolve(root, "ai/assets", file)),
      );
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}, 15000);
