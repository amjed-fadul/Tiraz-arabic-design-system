import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import * as icons from "lucide-react";
import * as system from "../system";
import * as ts from "typescript";
import { generateCode } from "./generate";
import { defaultPlaygrounds } from "./model";
function example(
  preset: "populated" | "empty" | "loading" | "error" = "empty",
  {
    language = "en",
    numerals = "arab",
  }: { language?: "ar" | "en"; numerals?: system.Numerals } = {},
) {
  const code = generateCode(
    "data-table",
    { ...defaultPlaygrounds(language)["data-table"], preset },
    {
      ...system.defaultConfig,
      direction: language === "ar" ? "rtl" : "ltr",
      numerals,
    },
    language,
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
    "lucide-react": icons,
    "./system": system,
  };
  new Function("require", "exports", js)(
    (name: string) => (name.endsWith(".css") ? {} : modules[name]),
    exports,
  );
  return exports.default!;
}
it("runs copied create → filtered table → details code without any workbench dependency", async () => {
  const user = userEvent.setup();
  const Example = example();
  render(<Example />);
  const search = screen.getByRole("searchbox");
  await user.type(search, "not-matching");
  await user.click(screen.getByRole("button", { name: "Create customer" }));
  await user.type(
    screen.getByRole("textbox", { name: "Customer name" }),
    "Copy customer",
  );
  await user.dblClick(screen.getByRole("button", { name: "Save customer" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(search).toHaveValue("not-matching");
  expect(screen.getByRole("table")).toHaveTextContent("No matching results.");
  await user.clear(search);
  expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2);
  await user.click(
    screen.getByRole("button", { name: "Dismiss notification" }),
  );
  const action = screen.getByRole("button", {
    name: "Actions for Copy customer",
  });
  await user.click(action);
  await user.keyboard("{ArrowDown}{Enter}");
  expect(await screen.findByRole("dialog")).toHaveTextContent("Copy customer");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(action).toHaveFocus());
});
it("runs copied loading and error/Retry presets", async () => {
  const Loading = example("loading");
  const view = render(<Loading />);
  expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
  expect(screen.getByRole("status")).toHaveTextContent("Loading customers…");
  view.unmount();
  const Error = example("error");
  render(<Error />);
  await userEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(screen.getByRole("status")).toHaveTextContent("of 26");
});
it.each(["arab", "latn"] as const)(
  "runs the copied Arabic data table with its result count in %s digits",
  (numerals) => {
    const Example = example("populated", { language: "ar", numerals });
    render(<Example />);
    expect(screen.getByRole("status").textContent).toBe(
      numerals === "arab" ? "١–١٠ من ٢٦ عميل" : "1–10 من 26 عميل",
    );
  },
);
