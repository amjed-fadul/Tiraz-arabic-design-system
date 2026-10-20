import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import * as system from "./index";
import { useState } from "react";

const { SystemProvider, defaultConfig } = system;
const wrap = (children: React.ReactNode) => (
  <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
    {children}
  </SystemProvider>
);

it("exposes the three application-owned context controls", () => {
  for (const name of ["SelectionActions", "ContextMeter", "ModelSelector"])
    expect(system, `${name} is a public component`).toHaveProperty(name);
});

it.each([
  [0, 100, "0 of 100 tokens", "0%"],
  [120, 100, "120 of 100 tokens", "120%"],
  [0, 0, "0 of 0 tokens", "Capacity is zero"],
  [undefined, 100, "Usage unavailable", ""],
  [NaN, 100, "Usage unavailable", ""],
  [-1, 100, "Usage unavailable", ""],
  [50, Infinity, "Capacity unavailable", ""],
] as const)(
  "reports supplied context %s / %s honestly",
  async (used, capacity, name, detail) => {
    const user = userEvent.setup();
    render(wrap(<system.ContextMeter used={used} capacity={capacity} />));
    const trigger = screen.getByRole("button", { name: new RegExp(name) });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toHaveTextContent(name);
    if (detail) expect(screen.getByRole("dialog")).toHaveTextContent(detail);
    if (used === 120)
      expect(screen.getByRole("dialog")).toHaveTextContent("Over capacity");
  },
);

it.each([
  [85, "high", "Filling up"],
  [97, "near", "Near capacity"],
  [120, "over", "Over capacity"],
] as const)(
  "gives the status text at %s of 100 the %s tone, in the trigger and the details",
  async (used, tone, status) => {
    const user = userEvent.setup();
    render(wrap(<system.ContextMeter used={used} capacity={100} />));
    const trigger = screen.getByRole("button", { name: new RegExp(status) });
    expect(within(trigger).getByText(status)).toHaveAttribute(
      "data-tone",
      tone,
    );
    await user.click(trigger);
    expect(
      within(screen.getByRole("dialog")).getByText(status),
    ).toHaveAttribute("data-tone", tone);
  },
);

it("identifies estimated context in the trigger and accessible details", async () => {
  render(
    wrap(
      <system.ContextMeter
        used={1234}
        capacity={10000}
        estimated
        details={[{ id: "messages", label: "Messages", value: 1000 }]}
      />,
    ),
  );
  await userEvent.click(
    screen.getByRole("button", { name: /Estimated.*1,234 of 10,000 tokens/ }),
  );
  expect(screen.getByRole("dialog")).toHaveTextContent("Estimated");
  expect(screen.getByRole("dialog")).toHaveTextContent("Messages");
});

it("retains controlled model IDs and skips unavailable choices", async () => {
  const user = userEvent.setup(),
    changed = vi.fn();
  function Example() {
    const [value, setValue] = useState("a");
    return (
      <system.ModelSelector
        label="Model"
        value={value}
        onValueChange={(id) => {
          changed(id);
          setValue(id);
        }}
        models={[
          {
            id: "a",
            name: "Draft",
            provider: "Studio",
            description: "Short replies",
          },
          {
            id: "b",
            name: "Offline",
            provider: "Studio",
            disabled: true,
            description: "Unavailable here",
          },
          {
            id: "c",
            name: "Review",
            provider: "Studio",
            description: "Long review",
          },
        ]}
      />
    );
  }
  render(wrap(<Example />));
  const trigger = screen.getByRole("combobox", { name: "Model" });
  await user.click(trigger);
  expect(screen.getByRole("option", { name: /Offline/ })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  expect(
    screen.getByRole("option", { name: "Review" }),
  ).toHaveAccessibleDescription("Long review");
  await user.keyboard("{End}{Enter}");
  expect(changed).toHaveBeenLastCalledWith("c");
  expect(trigger).toHaveTextContent("Review");
  await user.click(trigger);
  expect(screen.getByRole("option", { name: /Review/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await user.keyboard("{Escape}");
  expect(trigger).toHaveFocus();
});

it("only offers actions for scoped non-editable non-code text and retains the selection payload", async () => {
  // jsdom has no range geometry; positioning alone is stubbed, native Range ownership stays real.
  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => new DOMRect(20, 20, 100, 20),
  });
  const action = vi.fn();
  const view = render(
    wrap(
      <>
        <p data-testid="outside">Outside text</p>
        <system.SelectionActions
          label="Reply"
          actions={[{ id: "use", label: "Use selection", onSelect: action }]}
        >
          <p data-testid="inside">مرحبا Tiraz sample</p>
          <code data-testid="code">code sample</code>
          <div data-testid="custom" role="button" tabIndex={0}>
            Custom control
          </div>
          <span data-testid="custom-link" role="link" tabIndex={0}>
            Custom link
          </span>
          <textarea defaultValue="Draft" />
        </system.SelectionActions>
      </>,
    ),
  );
  function select(id: string) {
    const node = screen.getByTestId(id).firstChild!;
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    fireEvent(document, new Event("selectionchange"));
  }
  act(() => select("outside"));
  expect(screen.queryByRole("toolbar")).toBeNull();
  act(() => select("code"));
  expect(screen.queryByRole("toolbar")).toBeNull();
  act(() => select("custom-link"));
  expect(screen.queryByRole("toolbar")).toBeNull();
  act(() => select("custom"));
  expect(screen.queryByRole("toolbar")).toBeNull();
  act(() => select("inside"));
  expect(
    await screen.findByRole("toolbar", { hidden: true }),
  ).toBeInTheDocument();
  const button = screen.getByText("Use selection").closest("button")!;
  fireEvent.pointerDown(button);
  fireEvent.click(button);
  expect(action).toHaveBeenCalledWith("مرحبا Tiraz sample");
  expect(window.getSelection()?.toString()).toBe("مرحبا Tiraz sample");
  fireEvent.scroll(window);
  expect(screen.queryByRole("toolbar")).toBeNull();
  act(() => select("inside"));
  fireEvent.keyDown(screen.getByRole("region", { name: "Reply" }), {
    key: "Enter",
    altKey: true,
  });
  expect(screen.getByText("Use selection").closest("button")!).toHaveFocus();
  fireEvent.keyDown(screen.getByRole("toolbar", { hidden: true }), {
    key: "Escape",
  });
  expect(screen.getByRole("region", { name: "Reply" })).toHaveFocus();
  act(() => select("inside"));
  fireEvent.keyDown(screen.getByRole("region", { name: "Reply" }), {
    key: "Enter",
    altKey: true,
  });
  act(() => {
    window.getSelection()!.removeAllRanges();
    fireEvent(document, new Event("selectionchange"));
  });
  expect(screen.queryByRole("toolbar", { hidden: true })).toBeNull();
  view.unmount();
  vi.restoreAllMocks();
});

it("does not replace the controlled model or emit changes when choices are reordered or removed", async () => {
  const changed = vi.fn(),
    user = userEvent.setup();
  const a = { id: "a", name: "Draft", provider: "Studio" },
    b = { id: "b", name: "Review", provider: "Studio" };
  const view = render(
    wrap(
      <system.ModelSelector
        models={[a, b]}
        value="a"
        onValueChange={changed}
      />,
    ),
  );
  await user.click(screen.getByRole("combobox", { name: "Model" }));
  await user.click(screen.getByRole("option", { name: "Review" }));
  expect(changed).toHaveBeenCalledExactlyOnceWith("b");
  expect(screen.getByRole("combobox", { name: "Model" })).toHaveTextContent(
    "Draft",
  );
  view.rerender(
    wrap(
      <system.ModelSelector
        models={[b, { ...a, disabled: true }]}
        value="a"
        onValueChange={changed}
      />,
    ),
  );
  expect(screen.getByRole("combobox", { name: "Model" })).toHaveTextContent(
    "Draft",
  );
  view.rerender(
    wrap(
      <system.ModelSelector models={[b]} value="a" onValueChange={changed} />,
    ),
  );
  expect(screen.getByRole("combobox", { name: "Model" })).toHaveTextContent(
    "Choose model",
  );
  expect(changed).toHaveBeenCalledTimes(1);
  view.rerender(
    wrap(
      <system.ModelSelector models={[]} value="a" onValueChange={changed} />,
    ),
  );
  expect(screen.getByRole("combobox", { name: "Model" })).toBeDisabled();
});
