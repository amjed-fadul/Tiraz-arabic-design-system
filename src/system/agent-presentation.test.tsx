import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import {
  AgentTask,
  ChangeSummary,
  DraftReview,
  ImageGeneration,
  AskUserQuestions,
  AssistantControls,
  TaskStarter,
  CitedAnswer,
  DataAnswer,
  SuggestedEdits,
} from "./index";

it.each(["task", "changes", "draft", "image"])(
  "%s puts a supplied avatar and controls in its own header without sending an action",
  (kind) => {
    const changeColor = vi.fn();
    const send = vi.fn();
    const agentPresentation = {
      name: "Support agent",
      avatar: (
        <span data-testid="agent-avatar" aria-hidden="true">
          Khayt
        </span>
      ),
      actions: <button onClick={changeColor}>Agent color</button>,
    };
    const { container } = render(
      kind === "task" ? (
        <AgentTask
          title="Close"
          status="needs-you"
          steps={[]}
          agentPresentation={agentPresentation}
        />
      ) : kind === "changes" ? (
        <ChangeSummary
          rows={[]}
          status="ready"
          agentPresentation={agentPresentation}
        />
      ) : kind === "draft" ? (
        <DraftReview
          status="ready"
          body="A reminder"
          recipients={[]}
          onSend={send}
          agentPresentation={agentPresentation}
        />
      ) : (
        <ImageGeneration
          prompt="A cover"
          images={[]}
          status="queued"
          onUse={send}
          agentPresentation={agentPresentation}
        />
      ),
    );
    const avatar = screen.getByTestId("agent-avatar");
    expect(screen.getByText(/Support agent/)).toBeInTheDocument();
    expect(avatar.closest(".tz-tray-header")).toContainElement(
      screen.getByRole("button", { name: "Agent color" }),
    );
    expect(
      avatar.closest(".tz-tray-header")!.querySelector(".tz-ai-mark"),
    ).toBeNull();
    expect(container.querySelectorAll('[aria-live="polite"]')).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Agent color" }));
    expect(changeColor).toHaveBeenCalledOnce();
    expect(send).not.toHaveBeenCalled();
  },
);

it.each(["questions", "controls", "starter", "answer", "data", "edits"])(
  "%s keeps identity controls inside its existing working-area header",
  (kind) => {
    const submit = vi.fn();
    const color = vi.fn();
    const agentPresentation = {
      avatar: (
        <span data-testid="avatar" aria-hidden="true">
          Host avatar
        </span>
      ),
      name: "Support agent",
      actions: (
        <button type="button" onClick={color}>
          Change color
        </button>
      ),
      color: "#647FA5",
    };
    const pattern =
      kind === "questions" ? (
        <AskUserQuestions
          questions={[]}
          value={{}}
          onValueChange={vi.fn()}
          onSubmit={submit}
          agentPresentation={agentPresentation}
        />
      ) : kind === "controls" ? (
        <AssistantControls agentPresentation={agentPresentation} />
      ) : kind === "starter" ? (
        <TaskStarter
          value=""
          onValueChange={vi.fn()}
          onSubmit={submit}
          agentPresentation={agentPresentation}
        />
      ) : kind === "answer" ? (
        <CitedAnswer
          status="completed"
          content="Answer"
          sources={[]}
          agentPresentation={agentPresentation}
        />
      ) : kind === "data" ? (
        <DataAnswer
          status="completed"
          question="Revenue?"
          explanation="Revenue is steady."
          agentPresentation={agentPresentation}
        />
      ) : (
        <SuggestedEdits
          actions={[]}
          onAction={vi.fn()}
          status="reviewing"
          reviewPlacement="inline"
          suggestion={{ title: "Clause", segments: [] }}
          agentPresentation={agentPresentation}
        >
          A clause
        </SuggestedEdits>
      );
    const { container } = render(pattern);
    const avatar = screen.getByTestId("avatar");
    const header = avatar.closest('[data-zone="header"]');
    expect(header).toContainElement(
      screen.getByRole("button", { name: "Change color" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Change color" }));
    expect(color).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();
    expect(
      container.querySelectorAll('[aria-live="polite"]').length,
    ).toBeLessThanOrEqual(1);
  },
);
it("keeps the default AI mark when a host supplies no identity", () => {
  const { container } = render(
    <AgentTask title="Close" status="needs-you" steps={[]} />,
  );
  expect(
    container.querySelector(".tz-agent-run-header .tz-ai-mark"),
  ).toBeInTheDocument();
  expect(container.querySelector(".tz-agent-header-actions")).toBeNull();
});
