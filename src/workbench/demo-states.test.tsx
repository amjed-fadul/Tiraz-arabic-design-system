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
import { defaultPlaygrounds } from "./model";
import { persist, readPlaygrounds, storageKeys } from "./storage";
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

// The states by DOM rather than role: an open dialog hides the page from
// assistive technology, but its state buttons are still the page's.
const stateButtons = () =>
  Array.from(
    document.querySelectorAll<HTMLButtonElement>(".tz-demo-states button"),
  );
const pressedWords = () =>
  stateButtons()
    .filter((button) => button.getAttribute("aria-pressed") === "true")
    .map((button) => button.textContent);
const press = (key: keyof typeof stateWords) =>
  fireEvent.click(stateButtons().find((b) => b.textContent === word(key))!);
const savedProps = (id: ComponentId) =>
  JSON.parse(localStorage.getItem(storageKeys.playgrounds)!)[id];
const text = expect.stringMatching(/\S/);
type WordKey = keyof typeof stateWords;
// Each page with its resting state, each state with what the model holds once
// it is pressed, and the Replay steps where the page has any.
type Family = {
  id: ComponentId;
  resting: WordKey;
  list: ReadonlyArray<readonly [WordKey, Record<string, unknown>]>;
  replay?: ReadonlyArray<WordKey>;
};
// What Open puts on the page: a dialog, or the menu.
const overlay = '[role="dialog"], [role="menu"]';
const textStates: Family["list"] = [
  ["empty", { value: "", error: "", disabled: false, readOnly: false }],
  ["filled", { value: text, error: "", disabled: false, readOnly: false }],
  ["invalid", { error: text, disabled: false, readOnly: false }],
  ["disabled", { disabled: true, readOnly: false }],
  ["readOnly", { disabled: false, readOnly: true }],
];
const overlayStates: Family["list"] = [
  ["closed", { open: false }],
  ["open", { mode: "controlled", open: true }],
];
const chartStates: Family["list"] = [
  ["data", { sample: "multi" }],
  ["empty", { sample: "empty" }],
];
const propsFamilies: Family[] = [
  { id: "input", resting: "filled", list: textStates },
  { id: "textarea", resting: "filled", list: textStates },
  {
    id: "select",
    resting: "selected",
    list: [
      ["empty", { value: "", invalid: false, disabled: false }],
      ["selected", { value: "active", invalid: false, disabled: false }],
      ["invalid", { invalid: true, disabled: false }],
      ["disabled", { disabled: true }],
    ],
  },
  {
    id: "checkbox",
    resting: "checked",
    list: [
      ["unchecked", { checked: false, error: "", disabled: false }],
      ["checked", { checked: true, error: "", disabled: false }],
      ["invalid", { error: text, disabled: false }],
      ["disabled", { disabled: true }],
    ],
  },
  {
    id: "radio-group",
    resting: "selected",
    list: [
      ["unselected", { value: "", error: "", disabled: false }],
      ["selected", { value: "weekly", error: "", disabled: false }],
      ["invalid", { value: "", error: text, disabled: false }],
      ["disabled", { disabled: true }],
    ],
  },
  {
    id: "switch",
    resting: "on",
    list: [
      ["off", { checked: false, disabled: false }],
      ["on", { checked: true, disabled: false }],
      ["disabled", { disabled: true }],
    ],
  },
  {
    id: "slider",
    resting: "default",
    list: [
      ["default", { disabled: false }],
      ["disabled", { disabled: true }],
    ],
  },
  {
    id: "sidebar",
    resting: "expanded",
    list: [
      ["expanded", { mode: "controlled", collapsed: false }],
      ["collapsed", { mode: "controlled", collapsed: true }],
    ],
  },
  {
    id: "pagination",
    resting: "middle",
    list: [
      ["first", { page: 1 }],
      ["middle", { page: 6 }],
      ["last", { page: 12 }],
    ],
  },
  {
    id: "data-table",
    resting: "loaded",
    list: [
      ["loaded", { preset: "populated" }],
      ["loading", { preset: "loading" }],
      ["empty", { preset: "empty" }],
    ],
  },
  {
    id: "avatar",
    resting: "photo",
    list: [
      ["photo", { appearance: "photo" }],
      ["initials", { appearance: "initials" }],
    ],
  },
  {
    id: "progress",
    resting: "determinate",
    list: [
      ["determinate", { indeterminate: false, value: 64 }],
      ["indeterminate", { indeterminate: true }],
      ["complete", { indeterminate: false, value: 100 }],
    ],
    replay: ["determinate", "complete"],
  },
  { id: "dropdown", resting: "closed", list: overlayStates },
  { id: "sheet", resting: "closed", list: overlayStates },
  { id: "modal", resting: "closed", list: overlayStates },
  { id: "line-chart", resting: "data", list: chartStates },
  { id: "area-chart", resting: "data", list: chartStates },
  { id: "bar-chart", resting: "data", list: chartStates },
  { id: "donut-chart", resting: "data", list: chartStates },
  {
    id: "context-meter",
    resting: "normal",
    list: [
      ["normal", { preset: "normal" }],
      ["high", { preset: "high" }],
      ["near", { preset: "near" }],
      ["over", { preset: "over" }],
    ],
  },
  {
    id: "image-result",
    resting: "loaded",
    list: [
      ["loading", { state: "loading" }],
      ["loaded", { state: "loaded" }],
      ["error", { state: "error" }],
    ],
  },
  {
    id: "sources",
    resting: "expanded",
    list: [
      ["collapsed", { defaultExpanded: false }],
      ["expanded", { defaultExpanded: true }],
    ],
  },
  {
    id: "thinking-state",
    resting: "working",
    list: [
      ["working", { active: true }],
      ["done", { active: false }],
    ],
    replay: ["working", "done"],
  },
];

it.each(propsFamilies)(
  "applies every props state: $id",
  async ({ id, resting, list, replay }) => {
    open(id);
    // The family's states in order, and a fresh page opens on the resting one.
    expect(stateButtons().map((button) => button.textContent)).toEqual(
      list.map(([key]) => word(key)),
    );
    expect(pressedWords()).toEqual([word(resting)]);
    for (const [key, props] of list) {
      press(key);
      expect(pressedWords()).toEqual([word(key)]);
      // The model holds the state, as if the inspector had set it.
      expect(savedProps(id)).toMatchObject(props);
      if (key === "open")
        expect(document.querySelector(overlay)).not.toBeNull();
    }
    if (!replay) return;
    vi.useFakeTimers();
    const steps = demoStates[id]!.replay!;
    fireEvent.click(screen.getByRole("button", { name: "إعادة تشغيل المثال" }));
    for (const [index, key] of replay.entries()) {
      expect(pressedWords()).toEqual([word(key)]);
      await wait(steps[index].ms);
    }
    expect(pressedWords()).toEqual([word(replay.at(-1)!)]);
  },
);

it("loads saved props from before the states", () => {
  // Saved before the states: pages on the old defaults, no Modal `open`.
  persist(storageKeys.playgrounds, {
    input: { value: "", label: "اسم خاص" },
    textarea: { value: "" },
    select: { value: "" },
    checkbox: { checked: false },
    pagination: { page: 1 },
    avatar: { appearance: "initials" },
    "image-result": { state: "loading" },
    sources: { defaultExpanded: false },
    modal: { title: "عنوان خاص", footer: false, mode: "controlled" },
  });
  const fresh = defaultPlaygrounds("ar");
  const saved = readPlaygrounds("ar");
  // Each old default follows the page to its resting state...
  expect(saved.input.value).toBe(fresh.input.value);
  expect(saved.input.value).not.toBe("");
  expect(saved.textarea.value).toBe(fresh.textarea.value);
  expect(saved.select.value).toBe("active");
  expect(saved.checkbox.checked).toBe(true);
  expect(saved.pagination.page).toBe(6);
  expect(saved.avatar.appearance).toBe("photo");
  expect(saved["image-result"].state).toBe("loaded");
  expect(saved.sources.defaultExpanded).toBe(true);
  // ...what the visitor wrote stays, and Modal is closed.
  expect(saved.input.label).toBe("اسم خاص");
  expect(saved.modal).toMatchObject({
    title: "عنوان خاص",
    footer: false,
    open: false,
  });
  open("checkbox");
  expect(pressed()).toEqual([word("checked")]);
  // A page saved after the states keeps the old default a visitor picked.
  persist(storageKeys.playgrounds, {
    ...fresh,
    input: { ...fresh.input, value: "" },
    checkbox: { ...fresh.checkbox, checked: false },
  });
  const picked = readPlaygrounds("ar");
  expect(picked.input.value).toBe("");
  expect(picked.checkbox.checked).toBe(false);
});
