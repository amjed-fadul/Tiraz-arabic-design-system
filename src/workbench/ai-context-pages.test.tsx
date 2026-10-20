import { act, render, screen, within } from "@testing-library/react";
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
  SelectionActionsExample,
} from "../system/ai/examples/AIContextExamples";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import * as icons from "lucide-react";
import * as system from "../system";
import * as ts from "typescript";

it.each([
  ["إجراءات التحديد", "SelectionActions"],
  ["مقياس السياق", "ContextMeter"],
  ["اختيار النموذج", "ModelSelector"],
])(
  "places %s under AI patterns with continuous frames and copyable source",
  async (ar, en) => {
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
    expect(
      screen.getByRole("heading", { name: "Interactive playground" }),
    ).toBeVisible();
    // The playground frame is the only stage; its Code view holds the source.
    for (const name of ["Usage example", "Examples"])
      expect(screen.queryByRole("heading", { name })).toBeNull();
    expect(screen.getByRole("tablist", { name: "View" })).toBeVisible();
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    const code = String(copy.mock.calls.at(-1)?.[0]);
    expect(code).toContain(en + "Example");
    expect(code).not.toContain("workbench/");
    expect(document.querySelectorAll(".tz-demo-frame")).toHaveLength(1);
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

// jsdom fires `selectionchange` in a task of its own after a selection moves.
const settle = () =>
  act(() => new Promise((resolve) => setTimeout(resolve, 20)));
const withPhase = (
  phase: string | undefined,
  onPhaseChange: (phase: string) => void,
) => (
  <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
    <SelectionActionsExample
      language="en"
      phase={phase}
      onPhaseChange={onPhaseChange}
    />
  </SystemProvider>
);
it("reports a change of selection once, and never the phase it was given", async () => {
  const onPhaseChange = vi.fn();
  const selection = document.getSelection()!;
  selection.removeAllRanges();
  const { rerender } = render(withPhase("selected", onPhaseChange));
  await settle();
  // It opens on the selection it was given and says nothing about it.
  expect(selection.toString()).toMatch(/^I reviewed Madar/);
  expect(onPhaseChange).not.toHaveBeenCalled();
  // Collapsing it is reported once, however many events follow.
  selection.collapse(document.body, 0);
  await settle();
  selection.collapse(document.body, 1);
  await settle();
  expect(onPhaseChange.mock.calls).toEqual([["idle"]]);
  // Once the host has followed, a word of the reply is reported and kept: the
  // phase does not select the first sentence over it.
  rerender(withPhase("idle", onPhaseChange));
  const reply = screen.getByText(/^I reviewed Madar/).firstChild!;
  const start = reply.textContent!.indexOf("October");
  selection.setBaseAndExtent(reply, start, reply, start + "October".length);
  await settle();
  expect(onPhaseChange.mock.calls).toEqual([["idle"], ["selected"]]);
  rerender(withPhase("selected", onPhaseChange));
  await settle();
  expect(selection.toString()).toBe("October");
  expect(onPhaseChange).toHaveBeenCalledTimes(2);
});
it("leaves the selection alone without a phase", async () => {
  const onPhaseChange = vi.fn();
  const selection = document.getSelection()!;
  selection.removeAllRanges();
  render(withPhase(undefined, onPhaseChange));
  await settle();
  // Nothing is selected for it, and a selection of the reply reports nothing.
  expect(selection.toString()).toBe("");
  const reply = screen.getByText(/^I reviewed Madar/).firstChild!;
  selection.setBaseAndExtent(reply, 0, reply, 10);
  await settle();
  selection.collapse(document.body, 0);
  await settle();
  expect(onPhaseChange).not.toHaveBeenCalled();
});
