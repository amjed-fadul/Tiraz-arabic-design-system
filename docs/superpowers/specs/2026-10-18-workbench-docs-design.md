# Workbench docs and demo frame: design

**Status:** Draft for review · 18 October 2026
**Branch:** `claude/woven`, cut from `claude/component-craft` at `aa1d0e3`
**Related specs:** [Woven visual language](2026-10-18-woven-visual-language-design.md) (lands first) · [AI task patterns](2026-10-18-ai-task-patterns-design.md)
**Approved proposal:** https://claude.ai/artifact/3K7uiaG2SEpAWmmkERMTih (the six live demos and the "How a pattern page should read" section)

---

## 1. Intent

Amjed singled out the proposal's interactive example: a frame with the English and Arabic names, a switch between the example's states, a Replay button, a stage, and a notes row saying what the component is for. This spec brings that frame to every documentation page in the workbench. It also:

- regroups the AI navigation by job;
- restyles the docs chrome in Woven;
- fixes the workbench defects the inventory found.

## 2. Decisions already made

1. Every documentation example gets the demo frame (Amjed, 18 Oct). The state switcher appears wherever the component has meaningful states, and Replay wherever it has a lifecycle. A switcher on a Badge or a Card would offer nothing to switch. **(call)**
2. The AI navigation leads with task patterns grouped by job; parts move into a collapsed group (approved proposal).
3. Woven applies to the docs chrome as well (Woven spec).

Calls made by the author and open to change are marked **(call)**.

## 3. How the workbench works today

From the inventory of `aa1d0e3`:

- **Page sections** (`Workbench.tsx:387–494`):
  1. Heading: the kicker "Components", the localized name as `h1`, and the description.
  2. Agent prompt: `h2` "Use it in your app", a one-line preview and a copy control.
  3. Playground: `h2` "Interactive playground", then SystemProvider → PreviewFrame → DemoFrame.
  4. API reference: a `<details>` element.

  The Examples and usage-code sections were removed in `aa1d0e3`; README.md:35 still describes them.
- **DemoFrame** lives in `src/system/ai/examples/DemoFrame.tsx`, and its CSS (`.tz-demo-*`) in `components.css:4634–4817`. It is part of the portable bundle, because StreamingText's copied code uses it.
  - It renders a header with a View tablist (Preview / Code: roving tabindex, arrow keys, a sliding thumb), Copy code with a stale-result guard, and Replay (when allowed).
  - Both panels stay mounted, and the Code view shows a file name, a line gutter and highlighted source.
- **Replay** (`Workbench.tsx:182–202`) remounts 13 listed examples, or resets the playground for the rest. 21 ids have no Replay (`demo-capabilities.ts`).
  - Each example owns its lifecycle as local state set on mount (for example StreamingDemo's `idle | streaming | completed`).
  - **No example accepts a "jump to phase" prop.**
- **Navigation:** groups are declared in `catalog.ts`. The AI group lists 23 ids. Only implemented pages appear. Mobile uses drawers.
- **Persistence** uses four keys:

  | Key | Holds |
  | --- | --- |
  | `tiraz.theme.v1` | theme |
  | `tiraz.documentation.v2` | `language`, `active`, `systemPanelOpen`, `inspectorOpen` |
  | `tiraz.system.v3` | system settings |
  | `tiraz.playgrounds.v2` | per-component props, normalized by `normalizePlaygrounds` |

- **Chrome:**
  - It uses system tokens through its own provider with a fixed `documentationConfig`: radius 6, sage accent, standard density, standard type.
  - It hard-codes 54 literal font sizes, 10 radii and 14 numeric weights in `workbench.css`.

## 4. Goals

- **G1.** Every page renders its example inside the new demo frame.
- **G2.** Every page whose component has meaningful states gets a state switcher. Pages with a lifecycle also get Replay, which steps through the states (section 8).
- **G3.** Every page gets a notes row: the job, when to use something else, and what to notice.
- **G4.** The AI navigation is regrouped by job, with parts in a collapsed group and content blocks moved to Display (section 9).
- **G5.** The docs chrome uses Woven tokens and type scale, with no hard-coded sizes (section 10).
- **G6.** The workbench defects are fixed (section 12).

## 5. Non-goals

- No change to what the inspector offers (the common controls) or how it persists.
- No new storage keys. New preferences are optional fields in existing keys.
- No new routes. The two screens keep `/examples/chat-app` and `/examples/dashboard`.
- The landing page is untouched.

## 6. New page order

1. **Heading.**
   - Kicker: the group, and for AI patterns also the job group (for example "أنماط الذكاء الاصطناعي · فوّض").
   - `h1` at `--text-display` (30 px, weight 600).
   - Description: the job sentence, once. The "use it when" guidance lives only in the notes row, so nothing on the page repeats. **(call)**
2. **Demo frame** (section 7), with its notes row.
3. **Anatomy** (pattern pages only): numbered pins on a still of the example, with a legend linking to the parts.
4. **Placements** (pattern pages only): the pattern as a card, plain inside a conversation, and in a side panel.
5. **Copy for every state** (pattern pages only): the Arabic and English strings, ready to paste.
6. **Use it in your app:** the agent prompt and copy control, unchanged in behavior. It moves below the demo, so the page reads job first and code last. **(call)**
7. **API reference:** unchanged in structure.

The notes need new content for all 68 pages. It lives in `src/workbench/docs-notes.ts` as `Localized` values, so catalog entries stay small. **(call)**

On pattern pages, the API reference also shows a table for each new shared part the pattern uses (AIMark, StatusPill, Tray…), generated from the registry's `support` entries. These parts have no page of their own, so the Anatomy legend links to these tables. **(call)**

## 7. The demo frame

DemoFrame gains optional props, so standalone use (StreamingText's copied example) keeps working unchanged:

```ts
type DemoFrameProps = {
  // existing: title, code, onReplay, children, labels…
  name?: { ar: string; en: string };
  states?: { id: string; label: { ar: string; en: string } }[];
  state?: string;
  onStateChange?(id: string): void;
  notes?: { useWhen: ReactNode[]; instead?: ReactNode[]; replaces?: ReactNode[]; notice?: ReactNode[] };
};
```

Examples with a lifecycle gain a matching pair, `phase?: string` and `onPhaseChange?(phase: string): void` (section 8).

**Header**, in reading order:

1. The name: Arabic at 20 px and English at 17 px, both weight 600. In the Arabic interface the Arabic name comes first.
2. The states group.
3. Replay.
4. The View tablist (Preview / Code).
5. Copy code.

Below 620 px the name takes its own row and the controls sit on a second row. The states group then scrolls horizontally instead of wrapping (today's proposal mockup wraps "Done" onto its own line).

**States group.**

- `role="group"` labelled "حالات المثال" / "Example states". Each state is a button with `aria-pressed`, whose accessible name equals its visible word.
- Pressing a state calls `onStateChange`. Focus stays on the button.
- A polite status inside the frame says "الحالة: {state}" / "State: {state}".
- Tab moves between buttons (no roving focus). **(call)**
- The group sits in its own `.tz-demo-states` container, not inside `.tz-demo-header`'s button row, so existing header-button counts change only where tests are updated (section 13).

**Replay.**

- A dark pill with an icon and the word "إعادة التشغيل" / "Replay". Its accessible name stays "Replay example" and the Arabic equivalent, which existing tests look up.
- Shown only on pages with a Replay sequence (section 8). Today about 46 pages show Replay, and on most of them it resets the page's props to their defaults. That reset would wipe a state the visitor just picked, so it moves to the inspector's existing "reset component" control and Replay means only "play the lifecycle". The existing test in which Replay clears the Textarea text is rewritten against the inspector reset.
- Hidden in the Code view, as today.
- During Replay the pressed state follows the phases.
- Pressing a state, switching to Code, changing page or unmounting cancels the replay and clears its timers.
- Replay keeps focus (an existing test).

**Stage.**

- Paper with faint vertical warp lines: 1 px every 14 px in a warp token, under a radial mask so they fade toward the edges.
- Padding 48 × 24 px on desktop and 30 × 12 px below 620 px. Minimum height 380 px on desktop, none on phones.
- Examples are centered unless the page is on the existing opt-out list (`workbench.css:1184–1191`).

**Notes row.**

- A tray-tinted band under the stage with three columns on desktop, stacked on phones.
- The job sentence is already the page description, so the notes row does not repeat it. Labels:
  - Arabic: استخدمه عندما، استخدم غيره عندما، لاحظ. Pattern pages show "يحل محل" in the middle column, listing the parts the pattern replaces, with links.
  - English: Use it when, Use something else when, What to notice; pattern pages show "Replaces".
- "Use something else when" links each alternative to its page.
- English labels are mono, uppercase and tracked; Arabic labels are never uppercase or tracked.

**Code view.** Behavior unchanged. The code sits in a well inside paper, at Woven sizes.

## 8. States for every family

**Mechanism.** `src/workbench/demo-states.ts` maps each component id to:

- its states (id, Arabic and English label, and what each applies);
- its resting state;
- an optional Replay sequence: `{ state, ms }` steps.

A state applies in one of two ways:

- **Props.** It patches the playground model, the same path as an inspector edit, so the inspector stays in sync and the choice persists with the page's other props.
- **Phase.** Examples with a lifecycle gain `phase` and `onPhaseChange`. Setting `phase` puts the example in that state. **The example stays interactive from there**, as the proposal's demos did: approving a request, submitting answers or sending a draft moves the example on, keeps its simulated host delays, and reports the new phase through `onPhaseChange`, so the switcher follows. When `phase` is undefined, the example runs exactly as today, so copied code still works on its own.

The workbench, not the example, runs Replay: it sets `phase` step by step. Under reduced motion, Replay still steps through the states (they are content changes) but without transitions.

**Resting state.** Each page opens on the state that shows the most of the component. That means:

- the finished state for outputs (Cited answer and Image generation open on Done);
- the waiting state for decisions (Agent task on Needs you, Approval request on Waiting);
- the active state for things that are only interesting while working (ThinkingState on Working).

This matches the proposal's demos. Nothing autoplays on load any more: StreamingText, Skeleton, ChatThread and ToolChips autoplay today. The page is complete at rest, and Replay plays the lifecycle. The test that checks StreamingText's autoplay is rewritten for Replay. **(call)**

**Overlay and environment states.** "Open" appears only for families that already accept a controlled `open` with `onOpenChange`: Sheet, Modal and DropdownMenu.

- Select, DatePicker, ModelSelector and Tooltip get no Open state. `ai/composition.md` deliberately keeps wrappers from adding `open` or `defaultOpen` props, and this spec does not change that for documentation's sake. **(call)**
- For Sheet and Modal, opening moves focus into the dialog, as dialogs must. Closing it reports "Closed" back to the switcher, and Radix returns focus to the state button that opened it.
- FileDropzone's dragging state is internal and has no Dragging state here.
- SelectionActions' "Selected" state works by having the workbench select the sample sentence with the Selection API. The toolbar then reacts to a real selection.

**States** (★ marks the resting state; "—" means no state switcher, and the inspector covers variants):

| Group | Family: states |
| --- | --- |
| Forms | Button: Idle★ · Loading · Success · Error · Disabled (Replay: Idle → Loading → Success) — Input and Textarea: Empty · Filled★ · Invalid · Disabled · Read-only — Select: Empty · Selected★ · Invalid · Disabled — Checkbox: Unchecked · Checked★ · Invalid · Disabled — RadioGroup: Unselected · Selected★ · Invalid · Disabled — Switch: Off · On★ · Disabled — Slider: Default★ · Disabled — OTPInput: Empty · Partial · Complete★ · Invalid — DatePicker: Empty · Selected★ · Invalid — TagInput: Empty · Tagged★ · Invalid — InputCopy: Idle★ · Copied · Failed — ColorPicker: — |
| Files | FileDropzone: Empty · Files added★ · Invalid — FileTree: Collapsed · Expanded★ · Selected |
| Navigation | Sidebar: Expanded★ · Collapsed — Pagination: First · Middle★ · Last — Steps: Start · Midway★ · Error · Complete (Replay) — Tabs, Breadcrumbs: — |
| Data | FilterBar: No filters · Filtered★ — DataTable: Loaded★ · Loading · Empty · Sorted — Table, Timeline: — |
| Display and feedback | NotificationList: Unread★ · All read · Empty — Accordion: Closed · Open★ — Avatar: Photo★ · Initials — Toast: Hidden★ · Shown (Replay) — Skeleton: Loading · Loaded★ (Replay) — Progress: Determinate★ · Indeterminate · Complete (Replay) — Card, AvatarGroup, Badge, EmptyState, Alert, Spinner: — |
| Overlays | DropdownMenu, Sheet, Modal: Closed★ · Open — Tooltip: — |
| Charts | Line, Area, Bar, Donut: Data★ · Empty |
| AI patterns | Start a task: Empty · Writing★ · Choosing mode — Cited answer: Thinking · Writing · Done★ · Failed · Stopped (Replay) — Agent task: Plan · Running · Needs you★ · Failed · Done (Replay) — Clarifying questions: Asking★ · Answered · Failed — Approval request: Waiting★ · Approved · Rejected · Expired — Approval sequence: First★ · Second · Done — Suggested edits: Selecting · Rewriting · Reviewing★ · Applied (Replay) — Image generation: Weaving · Done★ · Failed (Replay) — What changed: Updating · Ready★ · Stale (Replay) |
| AI parts | ThinkingState: Working★ · Done (Replay) — StreamingText: Streaming · Done★ · Stopped · Failed (Replay) — ToolCall: Pending · Running · Needs you · Done★ · Failed (Replay) — ToolChips: Running · Done★ (Replay) — TaskRows: Running · Needs you★ · Done (Replay) — ChatThread: Default · New message★ (Replay) — ChatComposer: Empty · Writing★ · Submitting · Failed — PromptBar: Empty · Writing★ — ImageResult: Loading · Loaded★ · Error — ContextMeter: Normal★ · High · Near · Over — Sources: Collapsed · Expanded★ — SelectionActions: Idle · Selected★ — Terminal: Running · Done★ · Failed (Replay) — ModelSelector, ThinkingIndicator, LoadingState, InsightCards, CodeBlock, Markdown, ChatApp: — |

States that need new behavior from the AI patterns spec are added when that behavior lands, not before:

- StreamingText Stopped and Failed;
- ToolCall and TaskRows Needs you;
- Clarifying questions Answered;
- Approval request Expired.

Wave 2 patterns get their states when they are built.

**Arabic state words.** A shared glossary keeps them consistent; the builder extends it in the same voice:

| English | Arabic |
| --- | --- |
| Idle | جاهز |
| Loading | يُحمَّل |
| Success | نجح |
| Error | خطأ |
| Disabled | معطّل |
| Empty | فارغ |
| Filled | مُعبّأ |
| Invalid | غير صالح |
| Read-only | للقراءة فقط |
| Open / Closed | مفتوح / مغلق |
| Checked / Unchecked | محدّد / غير محدّد |
| On / Off | مفعّل / متوقف |
| Expanded / Collapsed | موسّع / مطوي |
| Selected | مختار |
| Running | يعمل |
| Needs you | بانتظارك |
| Done | اكتمل |
| Failed | تعثّر |
| Stopped | أُوقف |
| Writing | يكتب |
| Thinking | يفكّر |
| Weaving | يُنسج |
| Waiting | بانتظار القرار |
| Approved / Rejected / Expired | تمت الموافقة / رُفض / انتهت المهلة |

Labels never address the reader by gender; passive forms such as تمت الموافقة do that. **(call)**

**This depends on a bug fix.** Today `normalizePlaygrounds` validates enum values by field name, not per component (`model.ts:1091–1137`). `state` allows only `idle | loading | success | error`; `preset` allows only `populated | empty` (except DataTable). As a result:

| Page | Today |
| --- | --- |
| Terminal | `running` and `failed` become `completed` |
| ImageResult | `loaded` becomes `loading` |
| ContextMeter | `near` and `over` become `normal` |

`patchPage` runs the same function on every edit, so these three selects do nothing even within a session, and no test catches it. Any lifecycle state stored through props would be overwritten the same way. Section 12 fixes this before states are built.

## 9. Navigation

**Group order:** AI patterns, Forms, Files, Navigation, Data, Display and feedback, Overlays, Charts (unchanged).

**AI patterns** keeps its group name (أنماط الذكاء الاصطناعي / AI patterns), so the many tests that locate pages through it still find them. It gains sections:

| Section | Pages |
| --- | --- |
| اسأل / Ask | ابدأ مهمة, إجابة موثّقة, اسأل بياناتك (wave 2) |
| فوّض / Delegate | مهمة الوكيل, أسئلة قبل البدء (the AskUserQuestions page), طلب موافقة (ApprovalCard), سلسلة موافقات (ApprovalFlow), صندوق القرارات (wave 2) |
| أنشئ / Create | تعديلات مقترحة, توليد صورة, مسودة للمراجعة (wave 2) |
| افهم وتحكّم / Understand and control | ما الذي تغيّر, إعدادات المساعد (wave 2) |
| شاشات / Screens | مساحة عمل المساعد (the chat-app page), لوحة بمساعد (a link to `/examples/dashboard`; today only the header links to it) |
| الأجزاء / Parts, collapsed by default | SelectionActions, ContextMeter, ModelSelector, ImageResult, Sources / InlineCitation, InsightCards, ChatThread, ChatComposer, PromptBar, ThinkingIndicator, ThinkingState, TaskRows, ToolCall, ToolChips, StreamingText |

**Display and feedback** gains, at its end, LoadingState, CodeBlock, Markdown and Terminal.

**Rules.**

- Page ids never change. Pages only move between groups, so saved `active` values, saved props and links keep working. Renaming an id would drop saved props silently and break several untyped id lists.
- `documentationGroups` gains optional `sections: { id; name: Localized; ids; collapsible? }[]`.
- Section names render as small headings in `--text-meta`, weight 500.
- **Parts disclosure.** A button with `aria-expanded` and `aria-controls`. Its state persists as an optional `aiPartsOpen` field in `tiraz.documentation.v2`; missing or invalid values read as closed. The section opens automatically when the active page is a part. **(call: collapsed parts are not rendered, so nav-count tests change; section 13.)**
- Wave 2 pages appear only once implemented ("Only implemented pages appear").

## 10. Docs chrome in Woven

| Element | Change |
| --- | --- |
| `documentationConfig` | Radius 6 → 8 (the system default), so the chrome matches the components. **(call)** |
| Type | The 54 literal sizes map to the system scale: page title `--text-display`; section `h2` `--text-title`; body `--text-body`; meta `--text-meta`; small UI `--text-micro`. English eyebrows use mono, uppercase, 0.08em tracking. |
| Header | Brand as today (the طِراز wordmark plus "Tiraz"). Under the header, a woven band: two stitched lines with small lozenges between them, in the accent at about 50% opacity. The proposal's band used eight-point stars in the AI color; the star is reserved for AI (Woven spec), so the brand band uses a lozenge, a classic textile border motif, instead. **(call)** |
| Sidebar navigation | Tray background. Items at `--text-label` (13 px; 12 px today) with `--radius-item`. The active item is a paper chip. Section headings and the Parts disclosure as in section 9. |
| Rails (Appearance and Inspector) | Already tray panels (`workbench.css:872–879`); they move to the tray and radius tokens, with controls on paper. |
| Prompt row | Paper with a ring; the copy icon button uses the shared icon-button style. |
| API reference | Paper with hairline rows; mono for prop names and types. |
| Drawers | The backdrop uses `--backdrop` (`#10181055` today, `workbench.css:636`). |
| Leftovers | `data-doc-theme` on `.docs-shell` has no CSS and is removed. Literal shadows (`workbench.css:447`) become tokens. |

The dark theme is designed from the tokens, not inverted. Every chrome element is checked in both themes and both directions.

## 11. Accessibility

- The states group, Replay, the View tablist and Copy each have a visible focus ring and a keyboard path. The state buttons' accessible names contain their visible words (WCAG 2.5.3).
- One polite status per frame announces state changes. Replay does not announce each step, only the state it ends on.
- Keyboard modality and reduced motion follow the Woven spec: no transitions for keyboard-triggered changes.
- Notes headings are `h3` inside the playground section.
- The Parts disclosure is a real button that names the section it controls.

## 12. Workbench defects fixed here

1. **Enum validation by field name** (section 8). Validation moves to per-component enum tables. A new test round-trips every option of every select field on every page through `normalizePlaygrounds` and `patchPage`.
2. **Silent fallback to Toast.** An unknown id renders the Toast playground (`Playground.tsx:941–946`) and Toast code (`generate.ts:598–605`). Both become exhaustive switches on `ComponentId` with a `never` check, so a missing branch fails type-checking.
3. **README.md:35** describes the removed Examples and usage sections. It is rewritten for the new page order.
4. **Stale mentions** of a StreamingText "documentation example" in `generate.ts:647` and `src/system/ai/README.md:658` are removed.
5. **Stale browser scripts.** `documentation-groups.mjs:75–117` expects 32 buttons, no AI group, an 11 px heading and a 190 px sidebar. `ai-decisions.mjs:179, 193` uses the old name "أسئلة المستخدم". Both are updated or retired with a note.
6. **Literal backdrop and shadow colors** in `workbench.css` (section 10).
7. **The chat-app screen has no entry point.** It gets one through the Screens section.
8. **Ambiguous test queries.** Tests that look up "Copy code" or "Replay example" page-wide are scoped to the frame, so state buttons (for example "Open") cannot collide with names on the stage.

## 13. Tests

**Updated:**

- `navigation-groups.test.tsx`: group order, AI sections, the Parts disclosure and the Display additions.
- Nav button counts in `Workbench.test.tsx:57–59` and `labeled-input-page.test.tsx:42`: count rendered buttons, with Parts both closed and open.
- Page tests that open part pages through the AI group (`ai-content-pages`, `ai-context-pages`, `ai-feedback-pages`, `tool-activity-pages`): open Parts first, or use a saved `active`.
- `demo-frames.test.tsx`: header button counts, the new states group and the notes row.
- The test in which Replay clears the Textarea text (`demo-frames.test.tsx:80–98`) moves to the inspector's reset.
- The StreamingText autoplay test becomes a Replay test.
- `ai-decisions-pages.test.tsx` keeps its interactive flows and also checks that the switcher follows them (`onPhaseChange`).
- `Workbench.test.tsx:179–216`: section order (prompt below the demo).
- Registry and catalog order tests for new pattern pages (`ai-registry.test.ts:248–250`).
- The generator module and raw-example lists in `generate-prompts.test.ts`.
- `generated-code.test.ts` for new ids.

**New:**

- `demo-states.test.tsx`, for every family with states: each state applies and renders, the resting state is correct, Replay advances on fake timers and cancels on page change, state click, View switch and unmount, and the inspector reflects props-based states.
- Persistence of the Parts disclosure.
- The per-component enum round-trip (section 12).
- The exhaustive switch (a type-level test).

**Browser evidence:**

- Every page's frame in light and dark, Arabic and English, at 1440 px and 390 px.
- The states group scrolling on phones.
- Replay on each lifecycle page.

Screenshots go under `docs/workbench-docs/`.

## 14. Build order

This spec's steps slot into one order shared by all three specs (below).

1. Fix enum validation and the Toast fallback; add their tests.
2. Extend DemoFrame (states, notes, names, layout) and its styles, keeping standalone use working.
3. Add `demo-states.ts`, and the `phase` / `onPhaseChange` pair on lifecycle examples, for the states that exist today.
4. Write `docs-notes.ts` for all 68 pages in Arabic and English.
5. Restyle the chrome (after the Woven foundations land).
6. Pattern pages: each AI pattern ships its own catalog, registry and docs page, its states and its Anatomy, Placements and Copy sections, using the infrastructure from steps 2 to 4 (AI patterns spec).
7. Regroup the navigation in one move (AI sections, Parts, the Display additions) once Wave 1 is complete. Regrouping earlier would show an AI group with empty sections and fifteen pages folded into Parts.
8. Update README, the agent prompt text and stale scripts.

## 14a. Order across the three specs

1. **Prerequisites.**
   - The workbench enum fix and exhaustive switch (this spec, section 12).
   - The two missing Arabic behavior tests (AI patterns spec, section 16a).
   - Bring in the uncommitted work from the other worktrees: the numerals setting and the browser-test repairs (Amjed, 18 Oct; Woven spec, build step 1).
2. **Woven foundations** (Woven spec, build step 1).
3. **Demo frame, states mechanism and notes** for existing families (this spec, steps 1–4).
4. **Woven restyle of families and the docs chrome** (Woven steps 2–5; this spec, step 5).
5. **Woven alignment of AI parts**, CSS only (Woven step 6).
6. **AI shared parts and Wave 1 patterns**, each with its page and the part states it unlocks (AI patterns spec, build steps 2–9).
7. **Navigation regroup** in one move (this spec, step 7; AI patterns spec, step 10).
8. **Screens, README and agent documents.**
9. **Wave 2**, after Amjed reviews Wave 1.

## 15. Decisions from review

Answered by Amjed on 18 October 2026:

- The uncommitted work in other worktrees joins this branch first. That includes the `claude/component-craft` repairs to `tests/browser`, which already update `documentation-groups.mjs` to 67 pages and fix `ai-decisions.mjs`. So defect 5 (section 12) builds on them rather than redoing them.

Decided by the author and listed for review rather than asked, because each is cheap to reverse:

- the agent prompt moves below the demo;
- the docs chrome uses the system's 8 px radius;
- the brand band uses lozenges instead of the AI star;
- state buttons use plain Tab order;
- pages open on their most telling state with no autoplay;
- "Open" states only where controlled `open` already exists.

## 16. Left to the builder

- Exact header markup and spacing within the rules in section 7.
- The wording of notes and "Use it when" for each page, following the copy rules (plain, specific, from the user's side).
- Arabic state words beyond the glossary, in the same voice.
- Whether Replay step durations are per family or a shared default (between 800 and 2,600 ms per step).
