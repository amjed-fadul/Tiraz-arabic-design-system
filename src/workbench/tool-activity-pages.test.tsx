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
    const ai = within(screen.getByRole("navigation", { name: "المكوّنات" }));
    // The parts are folded until their disclosure opens.
    await user.click(ai.getByRole("button", { name: "استدعاء الأداة" }));
    if (en === "ToolChips")
      await user.click(screen.getByRole("link", { name: ar }));
    expect(screen.getByRole("heading", { level: 1, name: ar })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByRole("heading", { level: 1, name: en })).toBeVisible();
    // The playground frame is the only stage; its run replaces the old demo.
    for (const name of ["Examples", "Usage example"])
      expect(screen.queryByRole("heading", { name })).toBeNull();
    expect(document.querySelectorAll(".tz-demo-frame")).toHaveLength(1);
    expect(screen.getByRole("tablist", { name: "View" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Customize" }));
    const inspector = within(
      screen.getByRole("complementary", { name: "Customize the preview" }),
    );
    await user.click(inspector.getByRole("switch", { name: control }));
    await user.click(screen.getByRole("tab", { name: "Code" }));
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
it("retries a failed save in the tool-call playground until it completes, with the switcher following, and replays the run", async () => {
  vi.useFakeTimers();
  persist(storageKeys.documentation, { language: "ar", active: "tool-call" });
  render(<Workbench />);
  const stage = () =>
    screen.getByRole("region", { name: "المعاينة التفاعلية" });
  const save = () =>
    within(stage())
      .getByText("حفظ الملخص في Drive")
      .closest(".tz-tool-call") as HTMLElement;
  const states = within(screen.getByRole("group", { name: "حالات المثال" }));
  const pressed = () =>
    states
      .getAllByRole("button")
      .filter((button) => button.getAttribute("aria-pressed") === "true")
      .map((button) => button.textContent);
  // The page rests on Done; Failed shows the save that can be retried.
  expect(save()).toHaveAttribute("data-state", "completed");
  fireEvent.click(states.getByRole("button", { name: "تعثّر" }));
  expect(save()).toHaveAttribute("data-state", "failed");
  const trigger = within(save()).getByRole("button", { expanded: true });
  fireEvent.click(
    within(save()).getByRole("button", { name: "إعادة المحاولة" }),
  );
  expect(save()).toHaveAttribute("data-state", "running");
  expect(pressed()).toEqual(["يعمل"]);
  expect(trigger).toHaveFocus();
  expect(
    within(save()).queryByRole("button", { name: "إعادة المحاولة" }),
  ).toBeNull();
  await act(async () => vi.advanceTimersByTime(1199));
  expect(save()).toHaveAttribute("data-state", "running");
  await act(async () => vi.advanceTimersByTime(1));
  expect(save()).toHaveAttribute("data-state", "completed");
  expect(pressed()).toEqual(["اكتمل"]);
  expect(save()).toHaveTextContent(
    "حُفظ الملف في Finance/2026/october-summary.md",
  );
  expect(save()).toHaveTextContent("١٫٢ث");
  // Replay plays the save from waiting to done.
  fireEvent.click(screen.getByRole("button", { name: "إعادة تشغيل المثال" }));
  expect(save()).toHaveAttribute("data-state", "pending");
  await act(async () => vi.advanceTimersByTime(1000));
  expect(save()).toHaveAttribute("data-state", "running");
  await act(async () => vi.advanceTimersByTime(1200));
  expect(save()).toHaveAttribute("data-state", "completed");
});
function chips(container: HTMLElement) {
  return Array.from(container.querySelectorAll(".tz-tool-chip"), (chip) => [
    chip.querySelector(".tz-status-icon")?.getAttribute("data-state"),
    chip.querySelector(".tz-tool-count")?.textContent ?? null,
  ]);
}
it("opens the tool-chips playground on Done, counting the finished read, and replays the run", async () => {
  vi.useFakeTimers();
  persist(storageKeys.documentation, { language: "en", active: "tool-chips" });
  render(<Workbench />);
  const stage = () =>
    screen.getByRole("region", { name: "Interactive playground" });
  expect(
    within(stage()).getByRole("list", { name: "Tool activity" }),
  ).toBeVisible();
  const done = [
    ["completed", "3"],
    ["completed", null],
    ["completed", null],
    ["completed", null],
  ];
  expect(chips(stage())).toEqual(done);
  // Nothing autoplays: the page is complete at rest.
  await act(async () => vi.advanceTimersByTime(5000));
  expect(chips(stage())).toEqual(done);
  fireEvent.click(screen.getByRole("button", { name: "Replay example" }));
  expect(chips(stage())).toEqual([
    ["completed", "3"],
    ["running", null],
    ["running", null],
    ["pending", null],
  ]);
  await act(async () => vi.advanceTimersByTime(1800));
  expect(chips(stage())).toEqual(done);
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
