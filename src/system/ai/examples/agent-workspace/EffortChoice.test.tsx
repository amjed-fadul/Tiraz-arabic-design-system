import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { EffortChoice } from "./EffortChoice";

function Choice({
  language = "en",
  disabled = false,
}: {
  language?: "en" | "ar";
  disabled?: boolean;
}) {
  const [value, setValue] = useState(1);
  return (
    <EffortChoice
      value={value}
      onChange={setValue}
      language={language}
      disabled={disabled}
    />
  );
}

it("uses a native stepped range with named effort values and descriptions", () => {
  render(<Choice />);
  const slider = screen.getByRole("slider", { name: "Effort" });
  expect(slider).toHaveAttribute("type", "range");
  expect(slider).toHaveAttribute("min", "0");
  expect(slider).toHaveAttribute("max", "3");
  expect(slider).toHaveAttribute("step", "1");
  expect(slider).toHaveAttribute("aria-valuetext", "Balanced");
  expect(screen.queryByRole("radio")).toBeNull();
  expect(screen.queryByRole("combobox")).toBeNull();
  fireEvent.change(slider, { target: { value: "2" } });
  expect(slider).toHaveAttribute("aria-valuetext", "Deep");
  expect(slider).toHaveAccessibleDescription("Complex changes, more reasoning");
  fireEvent.change(slider, { target: { value: "3" } });
  expect(slider).toHaveAttribute("aria-valuetext", "Thorough");
});

it("labels the value and tradeoff in Arabic", () => {
  render(<Choice language="ar" />);
  const slider = screen.getByRole("slider", { name: "مستوى التفكير" });
  expect(slider).toHaveAttribute("aria-valuetext", "متوازن");
  expect(slider).toHaveAccessibleDescription("للمهام اليومية بإجابات مدروسة");
});

it("follows a drag across the meter and settles on the nearest stop", () => {
  render(<Choice />);
  const slider = screen.getByRole("slider", { name: "Effort" });
  const meter = slider.closest<HTMLElement>(".tz-example-effort")!;
  const track = meter.querySelector<HTMLElement>(".tz-example-effort-track")!;
  track.getBoundingClientRect = () =>
    ({
      left: 0,
      right: 64,
      width: 64,
      top: 0,
      bottom: 12,
      height: 12,
    }) as DOMRect;
  fireEvent.pointerDown(meter, { button: 0, clientX: 60, pointerId: 1 });
  expect(slider).toHaveAttribute("aria-valuetext", "Thorough");
  expect(slider).toHaveFocus();
  fireEvent.pointerMove(meter, { clientX: 6, pointerId: 1 });
  expect(slider).toHaveAttribute("aria-valuetext", "Quick");
  fireEvent.pointerMove(meter, { clientX: 36, pointerId: 1 });
  fireEvent.pointerUp(meter, { pointerId: 1 });
  expect(slider).toHaveAttribute("aria-valuetext", "Balanced");
  expect(meter).toHaveAttribute("data-dragging", "false");
});

it("disables the native range while the current request runs", () => {
  render(<Choice disabled />);
  expect(screen.getByRole("slider")).toBeDisabled();
});
