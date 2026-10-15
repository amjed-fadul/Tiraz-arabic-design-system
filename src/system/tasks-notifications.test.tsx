import { createRef } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import * as System from "./index";
import { TaskRowsExample } from "./ai/examples/TaskRowsExamples";
import { NotificationListExample } from "./ai/examples/NotificationListExamples";

it("keeps task completion separate from actions, respects disabled and preserves identity", async () => {
  const user = userEvent.setup(),
    change = vi.fn(),
    action = vi.fn();
  const ref = createRef<HTMLUListElement>();
  const items = [
    {
      id: "one",
      label: "Review DOC-42",
      completed: false,
      actions: <button onClick={action}>Details</button>,
    },
    { id: "two", label: "Locked", completed: false, disabled: true },
  ];
  const view = render(
    <System.TaskRows
      ref={ref}
      id="tasks"
      label="Tasks"
      items={items}
      onCompletedChange={change}
    />,
  );
  const list = screen.getByRole("list", { name: "Tasks" });
  expect(ref.current).toBe(list);
  expect(list.tagName).toBe("UL");
  expect(list).toHaveAttribute("id", "tasks");
  const first = screen.getByRole("checkbox", { name: "Review DOC-42" });
  await user.click(screen.getByRole("button", { name: "Details" }));
  expect(action).toHaveBeenCalledOnce();
  expect(change).not.toHaveBeenCalled();
  await user.click(screen.getByRole("checkbox", { name: "Locked" }));
  expect(change).not.toHaveBeenCalled();
  await user.click(first);
  expect(change).toHaveBeenLastCalledWith("one", true);
  view.rerender(
    <System.TaskRows
      ref={ref}
      label="Tasks"
      items={[{ ...items[0], completed: true }, items[1]]}
      onCompletedChange={change}
    />,
  );
  expect(screen.getByRole("checkbox", { name: "Review DOC-42" })).toBe(first);
  expect(first).toHaveFocus();
  expect(first).toBeChecked();
  expect(within(list).getAllByRole("listitem")[0]).toHaveTextContent(
    "Review DOC-42",
  );
  await user.keyboard(" ");
  expect(change).toHaveBeenLastCalledWith("one", false);
});
it("renders static completion text and explicit empty content without checkboxes", () => {
  const view = render(
    <System.TaskRows
      label="Tasks"
      items={[
        { id: "x", label: "Done", completed: true },
        { id: "y", label: "Later", completed: false },
      ]}
    />,
  );
  expect(screen.queryByRole("checkbox")).toBeNull();
  expect(screen.getByText("مكتملة")).toBeVisible();
  expect(screen.getByText("غير مكتملة")).toBeVisible();
  view.rerender(
    <System.TaskRows
      label="Tasks"
      items={[]}
      emptyState={<System.EmptyState title="No tasks" />}
    />,
  );
  expect(screen.getByRole("heading", { name: "No tasks" })).toBeVisible();
});
it("derives notification counts, renders time and never marks read from an action", async () => {
  const user = userEvent.setup(),
    read = vi.fn(),
    all = vi.fn();
  const ref = createRef<HTMLDivElement>();
  const items = [
    {
      id: "a",
      title: "Review",
      read: false,
      timestamp: "15 Oct",
      dateTime: "2026-10-15",
      action: <button>Open note</button>,
    },
    { id: "b", title: "Ready", read: true, timestamp: "Yesterday" },
  ];
  const view = render(
    <System.NotificationList
      ref={ref}
      id="notices"
      label="Notifications"
      items={items}
      onMarkRead={read}
      onMarkAllRead={all}
    />,
  );
  expect(ref.current).toHaveAttribute("id", "notices");
  const list = screen.getByRole("list", { name: "Notifications" });
  expect(list.querySelector("time")).toHaveAttribute("datetime", "2026-10-15");
  expect(list.querySelectorAll("time")).toHaveLength(1);
  expect(screen.getByText("١ غير مقروءة")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Open note" }));
  expect(read).not.toHaveBeenCalled();
  const control = screen.getByRole("button", { name: "تحديد كمقروءة: Review" });
  await user.click(control);
  expect(read).toHaveBeenCalledWith("a");
  view.rerender(
    <System.NotificationList
      ref={ref}
      label="Notifications"
      items={[{ ...items[0], read: true }, items[1]]}
      onMarkRead={read}
      onMarkAllRead={all}
    />,
  );
  expect(screen.getByText("٠ غير مقروءة")).toBeVisible();
  expect(screen.getByRole("button", { name: "مقروءة: Review" })).toBe(control);
  expect(control).toHaveFocus();
  await user.click(control);
  expect(read).toHaveBeenCalledOnce();
  expect(
    screen.getByRole("button", { name: "تحديد الكل كمقروء" }),
  ).toBeDisabled();
  view.rerender(
    <System.NotificationList
      label="Notifications"
      items={items}
      onMarkRead={read}
      onMarkAllRead={all}
    />,
  );
  await user.click(screen.getByRole("button", { name: "تحديد الكل كمقروء" }));
  expect(all).toHaveBeenCalledOnce();
});
it("supports noninteractive notifications and a distinct supplied empty state", () => {
  const view = render(
    <System.NotificationList
      label="Notices"
      items={[{ id: "a", title: "New", timestamp: "Today", read: false }]}
    />,
  );
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.getByText("غير مقروءة", { exact: true })).toBeVisible();
  view.rerender(
    <System.NotificationList
      label="Notices"
      items={[]}
      emptyState={<System.EmptyState title="No notifications" />}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "No notifications" }),
  ).toBeVisible();
});
it("task example derives completion count and retains original order on reopen", async () => {
  const user = userEvent.setup();
  render(
    <System.SystemProvider
      config={{ ...System.defaultConfig, direction: "ltr" }}
    >
      <TaskRowsExample language="en" />
    </System.SystemProvider>,
  );
  const checks = screen.getAllByRole("checkbox");
  expect(screen.getByRole("status")).toHaveTextContent("1 of 3 completed");
  await user.click(checks[0]);
  expect(screen.getByRole("status")).toHaveTextContent("2 of 3 completed");
  expect(screen.getAllByRole("checkbox")).toEqual(checks);
  expect(checks[0]).toHaveFocus();
  await user.keyboard(" ");
  expect(screen.getByRole("status")).toHaveTextContent("1 of 3 completed");
});
it("filters actual notifications, preserves action/read separation and moves focus after removal", async () => {
  const user = userEvent.setup();
  render(
    <System.SystemProvider
      config={{ ...System.defaultConfig, direction: "ltr" }}
    >
      <NotificationListExample language="en" />
    </System.SystemProvider>,
  );
  await user.click(
    screen.getByRole("button", { name: "Show details: Review requested" }),
  );
  expect(screen.getByText(/Spacing and naming/)).toBeVisible();
  expect(screen.getByText("2 unread")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Unread" }));
  let controls = screen.getAllByRole("button", { name: /^Mark as read:/ });
  expect(controls).toHaveLength(2);
  await user.click(controls[0]);
  controls = screen.getAllByRole("button", { name: /^Mark as read:/ });
  expect(controls).toHaveLength(1);
  expect(controls[0]).toHaveFocus();
  await user.click(controls[0]);
  expect(
    screen.getByRole("heading", { name: "No unread notifications" }),
  ).toBeVisible();
  expect(screen.getByRole("button", { name: "Unread" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "All" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
});
it("mark all updates supplied items and has a predictable filter focus fallback", async () => {
  const user = userEvent.setup();
  render(
    <System.SystemProvider
      config={{ ...System.defaultConfig, direction: "ltr" }}
    >
      <NotificationListExample language="en" />
    </System.SystemProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Unread" }));
  await user.click(screen.getByRole("button", { name: "Mark all as read" }));
  expect(screen.getByText("0 unread")).toBeVisible();
  expect(screen.getByRole("button", { name: "Unread" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "All" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
});
it("returns focus to All when its empty-state action disappears", async () => {
  const user = userEvent.setup();
  render(
    <System.SystemProvider
      config={{ ...System.defaultConfig, direction: "ltr" }}
    >
      <NotificationListExample language="en" />
    </System.SystemProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Unread", exact: true }));
  await user.click(
    screen.getByRole("button", { name: "Mark all as read", exact: true }),
  );
  await user.click(
    screen.getByRole("button", { name: "Show all", exact: true }),
  );
  expect(
    screen.getByRole("button", { name: "All", exact: true }),
  ).toHaveFocus();
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
});
it("returns focus to the previous unread item when the last row is read", async () => {
  const user = userEvent.setup();
  render(
    <System.SystemProvider
      config={{ ...System.defaultConfig, direction: "ltr" }}
    >
      <NotificationListExample language="en" />
    </System.SystemProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Unread", exact: true }));
  const controls = screen.getAllByRole("button", { name: /^Mark as read:/ });
  await user.click(controls[1]);
  expect(controls[0]).toHaveFocus();
  expect(screen.getByText("1 unread")).toBeVisible();
});
