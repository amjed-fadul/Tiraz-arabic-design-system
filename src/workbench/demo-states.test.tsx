import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import type { ComponentId } from "./catalog";
import { demoStates, stateWords } from "./demo-states";
import { persist, storageKeys } from "./storage";
import { ToolChipsExample } from "../system/ai/examples/ToolActivityExamples";
import { SystemProvider, defaultConfig } from "../system";
afterEach(() => vi.useRealTimers());

const word = (key: keyof typeof stateWords) => stateWords[key][0];
function open(active: ComponentId) {
  persist(storageKeys.documentation, { language: "ar", active });
  return render(<Workbench />);
}
const states = () =>
  within(screen.getByRole("group", { name: "حالات المثال" }));
const pressed = () =>
  states()
    .getAllByRole("button")
    .filter((button) => button.getAttribute("aria-pressed") === "true")
    .map((button) => button.textContent);
const rail = () =>
  within(screen.getByRole("complementary", { name: "التخصيص" }));
const stage = () =>
  within(screen.getByRole("region", { name: "المعاينة التفاعلية" }));
const stateSelect = () => rail().getByRole("combobox", { name: "الحالة" });
const frameStatus = () =>
  document.querySelector(".tz-demo-frame [role='status']") as HTMLElement;
const wait = (ms: number) => act(async () => vi.advanceTimersByTime(ms));
function chips(container: HTMLElement = document.body) {
  return Array.from(container.querySelectorAll(".tz-tool-chip"), (chip) => [
    chip.querySelector(".tz-status-icon")?.getAttribute("data-state"),
    chip.querySelector(".tz-tool-count")?.textContent ?? null,
  ]);
}
// Counts follow the page's digits: Arabic-Indic on an Arabic page.
const chipsRunning = (three = "٣") => [
  ["completed", three],
  ["running", null],
  ["running", null],
  ["pending", null],
];
const chipsDone = [
  ["completed", "٣"],
  ["completed", null],
  ["completed", null],
  ["completed", null],
];

it.each([
  ["button", ["idle", "loading", "success", "error", "disabled"], "idle"],
  ["sheet", ["closed", "open"], "closed"],
  ["terminal", ["running", "done", "failed"], "done"],
  ["tool-chips", ["running", "done"], "done"],
] as const)(
  "opens each pilot page on its resting state: %s",
  (active, list, resting) => {
    open(active);
    expect(
      states()
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(list.map(word));
    expect(pressed()).toEqual([word(resting)]);
  },
);

it("applies a props state through the inspector path", async () => {
  vi.useFakeTimers();
  open("button");
  fireEvent.click(states().getByRole("button", { name: word("loading") }));
  expect(stateSelect()).toHaveValue("loading");
  expect(pressed()).toEqual([word("loading")]);
  expect(stage().getByRole("button")).toHaveAttribute("aria-busy", "true");
  // The choice persists with the page's other props.
  expect(
    JSON.parse(localStorage.getItem(storageKeys.playgrounds)!).button,
  ).toMatchObject({ state: "loading", disabled: false });
  fireEvent.click(states().getByRole("button", { name: word("disabled") }));
  expect(stateSelect()).toHaveValue("disabled");
  expect(stage().getByRole("button")).toBeDisabled();
  // Like an inspector edit, a press cancels the simulated click in flight.
  fireEvent.click(states().getByRole("button", { name: word("idle") }));
  fireEvent.click(stage().getByRole("button"));
  expect(stage().getByRole("button")).toHaveAttribute("aria-busy", "true");
  fireEvent.click(states().getByRole("button", { name: word("error") }));
  await wait(3000);
  expect(stage().getByRole("button")).toHaveAttribute("data-state", "error");
});

it("follows the model when the inspector edits a prop", async () => {
  const user = userEvent.setup();
  open("button");
  await user.click(states().getByRole("button", { name: word("loading") }));
  // Editing another prop keeps the state the model is in.
  await user.selectOptions(rail().getByLabelText("الحجم"), "md");
  expect(pressed()).toEqual([word("loading")]);
  await user.selectOptions(stateSelect(), "success");
  expect(pressed()).toEqual([word("success")]);
  await user.selectOptions(stateSelect(), "disabled");
  expect(pressed()).toEqual([word("disabled")]);
  await user.selectOptions(stateSelect(), "idle");
  expect(pressed()).toEqual([word("idle")]);
});

it("holds a phase until it is changed", async () => {
  vi.useFakeTimers();
  open("tool-chips");
  expect(chips()).toEqual(chipsDone);
  fireEvent.click(states().getByRole("button", { name: word("running") }));
  expect(pressed()).toEqual([word("running")]);
  expect(chips()).toEqual(chipsRunning());
  await wait(10000);
  expect(pressed()).toEqual([word("running")]);
  expect(chips()).toEqual(chipsRunning());
  fireEvent.click(states().getByRole("button", { name: word("done") }));
  expect(pressed()).toEqual([word("done")]);
  expect(chips()).toEqual(chipsDone);
  // Opening the page again starts from its resting phase.
  fireEvent.click(states().getByRole("button", { name: word("running") }));
  const nav = within(screen.getByRole("navigation", { name: "المكوّنات" }));
  fireEvent.click(nav.getByRole("button", { name: "الأزرار" }));
  fireEvent.click(nav.getByRole("button", { name: "ملخص الأدوات" }));
  expect(pressed()).toEqual([word("done")]);
  expect(chips()).toEqual(chipsDone);
});

it("lets phase and props states share a page", () => {
  // A family that mixes both kinds and rests on a phase.
  const saved = demoStates.terminal;
  demoStates.terminal = {
    states: [
      { id: "thinking", label: stateWords.thinking, phase: "thinking" },
      { id: "done", label: stateWords.done, phase: "done" },
      { id: "failed", label: stateWords.failed, props: { state: "failed" } },
    ],
    resting: "thinking",
  };
  try {
    open("terminal");
    expect(pressed()).toEqual([word("thinking")]);
    // A props state replaces the resting phase...
    fireEvent.click(states().getByRole("button", { name: word("failed") }));
    expect(pressed()).toEqual([word("failed")]);
    // ...and a phase pressed before it.
    fireEvent.click(states().getByRole("button", { name: word("done") }));
    expect(pressed()).toEqual([word("done")]);
    fireEvent.click(states().getByRole("button", { name: word("failed") }));
    expect(pressed()).toEqual([word("failed")]);
  } finally {
    demoStates.terminal = saved;
  }
});

it("plays Replay in order", async () => {
  vi.useFakeTimers();
  open("button");
  fireEvent.click(states().getByRole("button", { name: word("error") }));
  const replay = screen.getByRole("button", { name: "إعادة تشغيل المثال" });
  replay.focus();
  fireEvent.click(replay);
  // Each step applies its state, then waits; the steps are not announced.
  expect(pressed()).toEqual([word("idle")]);
  expect(stateSelect()).toHaveValue("idle");
  expect(frameStatus()).toBeEmptyDOMElement();
  await wait(799);
  expect(pressed()).toEqual([word("idle")]);
  await wait(1);
  expect(pressed()).toEqual([word("loading")]);
  expect(stateSelect()).toHaveValue("loading");
  expect(frameStatus()).toBeEmptyDOMElement();
  await wait(1200);
  expect(pressed()).toEqual([word("success")]);
  expect(stateSelect()).toHaveValue("success");
  expect(frameStatus()).toBeEmptyDOMElement();
  await wait(1000);
  // It ends on the last step and says it once.
  expect(pressed()).toEqual([word("success")]);
  expect(frameStatus()).toHaveTextContent(`الحالة: ${word("success")}`);
  expect(vi.getTimerCount()).toBe(0);
  expect(replay).toHaveFocus();
});

it("cancels replay on state press, Code view, page change and unmount", async () => {
  vi.useFakeTimers();
  const view = open("button");
  const replay = () =>
    fireEvent.click(screen.getByRole("button", { name: "إعادة تشغيل المثال" }));
  const nav = within(screen.getByRole("navigation", { name: "المكوّنات" }));
  // A state press: the pressed state wins and nothing fires afterwards.
  replay();
  await wait(800);
  expect(stateSelect()).toHaveValue("loading");
  fireEvent.click(states().getByRole("button", { name: word("error") }));
  expect(vi.getTimerCount()).toBe(0);
  await wait(5000);
  expect(stateSelect()).toHaveValue("error");
  expect(pressed()).toEqual([word("error")]);
  // The Code view: it stops on the step it reached.
  replay();
  await wait(800);
  fireEvent.click(screen.getByRole("tab", { name: "الكود" }));
  expect(vi.getTimerCount()).toBe(0);
  await wait(5000);
  expect(stateSelect()).toHaveValue("loading");
  fireEvent.click(screen.getByRole("tab", { name: "معاينة" }));
  // A page change.
  replay();
  await wait(800);
  fireEvent.click(nav.getByRole("button", { name: "الطرفية" }));
  // jsdom queues a toggle task for the new page's inspector; let it run.
  await wait(0);
  expect(vi.getTimerCount()).toBe(0);
  await wait(5000);
  fireEvent.click(nav.getByRole("button", { name: "الأزرار" }));
  expect(stateSelect()).toHaveValue("loading");
  expect(frameStatus()).toBeEmptyDOMElement();
  // Unmounting leaves no timers behind.
  replay();
  await wait(800);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("returns focus to the Open state after the sheet closes", async () => {
  const user = userEvent.setup();
  open("sheet");
  const openState = states().getByRole("button", { name: word("open") });
  await user.click(openState);
  const dialog = await screen.findByRole("dialog", { name: "تفاصيل العميل" });
  // Opening moves focus into the dialog.
  await waitFor(() =>
    expect(dialog).toContainElement(document.activeElement as HTMLElement),
  );
  expect(openState).toHaveAttribute("aria-pressed", "true");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  // Closing reports Closed, and focus lands on the state that opened it.
  expect(pressed()).toEqual([word("closed")]);
  await waitFor(() => expect(openState).toHaveFocus());
  await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
  expect(openState).toHaveFocus();
});

it("runs as before without a phase", async () => {
  vi.useFakeTimers();
  const { container } = render(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      <ToolChipsExample language="en" counts />
    </SystemProvider>,
  );
  expect(chips(container)).toEqual([
    ["running", null],
    ["pending", null],
    ["pending", null],
    ["pending", null],
  ]);
  await wait(900);
  expect(chips(container)).toEqual([
    ["completed", "3"],
    ["running", null],
    ["pending", null],
    ["pending", null],
  ]);
  await wait(800);
  expect(chips(container)).toEqual(chipsRunning("3"));
  await wait(900);
  // Its own run still ends on a failed save, counted.
  expect(chips(container)).toEqual([
    ["completed", "3"],
    ["running", null],
    ["failed", "1"],
    ["pending", null],
  ]);
  expect(vi.getTimerCount()).toBe(0);
});

it("puts the demo before the prompt", () => {
  const { container } = open("button");
  expect(
    Array.from(
      container.querySelectorAll(".component-page > section"),
      (section) => section.className,
    ),
  ).toEqual(["playground-section", "agent-section", "reference-section"]);
  // The kicker names the page's group; the frame carries both names.
  expect(container.querySelector(".component-kicker")?.textContent).toBe(
    "النماذج",
  );
  const frame = container.querySelector(".tz-demo-frame") as HTMLElement;
  expect(within(frame).getByText("الأزرار")).toHaveAttribute("lang", "ar");
  expect(within(frame).getByText("Button")).toHaveAttribute("lang", "en");
});
