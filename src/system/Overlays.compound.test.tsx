import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRef, useState } from "react";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Tiraz from "./index";

// DOM of the convenience APIs before the compound parts existed. Radix ids are
// renumbered by first appearance so both sides compare structure, not counters.
const before: Record<string, string> = JSON.parse(
  readFileSync(resolve("src/tests/overlay-convenience-dom.json"), "utf8"),
);
function markup() {
  // Testing Library leaves an empty container behind for every root it
  // unmounts in the same test; they are harness, not component output.
  for (const child of [...document.body.children])
    if (child.localName === "div" && !child.childNodes.length) child.remove();
  const seen = new Map<string, string>();
  return document.body.innerHTML.replace(
    /\b(id|aria-controls|aria-labelledby|aria-describedby)="([^"]*)"/g,
    (_, name: string, value: string) =>
      `${name}="${value
        .split(" ")
        .map((token) => {
          if (!token.startsWith("radix-")) return token;
          if (!seen.has(token)) seen.set(token, `radix-${seen.size + 1}`);
          return seen.get(token)!;
        })
        .join(" ")}"`,
  );
}
const noop = () => {};
const directions = ["rtl", "ltr"] as const;

it("exports every compound part as a function", () => {
  for (const name of [
    "ModalRoot",
    "ModalTrigger",
    "ModalContent",
    "ModalBody",
    "ModalFooter",
    "SheetRoot",
    "SheetTrigger",
    "SheetContent",
    "SheetBody",
    "SheetFooter",
    "DropdownMenuRoot",
    "DropdownMenuTrigger",
    "DropdownMenuContent",
    "DropdownMenuItem",
    "DropdownMenuSeparator",
  ] as const)
    expect(Tiraz[name], name).toBeTypeOf("function");
});

const families = [
  {
    name: "Modal",
    Root: Tiraz.ModalRoot,
    Trigger: Tiraz.ModalTrigger,
    Content: Tiraz.ModalContent,
    Body: Tiraz.ModalBody,
    Footer: Tiraz.ModalFooter,
    Convenience: Tiraz.Modal,
  },
  {
    name: "Sheet",
    Root: Tiraz.SheetRoot,
    Trigger: Tiraz.SheetTrigger,
    Content: Tiraz.SheetContent,
    Body: Tiraz.SheetBody,
    Footer: Tiraz.SheetFooter,
    Convenience: Tiraz.Sheet,
  },
] as const;
type Family = (typeof families)[number];
interface RootOptions {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}
function dialog(F: Family, root: RootOptions = {}, trigger?: ReactNode) {
  return (
    <Tiraz.SystemProvider>
      <F.Root {...root}>
        {trigger ?? <F.Trigger>Open</F.Trigger>}
        <F.Content
          title="Edit customer"
          description="Change the customer name"
          closeLabel="Close"
        >
          <F.Body>
            <label>
              Name
              <input />
            </label>
          </F.Body>
          <F.Footer>
            <button>Save</button>
          </F.Footer>
        </F.Content>
      </F.Root>
    </Tiraz.SystemProvider>
  );
}

describe.each(families)("compound $name", (F) => {
  const body = `${F.name === "Modal" ? "tz-modal" : "tz-sheet"}-body`;
  const footer = `${F.name === "Modal" ? "tz-modal" : "tz-sheet"}-footer`;

  it("opens and closes uncontrolled, names and describes the dialog and requests each change once", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      dialog(
        F,
        { onOpenChange: change },
        <F.Trigger ref={ref}>Open</F.Trigger>,
      ),
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(trigger).toHaveAttribute("type", "button");
    expect(ref.current).toBe(trigger);
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(trigger);
    const open = await screen.findByRole("dialog", { name: "Edit customer" });
    expect(open).toHaveAccessibleDescription("Change the customer name");
    expect(open.querySelector(`.${body} input`)).toBeInTheDocument();
    expect(open.querySelector(`.${footer} button`)).toHaveTextContent("Save");
    expect(change.mock.calls).toEqual([[true]]);
    await user.click(within(open).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(change.mock.calls).toEqual([[true], [false]]);
    expect(trigger).toHaveFocus();
  });

  it("moves focus in and returns it to the trigger when Escape closes", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(dialog(F, { onOpenChange: change }));
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    const open = await screen.findByRole("dialog");
    expect(open).toContainElement(document.activeElement as HTMLElement);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveFocus();
    expect(change.mock.calls).toEqual([[true], [false]]);
  });

  it("uses defaultOpen only to start uncontrolled state", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(dialog(F, { defaultOpen: true, onOpenChange: change }));
    expect(
      await screen.findByRole("dialog", { name: "Edit customer" }),
    ).toBeInTheDocument();
    expect(change).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(change.mock.calls).toEqual([[false]]);
  });

  it("lets an owner accept open and close requests, once each", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    function Owner() {
      const [open, setOpen] = useState(false);
      return dialog(F, {
        open,
        onOpenChange: (next) => {
          change(next);
          setOpen(next);
        },
      });
    }
    render(<Owner />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    await screen.findByRole("dialog");
    expect(change.mock.calls).toEqual([[true]]);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(change.mock.calls).toEqual([[true], [false]]);
    expect(screen.getByRole("button", { name: "Open" })).toHaveFocus();
  });

  it("does not override an owner that keeps the dialog closed or open", async () => {
    const user = userEvent.setup();
    const closed = vi.fn();
    const view = render(
      dialog(F, { open: false, defaultOpen: true, onOpenChange: closed }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(closed.mock.calls).toEqual([[true]]);
    expect(screen.queryByRole("dialog")).toBeNull();
    view.unmount();
    const opened = vi.fn();
    render(dialog(F, { open: true, onOpenChange: opened }));
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    expect(opened.mock.calls).toEqual([[false]]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("composes an asChild trigger with its own ref, name, handlers and button count", async () => {
    const user = userEvent.setup();
    const childRef = createRef<HTMLButtonElement>();
    const triggerRef = createRef<HTMLButtonElement>();
    const childClick = vi.fn();
    const triggerClick = vi.fn();
    render(
      dialog(
        F,
        {},
        <F.Trigger asChild ref={triggerRef} onClick={triggerClick}>
          <button ref={childRef} data-testid="child" onClick={childClick}>
            Open details
          </button>
        </F.Trigger>,
      ),
    );
    const trigger = screen.getByRole("button", { name: "Open details" });
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(childRef.current).toBe(trigger);
    expect(triggerRef.current).toBe(trigger);
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(childClick).toHaveBeenCalledTimes(1);
    expect(triggerClick).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("keeps an explicit native trigger type", () => {
    render(
      dialog(
        F,
        {},
        <F.Trigger type="submit" aria-label="Submit and open">
          Open
        </F.Trigger>,
      ),
    );
    const trigger = screen.getByRole("button", { name: "Submit and open" });
    expect(trigger).toHaveAttribute("type", "submit");
  });

  it("scopes nested compound menus inside the dialog", async () => {
    const user = userEvent.setup();
    render(
      <Tiraz.SystemProvider>
        <F.Root defaultOpen>
          <F.Trigger>Open</F.Trigger>
          <F.Content
            title="Edit customer"
            description="Change the customer name"
            closeLabel="Close"
          >
            <F.Body>
              <Tiraz.DropdownMenuRoot>
                <Tiraz.DropdownMenuTrigger>Actions</Tiraz.DropdownMenuTrigger>
                <Tiraz.DropdownMenuContent>
                  <Tiraz.DropdownMenuItem>Duplicate</Tiraz.DropdownMenuItem>
                </Tiraz.DropdownMenuContent>
              </Tiraz.DropdownMenuRoot>
            </F.Body>
          </F.Content>
        </F.Root>
      </Tiraz.SystemProvider>,
    );
    await user.click(await screen.findByRole("button", { name: "Actions" }));
    const menu = await screen.findByRole("menu");
    expect(menu.closest('[role="dialog"]')).not.toBeNull();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  describe.each(directions)("convenience markup in %s", (direction) => {
    it.each([true, false])(
      "is unchanged and identical through compound parts (footer %s)",
      (withFooter) => {
        const lower = F.name.toLowerCase();
        const config = { ...Tiraz.defaultConfig, direction };
        const key = `${lower}-${direction}-${withFooter ? "footer" : "plain"}`;
        const convenience = render(
          <Tiraz.SystemProvider config={config}>
            <F.Convenience
              trigger={<button>Open {lower}</button>}
              title="Edit customer"
              description="Change the name"
              closeLabel={`Close ${lower}`}
              footer={withFooter ? <button>Done</button> : undefined}
              open
              onOpenChange={noop}
            >
              <p>Body text</p>
            </F.Convenience>
          </Tiraz.SystemProvider>,
        );
        const wrapped = markup();
        convenience.unmount();
        render(
          <Tiraz.SystemProvider config={config}>
            <F.Root open onOpenChange={noop}>
              <F.Trigger asChild>
                <button>Open {lower}</button>
              </F.Trigger>
              <F.Content
                title="Edit customer"
                description="Change the name"
                closeLabel={`Close ${lower}`}
              >
                <F.Body>
                  <p>Body text</p>
                </F.Body>
                {withFooter && (
                  <F.Footer>
                    <button>Done</button>
                  </F.Footer>
                )}
              </F.Content>
            </F.Root>
          </Tiraz.SystemProvider>,
        );
        expect(markup()).toBe(wrapped);
        expect(wrapped).toBe(before[key]);
      },
    );
  });
});

describe("compound Modal", () => {
  it("focuses initialFocusRef instead of the first control", async () => {
    const user = userEvent.setup();
    const target = createRef<HTMLInputElement>();
    render(
      <Tiraz.SystemProvider>
        <Tiraz.ModalRoot>
          <Tiraz.ModalTrigger>Open</Tiraz.ModalTrigger>
          <Tiraz.ModalContent
            title="Edit customer"
            description="Change the customer name"
            closeLabel="Close"
            initialFocusRef={target}
          >
            <Tiraz.ModalBody>
              <input aria-label="First" />
              <input aria-label="Second" ref={target} />
            </Tiraz.ModalBody>
          </Tiraz.ModalContent>
        </Tiraz.ModalRoot>
      </Tiraz.SystemProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    await screen.findByRole("dialog");
    expect(screen.getByRole("textbox", { name: "Second" })).toHaveFocus();
  });
});

describe("compound Sheet", () => {
  it.each(directions)(
    "places an explicit side and the default in %s through data attributes",
    (direction) => {
      for (const side of ["left", "right", undefined] as const) {
        const config = { ...Tiraz.defaultConfig, direction };
        const view = render(
          <Tiraz.SystemProvider config={config}>
            <Tiraz.SheetRoot open onOpenChange={noop}>
              <Tiraz.SheetTrigger asChild>
                <button>Open sheet</button>
              </Tiraz.SheetTrigger>
              <Tiraz.SheetContent
                title="Edit customer"
                description="Change the name"
                closeLabel="Close sheet"
                side={side}
              >
                <Tiraz.SheetBody>
                  <p>Body text</p>
                </Tiraz.SheetBody>
              </Tiraz.SheetContent>
            </Tiraz.SheetRoot>
          </Tiraz.SystemProvider>,
        );
        const resolved = side ?? (direction === "rtl" ? "right" : "left");
        const content = screen.getByRole("dialog");
        expect(content).toHaveAttribute("data-side", resolved);
        expect(content).toHaveAttribute(
          "data-edge",
          (resolved === "right") === (direction === "rtl") ? "start" : "end",
        );
        expect(markup()).toBe(before[`sheet-${direction}-${resolved}`]);
        view.unmount();
      }
    },
  );
});

const menuOptions = {
  edit: vi.fn(),
  copy: vi.fn(),
  remove: vi.fn(),
};
function menu(root: RootOptions = {}, boundary?: HTMLElement) {
  return (
    <Tiraz.SystemProvider>
      <Tiraz.DropdownMenuRoot {...root}>
        <Tiraz.DropdownMenuTrigger>Actions</Tiraz.DropdownMenuTrigger>
        <Tiraz.DropdownMenuContent collisionBoundary={boundary}>
          <Tiraz.DropdownMenuItem
            onSelect={menuOptions.edit}
            shortcut="⌘E"
            icon={<i>E</i>}
          >
            Edit
          </Tiraz.DropdownMenuItem>
          <Tiraz.DropdownMenuItem onSelect={menuOptions.copy} disabled>
            Copy
          </Tiraz.DropdownMenuItem>
          <Tiraz.DropdownMenuSeparator />
          <Tiraz.DropdownMenuItem onSelect={menuOptions.remove} destructive>
            Delete
          </Tiraz.DropdownMenuItem>
        </Tiraz.DropdownMenuContent>
      </Tiraz.DropdownMenuRoot>
    </Tiraz.SystemProvider>
  );
}

describe("compound DropdownMenu", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens from the keyboard, moves between enabled items, selects once and restores focus", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <Tiraz.SystemProvider>
        <Tiraz.DropdownMenuRoot onOpenChange={change}>
          <Tiraz.DropdownMenuTrigger ref={ref}>
            Actions
          </Tiraz.DropdownMenuTrigger>
          <Tiraz.DropdownMenuContent>
            <Tiraz.DropdownMenuItem onSelect={menuOptions.edit}>
              Edit
            </Tiraz.DropdownMenuItem>
            <Tiraz.DropdownMenuItem disabled onSelect={menuOptions.copy}>
              Copy
            </Tiraz.DropdownMenuItem>
            <Tiraz.DropdownMenuItem onSelect={menuOptions.remove}>
              Delete
            </Tiraz.DropdownMenuItem>
          </Tiraz.DropdownMenuContent>
        </Tiraz.DropdownMenuRoot>
      </Tiraz.SystemProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).toHaveAttribute("type", "button");
    expect(ref.current).toBe(trigger);
    trigger.focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("menu");
    expect(change.mock.calls).toEqual([[true]]);
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus(),
    );
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(menuOptions.remove).toHaveBeenCalledTimes(1);
    expect(menuOptions.edit).not.toHaveBeenCalled();
    expect(menuOptions.copy).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(change.mock.calls).toEqual([[true], [false]]);
    expect(trigger).toHaveFocus();
  });

  it("returns focus to the trigger when Escape closes, once", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(menu({ onOpenChange: change }));
    const trigger = screen.getByRole("button", { name: "Actions" });
    await user.click(trigger);
    await screen.findByRole("menu");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(trigger).toHaveFocus();
    expect(change.mock.calls).toEqual([[true], [false]]);
  });

  it("closes on Tab with one request and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(menu({ onOpenChange: change }));
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await screen.findByRole("menu");
    await user.keyboard("{Tab}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(change.mock.calls).toEqual([[true], [false]]);
    expect(screen.getByRole("button", { name: "Actions" })).toHaveFocus();
  });

  it("uses defaultOpen to start uncontrolled state and honors an owner's choice", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const started = render(menu({ defaultOpen: true, onOpenChange: change }));
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(change).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(change.mock.calls).toEqual([[false]]);
    started.unmount();
    const owner = vi.fn();
    render(menu({ open: false, onOpenChange: owner }));
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(owner.mock.calls).toEqual([[true]]);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("lets an owner accept open and close requests", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    function Owner() {
      const [open, setOpen] = useState(false);
      return menu({
        open,
        onOpenChange: (next) => {
          change(next);
          setOpen(next);
        },
      });
    }
    render(<Owner />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await screen.findByRole("menu");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(change.mock.calls).toEqual([[true], [false]]);
  });

  it("composes an asChild trigger with its own ref, name and handlers", async () => {
    const user = userEvent.setup();
    const childRef = createRef<HTMLButtonElement>();
    const triggerRef = createRef<HTMLButtonElement>();
    const childClick = vi.fn();
    const triggerClick = vi.fn();
    render(
      <Tiraz.SystemProvider>
        <Tiraz.DropdownMenuRoot>
          <Tiraz.DropdownMenuTrigger
            asChild
            ref={triggerRef}
            onClick={triggerClick}
          >
            <button ref={childRef} onClick={childClick}>
              More actions
            </button>
          </Tiraz.DropdownMenuTrigger>
          <Tiraz.DropdownMenuContent>
            <Tiraz.DropdownMenuItem>Edit</Tiraz.DropdownMenuItem>
          </Tiraz.DropdownMenuContent>
        </Tiraz.DropdownMenuRoot>
      </Tiraz.SystemProvider>,
    );
    const trigger = screen.getByRole("button", { name: "More actions" });
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(childRef.current).toBe(trigger);
    expect(triggerRef.current).toBe(trigger);
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await user.click(trigger);
    expect(childClick).toHaveBeenCalledTimes(1);
    expect(triggerClick).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("menu")).toBeInTheDocument();
  });

  it("renders item icon, shortcut, destructive and disabled state and the separator", async () => {
    render(menu({ defaultOpen: true }));
    const edit = await screen.findByRole("menuitem", { name: /Edit/ });
    expect(edit).toHaveClass("tz-menu-item");
    expect(edit.querySelector('span[aria-hidden="true"]')).toHaveTextContent(
      "E",
    );
    const shortcut = edit.querySelector("kbd.tz-kbd");
    expect(shortcut).toHaveTextContent("⌘E");
    expect(shortcut).toHaveAttribute("dir", "ltr");
    expect(screen.getByRole("menuitem", { name: "Copy" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveAttribute(
      "data-destructive",
      "true",
    );
    expect(screen.getByRole("separator")).toHaveClass("tz-menu-separator");
  });

  it("keeps keyboard focus when a stationary pointer leaves an unfocused item", async () => {
    const user = userEvent.setup();
    render(menu({ defaultOpen: true }));
    const edit = await screen.findByRole("menuitem", { name: /Edit/ });
    const remove = screen.getByRole("menuitem", { name: "Delete" });
    await user.hover(remove);
    expect(remove).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(edit).toHaveFocus();
    await user.unhover(remove);
    expect(edit).toHaveFocus();
  });

  it("scopes its content to the provider and marks only a nonempty boundary", async () => {
    const boundary = document.createElement("div");
    document.body.append(boundary);
    const first = render(menu({ defaultOpen: true }, boundary));
    expect(await screen.findByRole("menu")).toHaveAttribute(
      "data-bounded",
      "true",
    );
    first.unmount();
    render(menu({ defaultOpen: true }));
    expect(await screen.findByRole("menu")).not.toHaveAttribute("data-bounded");
    boundary.remove();
  });

  it("renders the convenience markup unchanged and identical through compound parts", () => {
    for (const direction of directions)
      for (const align of ["start", "end"] as const) {
        const config = { ...Tiraz.defaultConfig, direction };
        const key = `dropdown-${direction}-${align}`;
        const convenience = render(
          <Tiraz.SystemProvider config={config}>
            <Tiraz.DropdownMenu
              trigger={<button>Actions</button>}
              align={align}
              open
              onOpenChange={noop}
              items={[
                { id: "edit", label: "Edit", icon: <i>E</i>, shortcut: "⌘E" },
                { id: "copy", label: "Copy", disabled: true },
                {
                  id: "delete",
                  label: "Delete",
                  destructive: true,
                  separatorBefore: true,
                },
              ]}
            />
          </Tiraz.SystemProvider>,
        );
        const wrapped = markup();
        convenience.unmount();
        // The convenience API wraps each item (and its leading separator) in
        // a plain div; the parts themselves add no wrapper.
        const compound = render(
          <Tiraz.SystemProvider config={config}>
            <Tiraz.DropdownMenuRoot open onOpenChange={noop}>
              <Tiraz.DropdownMenuTrigger asChild>
                <button>Actions</button>
              </Tiraz.DropdownMenuTrigger>
              <Tiraz.DropdownMenuContent align={align}>
                <div>
                  <Tiraz.DropdownMenuItem icon={<i>E</i>} shortcut="⌘E">
                    Edit
                  </Tiraz.DropdownMenuItem>
                </div>
                <div>
                  <Tiraz.DropdownMenuItem disabled>Copy</Tiraz.DropdownMenuItem>
                </div>
                <div>
                  <Tiraz.DropdownMenuSeparator />
                  <Tiraz.DropdownMenuItem destructive>
                    Delete
                  </Tiraz.DropdownMenuItem>
                </div>
              </Tiraz.DropdownMenuContent>
            </Tiraz.DropdownMenuRoot>
          </Tiraz.SystemProvider>,
        );
        expect(markup()).toBe(wrapped);
        expect(wrapped).toBe(before[key]);
        compound.unmount();
      }
  });

  it("keeps the convenience open handling: local state, owner control and Tab", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const items = [{ id: "edit", label: "Edit" }];
    const view = render(
      <Tiraz.SystemProvider>
        <Tiraz.DropdownMenu
          trigger={<button>Actions</button>}
          items={items}
          onOpenChange={change}
        />
      </Tiraz.SystemProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await screen.findByRole("menu");
    await user.keyboard("{Tab}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(change.mock.calls).toEqual([[true], [false]]);
    view.unmount();
    const owner = vi.fn();
    render(
      <Tiraz.SystemProvider>
        <Tiraz.DropdownMenu
          trigger={<button>Actions</button>}
          items={items}
          open={false}
          onOpenChange={owner}
        />
      </Tiraz.SystemProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(owner.mock.calls).toEqual([[true]]);
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

describe("bounded popups", () => {
  const options = [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Beta" },
  ];
  const rect = (left: number, top: number, width: number, height: number) => ({
    x: left,
    y: top,
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    toJSON: () => ({}),
  });
  let boundary: HTMLDivElement;
  beforeEach(() => {
    boundary = document.createElement("div");
    document.body.append(boundary);
    // Popper hides and measures from geometry that jsdom does not have: a
    // 1024px viewport, a trigger at 400-500px and a boundary 140px wide.
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(
      function (this: HTMLElement) {
        return this === boundary ? 140 : 1024;
      },
    );
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(
      function (this: HTMLElement) {
        return this === boundary ? 400 : 768;
      },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        return this === boundary
          ? rect(380, 100, 140, 400)
          : rect(400, 200, 100, 40);
      },
    );
  });
  afterEach(() => {
    boundary.remove();
    vi.restoreAllMocks();
  });
  // The width Popper offers a popup, as the CSS reads it from its wrapper.
  async function available(popup: HTMLElement) {
    const wrapper = popup.closest<HTMLElement>(
      "[data-radix-popper-content-wrapper]",
    )!;
    const read = () =>
      parseFloat(
        wrapper.style.getPropertyValue("--radix-popper-available-width"),
      );
    await waitFor(() => expect(read()).not.toBeNaN());
    return read();
  }

  async function openSelect(boundary?: Tiraz.SelectProps["collisionBoundary"]) {
    const user = userEvent.setup();
    render(
      <Tiraz.SystemProvider>
        <Tiraz.Select
          aria-label="Plan"
          options={options}
          collisionBoundary={boundary}
        />
      </Tiraz.SystemProvider>,
    );
    await user.click(screen.getByRole("combobox", { name: "Plan" }));
    return screen.findByRole("listbox");
  }

  it("marks a Select popup that has a boundary and bounds its width by it", async () => {
    const popup = await openSelect(boundary);
    expect(popup).toHaveClass("tz-select-popup");
    expect(popup).toHaveAttribute("data-bounded", "true");
    expect(await available(popup)).toBeLessThanOrEqual(140);
  });

  it.each([
    ["omitted", undefined],
    ["empty list", []],
    ["null entries", [null]],
    ["null", null],
  ] as const)(
    "leaves a Select popup unmarked and unbounded for %s",
    async (_, value) => {
      const popup = await openSelect(
        value as Tiraz.SelectProps["collisionBoundary"],
      );
      expect(popup).not.toHaveAttribute("data-bounded");
      expect(await available(popup)).toBeGreaterThan(500);
    },
  );

  it("keeps the boundary off the Select trigger", async () => {
    await openSelect([boundary]);
    // An open Select hides its trigger from the accessibility tree.
    expect(screen.getByRole("combobox", { hidden: true })).not.toHaveAttribute(
      "collisionboundary",
    );
  });

  async function openDate(
    collisionBoundary?: Tiraz.DatePickerProps["collisionBoundary"],
  ) {
    const user = userEvent.setup();
    render(
      <Tiraz.SystemProvider
        config={{ ...Tiraz.defaultConfig, direction: "ltr" }}
      >
        <Tiraz.DatePicker
          label="Date"
          defaultValue="2024-02-28"
          collisionBoundary={collisionBoundary}
        />
      </Tiraz.SystemProvider>,
    );
    await user.click(screen.getByRole("button", { name: /^Date/ }));
    const popup = document.querySelector<HTMLElement>(".tz-datepicker-popup")!;
    async function openYears() {
      // With a boundary, Popper hides the calendar from jsdom's fake geometry,
      // so open the year menu from the keyboard and query hidden roles.
      popup.querySelector<HTMLElement>(".tz-date-year-trigger")!.focus();
      await user.keyboard("{Enter}");
      return screen.findByRole("listbox", { hidden: true });
    }
    return { popup, openYears };
  }

  it("marks the DatePicker popup and its year menu that have a boundary and bounds both widths", async () => {
    const { popup, openYears } = await openDate([boundary]);
    expect(popup).toHaveAttribute("data-bounded", "true");
    expect(await available(popup)).toBeLessThanOrEqual(140);
    const years = await openYears();
    expect(years).toHaveClass("tz-date-years-popup");
    expect(years).toHaveAttribute("data-bounded", "true");
    expect(await available(years)).toBeLessThanOrEqual(140);
  });

  it.each([
    ["omitted", undefined],
    ["empty list", []],
    ["null", null],
  ] as const)(
    "leaves the DatePicker popup and year menu unmarked and unbounded for %s",
    async (_, value) => {
      const { popup, openYears } = await openDate(
        value as Tiraz.DatePickerProps["collisionBoundary"],
      );
      expect(popup).not.toHaveAttribute("data-bounded");
      expect(await available(popup)).toBeGreaterThan(500);
      const years = await openYears();
      expect(years).not.toHaveAttribute("data-bounded");
      expect(await available(years)).toBeGreaterThan(500);
    },
  );

  it("bounds a DropdownMenu content by its boundary", async () => {
    render(menu({ defaultOpen: true }, boundary));
    expect(
      await available(await screen.findByRole("menu")),
    ).toBeLessThanOrEqual(140);
  });
});
