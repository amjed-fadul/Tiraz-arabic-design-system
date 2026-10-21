import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { persist, storageKeys } from "./storage";
import { defaultPlaygrounds, normalizePlaygrounds } from "./model";
import { generateCode, generatePrompt } from "./generate";
import { defaultConfig } from "../system";
afterEach(() => vi.useRealTimers());
it.each([
  ["steps", "الخطوات", "Steps", "التنقّل"],
  ["timeline", "الخط الزمني", "Timeline", "البيانات"],
] as const)(
  "documents %s in its group with continuous examples, synchronized code and full prompt",
  async (id, ar, en, group) => {
    const user = userEvent.setup();
    render(<Workbench />);
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    await user.click(
      within(
        within(screen.getByRole("navigation", { name: "المكوّنات" })).getByRole(
          "group",
          { name: group },
        ),
      ).getByRole("button", { name: ar }),
    );
    expect(screen.getByRole("heading", { name: ar, level: 1 })).toBeVisible();
    // The playground frame is the only stage and carries the code.
    for (const name of ["مثال الاستخدام", "أمثلة"])
      expect(screen.queryByRole("heading", { name })).toBeNull();
    expect(
      screen.getByRole("tablist", { name: "طريقة العرض" }),
    ).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "لغة التوثيق" }),
      "en",
    );
    expect(screen.getByRole("heading", { name: en, level: 1 })).toBeVisible();
    if (id === "steps") {
      await user.selectOptions(
        screen.getByRole("combobox", { name: "Orientation" }),
        "vertical",
      );
      await user.selectOptions(
        screen.getByRole("combobox", { name: "Current state" }),
        "error",
      );
    }
    await user.click(screen.getByRole("tab", { name: "Code" }));
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    const code = String(copy.mock.calls.at(-1)?.[0]);
    expect(code).toContain(`${en}Example`);
    expect(code).not.toContain("workbench/");
    if (id === "steps") {
      expect(code).toContain('"orientation":"vertical"');
      expect(code).toContain('"currentState":"error"');
      // Only the stages the preview shows; the form flow is not rendered.
      expect(code).not.toContain("<StepsFormExample");
    }
    await user.click(screen.getByRole("button", { name: "Copy agent prompt" }));
    const prompt = String(copy.mock.calls.at(-1)?.[0]);
    expect(prompt).toContain(code);
    expect(prompt).toContain("ai/README.md");
    const model = defaultPlaygrounds("en")[id];
    expect(generatePrompt(id, model, defaultConfig, "en")).toContain(
      generateCode(id, model, defaultConfig, "en"),
    );
  },
);
it("moves through the steps playground with Back, Next and the stages, and replays Start to Complete", async () => {
  persist(storageKeys.documentation, { language: "en", active: "steps" });
  const user = userEvent.setup();
  render(<Workbench />);
  const rail = within(
    screen.getByRole("complementary", { name: "Customization" }),
  );
  await user.selectOptions(
    rail.getByRole("combobox", { name: "Orientation" }),
    "vertical",
  );
  await user.selectOptions(
    rail.getByRole("combobox", { name: "Current state" }),
    "error",
  );
  const stage = () =>
    within(screen.getByRole("region", { name: "Interactive playground" }));
  const statuses = () =>
    Array.from(
      stage()
        .getByRole("list", { name: "Application stages" })
        .querySelectorAll(".tz-step"),
      (step) => step.getAttribute("data-status"),
    );
  // Starts on the second stage, styled by the panel's current state.
  expect(statuses()).toEqual(["completed", "error", "upcoming"]);
  await user.click(stage().getByRole("button", { name: "Next" }));
  expect(statuses()).toEqual(["completed", "completed", "error"]);
  await user.click(stage().getByRole("button", { name: "Finish" }));
  expect(stage().getByRole("status")).toHaveTextContent(
    "All stages are complete.",
  );
  expect(stage().queryByRole("button", { name: /Next|Finish/ })).toBeNull();
  await user.click(stage().getByRole("button", { name: /^Information/ }));
  expect(statuses()).toEqual(["error", "upcoming", "upcoming"]);
  expect(stage().getByRole("button", { name: "Back" })).toBeDisabled();
  // Replay plays the page's own states from Start, whatever the panel held;
  // the rest of the panel stays.
  vi.useFakeTimers();
  fireEvent.click(screen.getByRole("button", { name: "Replay example" }));
  expect(statuses()).toEqual(["current", "upcoming", "upcoming"]);
  expect(rail.getByRole("combobox", { name: "Current state" })).toHaveValue(
    "current",
  );
  await act(async () => vi.advanceTimersByTime(1400));
  expect(statuses()).toEqual(["completed", "current", "upcoming"]);
  await act(async () => vi.advanceTimersByTime(1400));
  expect(stage().getByRole("status")).toHaveTextContent(
    "All stages are complete.",
  );
  expect(rail.getByRole("combobox", { name: "Orientation" })).toHaveValue(
    "vertical",
  );
});
it("normalizes persisted sequence options against the real enums", () => {
  const p = normalizePlaygrounds(
    { steps: { orientation: "diagonal", currentState: "saving" } },
    "en",
  );
  expect(p.steps).toEqual(defaultPlaygrounds("en").steps);
});
