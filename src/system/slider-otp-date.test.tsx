import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Slider } from "./Slider";
import { OTPInput } from "./OTPInput";
import { DatePicker } from "./DatePicker";
import { parseDateOnly, formatDateOnly } from "./date-only";
import { SystemProvider } from "./Provider";
import { defaultConfig } from "./config";

describe("Slider", () => {
  it("clamps and snaps decimal values relative to min, submits and resets without callback", async () => {
    const change = vi.fn();
    render(
      <form aria-label="form">
        <Slider
          label="Amount"
          name="amount"
          min={0.1}
          max={0.95}
          step={0.1}
          defaultValue={2}
          onValueChange={change}
        />
        <button type="reset">Reset</button>
      </form>,
    );
    const input = screen.getByRole("slider") as HTMLInputElement;
    expect(input.value).toBe("0.9");
    fireEvent.change(input, { target: { value: "0.34" } });
    expect(input.value).toBe("0.3");
    expect(change).toHaveBeenLastCalledWith(0.3);
    expect(new FormData(input.form!).get("amount")).toBe("0.3");
    await userEvent.click(screen.getByText("Reset"));
    await waitFor(() => expect(input.value).toBe("0.9"));
    expect(change).toHaveBeenCalledTimes(1);
  });
  it("preserves controlled ownership and Field descriptions", async () => {
    render(
      <form>
        <Slider
          label="Amount"
          helper="Help"
          error="Error"
          value={0.4}
          min={0}
          max={1}
          step={0.1}
        />
        <button type="reset">Reset</button>
      </form>,
    );
    const input = screen.getByRole("slider");
    expect(input).toHaveAccessibleName("Amount");
    expect(input).toHaveAccessibleDescription("Help Error");
    fireEvent.change(input, { target: { value: "0.8" } });
    expect(input).toHaveValue("0.4");
    await userEvent.click(screen.getByText("Reset"));
    await waitFor(() => expect(input).toHaveValue("0.4"));
  });
});
describe("OTPInput", () => {
  it("pastes Arabic digits and preserves leading zeros, partial editing and native attributes", async () => {
    const user = userEvent.setup(),
      change = vi.fn();
    render(
      <form>
        <OTPInput label="Code" name="code" length={6} onValueChange={change} />
        <button type="reset">Reset</button>
      </form>,
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input).toHaveAttribute("autocomplete", "one-time-code");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("dir", "ltr");
    await user.click(input);
    await user.paste("٠۰١٢3x٤٥");
    expect(input).toHaveValue("001234");
    expect(change).toHaveBeenLastCalledWith("001234");
    input.setSelectionRange(1, 4);
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("034");
    expect(new FormData(input.form!).get("code")).toBe("034");
    await user.click(screen.getByText("Reset"));
    await waitFor(() => expect(input).toHaveValue(""));
  });
  it("keeps read-only values selectable and controlled values caller-owned", async () => {
    const user = userEvent.setup(),
      change = vi.fn();
    const view = render(
      <OTPInput label="Code" value="001" readOnly onValueChange={change} />,
    );
    const input = screen.getByRole("textbox");
    await user.type(input, "7");
    expect(input).toHaveValue("001");
    expect(change).not.toHaveBeenCalled();
    view.rerender(<OTPInput label="Code" value="001" onValueChange={change} />);
    await user.type(input, "7");
    expect(change).toHaveBeenCalledWith("0017");
    expect(input).toHaveValue("001");
  });
});
describe("DatePicker", () => {
  // JSDOM has no layout; keep Popper's detached-anchor guard testable.
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1024);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(768);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 10,
      y: 10,
      left: 10,
      top: 10,
      right: 110,
      bottom: 50,
      width: 100,
      height: 40,
      toJSON() {
        return {};
      },
    });
  });
  afterEach(() => vi.restoreAllMocks());
  it.each(["2024-02-29", "2025-12-31", "2026-01-01", "0099-01-01"])(
    "round-trips %s without UTC parsing",
    (value) => {
      expect(formatDateOnly(parseDateOnly(value)!)).toBe(value);
    },
  );
  it.each(["2023-02-29", "2024-02-30", "2026-13-01", "2026-1-01", "bad"])(
    "rejects %s",
    (value) => expect(parseDateOnly(value)).toBeUndefined(),
  );
  it("selects leap day, enforces limits, clears and resets", async () => {
    const user = userEvent.setup(),
      change = vi.fn();
    render(
      <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
        <form>
          <DatePicker
            label="Date"
            name="date"
            defaultValue="2024-02-28"
            min="2024-02-28"
            max="2024-03-01"
            onValueChange={change}
          />
          <button type="reset">Reset</button>
        </form>
      </SystemProvider>,
    );
    const trigger = screen.getByRole("button", { name: /Date/ });
    await user.click(trigger);
    expect(
      await screen.findByRole("button", { name: /February 27/ }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /February 29/ }));
    expect(document.querySelector('input[name="date"]')).toHaveValue(
      "2024-02-29",
    );
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    await user.click(await screen.findByRole("button", { name: "Clear" }));
    expect(document.querySelector('input[name="date"]')).toHaveValue("");
    await user.click(screen.getByText("Reset"));
    await waitFor(() =>
      expect(document.querySelector('input[name="date"]')).toHaveValue(
        "2024-02-28",
      ),
    );
    expect(change.mock.calls.map((c) => c[0])).toEqual(["2024-02-29", ""]);
  });
  it("reports clear for a malformed controlled date", async () => {
    const user = userEvent.setup(),
      change = vi.fn();
    render(
      <SystemProvider>
        <DatePicker
          label="Date"
          locale="en"
          value="2023-02-29"
          onValueChange={change}
        />
      </SystemProvider>,
    );
    await user.click(screen.getByRole("button", { name: /^Date/ }));
    await user.click(await screen.findByRole("button", { name: "Clear" }));
    expect(change).toHaveBeenCalledWith("");
  });
  it("stays closed after disabling an open picker and re-enabling it", async () => {
    const user = userEvent.setup();
    const view = render(
      <SystemProvider>
        <DatePicker label="Date" />
      </SystemProvider>,
    );
    await user.click(screen.getByRole("button", { name: /^Date/ }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    view.rerender(
      <SystemProvider>
        <DatePicker label="Date" disabled />
      </SystemProvider>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    view.rerender(
      <SystemProvider>
        <DatePicker label="Date" />
      </SystemProvider>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("does not take ownership of a controlled date", async () => {
    const change = vi.fn(),
      user = userEvent.setup();
    render(
      <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
        <DatePicker label="Date" value="2026-12-31" onValueChange={change} />
      </SystemProvider>,
    );
    await user.click(screen.getByRole("button", { name: /Date/ }));
    await user.click(await screen.findByRole("button", { name: "Clear" }));
    expect(change).toHaveBeenCalledWith("");
    expect(screen.getByText(/December 31, 2026/)).toBeInTheDocument();
  });
});
