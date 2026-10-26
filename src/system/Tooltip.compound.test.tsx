import { createRef, useState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as Tiraz from "./index";

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
  // Fail explicitly at the public boundary before trying to render missing APIs.
  expect(Tiraz.TooltipRoot).toBeTypeOf("function");
  expect(Tiraz.TooltipTrigger).toBeTypeOf("function");
  expect(Tiraz.TooltipContent).toBeTypeOf("function");
});

it("opens an uncontrolled native trigger on focus and requests each change once", async () => {
  const change = vi.fn();
  const ref = createRef<HTMLButtonElement>();
  render(
    <Tiraz.SystemProvider>
      <Tiraz.TooltipRoot onOpenChange={change}>
        <Tiraz.TooltipTrigger ref={ref}>Details</Tiraz.TooltipTrigger>
        <Tiraz.TooltipContent>Short explanation</Tiraz.TooltipContent>
      </Tiraz.TooltipRoot>
    </Tiraz.SystemProvider>,
  );
  const trigger = screen.getByRole("button", { name: "Details" });
  expect(trigger).toHaveAttribute("type", "button");
  expect(ref.current).toBe(trigger);
  expect(screen.queryByRole("tooltip")).toBeNull();
  await userEvent.tab();
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveAccessibleDescription("Short explanation");
  expect(change.mock.calls).toEqual([[true]]);
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
  expect(trigger).not.toHaveAttribute("aria-describedby");
  expect(trigger).toHaveFocus();
  expect(change.mock.calls).toEqual([[true], [false]]);
});

it("uses defaultOpen only to initialize uncontrolled state", async () => {
  const change = vi.fn();
  const view = () => (
    <Tiraz.SystemProvider>
      <Tiraz.TooltipRoot defaultOpen onOpenChange={change}>
        <Tiraz.TooltipTrigger>Details</Tiraz.TooltipTrigger>
        <Tiraz.TooltipContent>Initially visible</Tiraz.TooltipContent>
      </Tiraz.TooltipRoot>
    </Tiraz.SystemProvider>
  );
  const { rerender } = render(view());
  expect(screen.getByRole("tooltip")).toHaveTextContent("Initially visible");
  expect(change).not.toHaveBeenCalled();
  await userEvent.keyboard("{Escape}");
  rerender(view());
  expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
  expect(change.mock.calls).toEqual([[false]]);
});

it("requests controlled opening without overriding a closed owner", async () => {
  const change = vi.fn();
  render(
    <Tiraz.SystemProvider>
      <Tiraz.TooltipRoot open={false} defaultOpen onOpenChange={change}>
        <Tiraz.TooltipTrigger aria-describedby="existing">
          Details
        </Tiraz.TooltipTrigger>
        <Tiraz.TooltipContent>Hidden explanation</Tiraz.TooltipContent>
      </Tiraz.TooltipRoot>
      <p id="existing">Existing help</p>
    </Tiraz.SystemProvider>,
  );
  await userEvent.tab();
  expect(change.mock.calls).toEqual([[true]]);
  expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
  expect(screen.getByRole("button")).toHaveAccessibleDescription(
    "Existing help",
  );
  const escape = new KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    cancelable: true,
  });
  screen.getByRole("button").dispatchEvent(escape);
  expect(escape.defaultPrevented).toBe(false);
  expect(change.mock.calls).toEqual([[true]]);
});

it("keeps controlled content open until the owner accepts dismissal", async () => {
  const change = vi.fn();
  const view = (open: boolean) => (
    <Tiraz.SystemProvider>
      <Tiraz.TooltipRoot open={open} onOpenChange={change}>
        <Tiraz.TooltipTrigger>Details</Tiraz.TooltipTrigger>
        <Tiraz.TooltipContent>Owner controlled</Tiraz.TooltipContent>
      </Tiraz.TooltipRoot>
    </Tiraz.SystemProvider>
  );
  const { rerender } = render(view(true));
  await userEvent.keyboard("{Escape}");
  expect(change.mock.calls).toEqual([[false]]);
  expect(screen.getByRole("tooltip")).toHaveTextContent("Owner controlled");
  rerender(view(false));
  expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
  expect(screen.getByRole("button")).not.toHaveAttribute("aria-describedby");
});

it("supports an owner accepting open and close requests", async () => {
  function Example() {
    const [open, setOpen] = useState(false);
    return (
      <Tiraz.TooltipRoot open={open} onOpenChange={setOpen}>
        <Tiraz.TooltipTrigger>Details</Tiraz.TooltipTrigger>
        <Tiraz.TooltipContent>Accepted</Tiraz.TooltipContent>
      </Tiraz.TooltipRoot>
    );
  }
  render(
    <Tiraz.SystemProvider>
      <Example />
    </Tiraz.SystemProvider>,
  );
  await userEvent.tab();
  expect(screen.getByRole("tooltip")).toHaveTextContent("Accepted");
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
});

it("composes asChild refs, handlers, names and existing descriptions", async () => {
  const childRef = createRef<HTMLButtonElement>();
  const triggerRef = createRef<HTMLButtonElement>();
  const childFocus = vi.fn(),
    triggerFocus = vi.fn();
  const childClick = vi.fn(),
    triggerClick = vi.fn();
  render(
    <Tiraz.SystemProvider>
      <p id="existing">Existing help</p>
      <Tiraz.TooltipRoot>
        <Tiraz.TooltipTrigger
          asChild
          ref={triggerRef}
          onFocus={triggerFocus}
          onClick={triggerClick}
        >
          <button
            ref={childRef}
            aria-describedby="existing"
            aria-expanded={false}
            onFocus={childFocus}
            onClick={childClick}
          >
            Details
          </button>
        </Tiraz.TooltipTrigger>
        <Tiraz.TooltipContent>Additional help</Tiraz.TooltipContent>
      </Tiraz.TooltipRoot>
    </Tiraz.SystemProvider>,
  );
  const trigger = screen.getByRole("button", { name: "Details" });
  expect(screen.getAllByRole("button")).toHaveLength(1);
  expect(childRef.current).toBe(trigger);
  expect(triggerRef.current).toBe(trigger);
  await userEvent.tab();
  expect(childFocus).toHaveBeenCalledTimes(1);
  expect(triggerFocus).toHaveBeenCalledTimes(1);
  expect(trigger).toHaveAccessibleDescription("Existing help Additional help");
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(trigger);
  expect(childClick).toHaveBeenCalledTimes(1);
  expect(triggerClick).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
  expect(trigger).toHaveAccessibleName("Details");
  expect(trigger).toHaveAccessibleDescription("Existing help");
});

it.each(["child", "trigger"] as const)(
  "honors prevented opening from the %s handler",
  async (owner) => {
    const change = vi.fn();
    const prevent = (event: { preventDefault(): void }) =>
      event.preventDefault();
    render(
      <Tiraz.SystemProvider>
        <Tiraz.TooltipRoot delayDuration={0} onOpenChange={change}>
          <Tiraz.TooltipTrigger
            asChild
            onFocus={owner === "trigger" ? prevent : undefined}
            onPointerEnter={owner === "trigger" ? prevent : undefined}
          >
            <button
              onFocus={owner === "child" ? prevent : undefined}
              onPointerEnter={owner === "child" ? prevent : undefined}
            >
              Details
            </button>
          </Tiraz.TooltipTrigger>
          <Tiraz.TooltipContent>Prevented</Tiraz.TooltipContent>
        </Tiraz.TooltipRoot>
      </Tiraz.SystemProvider>,
    );
    await userEvent.tab();
    await userEvent.hover(screen.getByRole("button"));
    expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
    expect(change).not.toHaveBeenCalled();
  },
);

it("updates localized content and removes descriptions when content is empty or unmounted", () => {
  const ref = createRef<HTMLDivElement>();
  const view = (content: string | null) => (
    <Tiraz.SystemProvider lang="ar">
      <p id="existing">Existing help</p>
      <Tiraz.TooltipRoot open>
        <Tiraz.TooltipTrigger aria-describedby="existing">
          Details
        </Tiraz.TooltipTrigger>
        {content !== null && (
          <Tiraz.TooltipContent ref={ref} className="host-tooltip">
            {content}
          </Tiraz.TooltipContent>
        )}
      </Tiraz.TooltipRoot>
    </Tiraz.SystemProvider>
  );
  const { rerender } = render(view("شرح موجز"));
  const trigger = screen.getByRole("button");
  expect(ref.current).toBe(screen.getByRole("tooltip"));
  expect(ref.current).toHaveClass("host-tooltip", "tz-tooltip");
  expect(trigger).toHaveAccessibleDescription("Existing help شرح موجز");
  rerender(view("Short explanation"));
  expect(trigger).toHaveAccessibleDescription(
    "Existing help Short explanation",
  );
  for (const text of ["", null]) {
    rerender(view(text));
    expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
    expect(trigger).toHaveAttribute("aria-describedby", "existing");
    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    trigger.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  }
  rerender(view("عاد التوضيح"));
  expect(trigger).toHaveAccessibleDescription("Existing help عاد التوضيح");
});

it("cancels a pending hover when its root unmounts", () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  try {
    // Deliberately cool the shared warm group before testing the delay.
    const change = vi.fn();
    const { unmount } = render(
      <Tiraz.SystemProvider>
        <Tiraz.TooltipRoot delayDuration={500} onOpenChange={change}>
          <Tiraz.TooltipTrigger>Details</Tiraz.TooltipTrigger>
          <Tiraz.TooltipContent>Pending</Tiraz.TooltipContent>
        </Tiraz.TooltipRoot>
      </Tiraz.SystemProvider>,
    );
    const trigger = screen.getByRole("button");
    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: "Escape" });
    change.mockClear();
    fireEvent.pointerLeave(trigger);
    fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
    expect(change).not.toHaveBeenCalled();
    expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
    unmount();
    const callsAtUnmount = change.mock.calls.length;
    act(() => vi.advanceTimersByTime(600));
    expect(change).toHaveBeenCalledTimes(callsAtUnmount);
    expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
  } finally {
    cleanup();
    vi.useRealTimers();
  }
});

afterEach(() => vi.restoreAllMocks());

it("preserves native submit/reset types and defaults to a non-submitting button", async () => {
  const submit = vi.fn();
  render(
    <Tiraz.SystemProvider>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <input aria-label="Draft" defaultValue="Original" />
        <Tiraz.TooltipRoot>
          <Tiraz.TooltipTrigger type="submit">Save</Tiraz.TooltipTrigger>
          <Tiraz.TooltipContent>Save draft</Tiraz.TooltipContent>
        </Tiraz.TooltipRoot>
        <Tiraz.TooltipRoot>
          <Tiraz.TooltipTrigger type="reset">Reset</Tiraz.TooltipTrigger>
          <Tiraz.TooltipContent>Reset draft</Tiraz.TooltipContent>
        </Tiraz.TooltipRoot>
        <Tiraz.TooltipRoot>
          <Tiraz.TooltipTrigger>Help</Tiraz.TooltipTrigger>
          <Tiraz.TooltipContent>Help text</Tiraz.TooltipContent>
        </Tiraz.TooltipRoot>
      </form>
    </Tiraz.SystemProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(submit).toHaveBeenCalledTimes(1);
  await userEvent.type(screen.getByRole("textbox"), " changed");
  await userEvent.click(screen.getByRole("button", { name: "Reset" }));
  expect(screen.getByRole("textbox")).toHaveValue("Original");
  await userEvent.click(screen.getByRole("button", { name: "Help" }));
  expect(submit).toHaveBeenCalledTimes(1);
});
