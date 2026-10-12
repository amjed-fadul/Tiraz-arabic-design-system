import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import {
  Button,
  DropdownMenu,
  Sheet,
  Switch,
  SystemProvider,
  defaultConfig,
  ToastProvider,
  useToast,
} from "./index";
it.each([
  { external: "external", internal: undefined, want: "external" },
  {
    external: undefined,
    internal: "Internal help",
    want: "setting-description",
  },
  {
    external: "external another",
    internal: "Internal help",
    want: "external another setting-description",
  },
])(
  "preserves Switch description IDs: $want",
  ({ external, internal, want }) => {
    render(
      <>
        <p id="external">External help</p>
        <p id="another">More help</p>
        <Switch
          id="setting"
          label="Setting"
          description={internal}
          aria-describedby={external}
        />
      </>,
    );
    expect(screen.getByRole("switch")).toHaveAttribute(
      "aria-describedby",
      want,
    );
    expect(screen.getByRole("switch")).toHaveAccessibleDescription(
      [
        external ? "External help" : "",
        external?.includes("another") ? "More help" : "",
        internal ?? "",
      ]
        .filter(Boolean)
        .join(" "),
    );
  },
);
it.each(["rtl", "ltr"] as const)(
  "keeps a nested menu inside its modal's theme and focus scope in %s",
  async (direction) => {
    render(
      <SystemProvider
        config={{ ...defaultConfig, direction, theme: "dark", accent: "blue" }}
      >
        <Sheet
          trigger={<Button>Open sheet</Button>}
          title="Details"
          description="Customer"
          closeLabel="Close sheet"
        >
          <DropdownMenu
            trigger={<Button>Nested actions</Button>}
            items={[
              { id: "first", label: "First" },
              { id: "last", label: "Last" },
            ]}
          />
        </Sheet>
      </SystemProvider>,
    );
    const sheetTrigger = screen.getByRole("button", { name: "Open sheet" });
    await userEvent.click(sheetTrigger);
    const dialog = screen.getByRole("dialog");
    const trigger = within(dialog).getByRole("button", {
      name: "Nested actions",
    });
    trigger.focus();
    await userEvent.keyboard("{ArrowDown}");
    const menu = screen.getByRole("menu");
    expect(dialog).toContainElement(menu);
    expect(menu.closest(".tiraz-system")).toHaveAttribute("data-theme", "dark");
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "First" })).toHaveFocus(),
    );
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("menuitem", { name: "Last" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(dialog).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(sheetTrigger).toHaveFocus());
  },
);

it.each(["loading", "success", "error"] as const)(
  "replaces an icon-only Button's content with its %s feedback icon",
  (state) => {
    const { container } = render(
      <Button iconOnly aria-label="Save settings" state={state}>
        <svg aria-hidden="true" data-testid="content-icon" />
      </Button>,
    );
    expect(
      screen.getByRole("button", { name: "Save settings" }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    expect(screen.queryByTestId("content-icon")).not.toBeInTheDocument();
  },
);

function ToastExpiryDemo() {
  const { toast } = useToast();
  return (
    <Button onClick={() => toast({ title: "Timed message", duration: 150 })}>
      Notify
    </Button>
  );
}
it("restores caller focus after manually closing a toast", async () => {
  render(
    <SystemProvider>
      <ToastProvider label="Notifications" closeLabel="Dismiss">
        <ToastExpiryDemo />
      </ToastProvider>
    </SystemProvider>,
  );
  const trigger = screen.getByRole("button", { name: "Notify" });
  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  await waitFor(() => expect(trigger).toHaveFocus());
});
it("expires subsequent toasts after a manual dismissal", async () => {
  render(
    <SystemProvider>
      <ToastProvider label="Notifications" closeLabel="Dismiss">
        <ToastExpiryDemo />
      </ToastProvider>
    </SystemProvider>,
  );
  const trigger = screen.getByRole("button", { name: "Notify" });
  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  await userEvent.click(trigger);
  expect(screen.getAllByText("Timed message").length).toBeGreaterThan(0);
  await waitFor(
    () => expect(screen.queryByText("Timed message")).not.toBeInTheDocument(),
    { timeout: 1500 },
  );
});

it("keeps focus in a sibling toast when another toast closes", async () => {
  render(
    <SystemProvider>
      <ToastProvider label="Notifications" closeLabel="Dismiss">
        <ToastExpiryDemo />
      </ToastProvider>
    </SystemProvider>,
  );
  const trigger = screen.getByRole("button", { name: "Notify" });
  await userEvent.click(trigger);
  await userEvent.click(trigger);
  const dismiss = screen.getAllByRole("button", { name: "Dismiss" });
  dismiss[1].focus();
  fireEvent.click(dismiss[0]);
  expect(dismiss[1]).toHaveFocus();
});

it("expires a new toast after pointer-only dismissal of the last message", async () => {
  render(
    <SystemProvider>
      <ToastProvider label="Notifications" closeLabel="Dismiss">
        <ToastExpiryDemo />
      </ToastProvider>
    </SystemProvider>,
  );
  const trigger = screen.getByRole("button", { name: "Notify" });
  await userEvent.click(trigger);
  fireEvent.pointerMove(screen.getByRole("button", { name: "Dismiss" }));
  fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(trigger).toHaveFocus();
  await userEvent.click(trigger);
  await waitFor(
    () => expect(screen.queryByText("Timed message")).not.toBeInTheDocument(),
    { timeout: 1500 },
  );
});

it("preserves caller state when starting a new toast batch", async () => {
  render(
    <SystemProvider>
      <ToastProvider label="Notifications" closeLabel="Dismiss">
        <Switch label="Caller preference" defaultChecked={false} />
        <ToastExpiryDemo />
      </ToastProvider>
    </SystemProvider>,
  );
  await userEvent.click(screen.getByRole("switch"));
  const trigger = screen.getByRole("button", { name: "Notify" });
  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  await userEvent.click(trigger);
  expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
});
