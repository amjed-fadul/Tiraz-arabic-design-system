import { createRef, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import * as System from "./index";

function Fixture({
  collapsed,
  onCollapsedChange,
}: {
  collapsed?: boolean;
  onCollapsedChange?: (value: boolean) => void;
}) {
  return (
    <System.SystemProvider>
      <System.Sidebar
        aria-label="Workspace"
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
      >
        <System.SidebarHeader>
          <System.SidebarToggle
            collapseLabel="Collapse navigation"
            expandLabel="Expand navigation"
          />
        </System.SidebarHeader>
        <System.SidebarContent aria-label="Primary">
          <System.SidebarGroup heading="Work">
            <System.SidebarItem
              href="#home"
              icon={<span>H</span>}
              label="Home"
              active
              count={0}
            />
            <System.SidebarDisclosure
              icon={<span>P</span>}
              label="Projects"
              activeChild
              defaultOpen
            >
              <System.SidebarItem
                href="#recent"
                icon={<span>R</span>}
                label="Recent"
                active
              />
            </System.SidebarDisclosure>
          </System.SidebarGroup>
        </System.SidebarContent>
        <System.SidebarFooter>
          <System.SidebarAction icon={<span>A</span>} label="Account" />
        </System.SidebarFooter>
      </System.Sidebar>
    </System.SystemProvider>
  );
}
it("exports the Sidebar family", () => {
  expect(System).toHaveProperty("Sidebar");
});
it("collapses uncontrolled navigation and restores focused children to their visible parent", async () => {
  const user = userEvent.setup();
  render(<Fixture />);
  screen.getByRole("link", { name: "Recent" }).focus();
  await user.click(screen.getByRole("button", { name: "Collapse navigation" }));
  expect(screen.queryByRole("link", { name: "Recent" })).toBeNull();
  expect(
    screen.getByRole("button", { name: "Expand navigation" }),
  ).toHaveFocus();
  expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.getByRole("button", { name: "Projects" })).toHaveAttribute(
    "data-active",
    "true",
  );
  expect(screen.getByRole("link", { name: "Home" })).toHaveAccessibleName(
    "Home",
  );
  await user.click(screen.getByRole("button", { name: "Projects" }));
  expect(
    screen.getByRole("button", { name: "Collapse navigation" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Recent" })).toBeVisible();
});
it("preserves focus when controlled collapse hides a child, and supports controlled disclosure", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  const { rerender } = render(
    <Fixture collapsed={false} onCollapsedChange={change} />,
  );
  await user.click(screen.getByRole("button", { name: "Collapse navigation" }));
  expect(change).toHaveBeenCalledWith(true);
  expect(screen.getByRole("link", { name: "Recent" })).toBeVisible();
  screen.getByRole("link", { name: "Recent" }).focus();
  rerender(<Fixture collapsed onCollapsedChange={change} />);
  expect(screen.getByRole("button", { name: "Projects" })).toHaveFocus();
  expect(screen.queryByRole("link", { name: "Recent" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Projects" }));
  expect(change).toHaveBeenCalledWith(false);
  expect(screen.queryByRole("link", { name: "Recent" })).toBeNull();
});
it("forwards link/action/toggle refs and native handlers; cancellation prevents collapse", async () => {
  const user = userEvent.setup();
  const link = createRef<HTMLAnchorElement>();
  const action = createRef<HTMLButtonElement>();
  const toggle = createRef<HTMLButtonElement>();
  const click = vi.fn();
  render(
    <System.SystemProvider>
      <System.Sidebar>
        <System.SidebarToggle
          ref={toggle}
          collapseLabel="Collapse"
          expandLabel="Expand"
          onClick={(event) => event.preventDefault()}
        />
        <System.SidebarItem
          ref={link}
          href="/real"
          target="_blank"
          icon={<span />}
          label="Real"
          count="123456"
          data-test="native"
        />
        <System.SidebarAction
          ref={action}
          icon={<span />}
          label="Run"
          onClick={click}
        />
      </System.Sidebar>
    </System.SystemProvider>,
  );
  await user.click(toggle.current!);
  expect(toggle.current).toHaveAccessibleName("Collapse");
  expect(link.current).toHaveAttribute("target", "_blank");
  expect(link.current).toHaveAttribute("data-test", "native");
  await user.click(action.current!);
  expect(click).toHaveBeenCalledOnce();
});
it("controlled disclosure closes hidden descendants and transfers external-change focus", () => {
  function Example({ open }: { open: boolean }) {
    return (
      <System.Sidebar>
        <System.SidebarDisclosure label="Group" icon={<span />} open={open}>
          <System.SidebarItem href="#child" icon={<span />} label="Child" />
        </System.SidebarDisclosure>
      </System.Sidebar>
    );
  }
  const { rerender } = render(<Example open />);
  screen.getByRole("link", { name: "Child" }).focus();
  rerender(<Example open={false} />);
  expect(screen.queryByRole("link", { name: "Child" })).toBeNull();
  expect(screen.getByRole("button", { name: "Group" })).toHaveFocus();
});
it("hidden slot labels give focus to the toggle on external collapse", () => {
  function Example({ collapsed }: { collapsed: boolean }) {
    return (
      <System.Sidebar collapsed={collapsed}>
        <System.SidebarToggle collapseLabel="Collapse" expandLabel="Expand" />
        <System.SidebarLabel>
          <button>Hidden action</button>
        </System.SidebarLabel>
      </System.Sidebar>
    );
  }
  const { rerender } = render(<Example collapsed={false} />);
  screen.getByRole("button", { name: "Hidden action" }).focus();
  rerender(<Example collapsed />);
  expect(screen.getByRole("button", { name: "Expand" })).toHaveFocus();
});
it("controlled toggle updates caller state and rail items expose existing Tooltip labels", async () => {
  function Example() {
    const [collapsed, setCollapsed] = useState(true);
    return <Fixture collapsed={collapsed} onCollapsedChange={setCollapsed} />;
  }
  const user = userEvent.setup();
  render(<Example />);
  screen.getByRole("link", { name: "Home" }).focus();
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Home");
  await user.click(screen.getByRole("button", { name: "Expand navigation" }));
  expect(screen.getByRole("link", { name: "Recent" })).toBeVisible();
});
