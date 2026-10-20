# Woven AI Patterns Implementation Plan (Plan 4 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task by task. Each task names its implementer model on its **Model:** line. A fresh Opus subagent reviews every task, and only Critical and Important findings enter fix rounds (see the roadmap). Steps use checkbox (`- [ ]`) syntax for tracking. Keep it lean (Amjed, 19–20 Oct: "don't over-engineer stuff"): build what your task names, write only the tests it names, and add no extra helpers, harnesses or out-of-scope changes. Reviewers report Critical and Important findings only, in under 30 lines.

**Goal:** Wave 1 of the AI task patterns. Eight patterns each finish a job: Start a task, Cited answer, Agent task, Clarifying questions, Approval request, Suggested edits, Image generation and What changed. The plan also covers the shared parts they are built from, their documentation pages, the AI navigation regrouped by job, the two screens, and agent docs that lead with patterns.

**Architecture:**

- **Patterns.** Each new pattern is `src/system/<Pattern>.tsx`, with CSS under its own `tz-` prefix in `components.css`. Its example, `src/system/ai/examples/<Pattern>Examples.tsx`, plays the host. Patterns render host state and emit intents; they never run their own lifecycle.
- **Shared parts first** (Task 1): the AI mark, status pill, tray, countdown, a decision bar with scoped shortcuts, and one count and duration formatter. Existing parts gain additive props only.
- **Pages.** Every pattern page reuses Plan 2's demo frame, the `demo-states.ts` phases and `docs-notes.ts`. Task 8 adds the pattern-only page sections and regroups the navigation once all eight patterns exist.

**Tech Stack:** React 19, TypeScript ~6.0, Vite 8, Vitest 5 (jsdom) with Testing Library, the Radix primitives already installed, lucide-react, postcss (the CSS audit).

**Spec:** `/Users/amjedfadul/Tiraz-worktrees/woven/docs/superpowers/specs/2026-10-18-ai-task-patterns-design.md`. "§N" below means this file. "Woven §N" is `…/specs/2026-10-18-woven-visual-language-design.md` and "Docs §N" is `…/specs/2026-10-18-workbench-docs-design.md`. Roadmap: `docs/superpowers/plans/2026-10-18-woven-roadmap.md`.

**Scope:**

- **In scope:**
  - §3–12, §13a and §14–20, for Wave 1;
  - Docs §6, the «يحل محل» column of §7, Docs §8's AI rows, Docs §9 and §11;
  - Woven §13 and §14;
  - the Woven §17.8 items Plan 3 left to this plan: AIMark in ThinkingIndicator and ThinkingState, and the tray anatomy and attention pill on the decision parts.
- **Out of scope:**
  - Wave 2 (§13) waits for Amjed's review of Wave 1.
  - Plan 1's Minor 6 (regional Arabic tags in `numberLocale`) stays in the backlog.

**Starting point** (verified 20 Oct on `085f6c5`, with Plan 3 Task 7 in flight):

- **StatusIcon** exists with all seven states (`src/system/StatusIcon.tsx`) and is exported.
- **Digits.** Sources, InlineCitation, the ApprovalFlow announcement, InsightCards and `src/examples/dashboard/Dashboard.tsx` already format through `numberLocale`. The two tests §16a asks for first exist:
  - `ai-results.test.tsx` "agrees Arabic source counts with their noun";
  - `ai-decisions.test.tsx`'s digit-key tests.
- **Tokens.** These exist in `tokens.css`: `--ai`, `--ai-soft`, `--attention`, `--attention-soft`, `--surface-tray`, `--tray-pad`, `--radius-tray`, `--radius-paper`, `--shadow-paper`, `--shadow-chip`, `--warp`, `--paper-padding-block`, `--paper-padding-inline`, `--motion-loop-stitch`, `--motion-loop-turn`, `--motion-loop-shimmer` and `--motion-word-settle`.
- **Name clashes.**
  - `.tz-agent-task` is already TaskRows' row class.
  - `ChatMessage` is already the exported message record type.
  - See Decisions 5 and 1.
- **Reduced motion.** Eight examples copy their own reduced-motion hook. `useReducedMotion` (`src/system/useReducedMotion.ts`) is internal today.
- **Registry.**
  - `src/system/ai-registry.test.ts` requires registry component ids to equal catalog ids in the same order.
  - It requires `publicExports` to equal every `index.ts` export.
  - It requires each documented prop to exist, with the right required flag.
- **Depends on Plan 3 Task 9.** The `ar-light-forced` variant and `TIRAZ_FULLPAGE=1` in `tests/browser/woven-evidence.mjs` exist only after it lands.

## Global Constraints

**From the spec.** Every task's requirements include these sections. Read them before your task's own:

- §5, the anti-goals;
- §6's Arabic-first, controlled-API, accessibility and motion rules;
- §8, how a pattern works in code, including its keyboard-shortcut rules;
- §9's three anatomy rules;
- §15, copy, numbers and agreement;
- §16a's additive-only rule;
- §18, accessibility.

**Amjed's rules for this plan.**

- **Commits.** One commit per task, with the task's message and no Co-Authored-By trailer (Amjed, 20 Oct). Never push or merge.
- **Other worktrees.** Never modify `component-craft`, `numerals` or `landing-night-loom`. Task 7 reads `landing-night-loom` read-only.
- **Servers and the browser.**
  - Subagents never start or stop dev servers. The controller keeps the `woven` dev server at http://127.0.0.1:5411.
  - Playwright lives at `/Users/amjedfadul/.npm/_npx/e41f203b7505f1fb/node_modules/playwright`.
  - Restore the workbench preferences after any browser use: clear the localStorage you changed, or set it back.
- **Copy.** Arabic first, with gender and number agreement, and digits through `numberLocale`.
- **Gate.**
  - `npm test && npm run lint && npm run build && npm run format:check`. `npm test` takes about 60 s; use a 5-minute timeout. Lint stays at 0 warnings.
  - The CSS audit (`src/system/css-audit.ts`, with every family registered in `src/system/css-audit.families.ts`) returns `[]`. It is the gate for every new CSS family.
- **Working directory.** `/Users/amjedfadul/Tiraz-worktrees/woven`, branch `claude/woven`. Start each shell command with `cd /Users/amjedfadul/Tiraz-worktrees/woven && `.

**Carried from Plans 1–3** (binding on all new CSS):

- **Tokens only.**
  - A duration without a token gets one in `tokens.css`. Put it on the root, in both reduced-motion blocks, and in the keyboard-modality block, unless it is a loop or streamed text.
  - Then extend the `motion` map and the keyboard `kept` list in `tokens.test.ts`.
- **Motion only after change.** Persistent content never animates on mount (`useChanged` / `data-changed`). Animate only `transform` and `opacity`, except for Woven §20's listed exceptions.
- **Forced colors.** Keep `border: 1px solid transparent` where an edge is only a shadow or ring.
- **Tests.**
  - Change an existing test only where this plan changes what it asserts, and name it in the commit.
  - Tests check behavior that matters: decision safety, focus, live regions, Arabic agreement and digits, and states. No mutation checks, no new harnesses, no CSS-reading tests.

## Review Focus

1. **No key approves something the person hasn't read or can't undo.**
   - ApprovalFlow moves focus to a new card after each decision, and a re-planned task changes under the cursor. A held or repeated key must not act on either.
   - A request marked both reversible and irreversible gets no shortcut.
   - → Task 2, `approves a reversible request…` and `never approves the next request with a held or repeated chord`; Task 1, `runs a Mod+Enter action once…`; Task 3, `starts the plan from its countdown…`.
2. **A decision in flight when the host expires the request records nothing.** → Task 2, `expires on the host's word, aborting a decision in flight`.
3. **Input-method composition never picks, steers or sends.** This covers Arabic, Japanese and other IMEs in the new text entries. → Task 5, `never chooses or submits while composing`, and Task 3, `steers … never while composing`.
4. **Arabic counts agree at every plural boundary and under Western digits.** These counts include steps, operations, sources and edits. → Task 1, `agrees Arabic counts…`; Task 3, `counts steps and operations…`; and Task 6, `closes into an agreeing receipt…`.
5. **Live regions stay quiet.** Elapsed time, streamed words, step durations and countdown ticks never reach a live region; each transition is announced once. → Task 1, `counts down, pauses and announces only once`; Task 3, `announces each status once and never the time`; and Task 4, `announces each status in one sentence…`.

## Decisions made in this plan

Each decision fills a spec gap or settles a conflict, and each is cheap to reverse.

1. **The single-message export is `ChatThreadMessage`.**
   - `ChatMessage` is already the exported record type. The record gains optional `status`, `error` and `onRetry` instead.
   - §11 and §16a name the component `ChatMessage` (a call).
2. **ApprovalCard expiry follows §12.5: `expiryLabel` and `expired`.** §16a's `expiresAt` is not added; it would imply a clock the card must not run.
3. **ApprovalCard gains `receiptTime?: ReactNode`.**
   - It is host-formatted text, for example «قبل دقيقة».
   - §12.5's receipt «تمت الموافقة · قبل دقيقة» has no API in the sketch.
4. **`AgentStep` gains `approval?`.**
   - It picks `impact`, `irreversible`, `reversible`, `expiryLabel`, `expired`, `secondaryAction`, `receiptTime` and `labels` from `ApprovalCardProps`.
   - AgentTask renders `request={step.request}` together with `{...step.approval}`.
   - The sketch's `request?: ApprovalRequest` cannot carry the impact list, irreversibility or expiry that the demo's inline approval shows.
   - Without `onDecision`, AgentTask shows the request's action and target as text, with no actions. A no-op handler would show «تمت الموافقة» for a decision no host recorded.
5. **AgentTask's CSS prefix is `tz-agent-run`.** `tz-agent-task` is TaskRows' row class.
6. **Decision roots keep their roles.** AskUserQuestions stays a `form`; ApprovalCard and ApprovalFlow stay a `group`. New patterns use §18's `section`. Hosts' tests and assistive tech rely on today's roles.
7. **TaskRows gets no `headingLevel`.** Its only heading is the default empty state's (EmptyState's `h3`), and hosts set that level through `emptyState`. §16a lists the prop.
8. **Two sets of status words.**
   - **Pills.** StatusPill's defaults are §10's masculine forms (اكتمل، تعثّر، أُوقف). Patterns pass the form that agrees with their subject.
   - **Steps.** TaskRows, ToolCall, ToolChips and Agent task steps use §18's list: لم تبدأ، قيد التنفيذ، بانتظارك، مكتملة، تعثّرت، تُخطّيت. They label feminine subjects (المهمة، العملية، الخطوة).
   - Woven §13's table conflicts; Plan 1 sent "§13 state words in TaskRows" here.
9. **The answer parts are built with Cited answer** (Task 4) rather than with the shared parts. These are SourceChip, ThinkingPanel, FeedbackBar and FollowUps (§20 step 2); Cited answer is their only Wave 1 user.
10. **ThinkingPanel reuses ThinkingState's disclosure rules through a new internal `useDisclosure` hook** (Task 3), rather than wrapping ThinkingState. §16a keeps ThinkingState as-is, and it has no slot for the elapsed time.
11. **InlineCitation gains `mode="preview"`.** Hover or focus previews the source; Enter or click opens it (§12.2). The existing modes are unchanged.
12. **Dashboard with AI gets What changed only.** Its Ask your data panel and Decision inbox button wait for Wave 2.
13. **ImageGeneration gains `agent?` and `duration?`.** Its tray footer (§12.7) needs them, and the sketch lacks them.
14. **ChangeSummary's `sources` is `SourceReference[]`.** The sketch's `Source` type does not exist.
15. **Suggested edits' first-build screenshot (§12.6) is judged by Task 6's Opus reviewer.** It is not held for Amjed, who asked for no checkpoints (19 Oct).
16. **InlineDiff matches `event.code` (`KeyY`, `KeyN`) for Y and N**, so an Arabic layout works, as the 1–9 answer keys already accept Arabic-Indic digits. It ignores the keys with Ctrl, Meta or Alt, so Ctrl+Y and Ctrl+N never accept or reject a change.
17. **The 22 px greeting question uses `--text-title` (24 px).** That is the nearest heading token; the audit allows only tokens.
18. **Agent task's switcher gains Stopped.** The demo's Stop button reports a stopped phase, and Plan 2 asked pattern pages to use phases that report.
19. **AskUserQuestions additions:**
    - `receipt?: boolean` makes the receipt opt-in, so today's accepted state stays the default;
    - `agent?` names the asking agent in the header;
    - `onSkip` skips the whole set.
20. **TaskStarter gains a controlled `modeMenuOpen` / `onModeMenuOpenChange` pair.** Docs §8's Choosing mode state needs it. composition.md allows a controlled `open` that has its change callback.
21. **ChatApp's rename and delete are intents.** `onConversationRename(id)` and `onConversationDelete(id)` come from a per-row menu. The host owns the rename field and the confirmation.
22. **Only AI-group families get the registry's `kind`.** The other 45 families stay unmarked, since §17's four kinds do not describe them.
23. **Part tables on pattern pages list each prop's name, type, required flag and default.** They are generated from `registry.support`. The registry's prose is English-only, so prose stays in the page's own bilingual rows.
24. **WeaveCanvas reveals the image with a row-by-row `clip-path`**, like the landing's `weftClip`, rather than painting a `<canvas>` bitmap. It keeps the spec's name, and it works in jsdom.
25. **The count and duration formatters stay internal.** They live in `src/system/format.ts` and are not exported.
26. **Evidence lives in `docs/woven/after-patterns/`**, not §19's `docs/ai-patterns/` or Docs §13's `docs/workbench-docs/`, so all four plans' evidence sits together. Task 11 covers the 29 AI-group pages in the base four variants, and the nine pattern pages under §19's other conditions. Unit tests have no axe harness, so the final review runs axe in the browser.
27. **Inside a Sheet or Modal, Escape closes the dialog and records nothing.**
    - This replaces §16a behavior 4. Radix catches Escape on the document in the capture phase and prevents it, so `useShortcuts` ignores it. Today the dialog closes and the card also records a rejection.
    - Keeping behavior 4 would need a window-capture listener like Tooltip's, which would catch Escape before an open tooltip.
    - Task 10 corrects composition.md.

## Adding a pattern page

Every task that adds a pattern, or turns a part into one, follows this list. It names the files the workbench types already force: `Record<ComponentId, …>` and the `assertNever` chains.

1. **Component.**
   - Root: `section.tz-<prefix>` labelled by its title, with `data-status` and `data-appearance` (except the roots Decision 6 keeps).
   - The five §9 zones carry `data-zone="header" | "paper" | "evidence" | "decision" | "meta"`.
   - `appearance="card"` wraps the zones in `Tray`; `"plain"` drops the tray and the outer surface.
   - One live region: `span.tz-visually-hidden[role=status][aria-live=polite][aria-atomic=true]`, holding one sentence per status. Parts inside it that take `announcement` run with `announcement="off"` (§16a behavior 9). A nested pattern, such as Agent task's inline ApprovalCard, keeps its own region.
   - If a state change removes the focused control, focus moves to the pattern root (`tabIndex=-1`), as ImageResult's Retry already does. This covers Stop, Retry, Skip step, Reconnect, Regenerate, Apply, and the steering field when needs-you replaces it.
   - The default copy lives in an exported module constant `<camelName>Copy: { ar: <Pattern>Labels; en: <Pattern>Labels }`, picked by `config.direction === "rtl"`, with `labels` merged over it. It is not exported from `index.ts`. A label that holds a count is a function `(count: number) => string`.
   - Export the component and its types from `src/system/index.ts`.
2. **CSS.** Rules in `components.css` under the prefix. Register a family in `css-audit.families.ts`. The audit returns `[]`.
3. **Example.** `src/system/ai/examples/<Pattern>Examples.tsx`:
   - imports only from `../../index` and `./finance-story`;
   - plays the host, with `useState` for `status` and the handlers, so copied code runs as-is (§17);
   - takes `language`, `appearance`, its inspector keys, and Plan 2's `phase` / `onPhaseChange` pair: it holds a given phase and reports where the visitor moves it;
   - without a phase it rests on its resting state; nothing autoplays (Docs §8);
   - updates any elapsed time at most once per second (§10).
4. **Catalog.**
   - Add an entry at the top of `catalog` in `src/workbench/catalog.ts`, in §7's table order: `{ id, name: [ar, en], description: [ar, en], file }`.
   - The name comes from §7; the description is §12's "Job." sentence.
   - Put the id at the front of the `ai` group's `ids` until Task 8 regroups.
5. **Registry.**
   - In `src/system/ai/registry.json`, add a `components` entry at the same index as the catalog entry.
   - Give it `kind: "pattern"`, `parts` (the public parts it renders: registry component ids or support ids), `states`, `events` (its `on…` props) and `examples`.
   - Add `publicExports` entries for every new export, and `records` for exported record types hosts build (for example `AgentStep`).
   - Each new public part (§11) is exported from `index.ts` and gets a `support` entry with its props and purpose. Task 8's part tables and legend links read these entries.
6. **Workbench model** (`src/workbench/model.ts`): `Playgrounds["<id>"]` with `appearance: "card" | "plain"` (where the pattern has it) and at most one more key; defaults in `defaultPlaygrounds`.
7. **Fields** (`src/workbench/fields.ts`): an `appearance` select (`card`, `plain`) plus that key, in `fields` and `commonKeys`.
8. **Playground** (`src/workbench/Playground.tsx`): a branch passing `language`, the model, `phase` and `onPhaseChange`.
9. **Generated code** (`src/workbench/generate.ts`):
   - A `generateCode` branch that embeds the example's `?raw` source, as the AI families do.
   - It rewrites `from "../../index"` to `from "./system"`, and `from "./finance-story"` to `from "./system/ai/examples/finance-story"`.
   - Add the example to the raw list in `generate-prompts.test.ts`.
10. **API reference** (`src/workbench/ApiReference.tsx`): rows for the pattern's props, in both languages.
11. **States.**
    - In `src/workbench/demo-states.ts`, add the page's Docs §8 states as phases, its resting state and its Replay (steps of 800–2,600 ms).
    - New words go in the second block of `stateWords`.
    - If the example holds a visitor's decision, add the id to `restartOnEdit` in `Workbench.tsx`.
12. **Notes** (`src/workbench/docs-notes.ts`): `useWhen`, `instead` and `notice`, from the pattern's §12 "Use it when" and "Use something else when".
13. **Tests.**
    - A row in `demo-states.test.tsx`'s `phaseFamilies` table, saying what each state shows.
    - The AI list in `navigation-groups.test.tsx`.

---

### Task 1: Shared parts and helpers

**Model:** Opus. This task owns the shortcut safety rules, the countdown's pause and announcement, and the pill's one-time ping.

**Spec:**

- §8 keyboard rules; §10; §11's AIMark, StatusPill, Thread, Tray, Kbd, Countdown and DecisionBar, the public and internal split, and the reuse bullets;
- §15's counts and durations;
- §16a rows: LoadingState, useReducedMotion, and Sources' count;
- Woven §14, and Woven §17.8's ThinkingIndicator and ThinkingState rows.

**Files:**

- Create in `src/system/`: `AIMark.tsx`, `StatusPill.tsx`, `Thread.tsx`, `Tray.tsx`, `Kbd.tsx`, `Countdown.tsx`, `DecisionBar.tsx`, `useShortcuts.ts` and `format.ts`.
- Modify:
  - `index.ts`;
  - `Sources.tsx`, whose count uses `formatCount`;
  - `LoadingState.tsx`, whose elapsed time uses `formatElapsed`;
  - `ThinkingIndicator.tsx` and `ThinkingState.tsx`: AIMark replaces the morphing glyph and the sparkle;
  - `components.css`, `css-audit.families.ts` and `ai/registry.json`;
  - the eight examples that copy a reduced-motion hook. They import `useReducedMotion` from `../../index` instead: `ToolActivityExamples`, `AIContentExamples`, `TerminalExamples`, `ChatExamples`, `SkeletonExample`, `TaskRowsExamples`, `AIResultsExamples` and `AIFeedbackExamples`.
- Test: `src/system/pattern-parts.test.tsx`.

**Interfaces (Produces):**

```ts
// format.ts (internal). `config` is the shape numberLocale takes.
export type CountNoun = "record" | "source" | "image" | "edit" | "message" | "invoice" | "step" | "operation" | "hour" | "day" | "customer";
export function formatCount(count: number, noun: CountNoun, config: { direction?: Direction; numerals?: Numerals }): string;
export function nounGender(noun: CountNoun): "m" | "f";
export function formatElapsed(seconds: number, config: { direction?: Direction; numerals?: Numerals }, options?: { fractionDigits?: 0 | 1 }): string;
// Public.
export type StatusPillState = "idle" | "running" | "needs-you" | "completed" | "failed" | "stopped";
export interface StatusPillProps { state: StatusPillState; label?: ReactNode; elapsed?: number; className?: string }
export interface AIMarkProps { size?: "xs" | "sm" | "md"; working?: boolean; label?: string; className?: string }
export type TrayProps = Omit<ComponentPropsWithRef<"div">, "children"> & { header?: ReactNode; footer?: ReactNode; paper?: boolean; children: ReactNode };
export interface CountdownProps { seconds: number; paused?: boolean; onComplete: () => void; label?: (remaining: string) => string; announcement?: "polite" | "off"; className?: string }
export { useReducedMotion }; // (): boolean
// Internal.
export type Shortcut = "Escape" | "Mod+Enter";
export function useShortcuts(scope: RefObject<HTMLElement | null>, handlers: readonly { key: Shortcut; run: () => void; enabled?: boolean }[], contentKey?: string): void;
export interface DecisionAction { id: string; label: ReactNode; tone?: ButtonVariant; shortcut?: Shortcut; loading?: boolean; disabled?: boolean; onSelect: () => void }
export function DecisionBar(props: { actions: readonly DecisionAction[]; scope: RefObject<HTMLElement | null>; contentKey?: string; className?: string }): JSX.Element;
export function Kbd(props: { keys: readonly string[] }): JSX.Element;
export function Thread(props: { state: "running" | "completed" }): JSX.Element;
```

Later tasks write `formatCount(n, noun)` and `formatElapsed(seconds)` without the `config` argument; it is always `useSystem().config`.

**Behavior:**

- **Counts (§15).** Arabic follows `Intl.PluralRules("ar")`, with digits through `numberLocale`:
  - zero is «لا» plus the plural;
  - one and two are the table's words, with no digit;
  - few, many and other are `{n}` plus the table's word.

  English gives `{n} source` / `{n} sources`.

  | Noun | Gender | One | Two | Few | Many | Other | English |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | record | m | سجل واحد | سجلّان | سجلات | سجلًا | سجل | record |
  | source | m | مصدر واحد | مصدران | مصادر | مصدرًا | مصدر | source |
  | image | f | صورة واحدة | صورتان | صور | صورة | صورة | image |
  | edit | m | تعديل واحد | تعديلان | تعديلات | تعديلًا | تعديل | edit |
  | message | f | رسالة واحدة | رسالتان | رسائل | رسالة | رسالة | message |
  | invoice | f | فاتورة واحدة | فاتورتان | فواتير | فاتورة | فاتورة | invoice |
  | step | f | خطوة واحدة | خطوتان | خطوات | خطوة | خطوة | step |
  | operation | f | عملية واحدة | عمليتان | عمليات | عملية | عملية | operation |
  | hour | f | ساعة واحدة | ساعتان | ساعات | ساعة | ساعة | hour |
  | day | m | يوم واحد | يومان | أيام | يومًا | يوم | day |
  | customer | m | عميل واحد | عميلان | عملاء | عميلًا | عميل | customer |

- **Durations (§10, §15).**
  - Under a minute: `٦ث` / `6s`; with `fractionDigits: 1`, `٦٫٢ث` / `6.2s`.
  - Under an hour: `١د ١٢ث` / `1m 12s`, dropping a zero second part (`٢د` / `2m`).
  - From an hour: `١س ٢د` / `1h 2m`.
  - Negative values clamp to 0; a non-finite value gives `""`.
  - LoadingState keeps one fraction digit under a minute.
- **AIMark.**
  - The eight-point star in `--ai`, in a tile on `--ai-soft`. The glyph is 10, 13 or 16 px in an 18, 24 or 30 px tile (`xs`, `sm` or `md`; `sm` by default).
  - It is `aria-hidden` unless `label` is given; then it is `role="img"` with that name.
  - While `working`, it turns a quarter step every `--motion-loop-turn`. It is still under reduced motion.
- **StatusPill (§10).**
  - The word is real text; the dot is decorative.
  - Default words: idle «جاهز» / "Ready", running «يعمل» / "Working", needs-you «بانتظارك» / "Needs you", completed «اكتمل» / "Done", failed «تعثّر» / "Failed", stopped «أُوقف» / "Stopped". `label` replaces the word.
  - Colors follow §10's color roles.
  - `elapsed` (seconds) follows the word through `formatElapsed`, in a fixed `ch` width.
  - It pings once only when the state changes into needs-you (`useChanged`, `data-changed`), never on mount.
- **Thread.**
  - While running, a dashed line travels in the reading direction every `--motion-loop-stitch`.
  - When completed, it closes to a solid line over `--motion-state`.
  - Under reduced motion it is a still line at 45% opacity.
  - It is `aria-hidden`.
- **Tray (§9, Woven §9).**
  - The tray (`--surface-tray`, `--radius-tray`, `--tray-pad`) holds paper (`--surface`, `--radius-paper`, `--shadow-paper`, `--paper-padding-*`).
  - `header` and `footer` sit on the tray.
  - `paper={false}` puts the children straight on the tray.
- **Kbd.**
  - Renders `kbd.tz-kbd` with `dir="ltr"` and `aria-hidden`.
  - "Mod" shows «⌘» on Apple platforms (`/Mac|iPhone|iPad/` in `navigator.platform` or `navigator.userAgent`) and «Ctrl» elsewhere.
  - "Enter" shows «↵» with `tz-mirror-rtl`, and "Escape" shows «Esc».
- **useShortcuts (§8).** One `keydown` listener on `scope`.
  - It ignores an event that is `defaultPrevented`, `repeat` or composing (`isComposing`, or keyCode 229).
  - It ignores an event whose target is inside a `[role="menu"]`, `[role="listbox"]` or `[role="dialog"]` within the scope.
  - "Mod+Enter" is Enter with Ctrl or Meta and no other modifier. It is ignored for 500 ms after mount, and after `contentKey` changes. `contentKey` is a string, compared by value.
  - A handled key calls `preventDefault()`, so an outer scope skips it.
  - Inside a Sheet or Modal, Radix has already prevented Escape, so the card records nothing (Decision 27).
- **DecisionBar (§9, §11).**
  - It renders buttons on the tray in the given order, with the primary action moved last.
  - An action with a `shortcut` shows its `Kbd` inside the button. Its accessible description names the shortcut: «اختصار لوحة المفاتيح: Ctrl+Enter» / "Keyboard shortcut: Ctrl+Enter" (Cmd on Apple), and «… Esc».
  - It registers those shortcuts on `scope` through `useShortcuts`, each only while its action is neither disabled nor loading.
  - An action without a shortcut has no hint and no description.
- **Countdown (§11).**
  - A ring and a label. The default label is «خلال {t}» / "in {t}", where `{t}` is `formatElapsed(remaining)`.
  - A one-second timer counts down. It stops while `paused`, resumes from the time left, and calls `onComplete` once at zero.
  - The polite status renders empty. An effect after mount sets it to `label(total)`, because most screen readers ignore a live region that is inserted already holding its text. It never ticks.
  - The ticking label is `aria-hidden`. `announcement="off"` drops the status.
  - Unmount clears the timer. Under reduced motion the ring steps without a transition.
- **AIMark in ThinkingIndicator and ThinkingState** (Woven §14): `working` while active. `textOnly` still hides it. Delete the glyph rules that nothing renders any more.
- **CSS families:**
  - `"ai-mark": [".tz-ai-mark"]`;
  - `"status-pill": [".tz-status-pill"]`;
  - `"thread": [".tz-thread"]`;
  - `"tray": [".tz-tray"]`;
  - `"countdown": [".tz-countdown"]`;
  - `"decision-bar": [".tz-decision-bar"]`.
- **Registry.**
  - `publicExports` gains AIMark, AIMarkProps, StatusPill, StatusPillProps, StatusPillState, Tray, TrayProps, Countdown, CountdownProps and useReducedMotion.
  - `support` gains entries `ai-mark`, `status-pill`, `tray`, `countdown` and `reduced-motion`, each with its props and purpose.

- [ ] **Step 1: Write the failing tests** in `src/system/pattern-parts.test.tsx`:
  - **`agrees Arabic counts across the six plural categories and by gender`:**
    - with `{ direction: "rtl" }`, `formatCount(n, "source", config)` for 0, 1, 2, 3, 10, 11, 99 and 100 gives «لا مصادر», «مصدر واحد», «مصدران», «٣ مصادر», «١٠ مصادر», «١١ مصدرًا», «٩٩ مصدرًا» and «١٠٠ مصدر».
    - "message" gives «رسالة واحدة», «رسالتان», «٣ رسائل» and «١١ رسالة».
    - `numerals: "latn"` gives «3 مصادر», and English gives "1 source" and "3 sources".
    - `nounGender("message")` is "f", and `nounGender("source")` is "m".
  - **`formats elapsed time in Arabic and English`:**
    - 6 gives «٦ث» / "6s", and 6.2 with one fraction digit gives «٦٫٢ث» / "6.2s";
    - 72 gives «١د ١٢ث» / "1m 12s", 220 gives «٣د ٤٠ث», and 120 gives «٢د»;
    - 3720 gives «١س ٢د» / "1h 2m";
    - -3 gives «٠ث», and NaN gives "".
  - **`names each pill state in words and pings only on a change to needs-you`:**
    - the six default words in Arabic and in English;
    - `label` replaces the word, and `elapsed={72}` shows «١د ١٢ث»;
    - mounting on needs-you has no `data-changed`; a rerender from running to needs-you sets it.
  - **`hides the AI mark unless it is named`:**
    - it is `aria-hidden` by default;
    - with `label="المساعد"` it is an img named «المساعد»;
    - ThinkingState and ThinkingIndicator render `.tz-ai-mark`.
  - **`runs a Mod+Enter action once, only from inside its scope, never on repeat or within 500 ms of a change`** (fake timers). A DecisionBar with a primary "Mod+Enter" action sits inside a `section`:
    - after 500 ms, Ctrl+Enter on a focused child calls it once, and so does Meta+Enter;
    - `repeat: true` does not;
    - a rerender with a new `contentKey` blocks it until 500 ms pass;
    - while the action is `loading` or `disabled`, it does not;
    - a keydown from outside the scope does not, and neither does one from a `[role="menu"]` inside it.
  - **`shows key hints only on real shortcuts, in the accessible description, primary last`:**
    - the Escape action's button is described as «اختصار لوحة المفاتيح: Esc», and its kbd is `aria-hidden`;
    - an action without a shortcut has no kbd and no description;
    - the primary button is the last button.
  - **`counts down, pauses and announces only once`** (fake timers), with `seconds={5}` and ``label={(t) => `تبدأ تلقائيًا خلال ${t}`}``:
    - the status reads «تبدأ تلقائيًا خلال ٥ث», and still reads it after 2 s;
    - rerender `paused` and advance 10 s: `onComplete` is not called;
    - unpause and advance 3 s: it is called once;
    - after unmount, `vi.getTimerCount()` is 0.
- [ ] **Step 2: Run them.** `npx vitest run src/system/pattern-parts.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Move Sources and LoadingState to the shared helpers. Their tests keep passing. Update a test only where LoadingState's text changes past a minute (now «١د ١٢ث»), and name it in the commit.
  - Swap the eight examples' hooks.
- [ ] **Step 4: Gate.** The full gate passes, and the new families audit `[]`.
- [ ] **Step 5: Commit**: `feat(ai): add the shared pattern parts`.

### Task 2: Decision patterns: Clarifying questions, Approval request, Approval sequence

**Model:** Opus. Decision safety and shortcuts.

**Spec:**

- §12.4, §12.5, §8, §9, §10, §14 (the story fixture), §16's rows for these pages, §16a's AskUserQuestions, ApprovalCard and ApprovalFlow rows, and §18;
- Woven §17.8's decision row: the tray anatomy, the attention pill and Kbd hints;
- Docs §8's states for the three pages.

**Carried in** (Plan 2 review):

- Clarifying questions gains Answered and Failed (m12).
- Approval request gains Expired.
- A decision in flight when its request changes or expires is aborted.

**Files:**

- Create: `src/system/ai/examples/finance-story.ts`.
- Modify:
  - in `src/system/`: `ApprovalCard.tsx`, `ApprovalFlow.tsx`, `AskUserQuestions.tsx`, `index.ts`, `components.css` (the decision sections), `ai/registry.json` and `ai/examples/AIDecisionsExamples.tsx`;
  - in `src/workbench/`: `catalog.ts` (names and descriptions), `model.ts`, `fields.ts` (also `optionNames`: `card` «بطاقة» / "Card", `plain` «مدمج» / "Plain"), `ApiReference.tsx`, `demo-states.ts`, `docs-notes.ts`, and `Workbench.tsx` (`restartOnEdit` gains `ask-user-questions`);
  - tests: `ai-decisions.test.tsx`, `ai-decisions-pages.test.tsx`, `demo-states.test.tsx` and `navigation-groups.test.tsx`;
  - `tests/browser/ai-decisions.mjs`, where it names the old pages.

**Interfaces:**

- **Consumes:** Task 1's StatusPill, AIMark, Tray, DecisionBar, `useShortcuts` and `formatCount`.
- **Produces:**
  - **ApprovalCard.** `ApprovalCardProps` gains §12.5's additions plus `receiptTime?: ReactNode`.
    - `ApprovalCardLabels` holds every built-in string: `target`, `oneTime`, `recording`, `failed`, `retryHint`, `approved`, `rejected`, `expired`, `irreversible`, `needsYou` and `scope`.
    - `approvalCardCopy` holds the defaults.
  - **ApprovalFlow.** `ApprovalFlowProps` gains `labels?: Partial<ApprovalFlowLabels>` (`position(current, total)`, `history`, `allDecided`, `none`), `headingLevel?` and `appearance?`. `approvalFlowCopy` holds the defaults.
  - **AskUserQuestions.** `AskUserQuestionsProps` gains:
    - `appearance?` and `headingLevel?`;
    - `labels?: Partial<AskUserQuestionsLabels>` (navigation, status, error and hint text);
    - `agent?: ReactNode`, `onSkip?: () => void`, `receipt?: boolean` and `onEditAnswers?: () => void`.

    `askUserQuestionsCopy` holds the defaults.
  - **`finance-story.ts`.**
    - `export const story` holds every §14 fact. Text is `{ ar, en }`, and amounts are numbers.
    - Its keys: `team`, `user`, `period`, `cash`, `revenue`, `dso`, `overdue`, `customers` (the three, with their invoices), `earlyPayment`, `forecast`, `closeSteps` (five), `agents` (finance, collections, campaigns), `sources` (five records shaped like `SourceReference`, numbered 1–5) and `draft`.
    - `export function money(value: number, language: "ar" | "en", numerals?: Numerals, options?: { compact?: boolean }): string` gives «٩٬٤٠٠ ر.س» / "SAR 9,400", and compact «٦١٢ ألف ر.س» / "SAR 612K".

**Behavior** (§12.4 and §12.5 hold the rest; every current behavior stays):

- **Anatomy.**
  - Card appearance puts the header and the DecisionBar on the tray, and the content on paper. The header holds AIMark, the title, and StatusPill needs-you «بانتظارك» while the decision is open (pending, submitting or failed).
  - ApprovalCard's title is `request.action`. AskUserQuestions keeps the question as its heading and shows `agent` in the header.
  - Plain drops the tray and the outer surface. ApprovalFlow's card appearance puts the whole flow in one tray, with its card plain inside.
- **Headings.** `headingLevel` (default 3) sets ApprovalCard's title and the question heading, which moving between questions still focuses. ApprovalFlow passes its level to its card.
- **ApprovalCard.**
  - The impact list is a `table` with end-aligned figures.
  - `irreversible={true}` shows «لا يمكن التراجع عن هذا الإجراء.» / "This can't be undone." in `--attention`.
  - Reject carries Escape. Approve carries Mod+Enter only when `reversible && !irreversible` (§8 forbids a shortcut on an irreversible approval). Task 3 inherits this rule through `step.approval`.
  - The DecisionBar's `contentKey` is `JSON.stringify([reversible, !!irreversible, expired])`; request edits already remount the card. Each new card's 500 ms chord guard keeps a held key from approving it.
  - Receipts: «تمت الموافقة» (plus « · {receiptTime}»), «رُفض الطلب» and «انتهت مهلة الطلب»; English "Approved", "Request rejected" and "Request expired".
  - `expired` replaces the actions with its receipt, announces it, and aborts a decision in flight, so a late resolve records nothing.
  - "One-time decision" moves from the header badge to the meta zone.
- **AskUserQuestions.**
  - The 38rem cap and the entrance apply in card appearance only.
  - `onSkip` adds a ghost «تخطّي الأسئلة» / "Skip questions".
  - With `receipt`, accepted answers fold into «إجاباتك» / "Your answers", with «تعديل الإجابات» / "Edit answers" when `onEditAnswers` is given.
- **Examples.** Each takes `appearance` and tells §14's story through `story` and `money`:
  - §12.4's two questions;
  - the three payment reminders: impact rows for the three customers, `irreversible` with §12.5's note, «ينتهي الطلب خلال ٢٣ ساعة», and «عرض الرسائل» as the middle action;
  - a sequence of the reminders, then the four accrual entries (٦٬٨٥٠ ر.س).
- **Pages.**
  - Names: «أسئلة قبل البدء» / "Clarifying questions", «طلب موافقة» / "Approval request" and «سلسلة موافقات» / "Approval sequence", with §12's job sentences as descriptions.
  - States (Docs §8): Asking★ · Answered · Failed; Waiting★ · Approved · Rejected · Expired; First★ · Second · Done.
  - Each page gets the `appearance` field.

- [ ] **Step 1: Write the failing tests** in `src/system/ai-decisions.test.tsx`:
  - **`approves a reversible request with Ctrl or Cmd+Enter, and never an irreversible one`:**
    - on a reversible card after 500 ms, Ctrl+Enter calls `onDecision(request, "approved", …)`;
    - on an irreversible card, approve shows no kbd and Ctrl+Enter calls nothing;
    - with both `reversible` and `irreversible` set, there is no kbd hint and Ctrl+Enter records nothing;
    - Escape still rejects.
  - **`lets a Sheet or Modal take Escape and records nothing`** (Decision 27): a pending card inside an open Modal; Escape on its reject button closes the Modal (`onOpenChange(false)`), and `onDecision` is not called.
  - **`never approves the next request with a held or repeated chord`** (fake timers). ApprovalFlow has two reversible requests:
    - Ctrl+Enter approves the first;
    - once it is accepted, focus is on the second card;
    - a `repeat: true` Ctrl+Enter does nothing, and neither does a fresh one 100 ms later;
    - one at 600 ms approves the second.
  - **`expires on the host's word, aborting a decision in flight`:**
    - click approve while the host's promise is pending, then rerender with `expired`;
    - the signal is aborted, the actions are gone, and the status reads «انتهت مهلة الطلب»;
    - resolving the promise afterwards records nothing: no «تمت الموافقة».
  - **`shows impact, the irreversibility note, expiry and the middle action in reading order`:**
    - the table rows hold the three customers and their amounts;
    - the note and «ينتهي الطلب خلال ٢٣ ساعة» show;
    - the buttons are in DOM order Reject, «عرض الرسائل», Approve.
  - **`takes labels, heading levels and the plain appearance`:**
    - `labels.target` replaces «الهدف»;
    - `headingLevel={2}` renders an h2;
    - plain renders no `.tz-tray`;
    - ApprovalFlow's `labels.position` replaces «الطلب ١ من ٢».
  - **`folds accepted answers into a receipt and offers to edit them`:**
    - with `receipt` and `onEditAnswers`, «إجاباتك» lists «فواتير الموردين» after acceptance;
    - «تعديل الإجابات» calls `onEditAnswers`;
    - without `receipt`, today's accepted status stays.
  - **`skips the questions through onSkip`.**
  - In `demo-states.test.tsx`, add the three pages' rows to `phaseFamilies`:
    - Answered shows «إجاباتك»;
    - Failed shows the failure alert, with the draft kept;
    - Expired shows «انتهت مهلة الطلب».
- [ ] **Step 2: Run them.** `npx vitest run src/system/ai-decisions.test.tsx src/workbench/demo-states.test.tsx`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement**, following [Adding a pattern page](#adding-a-pattern-page) for the three existing pages. Update the old page names and receipt words («تم الرفض» becomes «رُفض الطلب») in the existing tests and `tests/browser/ai-decisions.mjs`, and name each in the commit.
- [ ] **Step 4: Gate.**
- [ ] **Step 5: Commit**: `feat(ai): build the decision patterns on the Woven anatomy`.

### Task 3: Agent task

**Model:** Opus. The inline approval, the steering keys, focus inside disclosures, and one live region.

**Spec:**

- §12.3, §8, §9, §10 and §18;
- §16a's TaskRows, ToolCall, ToolChips and useToolLabels rows;
- Woven §13;
- Docs §8's Agent task, TaskRows Needs you★ and ToolCall Needs you.

**Carried in:**

- Plan 1 review: §13's state words in TaskRows.
- Plan 2 review: TaskRows Needs you, and TaskRows' Empty switch still showing Running or Done pressed.

**Files:**

- Create: `src/system/AgentTask.tsx`, `src/system/useDisclosure.ts`, `src/system/ai/examples/AgentTaskExamples.tsx` and `src/system/agent-task.test.tsx`.
- Modify:
  - in `src/system/`: `TaskRows.tsx`, `ToolCall.tsx`, `ToolChips.tsx`, `useToolLabels.ts`, `index.ts`, `components.css`, `css-audit.families.ts` (`"agent-task": [".tz-agent-run"]`), `ai/registry.json`, `ai/examples/TaskRowsExamples.tsx` and `ai/examples/ToolActivityExamples.tsx`;
  - the page files from the checklist;
  - tests: `taskrows-agent.test.tsx` and `tool-activity.test.tsx` (the old state words), and `demo-states.test.tsx`.

**Interfaces:**

- **Consumes:** Task 1's parts and helpers; Task 2's `ApprovalCard` additions and `story`.
- **Produces:**
  - `AgentStep` and `AgentTaskProps` as §12.3's sketch, plus Decision 4's `approval?` on `AgentStep`; `AgentTaskLabels`; `agentTaskCopy`.
  - Internal: `useDisclosure(open: boolean): { triggerRef: RefObject<HTMLButtonElement | null>; panelProps: { ref; hidden; inert; "aria-hidden"; onFocusCapture; onBlurCapture } }`.
    - It holds TaskRows' rule: a closed panel is hidden and inert at once.
    - On collapse, focus returns to the trigger only if it was inside the panel and has not moved elsewhere.
    - Task 4 reuses it.
  - `TaskState` and `ToolCallState` gain `"needs-you"`.
  - **TaskRows:** `appearance` gains `"plain"`; `stateLabels` becomes `Partial<Record<TaskState, string>>`; it gains `labels?: { empty?: string }`.
  - `ToolLabels` (exported type): the five `ToolCallState` words plus `input`, `output`, `error` and `retry`.
  - **ToolCall:** gains `appearance?: "card" | "plain"`, `labels?: Partial<ToolLabels>` and `headingLevel?` (default 4).
  - **ToolChips:** gains `labels?: Partial<ToolLabels>`.
  - `useToolLabels(overrides?: Partial<ToolLabels>): ToolLabels`.

**Behavior** (§12.3 holds the anatomy, the footer table, the keyboard and the copy):

- **Shared step words** (Decision 8): pending «لم تبدأ» / "Not started", running «قيد التنفيذ» / "Running", needs-you «بانتظارك» / "Needs you", completed «مكتملة» / "Done", failed «تعثّرت» / "Failed", skipped «تُخطّيت» / "Skipped". TaskRows' needs-you badge uses the `warning` tone.
- **AgentTask.**
  - The root is `section.tz-agent-run`, and the header's agent line reads «{agent} · {formatCount(steps.length, "step")}».
  - The pill: plan is idle with «خطة مقترحة»; running is «يعمل» with `elapsed`; needs-you is «بانتظارك»; failed is «تعثّرت»; stopped is «أُوقفت»; completed is «اكتملت» with `elapsed`.
  - Step icons are StatusIcon. Planned and pending both use `pending` with their number; CSS makes planned's ring solid.
  - A finished step's details use `useDisclosure` and list each ToolCall with `appearance="plain"` and `announcement="off"`.
  - A needs-you step renders `ApprovalCard` with `request={step.request}`, `{...step.approval}`, `appearance="plain"` and a `headingLevel` one deeper, wired to `onDecision`. Without `onDecision`, it shows the request's action and target as text, with no actions (Decision 4).
  - A failed step's actions read «أعد المحاولة», «تخطَّ الخطوة» and «أعد الربط».
  - Stopped's footer reads «أُوقفت عند الخطوة {n}» with the elapsed time. Done counts every step's `tools` as its operations.
  - **Plan state.**
    - The Countdown runs with `announcement="off"`. It pauses while the pointer is over the section or focus is inside it, and its completion calls `onStart`, as Mod+Enter on «ابدأ الآن» does.
    - The DecisionBar's `contentKey` is `JSON.stringify(steps.map((step) => [step.id, step.title]))`, so a re-planned task ignores Ctrl+Enter for 500 ms.
  - Steering clears its field after `onSteer`. Empty text and composition do nothing.
  - **Live region.**
    - plan: «خطة مقترحة», plus the countdown's sentence while it runs. It is set in an effect after mount, as Countdown's is.
    - running «يعمل», needs-you «{title}: يحتاج قرارك», failed «تعثّرت: {error title}», stopped «أُوقفت», completed «اكتملت المهمة».
    - It never holds a time.
- **Example.** «إقفال حسابات أكتوبر» by «وكيل المالية», with the five `story.closeSteps`. Phases: plan, running, needs-you, failed, completed and stopped.
  - The needs-you step embeds Task 2's reminders request. Approving finishes, with step 4 reading «أُرسلت ٣ رسائل»; rejecting skips step 4 and finishes.
  - The failed phase fails step 2, with Reconnect and Skip.
- **Pages.**
  - **agent-task:** Plan · Running · Needs you★ · Failed · Done · Stopped (Decision 18). Replay: Plan → Running → Needs you → Done. Fields: `appearance`, and `autoStart` (a boolean that sets `autoStartAfter={5}` in the plan phase).
  - **task-rows:** Running · Needs you★ · Done, with Replay Running → Needs you → Done. Its Empty switch presses no state.
  - **tool-call:** Pending · Running · Needs you · Done★ · Failed.

- [ ] **Step 1: Write the failing tests** in `src/system/agent-task.test.tsx`:
  - **`shows every step state with its glyph and hidden words`:** planned and pending show «١», «٢» and so on; the hidden words come in order; skipped shows «تُخطّيت بطلبك».
  - **`embeds the needs-you request as a plain approval`:**
    - there is no `.tz-tray` inside the step;
    - Escape inside it calls `onDecision(…, "rejected")`;
    - approve shows ⌘↵ only with `approval.reversible` and without `approval.irreversible`;
    - without `onDecision`, the step shows the request's action and target with no buttons.
  - **`steers at the next step with Enter and now with Ctrl or Cmd+Enter, never while composing`:**
    - `onSteer("استثنِ فرع جدة", "next")`, then `"now"`;
    - a keydown with keyCode 229, or after `compositionstart`, does nothing, and so does empty text;
    - the field clears after each call.
  - **`starts the plan from its countdown, pausing while focus or pointer is inside`** (fake timers), with `autoStartAfter={5}`:
    - focus a button inside at 2 s and advance 10 s: `onStart` is not called;
    - move focus outside and advance 3 s: it is called once;
    - in a fresh render, Ctrl+Enter at 600 ms starts the plan;
    - change a step's title, then press Ctrl+Enter 100 ms later: nothing happens.
  - **`announces each status once and never the time`:**
    - the region reads the sentences above;
    - rerendering running with `elapsed` going from 1 to 72 leaves the region unchanged;
    - the failed step's error stays as visible text next to the step;
    - every ToolCall in the details has `announcement="off"`: no other `role="status"` inside the section.
  - **`returns focus to Details after collapse and keeps closed details inert`.**
  - **`moves focus to the section when its focused control goes away`:** skip a failed step through «تخطَّ الخطوة»; once the host marks it skipped, focus is on the section root.
  - **`counts steps and operations with Arabic agreement`:** the header reads «وكيل المالية · ٥ خطوات», and the done footer reads «٣د ٤٠ث · ١٢ عملية».
  - In `taskrows-agent.test.tsx` and `tool-activity.test.tsx`, add **`shows needs-you with the attention tone and the shared words`**. It also covers the plain appearance, the `labels` overrides and ToolCall's `headingLevel={5}`.
  - In `demo-states.test.tsx`, add `phaseFamilies` rows for agent-task, task-rows and tool-call.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement**, following the checklist. Update the assertions on the old state words («جارٍ التنفيذ», «قيد الانتظار», «فشلت»), and name each in the commit.
- [ ] **Step 4: Gate.**
- [ ] **Step 5: Commit**: `feat(ai): add the Agent task pattern`.

### Task 4: Cited answer and What changed

**Model:** Sonnet.

**Spec:**

- §12.2 and §12.8;
- §11's ThinkingPanel, SourceChip, FeedbackBar and FollowUps;
- §16a's StreamingText, Markdown, Sources / InlineCitation and ThinkingState rows, and behaviors 5, 8 and 9;
- §8's heading rule, for InsightCards;
- Docs §8's Cited answer, What changed, and StreamingText's Stopped and Failed.

**Carried in** (Plan 2 review):

- ThinkingState's Replay skips its third label, «جارٍ إعداد الملخص». Its Working step must show all three labels.
- StreamingText gains Stopped and Failed.

**Files:**

- Create in `src/system/`: `ThinkingPanel.tsx`, `SourceChip.tsx`, `FeedbackBar.tsx`, `FollowUps.tsx`, `CitedAnswer.tsx`, `ChangeSummary.tsx`, `ai/examples/CitedAnswerExamples.tsx`, `ai/examples/ChangeSummaryExamples.tsx`, `cited-answer.test.tsx` and `change-summary.test.tsx`.
- Modify:
  - in `src/system/`: `StreamingText.tsx`, `Markdown.tsx`, `Sources.tsx`, `InsightCards.tsx`, `index.ts`, `components.css`, `css-audit.families.ts`, `ai/registry.json`, `ai/examples/AIContentExamples.tsx` and `ai/examples/AIFeedbackExamples.tsx`;
  - the page files from the checklist, and `demo-states.test.tsx`.
- New CSS families:
  - `"thinking-panel": [".tz-thinking-panel"]`;
  - `"source-chip": [".tz-source-chip"]`;
  - `"feedback-bar": [".tz-feedback-bar"]`;
  - `"follow-ups": [".tz-follow-ups"]`;
  - `"cited-answer": [".tz-cited-answer"]`;
  - `"change-summary": [".tz-change-summary"]`.

**Interfaces:**

- **Consumes:** Task 1's parts and formatters; Task 3's `useDisclosure`; Task 2's `story`.
- **Produces:**
  - `ThinkingPanelProps = { status: "running" | "completed"; elapsed?: number; sources?: readonly SourceReference[]; steps?: readonly { id: string; label: string; state: "pending" | "running" | "completed" }[]; open?: boolean; onOpenChange?: (open: boolean) => void; labels?: Partial<ThinkingPanelLabels>; announcement?: "polite" | "off" }`.
  - `FeedbackReason = "inaccurate" | "wrong-source" | "too-long" | "outdated"`.
  - `FeedbackBarProps = { feedback?: "up" | "down" | null; onFeedbackChange?: (value: "up" | "down" | null, reason?: FeedbackReason) => void; onCopy?: () => void | Promise<void>; onRegenerate?: () => void; labels?: Partial<FeedbackBarLabels> }`.
  - `FollowUpsProps = { items: readonly { id: string; label: string }[]; onSelect: (id: string) => void; label?: string }`.
  - `CitedAnswerProps` as §12.2's sketch, with `reason?: FeedbackReason`. `ChangeSummaryProps` as §12.8's sketch, with `sources?: readonly SourceReference[]`. `citedAnswerCopy` and `changeSummaryCopy` hold the defaults.
  - StreamingText's `state` gains `"stopped"` and `"failed"`.
  - StreamingText and Markdown gain `renderCitation?: (marker: number) => ReactNode`, and Markdown gains `links?: "default" | "strict"`.
  - Sources gains `expanded?`, `onExpandedChange?` and `highlightedId?: string`, and InlineCitation's `mode` gains `"preview"`.
  - InsightCards gains `headingLevel?` (default 3). §8 names its hard-coded `h3`.
  - ThinkingPanel, FeedbackBar and FollowUps are exported from `index.ts`, with their props types. Each gets a registry `support` entry: `thinking-panel`, `feedback-bar` and `follow-ups`.
  - Internal: `SourceChip({ source, onOpen? })`.

**Behavior** (§12.2, §12.8 and §11 hold the anatomy, the states and the copy):

- **Markdown.** In text, `[n]` with a whole number `n` becomes `renderCitation(n)`; code is left alone. `links="strict"` sends link targets through `sourceHref` and renders rejected ones as text. The defaults are unchanged.
- **InlineCitation `mode="preview"`** (Decision 11).
  - The chip is a `sourceHref` link. Hover and focus open the existing popover without its inner link; Escape and blur close it; Enter or click follows the link.
  - When the link is rejected, the chip is a button that shows the preview on focus or click, so Tab still reaches it (§18).
  - Moving the pointer from the chip onto the preview keeps it open (WCAG 1.4.13).
- **Sources.** `expanded` becomes controllable, and `highlightedId` sets `data-highlighted` on that row.
- **ThinkingPanel.**
  - The label is «يفكّر» while running and «فكّر لمدة {formatElapsed(elapsed)}» once completed. The elapsed time shows in the header while running.
  - The body holds «بحث في» with up to three SourceChips, then «+{n}»; the steps with their state words; and a Thread.
  - One stable announced label (ThinkingIndicator's rule). The disclosure goes through `useDisclosure`.
- **FeedbackBar.** «نُسخت» shows for 2 s after `onCopy` resolves, with stale results ignored as in `useExactCopy`. Helpful and not helpful are `aria-pressed` toggles. Not helpful offers the four reasons as buttons that call `onFeedbackChange("down", reason)`.
- **CitedAnswer.**
  - ThinkingPanel and StreamingText both run with `announcement="off"`.
  - The answer is StreamingText in markdown mode while writing, and Markdown once done. Both use `links="strict"` and `InlineCitation mode="preview"`.
  - The meta reads «{formatCount(sources.length, "source")} · {formatElapsed(duration, { fractionDigits: 1 })}», and its count is the Sources trigger.
  - The panel folds when writing starts, unless the host controls it. A citation's preview highlights its Sources row.
- **ChangeSummary.**
  - «أعدّه المساعد» shows in `--ai` when ready or stale. The pill reads «يحدّث» (running) while updating and «تعثّر» when failed.
  - The first six rows show.
  - Each badge holds a direction arrow, the color of `tone` (good is success, bad is danger, neutral is muted), and a hidden word: «ارتفع», «انخفض» or «ثابت».
  - Sparklines are `aria-hidden` and run left to right in both directions.
- **Examples.**
  - **Cited answer** asks «لماذا انخفض التدفق النقدي في أكتوبر؟» with `story.sources`, and answers from §14's facts with `[n]` markers. Phases: thinking (sources arrive one by one), writing (the content grows), completed, failed (a partial answer and the error) and stopped.
  - **What changed** covers 12–18 October. Rows: net cash flow down 18% (bad); DSO from 34 to 47 days (up, bad); 12 overdue invoices, ٤٨٬٣٠٠ ر.س (up, bad); revenue ١٫٢٤ مليون ر.س, up 6.1% (good).
    - The reason names the three customers' ٣٤٬٨٠٠ ر.س (72%) and the early supplier payment.
    - Actions: «أرسل تذكيرات السداد» (primary) and «افتح تقرير أعمار الديون».
    - Footer: «اعتمادًا على ٣ تقارير» and «حُدّث قبل ٥ د».
- **Pages.**
  - **cited-answer:** Thinking · Writing · Done★ · Failed · Stopped. Replay: Thinking → Writing → Done. Fields: `appearance`, and `question` (a boolean).
  - **change-summary:** Updating · Ready★ · Stale. Replay: Updating → Ready.
  - **streaming-text** adds Stopped and Failed.

- [ ] **Step 1: Write the failing tests.**
  - In `src/system/cited-answer.test.tsx`:
    - **`announces each status in one sentence and never the answer text`:**
      - the region reads «يفكّر», «يكتب الإجابة», «اكتملت الإجابة», «تعذّر إكمال الإجابة» or «أُوقفت الإجابة»;
      - a growing `content` leaves the region unchanged;
      - failed keeps the partial text, and «أعد المحاولة» calls `onRetry`;
      - stopped shows «إعادة التوليد», which calls `onRegenerate`;
      - the only `role="status"` in the section is the pattern's own: StreamingText and ThinkingPanel are silent.
    - **`turns [n] into citation chips that preview on hover or focus and open the source`:**
      - the chip text is «١», and focus shows the source title;
      - Escape hides it, and the pointer moving onto the preview keeps it open;
      - the chip's href is the source's;
      - a `javascript:` source renders as a button that Tab reaches and that shows the preview on focus;
      - `[1]` inside inline code stays text.
    - **`sets InsightCards' heading level`:** `headingLevel={4}` renders the finding's title as an h4.
    - **`keeps answer links to safe destinations`:** a `mailto:` link in the content renders as text.
    - **`folds thinking to «فكّر لمدة ٦ث» while writing and honors the controlled pair`.**
    - **`toggles helpful and not helpful with reasons, and shows «نُسخت» after copy`.**
    - **`lists follow-ups as buttons`.**
    - **`agrees the meta counts`:** «٣ مصادر · ٦٫٢ث».
    - **`announces StreamingText's stopped and failed states`:** «أُوقف الرد» / "Response stopped", and «تعذّر إكمال الرد» / "Couldn't finish the response".
  - In `src/system/change-summary.test.tsx`:
    - **`gives each row a direction word and a tone, without signs`:** a row with `direction: "up", tone: "bad"` has `data-tone="bad"` and the hidden «ارتفع», and no "−" or "+" in its badge.
    - **`draws sparklines left to right in RTL`:** the path's first point is at x=0 for `series[0]`.
    - **`shows updating, stale with Refresh, and failed, announcing each once`.**
    - **`shows at most six rows`.**
  - In `demo-states.test.tsx`:
    - add `phaseFamilies` rows for cited-answer, change-summary, and StreamingText's new states;
    - ThinkingState's Replay shows «جارٍ إعداد الملخص» during Working.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement**, following the checklist.
- [ ] **Step 4: Gate.**
- [ ] **Step 5: Commit**: `feat(ai): add the Cited answer and What changed patterns`.

### Task 5: Start a task

**Model:** Sonnet. The mention picker is a standard combobox on PromptEntry's existing input-method guards, and focus never moves.

**Spec:**

- §12.1;
- §16a's PromptEntry / ChatComposer / PromptBar, ModelSelector and ContextMeter rows, and behavior 7;
- Docs §8's Start a task, and ChatComposer Failed.

**Carried in** (Plan 2 review):

- ChatComposer gains Failed.
- Stop during a held Submitting leaves an empty reply bubble.

**Files:**

- Create: `src/system/TaskStarter.tsx`, `src/system/ai/examples/TaskStarterExamples.tsx` and `src/system/task-starter.test.tsx`.
- Modify:
  - in `src/system/`: `PromptEntry.tsx`, `ChatComposer.tsx`, `PromptBar.tsx`, `ModelSelector.tsx`, `ContextMeter.tsx`, `index.ts`, `components.css`, `css-audit.families.ts` (`"task-starter": [".tz-task-starter"]`), `ai/registry.json` and `ai/examples/ChatExamples.tsx`;
  - the page files from the checklist;
  - tests: `chat-foundation.test.tsx`, `ai-context-controls.test.tsx` and `demo-states.test.tsx`.

**Interfaces:**

- **Consumes:** Task 1's StatusPill, Tray, AIMark and `formatCount`; Task 2's `story`.
- **Produces:**
  - **ChatComposer.** `ChatComposerProps` gains `tools?: { start?: ReactNode; end?: ReactNode }`, `compact?: boolean` and `appearance?: "card" | "plain"`.
    - With `tools`, the surface has two rows: the text area, then `start`, a flexible space, `end`, and send last.
    - Plain drops the floating shadow.
  - **PromptBar.** Its `suggestions` accept `string | { id: string; label: string; prompt?: string; icon?: ReactNode }`, and `onSuggestionSelect` receives `prompt ?? label`.
  - **ModelSelector:** `labels?: { unavailable?: string }`.
  - **ContextMeter:** gains `thresholds?: { high?: number; near?: number }` (defaults 0.8 and 0.95; over capacity stays above 1), `open?` and `onOpenChange?`.
  - **TaskStarter.** `TaskStarterProps` as §12.1's sketch, plus `modeMenuOpen?: boolean` and `onModeMenuOpenChange?: (open: boolean) => void` (Decision 20).
    - `ContextItem = { id: string; label: string; kind?: string; icon?: ReactNode }`.
    - `ModeOption = { id: string; label: string; description?: string }`.
    - `TaskStarterLabels` and `taskStarterCopy`.

**Behavior** (§12.1 holds the anatomy, the states, the keyboard and the copy; TaskStarter is built on PromptEntry and inherits its behaviors unchanged):

- **Greeting.** Its question uses `--text-title` (Decision 17).
- **Mode menu.**
  - Radix DropdownMenu with `modal={false}`, opening downward from the trigger.
  - Context usage reads «السياق المستخدم {percent} · {attached}». `attached` agrees with its count: «لا سجلات مرفقة», «سجل واحد مرفق», «سجلّان مرفقان», «{n} سجلات مرفقة», «{n} سجلًا مرفقًا» or «{n} سجل مرفق». English: "No records attached", "1 record attached", "{n} records attached".
  - `models`, when given, add a second radio section.
- **Mentions.**
  - The listbox is anchored to the tools row.
  - The text area keeps focus, with `aria-controls`, `aria-expanded`, `aria-autocomplete="list"` and `aria-activedescendant`.
  - Enter chooses: it calls `onAddContext(id)` and removes «@query» through `onValueChange`. Escape closes. Composition never chooses.
  - Without `mentionOptions`, each change to the @ token calls `onMention(query)`, and the @ button calls `onMention("")`.
- **Examples.**
  - **Start a task** shows §12.1's demo, with mention options from `story`'s customers and invoices. Phases: empty, writing, and choosing-mode (the menu open).
  - **ChatComposer** gains a "failed" phase: it submits its seeded draft to a host that rejects it, so the failure message shows. Stop during Submitting removes the empty reply.
- **Pages.**
  - **task-starter:** Empty · Writing★ · Choosing mode. Fields: `appearance` and `disabled`.
  - **chat-composer** adds Failed.

- [ ] **Step 1: Write the failing tests** in `src/system/task-starter.test.tsx` and the part tests:
  - **`hands the draft and its context to onSubmit and keeps it when the host rejects`.**
  - **`opens the record picker on @ and chooses with the keyboard while the text area keeps focus`:**
    - typing «@مد» shows a listbox holding «شركة مدار»;
    - ArrowDown changes `aria-activedescendant`;
    - Enter calls `onAddContext("madar")`, and `onValueChange` without «@مد»;
    - focus stays on the text area;
    - Escape closes it (`aria-expanded="false"`).
  - **`never chooses or submits while composing`:** after `compositionstart`, Enter with keyCode 229 calls neither `onAddContext` nor `onSubmit`.
  - **`asks the host to pick when it supplies no options`:** `onMention("مد")`.
  - **`keeps suggestions while typing and disables them while submitting`.**
  - **`offers modes as radio items with usage and returns focus to the trigger on Escape`:**
    - three radio items with descriptions;
    - «السياق المستخدم ٣٢٪ · سجلّان مرفقان»;
    - `onModeChange("deep")`;
    - Escape focuses the trigger.
  - **`keeps context chips on Backspace in an empty text area`.**
  - Part tests:
    - **`places tools around the entry and drops the shadow when plain`** (ChatComposer);
    - **`names unavailable models through labels`** (ModelSelector);
    - **`moves the context status at the host's thresholds and honors controlled open`** (ContextMeter).
  - In `demo-states.test.tsx`, add `phaseFamilies` rows for task-starter and for chat-composer's Failed.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement**, following the checklist.
- [ ] **Step 4: Gate.**
- [ ] **Step 5: Commit**: `feat(ai): add the Start a task pattern`.

### Task 6: Suggested edits

**Model:** Opus. The Selection API, text offsets, the highlight, and a non-modal popover.

**Spec:** §12.6; §11's InlineDiff; §16a's SelectionActions row, and behavior 11 (SelectionActions' keys and selection restore); Docs §8's Suggested edits.

**Files:**

- Create: `src/system/InlineDiff.tsx`, `src/system/SuggestedEdits.tsx`, `src/system/ai/examples/SuggestedEditsExamples.tsx` and `src/system/suggested-edits.test.tsx`.
- Modify:
  - in `src/system/`: `SelectionActions.tsx`, `index.ts`, `components.css`, `css-audit.families.ts` (`"suggested-edits": [".tz-suggested-edits"]`, `"inline-diff": [".tz-inline-diff"]`) and `ai/registry.json`;
  - the page files from the checklist;
  - tests: `ai-context-controls.test.tsx` and `demo-states.test.tsx`;
  - `tests/browser/woven-evidence.mjs`, which gains two options (below).

**Interfaces:**

- **Consumes:** Task 1's Thread, Kbd, DecisionBar, `formatCount` and `nounGender`; Task 2's `story`.
- **Produces:**
  - `SelectionAction.onSelect: (text: string, range: { start: number; end: number }) => void`. The second argument is additive: offsets into the scope's text content.
  - `DiffSegment = { id: string; kind: "same" | "insert" | "delete"; text: string }`.
  - `InlineDiffProps = { segments: readonly DiffSegment[]; decisions: Readonly<Record<string, "accepted" | "rejected">>; onDecisionsChange: (next: Record<string, "accepted" | "rejected">) => void; labels?: Partial<InlineDiffLabels> }`. A change is a run of consecutive non-same segments, keyed by its first segment's id.
  - `diffText(segments, decisions): string`, exported from `InlineDiff.tsx` but not from `index.ts`. Accepted changes keep their inserts and drop their deletes; the others keep the original text.
  - InlineDiff is exported from `index.ts` with `InlineDiffProps` and `DiffSegment`, and gets a registry `support` entry, `inline-diff`.
  - `SuggestedEditsProps` as §12.6's sketch; `SuggestedEditsLabels`; `suggestedEditsCopy`.
  - `woven-evidence.mjs` gains two options:
    - `TIRAZ_PAGES=a,b`: capture only those page ids; an unknown id throws;
    - `TIRAZ_STATES=1`: after a page's resting capture, press each `.tz-demo-states button` in turn, wait 1,200 ms, and capture `<id>--state-<n>.jpg`, where n counts from 1.

**Behavior** (§12.6 holds the flow, the anatomy and the copy):

- **InlineDiff.** Each change is a focusable `role="group"` named by its content, with its own «قبول» (Y) and «رفض» (N).
  - Y and N match `event.code` (Decision 16), and work only while focus is in a change.
  - They never act on repeat, with Ctrl, Meta or Alt, or in a text field.
- **SuggestedEdits.**
  - The range is rebuilt from the offsets inside the scope.
  - Where `CSS.highlights` exists, rewriting marks the range on a shared `Highlight` named `tz-suggestion`, styled by `::highlight(tz-suggestion)`. Elsewhere it is not marked.
  - Each instance adds and removes only its own Range, on dismiss, apply and unmount. The name is deleted once the highlight is empty, so Task 8's stills and the demo never erase each other's mark.
  - The rewriting note and the review card are non-modal popovers in the provider's container, anchored below the range.
  - When the card opens, focus moves to its heading if it was in the toolbar or on the body. Escape calls `onDismiss` and returns focus to the scope.
  - Apply calls `onApply(diffText(…), { start, end })`. The host's DOM stays untouched until then.
  - «يُطبَّق كنص عادي» shows when the range contains elements.
  - The receipt's verb agrees with «تعديل» (masculine): «طُبّق تعديلان من ٣», «طُبّق تعديل واحد من ٣», «طُبّق ٣ تعديلات من ٥». Zero reads «لم يُطبَّق أي تعديل».
- **Example.** A close-summary paragraph written from `story`'s facts, with §12.6's four actions; the host returns a fixed suggestion with three changes.
  - Phases: selecting (the example selects the paragraph's first sentence with the Selection API, as SelectionActions' Selected state does), rewriting, reviewing and applied.
- **Page:** Selecting · Rewriting · Reviewing★ · Applied, with Replay. The example holds decisions, so it goes in `restartOnEdit`.
- **First-build screenshot (Decision 15).** The task's Opus reviewer judges it before Task 7 starts. Capture it from the worktree root:

  ```bash
  TIRAZ_PLAYWRIGHT=/Users/amjedfadul/.npm/_npx/e41f203b7505f1fb/node_modules/playwright TIRAZ_EVIDENCE=docs/woven/after-patterns/suggested-edits TIRAZ_STATES=1 TIRAZ_VARIANTS=ar-light,en-light TIRAZ_PAGES=suggested-edits node tests/browser/woven-evidence.mjs
  ```

- [ ] **Step 1: Write the failing tests** in `src/system/suggested-edits.test.tsx` and `ai-context-controls.test.tsx`:
  - **`passes start and end offsets within the scope`:** in a scope holding `<p>أول <strong>ثاني</strong> ثالث</p>`, selecting «ثاني ثا» calls `onSelect("ثاني ثا", { start: 4, end: 11 })`.
  - **`accepts with Y and rejects with N on any layout, never on repeat`:**
    - on a focused change, a keydown with code `KeyY` and key «غ» accepts it, and code `KeyN` rejects it;
    - a repeat is ignored, and so are Ctrl+Y and a keydown in a text field.
  - **`applies only accepted changes and hands the host the offsets`:** with `{ c1: "accepted", c2: "rejected" }`, Apply calls `onApply` with the expected text and `{ start, end }`.
  - **`counts changes and accepts or rejects them all`:** «١ من ٣»; next gives «٢ من ٣»; «قبول الكل» accepts all three.
  - **`closes into an agreeing receipt with Undo only when offered`:** «طُبّق تعديلان من ٣», and no Undo without `onUndo`.
  - **`leaves the host text untouched and returns focus on Escape`.**
  - **`marks the selection only where the highlight API exists, one range per instance`:**
    - with a stubbed `CSS.highlights` Map and `Highlight` class, two instances rewriting at once each add their own Range to `tz-suggestion`;
    - dismissing one removes only its own Range;
    - dismissing the second deletes the name;
    - without the API, nothing throws.
  - **`says plain text when the selection spans formatting`.**
  - In `demo-states.test.tsx`, add a `phaseFamilies` row for suggested-edits.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement**, following the checklist. Then take the screenshots, and restore the workbench preferences.
- [ ] **Step 4: Gate.**
- [ ] **Step 5: Commit**, with the screenshots: `feat(ai): add the Suggested edits pattern`.

### Task 7: Image generation

**Model:** Sonnet. With no canvas (Decision 24), what remains is a `clip-path`, one `requestAnimationFrame` loop and native radios.

**Spec:** §12.7; §11's WeaveCanvas; §16a's ImageResult row; Woven §15 (the weave takes at most 1,200 ms, and reduced motion uses a 200 ms crossfade); Docs §8's Image generation.

**Files:**

- Create: `src/system/WeaveCanvas.tsx`, `src/system/weave.ts`, `src/system/ImageGeneration.tsx`, `src/system/ai/examples/ImageGenerationExamples.tsx` and `src/system/image-generation.test.tsx`.
- Modify:
  - in `src/system/`: `index.ts`, `components.css`, `css-audit.families.ts` (`"weave-canvas": [".tz-weave"]`, `"image-generation": [".tz-image-generation"]`) and `ai/registry.json`;
  - `tokens.css` and `tokens.test.ts`, only if a CSS-run duration has no token;
  - the page files from the checklist, and `demo-states.test.tsx`.

**Interfaces:**

- **Consumes:** Task 1's AIMark, StatusPill, Tray, formatters and `useReducedMotion`; ImageResult.
- **Produces:**
  - `WeaveCanvasProps = { src?: string; progress?: number | null; status: "queued" | "weaving" | "completed" | "failed"; alt: string; className?: string }`.
  - WeaveCanvas is exported from `index.ts` with `WeaveCanvasProps`, and gets a registry `support` entry, `weave-canvas`.
  - Internal: `weaveClip(progress: number, direction: "rtl" | "ltr", rows?: number): string`. It returns a `clip-path` polygon that reveals rows from the inline-start edge, bottom row first. At progress 1 it returns `"none"`.
  - `ImageGenerationProps` as §12.7's sketch, plus `agent?: ReactNode` and `duration?: number` (Decision 13); `ImageGenerationLabels`; `imageGenerationCopy`.

**Behavior** (§12.7 holds the anatomy, the weave, the states and the copy):

- **WeaveCanvas** (Decision 24).
  - A `role="img"` box named by `alt`. The warp threads (`--warp`), the image clipped by `weaveClip`, the shuttle and the weft lines are all `aria-hidden`.
  - Reduced motion uses a 200 ms crossfade.
  - The reference is the landing's loom, read-only: `/Users/amjedfadul/Tiraz-worktrees/landing-night-loom/src/landing/weft-clip.ts` and `…/loom/`.
- **ImageGeneration.**
  - The pattern owns a `progressbar`, with a value when progress is known. The progress tag holds a fixed `ch` width.
  - The tray footer reads «{agent} · {formatCount(images.length, "image")} · {formatElapsed(duration)}».
  - The variants are a radio group named «اختر نسخة», of thumbnails named «النسخة ١» and so on, inert until completed.
  - The figure uses WeaveCanvas while queued and weaving. Once completed, and for the failed view, it uses ImageResult for the selected image, which keeps ImageResult's remount, retry-focus and alt-text behaviors.
- **Example.** §12.7's prompt by «مصمّم الحملات», with four variants drawn as inline SVG `data:` URIs (dunes at sunset, a crescent and palms, in warm colors; no external images). Phases: weaving (progress rising), completed and failed.
- **Page:** Weaving · Done★ · Failed. Replay: Weaving → Done. Fields: `appearance`, and `knownProgress` (a boolean).

- [ ] **Step 1: Write the failing tests** in `src/system/image-generation.test.tsx`:
  - **`reveals rows from the inline-start edge, bottom first`:**
    - `weaveClip(0, "rtl")` hides everything, and `weaveClip(1, "rtl")` is `"none"`;
    - at 0.5, the bottom row reaches further than the top row and, in RTL, starts from 100%.
  - **`names the weave as one image and follows progress`:**
    - the box is an img named by `alt`;
    - the progressbar has `aria-valuenow` 42, and the tag reads «يُنسج · ٤٢٪»;
    - null progress gives no `aria-valuenow`.
  - **`crossfades under reduced motion`:** with `reducedMotion: true`, no `requestAnimationFrame` loop runs (a spy), and the image shows once `src` arrives.
  - **`keeps variants inert until done, then chooses from a named radio group`:**
    - radios «النسخة ١» and so on, in a group named «اختر نسخة», inert while weaving;
    - choosing one calls `onSelectedChange("v2")`;
    - «استخدم الصورة» calls `onUse("v2")`.
  - **`retries a failure with focus on the figure and shows the alt text`.**
  - **`explains a blocked request and offers to edit the description`.**
  - **`never loads a remote image in the demo`:** every variant's `src` starts with `data:image/svg+xml`.
  - In `demo-states.test.tsx`, add a `phaseFamilies` row for image-generation.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement**, following the checklist.
- [ ] **Step 4: Gate.**
- [ ] **Step 5: Commit**: `feat(ai): add the Image generation pattern`.

### Task 8: Pattern pages and the navigation regroup

**Model:** Opus. The navigation regroup and the Parts disclosure.

**Spec:**

- Docs §6: the page order, the kicker, Anatomy, Placements, Copy and the part tables;
- Docs §7's «يحل محل» column, §9, §11 and §13's test list;
- §16's navigation column, and §16a's closing paragraph: parts are documented in the patterns' Anatomy, not as pages.

**Carried in:** Plan 1 review: `tests/browser/documentation-groups.mjs` hard-codes 67 rows.

**Files:**

- Create: `src/workbench/pattern-pages.tsx` and `src/workbench/pattern-pages.test.tsx`.
- Modify:
  - in `src/workbench/`: `catalog.ts`, `Workbench.tsx`, `storage.ts` (`aiPartsOpen`), `docs-notes.ts` (`replaces`), `ApiReference.tsx`, `workbench.css` and `i18n.ts`;
  - tests:
    - `navigation-groups.test.tsx`, `Workbench.test.tsx`, `labeled-input-page.test.tsx` and `docs-notes.test.ts`;
    - the part-page tests that open parts through the AI group (`ai-content-pages`, `ai-context-pages`, `ai-feedback-pages`, `tool-activity-pages` and any others the gate shows);
  - `tests/browser/documentation-groups.mjs`.

**Interfaces:**

- **Consumes:** every pattern's `<camelName>Copy`, its `data-zone` attributes, and `appearance` on its example; `registry.support`, read through a `?raw` import and `JSON.parse` (the project has no `resolveJsonModule`).
- **Produces:**
  - In `catalog.ts`:
    - `type Job = "ask" | "delegate" | "create" | "understand"`;
    - `jobNames: Record<Job, Localized>`: اسأل / Ask, فوّض / Delegate, أنشئ / Create, افهم وتحكّم / Understand and control;
    - `patternJobs: Partial<Record<ComponentId, Job>>` for the nine pattern pages;
    - `documentationGroups` entries gain `sections?: readonly { id: string; name: Localized; ids: readonly ComponentId[]; collapsible?: boolean; links?: readonly { href: string; name: Localized }[] }[]`.
  - `PageNotes.replaces?: readonly ComponentId[]`.
  - In `pattern-pages.tsx`:
    - `type Zone = "header" | "paper" | "evidence" | "decision" | "meta"`;
    - `patternPages: Partial<Record<ComponentId, { zones: Record<Zone, readonly string[]>; copy: { ar: object; en: object } }>>`, where `zones` names the parts by catalog id or support id;
    - the components `PatternAnatomy`, `PatternPlacements` and `PatternCopy`.

**Behavior:**

- **Page order** on pattern pages (Docs §6): the heading, the demo frame with its notes, Anatomy, Placements, Copy, "Use it in your app", then the API reference.
- **Kicker:** «أنماط الذكاء الاصطناعي · {job}».
- **Stills.** Anatomy and Placements render the page's `Playground` at its resting phase. Each still sits inside its own SystemProvider within an `inert`, `aria-hidden` wrapper, so its portals and live regions stay inside.
- **Anatomy** («تشريح النمط» / "Anatomy").
  - A card still, with numbered pins on its `[data-zone]` elements in §9's order (header 1 to meta 5). The digits go through `numberLocale`.
  - An ordered legend: «الرأس»، «الورقة»، «الأدلة»، «القرار»، «المعلومات» / Header, Paper, Evidence, Decision, Meta. Each entry names its parts:
    - an existing part opens its page;
    - a new shared part opens the API reference at its table.
- **Placements** («أين يوضع» / "Placements"). Three stills:
  - card (pages with an `appearance` field);
  - plain, inside a ChatThread assistant message;
  - plain, in a 360 px side panel on the tray.
- **Copy** («نصوص كل حالة» / "Copy for every state").
  - A table of key · Arabic · English from the pattern's `copy`.
  - A function entry shows its output for 3 (counts) or 72 seconds (times).
  - A CopyControl copies the current language's string entries as a `labels` object.
- **API reference.** On pattern pages, one table per public shared part the pattern uses, from `registry.support`: each prop's name, type, required flag and default (Decision 23).
- **Notes.** `replaces` renders «يحل محل» / "Replaces" in the middle column, with each part's page as a link. Pattern pages that replace nothing keep `instead`. Per §7:
  - task-starter replaces prompt-bar, chat-composer, model-selector and context-meter;
  - cited-answer replaces thinking-indicator, thinking-state, streaming-text, sources and markdown;
  - agent-task replaces task-rows, tool-call, tool-chips and loading-state;
  - suggested-edits replaces selection-actions;
  - image-generation replaces image-result;
  - change-summary replaces insight-cards.
- **Navigation (Docs §9).** The group order is unchanged. The AI group keeps its name and gains sections:
  - Ask: task-starter, cited-answer;
  - Delegate: agent-task, ask-user-questions, approval-card, approval-flow;
  - Create: suggested-edits, image-generation;
  - Understand and control: change-summary;
  - Screens: chat-app, plus «لوحة بمساعد» / "Dashboard with AI", a link to `/examples/dashboard`;
  - Parts: the fifteen §16 pages, collapsible.

  Display gains loading-state, code-block, markdown and terminal at its end. Section headings use `--text-meta` at weight 500.
- **Parts disclosure.**
  - A button with `aria-expanded` and `aria-controls`, closed by default. Collapsed parts are not rendered.
  - Its state persists as an optional `aiPartsOpen` in `tiraz.documentation.v2`; a missing or invalid value reads as closed.
  - It opens when the active page is a part.
  - The mobile drawer shares the same navigation.

- [ ] **Step 1: Write the failing tests:**
  - In `pattern-pages.test.tsx`:
    - **`orders a pattern page job first and code last`.**
    - **`pins the five zones and links the legend to parts`:** agent-task shows five pins, «١» to «٥». «صفوف المهام» opens TaskRows' page, and «StatusPill» opens the API reference at its table.
    - **`shows three inert placements`:** they are `aria-hidden`, with no focusable element inside.
    - **`lists every default label in both languages and copies the current language`:** the clipboard receives JSON containing «خطة مقترحة».
    - **`says what a pattern replaces, with links`.**
    - **`names the job in the kicker`:** «أنماط الذكاء الاصطناعي · فوّض».
  - In `navigation-groups.test.tsx`:
    - **`groups AI patterns by job, folds the parts and ends Display with content blocks`;**
    - **`remembers the Parts disclosure and opens it for a part page`.**
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.** Then:
  - update the nav counts in `Workbench.test.tsx` and `labeled-input-page.test.tsx`, with Parts closed and open;
  - in the part-page tests, open Parts first or use a saved `active`;
  - let `docs-notes.test.ts` accept `instead` or `replaces`;
  - update `documentation-groups.mjs`'s rows and groups, with Parts closed and open.

  Name each changed test in the commit.
- [ ] **Step 4: Gate.**
- [ ] **Step 5: Commit**: `feat(docs): add pattern page sections and regroup the AI navigation`.

### Task 9: Screens: Assistant workspace and Dashboard with AI

**Model:** Sonnet.

**Spec:** §13a; §16a's ChatThread row; Docs §9's Screens section.

**Files:**

- Modify:
  - in `src/system/`: `ChatApp.tsx`, `ChatThread.tsx`, `index.ts`, `components.css`, `ai/registry.json` and `ai/examples/ChatAppExample.tsx`;
  - `src/examples/chat-app/ChatApp.tsx`, `src/examples/dashboard/Dashboard.tsx` and `Dashboard.test.tsx`;
  - in `src/workbench/`: `catalog.ts` (chat-app becomes «مساحة عمل المساعد» / "Assistant workspace", with a new description), and `ApiReference.tsx` and `docs-notes.ts` for chat-app;
  - tests: `ChatApp.test.tsx`, `chat-foundation.test.tsx` and `terminal-chat-app-pages.test.tsx`;
  - `tests/browser/terminal-chat-app.mjs`.

**Interfaces:**

- **Consumes:** every pattern in plain appearance, with TaskStarter as the composer; `story`; Task 4's ChangeSummary.
- **Produces:**
  - The `ChatMessage` record gains `status?: "streaming" | "completed" | "stopped" | "failed"`, `error?: ReactNode` and `onRetry?: () => void`.
  - `ChatThreadMessage({ message, className }: ChatThreadMessageProps)` is exported, and ChatThread renders each message through it (Decision 1).
  - `ChatAppProps` gains `sidePanel?: ReactNode`, `actions?: ReactNode`, `onConversationRename?: (id: string) => void` and `onConversationDelete?: (id: string) => void`.
  - `ChatConversationItem` gains `group?: string`, and `ChatAppLabels` gains `conversationActions`, `rename` and `delete`.
  - `brand` renders nothing when it is absent.

**Behavior:**

- **ChatThreadMessage.** A failed message shows `error` as persistent text, with «أعد المحاولة» calling `onRetry`. A stopped message notes «أُوقف الرد». The message carries `data-status`.
- **ChatApp.**
  - Conversations group by `group`, in first-seen order; ungrouped ones sit under the existing heading.
  - With either callback, each row gets a menu button «خيارات {title}» with «إعادة التسمية» and «حذف» (Decision 21).
  - The side panel is an `aside` at the inline end; below 960 px it moves under the conversation.
  - Header `actions` sit at the header's end.
  - The Sheet under 640 px stays.
- **Assistant workspace example** (§13a): the October close conversation.
  - Laila asks «لماذا انخفض التدفق النقدي في أكتوبر؟», answered by CitedAnswer (plain, completed).
  - She asks «جهّز إقفال أكتوبر». AskUserQuestions follows (plain, with its receipt), then AgentTask (plain, needs-you with the reminders).
  - TaskStarter (plain) is the composer, and the side panel shows the agent task's details.
  - Approving finishes the task.
  - Conversations group into «اليوم» and «الأسبوع الماضي». Rename opens a Modal with an Input, and delete removes the conversation.
  - Everything is in memory, and no timer outlives an unmount.
- **The `/examples/chat-app` page title** becomes «مساحة عمل المساعد».
- **Dashboard** (Decision 12).
  - What changed sits at the top of the overview.
  - Its rows are computed from `sampleOrders`: the last seven days against the seven before, for orders, revenue and average order value. Up is good.
  - Digits go through `numberLocale`.

- [ ] **Step 1: Write the failing tests:**
  - **`groups conversations and offers rename and delete as intents`.**
  - **`shows a side panel and header actions, and no brand unless given`.**
  - **`shows a failed message's error with Retry, and renders one message alone`.**
  - **`tells the October close with patterns in plain appearance`:** the workspace example contains `section.tz-cited-answer[data-appearance="plain"]`, `.tz-agent-run[data-appearance="plain"]`, the reminders approval, and a TaskStarter composer.
  - **`puts What changed at the top of the overview with rows from the orders`**, in Arabic-Indic digits (Dashboard test).
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.** Replace the old build-log assertions in the chat-app tests and the browser script, and name each in the commit.
- [ ] **Step 4: Gate.**
- [ ] **Step 5: Commit**: `feat(ai): rebuild the assistant workspace and the dashboard screens`.

### Task 10: Agent-facing docs

**Model:** Sonnet.

**Spec:** §17; §3 G5; §16's kinds of page.

**Files:** Modify, in `src/system/`: `ai/registry.json`, `ai/README.md`, `ai/composition.md` and `ai-registry.test.ts`.

**Interfaces:** Consumes each pattern entry's `parts`, `states` and `events` (Tasks 2–7), and the `support` entries of Tasks 1, 4, 6 and 7.

**Behavior:**

- **Registry.**
  - Each AI family gets a `kind`: pattern (the nine), screen (chat-app), part (the fifteen) or content (the four) (Decision 22).
  - Each part entry, component or support, gets `usedBy`: the patterns whose `parts` name it.
- **README.**
  - A new first section, "Start with a pattern": a table mapping user jobs to the pattern (its component and page id) and its parts, then a short paragraph on parts.
  - The family count and list include the six new families (74).
- **composition.md.** A new first section, "Patterns", with §17's rules:
  - the host owns state, and the pattern emits intents;
  - one live region per pattern;
  - shortcuts are scoped and safe: no plain Enter, no shortcut on an irreversible approval, and held keys are ignored;
  - `appearance="plain"` inside another pattern or a conversation, and never a tray inside a tray;
  - amber only for "needs you";
  - the AI color, mark and thread only on AI output;
  - no approve-all.

  Also correct the sentence "Escape rejects from within the card" in the section "Local assistant: ask, preview, decide". Escape rejects inside an inline card. Inside a Sheet or Modal, it closes the dialog and records nothing (Decision 27).

- [ ] **Step 1: Write the failing test** **`classifies AI families and links patterns and parts both ways`** (`ai-registry.test.ts`):
  - every AI-group id has a `kind`;
  - each `parts` id resolves to a component or support id whose `usedBy` names the pattern;
  - each `usedBy` is matched by a `parts`.
- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Gate.**
- [ ] **Step 5: Commit**: `docs(ai): lead the agent docs with patterns`.

### Task 11: Evidence, consumer exercise, review and fixes

**Model:**

- Step 1: Haiku.
- Step 2: a fresh Sonnet consumer with no plan context.
- Steps 3 and 4: Opus for the review and the re-review. Fixes go to the tier of the task that owns each finding, or to Opus when they span tiers.

**Commits:** one per step here, as Plans 2 and 3 ended, each with its own message.

- [ ] **Step 1: Capture the evidence** (Haiku).
  1. Run the gate and report the totals.
  2. `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5411/` must print 200. If it doesn't, stop and report.
  3. Run these four commands from the worktree root, each with a 10-minute timeout:
     - **The 29 AI-group pages, resting, in the base four.** Expected: `<variant>: 29 screenshots` for each variant.

       ```bash
       TIRAZ_PLAYWRIGHT=/Users/amjedfadul/.npm/_npx/e41f203b7505f1fb/node_modules/playwright TIRAZ_EVIDENCE=docs/woven/after-patterns TIRAZ_VARIANTS=ar-light,ar-dark,en-light,en-dark TIRAZ_PAGES=task-starter,cited-answer,agent-task,ask-user-questions,approval-card,approval-flow,suggested-edits,image-generation,change-summary,chat-app,selection-actions,context-meter,model-selector,image-result,sources,insight-cards,chat-thread,chat-composer,prompt-bar,thinking-indicator,thinking-state,task-rows,tool-call,tool-chips,streaming-text,terminal,code-block,markdown,loading-state node tests/browser/woven-evidence.mjs
       ```
     - **Every state of the pattern pages and of the parts that gained states.**

       ```bash
       TIRAZ_PLAYWRIGHT=/Users/amjedfadul/.npm/_npx/e41f203b7505f1fb/node_modules/playwright TIRAZ_EVIDENCE=docs/woven/after-patterns/states TIRAZ_STATES=1 TIRAZ_VARIANTS=ar-light,en-dark TIRAZ_PAGES=task-starter,cited-answer,agent-task,ask-user-questions,approval-card,approval-flow,suggested-edits,image-generation,change-summary,task-rows,tool-call,streaming-text,chat-composer node tests/browser/woven-evidence.mjs
       ```
     - **The nine pattern pages under §19's other conditions.** Expected: `<variant>: 9 screenshots` for each variant.

       ```bash
       TIRAZ_PLAYWRIGHT=/Users/amjedfadul/.npm/_npx/e41f203b7505f1fb/node_modules/playwright TIRAZ_EVIDENCE=docs/woven/after-patterns TIRAZ_VARIANTS=ar-light-390,ar-light-forced,ar-light-r0,ar-light-r16,ar-light-standard,ar-light-large TIRAZ_PAGES=task-starter,cited-answer,agent-task,ask-user-questions,approval-card,approval-flow,suggested-edits,image-generation,change-summary node tests/browser/woven-evidence.mjs
       ```
     - **Two full pages.**

       ```bash
       TIRAZ_PLAYWRIGHT=/Users/amjedfadul/.npm/_npx/e41f203b7505f1fb/node_modules/playwright TIRAZ_EVIDENCE=docs/woven/after-patterns/full TIRAZ_FULLPAGE=1 TIRAZ_VARIANTS=ar-light,en-light TIRAZ_PAGES=agent-task,approval-card node tests/browser/woven-evidence.mjs
       ```
  4. Report the line count of each `errors.txt`, restore the workbench preferences, and commit: `docs(woven): capture pattern evidence`.
- [ ] **Step 2: Consumer exercise** (a fresh Sonnet subagent; §19).
  - **What it reads.** Only `src/system/ai/README.md`, `ai/registry.json`, `ai/composition.md` and the examples they link. Never component sources, the workbench or this plan. It lists every file it opened.
  - **What it builds.** `tests/ai-exercise/close-month/CloseMonth.tsx`: a "close the month" screen built with Agent task and Approval request.
    - Arabic first, with an English toggle.
    - The host's state covers the status, the steps and the decisions.
    - It imports from `../../../src/system`.
  - **Checks.**
    - `npx tsc --noEmit --strict --jsx react-jsx --module esnext --moduleResolution bundler --target es2023 --skipLibCheck --types vite/client --allowImportingTsExtensions tests/ai-exercise/close-month/CloseMonth.tsx` passes.
    - `npm run lint` stays at 0 warnings.
    - No server and no browser.
  - **Notes.** It writes `tests/ai-exercise/close-month/notes.md`: how the docs led it to the patterns, and every guess or friction point. Commit: `test(ai): add the close-the-month consumer exercise`.
- [ ] **Step 3: Review the whole plan** (Opus). Check the diff from the plan's base commit against:
  - §5–12, §13a and §14–19;
  - Docs §6–9 and §11;
  - Woven §13, §14 and §17.8.

  Then:
  - Confirm each Review Focus item has its test.
  - Compare `docs/woven/before/<variant>` and `docs/woven/after-restyle/<variant>` with `docs/woven/after-patterns/<variant>` for these pages: approval-card, approval-flow, ask-user-questions, task-rows, tool-call, thinking-state, streaming-text, sources, selection-actions and image-result.
  - Read the state captures, and the nine pattern pages' 390 px, forced-colors, radius 0 and 16, standard-density and large-type captures.
  - With Playwright against the running server:
    - run axe-core (as `tests/browser/ai-decisions.mjs` loads it) on the nine pattern pages in Arabic light;
    - screenshot `/examples/chat-app` and `/examples/dashboard` into `docs/woven/after-patterns/screens/`;
    - restore the preferences afterwards.
  - Read the exercise notes.
  - Write `docs/woven/plan-4-review.md` with a must-fix list (Critical and Important only) and a backlog, and commit it.
- [ ] **Step 4: Fix wave.**
  - One fix wave for the must-fix list, then one scoped Opus re-review of the fix commits.
  - Set the roadmap's Plan 4 row to "done (<sha>)".
  - No checkpoint for Amjed: Wave 2 waits for his review of Wave 1.
