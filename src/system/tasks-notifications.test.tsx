import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import * as System from "./index";
import { NotificationListExample } from "./ai/examples/NotificationListExamples";

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
  const control = screen.getByRole("button", { name: "تعليم كمقروءة: Review" });
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
    screen.getByRole("button", { name: "تعليم الكل كمقروء" }),
  ).toBeDisabled();
  view.rerender(
    <System.NotificationList
      label="Notifications"
      items={items}
      onMarkRead={read}
      onMarkAllRead={all}
    />,
  );
  await user.click(screen.getByRole("button", { name: "تعليم الكل كمقروء" }));
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
it("filters actual notifications, preserves action/read separation and moves focus after removal", async () => {
  const user = userEvent.setup();
  render(
    <System.SystemProvider
      config={{ ...System.defaultConfig, direction: "ltr" }}
    >
      <NotificationListExample language="en" />
    </System.SystemProvider>,
  );
  expect(screen.queryByText(/sample|in memory|local/i)).toBeNull();
  await user.click(
    screen.getByRole("button", { name: "Show details: Review requested" }),
  );
  expect(screen.getByText(/price table on page 4/)).toBeVisible();
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
  await user.click(screen.getByRole("button", { name: "Unread" }));
  await user.click(screen.getByRole("button", { name: "Mark all as read" }));
  await user.click(screen.getByRole("button", { name: "Show all" }));
  expect(screen.getByRole("button", { name: "All" })).toHaveFocus();
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
  await user.click(screen.getByRole("button", { name: "Unread" }));
  const controls = screen.getAllByRole("button", { name: /^Mark as read:/ });
  await user.click(controls[1]);
  expect(controls[0]).toHaveFocus();
  expect(screen.getByText("1 unread")).toBeVisible();
});
