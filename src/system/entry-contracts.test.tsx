import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { OTPInput, Slider, DatePicker, Field } from "./index";
it("merges external Field associations and forwards primary refs", () => {
  const slider = { current: null as HTMLInputElement | null },
    otp = { current: null as HTMLInputElement | null },
    date = { current: null as HTMLButtonElement | null };
  render(
    <>
      <p id="external">External</p>
      <Field label="Slider" helper="Helper" error="Error">
        {(field) => (
          <Slider field={field} ref={slider} aria-describedby="external" />
        )}
      </Field>
      <OTPInput label="OTP" ref={otp} />
      <DatePicker label="Date" ref={date} value="2024-02-29" locale="en" />
    </>,
  );
  expect(slider.current).toHaveAccessibleDescription("Helper Error External");
  expect(otp.current).toBe(screen.getByRole("textbox"));
  expect(date.current).toHaveAccessibleName("Date February 29, 2024");
});
it("preserves partial OTP validation and read-only submission while disabled controls are omitted", () => {
  render(
    <form aria-label="form">
      <OTPInput label="Code" name="code" defaultValue="001" />
      <OTPInput
        label="Read only"
        name="read"
        defaultValue="0012"
        readOnly
        length={4}
      />
      <OTPInput label="Disabled" name="disabled" defaultValue="0012" disabled />
      <Slider label="Disabled range" name="range" disabled />
      <DatePicker
        label="Disabled date"
        name="date"
        value="2024-02-29"
        disabled
      />
    </form>,
  );
  const input = screen.getByRole("textbox", {
    name: "Code",
  }) as HTMLInputElement;
  expect(input.checkValidity()).toBe(false);
  const data = new FormData(input.form!);
  expect([...data.entries()]).toEqual([
    ["code", "001"],
    ["read", "0012"],
  ]);
  fireEvent.change(input, { target: { value: "001234" } });
  expect(input.checkValidity()).toBe(true);
  fireEvent.change(input, { target: { value: "" } });
  expect(input.checkValidity()).toBe(true);
});
it("keeps external form reset cancelable and restores initial defaults without changes", async () => {
  const user = userEvent.setup(),
    change = vi.fn();
  const view = render(
    <>
      <form
        id="external-form"
        aria-label="form"
        onReset={(e) => e.preventDefault()}
      >
        <button type="reset">Reset</button>
      </form>
      <Slider
        label="Range"
        form="external-form"
        defaultValue={20}
        onValueChange={change}
      />
      <OTPInput
        label="Code"
        form="external-form"
        defaultValue="001"
        onValueChange={change}
      />
    </>,
  );
  const range = screen.getByRole("slider"),
    code = screen.getByRole("textbox");
  fireEvent.change(range, { target: { value: "40" } });
  await user.type(code, "2");
  change.mockClear();
  await user.click(screen.getByText("Reset"));
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(range).toHaveValue("40");
  expect(code).toHaveValue("0012");
  expect(change).not.toHaveBeenCalled();
  view.rerender(
    <>
      <form id="external-form" aria-label="form">
        <button type="reset">Reset</button>
      </form>
      <Slider
        label="Range"
        form="external-form"
        defaultValue={90}
        onValueChange={change}
      />
      <OTPInput
        label="Code"
        form="external-form"
        defaultValue="999"
        onValueChange={change}
      />
    </>,
  );
  await user.click(screen.getByText("Reset"));
  await waitFor(() => expect(range).toHaveValue("20"));
  expect(code).toHaveValue("001");
  expect(change).not.toHaveBeenCalled();
});
it("normalizes controlled boundary values without emitting during render", () => {
  const change = vi.fn();
  const view = render(
    <Slider
      label="Range"
      value={-5}
      min={-0.3}
      max={0.35}
      step={0.1}
      onValueChange={change}
    />,
  );
  expect(screen.getByRole("slider")).toHaveValue("-0.3");
  view.rerender(
    <Slider
      label="Range"
      value={0.35}
      min={-0.3}
      max={0.35}
      step={0.1}
      onValueChange={change}
    />,
  );
  expect(screen.getByRole("slider")).toHaveValue("0.3");
  expect(change).not.toHaveBeenCalled();
});
it("exposes invalid date props and preserves out-of-bound controlled dates without callbacks", () => {
  const change = vi.fn();
  render(
    <form>
      <DatePicker
        label="Bad"
        name="bad"
        value="2023-02-29"
        locale="en"
        onValueChange={change}
      />
      <DatePicker
        label="Outside"
        name="outside"
        value="2024-01-01"
        min="2024-02-01"
        locale="en"
        onValueChange={change}
      />
    </form>,
  );
  expect(
    screen.getByRole("button", { name: /Bad/ }),
  ).toHaveAccessibleDescription("Invalid date. Use YYYY-MM-DD.");
  expect(screen.getByRole("button", { name: /Outside/ })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(document.querySelector('input[name="bad"]')).toHaveValue("");
  expect(document.querySelector('input[name="outside"]')).toHaveValue(
    "2024-01-01",
  );
  expect(change).not.toHaveBeenCalled();
});
it("preserves explicit and implicit native date labels alongside the visible date", () => {
  render(
    <>
      <label htmlFor="native-date">Native date</label>
      <DatePicker id="native-date" value="2024-02-29" locale="en" />
      <label>
        Implicit date
        <DatePicker value="2024-02-29" locale="en" />
      </label>
      <DatePicker value="2024-02-29" locale="en" />
    </>,
  );
  expect(
    screen.getByRole("button", { name: "Native date" }),
  ).toHaveAccessibleDescription("February 29, 2024");
  expect(
    screen.getByRole("button", { name: "Implicit date" }),
  ).toHaveAccessibleDescription("February 29, 2024");
  expect(
    screen.getByRole("button", { name: "February 29, 2024" }),
  ).toBeInTheDocument();
});
