import * as ts from "typescript";
import { expect, it } from "vitest";
import { defaultConfig } from "../system";
import type { SystemConfig } from "../system";
import { catalog } from "./catalog";
import { defaultPlaygrounds } from "./model";
import type { PlaygroundModel } from "./model";
import type { ComponentId } from "./catalog";
import { generateCode } from "./generate";
it("type-checks copied code for every component, state mode and composition preset", () => {
  const cases: Array<[ComponentId, PlaygroundModel, SystemConfig?]> = [];
  for (const language of ["ar", "en"] as const) {
    const defaults = defaultPlaygrounds(language);
    for (const item of catalog) cases.push([item.id, defaults[item.id]]);
  }
  const p = defaultPlaygrounds("en");
  for (const variant of [
    "primary",
    "secondary",
    "ghost",
    "destructive",
  ] as const)
    for (const size of ["sm", "md"] as const)
      for (const density of ["standard", "compact"] as const)
        for (const typography of ["standard", "large"] as const)
          cases.push([
            "button",
            { ...p.button, variant, size, iconOnly: true, icon: "settings" },
            { ...defaultConfig, density, typography },
          ]);
  for (const state of ["idle", "loading", "success", "error"] as const)
    cases.push(["button", { ...p.button, state }]);
  cases.push([
    "switch",
    { ...p.switch, attributes: { "aria-describedby": "external-description" } },
  ]);
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
  for (const type of [
    "text",
    "email",
    "password",
    "search",
    "tel",
    "url",
  ] as const)
    for (const mode of ["controlled", "uncontrolled"] as const) {
      cases.push([
        "input",
        {
          ...p.input,
          type,
          mode,
          readOnly: true,
          required: true,
          error: "Correct this",
        },
      ]);
      cases.push([
        "select",
        { ...p.select, mode, required: true, value: "active", disabled: true },
      ]);
    }
  cases.push(
    ["table", { ...p.table, preset: "empty" }],
    ["table", { ...p.table, caption: "" }],
  );
  cases.push([
    "field",
    { ...p.field, error: "Application error", required: true },
  ]);
  const root = ts.sys.getCurrentDirectory();
  const sources = new Map(
    cases.map(([id, model, config], index) => [
      `${root}/src/__generated_${index}.tsx`,
      generateCode(id, model, config ?? defaultConfig, "en"),
    ]),
  );
  for (const language of ["ar", "en"] as const)
    for (const preset of [
      "populated",
      "loading",
      "empty",
      "no-results",
      "error",
    ] as const)
      sources.set(
        `${root}/src/__generated_datatable_${language}_${preset}.tsx`,
        generateCode(
          "data-table",
          {
            ...defaultPlaygrounds(language)["data-table"],
            preset,
            caption: "",
          },
          { ...defaultConfig, direction: language === "ar" ? "rtl" : "ltr" },
          language,
        ),
      );
  sources.set(
    `${root}/src/__generated_input_contract.tsx`,
    `
    import { Input, Field } from "./system";
    import type { FieldControlProps } from "./system";
    const field: FieldControlProps = { id: "composed", "aria-labelledby": "composed-label" };
    <Input label="Name" helper="Help" error="Error" required />;
    <Input aria-label="Native" />;
    <Field label="Composed">{field => <Input field={field} />}</Field>;
    // @ts-expect-error convenience mode cannot also receive Field composition
    <Input label="Duplicate" field={field} />;
    // @ts-expect-error helper only accompanies labeled mode
    <Input helper="Orphan help" />;
    // @ts-expect-error error only accompanies labeled mode
    <Input field={field} error="Duplicate error" />;
  `,
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
