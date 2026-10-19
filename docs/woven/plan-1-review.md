# Plan 1 review: Woven foundations

**Reviewer:** Claude Opus 5.5, whole-plan review (Task 12) · 19 October 2026
**Range:** `20d7d81..ccd1efc` on `claude/woven` (17 commits)
**Verdict:** **With fixes.** There are no Critical or Important issues. Eight small fixes belong in the end-of-plan fix wave before Plan 2 starts. Five of them were already decided by Rulings 4, 8, 10, 11 and 17. Two correct text that later plans read: the spec notes Rulings 12 and 13 promised for the end of the plan, with the test comments that go with them, and one misleading comment in `tokens.css`. One is the missing half of the AI spec's §16a key test.

## How the diff was covered

- **Shape.** `git diff --stat` for the whole range: 131 files. Most of the 970 KB diff file is JPEG data, so the source was read through targeted `git diff 20d7d81..ccd1efc -- <path>` calls instead of paging through that file.
- **Read in full, or every changed hunk:**
  - `tokens.css`, `Provider.tsx`, `useInputModality.ts`, `config.ts` and `index.ts`;
  - `StatusIcon.tsx`, the deleted `ToolStatus.tsx`, `RemoveButton.tsx`, TagInput, FilterBar, FileDropzone, TaskRows, ToolCall and ToolChips;
  - Sources, AvatarGroup, InsightCards, ApprovalFlow, Charts and `chart-format.ts`;
  - all 281 changed lines of `components.css`;
  - all of `css-audit.ts` and `css-audit.families.ts`;
  - the workbench `model.ts`, `fields.ts`, `exhaustive.ts`, `catalog.ts`, `Playground.tsx`, `generate*.ts`, Appearance, storage and preferences;
  - README, `arabic-voice.md`, `composition.md`, the StatusIcon and defaults entries in `registry.json`, and `woven-evidence.mjs`.
- **Tests.** Every Review Focus test was read; the other new suites were read where they back a claim below.
- **Browser repairs (Task 1).** They are byte-identical to their source and were already approved, so they were only searched for renamed classes and for values this plan changes.
- **Other checks:**
  - every formatter in `src` was searched for a locale that bypasses `numberLocale`;
  - every Arabic template string was searched for a raw interpolated number;
  - the plan's lowest contrast pairs were recomputed by hand.
- **Evidence.** All 268 before and after pairs were measured by script (image size, and boxes around the changed regions). The ten families were then opened in ar-light and ar-dark, with zoomed crops of every changed region. Outlier pages and the English variants were opened too.
- **Live checks on the dev server (127.0.0.1:5411):**
  - the FilterBar remove hover;
  - modality with a real Tab key;
  - the «لا» key and Ctrl+C;
  - the ToolCall layout at 375 px;
  - computed radius, shadow and well tokens;
  - the Card radius.

## Gates (rerun at `ccd1efc`)

| Gate | Result |
| --- | --- |
| `npm test` | 91 files, 1173 tests, all passing (baseline 82 files, 806 tests) |
| `npm run lint` | 0 errors, 1 warning: the known `tests/browser/ai-decisions-fixture.tsx:33` react/only-export-components |
| `npm run build` | passes; only Vite's chunk-size notice, which predates this plan |
| `npm run format:check` | clean |
| Evidence | 603 before, 268 after; `errors.txt` empty in both. No remote font was requested: every capture run exited 0 (Task 11 report), and the script exits 1 on a remote font |

The working tree was clean after the run.

## Strengths

- **The token layer matches the spec, number for number.**
  - Radius tokens resolve live to 5, 8, 10, 15, 20 px at r = 8, as in spec §10.
  - Recomputed independently, the lowest pairs match the plan: light muted on the page under `--wash-strong` is 4.57:1, dark muted on `--ai-soft` 4.60:1, and `--border-field` on the light tray 3.02:1.
  - Dark `--surface-well` resolves on each provider root from the dark tray and paper, so one formula serves both themes.
- **The modality store is small and right.**
  - It holds one capture-phase listener pair, counted by subscription, and reads through `useSyncExternalStore` with a server snapshot.
  - The context value is memoized, so a modality change re-renders only the root.
  - Checked live: a real Tab flips both nested roots to keyboard; the interaction tokens drop to `0ms`; `--motion-word` keeps 34 ms; a `pointerdown` restores pointer.
- **The CSS audit is a real gate, not a lint suggestion.**
  - It has 11 checks, each self-tested.
  - A prefix that names no rule fails rather than auditing nothing, and every message carries its source line.
  - StatusIcon and RemoveButton pass it with no exemptions.
- **StatusIcon gives one vocabulary for three components.**
  - Digits go through `numberLocale`.
  - The check and cross draw only after a change, and the old mount-time pop and draw selectors are gone (defect 11 for these glyphs).
  - Filled discs keep a transparent border for forced colors.
  - The unnumbered pending ring reaches 3:1 (Ruling 18).
  - The `.tz-agent-task-indicator` hook survives for layout and the numerals test.
- **RemoveButton fixes defect 4 at its cause.** It is a plain button, so Button's 0,5,0 hover rule can no longer match it. Checked live on a FilterBar chip: hover turns its background to `--wash-strong` and its icon to `--text`.
- **The numerals merge is careful.**
  - Newer copy and plural agreement were kept.
  - The digits guard asserts that it scanned each source tree, so it cannot pass vacuously.
  - Every formatter in `src` reaches `numberLocale`, directly or through a variable.
- **The workbench fixes close the class of bug, not just the instance.**
  - A page's own select options decide what is valid on that page.
  - Dispatch narrows with `isOneOf` and ends in `assertNever`.
  - A partial saved object (`{"filter-bar": {"initialKind": "guide"}}`) loaded live with its valid value kept.
- **Commit discipline.** Every commit that touches an existing test names it and says why.

## Issues

### Critical

None.

### Important

None.

### Minor

1. **The «لا» key is ignored** (`src/system/useInputModality.ts:20`, Ruling 17). Checked live: a keydown with key «لا» leaves pointer modality, while «ل» switches to keyboard.
2. **The spec notes Rulings 12 and 13 promised are not made.**
   - Spec §15's budget sentence still reads "between 90 and 240 ms", although its own table gives sheets 280 / 200 ms (`docs/superpowers/specs/2026-10-18-woven-visual-language-design.md:303`).
   - Spec §8.2 still says the code literal sits 0.20 from `--ai` in OKLab. That holds in light (0.203); dark is 0.125 (`:184`).
   - `src/system/tokens.test.ts:672–674` and `:699–704` still describe both as "until the spec settles" (`overBudgetInSpec`).
   - Plans 2–4 are written from these specs.
3. **AI spec §16a's second test is only partly there.**
   - Behavior 3 includes "Ctrl or Cmd+Enter submits a text answer" (`src/system/AskUserQuestions.tsx:218–225`).
   - No unit or browser test presses it. Searching the tests for Ctrl or Meta with Enter, and for `requestSubmit`, finds nothing.
   - The digit-key half is covered by `numerals.test.tsx` and `ai-decisions.test.tsx`.
   - Plan 4 refactors AskUserQuestions, and §16a asks for this test before that.
4. **A token comment contradicts the spec** (`src/system/tokens.css:150–151`). It says presses "release on a small overshoot". The new `--motion-release` is for an ease-out release; spec §12 says "never the spring". Plan 3 moves every press onto this token.
5. **Mono log text overflows narrow boxes.**
   - It grew with `--text-meta` (12 → 12.5 px): `.tz-terminal pre` (`src/system/components.css:6362`) and `.tz-code-block pre` (`:4514`).
   - In the chat-app example, the build log now cuts « kB» off the end of three lines.
   - The text scrolls, so nothing is lost, but it reads as truncated.
   - Plan 3's CodeBlock/Terminal row (AI parts at CSS level) should choose the code text size.
6. **Only the exact tag "ar" follows `numerals`** (`src/system/config.ts:45`).
   - Charts and ContextMeter accept any `locale` string. «ar-AE» gives Western digits under `numerals: "arab"`, and «ar-SA» gives Arabic-Indic digits under `"latn"` (checked against the installed ICU).
   - ContextMeter's comment and the registry entry for `numberLocale` say other tags are used as given, but README:125 says every component number and date formatter follows `numerals`.
   - Either normalize Arabic tags, or say in the README that only «ar» follows the setting.
7. **Modifier chords count as keyboard input** (`src/system/useInputModality.ts:40–42`). A letter key held with Ctrl, Cmd or Alt switches modality; Ctrl+C was checked live. A mouse user who copies or undoes sees instant hovers until their next click. The effect is small.
8. **Some system-driven motion borrows interaction tokens.** The keyboard rule zeroes it too, although none of it is a keyboard action.
   - ThinkingIndicator's rotating word enters over `--motion-enter` (`src/system/components.css:4005`). Under keyboard modality, which is usual right after a prompt is sent with Enter, each word now swaps with no entrance.
   - The newest chat message rises over `calc(var(--motion-enter) + 80ms)` (`:4875`), so it drops to 80 ms.
   - The global constraint keeps decorative loops out of keyboard zeroing.
   - Plan 3's AI-parts step should give this motion a token the keyboard rule leaves alone. It should also decide whether an assistant-driven StatusIcon draw counts as "check drawing".
9. **README is stale on the meta size.** `README.md:125` still says "12px metadata". The docs rewrite (spec defect 32) covers it.

The four test and script cleanups from Rulings 4, 8, 10 and 11 are not defects in shipped code. They are in the must-fix list below.

## Review Focus: each item and its test

| # | Behavior | Test (all passing) | Extra check |
| --- | --- | --- | --- |
| 1 | Legacy `tiraz.playgrounds.v2` keeps valid per-page values; invalid ones fall back to that page's default | `model.test.ts` › restores a legacy saved object without losing valid per-page values, plus the every-option round trip | Live: a partial saved filter-bar object kept `initialKind: "guide"` |
| 2 | A keyboard user who clicks gets pointer motion back; lone modifiers never switch | `modality.test.tsx` › switches between keyboard and pointer; ignores modifier and other non-navigation keys | Live: real Tab → keyboard; pointerdown → pointer |
| 3 | Nested providers share one value and one listener; no consumer re-render | `modality.test.tsx` › shares one document listener across nested providers; does not re-render system consumers when modality changes | Live: both roots flip together |
| 4 | Removing a filter keeps focus in the bar | `remove-button.test.tsx` › moves focus to the next remove button after a removal | Query now targets `.tz-filter-active .tz-remove-button` |
| 5 | `numerals: "latn"` gives Western digits everywhere, source count included | `numerals.test.tsx` (both settings across components), `ai-results.test.tsx` › agrees Arabic source counts with their noun, `digits.test.ts` › formats Arabic digits only through numberLocale | — |

## Spec coverage

| Spec item | Status |
| --- | --- |
| Woven §7: font stack, type scale and leading tokens, large set | Done, and pinned by `tokens.test.ts` |
| §7.3: text tiers (defect 23) | Done; contrast lows recomputed |
| §8.2: fixed AI and attention colors, soft fills, OKLab ≥ 0.08, rose code literal | Done. The spec text for the dark literal distance is not corrected yet (Minor 2) |
| §9: tray, well, paper and chip shadows, `--shadow-surface` alias | Done |
| §10: radius scale | Done; resolved live |
| §11: size tokens | Done |
| §12: state tokens (`--press-scale`, `--disabled-opacity`, `--border-field`) | Tokens done. The rules that use them are Plan 3 |
| §13: status vocabulary | Glyphs and colors done in StatusIcon. The words are Plan 4 |
| §15: motion tokens, reduced motion, keyboard modality | Tokens and Provider done. Components reach them in Plan 3 |
| §16: status glyphs from one component | Done |
| §18 defect 4 | Done: structural fix, unit test and audit, verified live. The committed browser check comes with Plan 3's FilterBar work |
| §18 defect 11, in part | Done for StatusIcon. Decision icons, steps and button glyphs still draw on mount (Plans 3–4) |
| §18 defect 15 | Done, except Terminal «exit N» (Plan 3, as the plan says) and AvatarGroup's forced LTR (Plan 3, spec §17.5) |
| §18 defect 29, in part | Glyphs and the completed and failed colors agree. The running badge stays info until Badge gains the AI tone (Plan 3) |
| §19: Provider and config | Done: `numerals` only, plus `data-numerals` and `data-modality` |
| §20: contrast script; no remote font | Done |
| §21 step 1 | Done |
| Docs §12.1: per-component validation and round-trip test | Done |
| Docs §12.2: exhaustive dispatch | Done at the top level. One level down, `generate-batch.ts` and `generate-charts.ts` still fall back silently (deferred to Plan 2) |
| AI §16a: two tests | Plural agreement done. Answer keys done, except Ctrl/Cmd+Enter (Minor 3) |

## Cross-task integration

- **numberLocale and StatusIcon.** The pending number is formatted with `numberLocale(config)`. TaskRows now passes a number instead of a preformatted string. `numerals.test.tsx` reads `.tz-agent-task-indicator` under both settings.
- **The audit and the new CSS.**
  - Both families pass all eleven checks.
  - No rule outside their sections paints them. The one outside setter is `.tz-tool-chip { --status-size: 18px }`, which the defect-29 guard allows.
  - No old `.tz-tag-remove`, `.tz-tool-status` or `--tool-lead` reference is left in `src` or `tests`.
- **The modality rule and the tokens.**
  - The keyboard rule zeroes exactly the interaction tokens and sets `--press-scale: 1`. RemoveButton picks that up live.
  - `.tz-button` keeps its own 0.97 under keyboard, or 0.94 when icon-only (measured live), because `components.css:28`, `:73` and `:4971` redeclare `--press-scale` locally. This is the known Plan 3 must-do, and audit check 11 will flag those lines when Button joins the audit.
  - A free win: `.tz-tag[data-fresh]` pops over `--motion-state`, so a tag added with Enter already appears without the pop, as §17.1 asks.
- **Provider attributes.** `data-numerals` and `data-modality` sit on every root, including nested ones. `.tiraz-system[dir="rtl"][data-numerals="arab"]` drives the answer-key digits for each provider separately.
- **Token changes already reach existing components.** These were not in the plan's side-effect list, but none breaks anything. Plan 3 maps the corners onto the scale.
  - Every `--radius-panel` user goes from 12 to 15 px: menus, toasts, modals, the DatePicker popup, the TaskRows list, the ImageResult frame, the Sources list, the citation popup and ChatApp.
  - Corners derived from it move too:
    - TaskRows capsules and decision cards (`+4px`): 16 → 19;
    - user bubble (`+8px`): 20 → 23;
    - composer (`+6px`): 18 → 21;
    - SelectionActions (`+10px`): 22 → 25.
  - The motion changes shorten existing animations:
    - popover enter 220 → 180 ms and exit 150 → 120 ms;
    - sheets and toasts 420 → 280 ms;
    - Modal and decision-card entrances by 40 ms each.

## Evidence comparison (ar-light and ar-dark)

**Common to every page.** The frame's Preview/Code switch is set in `--text-meta`, so its labels grew from 12 to 12.5 px. That accounts for the identical change box at the top of every capture.

| Family | What changed | Verdict |
| --- | --- | --- |
| Button | Nothing besides the frame header | Expected |
| Input | Placeholder one step darker in light and lighter in dark (muted tier) | Expected |
| Select | Same as Input. The trigger is closed, so the popup's 15 px corner is not in the capture | Expected; evidence gap |
| Tabs | Inactive labels slightly darker in light (secondary tier); dark unchanged | Expected |
| Card | Edge changes from a 0.5 px ring to the paper shadow (1 px ring and a soft drop); description darker in light. The radius stays 12 px, measured live, because Card uses `calc(var(--radius) + 4px)`, not `--radius-panel`. The rounder look in crops comes from the shadow | Expected |
| Toast | Frame header only. The toast is not open in a resting capture | Expected; evidence gap |
| DataTable | Badge text 12 → 12.5 px; paper shadow; footer «1–10 من 26 عميل» → «١–١٠ من ٢٦ عميل», in the correct right-to-left order (zoomed) | Expected |
| TaskRows | StatusIcon: completed is a success disc (was the accent; with sage the two look almost the same); running is the AI arc; the numbered pending ring has weight 600. Capsule corners 16 → 19 px; paper shadow; each row 1 px taller (badge text); the running badge stays info blue | Expected |
| ToolCall | Discs 18 → 22 px; AI arc; success check; the pending Clock3 becomes an empty dashed ring at `--border-field`; list 20 px wider because the mono input line grew; paper shadow. At 375 px (live) it wraps exactly as the before-390 capture | Expected |
| AskUserQuestions | Paper shadow; frame corners 16 → 19 px; meta lines at 12.5 px; key badges still Arabic-Indic | Expected |

**Other pages scanned.** The pages with the largest changes, plus en-light and en-dark, were also checked:

- **chat-app:** the Terminal log clips « kB» (Minor 5).
- **code-block:** keywords go from indigo to rose (`--code-literal`), as expected.
- **sources:** citation numbers go from 1, 2 to ١, ٢, as expected.
- **tool-chips:** the pending clock becomes a dashed ring; chips are 1 px taller from their text, not from the 18 px disc.
- **English pages:** they show the same changes and keep Western digits.

Animated regions were not compared.

## Triage of the deferred minors

| Ledger item | Decision | Reason |
| --- | --- | --- |
| T0: a crash mid-run skips the errors and failures flush (`woven-evidence.mjs:169…220`) | Later: backlog | Evidence tool; a crash shows in the run output |
| T0: `errors.txt` cleaned before capture (`:120–131`) | Later: backlog | Loses only old lines for a variant being recaptured |
| T0: no guard for an empty id list (`:116–118`) | Later: backlog | The run prints «0 screenshots», which the runner sees |
| T0: a boot-page crash aborts the remaining variants (`:170–183`) | Later: backlog | As above |
| T1: lint warning in `ai-decisions-fixture.tsx:33` | **Must-fix now** | Ruling 4; lint ends warning-free |
| T1: the accent assertion in `customization.mjs:180/234` compares a provider with itself | Later: Plan 3 | Plan 3 updates the browser scripts' design values anyway |
| T1: `documentation-groups.mjs:25` hard-codes 67 rows | Later: Plan 4 | Breaks only when pages are added |
| T3: «٢ أعضاء آخرون» should use the dual (`numerals.test.tsx:427`, `generated-batch.test.tsx:180`) | Later: Plan 3 (AvatarGroup) | Example copy; change it with the +N restyle |
| T3: `data-table.mjs:191–196` digit regex | **Must-fix now** | Ruling 8; `/11.*20/` cannot match «١١–٢٠», which the Arabic pass now shows |
| T4: `model.ts:1092–1132` shared enum table mostly dead | Later: Plan 2 | Plan 2 edits `normalizePlaygrounds` for states |
| T4: `model.ts:1139–1144` scans twice; `allowed &&` is always true | Later: Plan 2 | Same |
| T4: overstated comments (`model.test.ts:231–232`, `fields.ts:868`) | Later: Plan 2 | Same |
| T4: redundant filter-bar `initialKind` guard (`model.ts:1076–1080`) | Later: Plan 2 | Same |
| Ruling 10: `model.test.ts:201` uses «bogus» | **Must-fix now** | Decided; «idle» is the value that fails on the old code |
| T5: silent fallbacks one level down (`generate-batch.ts:26/154`, `generate-charts.ts:6`, `generate.ts:114/263/301`) | Later: Plan 2 | No wrong output today; type the unions and end with `assertNever` the first time Plan 2 edits the generators, before Plan 4 adds pages |
| Ruling 11: type-level guard in `exhaustive.test.ts` | **Must-fix now** | Decided |
| T6: `tokens.test.ts` comments call Rulings 12 and 13 open | **Must-fix now** | Goes with the spec notes (Minor 2) |
| T6: shadows only checked for existence | Later: backlog | The values show in the evidence; low risk |
| T6: `--code-string` and `--code-number` not tested on the well | Later: Plan 3 (CodeBlock/Terminal) | They pass today (5.25 and 5.11 in light); add them with the code restyle |
| T6: `--focus: var(--action)` not pinned | Later: Plan 3 (AI parts at CSS level) | That step is where an override could creep in |
| T6: duplication nits in `tokens.test.ts` | Later: backlog | Style only |
| T6: «small overshoot» comment in `tokens.css:150–151` | **Must-fix now** | One line; Plan 3 moves every press onto `--motion-release` (Minor 4) |
| T7: modality tests do not pin the capture phase, a pointerdown leak, or the reset | Later: backlog | Code read and live checks show all three are correct; this is test hardening only |
| Ruling 17: the «لا» key | **Must-fix now** | Decided (Minor 1) |
| T8: `:has(:lang(en))` counts as English; equivalent hover gates are flagged | Later: Plan 3 | These surface when families join the audit |
| T8: check 3 allows token±token and a bare `--tray-pad`; check 7 reads only `transform` and `scale` | Later: Plan 3 | Same |
| T9: the section walk in `status-icon.test.tsx:497` skips comments | Later: backlog | Precision of a test helper |
| T10: no committed browser check that the remove hover shows | Later: Plan 3 (FilterBar) | Verified live in this review; commit the check with FilterBar's restyle |
| T10: disabled remove buttons dim twice | Later: Plan 3 (TagInput, FileDropzone) | Behaved the same before this plan; those restyles own the disabled state |

## Must-fix before Plan 2 (end-of-plan fix wave)

1. `tests/browser/ai-decisions-fixture.tsx:33`: export `FailingHostFlow` so lint ends warning-free (Ruling 4).
2. `tests/browser/data-table.mjs:195`: accept either digit set in the Arabic range, for example `/(?:11|١١).*(?:20|٢٠)/` (Ruling 8).
3. `src/workbench/model.test.ts:201`: change `state: "bogus"` to `state: "idle"` (Ruling 10).
4. `src/workbench/exhaustive.test.ts`: add a `// @ts-expect-error` line above `assertNever("toast" as ComponentId, …)` inside an expect-to-throw (Ruling 11). Loosening `value: never` then fails `npm run build`, which type-checks tests.
5. `src/system/useInputModality.ts:20`: also count a two-character non-ASCII letter key such as «لا»; named keys are ASCII, so F1 stays out. Add a case to `modality.test.tsx` (Ruling 17).
6. Spec `2026-10-18-woven-visual-language-design.md`:
   - `:303`: name sheets (280 / 200 ms) as the exception to the 90–240 ms budget.
   - `:184`: give the literal-to-AI distance as 0.20 in light and 0.125 in dark, held to the 0.08 floor.
   - Then reword `src/system/tokens.test.ts:672–674` and `:699–704` as settled, and rename `overBudgetInSpec` to `sheetEntrance` (Rulings 12, 13).
7. `src/system/tokens.css:150–151`: the comment should say presses release over `--motion-release` with `--ease-out`, not «on a small overshoot».
8. `src/system/ai-decisions.test.tsx`: add a test that Ctrl+Enter and Cmd+Enter in a text question's field submit (`AskUserQuestions.tsx:218–225`). This completes AI spec §16a behavior 3 before Plan 4 refactors the component.

## Deferred to Plans 2–4

- **Plan 2:**
  - demo states that make overlays and filled states capturable (Toast, Select popup, Modal, Menu, FilterBar with filters, FileDropzone with files);
  - exhaustive generators one level down;
  - the `model.ts` enum cleanups.
- **Plan 3, motion:**
  - delete the local `--press-scale` declarations (`components.css:28`, `:73`, `:4971`) and Button's spring release (`:47`);
  - move the literal `calc()` offsets onto tokens (Task 7 list);
  - give the release, dialog, toast, collapse and stagger tokens their first consumers;
  - give system-driven motion its own tokens (Minor 8).
- **Plan 3, corners and code:**
  - map `calc(var(--radius-panel) + N)` (`:3599`, `:4884`, `:4953`, `:5553`, `:5847`) and Card, Accordion and Table onto the scale;
  - choose the code text size (Minor 5).
- **Plan 3, fields and badges:**
  - fields move to `--border-field`; check it on `--wash` in dark, where it is 2.75:1;
  - Badge gains the warning and AI tones, and TaskRows' running badge follows.
- **Plan 3, copy and digits:**
  - AvatarGroup «+N» no longer forced LTR, with the dual for two;
  - Terminal words and «exit N»;
  - Plex's Arabic-Indic digits are proportional, so «tabular figures» cannot align them.
- **Plan 3, audit and scripts:**
  - audit precision items, check 11 extended to type tokens, the ColorPicker swatch growth, and a ruling on the `ease` keyword;
  - stale browser-script values, for example `table.mjs:137`, which expects a 12 px radius;
  - the committed remove-hover check.
- **Plan 4:**
  - §13 state words in TaskRows;
  - the remaining mount animations (decision cards, decision icons);
  - the README and agent-docs rewrite, including `README.md:125` and `:127`;
  - `documentation-groups.mjs` row count, before pages are added;
  - the `numberLocale` regional-tag decision (Minor 6).

## Declined to judge

- **Western digits in example copy** («0.4s» in `ToolActivityExamples.tsx:35`, «1.2 KB» in `FileTreeExamples.tsx:56`): host-supplied sample strings, for the content pass.
- **Arabic counted-noun grammar in example copy** («من ٢٦ عميل»): a copy-pass matter, not foundations.
- **`numberLocale` treats every RTL provider as Arabic:** Tiraz pairs Arabic with RTL by design; this predates the plan.
- **StatusIcon accepts no native props or ref:** the plan fixed its interface, and it matches Spinner.
- **TaskRows always passes `tone="ai"`:** TaskRows is the agent-task part; a neutral option belongs to Plan 4's part API.
- **A read-only TagInput shows disabled remove buttons:** this predates the plan; it belongs to Plan 3's TagInput restyle.
- **After evidence covers only the four base variants:** the plan scoped Task 11 to them, and Amjed's later instruction keeps Plans 2–4 to the same four.
- **Skipped and stopped rings at `--border-strong` (1.4–1.6:1):** their dash and square glyphs identify the state, the same reasoning as Ruling 18.
- **`docs/ai-decisions/source.sha256:73` lists the deleted `ToolStatus.tsx`:** a dated evidence manifest, not a live reference.
- **The modality listener sits on the global `document` only:** a provider in another document (an iframe) is outside the spec's provider model.
- **The keyboard rule zeroes `--motion-state` for StatusIcon's draw:** spec §15 lists «no check drawing» under keyboard modality. Only the borrowed-token cases are raised (Minor 8).
