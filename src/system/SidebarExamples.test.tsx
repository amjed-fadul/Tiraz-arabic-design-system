import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { expect, it } from "vitest";
import { SystemProvider } from "./index";
import { SidebarExample } from "./ai/examples/SidebarExamples";
it("retains native modified destinations without changing the current sample note", () => {
  render(
    <SystemProvider>
      <SidebarExample language="en" />
    </SystemProvider>,
  );
  const nav = screen.getByRole("navigation", { name: "Library navigation" });
  const guide = within(nav).getByRole("link", { name: "Components" });
  const layout = within(nav).getByRole("link", { name: "Resources" });
  fireEvent.click(layout, { ctrlKey: true });
  expect(guide).toHaveAttribute("aria-current", "page");
  expect(layout).not.toHaveAttribute("aria-current");
  fireEvent.click(layout);
  expect(layout).toHaveAttribute("aria-current", "page");
});

it("opens native hash destinations and follows browser history in the sample", () => {
  window.history.replaceState(null, "", "/#tiraz-sidebar-reading");
  render(
    <SystemProvider>
      <SidebarExample language="en" />
    </SystemProvider>,
  );
  const nav = screen.getByRole("navigation", { name: "Library navigation" });
  expect(within(nav).getByRole("link", { name: "Components" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(
    screen.getByRole("heading", { level: 3, name: "Components" }),
  ).toBeVisible();
  window.history.replaceState(null, "", "/#tiraz-sidebar-layout");
  fireEvent(window, new HashChangeEvent("hashchange"));
  expect(within(nav).getByRole("link", { name: "Resources" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(
    screen.getByRole("heading", { level: 3, name: "Resources" }),
  ).toBeVisible();
  window.history.replaceState(null, "", "/");
});

it("demonstrates seven top-level library destinations in two groups, active children and page actions", async () => {
  const { default: userEvent } = await import("@testing-library/user-event");
  const user = userEvent.setup();
  render(
    <SystemProvider>
      <SidebarExample language="en" idPrefix="rich-sidebar" />
    </SystemProvider>,
  );
  const nav = screen.getByRole("navigation", { name: "Library navigation" });
  expect(within(nav).getAllByRole("group")).toHaveLength(2);
  expect(within(nav).getByRole("button", { name: "Library" })).toHaveAttribute(
    "data-active",
    "true",
  );
  expect(within(nav).getByRole("link", { name: "Components" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  for (const name of [
    "Overview",
    "Guides",
    "Components",
    "Resources",
    "Documents",
    "People",
    "Activity",
    "Notifications",
    "Settings",
  ]) {
    await user.click(within(nav).getByRole("link", { name }));
    expect(screen.getByRole("heading", { level: 3, name })).toBeVisible();
  }
  await user.click(within(nav).getByRole("link", { name: "Notifications" }));
  await user.click(screen.getByRole("button", { name: "Clear reminders" }));
  expect(screen.getByText("You’re all caught up.")).toBeVisible();
  expect(
    within(nav).getByRole("link", { name: "Notifications" }),
  ).toHaveTextContent("0");
});

it("routes the footer action to the settings page and focuses its heading", async () => {
  const { default: userEvent } = await import("@testing-library/user-event");
  const user = userEvent.setup();
  render(
    <SystemProvider>
      <SidebarExample language="en" idPrefix="footer-sidebar" />
    </SystemProvider>,
  );
  const nav = screen.getByRole("navigation", { name: "Library navigation" });
  await user.click(screen.getByRole("button", { name: "Account settings" }));
  expect(within(nav).getByRole("link", { name: "Settings" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const heading = screen.getByRole("heading", { level: 3, name: "Settings" });
  await waitFor(() => expect(heading).toHaveFocus());
});
