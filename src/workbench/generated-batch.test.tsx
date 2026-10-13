import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import * as dialog from "@radix-ui/react-dialog";
import * as system from "../system";
import * as ts from "typescript";
import { generateCode } from "./generate";
import { defaultPlaygrounds } from "./model";
function copiedExample(component: "modal" | "tooltip", controlled = true) {
  const defaults = defaultPlaygrounds("en");
  const model =
    component === "modal"
      ? {
          ...defaults.modal,
          mode: controlled
            ? ("controlled" as const)
            : ("uncontrolled" as const),
        }
      : defaults.tooltip;
  const code = generateCode(
    component,
    model,
    { ...system.defaultConfig, direction: "ltr" },
    "en",
  );
  const js = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const exports: { default?: React.ComponentType } = {};
  const modules: Record<string, unknown> = {
    react: React,
    "react/jsx-runtime": jsx,
    "@radix-ui/react-dialog": dialog,
    "./system": system,
  };
  new Function("require", "exports", js)(
    (name: string) => (name.endsWith(".css") ? {} : modules[name]),
    exports,
  );
  return exports.default!;
}
it("runs the copied Tooltip details action without workbench dependencies", async () => {
  const Example = copiedExample("tooltip");
  render(<Example />);
  await userEvent.click(screen.getByRole("button", { name: "Show details" }));
  expect(
    screen.getByText("This is a local component preview."),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Hide details" }));
  expect(screen.queryByText("This is a local component preview.")).toBeNull();
});
it.each([true, false])(
  "runs copied Modal controlled=%s preview, nested reset and footer dismissal",
  async (controlled) => {
    const Example = copiedExample("modal", controlled),
      user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "View options" });
    await user.click(trigger);
    const select = screen.getByRole("combobox", { name: "Layout" });
    await waitFor(() => expect(select).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    await user.click(screen.getByRole("option", { name: "Cards" }));
    expect(select).toHaveTextContent("Cards");
    await user.click(screen.getByRole("button", { name: "Preview actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Reset to list" }));
    expect(select).toHaveTextContent("List");
    await user.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.getByRole("status")).toHaveTextContent("Layout: List");
  },
);
