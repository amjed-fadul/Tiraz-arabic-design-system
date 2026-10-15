import { createRef } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import * as System from "./index";
import { StepsFormExample } from "./ai/examples/StepsExamples";
import { TimelineExample } from "./ai/examples/TimelineExamples";

const items = [
  { id: "brief", label: "Brief", description: "Goals", status: "completed" },
  { id: "details", label: "Details", status: "current" },
  { id: "review", label: "Review", status: "error" },
  { id: "finish", label: "Finish", status: "upcoming" },
] as const;
it("shows all statuses without controls, one current step and native ordered list/ref", () => {
  const ref = createRef<HTMLOListElement>();
  render(
    <System.Steps
      ref={ref}
      id="steps"
      label="Process"
      items={items}
      locale="en"
    />,
  );
  const list = screen.getByRole("list", { name: "Process" });
  expect(list.tagName).toBe("OL");
  expect(ref.current).toBe(list);
  expect(list).toHaveAttribute("id", "steps");
  expect(within(list).getAllByRole("listitem")).toHaveLength(4);
  expect(within(list).queryByRole("button")).toBeNull();
  for (const status of ["Completed", "Current", "Error", "Upcoming"])
    expect(within(list).getByText(status, { exact: true })).toBeInTheDocument();
  expect(list.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
  expect(list.querySelector('[aria-current="step"]')).toHaveTextContent(
    "Details",
  );
});
it("opts into native keyboard buttons and leaves activation/state decisions with the caller", async () => {
  const activate = vi.fn(),
    user = userEvent.setup();
  render(
    <form>
      <System.Steps
        items={items}
        label="Process"
        locale="en"
        onStepActivate={activate}
      />
    </form>,
  );
  const buttons = screen.getAllByRole("button");
  expect(
    buttons.every((button) => button.getAttribute("type") === "button"),
  ).toBe(true);
  buttons[3]!.focus();
  await user.keyboard("{Enter}");
  buttons[0]!.focus();
  await user.keyboard(" ");
  expect(activate.mock.calls).toEqual([["finish"], ["brief"]]);
  expect(document.querySelector('[aria-current="step"]')).toHaveTextContent(
    "Details",
  );
});
it("supports a current error and keeps item/button identity across reorder without automatic callbacks", () => {
  const activate = vi.fn();
  const { rerender } = render(
    <System.Steps
      items={items}
      currentId="review"
      label="Process"
      onStepActivate={activate}
    />,
  );
  const button = screen.getByRole("button", { name: /Review/ });
  expect(button).toHaveAttribute("aria-current", "step");
  rerender(
    <System.Steps
      items={[...items].reverse()}
      currentId="review"
      label="Process"
      onStepActivate={activate}
      orientation="vertical"
    />,
  );
  expect(screen.getByRole("button", { name: /Review/ })).toBe(button);
  expect(screen.getByRole("list")).toHaveAttribute(
    "data-orientation",
    "vertical",
  );
  expect(activate).not.toHaveBeenCalled();
});
it("marks only the first current status unless currentId explicitly selects another item", () => {
  const { rerender } = render(
    <System.Steps
      label="Process"
      items={items.map((item) => ({ ...item, status: "current" }))}
    />,
  );
  expect(document.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
  rerender(<System.Steps label="Process" items={items} currentId="missing" />);
  expect(document.querySelector("[aria-current]")).toBeNull();
});
it("validates local form fields, focuses errors, preserves Back/Next values and reports accurate completion", async () => {
  const user = userEvent.setup();
  render(<StepsFormExample language="en" />);
  await user.click(screen.getByRole("button", { name: "Next" }));
  const name = screen.getByRole("textbox", { name: /Name/ });
  expect(name).toHaveFocus();
  expect(name).toHaveAttribute("aria-invalid", "true");
  await user.type(name, "Sara");
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  const email = screen.getByRole("textbox", { name: /Email/ });
  expect(email).toHaveFocus();
  await user.type(email, "bad");
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(email).toHaveFocus();
  await user.clear(email);
  await user.type(email, "sara@example.com");
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByRole("textbox", { name: /Name/ })).toHaveValue("Sara");
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("textbox", { name: /Email/ })).toHaveValue(
    "sara@example.com",
  );
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("sara@example.com")).toBeVisible();
  await user.click(
    screen.getByRole("button", { name: "Complete local example" }),
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "The local example is complete. Nothing was saved or sent.",
  );
  expect(document.querySelector('[aria-current="step"]')).toBeNull();
});
it("preserves supplied Timeline order under RTL, native dates/ref and application content", async () => {
  const action = vi.fn(),
    ref = createRef<HTMLOListElement>();
  const events = [
    {
      id: "late",
      title: "Later first",
      timestamp: "15 October 2026",
      dateTime: "2026-10-15",
      description: <bdi dir="ltr">DOC-42</bdi>,
      content: (
        <System.Button onClick={action}>Open local details</System.Button>
      ),
    },
    { id: "early", title: "Earlier second", timestamp: "Yesterday" },
  ];
  const { rerender } = render(
    <System.Timeline ref={ref} label="Activity" dir="rtl" items={events} />,
  );
  const list = screen.getByRole("list", { name: "Activity" });
  expect(list.tagName).toBe("OL");
  expect(ref.current).toBe(list);
  expect(
    within(list)
      .getAllByRole("listitem")
      .map((item) => item.textContent),
  ).toEqual([
    expect.stringContaining("Later first"),
    expect.stringContaining("Earlier second"),
  ]);
  expect(list.querySelector("time")).toHaveAttribute("datetime", "2026-10-15");
  expect(list.querySelectorAll("time")).toHaveLength(1);
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Open local details" }));
  expect(action).toHaveBeenCalledOnce();
  const first = within(list).getAllByRole("listitem")[0];
  rerender(<System.Timeline label="Activity" items={[...events].reverse()} />);
  expect(within(list).getAllByRole("listitem")[1]).toBe(first);
});
it("shows caller-owned empty content and appends real in-memory events without replacing history", async () => {
  const { unmount } = render(
    <System.Timeline
      label="Activity"
      items={[]}
      emptyState="No activity yet"
    />,
  );
  expect(screen.getByText("No activity yet")).toBeVisible();
  unmount();
  render(<TimelineExample language="en" empty />);
  expect(
    screen.getByText(
      "In-memory sample data; cleared when this example unmounts.",
    ),
  ).toBeVisible();
  expect(screen.getByText("No local events yet.")).toBeVisible();
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Append local event" }));
  await user.click(screen.getByRole("button", { name: "Append local event" }));
  expect(
    screen
      .getByRole("list", { name: "Local activity" })
      .querySelectorAll("time"),
  ).toHaveLength(2);
  expect(screen.getAllByText(/Local event [12]/)).toHaveLength(2);
});

it("focuses the updated stage text only after the application commits it", async () => {
  const user = userEvent.setup();
  render(<StepsFormExample language="en" />);
  const heading = screen.getByRole("heading", { level: 3 });
  const namesAtFocus: Array<string | null> = [];
  heading.addEventListener("focus", () =>
    namesAtFocus.push(heading.textContent),
  );
  await user.type(screen.getByRole("textbox", { name: /Name/ }), "Sara");
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(namesAtFocus.at(-1)).toBe("Contact");
  await user.type(
    screen.getByRole("textbox", { name: /Email/ }),
    "sara@example.com",
  );
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(namesAtFocus.at(-1)).toBe("Review");
  await user.click(
    screen.getByRole("button", { name: "Complete local example" }),
  );
  expect(namesAtFocus.at(-1)).toBe("Local example complete");
});
