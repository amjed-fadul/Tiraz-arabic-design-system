import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { persist, storageKeys } from "./storage";
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
afterEach(() => vi.useRealTimers());
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
    expect(
      screen.getByRole("heading", { name: "Interactive playground" }),
    ).toBeVisible();
    for (const name of ["Examples", "Usage example"])
      expect(screen.queryByRole("heading", { name })).toBeNull();
    expect(document.querySelectorAll(".tz-demo-frame")).toHaveLength(1);
    expect(screen.getByRole("tablist", { name: "View" })).toBeVisible();
    expect(screen.getByRole("switch", { name: "Long content" })).toBeVisible();
  },
);
it.each([
  [
    "ask-user-questions",
    () => {
      fireEvent.click(screen.getByRole("radio", { name: /Supplier invoices/ }));
      fireEvent.click(screen.getByRole("button", { name: "Submit answers" }));
    },
    "Submitting answers",
    "Answers accepted.",
  ],
  [
    "approval-card",
    () => fireEvent.click(screen.getByRole("button", { name: "Keep status" })),
    "Recording decision",
    "Rejected",
  ],
  [
    "approval-flow",
    () => fireEvent.click(screen.getByRole("button", { name: "Mark as paid" })),
    "Recording decision",
    "Request 2 of 2",
  ],
] as const)(
  "shows the %s playground pending until the host answers",
  async (active, decide, pending, done) => {
    vi.useFakeTimers();
    persist(storageKeys.documentation, { language: "en", active });
    render(<Workbench />);
    const stage = within(
      screen.getByRole("region", { name: "Interactive playground" }),
    );
    await act(async () => decide());
    expect(stage.getByText(pending)).toBeVisible();
    await act(async () => vi.advanceTimersByTime(650));
    expect(stage.getByText(pending)).toBeVisible();
    await act(async () => vi.advanceTimersByTime(100));
    expect(stage.queryByText(pending)).toBeNull();
    expect(stage.getByText(done)).toBeVisible();
    if (active === "approval-flow")
      expect(
        stage.getByRole("list", { name: "Prior decisions" }),
      ).toHaveTextContent("Approved");
  },
);
it.each([
  ["approval-card", "Waiting", "Mark as paid", "Approved"],
  ["approval-flow", "First", "Keep status", "Second"],
] as const)(
  "follows an interactive flow on %s",
  async (active, before, decide, after) => {
    vi.useFakeTimers();
    persist(storageKeys.documentation, { language: "en", active });
    render(<Workbench />);
    const pressed = () =>
      within(screen.getByRole("group", { name: "Example states" }))
        .getAllByRole("button")
        .filter((button) => button.getAttribute("aria-pressed") === "true")
        .map((button) => button.textContent);
    expect(pressed()).toEqual([before]);
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: decide })),
    );
    // The switcher moves once the host has accepted the decision, and says so.
    expect(pressed()).toEqual([before]);
    await act(async () => vi.advanceTimersByTime(700));
    expect(pressed()).toEqual([after]);
    expect(
      document.querySelector(".tz-demo-header > [role='status']"),
    ).toHaveTextContent(`State: ${after}`);
    // The decision made stays as it was made.
    if (active === "approval-flow")
      expect(
        screen.getByRole("list", { name: "Prior decisions" }),
      ).toHaveTextContent("Rejected");
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
  // The copied example waits for its stand-in host before recording.
  expect(screen.getByText("Recording decision")).toBeVisible();
  expect(
    await screen.findByText("Rejected", undefined, { timeout: 2000 }),
  ).toBeVisible();
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
