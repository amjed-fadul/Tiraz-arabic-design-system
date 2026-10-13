import { createRef, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Field, Input } from "./index";

it("labels, describes and marks a required input without validating its value", () => {
  render(
    <Input
      label="اسم العميل"
      helper="كما يظهر في الفاتورة"
      error="أدخل الاسم"
      required
      defaultValue=""
    />,
  );
  const input = screen.getByRole("textbox", { name: "اسم العميل" });
  expect(input).toBeRequired();
  expect(input).toHaveAccessibleDescription("كما يظهر في الفاتورة أدخل الاسم");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(
    input.closest(".tz-field")?.querySelector(".tz-field-required"),
  ).toHaveAttribute("aria-hidden", "true");
});
it("keeps IDs, value and external descriptions stable as error text changes", async () => {
  const { rerender } = render(
    <>
      <p id="external">External</p>
      <Input
        label="Name"
        helper="Help"
        aria-describedby="external external"
        defaultValue="Draft"
      />
    </>,
  );
  const input = screen.getByRole("textbox", { name: "Name" });
  const id = input.id,
    labelId = input.getAttribute("aria-labelledby");
  await userEvent.type(input, " updated");
  rerender(
    <>
      <p id="external">External</p>
      <Input
        label="Name"
        helper="Help"
        error="Correct this"
        aria-describedby="external external"
        defaultValue="Draft"
      />
    </>,
  );
  expect(screen.getByRole("textbox")).toBe(input);
  expect(input.id).toBe(id);
  expect(input.getAttribute("aria-labelledby")).toBe(labelId);
  expect(input).toHaveValue("Draft updated");
  expect(input).toHaveAccessibleDescription("Help Correct this External");
  expect(
    input
      .getAttribute("aria-describedby")!
      .split(" ")
      .filter((id) => id === "external"),
  ).toHaveLength(1);
  rerender(
    <>
      <p id="external">External</p>
      <Input
        label="Name"
        helper="Help"
        aria-describedby="external"
        defaultValue="Draft"
      />
    </>,
  );
  expect(input.id).toBe(id);
  expect(input).not.toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAccessibleDescription("Help External");
  expect(document.getElementById(`${id}-error`)).toBeNull();
});
it("keeps ref, class, style, native attributes and external form reset on the actual input", async () => {
  const ref = createRef<HTMLInputElement>();
  render(
    <>
      <form id="customer">
        <button type="reset">Reset</button>
      </form>
      <Input
        label="Email"
        id="email"
        ref={ref}
        type="email"
        name="email"
        form="customer"
        autoComplete="email"
        placeholder="Email here"
        maxLength={80}
        data-purpose="billing"
        className="custom-input"
        style={{ width: 180 }}
        defaultValue="a@example.com"
      />
    </>,
  );
  const input = screen.getByRole("textbox", { name: "Email" });
  expect(ref.current).toBe(input);
  expect(input.id).toBe("email");
  expect(input).toHaveClass("tz-input", "custom-input");
  expect(input).toHaveStyle({ width: "180px" });
  expect(input.parentElement).not.toHaveClass("custom-input");
  expect(input.parentElement).not.toHaveAttribute("style");
  expect(input).toHaveAttribute("autocomplete", "email");
  expect(input).toHaveAttribute("maxlength", "80");
  expect(input).toHaveAttribute("data-purpose", "billing");
  await userEvent.clear(input);
  await userEvent.type(input, "b@example.com");
  expect(new FormData(document.querySelector("form")!).get("email")).toBe(
    "b@example.com",
  );
  await userEvent.click(screen.getByRole("button", { name: "Reset" }));
  expect(input).toHaveValue("a@example.com");
});
it("keeps controlled events application-owned and only marks errors supplied by the owner", async () => {
  function Demo() {
    const [value, setValue] = useState("");
    return (
      <Input
        label="Name"
        required
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
      />
    );
  }
  render(<Demo />);
  const input = screen.getByRole("textbox", { name: "Name" });
  expect(input).not.toHaveAttribute("aria-invalid", "true");
  await userEvent.type(input, "Customer");
  expect(input).toHaveValue("Customer");
});
it("retains standalone native labels and ARIA without adding a wrapper", () => {
  const { container } = render(
    <>
      <label htmlFor="plain">Native name</label>
      <Input id="plain" />
      <Input aria-label="ARIA name" disabled />
      <Input aria-label="Read only" readOnly defaultValue="Saved" />
    </>,
  );
  expect(
    screen.getByRole("textbox", { name: "Native name" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "ARIA name" })).toBeDisabled();
  expect(screen.getByRole("textbox", { name: "Read only" })).toHaveAttribute(
    "readonly",
  );
  expect(container.querySelector(".tz-field")).toBeNull();
});
it("preserves Field composition with one wrapper and merged external descriptions", () => {
  const { container } = render(
    <>
      <p id="extra">Extra</p>
      <Field label="Composed" helper="Help" error="Error" required>
        {(field) => <Input field={field} aria-describedby="extra" />}
      </Field>
    </>,
  );
  const input = screen.getByRole("textbox", { name: "Composed" });
  expect(input).toBeRequired();
  expect(input).toHaveAccessibleDescription("Help Error Extra");
  expect(container.querySelectorAll(".tz-field")).toHaveLength(1);
  expect(container.querySelectorAll("label")).toHaveLength(1);
});
