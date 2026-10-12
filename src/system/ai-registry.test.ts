import {
  readFileSync,
  existsSync,
  cpSync,
  mkdtempSync,
  mkdirSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import * as ts from "typescript";
import { expect, it } from "vitest";
import { catalog } from "../workbench/catalog";
import { defaultConfig } from "./config";

const root = resolve("src/system");
const readRegistry = () =>
  JSON.parse(readFileSync(resolve(root, "ai/registry.json"), "utf8"));
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
}, 15000);
it("resolves every registry source and example from a movable library root", () => {
  const registry = readRegistry();
  expect(registry.components.map((c: { id: string }) => c.id)).toEqual(
    catalog.map((c) => c.id),
  );
  const paths = [
    registry.entry,
    registry.composition,
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
      t.isStringLiteral()
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
      if (prop.required)
        expect(
          actual!.flags & ts.SymbolFlags.Optional,
          `${component.id}.${prop.name} required`,
        ).toBe(0);
    }
    // Curated wrappers must document their complete explicit interface.
    if (["tabs", "dropdown", "sheet", "toast"].includes(component.id))
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
}, 15000);
