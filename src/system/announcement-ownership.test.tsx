import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import {
  ApprovalCard,
  ApprovalFlow,
  ChangeSummary,
  ColorPicker,
  DraftReview,
  ImageGeneration,
  SuggestedEdits,
  SystemProvider,
  TagInput,
  defaultConfig,
} from "./index";
import type { ReactNode } from "react";

const wrap = (children: ReactNode) => (
  <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
    {children}
  </SystemProvider>
);
const liveSemantics = (container: HTMLElement) =>
  container.querySelectorAll('[role="status"], [role="alert"], [aria-live]');

it("lets SuggestedEdits opt out while keeping its visible receipt; polite remains the default", () => {
  const props = {
    actions: [{ id: "shorter", label: "Shorter" }],
    onAction: () => {},
    suggestion: {
      title: "Shorten it",
      segments: [{ id: "c1", kind: "insert" as const, text: "new" }],
    },
    decisions: { c1: "accepted" as const },
  };
  const view = render(
    wrap(
      <SuggestedEdits {...props} status="applied" announcement="off">
        Text
      </SuggestedEdits>,
    ),
  );
  expect(liveSemantics(view.container)).toHaveLength(0);
  expect(screen.getByText(/Applied 1 edit/)).toBeVisible();

  view.rerender(
    wrap(
      <SuggestedEdits {...props} status="idle">
        Text
      </SuggestedEdits>,
    ),
  );
  view.rerender(
    wrap(
      <SuggestedEdits {...props} status="applied">
        Text
      </SuggestedEdits>,
    ),
  );
  expect(screen.getByRole("status")).toHaveTextContent(/Applied 1 edit/);
});

it("lets ApprovalCard opt out while keeping its visible receipt; polite remains the default", () => {
  const request = {
    id: "approval-1",
    action: "Send invoice",
    target: "Northwind",
    consequences: [],
    approveLabel: "Approve",
    rejectLabel: "Reject",
  };
  const view = render(
    wrap(
      <ApprovalCard
        request={request}
        onDecision={() => {}}
        expired
        labels={{ expired: "Request expired" }}
        announcement="off"
      />,
    ),
  );
  expect(liveSemantics(view.container)).toHaveLength(0);
  expect(screen.getByText("Request expired")).toBeVisible();

  view.rerender(
    wrap(
      <ApprovalCard
        request={request}
        onDecision={() => {}}
        expired
        labels={{ expired: "Request expired" }}
      />,
    ),
  );
  expect(screen.getByRole("status")).toHaveTextContent("Request expired");
});

it("lets ApprovalFlow keep its own region while silencing its nested approval", () => {
  const request = {
    id: "approval-flow-1",
    action: "Send invoice",
    target: "Northwind",
    consequences: [],
    approveLabel: "Approve",
    rejectLabel: "Reject",
  };
  const view = render(
    wrap(
      <ApprovalFlow
        label="Approval sequence"
        requests={[request]}
        onDecision={() => {}}
        approval={() => ({
          expired: true,
          announcement: "off",
          labels: { expired: "Request expired" },
        })}
      />,
    ),
  );
  expect(liveSemantics(view.container)).toHaveLength(1);
  expect(screen.getByText("Request expired")).toBeVisible();
});

it("lets ImageGeneration and its failed image opt out while keeping failure text; polite remains the default", () => {
  const props = {
    prompt: "A landscape",
    images: [{ id: "one", alt: "A landscape at dusk", width: 3, height: 2 }],
  };
  const view = render(
    wrap(
      <ImageGeneration
        {...props}
        status="failed"
        labels={{ failed: "Generation failed" }}
        announcement="off"
      />,
    ),
  );
  expect(liveSemantics(view.container)).toHaveLength(0);
  expect(
    view.container.querySelector(".tz-image-result-status strong"),
  ).toHaveTextContent("Generation failed");
  expect(screen.getByText("A landscape at dusk")).toBeVisible();

  view.rerender(wrap(<ImageGeneration {...props} status="weaving" />));
  view.rerender(
    wrap(
      <ImageGeneration
        {...props}
        status="failed"
        labels={{ failed: "Generation failed" }}
      />,
    ),
  );
  expect(
    view.container.querySelector(".tz-image-generation > [role='status']"),
  ).toHaveTextContent("Generation failed");
});

it("keeps TagInput validation described when announcements are off; polite remains the default", async () => {
  const user = userEvent.setup();
  const view = render(
    wrap(
      <TagInput label="Tags" defaultValue={["Design"]} announcement="off" />,
    ),
  );
  const input = screen.getByRole("textbox", { name: "Tags" });
  await user.type(input, "Design{Enter}");
  expect(liveSemantics(view.container)).toHaveLength(0);
  const feedback = view.container.querySelector(".tz-entry-feedback")!;
  expect(feedback).toHaveTextContent("This tag is already added.");
  expect(input).toHaveAttribute("aria-describedby", feedback.id);

  view.rerender(wrap(<TagInput label="Tags" defaultValue={["Design"]} />));
  await user.clear(input);
  await user.type(input, "Design{Enter}");
  expect(screen.getByRole("status")).toHaveTextContent(
    "This tag is already added.",
  );
});

it("keeps ColorPicker validation described when announcements are off; polite remains the default", () => {
  const view = render(wrap(<ColorPicker label="Color" announcement="off" />));
  const input = screen.getByRole("textbox", { name: "Color" });
  fireEvent.change(input, { target: { value: "#1" } });
  fireEvent.blur(input);
  expect(liveSemantics(view.container)).toHaveLength(0);
  const feedback = view.container.querySelector(".tz-entry-feedback")!;
  expect(feedback).toHaveTextContent(/#RGB.*#RRGGBB/);
  expect(input).toHaveAttribute("aria-describedby", feedback.id);

  view.rerender(wrap(<ColorPicker label="Color" />));
  fireEvent.change(input, { target: { value: "#1" } });
  fireEvent.blur(input);
  expect(screen.getByRole("status")).toHaveTextContent(/#RGB.*#RRGGBB/);
});

it("lets ChangeSummary opt out while keeping its visible failure state; polite remains the default", () => {
  const props = {
    rows: [],
    labels: { failed: "Could not update summary" },
  };
  const view = render(
    wrap(<ChangeSummary {...props} status="failed" announcement="off" />),
  );
  expect(liveSemantics(view.container)).toHaveLength(0);
  expect(screen.getByText(/Could not update summary/)).toBeVisible();

  view.rerender(wrap(<ChangeSummary {...props} status="ready" />));
  view.rerender(wrap(<ChangeSummary {...props} status="failed" />));
  expect(
    view.container.querySelector(".tz-change-summary > [role='status']"),
  ).toHaveTextContent("Could not update summary");
});

it("lets DraftReview opt out while keeping its visible receipt; polite remains the default", () => {
  const props = {
    recipients: [],
    body: "Invoice details",
    labels: { sent: "Message sent" },
  };
  const view = render(
    wrap(<DraftReview {...props} status="sent" announcement="off" />),
  );
  expect(liveSemantics(view.container)).toHaveLength(0);
  expect(screen.getByText("Message sent")).toBeVisible();

  view.rerender(wrap(<DraftReview {...props} status="ready" />));
  view.rerender(wrap(<DraftReview {...props} status="sent" />));
  expect(
    view.container.querySelector(".tz-draft-review > [role='status']"),
  ).toHaveTextContent("Message sent");
});
