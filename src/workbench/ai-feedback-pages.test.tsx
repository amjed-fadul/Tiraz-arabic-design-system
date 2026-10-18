import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { persist, storageKeys } from "./storage";
afterEach(() => vi.useRealTimers());
it.each([
  ["حالة التحميل", "LoadingState", "Variant", "orbit"],
  ["مؤشر النشاط", "ThinkingIndicator", "Label", "Preparing sample"],
  ["حالة النشاط", "ThinkingState", "Active", null],
])(
  "documents %s with contextual controls and portable copied code",
  async (ar, en, control, value) => {
    const user = userEvent.setup();
    render(<Workbench />);
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    await user.click(
      within(
        screen.getByRole("group", { name: "أنماط الذكاء الاصطناعي" }),
      ).getByRole("button", { name: ar }),
    );
    expect(screen.getByRole("heading", { name: ar, level: 1 })).toBeVisible();
    // The playground is the only stage; the step-by-step run plays there.
    expect(screen.queryByRole("heading", { name: "أمثلة" })).toBeNull();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "لغة التوثيق" }),
      "en",
    );
    expect(screen.getByRole("heading", { name: en, level: 1 })).toBeVisible();
    const rail = within(
      screen.getByRole("complementary", { name: "Customization" }),
    );
    if (en === "LoadingState")
      await user.selectOptions(
        rail.getByRole("combobox", { name: control }),
        value!,
      );
    else if (en === "ThinkingIndicator") {
      await user.clear(rail.getByRole("textbox", { name: control }));
      await user.type(rail.getByRole("textbox", { name: control }), value!);
    } else await user.click(rail.getByRole("switch", { name: control }));
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    const code = String(copy.mock.calls.at(-1)?.[0]);
    expect(code).toContain(en + "Example");
    expect(code).not.toContain("workbench/");
    expect(code).toContain(
      en === "LoadingState"
        ? '"variant":"orbit"'
        : en === "ThinkingIndicator"
          ? '"label":"Preparing sample"'
          : '"active":false',
    );
    await user.click(screen.getByRole("button", { name: "Copy agent prompt" }));
    expect(String(copy.mock.calls.at(-1)?.[0])).toContain(code);
  },
);
it("reveals the thinking steps in the playground as the work moves on, and replays from the start", async () => {
  vi.useFakeTimers();
  persist(storageKeys.documentation, {
    language: "en",
    active: "thinking-state",
  });
  const { container } = render(<Workbench />);
  const stage = within(
    screen.getByRole("region", { name: "Interactive playground" }),
  );
  const steps = () =>
    Array.from(
      container.querySelectorAll(".playground-canvas .tz-thinking-steps li"),
      (step) => step.textContent,
    );
  expect(stage.getByRole("button", { name: "Reading invoices" })).toBeVisible();
  expect(steps()).toEqual(["Read 217 invoices from Madar"]);
  await act(async () => vi.advanceTimersByTime(1300));
  expect(stage.getByRole("button", { name: "Matching totals" })).toBeVisible();
  expect(steps()).toHaveLength(2);
  await act(async () => vi.advanceTimersByTime(1300));
  expect(
    stage.getByRole("button", { name: "Preparing summary" }),
  ).toBeVisible();
  expect(steps()).toEqual([
    "Read 217 invoices from Madar",
    "Match totals against purchase orders",
    "Draft a summary of the differences",
  ]);
  fireEvent.click(screen.getByRole("button", { name: "Replay example" }));
  expect(stage.getByRole("button", { name: "Reading invoices" })).toBeVisible();
  expect(steps()).toHaveLength(1);
  // Inactive shows the finished run.
  fireEvent.click(
    within(
      screen.getByRole("complementary", { name: "Customization" }),
    ).getByRole("switch", { name: "Active" }),
  );
  expect(stage.getByRole("button", { name: "Summary ready" })).toBeVisible();
  expect(steps()).toHaveLength(3);
});
