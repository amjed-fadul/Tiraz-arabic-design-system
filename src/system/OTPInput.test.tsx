import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { OTPInput } from "./OTPInput";
const slots = () => [...document.querySelectorAll(".tz-otp-slot")];
const active = () =>
  slots().findIndex((slot) => slot.hasAttribute("data-active"));
function select(
  input: HTMLInputElement,
  start: number,
  end = start,
  direction: "forward" | "backward" | "none" = "none",
) {
  act(() => {
    input.setSelectionRange(start, end, direction);
    fireEvent.select(input);
  });
}
it("renders one real input and centered decorative digits including leading zeros", () => {
  render(<OTPInput label="Code" defaultValue="000000" />);
  expect(screen.getAllByRole("textbox")).toHaveLength(1);
  expect(
    slots().map((slot) => slot.querySelector(".tz-otp-digit")?.textContent),
  ).toEqual(["0", "0", "0", "0", "0", "0"]);
  expect(document.querySelector(".tz-otp-slots")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
});
it("tracks active caret endpoint, selection direction and last-slot end without a group focus", async () => {
  const user = userEvent.setup();
  render(<OTPInput label="Code" defaultValue="001234" />);
  const input = screen.getByRole("textbox") as HTMLInputElement;
  await user.tab();
  select(input, 0);
  expect(active()).toBe(0);
  select(input, 3);
  expect(active()).toBe(3);
  select(input, 6);
  expect(active()).toBe(5);
  select(input, 1, 4, "forward");
  expect(active()).toBe(3);
  expect(
    slots().filter((slot) => slot.hasAttribute("data-selected")),
  ).toHaveLength(3);
  select(input, 1, 4, "backward");
  expect(active()).toBe(1);
  await user.tab();
  expect(active()).toBe(-1);
});
it("mirrors native edits, normalized paste and controlled owner decisions", async () => {
  const user = userEvent.setup(),
    change = vi.fn();
  const view = render(
    <OTPInput label="Code" defaultValue="001" onValueChange={change} />,
  );
  const input = screen.getByRole("textbox") as HTMLInputElement;
  await user.tab();
  select(input, 1, 3);
  await user.keyboard("9");
  expect(input).toHaveValue("09");
  expect(
    slots()
      .map((s) => s.textContent)
      .join(""),
  ).toBe("09");
  expect(active()).toBe(2);
  select(input, 0, 2);
  await user.paste("٠٠١٢٣٤");
  expect(input).toHaveValue("001234");
  expect(active()).toBe(5);
  view.rerender(<OTPInput label="Code" value="001" onValueChange={change} />);
  select(input, 3);
  await user.keyboard("9");
  expect(input).toHaveValue("001");
  expect(
    slots()
      .map((s) => s.textContent)
      .join(""),
  ).toBe("001");
});
it("does not highlight disabled controls and keeps readonly selection available", async () => {
  const user = userEvent.setup();
  const view = render(<OTPInput label="Code" defaultValue="001234" disabled />);
  await user.tab();
  expect(active()).toBe(-1);
  view.rerender(
    <OTPInput
      label="Code"
      defaultValue="001234"
      readOnly
      error="Review code"
    />,
  );
  const input = screen.getByRole("textbox") as HTMLInputElement;
  await user.tab();
  select(input, 1, 3, "backward");
  expect(active()).toBe(1);
  await user.keyboard("7");
  expect(input).toHaveValue("001234");
  expect(input).toHaveAccessibleDescription("Review code");
});
it("marks a typed, complete and valid code for the success edge", async () => {
  const user = userEvent.setup();
  render(<OTPInput label="Code" length={4} />);
  const otp = document.querySelector(".tz-otp")!;
  expect(otp).not.toHaveAttribute("data-changed");
  await user.type(screen.getByRole("textbox"), "1234");
  expect(otp).toHaveAttribute("data-changed");
  expect(slots().every((slot) => slot.hasAttribute("data-filled"))).toBe(true);
  expect(otp.querySelector('[aria-invalid="true"]')).toBeNull();
});
