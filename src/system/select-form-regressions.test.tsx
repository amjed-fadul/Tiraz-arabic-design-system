import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Button, Select, SystemProvider } from "./index";
const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];
for (const controlled of [false, true])
  for (const external of [false, true])
    for (const cancellation of ["onReset", "onResetCapture"] as const) {
      it(`preserves ${controlled ? "controlled" : "uncontrolled"} value/app state on ${cancellation} cancellation (${external ? "external" : "nested"} form)`, async () => {
        const change = vi.fn();
        function Demo() {
          const [value, setValue] = useState("a");
          const select = (
            <Select
              aria-label="Choice"
              name="choice"
              form={external ? "choices" : undefined}
              value={controlled ? value : undefined}
              defaultValue="a"
              onValueChange={(next) => {
                change(next);
                setValue(next);
              }}
              options={options}
            />
          );
          return (
            <SystemProvider>
              <form
                id="choices"
                aria-label="Choices"
                {...{
                  [cancellation]: (event: React.FormEvent<HTMLFormElement>) =>
                    event.preventDefault(),
                }}
              >
                {!external && select}
                <Button type="reset">Reset</Button>
              </form>
              {external && select}
              <output data-testid="state">{value}</output>
            </SystemProvider>
          );
        }
        render(<Demo />);
        const user = userEvent.setup();
        screen.getByRole("combobox").focus();
        await user.keyboard("{ArrowDown}{End}{Enter}");
        await waitFor(() =>
          expect(screen.getByRole("combobox")).toHaveTextContent("Beta"),
        );
        change.mockClear();
        await user.click(screen.getByRole("button", { name: "Reset" }));
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(screen.getByRole("combobox")).toHaveTextContent("Beta");
        expect(
          new FormData(screen.getByRole("form") as HTMLFormElement).get(
            "choice",
          ),
        ).toBe("b");
        expect(screen.getByTestId("state")).toHaveTextContent("b");
        expect(change).not.toHaveBeenCalled();
      });
    }
for (const controlled of [false, true])
  for (const external of [false, true]) {
    it(`retains successful reset (${controlled ? "controlled" : "uncontrolled"}, ${external ? "external" : "nested"})`, async () => {
      const change = vi.fn();
      function Demo() {
        const [value, setValue] = useState("a");
        const select = (
          <Select
            aria-label="Choice"
            name="choice"
            form={external ? "choices" : undefined}
            value={controlled ? value : undefined}
            defaultValue="a"
            onValueChange={(next) => {
              change(next);
              setValue(next);
            }}
            options={options}
          />
        );
        return (
          <SystemProvider>
            <form id="choices" aria-label="Choices">
              {!external && select}
              <Button type="reset">Reset</Button>
            </form>
            {external && select}
            <output data-testid="state">{value}</output>
          </SystemProvider>
        );
      }
      render(<Demo />);
      const user = userEvent.setup();
      screen.getByRole("combobox").focus();
      await user.keyboard("{ArrowDown}{End}{Enter}");
      await waitFor(() =>
        expect(screen.getByRole("combobox")).toHaveTextContent("Beta"),
      );
      change.mockClear();
      await user.click(screen.getByRole("button", { name: "Reset" }));
      await waitFor(() =>
        expect(screen.getByRole("combobox")).toHaveTextContent("Alpha"),
      );
      expect(
        new FormData(screen.getByRole("form") as HTMLFormElement).get("choice"),
      ).toBe("a");
      expect(screen.getByTestId("state")).toHaveTextContent("a");
      expect(change).toHaveBeenCalledExactlyOnceWith("a");
    });
  }
for (const external of [false, true]) {
  it(`does not move focus for static checkValidity (${external ? "external" : "nested"})`, async () => {
    const select = (
      <Select
        aria-label="Required"
        required
        name="choice"
        form={external ? "choices" : undefined}
        options={options}
      />
    );
    render(
      <SystemProvider>
        <button>Anchor</button>
        <form id="choices" aria-label="Choices">
          {!external && select}
        </form>
        {external && select}
      </SystemProvider>,
    );
    const anchor = screen.getByRole("button", { name: "Anchor" });
    anchor.focus();
    expect((screen.getByRole("form") as HTMLFormElement).checkValidity()).toBe(
      false,
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(anchor).toHaveFocus();
  });
}
for (const cancellation of ["onInvalid", "onInvalidCapture"] as const) {
  it(`respects application ${cancellation} cancellation and summary focus`, async () => {
    render(
      <SystemProvider>
        <div
          {...{
            [cancellation]: (event: React.FormEvent) => {
              event.preventDefault();
              screen.getByRole("button", { name: "Summary" }).focus();
            },
          }}
        >
          <button>Summary</button>
          <form aria-label="Choices">
            <Select
              aria-label="Required"
              required
              name="choice"
              options={options}
            />
          </form>
        </div>
      </SystemProvider>,
    );
    fireEvent.invalid(document.querySelector("select")!);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(screen.getByRole("button", { name: "Summary" })).toHaveFocus();
  });
}
