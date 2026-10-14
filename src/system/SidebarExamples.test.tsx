import { fireEvent, render, screen, within } from "@testing-library/react";
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
  const guide = within(nav).getByRole("link", { name: "Guide" });
  const layout = within(nav).getByRole("link", { name: "Layout" });
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
  expect(within(nav).getByRole("link", { name: "Reading" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(
    screen.getByRole("heading", { level: 4, name: "Reading" }),
  ).toBeVisible();
  window.history.replaceState(null, "", "/#tiraz-sidebar-layout");
  fireEvent(window, new HashChangeEvent("hashchange"));
  expect(within(nav).getByRole("link", { name: "Layout" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(
    screen.getByRole("heading", { level: 4, name: "Layout" }),
  ).toBeVisible();
  window.history.replaceState(null, "", "/");
});
