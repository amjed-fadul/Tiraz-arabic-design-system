import * as ts from "typescript";
import { expect, it } from "vitest";
import { defaultConfig } from "../system";
import { catalog } from "./catalog";
import { defaultPlaygrounds } from "./model";
import type { PlaygroundModel } from "./model";
import type { ComponentId } from "./catalog";
import { generateCode } from "./generate";
it("type-checks copied code for every component, state mode and composition preset", () => {
  const cases: Array<[ComponentId, PlaygroundModel]> = [];
  for (const language of ["ar", "en"] as const) {
    const defaults = defaultPlaygrounds(language);
    for (const item of catalog) cases.push([item.id, defaults[item.id]]);
  }
  const p = defaultPlaygrounds("en");
  cases.push(
    [
      "button",
      {
        ...p.button,
        action: "log",
        iconOnly: true,
        icon: "settings",
        size: "md",
        attributes: { title: "Details", "aria-label": "Open details" },
      },
    ],
    [
      "button",
      {
        ...p.button,
        stylePreset: "wide",
        attributes: { "data-id": "INV-1", tabIndex: 0 },
      },
    ],
    ["tabs", { ...p.tabs, mode: "uncontrolled" }],
    [
      "switch",
      {
        ...p.switch,
        mode: "uncontrolled",
        stylePreset: "wide",
        attributes: { dir: "ltr", title: "Preference" },
      },
    ],
    [
      "dropdown",
      {
        ...p.dropdown,
        mode: "uncontrolled",
        items: [
          { id: "a", label: "Create", icon: "plus" },
          { id: "b", label: "Download", icon: "download" },
        ],
      },
    ],
    ["sheet", { ...p.sheet, mode: "uncontrolled" }],
    ["sheet", { ...p.sheet, footer: false, side: "left" }],
  );
  const root = ts.sys.getCurrentDirectory();
  const sources = new Map(
    cases.map(([id, model], index) => [
      `${root}/src/__generated_${index}.tsx`,
      generateCode(id, model, defaultConfig, "en"),
    ]),
  );
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2023,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    noEmit: true,
    strict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    skipLibCheck: true,
    types: ["vite/client"],
  };
  const host = ts.createCompilerHost(options);
  const originalGet = host.getSourceFile.bind(host),
    originalExists = host.fileExists.bind(host),
    originalRead = host.readFile.bind(host);
  host.fileExists = (file) => sources.has(file) || originalExists(file);
  host.readFile = (file) => sources.get(file) ?? originalRead(file);
  host.getSourceFile = (file, target, ...rest) =>
    sources.has(file)
      ? ts.createSourceFile(file, sources.get(file)!, target, true)
      : originalGet(file, target, ...rest);
  const program = ts.createProgram([...sources.keys()], options, host);
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .map(
      (d) =>
        `${d.file?.fileName}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`,
    );
  expect(diagnostics).toEqual([]);
}, 15000);
