# Close the month: consumer exercise notes

`CloseMonth.tsx` is one screen built from `src/system/ai/` alone: `README.md`, `registry.json`, `composition.md` and the example files they link to.

An Agent task runs the October close in five steps. Two steps stop for an inline Approval request (post the accrual entries, send the payment reminders). When the task completes, a standalone Approval request asks to lock the period. The host, a reducer inside the file, owns the task status, the steps and their times, the steering notes and the decisions. The components report intents and the reducer records them. The screen is Arabic and RTL first, with a toggle to English and LTR. Nothing leaves memory, and the screen says so.

Line numbers below are for the files as they stood on branch `claude/woven` when I read them.

## 1. How the docs led me to the two patterns

- `README.md:28-45` ("Start with a pattern") maps a job to a pattern by name. "Let an agent run a multi-step job and stay in control" is Agent task, and "Approve, reject or edit one specific action" is Approval request. The brief used the same names, so nothing had to be inferred.
- `README.md:600` and `composition.md:14` settled how they combine: Agent task renders its own inline approval from a step's `request`, `approval` and `onDecision`, and you do not wrap an ApprovalCard around it. So the two gated steps use the inline approval, and the standalone ApprovalCard handles a separate decision (locking the period).
- `registry.json` confirms the link from both sides: `agent-task` (line 1653) lists `approval-card` in `parts`, and `approval-card` (line 2501) lists `agent-task` in `usedBy`. Both are `kind: "pattern"`.
- `composition.md:5-14` (the rules every pattern follows) and `README.md:1037-1155` (one-time decisions) gave the safety rules. The header comment of `CloseMonth.tsx` lists the ones the file follows.
- What let me write the code was the README prose (`594-600`, `1063-1140`) and the two compiling examples (`AgentTaskExamples.tsx`, `AIDecisionsExamples.tsx`). The registry gave props, defaults and states, but no type shapes (F4), so it could not have done it alone.

## 2. Guesses I had to make

Where an example or a render settled the guess, it says so.

1. **"The Approval request pattern" means both uses**: two inline approvals inside the Agent task, and one standalone `ApprovalCard`. The brief and the docs allow either reading.
2. **`ApprovalRecord` is `{ requestId, requestKey, decision }`.** From `AIDecisionsExamples.tsx:344-348`. `README.md:1104` names the key `approvalRequestKey`.
3. **A controlled card gets `null`, not `undefined`, while pending.** `undefined` means uncontrolled. Inferred from `AIDecisionsExamples.tsx:340-349`.
4. **`onDecision`'s third argument is `{ signal: AbortSignal }`.** The registry types it as `{signal}`.
5. **`AgentStep` sub-shapes**: `tools` is `{ label, tool, state }[]`, `notes` is `{ id, text, applied }[]`, and `error` is `{ title, body, actions }`. All from `AgentTaskExamples.tsx:165-283`. `README.md:596` names the fields only.
6. **`request` and `approval` are attached to a step only while it is `needs-you`.** The example attaches them always (`AgentTaskExamples.tsx:264-269`). The docs do not say what a decided step does with them.
7. **`accruals` is `reversible`; `reminders` and `lock` are `irreversible`.** The only guide was the example that marks accruals reversible (`AIDecisionsExamples.tsx:232-236`, `398`). See F12.
8. **Built-in words follow `direction`, not `lang`.** Stated only for TaskRows (`README.md:519-520`). The render confirmed it.
9. **The language toggle is a secondary `Button`** showing the other language's own name, with `lang` on its text. `direction` and `lang` change together, and `lang` sits on a wrapper above `SystemProvider` (`README.md:98-101`). No doc covers switching at runtime (F13).
10. **Stop returns the running step to `pending`.** If approved work was in flight, the approval is spent and a new decision is needed. Resume is a host-owned button because the pattern has none (F8).
11. **Retry after a failed approved action asks again.** The failed attempt spent the one-time approval (F8).
12. **A rejected inline request marks the step `skipped` and the run moves on.** The run then continues to the next step.
13. **A "next" steering note with no next step lands on the running step.** The example silently drops it (`AgentTaskExamples.tsx:303`).
14. **No `onEditPlan`, no `autoStartAfter`, no `expiryLabel`/`expired`, no `secondaryAction`, no `primaryAction`.** I have no plan editor. An expiry label with no enforced expiry would be a false claim, because the card runs no clock.
15. **Heading levels**: `h1` for the page and `headingLevel={2}` for both patterns, so their inner headings land on `h3` (`registry.json` agent-task `headingLevel` note).
16. **`elapsed` runs only while `running`.** Step durations are host-counted seconds. Both change once a second.
17. **`mayDecide` is a stand-in that is always true.** It marks where the server-side authority check goes (`README.md:1133-1138`). It proves nothing in a client-only demo.
18. **The lock outcome lives in a host-owned `role="status"` wrapper holding an `Alert`.** The wrapper mounts before its first message, because I assume (untested with a screen reader) that a live region inserted together with its text is not reliably announced.
19. **CSS tokens**: `--space-2/-4`, `--text-secondary/-meta/-subheading` and `--weight-semibold` come from `ChatAppExample.tsx:560-626`. `--text-heading` is a pure guess, written with a known fallback.
20. **`tokens.css`, `components.css` and the three Plex weights are imported in the screen file**, as `usage.tsx:17-21` does, although `README.md:64` says to load them once.
21. **Arabic plural forms are hard-coded** to the fixed demo data ("٤ قيود", "٣ تذكيرات", "حسابان"). No helper exists for host copy (F20).
22. **Arabic copy is mine**, written to match the register of the docs' own strings. A native reader has not reviewed it.

## 3. Friction

Each item names the file and line, what I needed, and what I did. The first four cost the most.

- **F1. A translation counts as "changed request content", and the docs never say so.** `README.md:1126-1131` ("Changing request content always creates a fresh card and aborts the old callback"), `composition.md:542-543` ("Changed request content invalidates old records and pending callbacks"), `README.md:1103-1104` ("stale records are ignored"), `registry.json:2538` (`value`).
  - A host of a bilingual library can switch language with a request open, and that re-words the request. I checked with a throwaway experiment. `approvalRequestKey` differs between the Arabic and the English wording. A controlled `value` bound to the other wording's key renders the pending proposal again (buttons back). A decision in flight when the language flips is aborted.
  - No example switches language with a request open.
  - I record decisions in language-neutral host state and re-publish the lock record with the key of the request as it is worded now. An abort means "record nothing".
  - The docs should say this, and show a bilingual host.
- **F2. The Agent task example blurs record and execute.**
  - `AgentTaskExamples.tsx:314-318` moves the task to `completed` in the same callback that acknowledges the decision. `:244-245` then prints "3 reminders sent" for a step that was only approved.
  - `composition.md:12`, `README.md:1099` and `README.md:1147` say a receipt is a decision and never an outcome. `README.md:1135-1136` says not to execute in the acknowledgement callback. `README.md:596` sends you to that example first.
  - It also commits without looking at `signal` again, which `composition.md:545-546` ("check it immediately before committing host state") and `README.md:1136-1137` ("Respect the signal before changing host state") ask for. The stand-in rejects on abort, so it is benign.
  - I split the work. `onDecision` validates, awaits, checks `signal`, then only records. An effect keyed on the recorded job runs the work and re-checks what the approval stood on.
- **F3. An inline decision has no visible receipt.** `README.md:600` says the inline approval "keeps ApprovalCard's rules", and `README.md:1095-1099` says a decided card condenses to a receipt.
  - Once the host moves the step out of `needs-you`, the card unmounts. In my render, nothing says "approved" anywhere in the Agent task after the acknowledgement. The step just reads Running.
  - AgentTask has no `value` for its inline card, so the host cannot keep the card mounted. Holding the step in `needs-you` would say "waiting on you" about a request already decided (`composition.md:11`; `README.md:518` for the same word in TaskRows).
  - The docs do not say where an inline decision should be visible, or whether it should be at all.
- **F4. Shapes live only in source, and the README links to sources.**
  - `README.md:15-19` says to inspect the named source and exported types. `README.md:1039`, `1063` and `1108` link `../AskUserQuestions.tsx`, `../ApprovalCard.tsx` and `../ApprovalFlow.tsx`. That is where the types are, and this exercise forbids opening them.
  - `registry.json:1722` types `steps` as `readonly AgentStep[]` and stops. Nothing in the registry gives `ApprovalRequest`, `ApprovalDetails`, `ApprovalRecord`, `AgentTaskLabels` or `ApprovalCardLabels`. The `labels` keys cannot be discovered at all.
  - `approval-card.exports` (`registry.json:2516-2524`) omits `ApprovalRecord`, although the `value` prop right below it (`:2538`) uses it. It is listed under `approval-flow.exports` (`:2644`) and in `publicExports` (`:1124`).
  - I got every shape from the examples, and from the first compile.
- **F5. The record's field name is wrong in the prose.** `README.md:1103-1104` says the record is bound to `approvalRequestKey(request)`. The field is `requestKey` (`AIDecisionsExamples.tsx:346`).
- **F6. `value={null}` versus `undefined`.** `README.md:1103-1106` and `registry.json:2538` say `ApprovalRecord | null` and that `null` shows the pending proposal. Neither says that `undefined` means uncontrolled. I inferred it from the example and from React convention, and did not test it.
- **F7. A skipped step shows the pattern's own words and ignores `detail`.** Nothing documents it (`README.md:596`, `registry.json:1722`). I wrote reject and skip details, saw "Skipped at your request" instead, and deleted them. That phrase is also what a rejected approval shows.
- **F8. Stop, Resume and Retry have no stated semantics.** `README.md:598` ("a failed or stopped task names the step and the time"; "the ways forward the host handles") and `README.md:1130-1131` ("Abort is cooperative: it cannot retract effects").
  - The docs do not say what state the interrupted step takes, how a stopped task restarts, or whether a retried step may reuse the old decision. `README.md:1138-1139` says approval is one-time, and `composition.md:12` says "no standing access".
  - Spending the approval on any failed or interrupted attempt is my reading. It should be stated.
- **F9. Absent handlers.** `registry.json:1743-1752` (`onStart`, `onEditPlan`) and `README.md:598` do not say what renders without them. `README.md:590` states "Each button appears only when its handler exists" for Cited answer only. In my render, no "Edit plan" appears without `onEditPlan`.
- **F10. Steering "next" with no next step.** `README.md:598` and the `onSteer` row of the registry do not say. The example drops the note without saying so (`AgentTaskExamples.tsx:303`).
- **F11. Escape is a recorded rejection, and the host cannot tell how a decision was made.** `README.md:1079-1081`, `composition.md:9`.
  - `onDecision(request, decision, { signal })` carries no input source, so a host cannot ask "are you sure?" for Escape. Rejecting a step is permanent: no Undo (`README.md:1097`).
  - I verified Escape on the reminders card yields "Skipped at your request". An accidental keypress costs a step.
- **F12. "Honestly" has no criterion.** `composition.md:536-538` and `README.md:1067-1069` say to mark `irreversible` and `reversible` honestly because they decide the shortcut. Only the examples decide it.
- **F13. Switching language at runtime is not covered.** `README.md:98-101` and `composition.md:34-39` explain `lang` and `direction` at mount. `usage.tsx:103-113` hardcodes Arabic. Nothing says what to do when the language changes (F1) or which control to use.
- **F14. What chooses the built-in words is stated only for TaskRows** (`README.md:519-520`). For Agent task and Approval request (`README.md:30`, `composition.md:7`) it says only "Arabic and English words".
- **F15. Tokens.** `composition.md:47` says "Inspect `tokens.css`" and `:31` names "title/heading/body/meta tokens". No token catalogue exists in the docs, and `README.md:231` names only `--action` and `--chart-plum`.
  - The usable names were incidental, in `ChatAppExample.tsx:560-626`. There is no page-title token I could confirm.
- **F16. The registry is too big to read and has no index.** `README.md:15` says to read it. It is 362,001 bytes, 10,275 lines, and the file reader refused it whole above 256 KB. I used `jq` and `grep -n`.
- **F17. Two statements about refs disagree.** `README.md:56-57` verifies "ref-as-prop forwarding through Button/Switch" on React 19. `registry.json:5242` says Button has "No ref prop in ButtonProps". I did not need a ref.
- **F18. The word "outcome" means two things.** `README.md:1096` says the receipt keeps "the outcome" (approved or rejected). `composition.md:12` says a receipt "records the decision, never the outcome" (what the work did).
- **F19. `tools` for steps that are not completed.** `README.md:596` says "a finished step's operations". It is unclear whether a failed step may list the failed operation. I supplied tools for completed steps only.
- **F20. Arabic counts in host copy.** `README.md:584` shows the library agreeing counts («سجلّان مرفقان»). Host copy gets no helper and no mention of `Intl.PluralRules`.
- **F21. `README.md:23` says to adapt `usage.tsx`.** For this job that example is the wrong starting point: it is Arabic-only and shows Tabs, a menu and Toast. `AgentTaskExamples.tsx` and `AIDecisionsExamples.tsx` (reached from `README.md:596` and `:1142`) are the ones that matter.

What worked well:
- `README.md:30` ("The host owns the state: pass the pattern's `status` and data, and handle the `on…` intents it reports") is the single most useful sentence.
- The shortcut rules are stated consistently in four places (`composition.md:9`, `README.md:598-600`, `README.md:1079-1091`, the `approval-card` accessibility note). The render matched them. Ctrl+Enter approved only the `reversible` request, and only after the 500 ms wait. Key hints showed only on real shortcuts. Escape rejected.
- The "host must validate request identity, authorization and execution independently" paragraph (`README.md:1133-1140`) told me exactly where each check goes.
- The examples' "Stands in for your server" comments made the host/pattern boundary clear.

## 4. Checks

- **tsc.** The command in the brief, as written, fails before it checks anything: `error TS5112: tsconfig.json is present but will not be loaded if files are specified on commandline. Use '--ignoreConfig' to skip this error.` The repo's TypeScript is 6.0.3, and the error appears from the repo root and from the exercise folder.
  - With `--ignoreConfig` added and every other flag unchanged, it exits 0 with no diagnostics.
  - It also exits 0 with `--noUnusedLocals --noUnusedParameters --verbatimModuleSyntax --erasableSyntaxOnly --noFallthroughCasesInSwitch --noUncheckedSideEffectImports`.
  - `--noImplicitReturns` fails inside `src/system/date-only.ts`, not this file.
- **Lint.** `npm run lint` (oxlint 1.87.0) exits 0 with no output. It is run on the file explicitly too, and `oxlint -D all` shows it does analyse the file.
- **Format.** `prettier --write` was run on `CloseMonth.tsx` only. `npm run format` does not cover `tests/`.
- **A throwaway run, not committed.** Ten scenarios under vitest and jsdom with fake timers, using a config kept outside the repo, then moved out of the repo. No server and no browser. All passed:
  - the happy path in English, through to "Period locked";
  - the failure path: retry asks again, skip moves on, and a failed lock asks again;
  - the reject path;
  - a language flip mid-decision records nothing;
  - a recorded lock decision survives a language flip;
  - the full Arabic run;
  - Stop mid-work spends the approval and Resume asks again;
  - a steering note;
  - Ctrl+Enter on the reversible request, never on the irreversible ones, and Escape rejecting;
  - unmount mid-job leaves zero timers.
- **Not verified**: pixels, RTL layout, focus order in a real browser, screen-reader speech, the unverified `--text-heading` token, and the Arabic copy.

## 5. Files I opened

Read with the file reader, `sed`, `grep` or `jq`:

1. `src/system/ai/README.md`, all 1,223 lines (two reads).
2. `src/system/ai/composition.md`, all 590 lines.
3. `src/system/ai/registry.json` (10,275 lines), through `jq` and `grep`: top-level keys, `conventions`, `configuration`, the `agent-task`, `approval-card`, `button`, `switch`, `badge` and `alert` components, the `system-provider`, `configuration` and `system-context` support entries, and a filtered `publicExports`.
4. `src/system/ai/examples/usage.tsx`, all.
5. `src/system/ai/examples/AgentTaskExamples.tsx`, all.
6. `src/system/ai/examples/AIDecisionsExamples.tsx`, all.
7. `src/system/ai/examples/finance-story.ts`, all.
8. `src/system/ai/examples/ChatAppExample.tsx`, lines 40-80 and 560-740, plus a `grep` for `AgentTask`, `onDecision`, `approvalRequestKey`, `ApprovalRecord` and `signal`.

Also a `grep` of `var(--` across files 4-6 and 8.

Names only (nothing opened):
- the listings of `src/system/ai/` and `src/system/ai/examples/`;
- `tests/` and `tests/ai-exercise/`, which holds earlier exercise files (`App.tsx`, `exercise-notes.md`, `index.html`, `main.tsx`, `prepare.mjs`, `styles.css`, `verify.mjs`) that I did not open;
- `node_modules/.bin`, `node_modules/@testing-library` and `node_modules/@fontsource`;
- the script names printed by `npm run`.

Not opened by me: any component source, `src/workbench`, plans, specs, the root README, and `package.json`, `tsconfig*` and the vite/vitest configs. `tsc`, `oxlint` and the throwaway vitest run loaded the library sources as tools. I did not read or print them.
