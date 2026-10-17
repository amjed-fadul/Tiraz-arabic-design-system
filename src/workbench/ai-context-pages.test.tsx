import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { generateCode, generatePrompt } from "./generate";
import { defaultPlaygrounds } from "./model";
import { defaultConfig } from "../system";
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
    for (const name of ["Interactive playground", "Examples", "Usage example"])
      expect(screen.getByRole("heading", { name })).toBeVisible();
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
    ).toBeGreaterThanOrEqual(2);
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
  await user.click(screen.getByRole("option", { name: /Review/ }));
  expect(screen.getByRole("combobox", { name: "Model" })).toHaveTextContent(
    "Review",
  );
  const draft = screen.getByRole("textbox", { name: "Message draft" });
  await user.type(draft, "Normal editable draft");
  await user.keyboard("{Shift>}{Enter}{/Shift}second line");
  expect(draft).toHaveValue("Normal editable draft\nsecond line");
  await user.keyboard("{Enter}");
  expect(
    screen.getByRole("region", { name: "Example conversation" }),
  ).toHaveTextContent("Normal editable draft");
  expect(draft).toHaveValue("");
  expect(screen.getByRole("combobox", { name: "Model" })).toHaveTextContent(
    "Review",
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
