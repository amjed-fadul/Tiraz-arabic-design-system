import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { useState } from "react";
import { AskUserQuestions } from "./AskUserQuestions";
import type { QuestionAnswers } from "./AskUserQuestions";
import { ApprovalCard } from "./ApprovalCard";
import { ApprovalFlow } from "./ApprovalFlow";
import type {
  ApprovalRecord,
  ApprovalRequest,
  ApprovalCardProps,
} from "./ApprovalCard";
import { approvalRequestKey } from "./approval-request";
import { Modal } from "./Modal";
import { SystemProvider } from "./Provider";
import { defaultConfig } from "./config";
import { ApprovalCardExample } from "./ai/examples/AIDecisionsExamples";
afterEach(() => vi.useRealTimers());
const request: ApprovalRequest = {
  id: "a",
  action: "Rename sample",
  target: "Draft A",
  consequences: ["Only the sample title changes."],
  approveLabel: "Approve rename",
  rejectLabel: "Keep title",
};
const wrap = (ui: React.ReactNode) => (
  <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
    {ui}
  </SystemProvider>
);
function deferred() {
  let resolve!: () => void, reject!: (e: Error) => void;
  const promise = new Promise<void>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
it("validates, focuses first missing answer and preserves editable drafts after rejected submission", async () => {
  const user = userEvent.setup(),
    onSubmit = vi.fn().mockRejectedValue(new Error("host"));
  function Example() {
    const [value, set] = useState<QuestionAnswers>({});
    return (
      <AskUserQuestions
        questions={[
          {
            id: "scope",
            label: "Scope?",
            choices: [{ value: "title", label: "Title" }],
            allowOther: true,
          },
          { id: "notes", label: "Notes?", type: "text", required: true },
        ]}
        value={value}
        onValueChange={set}
        onSubmit={onSubmit}
      />
    );
  }
  render(wrap(<Example />));
  await user.click(screen.getByRole("button", { name: "Submit answers" }));
  expect(screen.getByRole("radio", { name: /Title/ })).toHaveFocus();
  await user.click(screen.getByRole("radio", { name: /Other/ }));
  await user.type(
    screen.getByRole("textbox", { name: "Other answer" }),
    "Intro",
  );
  await user.click(screen.getByRole("button", { name: "Next question" }));
  await user.click(screen.getByRole("button", { name: "Submit answers" }));
  expect(screen.getByRole("textbox", { name: "Notes?" })).toHaveFocus();
  await user.type(
    screen.getByRole("textbox", { name: "Notes?" }),
    "Keep concise",
  );
  await user.click(screen.getByRole("button", { name: "Submit answers" }));
  await screen.findByText(
    "Answers were not accepted. Your draft is preserved.",
  );
  expect(screen.getByRole("textbox", { name: "Notes?" })).toHaveValue(
    "Keep concise",
  );
  expect(onSubmit.mock.calls[0][0]).toEqual({
    scope: { choice: "other", text: "Intro" },
    notes: { text: "Keep concise" },
  });
  await user.click(screen.getByRole("button", { name: "Previous question" }));
  expect(screen.getByRole("textbox", { name: "Other answer" })).toHaveValue(
    "Intro",
  );
});
it("gives a decision card no entry hook on its first render, only after a change", async () => {
  const user = userEvent.setup(),
    receipt = { ...request, id: "b" };
  const view = render(
    wrap(
      <>
        <AskUserQuestions
          questions={[
            {
              id: "scope",
              label: "Scope?",
              choices: [{ value: "title", label: "Title" }],
            },
            { id: "notes", label: "Notes?", type: "text" },
          ]}
          value={{}}
          onValueChange={() => {}}
          onSubmit={() => {}}
        />
        <ApprovalCard request={request} onDecision={() => {}} />
        <ApprovalCard
          request={receipt}
          value={{
            requestId: "b",
            requestKey: approvalRequestKey(receipt),
            decision: "approved",
          }}
          onDecision={() => {}}
        />
      </>,
    ),
  );
  const questions = view.container.querySelector(".tz-ask-questions")!;
  const [pending, decided] =
    view.container.querySelectorAll(".tz-approval-card");
  // Nothing rises, cascades, pops or draws on mount, not even a receipt.
  for (const card of [questions, pending, decided])
    expect(card).not.toHaveAttribute("data-changed");
  await user.click(screen.getByRole("button", { name: "Next question" }));
  expect(questions).toHaveAttribute("data-changed");
  await user.click(screen.getByRole("button", { name: "Approve rename" }));
  await waitFor(() => expect(pending).toHaveAttribute("data-changed"));
  expect(decided).not.toHaveAttribute("data-changed");
});
it("guards duplicate decisions and restores the initiating button after host failure", async () => {
  const task = deferred(),
    onDecision = vi.fn<ApprovalCardProps["onDecision"]>(() => task.promise),
    user = userEvent.setup();
  render(wrap(<ApprovalCard request={request} onDecision={onDecision} />));
  const approve = screen.getByRole("button", { name: "Approve rename" });
  await user.click(approve);
  fireEvent.click(approve);
  expect(onDecision).toHaveBeenCalledTimes(1);
  await act(async () => task.reject(new Error("host")));
  expect(approve).toHaveFocus();
  expect(approve).toBeEnabled();
  expect(screen.getByText("Draft A")).toBeVisible();
  expect(
    screen.getByText("Decision was not accepted. Review and try again."),
  ).toBeVisible();
});
it("invalidates a pending decision when content changes with the same ID", async () => {
  const task = deferred(),
    host = vi.fn<ApprovalCardProps["onDecision"]>(() => task.promise),
    user = userEvent.setup();
  const { rerender } = render(
    wrap(<ApprovalCard request={request} onDecision={host} />),
  );
  await user.click(screen.getByRole("button", { name: "Approve rename" }));
  const signal = host.mock.calls[0][2].signal;
  rerender(
    wrap(
      <ApprovalCard
        request={{ ...request, target: "Draft B" }}
        onDecision={host}
      />,
    ),
  );
  expect(signal.aborted).toBe(true);
  await act(async () => task.resolve());
  expect(screen.getByRole("button", { name: "Approve rename" })).toBeEnabled();
  expect(screen.queryByText("Approved")).not.toBeInTheDocument();
});
it("aborts on reset and unmount and ignores stale completion", async () => {
  const task = deferred(),
    host = vi.fn<ApprovalCardProps["onDecision"]>(() => task.promise),
    user = userEvent.setup();
  const { rerender, unmount } = render(
    wrap(<ApprovalCard request={request} onDecision={host} />),
  );
  await user.click(screen.getByRole("button", { name: "Approve rename" }));
  const first = host.mock.calls[0][2].signal;
  rerender(
    wrap(<ApprovalCard request={request} resetKey={1} onDecision={host} />),
  );
  expect(first.aborted).toBe(true);
  await user.click(screen.getByRole("button", { name: "Keep title" }));
  const second = host.mock.calls[1][2].signal;
  unmount();
  expect(second.aborted).toBe(true);
  await act(async () => task.resolve());
});
it("advances only on host acceptance and never carries approval to the next request", async () => {
  const task = deferred(),
    host = vi.fn<ApprovalCardProps["onDecision"]>(() => task.promise),
    user = userEvent.setup();
  render(
    wrap(
      <ApprovalFlow
        label="Review samples"
        requests={[request, { ...request, id: "b", target: "Draft B" }]}
        onDecision={host}
      />,
    ),
  );
  await user.click(screen.getByRole("button", { name: "Approve rename" }));
  expect(screen.getByText("Request 1 of 2")).toBeVisible();
  await act(async () => task.resolve());
  expect(screen.getByText("Request 2 of 2")).toBeVisible();
  expect(screen.getByRole("button", { name: "Approve rename" })).toBeEnabled();
  expect(
    screen.getByRole("list", { name: "Prior decisions" }),
  ).toHaveTextContent("Approved");
  expect(screen.getByRole("group", { name: "Rename sample" })).toHaveFocus();
});
it("gives only a decision recorded after mount an entry hook in the flow's history", async () => {
  const user = userEvent.setup(),
    second = { ...request, id: "b", action: "Archive sample" };
  function Example() {
    const [value, setValue] = useState<readonly ApprovalRecord[]>([
      {
        requestId: "a",
        requestKey: approvalRequestKey(request),
        decision: "approved",
      },
    ]);
    return (
      <ApprovalFlow
        label="Review"
        requests={[request, second]}
        value={value}
        onValueChange={setValue}
        onDecision={() => {}}
      />
    );
  }
  const view = render(wrap(<Example />));
  const hooks = () =>
    [...view.container.querySelectorAll(".tz-decision-history > li")].map(
      (row) => row.hasAttribute("data-changed"),
    );
  // The decision the flow mounted with stays still.
  expect(hooks()).toEqual([false]);
  await user.click(screen.getByRole("button", { name: "Approve rename" }));
  await waitFor(() => expect(hooks()).toHaveLength(2));
  expect(hooks()).toEqual([false, true]);
});
it("reopens changed requests and retains unchanged decisions on append/reorder", async () => {
  const user = userEvent.setup(),
    host = vi.fn().mockResolvedValue(undefined),
    b = { ...request, id: "b", target: "Draft B" };
  const { rerender } = render(
    wrap(
      <ApprovalFlow label="Review" requests={[request]} onDecision={host} />,
    ),
  );
  await user.click(screen.getByRole("button", { name: "Keep title" }));
  await screen.findByText("All decisions made.");
  rerender(
    wrap(
      <ApprovalFlow label="Review" requests={[b, request]} onDecision={host} />,
    ),
  );
  expect(screen.getByText("Draft B")).toBeVisible();
  expect(
    screen.getByRole("list", { name: "Prior decisions" }),
  ).toHaveTextContent("Request rejected");
  rerender(
    wrap(
      <ApprovalFlow
        label="Review"
        requests={[{ ...request, action: "New action" }, b]}
        onDecision={host}
      />,
    ),
  );
  expect(screen.getByRole("group", { name: "New action" })).toBeVisible();
});
it("Escape inside an inline pending card records rejection without stealing initial focus", async () => {
  const host = vi.fn().mockResolvedValue(undefined),
    user = userEvent.setup();
  render(wrap(<ApprovalCard request={request} onDecision={host} />));
  expect(screen.getByRole("button", { name: "Keep title" })).not.toHaveFocus();
  screen.getByRole("button", { name: "Keep title" }).focus();
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(host).toHaveBeenCalledWith(
      request,
      "rejected",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    ),
  );
  expect(screen.getByText("Request rejected")).toBeVisible();
});
it("does not revive invalidated approval when an old proposal returns", async () => {
  const user = userEvent.setup(),
    host = vi.fn().mockResolvedValue(undefined);
  const { rerender } = render(
    wrap(
      <ApprovalFlow label="Review" requests={[request]} onDecision={host} />,
    ),
  );
  await user.click(screen.getByRole("button", { name: "Approve rename" }));
  await screen.findByText("All decisions made.");
  rerender(
    wrap(
      <ApprovalFlow
        label="Review"
        requests={[{ ...request, target: "Changed" }]}
        onDecision={host}
      />,
    ),
  );
  rerender(
    wrap(
      <ApprovalFlow label="Review" requests={[request]} onDecision={host} />,
    ),
  );
  expect(screen.getByRole("button", { name: "Approve rename" })).toBeEnabled();
});
it("ignores a controlled decision bound to different content", () => {
  render(
    wrap(
      <ApprovalCard
        request={{ ...request, target: "Changed" }}
        value={{
          requestId: "a",
          requestKey: JSON.stringify([
            "a",
            "Rename sample",
            "Draft A",
            ["Only the sample title changes."],
            "",
            "Approve rename",
            "Keep title",
          ]),
          decision: "approved",
        }}
        onDecision={() => {}}
      />,
    ),
  );
  expect(screen.getByRole("button", { name: "Approve rename" })).toBeEnabled();
});
it("guards question submissions and cancels schema replacement, reset and unmount", async () => {
  const user = userEvent.setup(),
    task = deferred(),
    onSubmit = vi.fn<
      import("./AskUserQuestions").AskUserQuestionsProps["onSubmit"]
    >(() => task.promise);
  const props = {
    questions: [
      { id: "q", label: "Question", choices: [{ value: "yes", label: "Yes" }] },
    ],
    value: { q: { choice: "yes" } },
    onValueChange: () => {},
    onSubmit,
  };
  const { rerender, unmount } = render(wrap(<AskUserQuestions {...props} />));
  const button = screen.getByRole("button", { name: "Submit answers" });
  await user.click(button);
  fireEvent.click(button);
  expect(onSubmit).toHaveBeenCalledTimes(1);
  const first = onSubmit.mock.calls[0][1].signal;
  rerender(
    wrap(
      <AskUserQuestions
        {...props}
        questions={[{ ...props.questions[0], label: "Changed question" }]}
      />,
    ),
  );
  expect(first.aborted).toBe(true);
  await act(async () => task.resolve());
  expect(screen.queryByText("Answers accepted.")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Submit answers" }));
  rerender(wrap(<AskUserQuestions {...props} resetKey={1} />));
  expect(onSubmit.mock.calls[1][1].signal.aborted).toBe(true);
  await user.click(screen.getByRole("button", { name: "Submit answers" }));
  unmount();
  expect(onSubmit.mock.calls[2][1].signal.aborted).toBe(true);
});
it("keeps a controlled flow on its current request until accepted records are published", async () => {
  const host = vi.fn().mockResolvedValue(undefined),
    publish = vi.fn(),
    user = userEvent.setup();
  const { rerender } = render(
    wrap(
      <ApprovalFlow
        label="Review"
        requests={[request, { ...request, id: "b" }]}
        value={[]}
        onValueChange={publish}
        onDecision={host}
      />,
    ),
  );
  await user.click(screen.getByRole("button", { name: "Approve rename" }));
  await waitFor(() => expect(publish).toHaveBeenCalledTimes(1));
  expect(screen.getByText("Request 1 of 2")).toBeVisible();
  expect(screen.getByRole("button", { name: "Approve rename" })).toBeDisabled();
  rerender(
    wrap(
      <ApprovalFlow
        label="Review"
        requests={[request, { ...request, id: "b" }]}
        value={publish.mock.calls[0][0]}
        onValueChange={publish}
        onDecision={host}
      />,
    ),
  );
  expect(screen.getByText("Request 2 of 2")).toBeVisible();
});
it("merges an accepted callback with controlled records updated while it was pending", async () => {
  const user = userEvent.setup(),
    task = deferred(),
    host = () => task.promise,
    publish = vi.fn();
  const b = { ...request, id: "b", target: "Draft B" },
    records = [
      {
        requestId: "b",
        requestKey: JSON.stringify([
          "b",
          "Rename sample",
          "Draft B",
          ["Only the sample title changes."],
          "",
          "Approve rename",
          "Keep title",
        ]),
        decision: "rejected" as const,
      },
    ];
  const { rerender } = render(
    wrap(
      <ApprovalFlow
        label="Review"
        requests={[request, b]}
        value={[]}
        onValueChange={publish}
        onDecision={host}
      />,
    ),
  );
  await user.click(screen.getByRole("button", { name: "Approve rename" }));
  rerender(
    wrap(
      <ApprovalFlow
        label="Review"
        requests={[request, b]}
        value={records}
        onValueChange={publish}
        onDecision={host}
      />,
    ),
  );
  await act(async () => task.resolve());
  expect(publish.mock.calls[0][0]).toHaveLength(2);
  expect(publish.mock.calls[0][0][0]).toEqual(records[0]);
});
it("aborts the flow host callback when its pending same-ID request changes", async () => {
  const task = deferred(),
    user = userEvent.setup(),
    host = vi.fn<ApprovalCardProps["onDecision"]>(() => task.promise);
  const { rerender } = render(
    wrap(
      <ApprovalFlow
        label="Review"
        requests={[request, { ...request, id: "b" }]}
        onDecision={host}
      />,
    ),
  );
  await user.click(screen.getByRole("button", { name: "Approve rename" }));
  rerender(
    wrap(
      <ApprovalFlow
        label="Review"
        requests={[
          { ...request, action: "Changed action" },
          { ...request, id: "b" },
        ]}
        onDecision={host}
      />,
    ),
  );
  expect(host.mock.calls[0][2].signal.aborted).toBe(true);
  await act(async () => task.resolve());
  expect(screen.getByRole("group", { name: "Changed action" })).toBeVisible();
  expect(screen.getByText("Request 1 of 2")).toBeVisible();
  expect(
    screen.queryByRole("list", { name: "Prior decisions" }),
  ).not.toBeInTheDocument();
});
it("does not steal focus on host failure when the user has moved away", async () => {
  const task = deferred(),
    user = userEvent.setup();
  render(
    wrap(
      <>
        <ApprovalCard request={request} onDecision={() => task.promise} />
        <button>Outside</button>
      </>,
    ),
  );
  await user.click(screen.getByRole("button", { name: "Approve rename" }));
  await user.click(screen.getByRole("button", { name: "Outside" }));
  await act(async () => task.reject(new Error("host")));
  expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
});
it("ignores digit keys with modifiers or inside the other-answer field", async () => {
  const user = userEvent.setup();
  function Host() {
    const [value, setValue] = useState<QuestionAnswers>({});
    return (
      <SystemProvider config={defaultConfig}>
        <AskUserQuestions
          questions={[
            {
              id: "q",
              label: "أي الفواتير أبدأ؟",
              allowOther: true,
              choices: [
                { value: "suppliers", label: "فواتير الموردين" },
                { value: "customers", label: "فواتير العملاء" },
                { value: "expenses", label: "المصروفات" },
              ],
            },
          ]}
          value={value}
          onValueChange={setValue}
          onSubmit={async () => {}}
        />
      </SystemProvider>
    );
  }
  render(<Host />);
  await user.click(screen.getByRole("radio", { name: /فواتير الموردين/ }));
  await user.keyboard("۳");
  expect(screen.getByRole("radio", { name: /المصروفات/ })).toBeChecked();
  await user.keyboard("{Control>}١{/Control}");
  expect(screen.getByRole("radio", { name: /المصروفات/ })).toBeChecked();
  await user.click(screen.getByRole("radio", { name: /إجابة أخرى/ }));
  await user.type(screen.getByRole("textbox", { name: "إجابة أخرى" }), "١");
  expect(screen.getByRole("textbox", { name: "إجابة أخرى" })).toHaveValue("١");
  expect(screen.getByRole("radio", { name: /إجابة أخرى/ })).toBeChecked();
});
it("submits a text answer with Ctrl+Enter or Cmd+Enter", async () => {
  const user = userEvent.setup();
  for (const modifier of ["Control", "Meta"]) {
    const onSubmit = vi.fn();
    const { unmount } = render(
      wrap(
        <AskUserQuestions
          questions={[{ id: "notes", label: "Notes?", type: "text" }]}
          value={{ notes: { text: "Keep concise" } }}
          onValueChange={() => {}}
          onSubmit={onSubmit}
        />,
      ),
    );
    await user.click(screen.getByRole("textbox", { name: "Notes?" }));
    // Enter alone only adds a line to the answer.
    await user.keyboard("{Enter}");
    expect(onSubmit, modifier).not.toHaveBeenCalled();
    await user.keyboard(`{${modifier}>}{Enter}{/${modifier}}`);
    expect(onSubmit, modifier).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0], modifier).toEqual({
      notes: { text: "Keep concise" },
    });
    unmount();
  }
});
const arabic = (ui: React.ReactNode) => (
  <SystemProvider config={defaultConfig}>{ui}</SystemProvider>
);
it("approves a reversible request with Ctrl or Cmd+Enter, and never an irreversible one", async () => {
  vi.useFakeTimers();
  const reversible = vi.fn();
  const view = render(
    wrap(<ApprovalCard request={request} reversible onDecision={reversible} />),
  );
  const group = screen.getByRole("group", { name: "Rename sample" });
  expect(
    screen.getByRole("button", { name: "Approve rename" }).querySelector("kbd"),
  ).not.toBeNull();
  act(() => group.focus());
  act(() => vi.advanceTimersByTime(500));
  await act(async () =>
    fireEvent.keyDown(group, { key: "Enter", ctrlKey: true }),
  );
  expect(reversible).toHaveBeenCalledWith(
    request,
    "approved",
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
  view.unmount();
  // Irreversible, alone or also marked reversible: no hint and no chord.
  for (const props of [
    { irreversible: true },
    { reversible: true, irreversible: true },
  ]) {
    const onDecision = vi.fn();
    const card = render(
      wrap(
        <ApprovalCard request={request} {...props} onDecision={onDecision} />,
      ),
    );
    const approve = screen.getByRole("button", { name: "Approve rename" });
    expect(approve.querySelector("kbd")).toBeNull();
    expect(approve).not.toHaveAccessibleDescription();
    expect(screen.getByText("This can't be undone.")).toBeVisible();
    const group = screen.getByRole("group", { name: "Rename sample" });
    act(() => group.focus());
    act(() => vi.advanceTimersByTime(600));
    for (const chord of [{ ctrlKey: true }, { metaKey: true }])
      await act(async () =>
        fireEvent.keyDown(group, { key: "Enter", ...chord }),
      );
    expect(onDecision).not.toHaveBeenCalled();
    // Escape still rejects.
    await act(async () => fireEvent.keyDown(group, { key: "Escape" }));
    expect(onDecision).toHaveBeenCalledWith(
      request,
      "rejected",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    card.unmount();
  }
});
it("lets a Sheet or Modal take Escape and records nothing", async () => {
  const user = userEvent.setup(),
    onDecision = vi.fn(),
    onOpenChange = vi.fn();
  render(
    wrap(
      <Modal
        open
        onOpenChange={onOpenChange}
        trigger={<button type="button">Review</button>}
        title="Review the request"
        description="One request waits for you."
        closeLabel="Close"
      >
        <ApprovalCard request={request} onDecision={onDecision} />
      </Modal>,
    ),
  );
  act(() => screen.getByRole("button", { name: "Keep title" }).focus());
  await user.keyboard("{Escape}");
  expect(onOpenChange).toHaveBeenCalledWith(false);
  expect(onDecision).not.toHaveBeenCalled();
});
it("never approves the next request with a held or repeated chord", async () => {
  vi.useFakeTimers();
  const host = vi.fn().mockResolvedValue(undefined),
    second = { ...request, id: "b", action: "Archive sample" };
  render(
    wrap(
      <ApprovalFlow
        label="Review"
        requests={[request, second]}
        approval={() => ({ reversible: true })}
        onDecision={host}
      />,
    ),
  );
  act(() => screen.getByRole("group", { name: "Rename sample" }).focus());
  act(() => vi.advanceTimersByTime(500));
  await act(async () =>
    fireEvent.keyDown(document.activeElement!, { key: "Enter", ctrlKey: true }),
  );
  expect(host).toHaveBeenCalledTimes(1);
  expect(host.mock.calls[0].slice(0, 2)).toEqual([request, "approved"]);
  // Accepted: the next request has focus, and a held chord must not act on it.
  const next = screen.getByRole("group", { name: "Archive sample" });
  expect(next).toHaveFocus();
  await act(async () =>
    fireEvent.keyDown(next, { key: "Enter", ctrlKey: true, repeat: true }),
  );
  act(() => vi.advanceTimersByTime(100));
  await act(async () =>
    fireEvent.keyDown(next, { key: "Enter", ctrlKey: true }),
  );
  expect(host).toHaveBeenCalledTimes(1);
  act(() => vi.advanceTimersByTime(500));
  await act(async () =>
    fireEvent.keyDown(next, { key: "Enter", ctrlKey: true }),
  );
  expect(host).toHaveBeenCalledTimes(2);
  expect(host.mock.calls[1].slice(0, 2)).toEqual([second, "approved"]);
});
it("expires on the host's word, aborting a decision in flight", async () => {
  const task = deferred(),
    host = vi.fn<ApprovalCardProps["onDecision"]>(() => task.promise),
    user = userEvent.setup();
  const { rerender } = render(
    arabic(<ApprovalCard request={request} onDecision={host} />),
  );
  await user.click(screen.getByRole("button", { name: "Approve rename" }));
  const { signal } = host.mock.calls[0][2];
  rerender(
    arabic(<ApprovalCard request={request} onDecision={host} expired />),
  );
  expect(signal.aborted).toBe(true);
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.getByRole("status")).toHaveTextContent("انتهت مهلة الطلب");
  // A late answer from the host records nothing.
  await act(async () => task.resolve());
  expect(screen.queryByText("تمت الموافقة")).toBeNull();
  expect(screen.getByRole("status")).toHaveTextContent("انتهت مهلة الطلب");
});
it("shows impact, the irreversibility note, expiry and the middle action in reading order", () => {
  render(arabic(<ApprovalCardExample language="ar" />));
  const rows = within(screen.getByRole("table"))
    .getAllByRole("row")
    .map((row) => row.textContent);
  expect(rows).toHaveLength(3);
  for (const [index, [customer, amount]] of [
    ["شركة مدار", "١٥٬٦٠٠ ر.س"],
    ["مؤسسة الندى", "١١٬٢٠٠ ر.س"],
    ["الرواد للتجارة", "٨٬٠٠٠ ر.س"],
  ].entries()) {
    expect(rows[index]).toContain(customer);
    expect(rows[index]).toContain(amount);
  }
  expect(
    screen.getByText("تُرسل من بريد التحصيل، ولا يمكن استرجاعها بعد الإرسال."),
  ).toBeVisible();
  expect(screen.getByText("ينتهي الطلب خلال ٢٣ ساعة")).toBeVisible();
  expect(
    screen.getAllByRole("button").map((button) => button.textContent),
  ).toEqual([expect.stringContaining("رفض"), "عرض الرسائل", "أرسل الرسائل"]);
});
it("takes labels, heading levels and the plain appearance", () => {
  const card = render(
    wrap(
      <ApprovalCard
        request={request}
        onDecision={() => {}}
        labels={{ target: "Recipient" }}
        headingLevel={2}
        appearance="plain"
      />,
    ),
  );
  expect(screen.getByText("Recipient")).toBeVisible();
  expect(screen.queryByText("Target")).toBeNull();
  expect(
    screen.getByRole("heading", { level: 2, name: "Rename sample" }),
  ).toBeVisible();
  expect(card.container.querySelector(".tz-tray")).toBeNull();
  card.unmount();
  render(
    arabic(
      <ApprovalFlow
        label="المراجعة"
        requests={[request, { ...request, id: "b" }]}
        labels={{ position: (current, total) => `${current} / ${total}` }}
        onDecision={() => {}}
      />,
    ),
  );
  expect(screen.getByText("١ / ٢")).toBeVisible();
  expect(screen.queryByText("الطلب ١ من ٢")).toBeNull();
});
const closeQuestion = {
  id: "scope",
  label: "أي الفواتير أبدأ مطابقتها؟",
  choices: [
    { value: "suppliers", label: "فواتير الموردين" },
    { value: "customers", label: "فواتير العملاء" },
  ],
  allowOther: true,
};
it("folds accepted answers into a receipt and offers to edit them", async () => {
  const user = userEvent.setup(),
    onEditAnswers = vi.fn();
  function Host({ receipt }: { receipt?: boolean }) {
    const [value, setValue] = useState<QuestionAnswers>({});
    return (
      <SystemProvider config={defaultConfig}>
        <AskUserQuestions
          questions={[closeQuestion]}
          value={value}
          onValueChange={setValue}
          onSubmit={async () => {}}
          receipt={receipt}
          onEditAnswers={onEditAnswers}
        />
      </SystemProvider>
    );
  }
  const view = render(<Host receipt />);
  await user.click(screen.getByRole("radio", { name: /فواتير الموردين/ }));
  await user.click(screen.getByRole("button", { name: "إرسال الإجابات" }));
  const answers = await screen.findByRole("heading", { name: "إجاباتك" });
  expect(answers).toBeVisible();
  expect(
    within(view.container.querySelector(".tz-question-receipt")!).getByText(
      "فواتير الموردين",
    ),
  ).toBeVisible();
  expect(screen.queryByRole("radio")).toBeNull();
  await user.click(screen.getByRole("button", { name: "تعديل الإجابات" }));
  expect(onEditAnswers).toHaveBeenCalledTimes(1);
  view.unmount();
  // Without a receipt, today's accepted status stays.
  render(<Host />);
  await user.click(screen.getByRole("radio", { name: /فواتير الموردين/ }));
  await user.click(screen.getByRole("button", { name: "إرسال الإجابات" }));
  expect(await screen.findByText("أُرسلت الإجابات.")).toBeVisible();
  expect(screen.queryByRole("heading", { name: "إجاباتك" })).toBeNull();
  expect(screen.getByRole("radio", { name: /فواتير الموردين/ })).toBeChecked();
});
it("skips the questions through onSkip", async () => {
  const user = userEvent.setup(),
    onSkip = vi.fn(),
    onSubmit = vi.fn();
  const props = {
    questions: [closeQuestion],
    value: {},
    onValueChange: () => {},
    onSubmit,
  };
  const { rerender } = render(
    arabic(<AskUserQuestions {...props} onSkip={onSkip} />),
  );
  await user.click(screen.getByRole("button", { name: "تخطّي الأسئلة" }));
  expect(onSkip).toHaveBeenCalledTimes(1);
  expect(onSubmit).not.toHaveBeenCalled();
  rerender(arabic(<AskUserQuestions {...props} />));
  expect(screen.queryByRole("button", { name: "تخطّي الأسئلة" })).toBeNull();
});
