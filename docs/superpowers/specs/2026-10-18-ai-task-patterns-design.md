# AI task patterns: design

**Status:** Draft for review · 18 October 2026
**Branch:** `claude/woven`, cut from `claude/component-craft` at `aa1d0e3`
**Related specs:** [Woven visual language](2026-10-18-woven-visual-language-design.md) (lands first) · [Workbench docs and demo frame](2026-10-18-workbench-docs-design.md)
**Approved proposal:** https://claude.ai/artifact/3K7uiaG2SEpAWmmkERMTih (private artifact; the live mockups referenced below are on that page)

---

## 1. Intent

Amjed reviewed Tiraz's AI section and said two things. First, it shows people components they do not care about by themselves (ModelSelector, Sources / InlineCitation and similar). People want to see the full pattern that solves a problem or completes a task. Second, he did not like how the components look.

An audit on 18 October 2026 confirmed it. Of the 23 pages in the AI group, only four show a complete moment (ChatApp, AskUserQuestions, ApprovalCard, ApprovalFlow). Fifteen are parts of a larger flow. Four are general content blocks (Terminal, CodeBlock, Markdown, StreamingText). Six different components all say "the assistant is working".

The approved proposal regroups the AI section into **twelve task patterns**, each a complete job with a beginning, a working state, a moment where the person decides, and a result. Today's components become the parts inside them. Amjed approved the direction, the visual language ("Woven", specified separately) and the interactive demos with a state switcher.

This spec defines the patterns: their shared anatomy, the state system, each pattern's behavior, API, copy and accessibility, how today's 23 pages map onto them, the shared demo story, and how agent-facing docs change.

## 2. Decisions already made

Made by Amjed on 18 October 2026, after reviewing the proposal:

1. **Patterns are the unit of documentation.** A pattern page documents a job end to end. Parts are documented inside the patterns that use them.
2. **Twelve patterns in four job groups, plus two screens**, split into two waves (section 7).
3. **The Woven look** applies to the patterns and to every other component family (Woven spec).
4. **Interactive demos with a state switcher and Replay** on documentation pages (Workbench spec).
5. **No new font.** The font Amjed liked in the examples is Tiraz's own IBM Plex Sans Arabic; the examples' type setting (16/600 titles, 15.5 px reading text) is adopted (Woven spec, section 7).

Calls made in this spec by the author (Claude) and open to change are marked **(call)**.

## 3. Goals

- **G1.** Ship twelve patterns. Wave 1 (eight patterns) absorbs every one of today's 23 AI pages, so the part pages can leave the main navigation in one move.
- **G2.** Keep every existing AI export working with no breaking API change. Parts stay first-class building blocks, listed in a collapsed "Parts" group and in each pattern's anatomy.
- **G3.** One anatomy and one six-state system across all patterns, so people learn the layout once and a waiting agent looks the same everywhere.
- **G4.** Demo content tells one business story in Arabic (with English equivalents): a finance team closing October. The same customers, invoices and amounts appear across patterns.
- **G5.** Agent-facing documentation (`ai/registry.json`, `ai/README.md`, `ai/composition.md`, generated prompts and usage code) leads with patterns and maps jobs to patterns.

## 4. Non-goals

- No model calls, streaming transport, persistence or backend. Patterns render host-supplied state and emit intents. This keeps Tiraz's rule: "Tiraz does not save data or simulate requests."
- No speech recognition. Voice buttons emit an intent only.
- No new chart types. Ask your data uses the existing chart families.
- No removal or renaming of existing exports.
- No inline plan editing in Wave 1. Agent task emits `onEditPlan` and the host opens its own editor. **(call)**

## 5. Anti-goals

The project fails, even if it technically works, if:

- A pattern is a thin wrapper that adds chrome around one part without finishing the job.
- AI styling (thread color, star mark, weave) leaks onto content the assistant did not produce.
- The library simulates progress. Timers exist only for real UI affordances (auto-start countdown, undo window), and the host can turn them off.
- Arabic shaping breaks: per-letter animation, letter-spacing on Arabic, or bidi reordering of IDs and amounts.
- Two patterns show the same state in different colors or words.
- The look drifts into generic AI styling: purple gradients, sparkle emoji, glowing borders.

## 6. Constraints

- **Arabic first.** RTL default; logical CSS properties; digits through `numberLocale(config)` (Arabic-Indic by default in Arabic); Latin IDs isolated with `<bdi dir="ltr">`; Arabic plural and gender agreement in every count and status label.
- **Controlled APIs.** Every controlled value has its change callback. Uncontrolled defaults only where existing families already offer them.
- **Accessibility.** WCAG 2.2 AA in both themes and all accent presets. Full keyboard paths. Status is never conveyed by color alone.
- **Motion.** Honors both the OS reduced-motion preference and `SystemConfig.reducedMotion`. Keyboard-triggered changes do not animate.
- **Foundations first.** The Woven tokens, fonts and shared surfaces (Woven spec) must be merged before any pattern is built.
- **Base branch.** Build on `claude/woven` (cut from `claude/component-craft` at `aa1d0e3`) after it brings in the uncommitted numerals work and browser-test repairs from the other worktrees (Amjed, 18 Oct; Woven spec, build step 1).
- **Baseline.** 82 test files and 806 tests pass on `aa1d0e3`. They must keep passing, updated only where a test asserts on something this spec intentionally changes.

## 7. The twelve patterns

| Group | Pattern (EN · AR) | Component | Wave | Absorbs today's pages |
| --- | --- | --- | --- | --- |
| Ask · اسأل | Start a task · ابدأ مهمة | `TaskStarter` (new) | 1 | PromptBar, ChatComposer, ModelSelector, ContextMeter (and the internal PromptEntry) |
| Ask | Cited answer · إجابة موثّقة | `CitedAnswer` (new) | 1 | ThinkingIndicator, ThinkingState, StreamingText, Sources / InlineCitation, Markdown as answer body |
| Ask | Ask your data · اسأل بياناتك | `DataAnswer` (new) | 2 | — (uses chart families) |
| Delegate · فوّض | Agent task · مهمة الوكيل | `AgentTask` (new) | 1 | TaskRows, ToolCall, ToolChips, LoadingState (agent use) |
| Delegate | Clarifying questions · أسئلة قبل البدء | `AskUserQuestions` (existing, extended) | 1 | AskUserQuestions |
| Delegate | Approval request · طلب موافقة | `ApprovalCard`, `ApprovalFlow` (existing, extended) | 1 | ApprovalCard, ApprovalFlow |
| Delegate | Decision inbox · صندوق القرارات | `DecisionInbox` (new) | 2 | — |
| Create · أنشئ | Suggested edits · تعديلات مقترحة | `SuggestedEdits` (new) | 1 | SelectionActions |
| Create | Image generation · توليد صورة | `ImageGeneration` (new) | 1 | ImageResult |
| Create | Draft for review · مسودة للمراجعة | `DraftReview` (new) | 2 | — |
| Understand and control · افهم وتحكّم | What changed · ما الذي تغيّر | `ChangeSummary` (new) | 1 | InsightCards |
| Understand and control | Assistant controls · إعدادات المساعد | `AssistantControls` (new) | 2 | ContextMeter (detail view) |

Screens (compositions shown as full pages, not new library families):

| Screen | Where | Based on |
| --- | --- | --- |
| Assistant workspace · مساحة عمل المساعد | `/examples/chat-app` and the ChatApp page | `ChatApp` (existing) |
| Dashboard with AI · لوحة بمساعد | `/examples/dashboard` | the existing customer dashboard example |

Content blocks that leave the AI group for Display: CodeBlock, Markdown, Terminal, and LoadingState for its generic use. **(call: LoadingState moves too, because its job is generic loading feedback.)**

## 8. How a pattern works in code

- A pattern is an exported React component in `src/system/<Pattern>.tsx`, with its CSS under a `tz-<pattern-kebab>` class prefix in `components.css`, exported from `src/system/index.ts`.
- **State belongs to the host.** Each pattern takes a `status` prop plus data props, and emits intents (`onApprove`, `onStop`, `onSteer`…). It never advances its own lifecycle, except for UI affordances the host opted into (auto-start countdown, undo window), and those call back to the host.
- **Copy.** Every built-in string has Arabic and English defaults, chosen by direction the way existing AI families choose them (`useToolLabels.ts`), and every one can be overridden through a `labels` prop. Today `useToolLabels` offers no override; that changes (section 16a). Counts use one shared Arabic plural helper (section 15).
- **Placement.** Every pattern supports `appearance="card"` (default: tray plus paper) and `appearance="plain"` (no tray or outer surface; for embedding in a conversation or inside another pattern). Approval request uses `plain` inside Agent task. Parts that draw their own card today gain the same `appearance` prop (section 16a). TaskRows already has `appearance: "capsules" | "list"`; it gains `"plain"` as a third value, so one prop name means the same thing everywhere. **(call)**
- **Headings.** Patterns and the parts that render headings take `headingLevel` (2 to 6). Today AskUserQuestions, ApprovalCard and InsightCards hard-code `h3` and ToolCall hard-codes `h4`.
- **State names in code** reuse the words existing parts already use: `pending`, `running`, `completed`, `failed`, plus the new `needs-you` and `stopped`. Documentation says "done"; code says `completed`.
- **One live region per pattern** (`role="status"`, polite) that announces state transitions in one short sentence. It never announces per-word or per-second updates. Failures also render as persistent text next to the failed item.
- **Keyboard shortcuts are scoped and safe.**
  - They work only while focus is inside the pattern and no menu or dialog inside it is open.
  - There is no plain-Enter shortcut anywhere. Enter only activates the focused control, as browsers already do.
  - Key hints appear only on real shortcuts: Escape (reject, inside an approval) and Ctrl or Cmd+Enter (send a draft, steer now, start a plan, approve a request the host marks as reversible).
  - Irreversible approvals have no shortcut: they need a click, or Enter or Space on the focused button.
  - Shortcut handlers ignore key repeat (`event.repeat`), and ignore chords for 500 ms after the content they act on changes. ApprovalFlow moves focus to the next card after each decision, so a held or repeated key must never approve the next request unread.

## 9. Shared anatomy

Every pattern uses the same five zones (shown with numbered pins in the proposal):

1. **Header:** the AI mark, the task in plain words, and one status pill. The status pill is the single place where state is named.
2. **Paper:** what the assistant produced or proposes. Only the AI's output sits on paper.
3. **Evidence:** sources, steps and tool details, folded by default behind a disclosure ("كيف وصل إلى هذا؟", "التفاصيل").
4. **Decision:** the person's options on the tray, with the primary action last in reading order and keyboard hints inside the buttons.
5. **Meta:** time taken, sources used, operation count. Cost only when the host supplies it.

Rules:

- The tray is never nested inside another tray, and a card is never nested inside a card (today InsightCards renders a `Card` inside its own header block; the patterns must not repeat that). In `plain` appearance the pattern drops its tray and outer surface and lives on its host's paper. **(call)**
- At most one primary button per pattern at a time.
- Evidence never pushes the decision out of view. When evidence is long, it scrolls inside its own region (max height 18rem).

## 10. The six states

| State (`StatusPill` value) | Default Arabic label | English | Color role | Pill | Announcement (polite) | Motion |
| --- | --- | --- | --- | --- | --- | --- |
| idle (`idle`) | جاهز | Ready | neutral | neutral fill | none | none |
| working (`running`) | يعمل · يفكّر · يكتب · يُنسج (per pattern) | Working · Thinking · Writing · Weaving | AI thread | thread, with elapsed time | once, when work starts | star turns a quarter step on a loop; stitch line travels in reading direction; active label shimmers |
| needs you (`needs-you`) | بانتظارك | Needs you | attention (amber) | amber; pings once on entry | "{pattern title}: يحتاج قرارك" | one ping, then still |
| done (`completed`) | اكتمل / اكتملت (agrees with the subject) | Done | success | success | once | stitch closes into a solid line (200 ms) |
| failed (`failed`) | تعثّر / تعثّرت | Failed | danger | danger | once, plus persistent error text | none |
| stopped (`stopped`) | أُوقف / أُوقفت | Stopped | neutral outline | outline | once | none |

Today TaskRows (`TaskState`) and ToolCall (`ToolCallState`) know only `pending | running | completed | failed`, and the TaskRows demo fakes waiting with `pending` plus the summary "Awaiting your approval". Both unions gain `needs-you` (additive). TaskRows and the internal ToolStatus also draw different glyphs for the same four states; they converge on one shared glyph set, and ToolStatus is exported as `StatusIcon`. **(call: the export name)**

- **Gender agreement.** المهمة، الإجابة، الصورة، المسودة are feminine (اكتملت، تعثّرت، أُوقفت); الطلب، الملخص are masculine (اكتمل، تعثّر، أُوقف). Each pattern sets the right forms as defaults.
- **Amber is reserved** for "needs you" (and the system "warning" tone, which also means "your attention is needed"). AI work is never amber.
- **Elapsed time** formats as `١د ١٢ث` in Arabic and `1m 12s` in English, updates at most once per second, and is excluded from the live region.

## 11. New shared parts

All are exported, documented in the "Parts" group and in each pattern's anatomy.

| Part | Purpose | Key props | Accessibility |
| --- | --- | --- | --- |
| `AIMark` | The eight-point star that marks AI presence | `size: "xs" \| "sm" \| "md"` (glyph 10 / 13 / 16 px in an 18 / 24 / 30 px tile), `working?: boolean` | `aria-hidden` by default; `label` prop makes it an `img` |
| `StatusPill` | The single named state of a pattern | `state` (six states), `label?`, `elapsed?: number` (seconds) | Text is real text; the dot is decorative |
| `Thread` | The stitch line under a working label; solid when done | `state: "running" \| "completed"` | `aria-hidden` |
| `ThinkingPanel` | Evidence while thinking: label, elapsed, sources found so far, steps; collapses to one line | `status`, `elapsed`, `sources`, `steps`, `open` + `onOpenChange` | Disclosure button with `aria-expanded`; steps are a list with state text for each |
| `SourceChip` | A source with icon, title and optional meta | `source` (shared source type) | Link or button semantics depending on `href` / `onOpen` |
| `DecisionBar` | Decision buttons with key hints; primary last | `actions[]` with `tone`, `shortcut`, `loading` | Shortcuts listed in each button's accessible description |
| `Kbd` | A key hint, mirrored correctly in RTL | `keys` | `aria-hidden` inside buttons that already name the action |
| `Countdown` | Ring and label for auto-start or undo windows | `seconds`, `paused?`, `onComplete` | Announces once at start; pauses on hover and focus inside the owner pattern |
| `FeedbackBar` | Copy, regenerate, helpful, not helpful (with reasons) | `feedback` + `onFeedbackChange`, `onCopy`, `onRegenerate` | Toggle buttons use `aria-pressed` |
| `FollowUps` | Suggested next questions | `items`, `onSelect` | List of buttons |
| `InlineDiff` | Tracked changes with accept and reject per change | `segments`, `decisions` + `onDecisionsChange` | Each change is a group with its own accept and reject buttons; Y and N shortcuts when focus is inside |
| `WeaveCanvas` | Image reveal that weaves rows in from the inline-start edge | `src?`, `progress?`, `status`, `alt` | `role="img"` with `alt`; progress exposed by the owner's `progressbar` |
| `Tray` | Tray and paper composition from the Woven spec | `header?`, `footer?`, `paper?: boolean` | None of its own |

**Public or internal.** Public exports: AIMark, StatusPill, Tray, ThinkingPanel, FeedbackBar, FollowUps, InlineDiff, WeaveCanvas, Countdown, plus StatusIcon and ChatMessage (section 16a). Internal to the patterns: Thread, SourceChip, DecisionBar and Kbd. The `.tz-kbd` class stays usable in host CSS. **(call)**

New parts extend existing ones rather than duplicating them:

- `ThinkingPanel` is built on ThinkingState (its controlled `expanded` / `onExpandedChange` pair, hidden-and-inert closed panel and focus recovery) with ThinkingIndicator's label rules (a stable announced label; rotating words hidden from screen readers).
- `SourceChip` takes the existing `SourceReference` type and links through `sourceHref`.
- `StatusIcon` is today's internal ToolStatus, exported and shared by TaskRows, ToolCall and Agent task.
- Elapsed time reuses LoadingState's formatting (Arabic-Indic digits with "ث", never announced).
- `Countdown` and the step list use the existing `Tick` and `useChanged` motion rules: motion only after a value first changes.
- `useReducedMotion` (config OR the OS preference, subscribed to changes) is exported, and the examples stop re-implementing their own copies that ignore OS changes.

## 12. Wave 1 patterns

Each pattern lists its job, when to use it, anatomy, states, API, keyboard, copy and the scenario its demo shows. Arabic copy is the default; English follows the slash.

### 12.1 Start a task · ابدأ مهمة · `TaskStarter`

**Job.** Start any request from the page you are on, with the right records attached.

**Use it when** the user starts work with the assistant: a home screen, a side panel, the empty state of a page. **Use something else when** replying inside an ongoing conversation (the composer inside Assistant workspace) or for plain search with no assistant (Input).

**Anatomy.** Optional greeting (small line plus a 22 px question) → tray → paper with: attached-context chips (removable), auto-growing text area (1 to 6 lines, then scroll), tools row: attach, mention, flexible space, mode menu, voice (optional), send → tray footer: suggestions from the current page → optional list of recent tasks, each with a status pill and relative time.

**Mode menu.** One button shows a small ring (context used) and the current mode name. The menu holds the modes as radio items with descriptions (تلقائي، سريع، معمّق), a separator, and context usage (bar plus "السياق المستخدم ٣٢٪ · سجلّان مرفقان"). Hosts that need explicit models pass them as an extra radio section; this is where ModelSelector lives. The menu opens downward from the composer and its transform origin is the trigger.

**States.** empty (send disabled), composing, menu open, submitting (send shows progress; text area read-only), disabled (with a reason line).

**API sketch.**

```ts
type TaskStarterProps = {
  value: string; onValueChange(value: string): void;
  onSubmit(value: string, context: ContextItem[]): void | Promise<void>; // as PromptEntry: a rejected promise keeps the draft and shows the error
  context?: ContextItem[]; onRemoveContext?(id: string): void;
  onAttach?(): void; onVoice?(): void;
  mentionOptions?: { id: string; label: string; kind?: string; icon?: ReactNode }[]; onAddContext?(id: string): void;
  onMention?(query: string): void;                                        // used when mentionOptions is absent
  modes?: ModeOption[]; mode?: string; onModeChange?(id: string): void;
  models?: ModelOption[]; model?: string; onModelChange?(id: string): void; // the existing ModelOption type
  contextUsage?: ContextMeterProps;                                         // the existing ContextMeter data
  suggestions?: { id: string; label: string; prompt?: string }[]; onSuggestion?(id: string): void;
  recent?: { id: string; title: string; status: StatusPillState; time: ReactNode }[]; onOpenRecent?(id: string): void;
  greeting?: ReactNode; title?: ReactNode; disabled?: boolean; disabledReason?: ReactNode;
  labels?: Partial<TaskStarterLabels>; appearance?: "card" | "plain";
};
```

TaskStarter is built on PromptEntry, so it inherits PromptEntry's tested behaviors unchanged: Enter submits and Shift+Enter adds a line; input-method composition never submits (composition events, `isComposing`, keyCode 229); duplicate submissions are locked out; pressing Send keeps focus in the text area; a failed draft keeps its error only while the text still equals the failed draft; the send and stop buttons morph only after a change.

**Keyboard.** As above, plus: Escape closes the mode menu and returns focus to its trigger; arrow keys move within the menu; Backspace in an empty text area does not remove context chips. **(call)**

**Suggestions** stay visible while the user types (PromptBar hides them once typing starts) and are disabled while submitting.

**Mentions.** Typing "@" or pressing the @ button opens a record picker anchored to the tools row.

- It is anchored to the row, not to the caret: caret positions are unreliable to measure in right-to-left text areas, and Tiraz has no caret-anchoring primitive.
- The picker lists host-supplied `mentionOptions` (`{ id, label, kind?, icon? }`), filtered by the text typed after "@".
- It follows the combobox pattern: the text area keeps focus and owns `aria-activedescendant`; arrow keys move, Enter chooses, Escape closes.
- Choosing an option adds a context chip and removes the typed "@query".
- If the host supplies no `mentionOptions`, "@" calls `onMention(query)` and the host opens its own picker.

This keeps the placeholder's promise ("اكتب @ لإضافة سجل") without a caret-anchored widget. **(call)** API additions: `mentionOptions?: { id: string; label: string; kind?: string; icon?: ReactNode }[]`, `onAddContext?(id: string): void`, and `onMention?(query: string): void`, which replaces the earlier `onMention()`.

**Copy.** Subtitle ماذا نُنجز اليوم؟ / What should we get done today? · placeholder اطلب مهمة أو اسأل عن بياناتك… اكتب @ لإضافة سجل / Ask for a task or about your data… type @ to add a record · إرفاق ملف / Attach a file · إضافة سجل / Add a record · إملاء صوتي / Dictate · إرسال / Send · إزالة {name} / Remove {name} · الوضع / Mode · مقترحة من هذه الصفحة / Suggested for this page · مهام حديثة / Recent tasks · modes: تلقائي — يختار النموذج الأنسب لكل طلب / Auto — picks the right model for each request; سريع — للأسئلة القصيرة والردود الفورية / Fast — for short questions; معمّق — للتحليل والتقارير، أبطأ وأدق / Deep — for analysis and reports, slower and more careful.

**Demo.** Laila's finance home on 18 October: invoice INV-1043 and "تقرير أكتوبر" attached; suggestions لخّص أداء الأسبوع، من العملاء الأكثر تأخرًا في السداد؟، جهّز إقفال أكتوبر; recent tasks with one "بانتظارك", one "يعمل", one "اكتملت". Demo states: Empty · Writing · Choosing mode.

### 12.2 Cited answer · إجابة موثّقة · `CitedAnswer`

**Job.** Answer a question and show where each claim came from.

**Use it when** the answer draws on the user's data, documents or connected tools and people need to check sources before acting. **Use something else when** the reply is casual chat without sources (a ChatThread message), the question needs a chart (Ask your data), or the request is multi-step work (Agent task).

**Anatomy.** Question bubble (optional; in a conversation, ChatThread renders it) → tray → ThinkingPanel (header row: AI mark, label, elapsed time, chevron; body: "بحث في" with source chips arriving one by one, steps with the current one shimmering, the thread line) → paper: the answer (Markdown) with numbered citation chips; follow-up questions → tray footer: FeedbackBar and meta (sources · duration).

**States.**

| State | Shows | Announces |
| --- | --- | --- |
| thinking | Panel open, elapsed time, sources as they arrive, current step shimmering, Stop | يفكّر / Thinking |
| writing | Panel folded to "فكّر لمدة ٦ث"; words settle in whole with a short blur; Stop | يكتب الإجابة / Writing the answer |
| completed | Full answer, follow-ups, feedback, meta | اكتملت الإجابة / Answer complete |
| failed | Partial answer kept; inline error with Try again | تعذّر إكمال الإجابة / Couldn't finish the answer |
| stopped | Partial answer; "أُوقفت الإجابة"; Regenerate | أُوقفت الإجابة / Answer stopped |

**Citations.** Numbered chips in the thread color, in Arabic-Indic digits in Arabic (today Sources and InlineCitation show Latin digits in Arabic; that is fixed). Hover or focus opens the existing InlineCitation popover with source title, description and metadata; Enter or click opens the source. Links always pass through `sourceHref` (http, https, relative and fragment only). A citation and its row in the sources list share an id, so opening one can highlight the other. The popover renders inside the provider, stays within the viewport and closes on Escape.

**Markdown hook.** Markdown's component map is fixed today, so nothing can turn a `[1]` marker into a citation. Markdown and StreamingText (in its markdown mode) gain an additive `renderCitation(marker)` prop; markers are `[n]` where `n` matches a `SourceReference.number`. Inside Cited answer, links in the answer body also use `sourceHref` rather than Markdown's default policy (which allows `mailto:`). Markdown's default for other uses is unchanged. **(call)**

**Streaming.** The host passes growing `content`. The pattern reveals newly arrived words with a 300 ms blur-and-fade, reusing StreamingText's word spans (which keep text selections intact while text grows). Words are whole tokens split on whitespace, never letters. Reduced motion uses a fade only. The live region announces the state, never the text (StreamingText's existing rule).

**API sketch.**

```ts
type CitedAnswerProps = {
  status: "thinking" | "writing" | "completed" | "failed" | "stopped";
  question?: ReactNode;
  content: string;                     // Markdown with [n] citation markers
  sources: SourceReference[];          // the existing Sources type
  thinking?: { elapsed: number; searched: SourceReference[]; steps: { id: string; label: string; state: "pending" | "running" | "completed" }[] };
  thinkingOpen?: boolean; onThinkingOpenChange?(open: boolean): void;  // ThinkingState's controlled pair
  followUps?: { id: string; label: string }[]; onFollowUp?(id: string): void;
  feedback?: "up" | "down" | null; onFeedbackChange?(value: "up" | "down" | null, reason?: string): void;
  onCopy?(): void; onRegenerate?(): void; onStop?(): void; onRetry?(): void;
  duration?: number; error?: ReactNode; headingLevel?: 2 | 3 | 4 | 5 | 6;
  labels?: Partial<CitedAnswerLabels>; appearance?: "card" | "plain";
};
```

StreamingText gains `"stopped"` and `"failed"` states (today it knows only `streaming | completed`, and the chat examples fake "Response stopped" through `statusLabel`). ChatThread gains an exported single-message component (`ChatMessage`) with per-message status, error and retry, so Cited answer can sit inside a conversation as one message. **(call: the export name)**

**Copy.** يفكّر / Thinking · بحث في / Searched · يكتب الإجابة / Writing the answer · فكّر لمدة ٦ث / Thought for 6s · إيقاف / Stop · أسئلة تالية / Next questions · نسخ الإجابة / Copy answer · نُسخت / Copied · إعادة التوليد / Regenerate · إجابة مفيدة / Helpful · إجابة غير مفيدة / Not helpful · reasons: غير دقيقة / Not accurate, مصدر خاطئ / Wrong source, طويلة / Too long, قديمة / Out of date · meta: ٣ مصادر · ٦٫٢ث / 3 sources · 6.2s.

**Demo.** "لماذا انخفض التدفق النقدي في أكتوبر؟" with sources دفتر الحسابات · أكتوبر، فواتير العملاء، كشف البنك الأهلي، +٢ and the answer from the shared story (section 14). Demo states: Thinking · Writing · Done · Failed · Stopped.

### 12.3 Agent task · مهمة الوكيل · `AgentTask`

**Job.** Let an agent run a multi-step job while the person stays in control.

**Use it when** work has several steps, tool calls, possible approvals and runs long enough that people may steer it. **Use something else when** a single yes or no is needed (Approval request), many tasks need a glance (Decision inbox, or a table), or the request is a question (Cited answer).

**Anatomy.** Tray → paper: header (AI mark turning while running, title, "وكيل المالية · ٥ خطوات", status pill with elapsed time) → step list with a rail (dashed while incomplete, solid when done) → done summary with output chips → tray footer that changes with state.

**Step states.** planned (number in a solid ring), pending (number in a dashed ring), running (thread arc spinner; title shimmers; live duration), done (success disc with check; duration), needs you (attention disc with "!"; inline approval request below), failed (danger disc with ×; inline error with Reconnect / Skip), skipped (dashed ring; "تُخطّيت بطلبك"). Each icon has visually hidden state text.

**Details.** A finished step with tool calls shows "التفاصيل". It opens a quiet panel listing each call as a sentence, followed by the tool ID in mono and its duration (ToolCall in compact form). Tool IDs never lead a row.

**Steering.** While running, the tray footer holds a steering input. Enter applies the note at the next step; Ctrl or Cmd+Enter applies it now. Applied notes appear under the affected step: "↳ استثنِ فرع جدة · أُخذ به".

**Footer by state.**

| State | Footer |
| --- | --- |
| plan | Countdown "تبدأ تلقائيًا خلال ٥ث" (only when `autoStartAfter` is set; pauses on hover or focus inside the pattern), Edit plan, and Start now with a ⌘↵ hint |
| running | Steering input, hints, Stop |
| needs you | "متوقفة عند الخطوة ٤ حتى تقرّر" and the request's expiry text |
| failed | "توقفت عند الخطوة ٢" and elapsed time |
| done | "٣د ٤٠ث · ١٢ عملية" and the host's primary next action |

**API sketch.**

```ts
type AgentStep = {
  id: string; title: string; detail?: ReactNode;
  state: "planned" | "pending" | "running" | "completed" | "needs-you" | "failed" | "skipped";
  duration?: number;
  tools?: Pick<ToolCallProps, "label" | "tool" | "state" | "input" | "output" | "error" | "duration">[]; // rendered as ToolCall, appearance "plain"
  notes?: { id: string; text: string; applied: boolean }[];
  request?: ApprovalRequest;      // the existing type; shown inline as ApprovalCard (appearance "plain") when state is "needs-you"
  error?: { title: ReactNode; body?: ReactNode; actions?: ("retry" | "skip" | "reconnect")[] };
};
type AgentTaskProps = {
  title: ReactNode; agent?: ReactNode;
  status: "plan" | "running" | "needs-you" | "failed" | "stopped" | "completed";
  steps: AgentStep[]; elapsed?: number;
  outputs?: { id: string; label: ReactNode; icon?: ReactNode; onOpen?(): void }[];
  autoStartAfter?: number; onStart?(): void; onEditPlan?(): void;
  onSteer?(text: string, when: "next" | "now"): void; onStop?(): void;
  onDecision?: ApprovalCardProps["onDecision"];   // the existing (request, decision, { signal }) contract, unchanged
  onRetryStep?(id: string): void; onSkipStep?(id: string): void; onReconnect?(id: string): void;
  primaryAction?: { label: ReactNode; onSelect(): void };
  headingLevel?: 2 | 3 | 4 | 5 | 6; labels?: Partial<AgentTaskLabels>; appearance?: "card" | "plain";
};
```

The step list reuses TaskRows' disclosure behavior: closed panels are hidden and inert immediately, and collapsing returns focus to the trigger without stealing focus the user moved elsewhere. The inline approval keeps ApprovalCard's decision integrity unchanged: a decision counts only after the host's promise resolves; reset, replacement and unmount abort it; duplicates are blocked; a decision is bound to the exact request content through `approvalRequestKey` and never carries over to the next request.

**Keyboard.** Within the inline approval, Escape rejects (unless a menu is open). The approve button shows ⌘↵ only when the request is reversible and shows no hint when it is not (section 8). In the plan state, focus inside the pattern pauses the countdown, and Ctrl or Cmd+Enter starts the plan. The steering input owns Enter and Ctrl or Cmd+Enter.

**Copy.** خطة مقترحة / Proposed plan · يعمل · ١د ١٢ث / Running · 1m 12s · بانتظارك / Needs you · تعثّرت / Failed · أُوقفت / Stopped · اكتملت · ٣د ٤٠ث / Done · 3m 40s · تبدأ تلقائيًا خلال ٥ث / Starts on its own in 5s · تعديل الخطة / Edit plan · ابدأ الآن / Start now · وجّه الوكيل دون إيقافه، مثلًا: استثنِ فرع جدة / Steer the agent without stopping it, for example: leave out the Jeddah branch · مع الخطوة التالية / at the next step · الآن / now · إيقاف / Stop · أُخذ به / Picked up · التفاصيل / Details · إخفاء التفاصيل / Hide details · تُخطّيت بطلبك / Skipped at your request · اكتملت المهمة، وهذه النتائج: / Done. Here is what it produced:

**Demo.** "إقفال حسابات أكتوبر" with the five steps from the shared story. Demo states: Plan · Running · Needs you · Failed · Done. The Needs you state embeds Approval request (12.5) for the three payment reminders. Approving moves to Done; rejecting skips step 4 and finishes.

### 12.4 Clarifying questions · أسئلة قبل البدء · `AskUserQuestions`

**Job.** Ask the one to three things the agent cannot guess before it starts.

Keep every current behavior: progress strip, options with descriptions, "إجابة أخرى", keys 1 to 9 (including Arabic-Indic digits typed on an Arabic keyboard), back and next, deliberate submission.

Also keep: Ctrl or Cmd+Enter submits from a text answer; on submit, focus goes to the first unanswered question; moving between questions focuses the question heading; a polite status region, and on failure an alert that keeps the draft; the component resets itself when `questions` or `resetKey` change.

**Additions.** Woven surfaces; a header with the AI mark and the asking agent's name; `appearance="plain"` (today it always draws a card with an entrance animation and a 38rem width cap; the cap applies only in `card` appearance); `headingLevel` (today a fixed `h3`); `labels` for navigation, status, error and hint text (today hard-coded); an optional `onSkip` for questions the agent can do without; after submission an optional receipt that folds the questions into "إجاباتك" with each answer and an "تعديل الإجابات" link (`onEditAnswers`). States: asking, submitting, answered (receipt), failed.

**Demo.** Before the October close: "أي الفواتير أبدأ مطابقتها؟" (فواتير الموردين / فواتير العملاء / إجابة أخرى) and "هل أستثني فرع جدة؟".

### 12.5 Approval request · طلب موافقة · `ApprovalCard`, `ApprovalFlow`

**Job.** Show exactly what will happen, to whom, and what cannot be undone; then approve, edit or reject.

Keep every current behavior: independent approve and reject; per-action loading; the decided card folding into a one-line receipt; Escape rejects a pending card without closing an enclosing dialog and does nothing while a decision is being recorded; the decision integrity rules listed under Agent task; ApprovalFlow advancing only after the host accepts, invalidating old records when request content changes, and moving focus to the next card.

Fix: today "One-time decision", "Target" and the status sentences are hard-coded, and ApprovalFlow's announcement uses Latin digits in Arabic while its visible position uses Arabic-Indic digits. Both components gain `labels`, `headingLevel` (today `h3`) and `appearance="plain"`, and the announcement uses Arabic-Indic digits.

**Additions.**

- Impact list: a compact table of who or what is affected, with amounts.
- An irreversibility note in the attention color when the action cannot be undone.
- An expiry line ("ينتهي الطلب خلال ٢٣ ساعة") when the host supplies its text. The card runs no clock of its own.
- An optional third action, Edit or "عرض الرسائل", between reject and approve.
- `appearance="plain"` for use inside Agent task and Assistant workspace.

**Receipts record the decision, never the outcome.** `ai/composition.md` already says that one-time approval "reports a decision, never execution success" and that "UI cancellation cannot undo effects", and the registry says host acknowledgement "records a decision only". This spec keeps those rules:

- The receipts read: approved "تمت الموافقة · قبل دقيقة", rejected "رُفض الطلب", expired "انتهت مهلة الطلب".
- Whether the reminders were actually sent is shown by the host where the work happens; in Agent task, the step changes to "أُرسلت ٣ رسائل".
- ApprovalCard has no Undo.

**Expiry belongs to the host.** It passes `expired` when the request lapses. The card then shows the expired receipt, disables both actions and announces it.

**States.**

| State | Meaning |
| --- | --- |
| pending | Needs you |
| submitting | The chosen button loads; the other is disabled |
| approved, rejected | Receipts as above |
| expired | Set by the host |
| failed | As today: the host could not record the decision; Try again |

**API additions** (all optional; `request`, `onDecision`, `value` and `resetKey` are unchanged):

```ts
type ApprovalCardAdditions = {
  impact?: { id: string; label: ReactNode; value?: ReactNode; note?: ReactNode }[];
  irreversible?: boolean | ReactNode;       // true shows the default note; a node replaces it
  reversible?: boolean;                     // enables the Ctrl/Cmd+Enter approve shortcut (section 8)
  expiryLabel?: ReactNode; expired?: boolean;
  secondaryAction?: { label: ReactNode; onSelect(): void };
  headingLevel?: 2 | 3 | 4 | 5 | 6; labels?: Partial<ApprovalCardLabels>; appearance?: "card" | "plain";
};
```

The same rule applies to Clarifying questions: its receipt shows the answers the host accepted, never what the agent did with them.

**Copy.** رفض / Reject · أرسل الرسائل / Send the reminders · عرض الرسائل / View the messages · تُرسل من بريد التحصيل، ولا يمكن استرجاعها بعد الإرسال. / Sent from the collections mailbox. They can't be recalled once sent.

### 12.6 Suggested edits · تعديلات مقترحة · `SuggestedEdits`

**Job.** Improve selected text with tracked changes the person accepts or rejects.

**Use it when** the assistant rewrites part of a user's text (shorter, clearer, more formal, translate). **Use something else when** the assistant writes a new message for a record (Draft for review) or rewrites almost every word (show the new version beside the old one).

**Flow and states.**

1. **selecting:** the user selects text inside the host's scope; the SelectionActions toolbar appears with أقصر، أوضح، أكثر رسمية، ترجم إلى الإنجليزية.
2. **working:** the selection keeps a soft thread underline and the toolbar shows "يعيد الصياغة…" with the stitch line.
3. **reviewing:** a review card opens, anchored below the selection: a non-modal popover rendered inside the provider, like the citation popovers.
   - It shows the selected passage with tracked changes: deletions in the danger tint and struck through, insertions in the success tint.
   - Its header reads "اقتراح المساعد · اجعلها أقصر", with a counter "١ من ٣", previous and next, Reject all and Accept all.
   - A focused change shows a small bar: قبول (Y) and رفض (N).
   - **The host's content stays untouched until Apply.** The selection stays marked with a soft thread underline through the CSS Custom Highlight API (`::highlight(tz-suggestion)`) where the browser supports it; elsewhere it is not marked.
   - The diff works on the plain text of the selection. When the selection spans formatting (for example inside a Markdown message), the card says "يُطبَّق كنص عادي / Applied as plain text".
4. **applied:** `onApply(text, { start, end })` hands the accepted result to the host, which replaces the text itself. The card closes into a receipt "طُبّق تعديلان من ٣", with Undo only if the host passes `onUndo`.

**(call: the review card.)** The alternatives were swapping the host's content for the diff (plain text only, and the host loses control of its own rendering) or asking the host to draw the diff in place (heavy for every host). The proposal has no mockup of this pattern, so its first build gets a review screenshot before the rest of Wave 1 continues.

**API sketch.**

```ts
type SuggestedEditsProps = {
  children: ReactNode;                              // the text region, as SelectionActions wraps it today
  actions: { id: string; label: string; icon?: ReactNode }[];
  onAction(id: string, selection: { text: string; start: number; end: number }): void;
  status: "idle" | "rewriting" | "reviewing" | "applied";
  suggestion?: { title: ReactNode; segments: DiffSegment[] };   // DiffSegment: { id, kind: "same" | "insert" | "delete", text }
  decisions?: Record<string, "accepted" | "rejected">; onDecisionsChange?(next: Record<string, "accepted" | "rejected">): void;
  onApply?(text: string, selection: { start: number; end: number }): void; onUndo?(): void;
  onDismiss?(): void; labels?: Partial<SuggestedEditsLabels>;
};
```

SelectionActions today passes only the selected text to `onSelect` and excludes inputs, code and editable regions. It gains an additive second argument with `start` and `end` offsets relative to its scope's text content, so the host can anchor the suggestion. Suggested edits therefore works on read-only rendered text (a message, a report paragraph). Editable drafts use `InlineDiff` directly (Draft for review). Keep SelectionActions' keyboard contract: Alt+Enter moves to the toolbar, Escape dismisses it and restores focus, arrow keys are mirrored for RTL, and the selection is restored before an action runs.

### 12.7 Image generation · توليد صورة · `ImageGeneration`

**Job.** Make an image from a description and pick the version to use.

**Anatomy.** Tray → paper: prompt row (AI mark, prompt text, edit), option chips (ratio, style, count), the canvas with a size tag at the top inline-end corner and a progress tag at the bottom inline-start corner, variant thumbnails as a radio group, actions → tray footer: agent name, image count and duration.

**Weave.** `WeaveCanvas` paints faint warp threads, then reveals the image row by row from the inline-start edge (right in RTL) with a thread-colored shuttle at each row's front. Fresh rows carry a faint weft line that disappears when the row completes. With `progress`, the reveal follows it; without progress, the canvas shows warp threads and a travelling shuttle until `src` arrives, then completes the weave in at most 1.2 s. Reduced motion uses a 200 ms crossfade. This is the same loom as the Tiraz landing.

**States.** queued, weaving (with or without progress), done, failed (Try again). Variants and actions are inert and visibly quiet until done.

**API sketch.**

```ts
type ImageGenerationProps = {
  prompt: ReactNode; options?: { id: string; label: ReactNode }[];
  status: "queued" | "weaving" | "completed" | "failed" | "blocked"; progress?: number | null;   // 0..100 or null, as ImageResult today
  images: { id: string; src?: string; alt: string; width: number; height: number }[];
  selected?: string; onSelectedChange?(id: string): void;
  onUse?(id: string): void; onVariations?(id: string): void; onEditPrompt?(): void; onRetry?(): void;
  blockedReason?: ReactNode;    // "blocked" = the request was refused by policy; shows the reason and Edit with a description
  labels?: Partial<ImageGenerationLabels>; appearance?: "card" | "plain";
};
```

Keep ImageResult's tested behaviors: the image remounts when `src` or state changes so a stale load cannot win; Retry moves focus to the figure; the error view still shows the alt text. Today the "choose a direction" demo builds its grid from raw images and radio buttons; the variants become a real radio group with names (اختر نسخة, النسخة ١…).

**Copy.** يُنسج · ٤٢٪ / Weaving · 42% · جاهزة / Ready · في الانتظار / Queued · تعذّر توليد الصورة / Couldn't create the image · أعد المحاولة / Try again · استخدم الصورة / Use image · تنويعات مشابهة / Similar variations · تعديل بالوصف / Edit with a description · اختر نسخة / Choose a version · ٤ صور · ١٢ث / 4 images · 12s.

**Demo.** "غلاف لحملة رمضان لمتجر تمور: كثبان عند الغروب، هلال ونخيل، بألوان دافئة" with four procedurally drawn variants (no external images; the proposal's canvas drawing is the starting point).

### 12.8 What changed · ما الذي تغيّر · `ChangeSummary`

**Job.** Tell a manager what moved, why it moved, and what to do next.

**Anatomy.** Tray header: AI mark, title, the AI-made label "أعدّه المساعد" → paper: up to six rows (metric, trend badge, change sentence, sparkline) → "السبب الأرجح" with citations → actions (one primary next step, one secondary) → tray footer: "اعتمادًا على ٣ تقارير" and "حُدّث قبل ٥ د".

**Meaning, not direction.** Each row has `tone: "good" | "bad" | "neutral"` supplied by the host; arrows show direction and color shows meaning. More late invoices is red even though it rises. Sparklines keep time flowing left to right, like Tiraz charts (`reversed={false}`), with an emphasized endpoint.

**States.** updating (rows become skeleton lines with a soft thread shimmer; footer reads "يحدّث الملخص…"), ready, stale (neutral line "قد يكون الملخص قديمًا" with Refresh), failed.

**API sketch.**

```ts
type ChangeSummaryProps = {
  title?: ReactNode; status: "updating" | "ready" | "stale" | "failed";
  rows: { id: string; metric: string; change: ReactNode; direction: "up" | "down" | "flat"; tone: "good" | "bad" | "neutral"; series?: number[] }[];
  reason?: ReactNode; sources?: Source[]; basedOn?: ReactNode; updated?: ReactNode;
  actions?: { id: string; label: string; primary?: boolean; onSelect(): void }[];
  onRefresh?(): void; labels?: Partial<ChangeSummaryLabels>; appearance?: "card" | "plain";
};
```

## 13. Wave 2 patterns

These follow the same anatomy, states and rules. Their pages appear only once built.

### 13.1 Ask your data · اسأل بياناتك · `DataAnswer`

A question becomes a chart from the existing families, a two-sentence explanation, and "كيف حُسب هذا؟" (date range, filters, source tables, as a definition list). Actions: ثبّت في اللوحة / Pin to dashboard, افتح في جدول / Open in a table, and change chart type within the families that fit the data. States: thinking, done, failed, empty ("لا توجد بيانات لهذه الفترة").

### 13.2 Decision inbox · صندوق القرارات · `DecisionInbox`

Collects pending approvals and questions from all agents, most urgent first. Tabs with counts: الكل، بانتظارك، يعمل، اكتملت. Each row: agent, request title, one context line, and inline quick decisions; a row expands into the full Approval request or Clarifying questions inline. There is **no "approve all"**: `ai/composition.md` already forbids it, because every approval must be a decision about specific content. Resolved rows leave a one-line receipt for 5 s, then move to "اكتملت". Empty state: "لا شيء بانتظارك" with "سيظهر هنا كل طلب يحتاج قرارك."

### 13.3 Draft for review · مسودة للمراجعة · `DraftReview`

The record frames the draft on the tray (invoice number, customer, amount in figure type, overdue tag); the paper holds recipient and attachment chips, the body with an optional suggested edit (`InlineDiff`), a tone control (ودّي، مختصر، رسمي), Discard and Send ⌘↵. Waiting for review uses the "needs you" pill: "بانتظار مراجعتك". States: writing, ready for review, sending, sent, discarded.

Sending leaves a receipt. Undo appears in it only when the host holds the message for an undo window: it passes `undoWindow` in seconds, sends only after the window ends, and cancels if `onUndo` is called. Tiraz shows the countdown and never claims a sent message was recalled, in line with "UI cancellation cannot undo effects".

### 13.4 Assistant controls · إعدادات المساعد · `AssistantControls`

Three sections. **Permissions:** one row per action with a three-level control (اسأل دائمًا، إن كان حساسًا، تلقائي بالكامل) and risk tags (حساس، لا يمكن التراجع); irreversible actions are locked to "اسأل دائمًا" with a lock icon and explanation. **Memory:** a switch "استخدم الذاكرة", then remembered items grouped by category with source and date, and pause or delete per item. **Context and usage:** the ContextMeter detail view and, for hosts that expose models, ModelSelector.

Part changes needed first: ModelSelector gains `labels` (today "Unavailable" is hard-coded); ContextMeter gains configurable `thresholds` (today fixed at 0.8, 0.95 and over capacity) and an optional controlled `open` / `onOpenChange` for its popover; ToolChips gains label overrides.

## 13a. Screens

**Assistant workspace** (the ChatApp page and `/examples/chat-app`). The conversation mixes patterns as messages: Cited answer, Agent task, Approval request and Clarifying questions in `plain` appearance, with Start a task as the composer. ChatApp needs: a side-panel slot (for evidence, a draft or task details), header actions, grouped conversations with rename and delete, and a brand that defaults to nothing rather than the word "Tiraz". Its responsive Sheet sidebar under 640 px stays. The demo becomes the October close conversation instead of the developer build log.

**Dashboard with AI** (`/examples/dashboard`). The existing customer dashboard gains What changed at the top of the overview, Ask your data in a panel, and a Decision inbox button with a count in the header. Its Latin digits in Arabic mode (`Dashboard.tsx` formats with plain `"ar"`, which current ICU renders with Western digits) are fixed to `ar-u-nu-arab` like the components.

## 14. Shared demo story

One fixture module (`src/system/ai/examples/finance-story.ts`) feeds every pattern demo, with Arabic and English text. The numbers must agree everywhere:

| Fact | Value |
| --- | --- |
| Company and user | فريق المالية، ليلى (Laila) |
| Period | October 2026, week of 12–18 October |
| Net cash flow | down 18% from September |
| Cash available | ٦١٢ ألف ر.س |
| Revenue | ١٫٢٤ مليون ر.س, up 6.1% |
| Days sales outstanding | from 34 to 47 days |
| Overdue invoices | 12 invoices, ٤٨٬٣٠٠ ر.س |
| Three large customers | شركة مدار ١٥٬٦٠٠ ر.س (INV-1043 ٩٬٤٠٠ and INV-1046 ٦٬٢٠٠), مؤسسة الندى ١١٬٢٠٠ ر.س, الرواد للتجارة ٨٬٠٠٠ ر.س; together ٣٤٬٨٠٠ ر.س, 72% of the overdue total |
| Early supplier payment | النخبة للتغليف, ١٢٥٬٠٠٠ ر.س paid on 9 October, due 30 October, for a 2% discount |
| Forecast | cash back to about ٧٤٠ ألف ر.س by 15 November if the three customers pay |
| Close task steps | 217 supplier invoices matched with 3 differences · bank reconciliation for 3 Al Ahli accounts, 94 transactions · 4 accrual entries worth ٦٬٨٥٠ ر.س · payment reminders to the three customers · one-page close summary PDF for the CFO |
| Agents | وكيل المالية (Finance agent), وكيل التحصيل (Collections agent), مصمّم الحملات (Campaign designer) |
| Sources | دفتر الحسابات · أكتوبر، فواتير العملاء، كشف البنك الأهلي، تقرير أعمار الديون، توقعات التدفق النقدي |
| Draft | reminder to سارة العتيبي at شركة مدار for INV-1043, ٩٬٤٠٠ ر.س, due 6 October, 12 days late |

The proposal's mockups used slightly different amounts for illustration. The fixture above is authoritative.

## 15. Copy, numbers and agreement

- One shared helper formats counts with Arabic agreement, using all six `Intl.PluralRules("ar")` categories: zero (لا مصادر), one (مصدر واحد), two (مصدران), few, 3–10 (٣ مصادر), many, 11–99 (١١ مصدرًا), other, 100 and above (١٠٠ مصدر). Today's Sources count logic becomes that helper and gains the nouns these patterns need, each with its forms: سجل، مصدر، صورة، تعديل، رسالة، فاتورة، خطوة، عملية، ساعة، يوم، عميل. The helper also picks the noun's gender for agreeing words (اكتملت ٣ رسائل versus اكتمل طلبان). **(call: zero uses "لا" plus the plural.)**
- Durations: `٦ث`, `١د ١٢ث`, `٢٣ ساعة` in Arabic; `6s`, `1m 12s`, `23 hours` in English.
- Amounts: `٩٬٤٠٠ ر.س` in Arabic with the Arabic thousands separator; `SAR 9,400` in English. Figures use tabular numerals.
- No sign characters next to Arabic-Indic digits. Direction is shown by an arrow icon and meaning by color, which avoids bidi reordering of "−١٨٪".
- **Tabular figures work only for Western digits.** IBM Plex Sans Arabic's Arabic-Indic digits are proportional (١ is 263 units wide, ٣ is 630) and the font has no tabular feature, so `font-variant-numeric: tabular-nums` does nothing for them. So:
  - figure columns (impact lists, tables, What changed rows) are end-aligned;
  - anything that ticks (elapsed time, percentages, countdowns, the image progress tag) reserves a fixed inline size in `ch`, so it never changes width while it counts;
  - proportional digits are accepted everywhere else.
- Digits follow `SystemConfig.numerals` through `numberLocale(config)`, brought in from the numerals work (Amjed, 18 Oct). "Arabic-Indic digits" in this spec means that default for Arabic; Western digits appear when a host sets `numerals: "latn"`.
- Latin IDs (INV-1043, file names, tool IDs) are wrapped in `<bdi dir="ltr">`.

## 16. Today's 23 pages

| Page | Becomes | Main navigation | Export |
| --- | --- | --- | --- |
| ChatApp | Assistant workspace screen | Screens | kept |
| AskUserQuestions | Clarifying questions pattern | Delegate | kept, extended |
| ApprovalCard | Approval request pattern | Delegate | kept, extended |
| ApprovalFlow | Approval request, sequence variant: its own page titled "سلسلة موافقات / Approval sequence", listed right after Approval request | Delegate | kept, extended |
| SelectionActions | Part of Suggested edits | Parts | kept |
| ContextMeter | Part of Start a task, Assistant controls | Parts | kept |
| ModelSelector | Part of Start a task (mode menu) | Parts | kept |
| ImageResult | Part of Image generation | Parts | kept |
| Sources / InlineCitation | Part of Cited answer | Parts | kept |
| InsightCards | Superseded by What changed | Parts | kept |
| ChatThread | Part of Assistant workspace | Parts | kept |
| ChatComposer | Part of Start a task and Assistant workspace | Parts | kept |
| PromptBar | Superseded by Start a task | Parts | kept |
| LoadingState | Agent task (agent use); generic use | Display | kept |
| ThinkingIndicator | Part of Cited answer and Agent task | Parts | kept |
| ThinkingState | Basis of ThinkingPanel | Parts | kept |
| TaskRows | Basis of the Agent task step list | Parts | kept |
| ToolCall | Agent task step details | Parts | kept |
| ToolChips | Agent task collapsed summary | Parts | kept |
| Terminal | Content block | Display | kept |
| CodeBlock | Content block | Display | kept |
| Markdown | Content block; Cited answer body | Display | kept |
| StreamingText | Cited answer writing state | Parts | kept |

The fifteen pages in the Parts group are: SelectionActions, ContextMeter, ModelSelector, ImageResult, Sources / InlineCitation, InsightCards, ChatThread, ChatComposer, PromptBar, ThinkingIndicator, ThinkingState, TaskRows, ToolCall, ToolChips, StreamingText.

Every page keeps its catalog id. Removing a catalog entry would break the `Playgrounds` type, inspector fields, API rows and the registry order test, and a saved `active` page would fall back to Button. So pages move between groups but never leave the catalog (Workbench spec).

## 16a. Changes to existing parts

All changes are additive: new optional props, new union members, new exports. Nothing existing is renamed or removed.

| Part | Change | Why |
| --- | --- | --- |
| PromptEntry (internal) and ChatComposer, PromptBar | `tools` slots at the start and end of the entry surface; public `compact`; suggestions accept `{ id, label, prompt?, icon? }`; `appearance="plain"` drops the floating shadow | Start a task puts attach, mention, mode menu and voice inside the composer; today the surface has no slot and its shadow doubles up inside a card |
| ModelSelector | `labels` (today "Unavailable" is hard-coded) | Localized mode menu |
| ContextMeter | `thresholds`; optional controlled `open` / `onOpenChange` | Assistant controls and the mode menu |
| ChatThread | export `ChatMessage` with per-message `status`, `error`, `onRetry` | Cited answer inside a conversation |
| StreamingText | states `stopped` and `failed`; `renderCitation` in markdown mode | Cited answer |
| Markdown | `renderCitation(marker)`; optional strict link policy using `sourceHref` | Citations; safe links in AI answers |
| Sources / InlineCitation | controlled `expanded` / `onExpandedChange`; Arabic-Indic digits for counts and citation numbers in Arabic; a shared id between a citation and its list row | Cited answer; today's Latin digits in Arabic are a defect |
| ThinkingState | used by ThinkingPanel as-is | — |
| TaskRows | `appearance="plain"`; state `needs-you`; shared status glyphs; `headingLevel`; empty-state text through `labels` (today hard-coded) | Agent task step list |
| ToolCall | `appearance="plain"`; state `needs-you`; `labels` for state and section words; `headingLevel` (today `h4`) | Agent task details |
| ToolChips | `labels` | Agent task collapsed summary |
| ToolStatus (internal) | exported as `StatusIcon`; one glyph set shared with TaskRows | One status vocabulary |
| AskUserQuestions | `appearance`, `headingLevel`, `labels`, `onSkip`, answered receipt | Clarifying questions |
| ApprovalCard | `appearance`, `headingLevel`, `labels`, impact list, `expiresAt`, optional middle action | Approval request; inline use in Agent task |
| ApprovalFlow | `labels`; Arabic-Indic digits in its announcement | Approval sequence |
| SelectionActions | second `onSelect` argument with `start` / `end` offsets | Suggested edits |
| ImageResult | used inside ImageGeneration for the selected image | — |
| InsightCards | Arabic-Indic position digits in Arabic; no nested `Card` | Defects; the pattern itself moves to What changed |
| LoadingState | elapsed formatting shared with StatusPill | One time format |
| Terminal | localized state words and "exit N" in Arabic | Defect: English inside Arabic today |
| useToolLabels (internal) | accepts overrides | `labels` on every part |
| useReducedMotion (internal) | exported | Examples and hosts stop duplicating it |

New pattern pages need real catalog and registry entries: the registry test requires registry component ids to equal catalog ids in the same order, and each registry `api` to be a real export whose props match TypeScript. The new shared parts in section 11 are exported and recorded in the registry's `support` section. They are documented in the Anatomy section of the pattern pages that use them, not as separate navigation pages, so the Parts group lists only today's fifteen pages. **(call)**

### Behaviors to preserve exactly

1. Arabic plural agreement in source counts: مصدر واحد، مصدران، ٣ مصادر، ١١ مصدرًا (via `Intl.PluralRules("ar")`).
2. Digits through `numberLocale(config)`: `ar-u-nu-arab` by default in Arabic, `ar-u-nu-latn` when `numerals` is `"latn"`. Plain `"ar"` is never used, because current ICU (CLDR 48) formats it with Western digits.
3. Answer keys 1–9 accept ١–٩ and ۱–۹, are ignored in text fields and with modifier keys; Ctrl or Cmd+Enter submits a text answer.
4. Escape rejects a pending ApprovalCard without closing an enclosing dialog, and does nothing while a decision is being recorded.
5. `sourceHref`: only http, https, relative and fragment links; control characters, backslashes, `//`, other schemes and embedded credentials are rejected. Markdown skips raw HTML and loads images without a referrer.
6. Decision integrity: accept only after the host's promise resolves; abort on reset, replacement or unmount; block duplicates; restore focus after failure; bind decisions with `approvalRequestKey`; never carry an approval to the next request.
7. Entry: Enter versus Shift+Enter; input-method guards; duplicate-send lock; the failed draft stays until edited; Send keeps focus in the text area; send and stop morph only after a change.
8. Reading safety: auto-scroll only within 48 px of the bottom and never over a selection; `appendData` and word spans keep selections while text streams.
9. One announcement owner: stable labels; `announcement="off"` where a parent announces; elapsed time, rotating words and durations stay out of live regions.
10. Disclosures: closed panels become hidden and inert immediately; collapsing returns focus to the trigger without stealing focus the user moved elsewhere.
11. Smaller contracts: exact copy with the stale-promise guard; SelectionActions keys and selection restore; ImageResult remount and retry focus; ModelSelector ignoring same, disabled and unknown ids; motion only after a change; reduced motion from config or the OS; left-to-right islands (`dir="ltr"` code and logs, `<bdi>` for names and IDs, mirrored arrows).

### Tests to add before changing anything

Two behaviors in the list above have no test today: Arabic plural agreement in source counts (1) and Arabic-Indic answer keys (3). Add both tests first, so the refactor cannot regress them silently.

## 17. Agent-facing documentation

- `ai/registry.json`: each family gains `kind: "pattern" | "part" | "screen" | "content"`. Patterns list `parts`; parts list `usedBy`. Pattern entries name their states, required props and events.
- `ai/README.md`: a new first section, "Start with a pattern": a table mapping user jobs to patterns, then the parts.
- `ai/composition.md`: rules for patterns (host owns state, one live region, scoped shortcuts, inline appearance inside other patterns, amber reserved for needs you, AI styling only on AI output).
- Generated prompts and usage code for pattern pages include a minimal state machine in the host (a `useState` for `status` and the handlers) so a copied example runs as-is.

## 18. Accessibility

- Pattern root: a `section` (or `article` in a conversation) labelled by its title.
- Status text is real text in the pill. Step icons carry visually hidden state text (مكتملة، قيد التنفيذ، بانتظارك، تعثّرت، لم تبدأ، تُخطّيت).
- One polite live region per pattern for transitions. Failures render persistent text and are also announced once.
- Moving to "needs you" never moves focus; the pill pings once and the live region announces.
- Countdowns announce once and pause on hover or focus inside the pattern; their ticking number is excluded from announcements.
- Citations, chips and thumbnails are reachable by Tab, have names, and show a visible focus ring.
- Color is never the only signal: every state has an icon and a word.
- Contrast: text on thread-soft and attention-soft backgrounds meets 4.5:1 in both themes and with every accent preset.

## 19. Testing and verification

For each pattern:

- Unit tests (Vitest, Testing Library): every state renders its documented content; every callback fires with the documented arguments; keyboard paths (Enter, Escape, Y and N, 1 to 9 including Arabic-Indic digits, Ctrl or Cmd+Enter); live region text per transition; `labels` overrides; Arabic and English copy; axe with no violations.
- Generated usage code compiles in strict mode (existing generated-module checks).
- Browser checks (Playwright scripts in `tests/browser`): each demo state in Arabic RTL and English LTR, light and dark, compact and standard density, large typography, radius 0 and 16, reduced motion, 390 px width; screenshots saved as evidence under `docs/ai-patterns/`.
- A consumer exercise like the earlier AI instruction work: a fresh agent uses only `ai/README.md` and the registry to build a small "close the month" screen with Agent task and Approval request, to check the docs lead to patterns.

## 20. Build order

1. Woven foundations (separate spec).
2. Shared parts: AIMark, StatusPill, Thread, Tray, Kbd, Countdown, SourceChip, ThinkingPanel, FeedbackBar, FollowUps, DecisionBar.
3. Agent task and Approval request (inline appearance first, since Agent task needs it).
4. Cited answer.
5. Start a task.
6. Clarifying questions.
7. What changed.
8. Suggested edits (with InlineDiff).
9. Image generation (with WeaveCanvas).
10. Navigation switch: part pages leave the main navigation; Parts group appears (Workbench spec).
11. Screens: Assistant workspace and Dashboard with AI.
12. Wave 2, after Amjed reviews Wave 1.

Each step lands with its tests, its docs page and screenshots, and is reviewed before the next starts. Each pattern step ships its own catalog entry, registry entry, docs page (using the demo frame, states and notes infrastructure from the Workbench spec) and the part states it unlocks.

These steps slot into the one order shared by all three specs, written out in the [workbench docs spec, section 14a](2026-10-18-workbench-docs-design.md).

## 21. Left to the builder

- Internal file structure, private helper names and CSS class names within the `tz-` prefix.
- Exact pixel tuning inside the Woven tokens.
- Icon choices within Lucide.
- Test file organization.
- Whether a new part is implemented by extending an existing one, as long as the existing API stays compatible.
