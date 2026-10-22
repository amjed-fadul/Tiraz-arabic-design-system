import { useState } from "react";
import type { FormEvent } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Button, Select, SystemProvider } from "./index";

for (const controlled of [false, true])
  for (const lifecycle of ["replace", "late", "retain"])
    for (const cancel of ["none", "bubble", "capture"])
      for (const method of ["reset", "click"]) {
        it(`follows ${lifecycle} external form: ${controlled ? "controlled" : "uncontrolled"}, ${cancel}, ${method}`, async () => {
          function Demo() {
            const [generation, setGeneration] = useState(
              lifecycle === "late" ? -1 : 0,
            );
            const [value, setValue] = useState("a");
            const [changes, setChanges] = useState<string[]>([]);
            const cancelReset = (event: FormEvent) => event.preventDefault();
            function form(version: number, previous = false) {
              return (
                <form
                  key={version}
                  id={previous ? "previous-choices" : "choices"}
                  onReset={cancel === "bubble" ? cancelReset : undefined}
                  onResetCapture={
                    cancel === "capture" ? cancelReset : undefined
                  }
                >
                  <Button type="reset">
                    {previous ? "Previous reset" : "Reset"}
                  </Button>
                </form>
              );
            }
            return (
              <SystemProvider>
                <Select
                  aria-label="Choice"
                  name="choice"
                  form="choices"
                  value={controlled ? value : undefined}
                  defaultValue="a"
                  options={[
                    { value: "a", label: "Alpha" },
                    { value: "b", label: "Beta" },
                  ]}
                  onValueChange={(next) => {
                    setValue(next);
                    setChanges((previous) => [...previous, next]);
                  }}
                />
                <Button
                  onClick={() => setGeneration((previous) => previous + 1)}
                >
                  Change form
                </Button>
                <Button onClick={() => setChanges([])}>Clear changes</Button>
                {lifecycle === "retain" && generation > 0 && form(0, true)}
                {generation >= 0 && form(generation)}
                <output data-testid="application">{value}</output>
                <output data-testid="changes">{JSON.stringify(changes)}</output>
              </SystemProvider>
            );
          }
          render(<Demo />);
          const user = userEvent.setup();
          const trigger = screen.getByRole("combobox");
          const previousForm = document.getElementById(
            "choices",
          ) as HTMLFormElement | null;
          trigger.focus();
          await user.keyboard("{ArrowDown}{End}{Enter}");
          await waitFor(() => expect(trigger).toHaveTextContent("Beta"));
          await user.click(
            screen.getByRole("button", { name: "Clear changes" }),
          );
          await user.click(screen.getByRole("button", { name: "Change form" }));
          expect(screen.getByRole("combobox")).toBe(trigger);
          const currentForm = document.getElementById(
            "choices",
          ) as HTMLFormElement;
          function assertValue(label: string, value: string, changes: string) {
            expect(trigger).toHaveTextContent(label);
            expect(
              document.querySelector<HTMLSelectElement>(
                'select[name="choice"]',
              )!.value,
            ).toBe(value);
            expect(new FormData(currentForm).get("choice")).toBe(value);
            expect(screen.getByTestId("application")).toHaveTextContent(value);
            expect(screen.getByTestId("changes")).toHaveTextContent(changes);
          }
          assertValue("Beta", "b", "[]");
          if (previousForm) {
            if (method === "reset") act(() => previousForm.reset());
            else if (previousForm.isConnected)
              await user.click(
                screen.getByRole("button", { name: "Previous reset" }),
              );
            else
              act(() =>
                previousForm
                  .querySelector<HTMLButtonElement>("button")!
                  .click(),
              );
            await act(async () => {
              await new Promise((resolve) => setTimeout(resolve, 10));
            });
            assertValue("Beta", "b", "[]");
          }
          if (method === "reset") act(() => currentForm.reset());
          else await user.click(screen.getByRole("button", { name: "Reset" }));
          await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
          });
          if (cancel === "none") assertValue("Alpha", "a", '["a"]');
          else assertValue("Beta", "b", "[]");
        });
      }
