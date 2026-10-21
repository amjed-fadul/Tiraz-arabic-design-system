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
  expect(action).toHaveBeenCalledWith("مرحبا Tiraz sample", {
    start: 0,
    end: 18,
  });
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

it("passes start and end offsets within the scope", async () => {
  const action = vi.fn();
  render(
    wrap(
      <system.SelectionActions
        label="Reply"
        actions={[{ id: "use", label: "Use selection", onSelect: action }]}
      >
        <p data-testid="sample">
          أول <strong>ثاني</strong> ثالث
        </p>
      </system.SelectionActions>,
    ),
  );
  const sample = screen.getByTestId("sample");
  // From the start of «ثاني» to three characters into « ثالث».
  act(() => {
    window
      .getSelection()!
      .setBaseAndExtent(
        sample.querySelector("strong")!.firstChild!,
        0,
        sample.lastChild!,
        3,
      );
    fireEvent(document, new Event("selectionchange"));
  });
  const button = (await screen.findByText("Use selection")).closest("button")!;
  fireEvent.pointerDown(button);
  fireEvent.click(button);
  expect(action).toHaveBeenCalledWith("ثاني ثا", { start: 4, end: 11 });
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

it("names unavailable models through labels", async () => {
  const user = userEvent.setup();
  const models = [
    { id: "a", name: "Draft" },
    { id: "b", name: "Offline", disabled: true },
  ];
  const view = render(
    wrap(
      <system.ModelSelector
        models={models}
        value="a"
        onValueChange={() => {}}
      />,
    ),
  );
  await user.click(screen.getByRole("combobox", { name: "Model" }));
  expect(screen.getByRole("option", { name: /Offline/ })).toHaveTextContent(
    "Unavailable",
  );
  await user.keyboard("{Escape}");
  view.rerender(
    wrap(
      <system.ModelSelector
        models={models}
        value="a"
        onValueChange={() => {}}
        labels={{ unavailable: "غير متوفر" }}
      />,
    ),
  );
  await user.click(screen.getByRole("combobox", { name: "Model" }));
  const offline = screen.getByRole("option", { name: /Offline/ });
  expect(offline).toHaveTextContent("غير متوفر");
  expect(offline).toHaveAccessibleDescription("غير متوفر");
  expect(offline).not.toHaveTextContent("Unavailable");
});

it("moves the context status at the host's thresholds and honors controlled open", async () => {
  const user = userEvent.setup(),
    onOpenChange = vi.fn();
  const meter = (props: Partial<system.ContextMeterProps>) =>
    wrap(<system.ContextMeter used={60} capacity={100} {...props} />);
  const view = render(meter({ thresholds: { high: 0.5, near: 0.9 } }));
  const trigger = () => screen.getByRole("button");
  expect(trigger()).toHaveAttribute("data-tone", "high");
  expect(within(trigger()).getByText("Filling up")).toBeVisible();
  view.rerender(meter({ used: 92, thresholds: { high: 0.5, near: 0.9 } }));
  expect(trigger()).toHaveAttribute("data-tone", "near");
  expect(within(trigger()).getByText("Near capacity")).toBeVisible();
  // One threshold set leaves the other at its default.
  view.rerender(meter({ used: 85, thresholds: { near: 0.9 } }));
  expect(trigger()).toHaveAttribute("data-tone", "high");
  // The defaults hold without thresholds, and over capacity stays above 1.
  view.rerender(meter({}));
  expect(trigger()).toHaveAttribute("data-tone", "normal");
  view.rerender(meter({ used: 120, thresholds: { high: 2, near: 3 } }));
  expect(trigger()).toHaveAttribute("data-tone", "over");
  // A controlled meter shows what the host says; Escape asks to close it.
  view.rerender(meter({ open: true, onOpenChange }));
  expect(screen.getByRole("dialog")).toBeVisible();
  await user.keyboard("{Escape}");
  expect(onOpenChange).toHaveBeenLastCalledWith(false);
  expect(screen.getByRole("dialog")).toBeVisible();
  view.rerender(meter({ open: false, onOpenChange }));
  expect(screen.queryByRole("dialog")).toBeNull();
  await user.click(trigger());
  expect(onOpenChange).toHaveBeenLastCalledWith(true);
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("shows shares and an action in the detail view and announces each crossing once", async () => {
  const user = userEvent.setup(),
    onSelect = vi.fn();
  const parts = [
    { id: "conversation", label: "المحادثة", value: 20_480 },
    { id: "records", label: "السجلات المرفقة", value: 12_800 },
    { id: "memory", label: "الذاكرة", value: 5_120 },
    { id: "instructions", label: "التعليمات", value: 2_600 },
  ];
  // Arabic, right to left, in the reader's digits.
  const meter = (
    used: number,
    props: Partial<system.ContextMeterProps> = {},
  ) => (
    <SystemProvider config={defaultConfig}>
      <system.ContextMeter
        inline
        used={used}
        capacity={128_000}
        details={parts}
        action={{ label: "لخّص المحادثة", onSelect }}
        {...props}
      />
    </SystemProvider>
  );
  const view = render(meter(41_000));
  const group = screen.getByRole("group", { name: "السياق" });
  expect(
    within(group)
      .getAllByText(/^[٠-٩]+٪$/)
      .map((share) => share.textContent),
  ).toEqual(["١٦٪", "١٠٪", "٤٪", "٢٪"]);
  // While there is room: no action, and nothing said.
  expect(screen.queryByRole("button", { name: "لخّص المحادثة" })).toBeNull();
  const region = screen.getByRole("status");
  expect(region).toBeEmptyDOMElement();
  view.rerender(meter(105_000));
  expect(region.textContent).toBe("السياق: يقترب من الامتلاء");
  await user.click(screen.getByRole("button", { name: "لخّص المحادثة" }));
  expect(onSelect).toHaveBeenCalledTimes(1);
  // Each crossing is said once, and the number never is.
  view.rerender(meter(110_000));
  expect(region.textContent).toBe("السياق: يقترب من الامتلاء");
  view.rerender(meter(125_000));
  expect(region.textContent).toBe("السياق: شبه ممتلئ");
  view.unmount();
  // The status a meter mounts with is not news.
  const mounted = render(meter(120_000));
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  mounted.unmount();
  render(meter(120_000, { announcement: "off" }));
  expect(screen.queryByRole("status")).toBeNull();
});
