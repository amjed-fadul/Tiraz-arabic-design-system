# Woven Restyle Implementation Plan (Plan 3 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task by task. Each task names its implementer model; a fresh Opus subagent reviews every task (see the roadmap). Steps use checkbox (`- [ ]`) syntax for tracking. Keep the work lean. Amjed, 19 and 20 Oct: "don't over-engineer"; Plan 3 runs on Opus. Do exactly what your family rows say, write only the tests your task names, and add no extra helpers or out-of-scope changes. The CSS audit is the gate. Tests cover only what a unit test can see.

**Goal:** Every component family and the documentation chrome wear the Woven look:

- paper on tray;
- the radius and type scales;
- field rings;
- one press amount;
- pointer-gated hovers;
- the motion budget;
- the status vocabulary.

Each family joins the CSS audit, and the spec's defects are fixed along the way.

**Architecture:**

- Styles stay in `src/system/components.css` (about 7,500 lines: one section per family, plus shared sections from about 6,940 to the end) and `src/workbench/workbench.css`.
- Each task restyles a group of families with Plan 1's tokens, then registers each family's class prefixes in `src/system/css-audit.families.ts`. From then on the audit requires `[]` for every rule that names those prefixes, including the shared sections.
- API changes are additive: the `warning` and `ai` tones, DatePicker's real Buttons, and Spinner's `ai` tone.

**Tech Stack:** React 19, TypeScript ~6.0, Vitest 5 (jsdom), postcss (the audit).

**Specs:** "Woven" is `docs/superpowers/specs/2026-10-18-woven-visual-language-design.md`, and "Docs" is `docs/superpowers/specs/2026-10-18-workbench-docs-design.md`. Roadmap: `docs/superpowers/plans/2026-10-18-woven-roadmap.md`.

**Audit today** (20 Oct): 183 issues across `.tz`. Status-icon, remove-button and demo-frame are already registered.

**Deferred to the backlog** (Plan 1 review items with no family owner):

- `--border-field` on `--wash` in dark mode (2.75:1);
- pinning code colors on the well and `--focus` in `tokens.test.ts`;
- audit precision fixes, and extending check 11 to type tokens;
- a committed FilterBar remove-hover browser check. The Task 9 evidence shows it instead.

## Global Constraints

- **Specs.**
  - Woven: `/Users/amjedfadul/Tiraz-worktrees/woven/docs/superpowers/specs/2026-10-18-woven-visual-language-design.md`.
  - Docs: `/Users/amjedfadul/Tiraz-worktrees/woven/docs/superpowers/specs/2026-10-18-workbench-docs-design.md`.
  - Read your task's Woven §17 rows and §18 defects first. The rules are in Woven §7.2 (which token each literal size and line height becomes) and §9–16.
- **Working directory.** `/Users/amjedfadul/Tiraz-worktrees/woven`, branch `claude/woven`. Start each shell command with `cd /Users/amjedfadul/Tiraz-worktrees/woven && `.
- **Gate.** `npm test && npm run lint && npm run build && npm run format:check`. `npm test` takes about 60 s; use a 5-minute timeout. Lint stays at 0 warnings.
- **Tokens only.**
  - Use the tokens in `src/system/tokens.css`. A family's registered prefixes must audit clean. The audit rules are in `src/system/css-audit.ts`.
  - **A duration without a token** gets one in `tokens.css`. Put it on the root, in both reduced-motion blocks, and in the keyboard-modality block, unless it is a loop or streamed text. Then extend the `motion` map and the keyboard `kept` list in `src/system/tokens.test.ts`.
- **Shared rules.** Some claimed rules also style a later task's family, for example `.tz-ask-questions .tz-radio-option`. In those rules, fix only the audit issue, using the token that family's row names. Leave that family's own redesign to its task.
- **Motion only after change.**
  - Persistent content never animates on mount; see the `useChanged` / `data-changed` pattern, as at `.tz-status-icon` (~3576).
  - Presses release with `--ease-out`, never the spring (Woven §12). Remove `--ease-spring` from your families.
  - Never redeclare `--press-scale` or `--motion-*` locally, and never put literal times inside `calc()`.
  - Animate only `transform` and `opacity`, except for Woven §20's documented exceptions: the disclosure-panel heights of Accordion, TaskRows, ThinkingState and ToolCall; the Toast stack height; and the sidebar width.
- **Arabic and direction.**
  - Logical properties only.
  - No letter-spacing, `text-transform` or italics on Arabic. English-only styling sits under `:lang(en)`.
  - Digits go through `numberLocale`.
  - Direction-bearing icons mirror with `tz-mirror-rtl`.
- **Forced colors.** Keep or add `border: 1px solid transparent` where an edge is only a shadow or ring (Woven §6).
- **Public APIs** change additively only, and copied example code keeps working.
- **Tests.**
  - Add tests only for API additions, and for defect fixes a unit test can observe: a role, class, attribute, text, or which element renders. Visual results are checked by the audit and by Task 9's evidence.
  - Change an existing test only where the spec changes what it asserts, and name it in the commit.
  - If you change a value that a browser script hard-codes, update the script. Find them with `grep -n 'borderRadius\|fontSize' tests/browser/*.mjs`; known ones are `table.mjs:137`, `charts.mjs:248` and `documentation-groups.mjs:91`.
- **Commits.** Each ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never push, and never start or stop servers. A dev server runs at http://127.0.0.1:5411; restore the workbench preferences after using the browser.

## Review Focus

1. **Registered families audit clean through the shared sections too.** Moving a rule out of a shared section must not drop it. → the family loop in `css-audit.test.ts`, per task.
2. **No interaction motion survives keyboard modality.** No family keeps a local `--press-scale`, a literal time, a `calc()` offset or a spring release. → audit checks 4 and 11, plus the `--ease-spring` removal per task.
3. **Dark mode keeps its contrast.** Every new surface or edge uses tokens that `tokens.test.ts` checks. → audit check 1.
4. **Copied code still works.** New tones and DatePicker's Buttons are additive. → the existing generated-code tests stay green.
5. **No first render animates.** This covers chat messages, decision cards, status glyphs, the shared check draw, and tags. → Tasks 6–7 tests; the `[data-changed]` gating in Tasks 1, 2 and 4.

---

### Task 1: Forms A

**Model:** Opus

**Families** (Woven §17.1): Button, Field, Input, Textarea, Select, Checkbox, RadioGroup and Switch.

**Prefixes to register:** `.tz-button`, `.tz-field`, `.tz-input`, `.tz-textarea`, `.tz-select`, `.tz-checkbox`, `.tz-radio`, `.tz-choice`, `.tz-switch`.

**Defects** (Woven §18):

- 11: the shared check draw (~7027) gates Button success on `[data-changed]`.
- 13: remove the invalid shake (~827, ~7175).
- 25: fold this group's overrides from the "One edge language for every surface" block (~6919–6970) into the original rules.
- 26: move the radio base rules from the AI section into Forms.
- 27 and 28, for these families.

**Also:**

- Delete the local `--press-scale` declarations (~28, ~73).
- `:read-only` matches only `input, textarea` (Woven §12; ~862, ~1297).
- The touch-zoom rule `max(16px, var(--text-body))` (~847) becomes a `--text-touch` token.
- The `[data-glide]::before` highlight (~6977) animates `transform`, not `block-size`, and drops the `- 20ms` offset.

**Shared rules to fix for their audit issues only:**

- ~5180, the chat send button (`100px`, and `--press-scale: 0.9` at ~5182);
- ~7040, the shared draw (`+ 120ms … 60ms`);
- ~6382 and ~6419, the AskUserQuestions options (`var(--radius)`, `+ 80ms`, `* 40ms`, `6px`, `11px`). Defect 12 stays with Task 7.

- [ ] **Step 1: Restyle** each family to its row.
- [ ] **Step 2: Register** the prefixes, and get the audit to `[]`.
- [ ] **Step 3: Gate.**
- [ ] **Step 4: Commit**: `style(forms): apply Woven to buttons, fields and choices`.

### Task 2: Forms B and Files

**Model:** Opus

**Families** (Woven §17.1–17.2): Slider, OTPInput, DatePicker, TagInput, ColorPicker, InputCopy, FileDropzone, FileTree.

**Prefixes to register:** `.tz-slider`, `.tz-otp`, `.tz-datepicker`, `.tz-date`, `.tz-tag`, `.tz-color`, `.tz-input-copy`, `.tz-file`, `.tz-selected-files`, `.tz-entry`. `.tz-entry` is shared by five of these families. `.tz-tag` also covers FilterBar's chips.

**Defects:**

- 1, 2 and 3: DatePicker.
- 5: FileTree's two focus rings.
- 7: the Slider thumb.
- 11: the shared draw gates the ColorPicker check on `[data-changed]`.
- 14: OTP on prefill.
- 25: the DatePicker popup (~2959).
- 27 and 28.

**Also:**

- Remove the ColorPicker swatch growth (~6797, ~6810). Audit check 7 can't see it.
- Stop remove buttons dimming twice inside disabled TagInput and FileDropzone (~2390, ~2614).
- The FileDropzone row staggers (~7121–7129) use `--motion-stagger`.

**Files:** `components.css`, `css-audit.families.ts`, `src/system/DatePicker.tsx`. Today and Clear become real `Button`s with `size` and `state`.

- [ ] **Step 1: Restyle** each family to its row.
- [ ] **Step 2: Register** the prefixes, and get the audit to `[]`.
- [ ] **Step 3: Tests:**
  - DatePicker's Today and Clear render as `.tz-button` with the picker's `size`;
  - the DatePicker trigger carries the `size` it was given (`data-size`), per Woven §20.
- [ ] **Step 4: Gate.**
- [ ] **Step 5: Commit**: `style(forms): apply Woven to sliders, pickers, tags and files`.

### Task 3: Surfaces and overlays

**Model:** Opus

**Families** (Woven §17.5–17.6): Card, Modal, Sheet, Toast, DropdownMenu, Tooltip, Alert, Badge, EmptyState, Accordion, Avatar, AvatarGroup.

**Prefixes to register:** `.tz-card`, `.tz-modal`, `.tz-sheet`, `.tz-toast`, `.tz-menu`, `.tz-tooltip`, `.tz-alert`, `.tz-badge`, `.tz-empty`, `.tz-illustration`, `.tz-accordion`, `.tz-avatar`, `.tz-icon-button`, `.tz-kbd`.

- `.tz-icon-button` is the close button on Modal, Sheet and Toast. It currently uses `scale(0.92)` (~170).
- `.tz-kbd` is DropdownMenu's shortcut hint (`DropdownMenu.tsx:82`).

**Defects:**

- 15: AvatarGroup's `+N` is forced LTR (`AvatarGroup.tsx:45`).
- 17: the EmptyState arrow.
- 19: Alert's text color.
- 20: Sheet uses physical properties and a 1 px border.
- 21: Tooltip has no exit.
- 22: the Toast gap is defined twice.
- 24: Avatar sizes are fractional. Size `.tz-avatar` with `--avatar-sm` / `--avatar-md` (already 32 and 40); ~1332 still computes the size.
- 25: the menu, toast, modal, sheet, tooltip, card and accordion overrides.
- 27 and 28.

**API additions** (Woven §8.3): `BadgeTone` gains `warning` and `ai`; Alert reuses it, and Toast gains `warning`. Update `src/system/ai/registry.json` and the tone selects in `src/workbench/fields.ts`.

**Also:**

- **The toast stack:** collapsed by default under `:not(:focus-within)`, and expanded on `:focus-within` or a gated `:hover` (~562–572).
- **AvatarGroup's hidden-names label:** names are joined with «،» in Arabic and ", " in English. The count uses the dual for two, «عضوان آخران».
- **Unused class:** delete `.tz-popover-surface`, which nothing uses.

**Shared rules to fix for their audit issues only:**

- `.tz-badge` at ~3635 and ~4292;
- `.tz-avatar` at ~5114;
- `.tz-card` at ~5622.

**Files:** `components.css`, `css-audit.families.ts`, `Badge.tsx`, `Alert.tsx`, `Toast.tsx`, `useToast.ts`, `Sheet.tsx`, `DropdownMenu.tsx`, `EmptyStateIllustrations.tsx`, `AvatarGroup.tsx`, `fields.ts`, `registry.json`.

- [ ] **Step 1: Restyle** each family to its row.
- [ ] **Step 2: Register** the prefixes, and get the audit to `[]`.
- [ ] **Step 3: Tests:**
  - Badge and Alert render `warning` and `ai` (`data-tone`), and Toast renders `warning`.
  - The JS sets `--toast-gap` inline from `TOAST_GAP`, with the CSS 8px (~513) deleted. Assert the inline style.
  - AvatarGroup's English label uses ", ", and two hidden members read «عضوان آخران».
- [ ] **Step 4: Gate.**
- [ ] **Step 5: Commit**: `style(surfaces): apply Woven to cards, overlays and feedback surfaces`.

### Task 4: Navigation and data

**Model:** Opus

**Families** (Woven §17.3–17.5): Sidebar, Tabs, Breadcrumbs, Pagination, Steps, Table, DataTable, Timeline, FilterBar, NotificationList.

**Prefixes to register:** `.tz-sidebar`, `.tz-tab`, `.tz-tabs`, `.tz-breadcrumbs`, `.tz-breadcrumb`, `.tz-pagination`, `.tz-step`, `.tz-steps`, `.tz-table`, `.tz-data`, `.tz-timeline`, `.tz-filter`, `.tz-notification`, `.tz-row`, `.tz-unread`.

**Defects:**

- 6: the Tabs focus ring is clipped.
- 11: the shared draw gates the Steps indicators on `[data-changed]`.
- 18: DataTable hover overrides the sorted color, and the rule is duplicated.
- 25: the DataTable hover and ~967.
- 27 and 28.

**Also:**

- The tab indicator animates `transform`, not `width` (~212).
- DataTable's loading preset renders skeleton rows (Woven §17.4).

- [ ] **Step 1: Restyle** each family to its row.
- [ ] **Step 2: Register** the prefixes, and get the audit to `[]`.
- [ ] **Step 3: Test** that DataTable's loading state renders skeleton rows.
- [ ] **Step 4: Gate.**
- [ ] **Step 5: Commit**: `style(navigation): apply Woven to navigation, tables and lists`.

### Task 5: Feedback and charts

**Model:** Opus

**Families** (Woven §17.5, §17.7): Skeleton, Progress, Spinner, Tick, and the Line, Area, Bar and Donut charts.

**Prefixes to register:** `.tz-skeleton`, `.tz-progress`, `.tz-spinner`, `.tz-loading-spinner`, `.tz-tick`, `.tz-chart`.

**Defects:** 27 and 28.

**Also:**

- Spinner gains an `ai` tone.
- Progress animates its fill with `transform: scaleX()` from the inline-start edge, over 240 ms (Woven §20).
- New tokens are needed for the spinner's 800 ms and indeterminate progress's 1.5 s (the token rule in Global Constraints).
- Chart tooltips become paper at `--radius-control`. Grid lines use `--hairline` (the grid stroke is a JSX prop, `Charts.tsx:339`).

**Shared rule to fix for its audit issues only:** `.tz-progress` at ~5748.

**Files:** `components.css`, `css-audit.families.ts`, `tokens.css`, `tokens.test.ts`, `Charts.tsx`, `Progress.tsx`, `Spinner.tsx`.

- [ ] **Step 1: Restyle** each family to its row.
- [ ] **Step 2: Register** the prefixes, and get the audit to `[]`.
- [ ] **Step 3: Tests:**
  - Spinner renders `data-tone="ai"`.
  - Progress passes its fraction to CSS for `scaleX`, through a custom property, rather than `inline-size`.
- [ ] **Step 4: Gate.**
- [ ] **Step 5: Commit**: `style(feedback): apply Woven to loading, progress and charts`.

### Task 6: AI parts A (thinking, content, tools, chat)

**Model:** Opus

**Families** (Woven §17.8): LoadingState, ThinkingIndicator, ThinkingState, StreamingText, Markdown, CodeBlock, Terminal, ToolCall, ToolChips, TaskRows, ChatThread, ChatComposer, PromptEntry, PromptBar, ChatApp.

The AIMark is Plan 4's; here ThinkingIndicator and ThinkingState get only token, radius, type, status-color and motion changes.

**Prefixes to register:** `.tz-loading`, `.tz-thinking`, `.tz-stream`, `.tz-streaming`, `.tz-markdown`, `.tz-code`, `.tz-terminal`, `.tz-tool`, `.tz-agent`, `.tz-task`, `.tz-chat`, `.tz-prompt`.

**Defects:**

- 8: the composer shadow in dark mode.
- 9: `tz-ai-shimmer` direction in RTL.
- 10: the chat replays its last message.
- 15 and 16: Terminal's words and its "exit N" are localized, with digits through `numberLocale`.
- 29: the TaskRows running badge uses Task 3's `ai` tone.
- 25: popups in this group.
- 27 and 28.

**Also:**

- The ToolCall panel's `ease` (~4332) becomes `var(--ease-out)`.
- Fix the chat-app Terminal clipping " kB" at line ends.
- New tokens are needed for the caret blink of 1.1 s (~2917, ~4636) and for the word settle of 300 ms.

**Files:** `components.css`, `css-audit.families.ts`, `tokens.css`, `tokens.test.ts`, `Terminal.tsx`, `TaskRows.tsx`, the chat components, and tests.

- [ ] **Step 1: Restyle** each family to its row.
- [ ] **Step 2: Register** the prefixes, and get the audit to `[]`.
- [ ] **Step 3: Tests:**
  - Terminal renders its Arabic words, and Arabic-Indic digits for an exit code in Arabic.
  - A chat message's first render has no entry hook.
  - The TaskRows running badge has `data-tone="ai"`.
- [ ] **Step 4: Gate.**
- [ ] **Step 5: Commit**: `style(ai): apply Woven to thinking, content, tool and chat parts`.

### Task 7: AI parts B (decisions, context, results)

**Model:** Opus

**Families** (Woven §17.8): AskUserQuestions, ApprovalCard, ApprovalFlow, SelectionActions, ContextMeter, ModelSelector, ImageResult, Sources, InlineCitation, InsightCards.

The tray and paper anatomy of the decision families, and the attention pill, are Plan 4's. Here those families get only token, radius, type, status-color and motion changes.

**Prefixes to register:** `.tz-ask`, `.tz-question`, `.tz-decision`, `.tz-approval`, `.tz-selection`, `.tz-context`, `.tz-model`, `.tz-image`, `.tz-pixel`, `.tz-sources`, `.tz-source`, `.tz-citation`, `.tz-inline`, `.tz-insight`, `.tz-insights`, `.tz-ai`. `.tz-ai` also covers the AIResultsExamples layout.

**Defects:**

- 11: the decision glyphs pop on mount.
- 12: the decision cards rise on mount and re-cascade.
- 17: the InsightCards arrow.
- 21: the ModelSelector popup has no exit.
- 30: ContextMeter's status color and thresholds use `--ai` when normal, `--attention` when high, and `--danger` near and over capacity.
- 25: the popups and SelectionActions.
- 27 and 28.

**Also:** the Sources marks (~5431) and question steps (~6354) animate `transform`/`opacity` only.

- [ ] **Step 1: Restyle** each family to its row.
- [ ] **Step 2: Register** the prefixes, and get the audit to `[]`.
- [ ] **Step 3: Tests:**
  - ContextMeter's status text carries its threshold's tone.
  - A decision card's first render has no entry hook.
- [ ] **Step 4: Gate.**
- [ ] **Step 5: Commit**: `style(ai): apply Woven to decision, context and result parts`.

### Task 8: Documentation chrome and docs

**Model:** Opus

**Scope:**

- **The chrome (Docs §10):**
  - `documentationConfig` radius goes from 6 to 8.
  - The 55 literal sizes map to the scale, with the page h1 at `--text-display` (Docs §6).
  - Add the woven band of lozenges under the header.
  - The sidebar becomes a tray, with items at `--text-label` and `--radius-item`, and the active item a paper chip.
  - The rails move to tray and radius tokens.
  - The prompt row becomes paper with a ring.
  - API reference rows become hairlines.
  - Drawers use `--backdrop`.
  - Remove the dead `data-doc-theme`.
  - Literal shadows become tokens.
- **The demo frame's View pill thumb (~4847)** animates `transform`, not its size.
- **Woven defects 31 and 32**, and **Woven §21 step 7**:
  - README.md's token tables, sizes, motion values, accent list and font setup are rewritten from `tokens.css`.
  - So are the agent-facing motion values in `src/system/ai/README.md`, for example "360ms reveal" at ~699.

**Files:** `src/workbench/workbench.css`, `src/workbench/Workbench.tsx`, `src/system/components.css` (the View pill only), `README.md`, `src/system/ai/README.md`.

- [ ] **Step 1: Restyle** the chrome. Check both themes and both directions in the browser, then restore the preferences.
- [ ] **Step 2: Rewrite** the README and agent-doc values from `tokens.css`.
- [ ] **Step 3: Gate.**
  - `grep -nE 'font-size: [0-9]|border-radius: [0-9]|#[0-9a-fA-F]{3,8}' src/workbench/workbench.css` prints nothing. Today it finds 55 sizes, 11 radii and 2 colors.
  - Add a test that `data-doc-theme` is gone.
  - Then run the full gate.
- [ ] **Step 4: Commit**: `style(docs): apply Woven to the documentation chrome`.

### Task 9: Evidence, review and fixes

**Model:** Opus for every step.

- [ ] **Step 1: Extend the evidence script and capture.**
  1. In `tests/browser/woven-evidence.mjs`, add an `ar-light-forced` variant using `newContext({ forcedColors: "active" })`.
  2. Add a `TIRAZ_FULLPAGE=1` mode that captures the whole page instead of `.playground-section`.
  3. Run the gate.
  4. `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5411/` must print 200.
  5. Capture into `docs/woven/after-restyle`: all ten variants, one run each. Then capture full pages for `button` and `task-rows` in `ar-light`, `ar-dark`, `en-light` and `ar-light-390`, into `docs/woven/after-restyle/full`.
  6. Commit: `docs(woven): capture restyle evidence`.
- [ ] **Step 2: Review the whole diff** against Woven §9–18 and §20, and Docs §6 and §10.
  - Compare `docs/woven/before/<variant>` with `docs/woven/after-restyle/<variant>` for 15 families across the groups, in ar-light, ar-dark, en-light, ar-light-r0, ar-light-r16, ar-light-390 and ar-light-forced.
  - Review the full-page chrome captures.
  - Write `docs/woven/plan-3-review.md` with a must-fix list, and commit it.
- [ ] **Step 3: Fix wave.** One fix wave for the must-fix list, then one scoped re-review. Then continue to Plan 4 with no checkpoint (Amjed, 19 Oct).
