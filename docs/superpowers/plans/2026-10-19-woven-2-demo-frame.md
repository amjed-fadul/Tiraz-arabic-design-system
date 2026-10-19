# Woven Demo Frame Implementation Plan (Plan 2 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task by task. Each task names its implementer model; a fresh Opus subagent reviews every task (see the roadmap). Steps use checkbox (`- [ ]`) syntax for tracking. Keep the work lean: write the tests the task names, not more (Amjed, 19 Oct: "don't over-engineer").

**Goal:** Every documentation page renders its example in the new demo frame. The frame shows:

- the Arabic and English names;
- a state switcher where the component has meaningful states;
- Replay where it has a lifecycle;
- a notes row.

The page reads job first and code last.

**Architecture:**

- `DemoFrame` (portable, in `src/system/ai/examples/`) gains optional props for the name, states, state, notes, view changes and replay.
- The workbench owns the states. `src/workbench/demo-states.ts` maps each page to its states. A state applies either by **props**, through the inspector's own path, or by **phase**, through a `phase` / `onPhaseChange` pair on lifecycle examples.
- The workbench runs Replay by stepping through states.
- Notes live in `src/workbench/docs-notes.ts`.

**Tech Stack:** React 19, TypeScript ~6.0, Vitest 5 (jsdom), Testing Library.

**Spec:** `/Users/amjedfadul/Tiraz-worktrees/woven/docs/superpowers/specs/2026-10-18-workbench-docs-design.md`. "Spec §N" below means this file.

- In scope: §6–8, §11, §12 items 4 and 8, §13 and §14 steps 2–4.
- Out of scope, for later plans: the pattern-only sections (anatomy, placements, copy), the navigation regroup, the chrome restyle, the README, and states that need new AI-pattern behavior.

Roadmap: `docs/superpowers/plans/2026-10-18-woven-roadmap.md`.

**Facts that differ from the spec's inventory** (verified 19 Oct):

- The DemoFrame CSS is `components.css` 4666–4849.
- Terminal `state`, ImageResult `state` and ThinkingState `active` are already model keys.
- More examples autoplay than the spec listed: ThinkingState, TaskRows, Terminal while running, and ChatComposer's opening exchange.
- Modal keeps its own `open`. The playground passes `open` only when `mode` (Sheet, DropdownMenu) or `controlled` (Modal) is set (`Playground.tsx:886, 911, 573–583`).
- Radix Dialog returns focus to its own trigger on close, not to an outside button.
- Section order is asserted only in five browser scripts.

## Global Constraints

- **Working directory:** `/Users/amjedfadul/Tiraz-worktrees/woven`, branch `claude/woven`. The shell resets its directory between commands, so start each one with `cd /Users/amjedfadul/Tiraz-worktrees/woven && `.
- **Baseline:** Plan 1 ended at `0fb781a` with 91 files and 1176 tests, lint with zero warnings, and a clean build and format check. The gate is `npm test && npm run lint && npm run build && npm run format:check`. `npm test` takes about 60 s; use a 5-minute timeout.
- **DemoFrame stays portable.**
  - It imports nothing from `src/workbench`, and its strings are inline Arabic and English.
  - With none of the new props it behaves as today: same controls, names, focus and Code view. Its look may change to Woven tokens.
  - StreamingText's copied code uses it.
- **Page ids never change.** No new storage keys; new preferences are optional fields. No new routes.
- **State words.**
  - Use the spec §8 glossary verbatim.
  - Words outside the glossary (for example Loaded, Complete, Default) live in one shared `stateWords` table in `demo-states.ts`, and every task reuses it.
  - Labels never address the reader by gender.
- **Digits and Arabic type.** Arabic numbers go through `numberLocale`. Arabic labels are never uppercase or tracked; that styling sits behind `:lang(en)` only.
- **CSS.** Use tokens only. The demo-frame family is registered with the CSS audit (`src/system/css-audit.families.ts`) and must audit clean. Other families join the audit in Plan 3.
- **Motion.** Keyboard modality and reduced motion behave as in Plan 1. Under reduced motion, Replay still steps through the states, because they are content changes, but without transitions.
- **Copied code still works.** An example given no `phase` runs exactly as today.
- **Tests.**
  - Change existing tests only where the spec changes what they assert, and name each one in the commit.
  - Scope a page-wide "Copy code" or "Replay example" query to the frame only where it breaks (spec §12 item 8).
  - No mutation testing and no new harnesses.
- **Commits.** End each with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never push. Never start or stop dev servers.

## Review Focus

1. **A picked state survives an inspector edit.** A visitor picks a props state, then edits another prop: the switcher still shows the state the model is in. → Task 2, test `follows the model when the inspector edits a prop`.
2. **Interrupting Replay leaves no timers behind.** Pressing a state, switching to Code, changing page or unmounting stops it, and the pressed state matches what the stage shows. → Task 2, test `cancels replay on state press, Code view, page change and unmount`.
3. **Copied code still autoplays as today.** An example rendered with no `phase` runs as before. → Task 2 (ToolChips) and the existing `ai-content-pages.test.tsx:89–132` (StreamingText), which stays.
4. **Old saved props still load.** New optional keys default correctly, and saved old defaults move to the new resting state. → Task 3, test `loads saved props from before the states`.
5. **The Replay pill's visible word is part of its accessible name** in both languages (WCAG 2.5.3). → Task 1, test `keeps the visible Replay word inside its name`.

## Decisions made in this plan

These go beyond the spec. Each is cheap to reverse.

- **Replay pill word.**
  - The Arabic visible word is «إعادة تشغيل», not the spec's «إعادة التشغيل», so it stays inside the accessible name «إعادة تشغيل المثال».
  - When a caller passes its own `replayLabel` (StreamingDemo's «تشغيل المثال»), the pill shows only its icon, as today.
- **TaskRows resting state.** It rests on Running until Plan 4 adds Needs you.
- **Deferred to Plan 4,** because no prop can reach them today: ChatComposer Failed and Clarifying questions Failed. They join Answered, Expired, StreamingText Stopped and Failed, and Needs you there.
- **StreamingText frame.** In the workbench, StreamingText renders through `PreviewFrame` like every other page, so the page has exactly one frame. Its own internal frame remains only in copied code.
- **Old Replay paths.** The old remount and reset Replay stay for pages not yet converted. Task 5 deletes them.
- **Replay screenshots waived.** Spec §13's Replay screenshots on each lifecycle page are not captured. The unit tests cover Replay order, timing and cancellation, and the 390 px capture shows the states group scrolling.

---

### Task 1: The demo frame

**Model:** Sonnet

**Files:**
- Modify: `src/system/ai/examples/DemoFrame.tsx`
- Modify: `src/system/components.css`, the `.tz-demo-*` block at 4666–4849
- Modify: `src/system/tokens.css`, adding `--warp: color-mix(in srgb, var(--text) 6%, transparent)`
- Modify: `src/system/css-audit.families.ts`, adding `"demo-frame": [".tz-demo"]`
- Test: `src/workbench/demo-frames.test.tsx` (add cases)

**Interfaces:**
- Produces, exported from DemoFrame.tsx:
  - `DemoFrameState = { id: string; label: { ar: string; en: string } }`
  - `DemoFrameNotes = { useWhen: ReactNode[]; instead?: ReactNode[]; replaces?: ReactNode[]; notice?: ReactNode[] }`
- New optional DemoFrame props:
  - `name?: { ar: string; en: string }`
  - `states?: readonly DemoFrameState[]`
  - `state?: string`
  - `onStateChange?(id: string): void`
  - `notes?: DemoFrameNotes`
  - `onViewChange?(view: "preview" | "code"): void`
  - `replaying?: boolean`

**The frame (spec §7):**

- **Header, in reading order:**
  1. The name. The interface language's name comes first.
     - The Arabic name uses `--text-heading` and the English name `--text-subheading`, both at weight 600. These are the nearest scale steps to the spec's 20 and 17 px.
     - Each name carries its own `lang`.
  2. The states group.
  3. Replay.
  4. The View tablist.
  5. Copy.

  Below 620 px, the name takes its own row and the states group scrolls horizontally instead of wrapping.
- **States group.**
  - `div.tz-demo-states[role=group]` named «حالات المثال» / "Example states". It sits outside `.tz-demo-header`'s button row.
  - Each state is a `button[type=button][aria-pressed]` whose name is its visible word.
  - Focus moves with plain Tab (no roving). Pressing a state calls `onStateChange` and keeps focus.
  - `onViewChange` fires whenever the View tablist changes.
- **Status.** The frame keeps one polite status.
  - When `state` changes after mount and `replaying` is not true, it says «الحالة: {label}» / "State: {label}".
  - While `replaying` is true it stays silent. When `replaying` turns false, it announces the current state once.
  - Copy messages keep using the same status.
- **Replay.**
  - A dark pill with the Play icon and the visible word «إعادة تشغيل» / "Replay".
  - Its accessible name stays «إعادة تشغيل المثال» / "Replay example".
  - With a caller `replayLabel` it is icon-only and named by that label, as today.
  - It is unmounted in the Code view.
- **Focus.** State buttons and the pill show the standard focus ring (spec §11).
- **Stage.**
  - `.tz-demo-stage`: paper, with vertical warp lines 1 px every 14 px in `--warp`, under a radial mask that fades them toward the edges.
  - Padding 48 × 24 px. Below 620 px: 30 × 12 px, and no minimum height.
  - Minimum height 380 px.
  - The Code view sits in a well (`--surface-well`) inside the paper.
- **Notes.**
  - `div.tz-demo-notes`: a tray band under the stage, with three columns from 620 px up and stacked below.
  - Each column is an `h3` label plus a list.
  - Arabic labels: «استخدمه عندما» · «استخدم غيره عندما» · «لاحظ». When `replaces` is given, «يحل محل» takes the middle column.
  - English labels: "Use it when" · "Use something else when" · "What to notice" ("Replaces"). Each label carries `lang`, so the English-only mono, uppercase and tracked styling sits behind `:lang(en)`.
- **Audit.** The whole `.tz-demo` block must audit clean. Today it fails 12 times: raw radii, a `+ 80ms`, `scale(0.96)`, literal line heights, and a title that uppercases unless `:lang(ar)`.

- [ ] **Step 1: Write the failing tests** in `demo-frames.test.tsx`. Keep the existing standalone tests passing.
  - **`renders the states group and reports a press`:**
    - the group is named «حالات المثال»;
    - `aria-pressed` follows `state`;
    - a click calls `onStateChange("b")`, and focus stays on that button.
  - **`announces a state change, but not the first render or replay steps`:**
    - the status reads «الحالة: …» after a rerender with a new `state`;
    - it is silent while `replaying`;
    - it announces once when `replaying` ends.
  - **`reports view changes`:** pressing Code calls `onViewChange("code")`.
  - **`keeps the visible Replay word inside its name`:**
    - Arabic: «إعادة تشغيل» is contained in «إعادة تشغيل المثال».
    - English: "Replay" in "Replay example".
    - With `replayLabel`, the pill has no visible word.
  - **`renders the notes row with its three labels`:** the labels in order for Arabic and English, and «يحل محل» when `replaces` is set.
  - **`shows both names, interface language first`:** each name carries its own `lang`.
- [ ] **Step 2: Run them.** `npx vitest run src/workbench/demo-frames.test.tsx`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** the props, markup and CSS, then register the family.
- [ ] **Step 4: Gate.** The full gate passes, and the `demo-frame` audit returns `[]`.
- [ ] **Step 5: Commit**: `feat(docs): add states, notes and names to the demo frame`.

### Task 2: States mechanism, Replay and page order

**Model:** Opus. This is cross-cutting state plumbing with dialog focus.

**Files:**
- Create: `src/workbench/demo-states.ts`, `src/workbench/docs-notes.ts` (types and an empty map), `src/workbench/demo-states.test.tsx`
- Modify:
  - `src/workbench/Workbench.tsx`: page order, kicker, phases, the Replay engine;
  - `src/workbench/PreviewFrame.tsx`: forward the new DemoFrame props;
  - `src/workbench/Playground.tsx`: accept `phase` / `onPhaseChange` and forward them;
  - `src/workbench/catalog.ts`: export `groupOf(id): Localized`;
  - `src/workbench/demo-capabilities.ts`: converted pages show Replay only when they have a sequence;
  - `src/system/ai/examples/ToolActivityExamples.tsx`: `ToolChipsExample` gains a phase;
  - the section-order checks in `tests/browser/{ai-context-controls,ai-context-controls-extra,feedback-photos,labeled-input,steps-timeline}.mjs`;
  - existing tests whose expectations the four pilots change.

**Interfaces:**
- Consumes: Task 1's DemoFrame props.
- Produces:

  ```ts
  // demo-states.ts
  export interface DemoStateDef {
    id: string;
    label: Localized;
    props?: Record<string, unknown> | ((language: Language) => Record<string, unknown>);
    matches?(model: PlaygroundModel): boolean;
    phase?: string;
  }
  export interface DemoStatesDef { states: readonly DemoStateDef[]; resting: string; replay?: readonly { state: string; ms: number }[] }
  export const stateWords: Record<string, Localized>; // words beyond the spec glossary, shared by all tasks
  export const demoStates: Partial<Record<ComponentId, DemoStatesDef>>;
  export function stateOf(id: ComponentId, model: PlaygroundModel, phase: string | undefined, language: Language): string | undefined;
  // docs-notes.ts
  export interface PageNotes { useWhen: readonly Localized[]; instead?: readonly { text: Localized; page?: ComponentId }[]; notice?: readonly Localized[] }
  export const docsNotes: Partial<Record<ComponentId, PageNotes>>;
  ```

- **`stateOf` matching order:**
  1. phase states, matched by `phase`;
  2. props states with `matches`, matched by `matches(model)`;
  3. other props states, matched when every resolved prop equals the model's value.

  The first match wins.
- **The phase contract.** Lifecycle examples gain `phase?: string; onPhaseChange?(phase: string): void`.
  - With `phase`, the example shows that phase and never ends it by itself. It may animate inside the phase, as StreamingText streams its chunks.
  - Only an interaction, after its simulated host delay, or the workbench moves it to another phase. The example reports that through `onPhaseChange`.
  - Without `phase`, it runs exactly as today.

**Behavior (spec §8):**

- **Props states.**
  - State presses and Replay steps go through `fromInspector`, the inspector's path. It cancels Button's simulated action and remounts where an edit needs it.
  - Values persist with the page's other props.
  - Each family's defaults equal its resting state.
- **Phase states.**
  - Workbench keeps `phases` per page in React state, not persisted.
  - Opening a page shows its resting phase. A press sets the phase, and `onPhaseChange` updates it.
- **Replay** shows only when a page has `replay`.
  - Each step applies a state, then waits `ms`, between 800 and 2,600 ms (spec §16). The pressed state follows the steps.
  - The workbench passes `replaying` to the frame while it runs.
  - A state press, `onViewChange("code")`, a page change or unmount stops it and clears its timers.
  - Replay keeps focus.
- **Page order.** Heading, then the playground section (frame with notes), then "Use it in your app", then the API reference.
  - The kicker is the page's group name, from `groupOf`.
  - The playground section keeps its single status node, which `ai-content-pages.test.tsx:249–269` checks.
- **Name and notes.**
  - `name` comes from the catalog name pair.
  - `notes` come from `docsNotes` when present.
  - An "instead" item renders as a link button with the target page's catalog name. Activating it opens that page and moves focus to `main`.
- **Pilots.** These prove both paths; the other families come in Tasks 3–5.
  - Button (props): Idle★ · Loading · Success · Error · Disabled. Replay: Idle → Loading → Success.
  - Sheet (props): Closed★ · Open. Open sets `{ mode: "controlled", open: true }`.
    - Opening moves focus into the dialog, and closing reports Closed.
    - Because Radix returns focus to its own trigger, the workbench moves focus back to the Open state button after a close that began from it.
  - Terminal (props `state`): Running · Done★ · Failed. Replay: Running → Done.
  - ToolChips (phase): Running · Done★. Replay: Running → Done.
- **Unconverted pages** keep today's Replay until Task 5 removes it. Branch on `demoStates[id]`.

- [ ] **Step 1: Write the failing tests** in `demo-states.test.tsx`:
  - **`opens each pilot page on its resting state`.**
  - **`applies a props state through the inspector path`:** pressing Loading on Button sets the inspector's state select to `loading`.
  - **`follows the model when the inspector edits a prop`:** changing Button's state in the inspector moves `aria-pressed` to match.
  - **`holds a phase until it is changed`:** ToolChips' Running stays pressed and running until Done is pressed.
  - **`plays Replay in order`:** with fake timers, check the steps' order, and that it ends on the last step.
  - **`cancels replay on state press, Code view, page change and unmount`:** no timer fires afterwards, and `vi.getTimerCount()` is 0 after unmount.
  - **`returns focus to the Open state after the sheet closes`.**
  - **`runs as before without a phase`:** `ToolChipsExample` rendered alone still advances on its own.
  - **`puts the demo before the prompt`:** the order of the `.component-page > section` elements.
- [ ] **Step 2: Run them.** `npx vitest run src/workbench/demo-states.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement.** Update the five browser scripts' section order to playground, agent, reference. Update only the existing tests the pilots break, and name each in the commit.
- [ ] **Step 4: Gate.** The full gate passes.
- [ ] **Step 5: Commit**: `feat(docs): run demo states and replay from the workbench`.

### Task 3: Props states for the remaining families

**Model:** Sonnet

**Files:**
- Modify:
  - `src/workbench/demo-states.ts`;
  - `src/workbench/model.ts`: defaults to match each ★, a new `open` key on the Modal model, and `retiredDefaults` for changed defaults;
  - `src/workbench/fields.ts`: ContextMeter's `high` option;
  - `src/workbench/Playground.tsx`: Modal's controlled `open`;
  - `src/system/ai/examples/OverlayExamples.tsx`: ModalExample accepts `open` / `onOpenChange`;
  - `src/system/ai/examples/AIContextExamples.tsx`: a `high` preset;
  - the tests these pages break.
- Test: `src/workbench/demo-states.test.tsx` (add cases)

**Interfaces:**
- Consumes: Task 2's `demoStates`, `stateWords`, `stateOf` (with `props` functions and `matches`) and the Workbench wiring.

Convert these families with props states. Use their existing model keys, or at most one small new key per family; a family that needs more moves to Task 5. Labels come from the spec §8 glossary and `stateWords`; ★ marks the resting state.

- Use `props` as a function of the language wherever a value is text, such as the filled value or the error message.
- Use `matches` wherever a state covers a range, such as Filled for any non-empty value, Middle, Determinate, or Data.

| Family | States | Keys |
| --- | --- | --- |
| Input, Textarea | Empty · Filled★ · Invalid · Disabled · Read-only | value, error, disabled, readOnly |
| Select | Empty · Selected★ · Invalid · Disabled | value, invalid, disabled |
| Checkbox | Unchecked · Checked★ · Invalid · Disabled | checked, error, disabled |
| RadioGroup | Unselected · Selected★ · Invalid · Disabled | value, error, disabled |
| Switch | Off · On★ · Disabled | checked, disabled |
| Slider | Default★ · Disabled | disabled |
| Sidebar | Expanded★ · Collapsed | mode controlled + collapsed |
| Pagination | First · Middle★ · Last | page |
| DataTable | Loaded★ · Loading · Empty | preset |
| Avatar | Photo★ · Initials | appearance |
| Progress | Determinate★ · Indeterminate · Complete; Replay Determinate → Complete | value, indeterminate |
| DropdownMenu, Sheet | Closed★ · Open | mode controlled + open |
| Modal | Closed★ · Open | controlled + new `open` |
| Charts (4) | Data★ · Empty | sample |
| ContextMeter | Normal★ · High · Near · Over | preset; add `high` at 16,800 of 20,000 |
| ImageResult | Loading · Loaded★ · Error | state |
| Sources | Collapsed · Expanded★ | defaultExpanded (the page remounts on change, as today) |
| ThinkingState | Working★ · Done; Replay Working → Done | active |

Sheet already has its states from Task 2; keep them. Two existing tests move to the new rule:

- The Textarea test where Replay clears the text (`demo-frames.test.tsx:80–98`) moves to the inspector's «إعادة ضبط المعاينة» (spec §13).
- The Replay availability table (`demo-frames.test.tsx:100–125`) follows the new rule for converted pages.

- [ ] **Step 1: Write the failing tests:**
  - **`applies every props state`:** a single `it.each` over the families above.
    - Press each state: it becomes pressed, and the model key it sets changes.
    - A fresh page opens on ★.
  - **`loads saved props from before the states`:**
    - a saved `tiraz.playgrounds.v2` without the new keys loads, and Modal's `open` defaults to `false`;
    - a saved old default moves to the new ★ through `retiredDefaults`.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.** Where a ★ differs from today's default, change the default, add the old value to `retiredDefaults`, and name the generated-code tests this affects.
- [ ] **Step 4: Gate.** The full gate passes.
- [ ] **Step 5: Commit**: `feat(docs): add props states for forms, data, overlays and charts`.

### Task 4: Lifecycle phases for the AI parts and decisions

**Model:** Opus. It covers the Selection API and the approval flows.

**Files:**
- Modify these examples in `src/system/ai/examples/`:
  - AIContentExamples.tsx (StreamingText);
  - ToolActivityExamples.tsx (ToolCall);
  - TaskRowsExamples.tsx;
  - ChatExamples.tsx (ChatThread, ChatComposer, PromptBar);
  - AIContextExamples.tsx (SelectionActions);
  - AIDecisionsExamples.tsx (AskUserQuestions, ApprovalCard, ApprovalFlow).
- Also modify: `src/workbench/demo-states.ts`, `src/workbench/Playground.tsx`, `src/workbench/PreviewFrame.tsx` (StreamingText goes through the frame), and the tests these pages break.

**Interfaces:**
- Consumes: Task 2's phase contract and `stateWords`.

| Family | States (★ resting) | Replay |
| --- | --- | --- |
| StreamingText | Streaming · Done★ | Streaming → Done |
| ToolCall | Pending · Running · Done★ · Failed | Pending → Running → Done |
| TaskRows | Running★ · Done | Running → Done |
| ChatThread | Default · New message★ | Default → New message |
| ChatComposer | Empty · Writing★ · Submitting | — |
| PromptBar | Empty · Writing★ | — |
| SelectionActions | Idle · Selected★ (the workbench selects the sample sentence with the Selection API) | — |
| Clarifying questions (ask-user-questions) | Asking★ | — |
| Approval request (approval-card) | Waiting★ · Approved · Rejected | — |
| Approval sequence (approval-flow) | First★ · Second · Done | — |

Each example keeps its interactions. Approving, submitting or sending moves it on after its simulated host delay, and the new phase is reported.

- [ ] **Step 1: Write the failing tests:**
  - **`applies every phase state`:** a single `it.each`. Each state shows a visible marker of that phase.
  - **`follows an interactive flow`** in `ai-decisions-pages.test.tsx`:
    - approving on the approval-card page moves the pressed state to Approved;
    - deciding the first request on approval-flow moves it from First to Second.
  - Rewrite only `demo-frames.test.tsx:48–79`, StreamingText's in-workbench autoplay, as a Replay test. Keep `ai-content-pages.test.tsx:89–132` (standalone autoplay without a phase) unchanged.
  - The streaming-text page renders exactly one `.tz-demo-frame`.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Gate.** The full gate passes.
- [ ] **Step 5: Commit**: `feat(docs): add lifecycle states to the AI parts`.

### Task 5: Remaining families and removal of the old Replay

**Model:** Sonnet

**Files:**
- Modify the examples for:
  - OTPInput, DatePicker, TagInput, InputCopy;
  - FileDropzone, FileTree;
  - Steps, FilterBar, DataTable (Sorted);
  - NotificationList, Accordion;
  - Toast, Skeleton.
- Also modify: `src/workbench/demo-states.ts`, `src/workbench/Workbench.tsx` (delete the 13-id remount list and the reset Replay), `src/workbench/demo-capabilities.ts` (Replay only where `demoStates[id]?.replay` exists), and the tests these changes break.

| Family | States (★ resting) | Replay |
| --- | --- | --- |
| OTPInput | Empty · Partial · Complete★ · Invalid | — |
| DatePicker | Empty · Selected★ · Invalid | — |
| TagInput | Empty · Tagged★ · Invalid | — |
| InputCopy | Idle★ · Copied · Failed | — |
| FileDropzone | Empty · Files added★ · Invalid | — |
| FileTree | Collapsed · Expanded★ · Selected | — |
| Steps | Start · Midway★ · Error · Complete | Start → Midway → Complete |
| FilterBar | No filters · Filtered★ | — |
| DataTable | adds Sorted to Task 3's states | — |
| NotificationList | Unread★ · All read · Empty | — |
| Accordion | Closed · Open★ | — |
| Toast | Hidden★ · Shown | Hidden → Shown |
| Skeleton | Loading · Loaded★ | Loading → Loaded |

For each family, use a phase, or seed the example's internal state from one small prop. Choose whichever needs less change.

- [ ] **Step 1: Write the failing tests:**
  - **`applies every remaining state`:** a single `it.each`.
  - **`shows Replay only where a sequence exists`:** walk `navigationCatalog`.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.** Delete the old Replay paths and update the existing Replay tests they break, naming each in the commit.
- [ ] **Step 4: Gate.** The full gate passes.
- [ ] **Step 5: Commit**: `feat(docs): finish demo states and retire the old replay`.

### Task 6: Notes for every page

**Model:** Sonnet

**Files:**
- Modify: `src/workbench/docs-notes.ts`, filling in all 67 `navigationCatalog` pages.
- Modify the stale text (spec §12 item 4). After Tasks 4 and 5, these passages describe behavior that no longer exists:
  - `src/system/ai/README.md` around 684–694;
  - `src/workbench/generate.ts` around 649–650;
  - `src/system/ai/registry.json` around 1985.

  The stale behaviors include the playground autoplaying, an icon-only Replay, and "Replaying … restores its initial component props". Update each passage to the new frame.
- Test: `src/workbench/docs-notes.test.ts`

Content rules (spec §7 and §16; voice: `docs/arabic-voice.md`):

- **Use it when:** one to three items, each a plain, specific sentence from the user's side.
- **Use something else when:** one or two items, each naming its alternative page through `page`.
- **What to notice:** one or two items about behavior a reader might miss, such as keyboard, RTL or digits.
- Never repeat the page description. Both languages say the same thing.

- [ ] **Step 1: Write the failing test** `docs-notes.test.ts`:
  - every page has at least one non-empty `useWhen` in both languages;
  - every `instead.page` is a navigable id other than its own page;
  - a rendered page shows the three `h3` labels.
- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Write the notes** and update the stale text.
- [ ] **Step 4: Gate.** The full gate passes.
- [ ] **Step 5: Commit**: `docs(workbench): write notes for every page`.

### Task 7: After evidence and verification

**Model:** Haiku

- [ ] **Step 1: Run the gates.** `npm test && npm run lint && npm run build && npm run format:check`. Report the totals.
- [ ] **Step 2: Check the server.** `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5411/` prints `200`. If not, stop and report.
- [ ] **Step 3: Capture evidence.** Once per variant (`ar-light`, `ar-dark`, `en-light`, `en-dark`, `ar-light-390`), with a 10-minute timeout:

  ```bash
  TIRAZ_PLAYWRIGHT=/Users/amjedfadul/.npm/_npx/e41f203b7505f1fb/node_modules/playwright TIRAZ_EVIDENCE=docs/woven/after-demo-frame TIRAZ_VARIANTS=<variant> node tests/browser/woven-evidence.mjs
  ```

  Expected: `<variant>: 67 screenshots` each.
- [ ] **Step 4: Commit**: `docs(woven): capture demo frame evidence`.

### Task 8: Whole-plan review

**Model:** Opus

- [ ] **Step 1: Review** the diff from the plan's commit against spec §6–8, §11, §12 items 4 and 8, and §13.
  - Check each Review Focus item has its test.
  - Compare evidence for Button, Input, Checkbox, Sheet, DataTable, Terminal, ToolCall, ToolChips, StreamingText and ApprovalCard:
    - `docs/woven/after-foundations/ar-light` with `docs/woven/after-demo-frame/ar-light`;
    - `docs/woven/before/ar-light-390` with `docs/woven/after-demo-frame/ar-light-390`.
- [ ] **Step 2: Write `docs/woven/plan-2-review.md`** with:
  - findings ranked by severity;
  - a must-fix-now list;
  - what is deferred to Plans 3 and 4.

  Commit it.
- [ ] **Step 3: Apply the must-fix list.** One Sonnet fix wave, then one scoped Opus re-review. Then continue to Plan 3 without a checkpoint (Amjed, 19 Oct).
