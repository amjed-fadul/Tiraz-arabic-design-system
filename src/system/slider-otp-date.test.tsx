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
  it.each(["ltr", "rtl"] as const)(
    "navigates logical months with matching %s chevrons and selectors",
    async (direction) => {
      const change = vi.fn(),
        user = userEvent.setup();
      render(
        <SystemProvider config={{ ...defaultConfig, direction }}>
          <DatePicker label="Date" value="2024-12-31" onValueChange={change} />
        </SystemProvider>,
      );
      await user.click(screen.getByRole("button", { name: /^Date/ }));
      const previous = document.querySelector<HTMLButtonElement>(
        ".rdp-button_previous",
      )!;
      const next =
        document.querySelector<HTMLButtonElement>(".rdp-button_next")!;
      const left =
        "16 18.112 9.81111111 12 16 5.87733333 14.0888889 4 6 12 14.0888889 20";
      const right =
        "8 18.112 14.18888889 12 8 5.87733333 9.91111111 4 18 12 9.91111111 20";
      expect(previous.querySelector("polygon")).toHaveAttribute(
        "points",
        direction === "rtl" ? right : left,
      );
      expect(next.querySelector("polygon")).toHaveAttribute(
        "points",
        direction === "rtl" ? left : right,
      );
      expect(previous).toHaveAccessibleName(
        direction === "rtl"
          ? "اذهب إلى الشهر السابق"
          : "Go to the Previous Month",
      );
      const month = screen.getByRole("combobox", {
        name: direction === "rtl" ? "اختر الشهر" : "Choose the Month",
      });
      const year = screen.getByRole("combobox", {
        name: direction === "rtl" ? "اختر السنة" : "Choose the Year",
      });
      await user.click(next);
      expect(month).toHaveValue("0");
      expect(year).toHaveValue("2025");
      await user.click(previous);
      expect(month).toHaveValue("11");
      expect(year).toHaveValue("2024");
      await user.selectOptions(month, "1");
      await user.click(year);
      await user.click(
        await screen.findByRole("option", {
          name: direction === "rtl" ? "٢٠٢٨" : "2028",
        }),
      );
      expect(change).not.toHaveBeenCalled();
      expect(document.querySelector("input[type=hidden]")).toHaveValue(
        "2024-12-31",
      );
      await user.click(
        screen.getByRole("button", {
          name: direction === "rtl" ? /٢٩ فبراير ٢٠٢٨/ : /February 29, 2028/,
        }),
      );
      expect(change).toHaveBeenCalledWith("2028-02-29");
    },
  );
  it("limits direct navigation with min/max while preserving the selected date", async () => {
    const change = vi.fn(),
      user = userEvent.setup();
    render(
      <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
        <DatePicker
          label="Date"
          value="2024-12-31"
          min="2024-12-20"
          max="2025-02-10"
          onValueChange={change}
        />
      </SystemProvider>,
    );
    await user.click(screen.getByRole("button", { name: /^Date/ }));
    const month = screen.getByRole("combobox", { name: "Choose the Month" });
    const year = screen.getByRole("combobox", { name: "Choose the Year" });
    await user.click(year);
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["2024", "2025"]);
    await user.keyboard("{Escape}");
    expect(month.querySelector('option[value="10"]')).toBeDisabled();
    expect(document.querySelector(".rdp-button_previous")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await user.click(year);
    await user.click(await screen.findByRole("option", { name: "2025" }));
    expect(month).toHaveValue("1");
    expect(month.querySelector('option[value="2"]')).toBeDisabled();
    expect(document.querySelector(".rdp-button_next")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(change).not.toHaveBeenCalled();
    expect(document.querySelector("input[type=hidden]")).toHaveValue(
      "2024-12-31",
    );
  });
  it("keeps year dropdowns practical without restricting date validity or month navigation", async () => {
    const user = userEvent.setup();
    render(
      <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
        <DatePicker
          label="Date"
          defaultValue="1800-12-31"
          yearRange={[1900, 2100]}
        />
      </SystemProvider>,
    );
    await user.click(screen.getByRole("button", { name: /^Date/ }));
    const year = screen.getByRole("combobox", { name: "Choose the Year" });
    expect(year).toHaveValue("1800");
    await user.click(year);
    expect(screen.getAllByRole("option")).toHaveLength(202);
    await user.keyboard("{Escape}");
    await user.click(
      document.querySelector<HTMLButtonElement>(".rdp-button_previous")!,
    );
    expect(year).toHaveValue("1800");
    await user.click(year);
    await user.click(await screen.findByRole("option", { name: "1900" }));
    expect(document.querySelector("input[type=hidden]")).toHaveValue(
      "1800-12-31",
    );
  });
  it("keeps the full year range in a scrollable popup and restores year focus on Escape", async () => {
    const user = userEvent.setup(),
      change = vi.fn();
    render(
      <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
        <DatePicker label="Date" value="2024-12-31" onValueChange={change} />
      </SystemProvider>,
    );
    await user.click(screen.getByRole("button", { name: /^Date/ }));
    const year = screen.getByRole("combobox", { name: "Choose the Year" });
    await user.click(year);
    expect(await screen.findByRole("listbox")).toHaveClass(
      "tz-date-years-popup",
    );
    expect(screen.getAllByRole("option")).toHaveLength(201);
    expect(screen.getByRole("option", { name: "2024" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(year).toHaveTextContent("2025"));
    expect(change).not.toHaveBeenCalled();
    expect(document.querySelector('input[type="hidden"]')).toHaveValue(
      "2024-12-31",
    );
    await user.click(year);
    await screen.findByRole("listbox");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(year).toHaveFocus());
    expect(document.querySelector(".tz-datepicker-popup")).toBeInTheDocument();
  });
});
