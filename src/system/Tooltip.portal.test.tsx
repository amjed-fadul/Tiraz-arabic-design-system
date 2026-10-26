import { Fragment, StrictMode, useState } from "react";
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as Tiraz from "./index";

const hosts: HTMLElement[] = [];
function host() {
  const element = document.createElement("div");
  document.body.append(element);
  hosts.push(element);
  return element;
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  for (const element of hosts.splice(0)) element.remove();
});
beforeEach(() => {
  // Popper hides detached anchors; jsdom needs explicit nonzero geometry.
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1024);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(768);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    x: 400,
    y: 200,
    left: 400,
    top: 200,
    right: 500,
    bottom: 240,
    width: 100,
    height: 40,
    toJSON() {
      return {};
    },
  });
  expect(Tiraz.TooltipRoot).toBeTypeOf("function");
  expect(Tiraz.TooltipTrigger).toBeTypeOf("function");
  expect(Tiraz.TooltipContent).toBeTypeOf("function");
});

it("keeps the convenience wrapper in its original provider scope", async () => {
  const { container } = render(
    <Tiraz.SystemProvider>
      <Tiraz.Tooltip
        trigger={<Tiraz.Button>Details</Tiraz.Button>}
        content="Original usage"
      />
    </Tiraz.SystemProvider>,
  );
  await userEvent.tab();
  const tip = screen.getByRole("tooltip");
  expect(container.querySelector(".tiraz-system")).toContainElement(tip);
  expect(container.querySelectorAll(".tiraz-system")).toHaveLength(1);
  expect(tip).toHaveAttribute("data-side", "top");
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
  expect(screen.getByRole("button")).toHaveFocus();
});

it("forwards additive wrapper state, destination and placement options", async () => {
  const destination = host();
  const change = vi.fn();
  const view = (open: boolean) => (
    <Tiraz.SystemProvider>
      <Tiraz.Tooltip
        open={open}
        onOpenChange={change}
        portalContainer={destination}
        side="bottom"
        align="start"
        sideOffset={10}
        alignOffset={4}
        collisionPadding={8}
        trigger={<button>Details</button>}
        content="Wrapper extension"
      />
    </Tiraz.SystemProvider>
  );
  const { rerender } = render(view(true));
  const tip = within(destination).getByRole("tooltip");
  expect(tip).toHaveTextContent("Wrapper extension");
  expect(tip).toHaveAttribute("data-side", "bottom");
  expect(tip).toHaveAttribute("data-align", "start");
  await userEvent.keyboard("{Escape}");
  expect(change.mock.calls).toEqual([[false]]);
  expect(tip).toBeInTheDocument();
  rerender(view(false));
  expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
});

it("uses a component destination before the provider destination", () => {
  const providerHost = host(),
    componentHost = host();
  render(
    <Tiraz.SystemProvider
      portalContainer={providerHost}
      lang="ar"
      config={{ ...Tiraz.defaultConfig, theme: "dark", direction: "rtl" }}
    >
      <Tiraz.TooltipRoot open>
        <Tiraz.TooltipTrigger>Details</Tiraz.TooltipTrigger>
        <Tiraz.TooltipContent portalContainer={componentHost}>
          شرح
        </Tiraz.TooltipContent>
      </Tiraz.TooltipRoot>
    </Tiraz.SystemProvider>,
  );
  const tip = within(componentHost).getByRole("tooltip");
  expect(
    within(providerHost).queryByRole("tooltip", { hidden: true }),
  ).toBeNull();
  const scope = tip.closest(".tiraz-system");
  expect(scope).toHaveAttribute("lang", "ar");
  expect(scope).toHaveAttribute("dir", "rtl");
  expect(scope).toHaveAttribute("data-theme", "dark");
});

it("withholds a pending component host, moves to its replacement and cleans up", () => {
  const providerHost = host(),
    first = host(),
    second = host();
  const view = (destination: HTMLElement | null | undefined) => (
    <Tiraz.SystemProvider portalContainer={providerHost}>
      <p id="existing">Existing help</p>
      <Tiraz.TooltipRoot open>
        <Tiraz.TooltipTrigger aria-describedby="existing">
          Details
        </Tiraz.TooltipTrigger>
        <Tiraz.TooltipContent portalContainer={destination}>
          Available help
        </Tiraz.TooltipContent>
      </Tiraz.TooltipRoot>
    </Tiraz.SystemProvider>
  );
  const { rerender, unmount } = render(view(null));
  const trigger = screen.getByRole("button");
  const expectPending = () => {
    expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
    expect(trigger).toHaveAttribute("aria-describedby", "existing");
    const escape = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    trigger.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(false);
  };
  expectPending();
  rerender(view(first));
  expect(within(first).getByRole("tooltip")).toHaveTextContent(
    "Available help",
  );
  expect(trigger).toHaveAccessibleDescription("Existing help Available help");
  rerender(view(second));
  expect(first).toBeEmptyDOMElement();
  expect(within(second).getByRole("tooltip")).toBeInTheDocument();
  rerender(view(null));
  expect(second).toBeEmptyDOMElement();
  expectPending();
  rerender(view(undefined));
  expect(within(providerHost).getByRole("tooltip")).toBeInTheDocument();
  unmount();
  expect(providerHost).toBeEmptyDOMElement();
});

it("lets an explicit ready component host override a pending provider host", () => {
  const destination = host();
  render(
    <Tiraz.SystemProvider portalContainer={null}>
      <Tiraz.TooltipRoot open>
        <Tiraz.TooltipTrigger>Details</Tiraz.TooltipTrigger>
        <Tiraz.TooltipContent portalContainer={destination}>
          Ready here
        </Tiraz.TooltipContent>
      </Tiraz.TooltipRoot>
    </Tiraz.SystemProvider>,
  );
  expect(within(destination).getByRole("tooltip")).toHaveTextContent(
    "Ready here",
  );
  expect(screen.getByRole("button")).toHaveAccessibleDescription("Ready here");
});

it.each(["Modal", "Sheet"] as const)(
  "retains %s-local destination and one-layer Escape dismissal",
  async (kind) => {
    const providerHost = host();
    const Dialog = Tiraz[kind];
    render(
      <Tiraz.SystemProvider portalContainer={providerHost}>
        <Dialog
          trigger={<button>Open</button>}
          title="Settings"
          description="Choose settings"
          closeLabel="Close"
        >
          <button>First focus</button>
          <Tiraz.TooltipRoot>
            <Tiraz.TooltipTrigger>Help</Tiraz.TooltipTrigger>
            <Tiraz.TooltipContent>Nested help</Tiraz.TooltipContent>
          </Tiraz.TooltipRoot>
        </Dialog>
      </Tiraz.SystemProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    const dialog = screen.getByRole("dialog");
    const trigger = within(dialog).getByRole("button", { name: "Help" });
    act(() => trigger.focus());
    await waitFor(() =>
      expect(dialog).toContainElement(screen.getByRole("tooltip")),
    );
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
    expect(dialog).toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
);

it.each(["Modal", "Sheet"] as const)(
  "accepts an explicit host inside %s content without escaping its scope",
  async (kind) => {
    const providerHost = host();
    const Dialog = Tiraz[kind];
    function Example() {
      const [destination, setDestination] = useState<HTMLDivElement | null>(
        null,
      );
      return (
        <Dialog
          trigger={<button>Open</button>}
          title="Settings"
          description="Choose settings"
          closeLabel="Close"
        >
          <button>First focus</button>
          <div ref={setDestination} data-testid="inside-host" />
          <Tiraz.TooltipRoot>
            <Tiraz.TooltipTrigger>Help</Tiraz.TooltipTrigger>
            <Tiraz.TooltipContent portalContainer={destination}>
              Nested override
            </Tiraz.TooltipContent>
          </Tiraz.TooltipRoot>
        </Dialog>
      );
    }
    render(
      <Tiraz.SystemProvider portalContainer={providerHost} lang="ar">
        <Example />
      </Tiraz.SystemProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    const dialog = screen.getByRole("dialog");
    const trigger = within(dialog).getByRole("button", { name: "Help" });
    act(() => trigger.focus());
    const destination = within(dialog).getByTestId("inside-host");
    await waitFor(() =>
      expect(within(destination).getByRole("tooltip")).toHaveTextContent(
        "Nested override",
      ),
    );
    expect(
      screen.getByRole("tooltip").closest(".tiraz-system"),
    ).toHaveAttribute("lang", "ar");
    expect(trigger).toHaveAccessibleDescription("Nested override");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
    expect(dialog).toBeInTheDocument();
    expect(trigger).toHaveFocus();
  },
);

// Hosts outside Modal/Sheet content require browser evidence for Dialog's
// hideOthers and outside-pointer behavior before their contract is finalized.

it.each([false, true])(
  "clears callback-ref content on withdrawal (StrictMode: %s)",
  (strict) => {
    const Mode = strict ? StrictMode : Fragment;
    const destination = host();
    const cleanupRef = vi.fn();
    const ref = (node: HTMLDivElement | null) =>
      node ? cleanupRef : undefined;
    const tree = (open: boolean, portalContainer: HTMLElement | null) => (
      <Mode>
        <Tiraz.SystemProvider>
          <Tiraz.TooltipRoot open={open}>
            <Tiraz.TooltipTrigger>Help</Tiraz.TooltipTrigger>
            <Tiraz.TooltipContent
              ref={ref}
              portalContainer={portalContainer}
              style={{
                animationName: "tooltip-exit",
                animationDuration: "0.2s",
              }}
            >
              Explanation
            </Tiraz.TooltipContent>
          </Tiraz.TooltipRoot>
        </Tiraz.SystemProvider>
      </Mode>
    );
    const view = render(tree(true, destination));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    const previousCleanups = cleanupRef.mock.calls.length;
    view.rerender(tree(false, null));
    expect(cleanupRef).toHaveBeenCalledTimes(previousCleanups + 1);
    view.rerender(tree(false, destination));
    expect(
      screen.queryByRole("tooltip", { hidden: true }),
    ).not.toBeInTheDocument();
  },
);

it.each(["Modal", "Sheet"] as const)(
  "withholds destinations outside %s instead of creating inaccessible descriptions",
  async (kind) => {
    const outside = host();
    const Dialog = Tiraz[kind];
    render(
      <Tiraz.SystemProvider>
        <Dialog
          trigger={<button>Open</button>}
          title="Settings"
          description="Description"
          closeLabel="Close"
        >
          <button>First focus</button>
          <Tiraz.TooltipRoot>
            <Tiraz.TooltipTrigger>Help</Tiraz.TooltipTrigger>
            <Tiraz.TooltipContent portalContainer={outside}>
              Outside explanation
            </Tiraz.TooltipContent>
          </Tiraz.TooltipRoot>
        </Dialog>
      </Tiraz.SystemProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    const trigger = screen.getByRole("button", { name: "Help" });
    act(() => trigger.focus());
    expect(outside.querySelector('[role="tooltip"]')).toBeNull();
    expect(trigger).not.toHaveAttribute("aria-describedby");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
);

it("retains a containing dialog boundary through a nested theme provider", async () => {
  const outside = host();
  render(
    <Tiraz.SystemProvider>
      <Tiraz.Modal
        trigger={<button>Open</button>}
        title="Settings"
        description="Description"
        closeLabel="Close"
      >
        <button>First focus</button>
        <Tiraz.SystemProvider
          config={{ ...Tiraz.defaultConfig, theme: "dark" }}
        >
          <Tiraz.TooltipRoot>
            <Tiraz.TooltipTrigger>Help</Tiraz.TooltipTrigger>
            <Tiraz.TooltipContent portalContainer={outside}>
              Outside explanation
            </Tiraz.TooltipContent>
          </Tiraz.TooltipRoot>
        </Tiraz.SystemProvider>
      </Tiraz.Modal>
    </Tiraz.SystemProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  const trigger = screen.getByRole("button", { name: "Help" });
  act(() => trigger.focus());
  expect(outside.querySelector('[role="tooltip"]')).toBeNull();
  expect(trigger).not.toHaveAttribute("aria-describedby");
});

it.each(["Modal", "Sheet"] as const)(
  "withholds a nested provider destination outside %s",
  async (kind) => {
    const outside = host();
    const Dialog = Tiraz[kind];
    render(
      <Tiraz.SystemProvider>
        <Dialog
          trigger={<button>Open</button>}
          title="Settings"
          description="Description"
          closeLabel="Close"
        >
          <button>First focus</button>
          <Tiraz.SystemProvider portalContainer={outside}>
            <Tiraz.TooltipRoot>
              <Tiraz.TooltipTrigger>Help</Tiraz.TooltipTrigger>
              <Tiraz.TooltipContent>Outside explanation</Tiraz.TooltipContent>
            </Tiraz.TooltipRoot>
          </Tiraz.SystemProvider>
        </Dialog>
      </Tiraz.SystemProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    const trigger = screen.getByRole("button", { name: "Help" });
    act(() => trigger.focus());
    expect(outside.querySelector('[role="tooltip"]')).toBeNull();
    expect(trigger).not.toHaveAttribute("aria-describedby");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
);
