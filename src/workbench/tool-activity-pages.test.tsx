import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { persist, storageKeys } from "./storage";
import { ToolChipsExample } from "../system/ai/examples/ToolActivityExamples";
import { SystemProvider, defaultConfig } from "../system";
afterEach(() => vi.useRealTimers());
it.each([
  ["استدعاء الأداة", "ToolCall", "Long output"],
  ["ملخص الأدوات", "ToolChips", "Counts"],
])(
  "documents %s with portable copied code and a live playground",
  async (ar, en, control) => {
    const user = userEvent.setup();
    render(<Workbench />);
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    await user.click(
      within(
        screen.getByRole("group", { name: "أنماط الذكاء الاصطناعي" }),
      ).getByRole("button", { name: ar }),
    );
    expect(screen.getByRole("heading", { level: 1, name: ar })).toBeVisible();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "لغة التوثيق" }),
      "en",
    );
    expect(screen.getByRole("heading", { level: 1, name: en })).toBeVisible();
    // The playground frame is the only stage; its run replaces the old demo.
    for (const name of ["Examples", "Usage example"])
      expect(screen.queryByRole("heading", { name })).toBeNull();
    expect(document.querySelectorAll(".tz-demo-frame")).toHaveLength(1);
    expect(screen.getByRole("tablist", { name: "View" })).toBeVisible();
    const inspector = within(
      screen.getByRole("complementary", { name: "Customization" }),
    );
    await user.click(inspector.getByRole("switch", { name: control }));
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    const code = String(copy.mock.calls.at(-1)?.[0]);
    expect(code).toContain(en + "Example");
    expect(code).toContain("ToolActivityDemo");
    expect(code).not.toContain("workbench/");
    expect(code).toContain(
      en === "ToolCall" ? '"longContent":true' : '"counts":false',
    );
    await user.click(screen.getByRole("button", { name: "Copy agent prompt" }));
    expect(String(copy.mock.calls.at(-1)?.[0])).toContain(code);
  },
);
it("retries the failed save in the tool-call playground until it completes, and replays the failure", async () => {
  vi.useFakeTimers();
  persist(storageKeys.documentation, { language: "ar", active: "tool-call" });
  render(<Workbench />);
  const stage = () =>
    screen.getByRole("region", { name: "المعاينة التفاعلية" });
  const save = () =>
    within(stage())
      .getByText("حفظ الملخص في Drive")
      .closest(".tz-tool-call") as HTMLElement;
  expect(save()).toHaveAttribute("data-state", "failed");
  const trigger = within(save()).getByRole("button", { expanded: true });
  fireEvent.click(
    within(save()).getByRole("button", { name: "إعادة المحاولة" }),
  );
  expect(save()).toHaveAttribute("data-state", "running");
  expect(trigger).toHaveFocus();
  expect(
    within(save()).queryByRole("button", { name: "إعادة المحاولة" }),
  ).toBeNull();
  await act(async () => vi.advanceTimersByTime(1199));
  expect(save()).toHaveAttribute("data-state", "running");
  await act(async () => vi.advanceTimersByTime(1));
  expect(save()).toHaveAttribute("data-state", "completed");
  expect(save()).toHaveTextContent(
    "حُفظ الملف في Finance/2026/october-summary.md",
  );
  expect(save()).toHaveTextContent("1.2s");
  fireEvent.click(screen.getByRole("button", { name: "إعادة تشغيل المثال" }));
  expect(save()).toHaveAttribute("data-state", "failed");
  expect(
    within(save()).getByRole("button", { name: "إعادة المحاولة" }),
  ).toBeVisible();
});
function chips(container: HTMLElement) {
  return Array.from(container.querySelectorAll(".tz-tool-chip"), (chip) => [
    chip.querySelector(".tz-tool-status")?.getAttribute("data-state"),
    chip.querySelector(".tz-tool-count")?.textContent ?? null,
  ]);
}
it("runs the tool-chips playground once, counting only finished reads and failed saves", async () => {
  vi.useFakeTimers();
  persist(storageKeys.documentation, { language: "en", active: "tool-chips" });
  render(<Workbench />);
  const stage = () =>
    screen.getByRole("region", { name: "Interactive playground" });
  expect(
    within(stage()).getByRole("list", { name: "Tool activity" }),
  ).toBeVisible();
  expect(chips(stage())).toEqual([
    ["running", null],
    ["pending", null],
    ["pending", null],
    ["pending", null],
  ]);
  await act(async () => vi.advanceTimersByTime(900));
  expect(chips(stage())).toEqual([
    ["completed", "3"],
    ["running", null],
    ["pending", null],
    ["pending", null],
  ]);
  await act(async () => vi.advanceTimersByTime(800));
  expect(chips(stage())).toEqual([
    ["completed", "3"],
    ["running", null],
    ["running", null],
    ["pending", null],
  ]);
  await act(async () => vi.advanceTimersByTime(900));
  const final = [
    ["completed", "3"],
    ["running", null],
    ["failed", "1"],
    ["pending", null],
  ];
  expect(chips(stage())).toEqual(final);
  await act(async () => vi.advanceTimersByTime(5000));
  expect(chips(stage())).toEqual(final);
  fireEvent.click(screen.getByRole("button", { name: "Replay example" }));
  expect(chips(stage())[0]).toEqual(["running", null]);
});
it("shows the final tool-chips state at once under reduced motion", () => {
  vi.useFakeTimers();
  const { container } = render(
    <SystemProvider
      config={{ ...defaultConfig, direction: "ltr", reducedMotion: true }}
    >
      <ToolChipsExample language="en" counts />
    </SystemProvider>,
  );
  expect(chips(container)).toEqual([
    ["completed", "3"],
    ["running", null],
    ["failed", "1"],
    ["pending", null],
  ]);
  expect(vi.getTimerCount()).toBe(0);
});
