# Plan 2 review: the Woven demo frame

**Range:** `9253f8e..ca1b1e6`, 14 commits. `e7bc7ef` (the Plan 3 document) is out of scope.
**Plan:** `docs/superpowers/plans/2026-10-19-woven-2-demo-frame.md` · **Spec:** `docs/superpowers/specs/2026-10-18-workbench-docs-design.md` §6–8, §11, §12.4, §12.8, §13 · **Ledger:** `.superpowers/sdd/2026-10-19-woven-2-demo-frame/progress.md`
**Reviewer:** Opus, 20 Oct 2026.

## Verdict: with fixes

Nothing is Critical. Two Important findings break the phase contract on pages people will use: SelectionActions and Toast. There is also one cheap Minor: a browser script that Plan 2's new resting date made stale. After one fix wave, the work is ready for Plan 3. Plan 3 is CSS work and does not touch these files.

## How the diff was covered

- **Source.** I read `git diff --stat` and every source file's diff in full:
  - `Workbench.tsx`, `PreviewFrame.tsx`, `Playground.tsx`, `demo-states.ts`, `demo-capabilities.ts`, `catalog.ts`, `model.ts`, `fields.ts`, `generate.ts` and `generate-batch.ts`;
  - all 17 example files, `DemoFrame.tsx`, and the `.tz-demo` block of `components.css`;
  - `tokens.css`, `css-audit.families.ts`, `src/tests/setup.ts`, `workbench.css`, both READMEs and `registry.json`.
- **Tests.** I read every changed test diff, the new test files and the 8 browser-script diffs.
- **`docs-notes.ts`.** I checked its structure and its test, and spot-checked the text. I did not review it line by line; Task 6's review and fix round covered that.
- **Images.** I opened the 40 required JPEGs, plus a few en-light and ar-dark captures.
- **Live checks.** These ran on the dev server, which serves this worktree (the source hashes match `HEAD`). I imported the real modules into the page to run the `stateOf` and `translateStates` checks.

## Gates

| Check | Result |
| --- | --- |
| `npm test` | **93 files, 1259 tests**, all pass (Plan 1 ended at 91 / 1176) |
| `npm run lint` | **0** (oxlint: 0 diagnostics across 336 files) |
| `tsc -b` | clean |
| `vite build` | passes; built to a scratch folder so `dist/` was untouched. The >500 kB chunk warning predates this plan |
| `prettier --check` | clean |
| CSS audit, `demo-frame` family | clean; it is in the suite's family loop (12 issues → 0) |

## Review Focus: each item has a passing test

| # | Item | Test |
| --- | --- | --- |
| 1 | A picked state survives an inspector edit | `demo-states.test.tsx:101` "follows the model when the inspector edits a prop" |
| 2 | Interrupting Replay leaves no timers | `demo-states.test.tsx:194` "cancels replay on state press, Code view, page change and unmount" |
| 3 | Copied code still autoplays | `demo-states.test.tsx:255` "runs as before without a phase" (ToolChips); `ai-content-pages.test.tsx:89–132` (StreamingText, unchanged) |
| 4 | Old saved props still load | `demo-states.test.tsx:1280` "loads saved props from before the states", and `:1249` for the second marker |
| 5 | The Replay word is inside its name (WCAG 2.5.3) | `demo-frames.test.tsx:469` "keeps the visible Replay word inside its name" |

## Strengths

- **Clean ownership.**
  - DemoFrame stays portable: it imports only from `src/system`, its strings are inline, and copied StreamingText code still imports it.
  - The workbench owns every state in one table, with one resolver: `stateOf` at `demo-states.ts:817–840`.
- **`stateOf` holds across all 48 families.** I ran a scripted check on the live modules in both languages:
  - every state's own props, after `normalizePlaygrounds`, read back as that state;
  - every phase reads as its state;
  - fresh defaults read the resting state on every page.

  The range predicates exclude one another as Task 2 asked, so Filled never shadows Disabled, Invalid or Read-only.
- **`translateStates` round-trips every text state, both ways (ar→en and en→ar).** This covers Input and Textarea (all five states), the Invalid messages of Select, Checkbox, RadioGroup, OTPInput, DatePicker, TagInput and FileDropzone, and Filled. The state stays pressed.
- **A small, correct Replay engine** (`Workbench.tsx:269–289`).
  - It uses one timer ref, and an `applyLatest` ref so a step never uses a stale language.
  - Each run starts with a fresh example.
  - It stops on a state press, the Code view, a page change, unmount, an inspector reset, or a visitor's own move (`onPhaseChange`).
  - Live traces of Terminal and ThinkingState showed the steps in order, no announcement until the end, one "الحالة: اكتمل" at the end, and focus kept on the pill.
- **Announcements are right.**
  - Keying the frame by page (`Workbench.tsx:548`) stops a page change from being announced.
  - `useChanged` stops the View pill sweeping on mount.
  - The status logic (`DemoFrame.tsx:81–94`) is tested for the first render, Replay steps, the end of a Replay, and a Copy message.
- **Careful migration.** `defaultsBeforeStates` and `defaultsBeforeRest` (`model.ts:1051–1085`) move old defaults to the resting state only once, without making Empty, Unchecked or First unreachable. Ruling P2-3 holds.
- **`restartOnEdit`** (`Workbench.tsx:168–175`, Ruling P2-4) stops a remount from inventing a decision or a toast. It covers exactly the pages where a remount would invent one; the other phase pages only re-create a held phase.
- **Layout.**
  - None of the 67 pages scrolls horizontally at 390 or 620 px, in either language. Spot checks at 320 px (5 pages) and 1024 px agree.
  - States groups scroll instead of wrapping: at 390 px, Input and Textarea in Arabic, and Button, Input, Checkbox, RadioGroup and Textarea in English.
  - The widest name pair (347 px, Sources) fits the bar at 620 and 1024 px.
- **Tests.** Every family has an `it.each` row.
  - Phase families and the Task 5 families check a visible marker on the stage.
  - Props families check the saved model and the pressed chip.

  Commits name every test they changed.

## Issues

### Critical

None.

### Important

**I1. SelectionActions never reports a change of selection, so the switcher lies on the resting page.**
- `AIContextExamples.tsx:76–84` makes the selection but never calls `onPhaseChange`. Its doc comment at `:68` says it "never fires".
- Live: the page opens on Selected, with the toolbar showing. One click anywhere on the page text collapses the selection and the toolbar goes, but «مختار» (Selected) stays pressed.
- The ledger records the reverse case too: a manual selection under Idle shows the toolbar while Idle stays pressed.
- This breaks the phase contract (plan, Task 2: "The example reports that through `onPhaseChange`"; spec §8: "so the switcher follows").
- Plan 4's Suggested edits starts from a "Selecting" state that SelectionActions drives (`docs/superpowers/specs/2026-10-18-ai-task-patterns-design.md:408`), so it will build on this.

**I2. Toast's Shown stays pressed after the toast has gone.**
- `Playground.tsx:218–249` raises the toast for Shown, but nothing reports the toast closing, whether it expires (5 s) or the visitor dismisses it.
- Live: 6.5 s after Shown was pressed, no toast was on screen and «ظاهر» was still pressed.
- Every Toast Replay ends this way: the pill announces Shown, and about 2.4 s later the toast leaves while the chip stays on Shown.
- The plan's phase contract says the example "never ends it by itself".

### Minor

| # | Finding | Where | Triage |
| --- | --- | --- | --- |
| m1 | `slider-otp-date.mjs` is stale. The date page now opens on 2026-11-15. DatePicker opens on the selected month (`DatePicker.tsx:255`), so February 2024 never appears and the "February 27 disabled" check fails. Browser scripts are not in the gate. | `tests/browser/slider-otp-date.mjs:360–378` | **must-fix (cheap)**; Plan 3 Task 2 exercises DatePicker |
| m2 | A language switch re-announces the current state in the new language. The frame is keyed by page, not by language, and the message is derived again from `heard.said`. Correct, but unrequested. | `DemoFrame.tsx:117–122` | backlog |
| m3 | InputCopy's Copied lasts 2 s (`InputCopy.tsx:89–93`) while the chip stays on Copied. A visitor's own Copy press is not reported either. It needs a result callback from the component. | `Playground.tsx:514–525` | backlog |
| m4 | DataTable: press Sorted, then change the preset in the inspector, and no chip is pressed. Loaded, Loading and Empty require `sort: "none"`. | `demo-states.ts:437–445` | backlog |
| m5 | Seeded props families do not follow the visitor: Steps Next, an Accordion close, a DatePicker pick, OTP typing, a TagInput add, a FileTree expand, marking a notification read, a FilterBar change. The chip keeps the state the example opened in. Task 5 chose seeding by design, and its comment says so. | `demo-states.ts:571–573` | backlog. Plan 4's pattern pages should use phases that report |
| m6 | Uncontrolled Textarea, Checkbox and RadioGroup: a chip changes the model but not the stage, because the remount is skipped. | `Workbench.tsx:213–217` | backlog |
| m7 | FileTree's Empty switch leaves Expanded pressed. | `demo-states.ts:679–686` | backlog |
| m8 | Sheet, Dropdown, Modal and Sidebar in uncontrolled mode leave no chip pressed. That is honest, since the model cannot know. | `demo-states.ts:226–232`, `:412–418` | backlog |
| m9 | The notes list depends on the host's reset. The workbench's Tailwind preflight (`workbench.css:1`) removes the bullets and leaves a 16 px indent with no marker; a portable host shows discs. | `components.css:5031–5038` | Plan 3 Task 8 |
| m10 | An "instead" link keeps the scroll offset, so the new page often opens with its heading off-screen. Sidebar navigation already does the same. | `Workbench.tsx:365–368` | Plan 3 Task 8 (fix both together) |
| m11 | Terminal's Replay sequence has no unit test. The engine is tested on 11 sequences, and Terminal was traced live. | `demo-states.ts:288–291` | backlog |
| m12 | Ask-user-questions shows a switcher with a single state («يسأل») until Answered and Failed land. | `demo-states.ts:562` | Plan 4 |
| m13 | Spec §13 deviations the plan accepted: evidence at 1280 px rather than 1440, under `docs/woven/after-demo-frame` rather than `docs/workbench-docs`, and no Replay screenshots. The names are 18/16 px rather than the spec's 20/17 px (the plan's nearest-step decision). | plan | no action |

## Must-fix list (one Sonnet wave)

1. **SelectionActions reports selection changes** (`src/system/ai/examples/AIContextExamples.tsx:63–84`).
   - With a phase, listen to `selectionchange`. Report `"selected"` when a non-collapsed selection sits inside the reply paragraph (`sample`), and `"idle"` otherwise.
   - Report only on a change, never echoing the phase it was given, as `usePhaseReport` does in `ChatExamples.tsx:53–66`.
   - Correct the "never fires" comment.
   - Test: on selection-actions, collapse the selection and Idle is pressed; select the sentence under Idle and Selected is pressed.
2. **Toast reports Hidden when its toast closes** (`src/workbench/Playground.tsx:218–249`).
   - In Shown, call `onPhaseChange("hidden")` once no toast is open, whether it expired or was dismissed. One way is to watch the provider's `.tz-toast[data-state="open"]`; there is no public close callback.
   - Shown stays pressed only while a toast is on screen.
   - Test with fake timers: press Shown, run past the duration, and Hidden is pressed.
3. **Start the date page empty before the min/max check** (`tests/browser/slider-otp-date.mjs:360–378`).
   - Press the Empty state («فارغ» / "Empty") first, or seed `defaultValue: ""`.

## Cross-task integration

| Check | How | Result |
| --- | --- | --- |
| `stateOf`, every family and kind | Script on the live modules: each state's props after normalization, each phase, fresh defaults, ar and en | All consistent |
| `stateOf` after inspector edits | Every boolean and select option from every props state | No chip pressed only where noted: m4, m8. ContextMeter zero/missing/invalid and DataTable no-results/error rightly press nothing |
| Mixed kinds: phase with props | Code (`phase ?? null`), and "lets phase and props states share a page" | OK |
| `restartOnEdit`, decisions and Toast | Code, tests (`ai-decisions-pages.test.tsx` flows, "never raises a toast from an inspector edit"), live approve flow | OK. A pending decision is cancelled on remount (`useHostLatency`), so a late `onPhaseChange` cannot land |
| `translateStates`, every text state | Script, ar→en and en→ar | All round-trip; the state stays pressed |
| Replay, each sequence | 11 sequences unit-tested; Terminal and ThinkingState traced live | Order, timing (800–2,600 ms), silence, one final announcement, focus, no timers. Under reduced motion it still steps (`feedback-photos-pages.test.tsx`). Toast's end state: I2 |
| Keyed frame and announcements | Tests, plus live: Loading → page change → back gives silence | OK; language switch: m2 |
| Notes "instead" links | Test, plus live | The page opens and focus moves to `main`; scroll: m10 |
| Copied code | `generate.ts` passes the whole model, so the new seeds travel; examples without a phase autoplay | OK |
| Stale text, §12.4 | `generate.ts:649–650`, `src/system/ai/README.md:681–694`, `registry.json:1985`, root README | Updated |

## Evidence comparison

Every pair shows the expected change:
- the frame bar: both names, the states group, the Replay pill where the page has a sequence, then View and Copy;
- a paper stage with warp lines, 380 px high on desktop and without a minimum on phones;
- the tray of notes in three columns, stacked at 390 px.

Pages without a sequence lost the old icon Replay, which used to reset the page. That was intended. The stage content changed only where spec §8 sets a new resting state.

| Page | `after-foundations/ar-light` → `after-demo-frame/ar-light` | `before/ar-light-390` → `after-demo-frame/ar-light-390` |
| --- | --- | --- |
| button | Five states, Idle pressed. At this 730 px frame the controls wrap to a second row, Replay first. Nothing else | Name, states and controls on three rows. Nothing else |
| input | Filled★ shows «شركة مدار للتقنية»; no Replay | Same; the states group scrolls by 10 px |
| checkbox | Checked★; no Replay | Same |
| sheet | Closed pressed; no Replay | States, View and Copy share one row |
| data-table | Loaded pressed; the table is unchanged | Arabic-Indic digits in "١–١٠ من ٢٦" come from Plan 1's numerals, already in `after-foundations` |
| terminal | One-row bar with Replay; stage unchanged (Done) | Same |
| tool-call | Done★ (the save completed, with output), where Failed + Retry used to be | The pending glyph changed from a clock to a dashed ring (Plan 1) |
| tool-chips | Done★ at rest; it used to be captured mid-run | **Other:** the chips wrap onto two rows. The row needs about 330 px and the stage gives about 316 px. The chips grew 14 px between `before` and `after-foundations` (Plan 1's status icons); Plan 2 did not narrow the stage. Plan 3 Task 6 |
| streaming-text | One frame (the page's own) with states and Replay; text complete at rest | Same |
| approval-card | Waiting pressed; no Replay | **Other:** the target label breaks mid-word («الهد / ف») and its value wraps. The card is the same width; Plan 1 widened the meta text (≈7 px at desktop, `before` vs `after-foundations`). Plan 3 Task 7 |

`docs/woven/after-demo-frame/errors.txt` is empty. Dark and English spot checks look right:
- the Replay pill inverts in dark;
- the English labels are mono, uppercase and tracked;
- the Arabic labels are not.

## Ledger triage

Each "minor (deferred" line, item by item.

| Ledger line | Item | Triage |
| --- | --- | --- |
| T1 (L32) | View thumb glides in from x=0 on mount | **Resolved** in `1985af7` (`useChanged`, `DemoFrame.tsx:333`). Plan 3 Task 8 changes the thumb to animate only `transform` |
| T1 (L34) | `.tz-demo-name` has no max size | Backlog. The widest name is 347 px against a 526 px or wider bar; check again when Plan 4 adds names |
| T1 (L34) | Selected View tab indistinguishable in forced colors | **Plan 3 Task 8**. Add a forced-colors rule like the state chips' (`components.css:4894–4901`); Task 9's `ar-light-forced` capture will show it |
| T3 (L53) | Uncontrolled Textarea, Checkbox and RadioGroup chips do not reach the stage | Backlog (m6) |
| T3 (L53) | Fixed values land on a neighbouring state after range edits | Backlog |
| T3 (L53) | ThinkingState Replay skips "Preparing summary" | Plan 4 |
| T4 (L62) | SelectionActions never reports selection changes | **Must-fix now** (I1) |
| T4 (L62) | Decisions survive edits to their request (`requestKey` rebuilt) | Plan 4 (decision lifecycle, Expired). In the workbench, Ruling P2-4 already covers edits |
| T4 (L62) | TaskRows Empty still shows Running or Done pressed | Plan 4 (TaskRows Needs you, Agent task) |
| T4 (L62) | Stop during a held Submitting leaves an empty reply bubble | Plan 4 (ChatComposer Failed and Stopped) |
| T4 (L62) | Clarifying questions keeps Asking after submit | Plan 4 (Answered) |
| T5 (L71) | DataTable after Sorted: Loading and Empty not pressed | Backlog (m4) |
| T5 (L71) | `slider-otp-date.mjs:358–372` stale | **Must-fix now** (m1, cheap) |
| T5 (L71) | Copied and Shown are momentary while the chip stays pressed | **Toast: must-fix now** (I2). InputCopy: backlog (m3) |
| T5 (L71) | InputCopy never reports the visitor's own Copy press; Copied and Failed do nothing while Disabled | Backlog; needs an InputCopy result callback |
| T5 (L71) | The Code view shows plain usage for Sorted, Copied and Failed | Backlog; copied code cannot carry a pressed state |
| T5 (L71) | FileTree Empty switch leaves Expanded pressed | Backlog (m7) |
| T5 (L71) | Arabic wording: «أُضيفت وسوم» for Tagged; the OTP message | Backlog (copy pass) |
| T6 (L78) | ~12 stiff phrasings, AR/EN drift, light description restatements, "use it when" from the developer's side, alternatives (tag-input, tooltip), area-chart palette count | Backlog (copy pass) |
| T6 (L78) | `tasks-notifications.mjs:151,251` and `feedback-photos.mjs:171` "still expect autoplay" | **No action.** Both run standalone fixtures (`tasks-notifications-fixture.html`, `feedback-photos-fixture.html`), where an example without a phase still autoplays, so the expectation is right |
| T6 (L80) | `ApiReference.tsx` imprecisions (Avatar initials, Progress digits) | Backlog (copy pass) |
| T6 (L82) | `src/system/ai/README.md`: "local provenance" is true for the English name only | Plan 3 Task 8, which already edits that README |

Every item carried between tasks was resolved, and I checked each in code:
- the matches order;
- Replay starting the example afresh and `onPhaseChange` stopping it;
- `resetPlayground` clearing the phase;
- the dead code;
- the stale autoplay text;
- the spec's «إعادة تشغيل» wording;
- the Modal `open` marker, followed by Steps `step`.

## Deferred, by destination

- **Plan 3.**
  - Task 8: the forced-colors View tab; explicit list styling for the notes (m9); returning to the top on page change, for the sidebar and the notes links (m10); the AI README provenance sentence.
  - Task 7: the approval card's mid-word break at 390 px.
  - Task 6: the ToolChips wrap at 390 px, if it is unwanted.
- **Plan 4.**
  - ThinkingState Replay steps; the decision lifecycle and Expired; TaskRows Empty and Needs you; ChatComposer Stop and Failed; Clarifying questions Answered (m12).
  - Pattern pages should use phases that report, rather than seeds (m5).
- **Backlog.** m2–m8, m11, and the copy pass.

## Declined to judge

- The Arabic and English quality of all 330 notes beyond spot checks. Task 6's review covered them, and what is left is listed for the copy pass.
- Real screen-reader output (VoiceOver, NVDA). I checked announcements only through the DOM live region.
- Forced-colors rendering, which I did not emulate. That rests on reading the CSS and on Task 1's re-review.
- Whether the browser scripts pass. I read them but did not run any (Playwright, and they write evidence files).
- Visual design taste, such as the two-row bar at 730 px or the end-aligned controls row. That is Plan 3's call.

## Browser state

The dev server's preferences were restored to what I found:
- `tiraz.documentation.v2`: Arabic, Switch page, both panels closed;
- `tiraz.system.v3`: compact, sage, radius 8, standard type, Arabic numerals;
- `tiraz.theme.v1`: light.

I then removed `tiraz.playgrounds.v2` and reloaded both open tabs. The saved props now equal the defaults, so every page opens on its resting state.
