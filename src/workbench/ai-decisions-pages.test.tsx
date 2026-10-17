import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Workbench } from "./Workbench";
import { AIDecisionsExample } from "../system/ai/examples/AIDecisionsExamples";
import { SystemProvider, defaultConfig } from "../system";
import { generateCode } from "./generate";
import { defaultPlaygrounds } from "./model";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import * as system from "../system";
import * as ts from "typescript";
it.each([
  ["أسئلة المستخدم", "AskUserQuestions"],
  ["بطاقة القرار", "ApprovalCard"],
  ["تسلسل القرارات", "ApprovalFlow"],
])(
  "documents %s in AI patterns with continuous shared frames",
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
    expect(
      document.querySelectorAll(".tz-demo-frame").length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("switch", { name: "Long content" })).toBeVisible();
  },
);
it("runs a generated source example and records rejection without execution", async () => {
  const code = generateCode(
    "approval-card",
    defaultPlaygrounds("en")["approval-card"],
    { ...defaultConfig, direction: "ltr" },
    "en",
  );
  const js = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const result: { default?: React.ComponentType } = {},
    modules: Record<string, unknown> = {
      react: React,
      "react/jsx-runtime": jsx,
      "./system": system,
    };
  new Function("require", "exports", js)(
    (name: string) => (name.endsWith(".css") ? {} : modules[name]),
    result,
  );
  const Example = result.default!,
    user = userEvent.setup();
  render(<Example />);
  await user.click(screen.getByRole("button", { name: "Keep sample title" }));
  expect(screen.getByText("Rejected · decision only")).toBeVisible();
  expect(screen.queryByText(/completed/i)).not.toBeInTheDocument();
});
it("connects questions, local failure/retry, rejection and a fresh independent decision", async () => {
  const user = userEvent.setup();
  render(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      <AIDecisionsExample language="en" />
    </SystemProvider>,
  );
  await user.click(screen.getByRole("radio", { name: /Concise draft/ }));
  await user.click(screen.getByRole("button", { name: "Submit answers" }));
  await screen.findByRole("button", { name: "Keep sample title" });
  expect(
    screen.getByRole("group", { name: "Rename sample draft" }),
  ).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Keep sample title" }));
  await screen.findByText("Decision was not accepted. Review and try again.");
  await user.click(screen.getByRole("button", { name: "Keep sample title" }));
  await screen.findByText("Request 2 of 2");
  expect(
    screen.getByRole("list", { name: "Prior decisions" }),
  ).toHaveTextContent("Rejected");
  await user.click(screen.getByRole("button", { name: "Approve sample note" }));
  await screen.findByText("All decisions recorded. No actions executed.");
  expect(
    screen.getByRole("list", { name: "Prior decisions" }),
  ).toHaveTextContent("Approved");
  await user.click(screen.getByRole("button", { name: "Reset example" }));
  expect(
    screen.getByRole("radio", { name: /Concise draft/ }),
  ).not.toBeChecked();
});
