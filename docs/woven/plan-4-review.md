# Plan 4 (Wave 1 AI task patterns): end-of-plan review

I reviewed this at d9862e4. The binding reference is the playground page layout spec of 21 Oct, which replaces the older pattern-page sections. Each task already had its own review, so this one looks across tasks: the Review Focus tests, the evidence, the live server and the consumer exercise.

- Line numbers refer to `git show d9862e4:<path>`.
- The browser was used only through fresh Playwright contexts, so the workbench preferences were never touched.
- Three topics are left out because they're handled elsewhere: the ThinkingPanel stopped and failed fix (Plan 5 Task 1), the settings panel (its own review) and the browser scripts the new layout breaks.

## Verdict

Ready after one small fix wave. There is nothing Critical and there are four Important items:

- one CSS line for phones;
- three edits to the agent docs, which the consumer exercise exposed.

The rest of the review came back clean:

- **Review Focus.** Every item has its test.
- **Visual evidence.** The patterns render as designed in Arabic and English, light and dark, at 390 px, in forced colours, at radius 0 and 16, in standard density and in large type. There's no regression from the restyle on the ten pages compared.
- **axe.** It finds one best-practice rule on the nine pattern pages, on a deliberate combobox, and nothing on the two screens.

## Must fix

1. **Important: on phones, the toolbar hides states, including the selected one.**
   - **Where:** `src/system/components.css:6982` (`.tz-demo-bar-end`).
   - **What is wrong:** the end group never wraps. At 390 px the state tray gets 195 px next to «تخصيص» and the new-tab link, and its scrollbar is hidden, so nothing shows that more states exist. Measured live:

     | Page | Hidden states |
     | --- | --- |
     | Approval request | «رُفض» and «انتهت المهلة» |
     | Agent task | «تعثّر», «اكتمل» and «أُوقف» |
     | Cited answer | «تعثّر» and «أُوقف» |
     | Suggested edits | «طُبّق», and «قيد المراجعة», its pressed resting state |

     These are the failure, expiry and stop states the patterns exist to show. Layout spec §3 says the toolbar wraps on narrow screens. Nothing is hidden at 768 or 1280 px.
   - **Fix:** add `flex-wrap: wrap; justify-content: flex-end;` to `.tz-demo-bar-end`. I injected this into the live page and checked the result:
     - at 390 px, every chip on all nine pattern pages is visible: the states sit on their own row and «تخصيص» and the link wrap under them at the end;
     - the page doesn't scroll sideways;
     - the bars at 768 and 1280 px measure the same as before.

     The squeeze began when «تخصيص» joined the end group. If the settings review already lists this, keep one copy.
   - **Image:** `docs/woven/after-patterns/ar-light-390/approval-card.jpg`, `agent-task.jpg` and `suggested-edits.jpg`.

2. **Important: README's "Start here" points agents at a file they can't open whole, and at the wrong example.**
   - **Where:** `src/system/ai/README.md:15-18` (step 2) and `:23-26` (step 4); `src/system/ai/registry.json:2516-2524`.
   - **What is wrong:**
     - **The registry is too big to read whole.** Plan 4 grew `registry.json` from 249 KB (at 085f6c5) to 362 KB. That is over the 256 KB whole-file limit of the consumer's file reader, which refused it. Neither the README nor composition.md names `records`, which holds `AgentStep`, `AgentTaskLabels` and `ApprovalCardLabels`. So the consumer concluded that shapes "live only in source" and that `labels` keys "cannot be discovered at all" (F4, F16).
     - **The approval records are missing.** The types a host builds for an approval, `ApprovalRequest` and `ApprovalRecord`, aren't in `records`. `approval-card.exports` also leaves out `ApprovalRecord`, although its `value` prop uses it.
     - **Step 4 sends every job to `usage.tsx`.** That example is Arabic-only and shows Tabs, a menu and a Toast, not a pattern (F21).
   - **Fix:**
     - **Step 2:** say the registry is about 360 KB and should be queried rather than read whole. Give two commands: `jq '.components[] | select(.id == "agent-task")' registry.json` and `jq '.records[] | select(.type == "AgentStep")' registry.json`. Say that `records` holds the record and `labels` shapes.
     - **Step 4:** "For a pattern's job, adapt that pattern's example, linked from its section below; otherwise adapt usage.tsx."
     - **Registry:** add `ApprovalRequest`, and `ApprovalRecord` (`requestId`, `requestKey`, `decision`), to `records`. Add `ApprovalRecord` to `approval-card.exports`.
   - **Image:** none, since this is documentation. See F4, F16 and F21 in `tests/ai-exercise/close-month/notes.md`.

3. **Important: switching language quietly reopens a decided approval, and the docs never say so.**
   - **Where:** `src/system/ai/README.md:1103-1106` (controlled `value`) and `:1126-1131` (changed content).
   - **What is wrong:**
     - **A translation counts as a content change.** `approvalRequestKey` covers the request's words. So after an ar/en switch, a controlled `value` no longer matches the card: it shows the pending proposal and its buttons again, and a decision in flight is aborted. The consumer confirmed this in a throwaway run (F1).
     - **Nothing covers a bilingual host.** Tiraz is built for switching between Arabic and English at runtime, yet no doc or example shows a bilingual host (F13).
     - **The record's fields aren't named.** Line 1104 names the key function but not the record's fields (F5).
   - **Fix:** after line 1106, add: "`approvalRequestKey` covers the request's words, so switching language is a content change. When only the language changed, keep the decision in host state by `requestId` and publish it again as `{ requestId, requestKey: approvalRequestKey(request), decision }` for the request as it is now worded. A decision that the switch aborted recorded nothing: ask again."
   - **Image:** none, since this is documentation. See F1, F5 and F13 in `notes.md`.

4. **Important: the Agent task example finishes the task inside the decision callback, with no comment.**
   - **Where:** `src/system/ai/examples/AgentTaskExamples.tsx:314-318`, with the step text at `:244-245`.
   - **What is wrong:**
     - **What the example does.** README.md:596 sends agents to this example first. Its `onDecision` records the decision, then calls `move("completed")`. The next render says «أُرسلت ٣ رسائل» / "3 reminders sent" for a step that was only approved.
     - **Why it misleads.** This is the demo jump that §12.3 asks for. Uncommented, it teaches an agent the opposite of `composition.md:12` and README.md:1137 and :1147: record only, and never label an approval completed. It was among the consumer's four costliest frictions (F2).
   - **Fix:** add this comment above line 314: `// Records the decision only. This demo then jumps to its Done phase; a real host sets the step running and shows «أُرسلت» only when its job reports the sends.`
   - **Image:** `docs/woven/after-patterns/states/ar-light/agent-task--state-5.jpg`, the Done state the jump lands on. See also F2 in `notes.md`.

## Backlog

- **axe: the only finding.** axe's only finding on the nine pages is `aria-allowed-role` (best practice, minor) on TaskStarter's textarea `role="combobox"` (`TaskStarter.tsx:637`), in all four of its states. The role is deliberate (`registry.json:1321` and `:1461`). Record it as an accepted exception to §19's "axe with no violations" rather than lose the combobox semantics.
- **Inline approval: no receipt.** An inline approval inside Agent task leaves no receipt. Once the host moves the step on, the card unmounts and nothing says "approved" until the step's outcome (F3). Design question for the Wave 1 review.
- **Inline approval: Escape skips the step for good.** Escape on an inline Agent task approval rejects it and skips the step for good, and `onDecision` doesn't say how the decision was made (F11). The spec asks for this behaviour; worth a look in the Wave 1 review.
- **Image generation: phantom selection.** Its weaving and failed states mark an empty first thumbnail as selected, and the failed meta still says «٤ صور». See `states/ar-light/image-generation--state-1.jpg` and `--state-3.jpg`.
- **Agent task example: a lost steering note.** `AgentTaskExamples.tsx:303` silently drops a "next" steering note when no step follows (F10).
- **README gaps from the exercise, one sentence each:**
  - `undefined` means uncontrolled (F6);
  - a skipped step shows the pattern's words, not `detail` (F7);
  - whether Stop or Retry spends a one-time approval (F8);
  - which buttons hide without their handlers (F9);
  - when a request counts as reversible (F12);
  - built-in words follow `direction` (F14);
  - "outcome" is used two ways (F18);
  - tools on failed steps (F19);
  - `Intl.PluralRules` for host copy (F20).
- **Refs: the docs disagree.** README.md:56-57 says refs forward through Button, but `registry.json:5242` says ButtonProps has no `ref` (F17).
- **No token list for hosts.** The consumer guessed `--text-heading` (F15).
- **Dashboard: Arabic agreement.** «١٨ عميل في الدليل» needs agreement («١٨ عميلًا»), at `Dashboard.tsx:687`. The copy predates Plan 4, but the screen is one Plan 4 rebuilt (`screens/dashboard-ar-light.jpg`).
- **Assistant workspace: short thread on phones.** At 390 px its thread gets 267 of the shell's 672 px once the side panel moves under it (`screens/chat-app-ar-light-390.jpg`).
- **Sources example: dev paths.** It shows dev asset paths such as `/src/system/ai/assets/results/menu-audit.txt?no-inline` as source locations (`ar-light/sources.jpg`). This predates Plan 4.
- **Exercise tsc command.** The command fails on TypeScript 6 with TS5112 unless `--ignoreConfig` is added (notes §4). Fix it in the plan before the next exercise.
- **Browser scripts.** The tests/browser scripts that the new page layout breaks are on the known refresh list.

## Evidence checked

- **Review Focus.** Each item has its test, found by grep at d9862e4:

  | # | Focus | Tests |
  | --- | --- | --- |
  | 1 | Keys | `ai-decisions.test.tsx:590` (its loop includes reversible plus irreversible) and `:667`; `pattern-parts.test.tsx:129`; `agent-task.test.tsx:215` |
  | 2 | Expiry | `ai-decisions.test.tsx:748` |
  | 3 | IME | `task-starter.test.tsx:136` and `agent-task.test.tsx:172`, the only new text entries with key handling |
  | 4 | Counts | `pattern-parts.test.tsx:22` (all plural categories, gender and Western digits); `agent-task.test.tsx:414`; `suggested-edits.test.tsx:174` |
  | 5 | Live regions | `pattern-parts.test.tsx:244`; `agent-task.test.tsx:259`; `cited-answer.test.tsx:74` |

  `src/workbench/pattern-pages.test.tsx` also checks that a pattern page's h2s are exactly the four the layout spec allows.
- **Before, after-restyle and after-patterns.** The ten listed pages in ar-light, side by side. Then after-patterns in en-dark for the nine pattern pages, and in ar-dark for seven parts and chat-app. What the captures show:
  - **The new layout:** the toolbar sits above the stage, the name strip and Replay bar are gone, and a round Replay sits at the stage's top end, which is left in RTL.
  - **Restyle changes:** step words follow Decision 8 («قيد التنفيذ»), and ThinkingState carries the AI mark (Woven §17.8).
  - **Durations:** they read correctly in RTL («٠٫٤ث», zoomed).
  - **Regressions:** none.
- **States.** All 63 ar-light state captures, checked for each state's content, receipts and errors. The en-dark set was only skimmed.
- **Conditions.** The nine pattern pages at 390 px, in forced colours, at r0 and r16, in standard density and in large type: 54 captures.
  - **Forced colours** keeps borders, Highlight chips and the diff's strike and underline.
  - **At 390 px** the only fault is item 1.
- **Full pages.** `full/ar-light` and `full/en-light`, for `agent-task` and `approval-card`. Section order matches the layout spec, the API reference is a table, and the prompt is English on the Arabic page.
- **Live** (http://127.0.0.1:5411, fresh contexts):
  - **axe-core** was loaded as `ai-decisions.mjs` loads it and run on `main` for the nine pattern pages in Arabic light, at rest and after each state chip. It found one issue, listed in the backlog.
  - **The two screens**, axe on the whole document: nothing found.
  - **Screens saved, not committed:** `docs/woven/after-patterns/screens/chat-app-ar-light.jpg`, `chat-app-ar-light-390.jpg`, `dashboard-ar-light.jpg` and `dashboard-ar-light-390.jpg`. Neither width scrolls sideways, and there were no page errors.
  - **The state tray** was measured at 390, 768 and 1280 px, with and without item 1's fix.
- **Consumer exercise.** I read `tests/ai-exercise/close-month/notes.md` in full and folded its frictions into items 2–4 and the backlog. Its checks passed: tsc (with `--ignoreConfig`), lint, and a throwaway run of ten scenarios.
