import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it } from "vitest";
import { SystemProvider, TaskStarter, defaultConfig } from "./index";
import type { ContextItem, TaskStarterProps } from "./index";

// The host owns the draft and the context. These submit handlers are plain
// functions, so each can see how many arguments it was called with.
function Host({
  onSubmit,
  context,
}: Pick<TaskStarterProps, "onSubmit" | "context">) {
  const [value, setValue] = useState("Prepare the October close");
  return (
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      <TaskStarter
        value={value}
        onValueChange={setValue}
        onSubmit={onSubmit}
        context={context}
      />
    </SystemProvider>
  );
}

it("accepts onSubmit(value) without the context argument", async () => {
  const user = userEvent.setup();
  const seen: string[] = [];
  // This form typechecks against the prop, with no second parameter.
  const onSubmit: TaskStarterProps["onSubmit"] = (value: string) => {
    seen.push(value);
  };
  render(<Host onSubmit={onSubmit} />);
  await user.click(screen.getByRole("textbox"));
  await user.keyboard("{Enter}");
  expect(seen).toEqual(["Prepare the October close"]);
});

it("types the draft when the handler is written inline, and accepts an async one", async () => {
  const user = userEvent.setup();
  const seen: number[] = [];
  render(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      <TaskStarter
        value="  Close  "
        onValueChange={() => {}}
        // `value` is a string here without any annotation.
        onSubmit={async (value) => {
          seen.push(value.trim().length);
        }}
      />
    </SystemProvider>,
  );
  await user.click(screen.getByRole("textbox"));
  await user.keyboard("{Enter}");
  expect(seen).toEqual([5]);
});

it("still hands the existing two-argument form a copy of the context", async () => {
  const user = userEvent.setup();
  const context: ContextItem[] = [
    { id: "inv-1043", label: "INV-1043", kind: "Invoice" },
  ];
  const calls: [string, ContextItem[]][] = [];
  render(
    <Host
      context={context}
      onSubmit={(value, attached) => {
        calls.push([value, attached]);
      }}
    />,
  );
  await user.click(screen.getByRole("textbox"));
  await user.keyboard("{Enter}");
  expect(calls).toHaveLength(1);
  expect(calls[0][0]).toBe("Prepare the October close");
  expect(calls[0][1]).toEqual(context);
  expect(calls[0][1]).not.toBe(context);
});

it("keeps checking the draft parameter at compile time", () => {
  // @ts-expect-error the first argument is the draft text, not a number
  const wrong: TaskStarterProps["onSubmit"] = (value: number) => {
    void value;
  };
  expect(wrong).toBeTypeOf("function");
});
