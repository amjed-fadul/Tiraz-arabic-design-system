import { createRef, useState } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import {
  Avatar,
  AvatarGroup,
  Button,
  DropdownMenu,
  EmptyState,
  GettingStartedIllustration,
  Input,
  Modal,
  NoRecordsIllustration,
  NoSearchResultsIllustration,
  Select,
  SystemProvider,
  Tooltip,
  defaultConfig,
} from "./index";

it("names an Avatar once, with deliberate fallback during load and failure", () => {
  const { container } = render(
    <Avatar name="سارة علي" fallback="س ع" src="/portrait.svg" />,
  );
  expect(screen.getByRole("img", { name: "سارة علي" })).toHaveTextContent(
    "س ع",
  );
  const image = container.querySelector("img")!;
  expect(image).toHaveAttribute("alt", "");
  fireEvent.error(image);
  expect(screen.getByRole("img")).toHaveTextContent("س ع");
  expect(container.querySelector("img")).toBeNull();
});
it("retries changed and removed/reintroduced image sources without stale failure", () => {
  const { container, rerender } = render(
    <Avatar name="Sara Ali" src="/bad.svg" />,
  );
  fireEvent.error(container.querySelector("img")!);
  expect(screen.getByRole("img")).toHaveTextContent("SA");
  rerender(<Avatar name="Sara Ali" src="/good.svg" />);
  expect(container.querySelector("img")).toHaveAttribute("src", "/good.svg");
  fireEvent.load(container.querySelector("img")!);
  expect(screen.getByRole("img")).not.toHaveTextContent("SA");
  rerender(<Avatar name="Sara Ali" />);
  expect(screen.getByRole("img")).toHaveTextContent("SA");
  rerender(<Avatar name="Sara Ali" src="/bad.svg" />);
  expect(container.querySelector("img")).toHaveAttribute("src", "/bad.svg");
});
it("can hide an Avatar's naming beside equivalent text, forwarding its ref", () => {
  const ref = createRef<HTMLSpanElement>();
  render(
    <>
      <Avatar ref={ref} name="Sara Ali" decorative />
      <span>Sara Ali</span>
    </>,
  );
  expect(screen.queryByRole("img")).toBeNull();
  expect(ref.current).toHaveAttribute("aria-hidden", "true");
});
const members = [
  { id: "sara", name: "Sara Ali", fallback: "SA" },
  { id: "omar", name: "Omar Noor", fallback: "ON" },
  { id: "lina", name: "Lina Saleh", fallback: "LS" },
];
it.each(["rtl", "ltr"] as const)(
  "keeps %s group member order and translated noninteractive overflow",
  (direction) => {
    render(
      <SystemProvider config={{ ...defaultConfig, direction }}>
        <AvatarGroup
          members={members}
          label="Team"
          maxVisible={1}
          overflowLabel={(n) => `${n} more members`}
        />
      </SystemProvider>,
    );
    const group = screen.getByRole("group", { name: "Team" });
    expect(within(group).getAllByRole("img")).toHaveLength(1);
    expect(within(group).getByRole("img")).toHaveAccessibleName("Sara Ali");
    expect(
      within(group)
        .getByText(direction === "rtl" ? "+٢" : "+2")
        .closest("[aria-hidden]"),
    ).toHaveAttribute("aria-hidden", "true");
    // The hidden names are joined in the interface language.
    expect(group).toHaveTextContent(
      direction === "rtl"
        ? "2 more members: Omar Noor، Lina Saleh"
        : "2 more members: Omar Noor, Lina Saleh",
    );
    expect(within(group).queryByRole("button")).toBeNull();
  },
);
it.each([0, -1, 1.8, Infinity, NaN])(
  "normalizes group limit %s without dropping members",
  (limit) => {
    render(
      <AvatarGroup
        members={members}
        label="Team"
        maxVisible={limit}
        overflowLabel={(n) => `${n} more`}
      />,
    );
    expect(screen.getByRole("group")).toHaveTextContent("SA");
    expect(screen.getAllByRole("img")).toHaveLength(
      Number.isFinite(limit) ? 1 : 3,
    );
  },
);
it("preserves Tooltip trigger ref/name/existing descriptions and dismisses on Escape", async () => {
  const ref = createRef<HTMLButtonElement>();
  render(
    <SystemProvider>
      <p id="existing">Existing help</p>
      <Tooltip
        content="Short explanation"
        trigger={
          <button ref={ref} aria-describedby="existing">
            Details
          </button>
        }
      />
    </SystemProvider>,
  );
  const button = screen.getByRole("button", { name: "Details" });
  expect(ref.current).toBe(button);
  await userEvent.tab();
  expect(button).toHaveFocus();
  const tip = screen.getByRole("tooltip", { hidden: true });
  expect(button).toHaveAccessibleDescription("Existing help Short explanation");
  expect(tip.closest(".tiraz-system")).not.toBeNull();
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
  expect(button).toHaveAccessibleDescription("Existing help");
  expect(button).toHaveFocus();
});
it("delays hover, allows tooltip hover, closes on leave and cancels pending work", async () => {
  const user = userEvent.setup();
  const { unmount } = render(
    <SystemProvider>
      <Tooltip
        delayDuration={40}
        content="Help"
        trigger={<Button>Hover</Button>}
      />
    </SystemProvider>,
  );
  const button = screen.getByRole("button");
  await user.hover(button);
  expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
  await waitFor(() =>
    expect(screen.getByRole("tooltip", { hidden: true })).toBeInTheDocument(),
  );
  fireEvent.pointerLeave(button);
  fireEvent.pointerEnter(screen.getByRole("tooltip", { hidden: true }));
  expect(screen.getByRole("tooltip", { hidden: true })).toBeInTheDocument();
  fireEvent.pointerLeave(screen.getByRole("tooltip", { hidden: true }));
  await waitFor(() =>
    expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull(),
  );
  await user.hover(button);
  unmount();
});
function DialogExample({ controlled = false }: { controlled?: boolean }) {
  const [open, setOpen] = useState(false);
  const initialFocusRef = createRef<HTMLInputElement>();
  return (
    <SystemProvider config={{ ...defaultConfig, theme: "dark" }}>
      <Modal
        trigger={<Button>Open modal</Button>}
        title="Preferences"
        description="Choose your view"
        closeLabel="Close modal"
        open={controlled ? open : undefined}
        onOpenChange={setOpen}
        initialFocusRef={initialFocusRef}
        footer={<Button onClick={() => setOpen(false)}>Done</Button>}
      >
        <Input label="Name" ref={initialFocusRef} />
        <DropdownMenu
          trigger={<Button>Actions</Button>}
          items={[
            { id: "one", label: "One" },
            { id: "two", label: "Two" },
          ]}
        />
        <Select
          aria-label="View"
          placeholder="Choose view"
          options={[
            { value: "list", label: "List" },
            { value: "cards", label: "Cards" },
          ]}
        />
        <Tooltip content="Inside help" trigger={<Button>Help</Button>} />
      </Modal>
      <Button>Outside</Button>
    </SystemProvider>
  );
}
it.each([false, true])(
  "names and focuses Modal in controlled=%s mode, traps Tab and restores trigger",
  async (controlled) => {
    render(<DialogExample controlled={controlled} />);
    const user = userEvent.setup(),
      trigger = screen.getByRole("button", { name: "Open modal" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Preferences" });
    expect(dialog).toHaveAccessibleDescription("Choose your view");
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveFocus();
    for (let i = 0; i < 9; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    for (let i = 0; i < 9; i++) {
      await user.tab({ shift: true });
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Close modal" }));
    await waitFor(() => expect(trigger).toHaveFocus());
  },
);
it("dismisses Modal on an outside pointer and restores focus", async () => {
  const { container } = render(<DialogExample />);
  await userEvent.click(screen.getByRole("button", { name: "Open modal" }));
  const backdrop = container.querySelector(".tz-modal-backdrop")!;
  await userEvent.click(backdrop);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.getByRole("button", { name: "Open modal" })).toHaveFocus();
});
it("scopes nested menu, Select and Tooltip to Modal, dismissing one layer at a time", async () => {
  render(<DialogExample />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Open modal" }));
  const dialog = screen.getByRole("dialog");
  const actions = screen.getByRole("button", { name: "Actions" });
  actions.focus();
  await user.keyboard("{ArrowDown}");
  expect(dialog).toContainElement(screen.getByRole("menu"));
  await user.keyboard("{End}");
  expect(screen.getByRole("menuitem", { name: "Two" })).toHaveFocus();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(actions).toHaveFocus());
  expect(dialog).toBeInTheDocument();
  const select = screen.getByRole("combobox", { name: "View" });
  select.focus();
  await user.keyboard("{ArrowDown}");
  expect(dialog).toContainElement(screen.getByRole("listbox"));
  await user.keyboard("{Enter}");
  expect(select).toHaveTextContent("List");
  await waitFor(() => expect(select).toHaveFocus());
  screen.getByRole("button", { name: "Help" }).focus();
  await waitFor(() =>
    expect(screen.getByRole("tooltip", { hidden: true })).toBeInTheDocument(),
  );
  expect(dialog).toContainElement(
    screen.getByRole("tooltip", { hidden: true }),
  );
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
  expect(dialog).toBeInTheDocument();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});
it("renders optional EmptyState slots and hides each geometric illustration from AT", () => {
  const { container, rerender } = render(
    <EmptyState
      title="No records"
      description="Start here"
      illustration={<NoRecordsIllustration />}
      action={<Button>Add record</Button>}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "No records" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Add record" }),
  ).toBeInTheDocument();
  expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  rerender(
    <>
      <EmptyState
        title="No results"
        illustration={<NoSearchResultsIllustration />}
      />
      <EmptyState
        title="Get started"
        illustration={<GettingStartedIllustration />}
      />
      <EmptyState title="Simple" />
      <EmptyState
        title="Custom"
        illustration={<span>Custom decoration</span>}
      />
    </>,
  );
  expect(container.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(2);
  expect(
    screen.getByText("Custom decoration").closest('[aria-hidden="true"]'),
  ).not.toBeNull();
  expect(screen.queryByRole("img")).toBeNull();
});

it("opens on fresh keyboard focus immediately after dismissing a hovered tooltip", async () => {
  render(
    <SystemProvider>
      <Tooltip
        content="Help"
        delayDuration={0}
        trigger={<button>Trigger</button>}
      />
    </SystemProvider>,
  );
  const trigger = screen.getByRole("button");
  fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
  await waitFor(() =>
    expect(screen.getByRole("tooltip", { hidden: true })).toBeInTheDocument(),
  );
  await userEvent.keyboard("{Escape}");
  fireEvent.pointerLeave(trigger);
  trigger.focus();
  await waitFor(() =>
    expect(screen.getByRole("tooltip", { hidden: true })).toBeInTheDocument(),
  );
});
it("does not consume Escape for empty tooltip content inside a Modal", async () => {
  render(
    <SystemProvider>
      <Modal
        title="Test"
        description="Help"
        closeLabel="Close"
        trigger={<Button>Open</Button>}
      >
        <Tooltip content="" trigger={<button>Empty help</button>} />
      </Modal>
    </SystemProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  screen.getByRole("button", { name: "Empty help" }).focus();
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

it("dismisses nested Select on Escape while preserving Modal and restoring Select focus", async () => {
  render(<DialogExample />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Open modal" }));
  const select = screen.getByRole("combobox", { name: "View" });
  select.focus();
  await user.keyboard("{ArrowDown}");
  await waitFor(() =>
    expect(screen.getByRole("option", { name: "List" })).toHaveFocus(),
  );
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  await waitFor(() => expect(select).toHaveFocus());
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

it.each(["click", "Escape"] as const)(
  "reopens on a new hover after %s dismissal while the trigger stays focused",
  (dismissal) => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      const ref = createRef<HTMLButtonElement>();
      const click = vi.fn(),
        enter = vi.fn(),
        leave = vi.fn(),
        focus = vi.fn();
      render(
        <SystemProvider>
          <p id="hover-help">Existing help</p>
          <Tooltip
            delayDuration={80}
            content="Hover explanation"
            trigger={
              <button
                ref={ref}
                aria-describedby="hover-help"
                onClick={click}
                onPointerEnter={enter}
                onPointerLeave={leave}
                onFocus={focus}
              >
                Details
              </button>
            }
          />
        </SystemProvider>,
      );
      const trigger = screen.getByRole("button", { name: "Details" });
      const advance = (ms: number) => {
        act(() => vi.advanceTimersByTime(ms));
      };
      fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
      advance(80);
      expect(screen.getByRole("tooltip", { hidden: true })).toBeInTheDocument();
      if (dismissal === "click") {
        fireEvent.pointerDown(trigger, { pointerType: "mouse" });
        act(() => trigger.focus());
        fireEvent.click(trigger);
        expect(click).toHaveBeenCalledTimes(1);
      } else {
        act(() => trigger.focus());
        fireEvent.keyDown(trigger, { key: "Escape" });
      }
      expect(trigger).toHaveFocus();
      expect(ref.current).toBe(trigger);
      expect(focus).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
      expect(trigger).toHaveAccessibleDescription("Existing help");
      advance(200);
      expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
      fireEvent.pointerLeave(trigger, { pointerType: "mouse" });
      expect(trigger).toHaveFocus();
      fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
      expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
      advance(79);
      expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
      advance(1);
      expect(screen.getByRole("tooltip", { hidden: true })).toBeInTheDocument();
      expect(trigger).toHaveFocus();
      expect(trigger).toHaveAccessibleName("Details");
      expect(trigger).toHaveAccessibleDescription(
        "Existing help Hover explanation",
      );
      expect(enter).toHaveBeenCalledTimes(2);
      expect(leave).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  },
);
