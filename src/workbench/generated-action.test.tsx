import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import * as system from "../system";
import * as ts from "typescript";
import { generateCode } from "./generate";
import { defaultPlaygrounds } from "./model";
function example(state: system.ButtonState = "idle") {
  const model = { ...defaultPlaygrounds("en").button, state };
  const code = generateCode("button", model, system.defaultConfig, "en");
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
    "./system": system,
  };
  new Function("require", "exports", js)(
    (name: string) => (name.endsWith(".css") ? {} : modules[name]),
    exports,
  );
  return exports.default!;
}
afterEach(() => vi.useRealTimers());
it.each(["idle", "error"] as const)(
  "generated action returns to configured %s and repeats",
  async (state) => {
    vi.useFakeTimers();
    const Example = example(state);
    render(<Example />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(button).toHaveAttribute("data-state", "loading");
    await act(async () => vi.advanceTimersByTime(1200));
    expect(button).toHaveAttribute("data-state", "success");
    await act(async () => vi.advanceTimersByTime(1000));
    expect(button).toHaveAttribute("data-state", state);
    fireEvent.click(button);
    expect(button).toHaveAttribute("data-state", "loading");
  },
);
it("generated action clears pending timers on unmount", () => {
  vi.useFakeTimers();
  const Example = example();
  const view = render(<Example />);
  fireEvent.click(screen.getByRole("button"));
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
