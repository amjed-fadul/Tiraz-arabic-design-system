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

// Each phase page with its resting state, each state with what the stage shows
// in that phase, and the Replay steps where the page has any.
type PhaseFamily = {
  id: ComponentId;
  resting: WordKey;
  list: ReadonlyArray<readonly [WordKey, () => unknown]>;
  replay?: ReadonlyArray<WordKey>;
};
const stageNode = () =>
  screen.getByRole("region", { name: "المعاينة التفاعلية" });
const streamed = (state: string) => () =>
  expect(stageNode().querySelector(".tz-streaming-text")).toHaveAttribute(
    "data-state",
    state,
  );
const saveCall = () =>
  stage().getByText("حفظ الملخص في Drive").closest(".tz-tool-call");
const draftTask = () =>
  stage().getByText("صياغة رسائل العملاء").closest(".tz-agent-task");
const thinking = () => stageNode().querySelector(".tz-thinking-indicator");
const field = (name: string) =>
  (stage().getByRole("textbox", { name }) as HTMLTextAreaElement).value;
const toolbar = () =>
  screen.queryByRole("toolbar", { name: "إجراءات النص المحدّد", hidden: true });
const phaseFamilies: PhaseFamily[] = [
  {
    id: "streaming-text",
    resting: "done",
    list: [
      ["streaming", streamed("streaming")],
      [
        "done",
        () => {
          streamed("completed")();
          expect(stageNode()).toHaveTextContent("INV-1043");
        },
      ],
    ],
    replay: ["streaming", "done"],
  },
  {
    id: "tool-call",
    resting: "done",
    list: [
      [
        "pending",
        () => expect(saveCall()).toHaveAttribute("data-state", "pending"),
      ],
      [
        "running",
        () => {
          expect(saveCall()).toHaveAttribute("data-state", "running");
          expect(saveCall()).toHaveTextContent("جارٍ التنفيذ");
        },
      ],
      [
        "done",
        () =>
          expect(saveCall()).toHaveTextContent(
            "حُفظ الملف في Finance/2026/october-summary.md",
          ),
      ],
      [
        "failed",
        () =>
          expect(
            within(saveCall() as HTMLElement).getByRole("button", {
              name: "إعادة المحاولة",
            }),
          ).toBeVisible(),
      ],
    ],
    replay: ["pending", "running", "done"],
  },
  {
    id: "task-rows",
    resting: "running",
    list: [
      ["running", () => expect(draftTask()).toHaveTextContent("جارٍ التنفيذ")],
      ["done", () => expect(draftTask()).toHaveTextContent("مكتملة")],
    ],
    replay: ["running", "done"],
  },
  {
    id: "chat-thread",
    resting: "newMessage",
    list: [
      [
        "default",
        () => expect(thinking()).toHaveTextContent("جارٍ إعداد الرد"),
      ],
      [
        "newMessage",
        () => {
          expect(thinking()).toBeNull();
          expect(
            stage().getByRole("button", { name: "رد مفيد" }),
          ).toBeVisible();
        },
      ],
    ],
    replay: ["default", "newMessage"],
  },
  {
    id: "chat-composer",
    resting: "writing",
    list: [
      ["empty", () => expect(field("رسالتك")).toBe("")],
      ["writing", () => expect(field("رسالتك")).toMatch(/\S/)],
      [
        "submitting",
        () => {
          expect(
            stage().getByRole("button", { name: "إيقاف الرد" }),
          ).toBeVisible();
          expect(thinking()).toHaveTextContent("جارٍ إعداد الرد");
        },
      ],
    ],
  },
  {
    id: "prompt-bar",
    resting: "writing",
    list: [
      [
        "empty",
        () => {
          expect(field("طلبك")).toBe("");
          expect(
            stage().getByRole("list", { name: "طلبات مقترحة" }),
          ).toBeVisible();
        },
      ],
      ["writing", () => expect(field("طلبك")).toMatch(/\S/)],
    ],
  },
  {
    id: "selection-actions",
    resting: "selected",
    list: [
      [
        "idle",
        () => {
          expect(document.getSelection()?.isCollapsed).toBe(true);
          expect(toolbar()).toBeNull();
        },
      ],
      [
        "selected",
        async () => {
          // A real selection of the reply's first sentence, which the toolbar
          // answers.
          expect(document.getSelection()?.toString()).toMatch(
            /^راجعتُ فواتير أكتوبر.*الإيصالات\.$/,
          );
          await waitFor(() => expect(toolbar()).not.toBeNull());
        },
      ],
    ],
  },
  {
    id: "ask-user-questions",
    resting: "asking",
    list: [
      [
        "asking",
        () => {
          expect(
            stage().getByRole("heading", {
              name: "بأي الفواتير أبدأ المطابقة؟",
            }),
          ).toBeVisible();
          expect(
            stage().getByRole("button", { name: "إرسال الإجابات" }),
          ).toBeEnabled();
        },
      ],
    ],
  },
  {
    id: "approval-card",
    resting: "waiting",
    list: [
      [
        "waiting",
        () =>
          expect(
            stage().getByRole("button", { name: "تعليم كمدفوعة" }),
          ).toBeEnabled(),
      ],
      [
        "approved",
        () => {
          expect(stage().getByText("تمت الموافقة")).toBeVisible();
          expect(
            stage().queryByRole("button", { name: "تعليم كمدفوعة" }),
          ).toBeNull();
        },
      ],
      ["rejected", () => expect(stage().getByText("تم الرفض")).toBeVisible()],
    ],
  },
  {
    id: "approval-flow",
    resting: "first",
    list: [
      ["first", () => expect(stage().getByText("الطلب ١ من ٢")).toBeVisible()],
      [
        "second",
        () => {
          expect(stage().getByText("الطلب ٢ من ٢")).toBeVisible();
          expect(
            stage().getByRole("button", { name: "إرسال الملخص" }),
          ).toBeEnabled();
        },
      ],
      [
        "done",
        () => expect(stage().getByText("اكتملت مراجعة الطلبات.")).toBeVisible(),
      ],
    ],
  },
];

it.each(phaseFamilies)(
  "applies every phase state: $id",
  async ({ id, resting, list, replay }) => {
    open(id);
    expect(stateButtons().map((button) => button.textContent)).toEqual(
      list.map(([key]) => word(key)),
    );
    expect(pressedWords()).toEqual([word(resting)]);
    for (const [key, shows] of list) {
      press(key);
      expect(pressedWords()).toEqual([word(key)]);
      await shows();
    }
    if (!replay) return;
    vi.useFakeTimers();
    const steps = demoStates[id]!.replay!;
    fireEvent.click(screen.getByRole("button", { name: "إعادة تشغيل المثال" }));
    for (const [index, key] of replay.entries()) {
      expect(pressedWords()).toEqual([word(key)]);
      await list.find(([state]) => state === key)![1]();
      await wait(steps[index].ms);
    }
    expect(pressedWords()).toEqual([word(replay.at(-1)!)]);
  },
);

// The rest of the families, props and phase alike. Each page lists its states
// with what the stage shows once one is pressed and, for a props state, what
// the model holds; Replay steps follow where the page has a sequence.
type RestFamily = {
  id: ComponentId;
  resting: WordKey;
  list: ReadonlyArray<
    readonly [WordKey, () => unknown, Record<string, unknown>?]
  >;
  replay?: ReadonlyArray<WordKey>;
  // What the page needs from the browser, and how to give it back.
  setup?: () => () => void;
};
const canvas = () => stageNode();
const count = (selector: string) => canvas().querySelectorAll(selector).length;
const otpCode = () =>
  (canvas().querySelector("input.tz-otp-input") as HTMLInputElement).value;
const dateButton = () => canvas().querySelector(".tz-date-trigger")!;
const stepStatuses = () =>
  Array.from(canvas().querySelectorAll(".tz-step"), (step) =>
    step.getAttribute("data-status"),
  );
const unread = () => count('.tz-notification-row[data-unread="true"]');
const busy = () =>
  canvas().querySelector("[aria-busy]")?.getAttribute("aria-busy");
const copyStatus = () => canvas().querySelector("[role='status']");
const accordionOpen = () =>
  canvas()
    .querySelector(".tz-accordion-trigger")
    ?.getAttribute("aria-expanded");
const customers = () =>
  Array.from(canvas().querySelectorAll("tbody th"), (th) => th.textContent);
// The browser's clipboard, as the page finds it: a press of Copied or Failed
// must leave it as it was, and must never write to it.
const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
const withClipboard = () => {
  const own = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: clipboard,
  });
  return () => {
    if (own) Object.defineProperty(navigator, "clipboard", own);
    else delete (navigator as { clipboard?: Clipboard }).clipboard;
  };
};
const restFamilies: RestFamily[] = [
  {
    id: "otp-input",
    resting: "complete",
    list: [
      [
        "empty",
        () => expect(otpCode()).toBe(""),
        { defaultValue: "", error: "" },
      ],
      [
        "partial",
        () => expect(otpCode()).toBe("482"),
        { defaultValue: "482", error: "" },
      ],
      [
        "complete",
        () => expect(otpCode()).toBe("482915"),
        { defaultValue: "482915", error: "" },
      ],
      [
        "invalid",
        () => {
          expect(otpCode()).toBe("482915");
          expect(
            stage().getByText("الرمز غير صحيح. حاول مرة أخرى."),
          ).toBeVisible();
        },
        { error: text },
      ],
    ],
  },
  {
    id: "date-picker",
    resting: "selected",
    list: [
      [
        "empty",
        () => expect(dateButton()).toHaveTextContent("اختر تاريخًا"),
        { defaultValue: "", error: "" },
      ],
      [
        "selected",
        () => {
          expect(dateButton()).toHaveTextContent("٢٠٢٦");
          expect(dateButton()).not.toHaveTextContent("اختر تاريخًا");
        },
        { defaultValue: text, error: "" },
      ],
      [
        "invalid",
        () => {
          expect(dateButton()).toHaveTextContent("اختر تاريخًا");
          expect(
            stage().getByText("اختر تاريخ الاستحقاق للمتابعة."),
          ).toBeVisible();
        },
        { defaultValue: "", error: text },
      ],
    ],
  },
  {
    id: "tag-input",
    resting: "tagged",
    list: [
      [
        "empty",
        () => expect(count(".tz-tag")).toBe(0),
        { filled: false, error: "" },
      ],
      [
        "tagged",
        () => expect(count(".tz-tag")).toBe(2),
        { filled: true, error: "" },
      ],
      [
        "invalid",
        () => {
          expect(count(".tz-tag")).toBe(0);
          expect(
            stage().getByText("أضف وسمًا واحدًا على الأقل للمتابعة."),
          ).toBeVisible();
        },
        { filled: false, error: text },
      ],
    ],
  },
  {
    id: "input-copy",
    resting: "idle",
    setup: withClipboard,
    list: [
      ["idle", () => expect(copyStatus()).toBeEmptyDOMElement()],
      [
        "copied",
        async () => {
          await waitFor(() =>
            expect(copyStatus()).toHaveTextContent("تم النسخ."),
          );
          expect(navigator.clipboard).toBe(clipboard);
          expect(clipboard.writeText).not.toHaveBeenCalled();
        },
      ],
      [
        "failed",
        () => {
          expect(copyStatus()).toHaveTextContent("تعذّر النسخ.");
          expect(navigator.clipboard).toBe(clipboard);
          expect(clipboard.writeText).not.toHaveBeenCalled();
        },
      ],
    ],
  },
  {
    id: "file-dropzone",
    resting: "filesAdded",
    list: [
      [
        "empty",
        () => expect(count(".tz-selected-files li")).toBe(0),
        { filled: false, error: "" },
      ],
      [
        "filesAdded",
        () => expect(count(".tz-selected-files li")).toBe(2),
        { filled: true, error: "" },
      ],
      [
        "invalid",
        () => {
          expect(count(".tz-selected-files li")).toBe(0);
          expect(
            stage().getByText("أرفق ملفًا واحدًا على الأقل للمتابعة."),
          ).toBeVisible();
        },
        { filled: false, error: text },
      ],
    ],
  },
  {
    id: "file-tree",
    resting: "expanded",
    list: [
      [
        "collapsed",
        () => {
          expect(count('[role="treeitem"]')).toBe(1);
          expect(stage().getByText("اختر ملفًا لمعاينته.")).toBeVisible();
        },
        { defaultExpanded: false, defaultSelected: false },
      ],
      [
        "expanded",
        () => {
          expect(count('[role="treeitem"]')).toBeGreaterThan(5);
          expect(canvas().querySelector('[aria-selected="true"]')).toBeNull();
          expect(stage().getByText("اختر ملفًا لمعاينته.")).toBeVisible();
        },
        { defaultExpanded: true, defaultSelected: false },
      ],
      [
        "selected",
        () => {
          expect(
            stage().getByRole("treeitem", { name: /App\.tsx/, selected: true }),
          ).toBeVisible();
          expect(stage().getByText(/export function App/)).toBeVisible();
        },
        { defaultExpanded: true, defaultSelected: true },
      ],
    ],
  },
  {
    id: "steps",
    resting: "midway",
    list: [
      [
        "start",
        () =>
          expect(stepStatuses()).toEqual(["current", "upcoming", "upcoming"]),
        { step: 0, currentState: "current" },
      ],
      [
        "midway",
        () =>
          expect(stepStatuses()).toEqual(["completed", "current", "upcoming"]),
        { step: 1, currentState: "current" },
      ],
      [
        "error",
        () =>
          expect(stepStatuses()).toEqual(["completed", "error", "upcoming"]),
        { step: 1, currentState: "error" },
      ],
      [
        "complete",
        () => {
          expect(stepStatuses()).toEqual([
            "completed",
            "completed",
            "completed",
          ]);
          expect(stage().getByText("اكتملت جميع المراحل.")).toBeVisible();
        },
        { step: 3 },
      ],
    ],
    replay: ["start", "midway", "complete"],
  },
  {
    id: "filter-bar",
    resting: "filtered",
    list: [
      [
        "noFilters",
        () => {
          expect(count(".tz-filter-active .tz-tag")).toBe(0);
          expect(stage().getByRole("status")).toHaveTextContent("٣ مستندات");
        },
        { initialQuery: "", initialKind: "all" },
      ],
      [
        "filtered",
        () => {
          expect(count(".tz-filter-active .tz-tag")).toBe(1);
          expect(stage().getByRole("status")).toHaveTextContent("مستندان");
        },
        { initialKind: "guide" },
      ],
    ],
  },
  {
    id: "data-table",
    resting: "loaded",
    list: [
      [
        "loaded",
        () => {
          expect(canvas().querySelector("table")).toHaveAttribute(
            "aria-busy",
            "false",
          );
          expect(canvas().querySelector("[aria-sort='ascending']")).toBeNull();
        },
        { preset: "populated", sort: "none" },
      ],
      [
        "loading",
        () =>
          expect(canvas().querySelector("table")).toHaveAttribute(
            "aria-busy",
            "true",
          ),
        { preset: "loading", sort: "none" },
      ],
      [
        "empty",
        () => expect(stage().getByText("لا يوجد عملاء بعد.")).toBeVisible(),
        { preset: "empty", sort: "none" },
      ],
      [
        "sorted",
        () => {
          // The Name header was pressed once, so the rows run in its order.
          expect(
            canvas().querySelector("[aria-sort='ascending']"),
          ).toHaveTextContent("الاسم");
          const rows = customers();
          const order = new Intl.Collator("ar", {
            numeric: true,
            sensitivity: "base",
          });
          expect(rows).toEqual([...rows].sort(order.compare));
          expect(rows[0]).not.toBe("شركة مدار للتقنية");
        },
        { preset: "populated", sort: "name" },
      ],
    ],
  },
  {
    id: "notification-list",
    resting: "unread",
    list: [
      [
        "unread",
        () => {
          expect(count(".tz-notification-row")).toBe(3);
          expect(unread()).toBe(2);
        },
        { empty: false, allRead: false },
      ],
      [
        "allRead",
        () => {
          expect(count(".tz-notification-row")).toBe(3);
          expect(unread()).toBe(0);
        },
        { empty: false, allRead: true },
      ],
      [
        "empty",
        () => {
          expect(count(".tz-notification-row")).toBe(0);
          expect(
            stage().getByRole("heading", { name: "لا توجد إشعارات" }),
          ).toBeVisible();
        },
        { empty: true },
      ],
    ],
  },
  {
    id: "accordion",
    resting: "open",
    list: [
      [
        "closed",
        () => expect(accordionOpen()).toBe("false"),
        { defaultOpen: false },
      ],
      [
        "open",
        () => expect(accordionOpen()).toBe("true"),
        { defaultOpen: true },
      ],
    ],
  },
  {
    id: "toast",
    resting: "hidden",
    list: [
      ["hidden", () => expect(document.querySelector(".tz-toast")).toBeNull()],
      [
        "shown",
        () => {
          expect(document.querySelector(".tz-toast")).not.toBeNull();
          expect(screen.getByText("حُفظت الفاتورة")).toBeVisible();
        },
      ],
    ],
    replay: ["hidden", "shown"],
  },
  {
    id: "skeleton",
    resting: "loaded",
    list: [
      ["loading", () => expect(busy()).toBe("true")],
      [
        "loaded",
        () => {
          expect(busy()).toBe("false");
          expect(stage().getByText("سارة علي")).toBeVisible();
        },
      ],
    ],
    replay: ["loading", "loaded"],
  },
];

it.each(restFamilies)(
  "applies every remaining state: $id",
  async ({ id, resting, list, replay, setup }) => {
    const restore = setup?.();
    try {
      open(id);
      expect(stateButtons().map((button) => button.textContent)).toEqual(
        list.map(([key]) => word(key)),
      );
      expect(pressedWords()).toEqual([word(resting)]);
      for (const [key, shows, props] of list) {
        press(key);
        expect(pressedWords()).toEqual([word(key)]);
        // A props state leaves its values in the model, as an edit would.
        if (props) expect(savedProps(id)).toMatchObject(props);
        await shows();
      }
      if (!replay) return;
      vi.useFakeTimers();
      const sequence = demoStates[id]!.replay!;
      fireEvent.click(
        screen.getByRole("button", { name: "إعادة تشغيل المثال" }),
      );
      for (const [index, key] of replay.entries()) {
        expect(pressedWords()).toEqual([word(key)]);
        await list.find(([state]) => state === key)![1]();
        await wait(sequence[index].ms);
      }
      expect(pressedWords()).toEqual([word(replay.at(-1)!)]);
    } finally {
      restore?.();
    }
  },
);

it("returns a phase page to its resting phase when the inspector resets it", async () => {
  vi.useFakeTimers();
  open("tool-chips");
  // jsdom queues a toggle task for the inspector; let it run.
  await wait(0);
  const reset = () =>
    fireEvent.click(rail().getByRole("button", { name: "إعادة ضبط المعاينة" }));
  fireEvent.click(states().getByRole("button", { name: word("running") }));
  expect(pressed()).toEqual([word("running")]);
  reset();
  expect(pressed()).toEqual([word("done")]);
  expect(chips()).toEqual(chipsDone);
  // A reset also ends a Replay, so a later step cannot undo it.
  fireEvent.click(screen.getByRole("button", { name: "إعادة تشغيل المثال" }));
  expect(pressed()).toEqual([word("running")]);
  reset();
  expect(vi.getTimerCount()).toBe(0);
  await wait(5000);
  expect(pressed()).toEqual([word("done")]);
  expect(chips()).toEqual(chipsDone);
});

it("moves the switcher with the visitor's selection on the selection-actions page", async () => {
  open("selection-actions");
  // The page opens on a real selection of the reply's first sentence.
  expect(pressed()).toEqual([word("selected")]);
  const selection = document.getSelection()!;
  expect(selection.isCollapsed).toBe(false);
  // The toolbar by class, not by role: jsdom has no layout, so Popper marks it
  // `visibility: hidden` a moment after it appears.
  const actions = () => document.querySelector(".tz-selection-actions");
  await waitFor(() => expect(actions()).not.toBeNull());
  // A click elsewhere collapses it, and the switcher follows.
  selection.collapse(document.body, 0);
  await waitFor(() => expect(pressed()).toEqual([word("idle")]));
  await waitFor(() => expect(actions()).toBeNull());
  // Selecting a word of the reply moves it back, and the word stays selected
  // rather than giving way to the first sentence.
  const reply = stage().getByText(/^راجعتُ فواتير/).firstChild!;
  const start = reply.textContent!.indexOf("أكتوبر");
  selection.setBaseAndExtent(reply, start, reply, start + "أكتوبر".length);
  await waitFor(() => expect(pressed()).toEqual([word("selected")]));
  expect(selection.toString()).toBe("أكتوبر");
  await waitFor(() => expect(actions()).not.toBeNull());
  // A selection outside the toolbar's scope is not the reply's.
  selection.selectAllChildren(screen.getByRole("heading", { level: 1 }));
  await waitFor(() => expect(pressed()).toEqual([word("idle")]));
  await waitFor(() => expect(actions()).toBeNull());
  // A triple-click selects the paragraph through the start of the next
  // element, as Chrome does. That is still the toolbar's selection.
  const next = document.querySelector(
    ".tz-selection-scope .tz-visually-hidden",
  );
  selection.setBaseAndExtent(reply, 0, next!, 0);
  await waitFor(() => expect(pressed()).toEqual([word("selected")]));
  await waitFor(() => expect(actions()).not.toBeNull());
});

it("moves the switcher to Shown when the trigger raises a toast, and raises it once", () => {
  open("toast");
  expect(pressed()).toEqual([word("hidden")]);
  fireEvent.click(stage().getByRole("button", { name: "عرض التنبيه" }));
  expect(pressed()).toEqual([word("shown")]);
  expect(document.querySelectorAll(".tz-toast")).toHaveLength(1);
});

it("never raises a toast from an inspector edit", async () => {
  const user = userEvent.setup();
  open("toast");
  fireEvent.click(stage().getByRole("button", { name: "عرض التنبيه" }));
  expect(pressed()).toEqual([word("shown")]);
  expect(document.querySelectorAll(".tz-toast")).toHaveLength(1);
  // An edit starts the example afresh at its resting state, so it raises
  // nothing, and the switcher says Hidden.
  await user.selectOptions(
    rail().getByRole("combobox", { name: "النوع" }),
    "error",
  );
  expect(pressed()).toEqual([word("hidden")]);
  expect(document.querySelectorAll(".tz-toast")).toHaveLength(0);
  // Typing raises nothing either: every key remounts the example.
  await user.type(rail().getByRole("textbox", { name: "العنوان" }), "ab");
  expect(pressed()).toEqual([word("hidden")]);
  expect(document.querySelectorAll(".tz-toast")).toHaveLength(0);
  // The trigger still raises one, and the switcher follows.
  fireEvent.click(stage().getByRole("button", { name: "عرض التنبيه" }));
  expect(pressed()).toEqual([word("shown")]);
  expect(document.querySelectorAll(".tz-toast")).toHaveLength(1);
});

it("moves the switcher back to Hidden once the toast has expired", async () => {
  vi.useFakeTimers();
  open("toast");
  fireEvent.click(stage().getByRole("button", { name: "عرض التنبيه" }));
  expect(pressed()).toEqual([word("shown")]);
  // Shown holds for as long as a toast is on screen: five seconds by default.
  await wait(4900);
  expect(document.querySelectorAll(".tz-toast")).toHaveLength(1);
  expect(pressed()).toEqual([word("shown")]);
  await wait(200);
  expect(document.querySelectorAll(".tz-toast")).toHaveLength(0);
  expect(pressed()).toEqual([word("hidden")]);
  // The trigger still raises one, and the switcher follows it again.
  fireEvent.click(stage().getByRole("button", { name: "عرض التنبيه" }));
  expect(pressed()).toEqual([word("shown")]);
  expect(document.querySelectorAll(".tz-toast")).toHaveLength(1);
});

it("moves the switcher back to Hidden when the visitor dismisses the toast", async () => {
  const user = userEvent.setup();
  open("toast");
  await user.click(stage().getByRole("button", { name: "عرض التنبيه" }));
  expect(pressed()).toEqual([word("shown")]);
  await user.click(screen.getByRole("button", { name: "إغلاق التنبيه" }));
  await waitFor(() => expect(pressed()).toEqual([word("hidden")]));
  expect(document.querySelectorAll(".tz-toast")).toHaveLength(0);
});

it("ends a Toast Replay on Shown, then on Hidden when its toast expires", async () => {
  vi.useFakeTimers();
  open("toast");
  fireEvent.click(screen.getByRole("button", { name: "إعادة تشغيل المثال" }));
  expect(pressed()).toEqual([word("hidden")]);
  await wait(800);
  expect(pressed()).toEqual([word("shown")]);
  await wait(2600);
  // The Replay ends on Shown and says so once...
  expect(pressed()).toEqual([word("shown")]);
  expect(frameStatus()).toHaveTextContent(`الحالة: ${word("shown")}`);
  // ...and the switcher follows the toast out, as it does for a visitor.
  await wait(2400);
  expect(document.querySelectorAll(".tz-toast")).toHaveLength(0);
  expect(pressed()).toEqual([word("hidden")]);
  expect(frameStatus()).toHaveTextContent(`الحالة: ${word("hidden")}`);
});

it("loads props saved before the last states: an old default moves, new keys default", () => {
  const fresh = defaultPlaygrounds("ar");
  const old = { ...fresh["filter-bar"], initialKind: "all" };
  // Saved after the earlier states, before these: no Steps `step`, and a page
  // with a seed it did not have, such as OTPInput's code.
  const steps: Record<string, unknown> = { ...fresh.steps };
  delete steps.step;
  const otp: Record<string, unknown> = {
    ...fresh["otp-input"],
    label: "رمز خاص",
  };
  delete otp.defaultValue;
  persist(storageKeys.playgrounds, {
    ...fresh,
    steps,
    "otp-input": otp,
    "filter-bar": old,
  });
  const saved = readPlaygrounds("ar");
  expect(saved["filter-bar"].initialKind).toBe("guide");
  expect(saved["otp-input"]).toMatchObject({
    label: "رمز خاص",
    defaultValue: "482915",
  });
  // Saved after: a visitor who picked No filters keeps it.
  persist(storageKeys.playgrounds, { ...fresh, "filter-bar": old });
  expect(readPlaygrounds("ar")["filter-bar"].initialKind).toBe("all");
  open("filter-bar");
  expect(pressed()).toEqual([word("noFilters")]);
});

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

it("translates a state's text when the language changes", async () => {
  const user = userEvent.setup();
  open("input");
  press("invalid");
  expect(screen.getByText("أدخل اسم العميل للمتابعة.")).toBeInTheDocument();
  const language = () =>
    screen.getByRole("combobox", {
      name: /^(لغة التوثيق|Documentation language)$/,
    });
  await user.selectOptions(language(), "en");
  // The message follows the language, on the stage and in the saved props
  // (the code and the prompt are built from them); the state stays pressed.
  expect(
    screen.getByText("Enter the customer name to continue."),
  ).toBeInTheDocument();
  expect(savedProps("input").error).toBe(
    "Enter the customer name to continue.",
  );
  expect(pressedWords()).toEqual([stateWords.invalid[1]]);
  await user.selectOptions(language(), "ar");
  expect(screen.getByText("أدخل اسم العميل للمتابعة.")).toBeInTheDocument();
  expect(savedProps("input").error).toBe("أدخل اسم العميل للمتابعة.");
});

it.each([
  [
    "otp-input",
    "الرمز غير صحيح. حاول مرة أخرى.",
    "That code isn't right. Try again.",
  ],
  [
    "date-picker",
    "اختر تاريخ الاستحقاق للمتابعة.",
    "Choose a due date to continue.",
  ],
  [
    "tag-input",
    "أضف وسمًا واحدًا على الأقل للمتابعة.",
    "Add at least one tag to continue.",
  ],
  [
    "file-dropzone",
    "أرفق ملفًا واحدًا على الأقل للمتابعة.",
    "Attach at least one file to continue.",
  ],
] as const)(
  "translates the Invalid message of %s when the language changes",
  async (id, ar, en) => {
    const user = userEvent.setup();
    open(id);
    press("invalid");
    expect(screen.getByText(ar)).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", {
        name: /^(لغة التوثيق|Documentation language)$/,
      }),
      "en",
    );
    expect(screen.getByText(en)).toBeInTheDocument();
    expect(savedProps(id).error).toBe(en);
    expect(pressedWords()).toEqual([stateWords.invalid[1]]);
  },
);
