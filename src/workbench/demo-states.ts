import type { ComponentId } from "./catalog";
import { localize } from "./i18n";
import type { Language, Localized } from "./i18n";
import { defaultPlaygrounds } from "./model";
import type {
  ButtonModel,
  ChartModel,
  CheckboxModel,
  InputModel,
  PaginationModel,
  PlaygroundModel,
  ProgressModel,
  RadioGroupModel,
  SelectModel,
  SwitchModel,
  TextareaModel,
} from "./model";

/**
 * One state on a page's switcher. A props state patches the playground model
 * through the inspector's path; a phase state hands the example its `phase`.
 */
export interface DemoStateDef {
  id: string;
  label: Localized;
  props?:
    Record<string, unknown> | ((language: Language) => Record<string, unknown>);
  /** For a state that covers a range of values, such as Filled. */
  matches?(model: PlaygroundModel): boolean;
  phase?: string;
}
/**
 * A press of a state without a phase leaves the example with none. If the
 * example runs on its own when it has no phase, give every state in its
 * family a phase.
 */
export interface DemoStatesDef {
  states: readonly DemoStateDef[];
  /** The state a fresh page shows: the one that shows the most. */
  resting: string;
  /** Replay applies each step's state, then waits its `ms` (800–2,600). */
  replay?: readonly { state: string; ms: number }[];
}

/**
 * Every word a state button can show. The first block is the spec §8
 * glossary, verbatim; words beyond it go in the second block, so every page
 * says the same state the same way. No label addresses the reader by gender.
 */
export const stateWords = {
  idle: ["جاهز", "Idle"],
  loading: ["يُحمَّل", "Loading"],
  success: ["نجح", "Success"],
  error: ["خطأ", "Error"],
  disabled: ["معطّل", "Disabled"],
  empty: ["فارغ", "Empty"],
  filled: ["مُعبّأ", "Filled"],
  invalid: ["غير صالح", "Invalid"],
  readOnly: ["للقراءة فقط", "Read-only"],
  open: ["مفتوح", "Open"],
  closed: ["مغلق", "Closed"],
  checked: ["محدّد", "Checked"],
  unchecked: ["غير محدّد", "Unchecked"],
  on: ["مفعّل", "On"],
  off: ["متوقف", "Off"],
  expanded: ["موسّع", "Expanded"],
  collapsed: ["مطوي", "Collapsed"],
  selected: ["مختار", "Selected"],
  running: ["يعمل", "Running"],
  needsYou: ["بانتظارك", "Needs you"],
  done: ["اكتمل", "Done"],
  failed: ["تعثّر", "Failed"],
  stopped: ["أُوقف", "Stopped"],
  writing: ["يكتب", "Writing"],
  thinking: ["يفكّر", "Thinking"],
  weaving: ["يُنسج", "Weaving"],
  waiting: ["بانتظار القرار", "Waiting"],
  approved: ["تمت الموافقة", "Approved"],
  rejected: ["رُفض", "Rejected"],
  expired: ["انتهت المهلة", "Expired"],
  // Words beyond the glossary, in the same voice.
  unselected: ["غير مختار", "Unselected"],
  default: ["افتراضي", "Default"],
  first: ["الأولى", "First"],
  middle: ["الوسطى", "Middle"],
  last: ["الأخيرة", "Last"],
  loaded: ["تم التحميل", "Loaded"],
  photo: ["صورة", "Photo"],
  initials: ["الأحرف الأولى", "Initials"],
  determinate: ["نسبة معروفة", "Determinate"],
  indeterminate: ["نسبة غير معروفة", "Indeterminate"],
  complete: ["اكتمل", "Complete"],
  data: ["بيانات", "Data"],
  normal: ["اعتيادي", "Normal"],
  high: ["مرتفع", "High"],
  near: ["شبه ممتلئ", "Near"],
  over: ["تجاوز السعة", "Over"],
  working: ["يعمل", "Working"],
} satisfies Record<string, Localized>;

/** A state whose id and label both come from one word in `stateWords`. */
function state(
  word: keyof typeof stateWords,
  props: DemoStateDef["props"],
  matches?: DemoStateDef["matches"],
): DemoStateDef {
  return { id: word, label: stateWords[word], props, matches };
}

// What Invalid tells the visitor to do: no blame, and not the placeholder's
// words again.
const required = {
  input: ["أدخل اسم العميل للمتابعة.", "Enter the customer name to continue."],
  textarea: ["أضف ملاحظة للمتابعة.", "Add a note to continue."],
  select: ["اختر حالة للمتابعة.", "Choose a status to continue."],
  checkbox: ["حدّد هذا الخيار للمتابعة.", "Select this option to continue."],
  "radio-group": ["اختر وتيرة للمتابعة.", "Choose a frequency to continue."],
} satisfies Record<string, Localized>;

// Disabled wins over Read-only, which wins over an error; only then does the
// value decide. Every predicate leaves the others' conditions out, so none
// shadows another.
function textStates(id: "input" | "textarea"): DemoStatesDef {
  type Model = InputModel | TextareaModel;
  const filled = (language: Language) => defaultPlaygrounds(language)[id].value;
  const live = (m: Model) => !m.disabled && !m.readOnly;
  return {
    states: [
      state(
        "empty",
        { value: "", error: "", disabled: false, readOnly: false },
        (m: Model) => live(m) && !m.error && m.value === "",
      ),
      state(
        "filled",
        (language) => ({
          value: filled(language),
          error: "",
          disabled: false,
          readOnly: false,
        }),
        (m: Model) => live(m) && !m.error && m.value !== "",
      ),
      state(
        "invalid",
        (language) => ({
          value: "",
          error: localize(required[id], language),
          disabled: false,
          readOnly: false,
        }),
        (m: Model) => live(m) && m.error !== "",
      ),
      state(
        "disabled",
        (language) => ({
          value: filled(language),
          error: "",
          disabled: true,
          readOnly: false,
        }),
        (m: Model) => m.disabled,
      ),
      state(
        "readOnly",
        (language) => ({
          value: filled(language),
          error: "",
          disabled: false,
          readOnly: true,
        }),
        (m: Model) => !m.disabled && m.readOnly,
      ),
    ],
    resting: "filled",
  };
}

// Sheet, DropdownMenu and Modal. Open takes the controlled mode, because the
// playground passes `open` only then.
const overlayStates: DemoStatesDef = {
  states: [
    state("closed", { open: false }),
    state("open", { mode: "controlled", open: true }),
  ],
  resting: "closed",
};
const chartStates: DemoStatesDef = {
  states: [
    state("data", { sample: "multi" }, (m: ChartModel) => m.sample !== "empty"),
    state("empty", { sample: "empty" }),
  ],
  resting: "data",
};

// Pages left out keep the example as it is, with no switcher.
export const demoStates: Partial<Record<ComponentId, DemoStatesDef>> = {
  button: {
    states: [
      {
        id: "idle",
        label: stateWords.idle,
        props: { state: "idle", disabled: false },
      },
      {
        id: "loading",
        label: stateWords.loading,
        props: { state: "loading", disabled: false },
      },
      {
        id: "success",
        label: stateWords.success,
        props: { state: "success", disabled: false },
      },
      {
        id: "error",
        label: stateWords.error,
        props: { state: "error", disabled: false },
      },
      {
        id: "disabled",
        label: stateWords.disabled,
        props: { state: "idle", disabled: true },
        // As in the inspector, disabled wins over any state beside it.
        matches: (model) => (model as ButtonModel).disabled,
      },
    ],
    resting: "idle",
    replay: [
      { state: "idle", ms: 800 },
      { state: "loading", ms: 1200 },
      { state: "success", ms: 1000 },
    ],
  },
  sheet: overlayStates,
  terminal: {
    states: [
      { id: "running", label: stateWords.running, props: { state: "running" } },
      { id: "done", label: stateWords.done, props: { state: "completed" } },
      { id: "failed", label: stateWords.failed, props: { state: "failed" } },
    ],
    resting: "done",
    replay: [
      { state: "running", ms: 2600 },
      { state: "done", ms: 800 },
    ],
  },
  "tool-chips": {
    states: [
      { id: "running", label: stateWords.running, phase: "running" },
      { id: "done", label: stateWords.done, phase: "done" },
    ],
    resting: "done",
    replay: [
      { state: "running", ms: 1800 },
      { state: "done", ms: 800 },
    ],
  },
  input: textStates("input"),
  textarea: textStates("textarea"),
  select: {
    states: [
      state(
        "empty",
        { value: "", invalid: false, error: "", disabled: false },
        (m: SelectModel) =>
          !m.disabled && !m.invalid && !m.error && m.value === "",
      ),
      state(
        "selected",
        { value: "active", invalid: false, error: "", disabled: false },
        (m: SelectModel) =>
          !m.disabled && !m.invalid && !m.error && m.value !== "",
      ),
      state(
        "invalid",
        (language) => ({
          value: "",
          invalid: true,
          error: localize(required.select, language),
          disabled: false,
        }),
        (m: SelectModel) => !m.disabled && (m.invalid || m.error !== ""),
      ),
      state(
        "disabled",
        { value: "active", invalid: false, error: "", disabled: true },
        (m: SelectModel) => m.disabled,
      ),
    ],
    resting: "selected",
  },
  checkbox: {
    states: [
      state(
        "unchecked",
        { checked: false, error: "", disabled: false },
        (m: CheckboxModel) => !m.disabled && !m.error && !m.checked,
      ),
      state(
        "checked",
        { checked: true, error: "", disabled: false },
        (m: CheckboxModel) => !m.disabled && !m.error && m.checked,
      ),
      state(
        "invalid",
        (language) => ({
          checked: false,
          error: localize(required.checkbox, language),
          disabled: false,
        }),
        (m: CheckboxModel) => !m.disabled && m.error !== "",
      ),
      state(
        "disabled",
        { checked: true, error: "", disabled: true },
        (m: CheckboxModel) => m.disabled,
      ),
    ],
    resting: "checked",
  },
  "radio-group": {
    states: [
      state(
        "unselected",
        { value: "", error: "", disabled: false },
        (m: RadioGroupModel) => !m.disabled && !m.error && m.value === "",
      ),
      state(
        "selected",
        { value: "weekly", error: "", disabled: false },
        (m: RadioGroupModel) => !m.disabled && !m.error && m.value !== "",
      ),
      state(
        "invalid",
        (language) => ({
          value: "",
          error: localize(required["radio-group"], language),
          disabled: false,
        }),
        (m: RadioGroupModel) => !m.disabled && m.error !== "",
      ),
      state(
        "disabled",
        { value: "weekly", error: "", disabled: true },
        (m: RadioGroupModel) => m.disabled,
      ),
    ],
    resting: "selected",
  },
  switch: {
    states: [
      state("off", { checked: false, disabled: false }),
      state("on", { checked: true, disabled: false }),
      // Disabled keeps the switch as it is, on or off.
      state("disabled", { disabled: true }, (m: SwitchModel) => m.disabled),
    ],
    resting: "on",
  },
  slider: {
    states: [
      state("default", { disabled: false }),
      state("disabled", { disabled: true }),
    ],
    resting: "default",
  },
  sidebar: {
    states: [
      state("expanded", { mode: "controlled", collapsed: false }),
      state("collapsed", { mode: "controlled", collapsed: true }),
    ],
    resting: "expanded",
  },
  pagination: {
    states: [
      state("first", { page: 1 }, (m: PaginationModel) => m.page === 1),
      state(
        "middle",
        { page: 6 },
        (m: PaginationModel) => m.page > 1 && m.page < m.totalPages,
      ),
      // No page count goes past 20, and normalization holds the page to the
      // last one.
      state(
        "last",
        { page: 20 },
        (m: PaginationModel) => m.page === m.totalPages,
      ),
    ],
    resting: "middle",
  },
  "data-table": {
    states: [
      state("loaded", { preset: "populated" }),
      state("loading", { preset: "loading" }),
      state("empty", { preset: "empty" }),
    ],
    resting: "loaded",
  },
  avatar: {
    states: [
      state("photo", { appearance: "photo" }),
      state("initials", { appearance: "initials" }),
    ],
    resting: "photo",
  },
  progress: {
    states: [
      state(
        "determinate",
        { indeterminate: false, value: 64 },
        (m: ProgressModel) => !m.indeterminate && m.value < 100,
      ),
      state("indeterminate", { indeterminate: true }),
      state("complete", { indeterminate: false, value: 100 }),
    ],
    resting: "determinate",
    replay: [
      { state: "determinate", ms: 1200 },
      { state: "complete", ms: 800 },
    ],
  },
  dropdown: overlayStates,
  modal: overlayStates,
  "line-chart": chartStates,
  "area-chart": chartStates,
  "bar-chart": chartStates,
  "donut-chart": chartStates,
  "context-meter": {
    states: [
      state("normal", { preset: "normal" }),
      state("high", { preset: "high" }),
      state("near", { preset: "near" }),
      state("over", { preset: "over" }),
    ],
    resting: "normal",
  },
  "image-result": {
    states: [
      state("loading", { state: "loading" }),
      state("loaded", { state: "loaded" }),
      state("error", { state: "error" }),
    ],
    resting: "loaded",
  },
  sources: {
    states: [
      state("collapsed", { defaultExpanded: false }),
      state("expanded", { defaultExpanded: true }),
    ],
    resting: "expanded",
  },
  "thinking-state": {
    states: [
      state("working", { active: true }),
      state("done", { active: false }),
    ],
    resting: "working",
    replay: [
      { state: "working", ms: 2600 },
      { state: "done", ms: 800 },
    ],
  },
};

/** The props a state applies, in the interface language. */
export function propsOf(state: DemoStateDef, language: Language) {
  return typeof state.props === "function"
    ? state.props(language)
    : (state.props ?? {});
}

/**
 * The state the example is in: a phase state by its phase, then a props state
 * whose `matches` accepts the model, then one whose every prop equals the
 * model's. The first match wins.
 */
export function stateOf(
  id: ComponentId,
  model: PlaygroundModel,
  phase: string | undefined,
  language: Language,
): string | undefined {
  const states = demoStates[id]?.states ?? [];
  const record = model as unknown as Record<string, unknown>;
  return (
    (phase === undefined
      ? undefined
      : states.find((state) => state.phase === phase)) ??
    states.find((state) => state.matches?.(model)) ??
    states.find(
      (state) =>
        state.props !== undefined &&
        !state.matches &&
        Object.entries(propsOf(state, language)).every(
          ([key, value]) =>
            JSON.stringify(record[key]) === JSON.stringify(value),
        ),
    )
  )?.id;
}
