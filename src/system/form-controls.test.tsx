import { createRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Badge, Checkbox, RadioGroup, Textarea } from "./index";

describe("native form controls", () => {
  it("associates Checkbox label, helper, error and caller descriptions on the native ref", async () => {
    const user = userEvent.setup(),
      ref = createRef<HTMLInputElement>(),
      change = vi.fn();
    render(
      <>
        <p id="external">External help</p>
        <Checkbox
          id="consent"
          label="Consent"
          helper="Optional updates"
          error="Choose consent"
          aria-describedby="external consent-help"
          required
          ref={ref}
          onChange={change}
        />
      </>,
    );
    const input = screen.getByRole("checkbox", { name: "Consent" });
    expect(ref.current).toBe(input);
    expect(input).toHaveAccessibleDescription(
      "Optional updates Choose consent External help",
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toBeRequired();
    await user.click(screen.getByText("Consent"));
    expect(input).toBeChecked();
    expect(change).toHaveBeenCalledOnce();
    await user.keyboard(" ");
    expect(input).not.toBeChecked();
  });
  it("submits and resets native uncontrolled values, excluding disabled options and checkboxes", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="form">
        <Checkbox label="Updates" name="updates" value="yes" defaultChecked />
        <Checkbox label="Disabled" name="disabled" disabled defaultChecked />
        <RadioGroup
          label="Frequency"
          name="frequency"
          defaultValue="weekly"
          options={[
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
            { value: "never", label: "Unavailable", disabled: true },
          ]}
          required
        />
        <Textarea label="Notes" name="notes" defaultValue="Original" rows={3} />
        <button type="reset">Reset</button>
      </form>,
    );
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect([...new FormData(form)]).toEqual([
      ["updates", "yes"],
      ["frequency", "weekly"],
      ["notes", "Original"],
    ]);
    await user.click(screen.getByLabelText("Updates"));
    await user.click(screen.getByLabelText("Monthly"));
    await user.type(screen.getByLabelText("Notes"), " edited");
    await user.click(screen.getByLabelText("Unavailable"));
    expect(screen.getByLabelText("Monthly")).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect([...new FormData(form)]).toEqual([
      ["updates", "yes"],
      ["frequency", "weekly"],
      ["notes", "Original"],
    ]);
  });
  it("keeps controlled checkbox/radio selection application-owned", async () => {
    function Controlled() {
      const [checked, setChecked] = useState(false),
        [value, setValue] = useState("a");
      return (
        <>
          <Checkbox
            label="Consent"
            checked={checked}
            onChange={(e) => setChecked(e.currentTarget.checked)}
          />
          <RadioGroup
            label="Choice"
            name="choice"
            value={value}
            onValueChange={setValue}
            options={[
              { value: "a", label: "A" },
              { value: "b", label: "B" },
            ]}
          />
        </>
      );
    }
    render(<Controlled />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Consent"));
    expect(screen.getByLabelText("Consent")).toBeChecked();
    await user.click(screen.getByLabelText("B"));
    expect(screen.getByLabelText("B")).toBeChecked();
    expect(screen.getByLabelText("A")).not.toBeChecked();
  });
  it("names the native fieldset and associates required/error state with each radio, including external forms", () => {
    const ref = createRef<HTMLFieldSetElement>();
    render(
      <>
        <form id="external-form" />
        <RadioGroup
          ref={ref}
          form="external-form"
          label="Contact"
          helper="One choice"
          error="Choose one"
          aria-describedby="extra"
          name="contact"
          required
          options={[
            { value: "email", label: "Email" },
            { value: "phone", label: "Phone", disabled: true },
          ]}
        />
        <p id="extra">External</p>
      </>,
    );
    expect(ref.current).toBe(screen.getByRole("group", { name: "Contact" }));
    const radio = screen.getByRole("radio", {
      name: "Email",
    }) as HTMLInputElement;
    expect(radio).toHaveAccessibleDescription("One choice Choose one External");
    expect(radio).toHaveAttribute("aria-invalid", "true");
    expect(radio.checkValidity()).toBe(false);
    fireEvent.click(radio);
    expect(new FormData(document.querySelector("form")!).get("contact")).toBe(
      "email",
    );
  });
  it("preserves Textarea native ref, selection, attributes and associations", async () => {
    const ref = createRef<HTMLTextAreaElement>();
    const view = render(
      <Textarea
        id="notes"
        ref={ref}
        label="Notes"
        helper="Details"
        error="Too short"
        aria-describedby="notes-help"
        rows={4}
        maxLength={100}
        defaultValue="Hello"
        required
      />,
    );
    const textarea = screen.getByRole("textbox", {
      name: "Notes",
    }) as HTMLTextAreaElement;
    expect(ref.current).toBe(textarea);
    expect(textarea).toHaveAccessibleDescription("Details Too short");
    expect(textarea.rows).toBe(4);
    expect(textarea.maxLength).toBe(100);
    textarea.setSelectionRange(1, 3);
    expect(textarea.selectionStart).toBe(1);
    expect(textarea.selectionEnd).toBe(3);
    view.rerender(
      <Textarea
        id="notes"
        ref={ref}
        label="Notes"
        readOnly
        defaultValue="Hello"
      />,
    );
    await userEvent.setup().type(textarea, "changed");
    expect(textarea.value).toBe("Hello");
  });
  it("keeps Badge text readable and noninteractive without live-region semantics", () => {
    render(<Badge tone="success">Active</Badge>);
    const badge = screen.getByText("Active");
    expect(badge.tagName).toBe("SPAN");
    expect(badge).not.toHaveAttribute("tabindex");
    expect(badge).not.toHaveAttribute("role");
  });
});
