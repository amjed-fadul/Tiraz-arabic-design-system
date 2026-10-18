import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { generateCode, generatePrompt } from "./generate";
import { defaultPlaygrounds } from "./model";
import { SystemProvider, defaultConfig } from "../system";
import {
  AIContextExample,
  ContextMeterStates,
  ModelSelectorExample,
} from "../system/ai/examples/AIContextExamples";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import * as icons from "lucide-react";
import * as system from "../system";
import * as ts from "typescript";

it.each([
  ["إجراءات التحديد", "SelectionActions", false],
  ["مقياس السياق", "ContextMeter", true],
  ["اختيار النموذج", "ModelSelector", true],
])(
  "places %s under AI patterns with continuous frames and copyable source",
  async (ar, en, examples) => {
    const user = userEvent.setup();
    render(<Workbench />);
    await user.click(
      within(
        screen.getByRole("group", { name: "أنماط الذكاء الاصطناعي" }),
      ).getByRole("button", { name: ar }),
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "لغة التوثيق" }),
      "en",
    );
    expect(screen.getByRole("heading", { name: en, level: 1 })).toBeVisible();
    for (const name of ["Interactive playground", "Usage example"])
      expect(screen.getByRole("heading", { name })).toBeVisible();
    if (examples)
      expect(screen.getByRole("heading", { name: "Examples" })).toBeVisible();
    else
      expect(
        screen.queryByRole("heading", { name: "Examples", level: 2 }),
      ).toBeNull();
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    await user.click(
      within(document.querySelector(".code-example") as HTMLElement).getByRole(
        "button",
        { name: "Copy code" },
      ),
    );
    const code = String(copy.mock.calls.at(-1)?.[0]);
    expect(code).toContain(en + "Example");
    expect(code).not.toContain("workbench/");
    expect(
      document.querySelectorAll(".tz-demo-frame").length,
    ).toBeGreaterThanOrEqual(examples ? 2 : 1);
  },
);
it("runs the copied connected example with real model state and editable local submission", async () => {
  const code = generateCode(
    "selection-actions",
    defaultPlaygrounds("en")["selection-actions"],
    { ...defaultConfig, direction: "ltr" },
    "en",
  );
  const js = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const result: { default?: React.ComponentType } = {};
  const modules: Record<string, unknown> = {
    react: React,
    "react/jsx-runtime": jsx,
    "lucide-react": icons,
    "./system": system,
  };
  new Function("require", "exports", js)(
    (name: string) => (name.endsWith(".css") ? {} : modules[name]),
    result,
  );
  const Example = result.default!,
    user = userEvent.setup();
  render(<Example />);
  await user.click(screen.getByRole("combobox", { name: "Model" }));
  await user.click(screen.getByRole("option", { name: /Falak Precise/ }));
  expect(screen.getByRole("combobox", { name: "Model" })).toHaveTextContent(
    "Falak Precise",
  );
  const draft = screen.getByRole("textbox", { name: "Message draft" });
  await user.type(draft, "Normal editable draft");
  await user.keyboard("{Shift>}{Enter}{/Shift}second line");
  expect(draft).toHaveValue("Normal editable draft\nsecond line");
  await user.keyboard("{Enter}");
  expect(
    screen.getByRole("region", { name: "Invoice reconciliation chat" }),
  ).toHaveTextContent("Normal editable draft");
  expect(draft).toHaveValue("");
  expect(screen.getByRole("combobox", { name: "Model" })).toHaveTextContent(
    "Falak Precise",
  );
});
it("includes host ownership and focus/scope guidance with each generated prompt", () => {
  for (const id of [
    "selection-actions",
    "context-meter",
    "model-selector",
  ] as const) {
    const prompt = generatePrompt(
      id,
      defaultPlaygrounds("en")[id],
      defaultConfig,
      "en",
    );
    expect(prompt).toContain("Alt+Enter");
    expect(prompt).toContain("controlled stable IDs");
    expect(prompt).toContain("Usage, capacity, estimates");
  }
});
it.each(["ar", "en"] as const)(
  "renders %s context examples as product content only",
  async (language) => {
    const user = userEvent.setup();
    const view = render(
      <SystemProvider
        config={{
          ...defaultConfig,
          direction: language === "ar" ? "rtl" : "ltr",
        }}
      >
        <AIContextExample language={language} longContent />
        <ModelSelectorExample language={language} longContent />
        <ContextMeterStates language={language} />
      </SystemProvider>,
    );
    expect(view.container.querySelector(".tz-context-note")).toBeNull();
    await user.click(screen.getAllByRole("combobox")[0]);
    expect(document.body).not.toHaveTextContent(
      /\b(sample|example|local|demo|simulat\w*|fictional|scripted)\b|تجريبي|عينة|محلي|نموذجي|محاكاة/i,
    );
  },
);
