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
  for (const id of [
    "line-chart",
    "area-chart",
    "bar-chart",
    "donut-chart",
  ] as const)
    for (const sample of [
      "single",
      "gaps",
      "point",
      "zero",
      "empty",
      "long",
    ] as const)
      cases.push([id, { ...p[id], sample, legend: false, grid: false }]);
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
  for (const mode of ["controlled", "uncontrolled"] as const) {
    cases.push([
      "checkbox",
      { ...p.checkbox, mode, required: true, disabled: true, error: "Confirm" },
    ]);
    cases.push([
      "radio-group",
      { ...p["radio-group"], mode, required: true, error: "Choose one" },
    ]);
    cases.push([
      "textarea",
      { ...p.textarea, mode, rows: 5, readOnly: true, error: "Add details" },
    ]);
  }
  cases.push([
    "field",
    { ...p.field, error: "Application error", required: true },
  ]);
  for (const mode of ["controlled", "uncontrolled"] as const)
    for (const collapsible of [false, true])
      cases.push(["accordion", { mode, collapsible }]);
  cases.push(["card", { ...p.card, actions: false, description: "" }]);
  for (const page of [1, 4, 10, 20])
    cases.push(["pagination", { page, totalPages: 20 }]);
  cases.push(["breadcrumbs", { label: "Page path", current: "DOC-24 / دليل" }]);
  cases.push(["modal", { ...p.modal, mode: "uncontrolled", footer: false }]);
  for (const illustration of [
    "no-records",
    "no-results",
    "getting-started",
    "none",
  ] as const)
    cases.push(["empty-state", { ...p["empty-state"], illustration }]);
  cases.push(
    ["avatar", { ...p.avatar, size: "md" }],
    ["avatar-group", { ...p["avatar-group"], maxVisible: 1, size: "md" }],
  );
  for (const appearance of ["initials", "photo"] as const)
    for (const src of ["", "/local-custom.jpg"])
      cases.push(["avatar", { ...p.avatar, appearance, src }]);
  cases.push([
    "avatar-group",
    { ...p["avatar-group"], appearance: "initials" },
  ]);
  for (const tone of ["neutral", "success", "error", "info"] as const)
    cases.push(["alert", { ...p.alert, tone, description: "" }]);
  for (const shape of ["text", "rectangle", "circle"] as const)
    cases.push(["skeleton", { shape }]);
  for (const value of [0, 100, -20, 120])
    for (const indeterminate of [true, false])
      cases.push([
        "progress",
        { ...p.progress, value, indeterminate, showValue: false },
      ]);
  cases.push(["spinner", { ...p.spinner, decorative: true, size: "md" }]);
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
  sources.set(
    `${root}/src/__generated_spinner_contract.tsx`,
    `
    import { Spinner } from "./system";
    <Spinner label="Loading"/>;
    <Spinner decorative/>;
    // @ts-expect-error named mode requires label
    <Spinner/>;
    // @ts-expect-error decorative mode uses the adjacent host announcement
    <Spinner decorative label="Duplicate"/>;
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
