import { createRef, useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Field, Input, Select, SystemProvider } from "./index";

it("links label/helper/error and preserves external descriptions on Input and Select", () => {
  render(
    <SystemProvider>
      <p id="outside">External</p>
      <Field
        label="Name"
        helper="Help"
        error="Fix name"
        required
        aria-describedby="outside"
      >
        {(field) => <Input field={field} aria-describedby="extra" />}
      </Field>
      <p id="extra">More</p>
      <Field label="Status" helper="Choice" error="Fix status">
        {(field) => (
          <Select
            field={field}
            aria-describedby="outside"
            options={[{ value: "active", label: "Active" }]}
          />
        )}
      </Field>
    </SystemProvider>,
  );
  for (const control of [
    screen.getByRole("textbox", { name: "Name" }),
    screen.getByRole("combobox", { name: "Status" }),
  ]) {
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(control.getAttribute("aria-describedby")).toContain("outside");
  }
  expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
    "External Help Fix name More",
  );
  expect(screen.getByRole("combobox")).toHaveAccessibleDescription(
    "Choice Fix status External",
  );
  expect(screen.getByRole("textbox")).toBeRequired();
});
it("keeps Input native editing, uncontrolled reset, form values, typed events and ref", async () => {
  const ref = createRef<HTMLInputElement>(),
    change = vi.fn();
  render(
    <form aria-label="Form">
      <Input
        aria-label="Name"
        name="name"
        defaultValue="Initial"
        onChange={change}
        ref={ref}
      />
      <Input aria-label="Readonly" name="read" defaultValue="Kept" readOnly />
      <Input
        aria-label="Disabled"
        name="disabled"
        defaultValue="Omitted"
        disabled
      />
      <button type="reset">Reset</button>
    </form>,
  );
  await userEvent.clear(screen.getByLabelText("Name"));
  await userEvent.type(screen.getByLabelText("Name"), "مدار ACME");
  expect(ref.current).toBe(screen.getByLabelText("Name"));
  expect(change).toHaveBeenCalled();
  const form = screen.getByRole("form") as HTMLFormElement;
  expect(Object.fromEntries(new FormData(form))).toEqual({
    name: "مدار ACME",
    read: "Kept",
  });
  await userEvent.type(screen.getByLabelText("Readonly"), "x");
  expect(screen.getByLabelText("Readonly")).toHaveValue("Kept");
  await userEvent.click(screen.getByText("Reset"));
  expect(ref.current).toHaveValue("Initial");
});
it("updates controlled Input and native required/invalid state", async () => {
  function Demo() {
    const [value, setValue] = useState("");
    return (
      <Input
        aria-label="Email"
        type="email"
        required
        invalid
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
      />
    );
  }
  render(<Demo />);
  await userEvent.type(screen.getByLabelText("Email"), "bad");
  expect(screen.getByLabelText("Email")).toHaveValue("bad");
  expect(screen.getByLabelText("Email")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(
    (screen.getByLabelText("Email") as HTMLInputElement).checkValidity(),
  ).toBe(false);
});
it("submits and resets Select values and excludes disabled fields", () => {
  render(
    <SystemProvider>
      <form aria-label="Choices">
        <Select
          aria-label="Status"
          name="status"
          defaultValue="active"
          required
          options={[
            { value: "active", label: "Active" },
            { value: "paused", label: "Paused", disabled: true },
          ]}
        />
        <Select
          aria-label="Disabled"
          name="disabled"
          defaultValue="active"
          disabled
          options={[{ value: "active", label: "Active" }]}
        />
      </form>
    </SystemProvider>,
  );
  const form = screen.getByRole("form") as HTMLFormElement;
  expect(Object.fromEntries(new FormData(form))).toEqual({ status: "active" });
  expect(screen.getByRole("combobox", { name: "Status" })).toHaveAttribute(
    "aria-required",
    "true",
  );
  expect(screen.getByRole("combobox", { name: "Disabled" })).toBeDisabled();
  fireEvent.reset(form);
  expect(screen.getByRole("combobox", { name: "Status" })).toHaveTextContent(
    "Active",
  );
});
it("uses keyboard selection, skips disabled options and resets controlled and uncontrolled Select", async () => {
  const ref = createRef<HTMLButtonElement>();
  function Demo() {
    const [value, setValue] = useState("a");
    return (
      <SystemProvider>
        <form aria-label="Keyboard choices">
          <Select
            aria-label="Controlled"
            ref={ref}
            name="controlled"
            value={value}
            onValueChange={setValue}
            options={[
              { value: "a", label: "Alpha" },
              { value: "off", label: "Disabled", disabled: true },
              { value: "b", label: "Beta" },
            ]}
          />
          <Select
            aria-label="Uncontrolled"
            name="uncontrolled"
            defaultValue="a"
            options={[
              { value: "a", label: "Alpha" },
              { value: "b", label: "Beta" },
            ]}
          />
          <button type="reset">Reset choices</button>
        </form>
      </SystemProvider>
    );
  }
  render(<Demo />);
  const user = userEvent.setup();
  for (const name of ["Controlled", "Uncontrolled"]) {
    screen.getByRole("combobox", { name }).focus();
    await user.keyboard("{ArrowDown}");
    await screen.findByRole("listbox");
    await user.keyboard("{End}");
    await user.keyboard("{Enter}");
    expect(screen.getByRole("combobox", { name })).toHaveTextContent("Beta");
  }
  expect(ref.current).toBe(
    screen.getByRole("combobox", { name: "Controlled" }),
  );
  expect(
    Object.fromEntries(
      new FormData(screen.getByRole("form") as HTMLFormElement),
    ),
  ).toEqual({ controlled: "b", uncontrolled: "b" });
  await user.click(screen.getByText("Reset choices"));
  expect(
    screen.getByRole("combobox", { name: "Controlled" }),
  ).toHaveTextContent("Alpha");
  expect(
    screen.getByRole("combobox", { name: "Uncontrolled" }),
  ).toHaveTextContent("Alpha");
});
it("keeps Field IDs stable when errors change and removes only its error description", () => {
  const view = render(
    <Field id="name" label="Name" helper="Help" error="Error">
      {(field) => <Input field={field} aria-describedby="external external" />}
    </Field>,
  );
  expect(screen.getByRole("textbox")).toHaveAttribute(
    "aria-describedby",
    "name-help name-error external",
  );
  view.rerender(
    <Field id="name" label="Name" helper="Help">
      {(field) => <Input field={field} aria-describedby="external" />}
    </Field>,
  );
  expect(screen.getByRole("textbox")).toHaveAttribute("id", "name");
  expect(screen.getByRole("textbox")).toHaveAttribute(
    "aria-describedby",
    "name-help external",
  );
  expect(screen.getByRole("textbox")).not.toHaveAttribute(
    "aria-invalid",
    "true",
  );
});
it("redirects native validation to the first invalid Select in form order", async () => {
  render(
    <SystemProvider>
      <form aria-label="Required choices">
        <Select
          aria-label="First"
          required
          name="first"
          options={[{ value: "a", label: "A" }]}
        />
        <Select
          aria-label="Second"
          required
          name="second"
          options={[{ value: "a", label: "A" }]}
        />
      </form>
    </SystemProvider>,
  );
  expect((screen.getByRole("form") as HTMLFormElement).checkValidity()).toBe(
    false,
  );
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "First" })).toHaveFocus(),
  );
});
