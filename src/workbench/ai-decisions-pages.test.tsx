import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Workbench } from "./Workbench";
import {
  AIDecisionsExample,
  ApprovalCardExample,
  ApprovalFlowExample,
  AskUserQuestionsExample,
} from "../system/ai/examples/AIDecisionsExamples";
import { SystemProvider, defaultConfig } from "../system";
import { generateCode } from "./generate";
import { defaultPlaygrounds } from "./model";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import * as system from "../system";
import * as ts from "typescript";
it.each([
  ["أسئلة للمستخدم", "AskUserQuestions"],
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
  await user.click(screen.getByRole("button", { name: "Keep status" }));
  expect(screen.getByText("Rejected")).toBeVisible();
  expect(screen.queryByText(/completed/i)).not.toBeInTheDocument();
});
it("connects an answered question to its target, then records a rejection and an independent approval", async () => {
  const user = userEvent.setup();
  const view = render(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      <AIDecisionsExample language="en" />
    </SystemProvider>,
  );
  expect(view.container.querySelectorAll("button, input")).toHaveLength(
    view.container.querySelectorAll(".tz-ask-questions :is(button, input)")
      .length,
  );
  await user.click(screen.getByRole("radio", { name: /Supplier invoices/ }));
  await user.click(screen.getByRole("button", { name: "Submit answers" }));
  await screen.findByRole("button", { name: "Keep status" });
  expect(
    screen.getByRole("group", { name: "Mark 3 invoices as paid" }),
  ).toHaveFocus();
  expect(screen.getByText("Supplier invoices · October 2026")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Keep status" }));
  await screen.findByText("Request 2 of 2");
  expect(
    screen.getByRole("list", { name: "Prior decisions" }),
  ).toHaveTextContent("Rejected");
  await user.click(screen.getByRole("button", { name: "Send summary" }));
  await screen.findByText("All decisions made.");
  expect(
    screen.getByRole("list", { name: "Prior decisions" }),
  ).toHaveTextContent("Approved");
  view.unmount();
});
it.each(["ar", "en"] as const)(
  "renders %s decision examples as product content only",
  (language) => {
    const view = render(
      <SystemProvider
        config={{
          ...defaultConfig,
          direction: language === "ar" ? "rtl" : "ltr",
        }}
      >
        <AskUserQuestionsExample language={language} longContent />
        <ApprovalCardExample language={language} longContent />
        <ApprovalFlowExample language={language} longContent />
        <AIDecisionsExample language={language} />
      </SystemProvider>,
    );
    expect(view.container).not.toHaveTextContent(
      /\b(sample|example|local|demo|simulat\w*|fictional|scripted)\b|تجريبي|عينة|محلي|نموذجي|محاكاة/i,
    );
  },
);
