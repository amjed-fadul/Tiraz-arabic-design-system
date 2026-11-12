import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import * as ts from "typescript";
import * as jsx from "react/jsx-runtime";
import type { ComponentType } from "react";
import * as system from "../system";
import * as workspace from "../system/ai/examples/AgentWorkspaceExample";
import { Workbench } from "./Workbench";
import { agentWorkspaceCode } from "./agent-workspace-code";
import { persist, storageKeys } from "./storage";

afterEach(() => window.history.replaceState({}, "", "/"));

it("gives the workspace its own page and navigation entry while preserving TaskStarter and the prompt row", async () => {
  persist(storageKeys.documentation, {
    language: "en",
    active: "task-starter",
  });
  const user = userEvent.setup();
  render(<Workbench />);
  expect(
    screen.getByRole("heading", { level: 1, name: "Start a task" }),
  ).toBeVisible();
  expect(document.querySelector(".tz-task-starter")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Copy agent prompt" }),
  ).toBeVisible();
  expect(
    screen.queryByRole("region", { name: "Contextual workspace" }),
  ).toBeNull();
  await user.click(
    screen.getByRole("link", { name: /Explore Contextual workspace/ }),
  );
  expect(
    screen.getByRole("heading", { level: 1, name: "Contextual workspace" }),
  ).toBeVisible();
  expect(window.location.pathname).toBe("/library/contextual-workspace");
  expect(
    screen.getByRole("link", { name: "Contextual workspace" }),
  ).toHaveAttribute("aria-current", "page");
  expect(
    screen.getByRole("link", { name: "Open the playground in a new tab" }),
  ).toHaveAttribute("href", "/examples/contextual-workspace");
  expect(document.querySelector(".tz-task-starter")).toBeNull();
  const section = screen.getByRole("region", { name: "Contextual workspace" });
  expect(within(section).getByRole("slider", { name: "Effort" })).toBeVisible();
  expect(within(section).queryByRole("radio")).toBeNull();
  expect(within(section).getByText("Parts to consider next")).toBeVisible();
  const write = vi.spyOn(navigator.clipboard, "writeText");
  await user.click(within(section).getByRole("tab", { name: "Code" }));
  await user.click(within(section).getByRole("button", { name: "Copy code" }));
  expect(write.mock.calls.at(-1)?.[0]).toBe(agentWorkspaceCode("en"));
});

it.each(["en", "ar"] as const)(
  "runs the copied %s composition without optional mascot or workbench dependencies",
  (language) => {
    const js = ts.transpileModule(agentWorkspaceCode(language), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText;
    const result: { default?: ComponentType } = {};
    const modules: Record<string, unknown> = {
      "react/jsx-runtime": jsx,
      "./system": system,
      "./system/ai/examples/AgentWorkspaceExample": workspace,
    };
    new Function("require", "exports", js)((name: string) => {
      if (name.endsWith(".css")) return {};
      if (!(name in modules)) throw new Error(`Unexpected dependency: ${name}`);
      return modules[name];
    }, result);
    const Example = result.default!;
    render(<Example />);
    expect(
      screen.getByRole("slider", {
        name: language === "ar" ? "مستوى التفكير" : "Effort",
      }),
    ).toBeVisible();
    expect(document.querySelector(".tiraz-system")).toHaveAttribute(
      "dir",
      language === "ar" ? "rtl" : "ltr",
    );
  },
);
