import type { ComponentId } from "./catalog";
import type { Language, Localized } from "./i18n";
import type { ButtonModel, PlaygroundModel } from "./model";

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
} satisfies Record<string, Localized>;

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
  sheet: {
    states: [
      { id: "closed", label: stateWords.closed, props: { open: false } },
      {
        id: "open",
        label: stateWords.open,
        props: { mode: "controlled", open: true },
      },
    ],
    resting: "closed",
  },
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
