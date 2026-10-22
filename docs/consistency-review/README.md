# Documentation consistency review

Baseline: `80543531f1634cf0b77c71b48d6d66acb12bb707`.
Branch: `codex/consistency-review`.
Checkout: `/Users/amjedfadul/.codex/worktrees/consistency-review/Tiraz`.
Preview: <http://127.0.0.1:5274> (retained).
Original consistency candidate: `b4e1cd653c74e28f2f4ef5e5d345d3cbfcb3e4d3`.
Final pushed source reviewed on 17 October 2026: `b8c81df53a9303947d7f175b28171dbf1a7006a0`.

## Original consistency findings — b4e1cd6

| Severity | Confirmed before                                                                                                                   | Small fix and verified after                                                                                                                                                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P2       | Select/RadioGroup: edit Options into invalid or unapplied JSON, then Reset while the model is still default. Draft/error survives. | Explicit reset remounts inspector controls only. Defaults return, error clears and the reset button retains focus. [Before](evidence/before-collection-reset.png) / [after](evidence/after-collection-reset.png).                                                                    |
| P2       | FileDropzone: set maximum files to 1 or accept `.csv`; help still promises PDFs/images and 3 files, including copied examples.     | Constraint-neutral bilingual default help in model and portable example; migrate only historical default strings, retain custom help. Actual CSV acceptance and second-file rejection verified. [Before](evidence/before-file-helper.png) / [after](evidence/after-file-helper.png). |
| P2       | CustomerDataTable loading/error presets announce `0–0 of 0 customers` although data is unavailable.                                | Localized loading/unavailable count copy; Retry restores `1–10 of 26 customers`. Both languages checked. [After](evidence/customer-unavailable-en-dark.png).                                                                                                                         |
| P3       | A one-file rejection says `Maximum of 1 files.`                                                                                    | Singular `file` for limit 1; plural otherwise. Actual second-file rejection regression and browser check pass. [After](evidence/after-file-helper.png).                                                                                                                              |

The original consistency candidate introduced no redesign, new components,
dependencies or public APIs. Continuous page order, combined customization rail
and navigation groups were retained. Other component source was unchanged in
that candidate. Independent read-only review identified the first three issues;
re-review of the fixes and final singular wording found no actionable issues.

## Original local verification — b4e1cd6

- Baseline: 66 test files / 555 tests passed. Original candidate: `npm test -- --maxWorkers=2`, 66 files / 563 tests passed, including generated example type-checking, copied-code execution and portable registry/source checks. Eight new regression cases observed failing before their fixes. Focused candidate file checks: 25/25 passed.
- `npm run build`, `npm run lint`, `npm run format:check`, and `git diff --check` pass. Build retains the existing large-chunk warning.
- Mac Google Chrome: visually reviewed all 50 navigation pages in Arabic/light and English/dark, including their examples. Browser matrix: 600 settled cases (50 × 4 language/theme combinations × 1440/390/320px), no page overflow or uncaught errors. Field remains documented under Input.
- 100 bilingual checks: shared theme/accent/density/radius/typography/motion reach playground and examples; contextual edits, reset and actual clipboard code/full-prompt equality pass. All 50 navigation destinations traversed by Tab in both languages with visible focus and scrolling. Composite OTP/file/color focus rings checked directly.
- Connected Dashboard filtering, sorting, creation/validation/cancel/focus; forms/reset; nested overlays and popups; FileTree selection/preview/keyboard; TaskRows disclosure/replay/retry; AI feedback simulation/cancel/replay; ToolChips → real ToolCall details/focus and failed-call retry/reset pass. Existing Dashboard, form-validation, avatar-overlays, FileTree and TaskRows browser checks exercised these flows.
- OS and application reduced motion tested separately; activity rotation/SVG/CSS stop while feedback remains. Normal animation verified in both themes. Narrow and short overlay layouts, keyboard dismissal and focus restoration checked.
- Source-only copy of the whole library: standalone strict compilation, Vite build and browser exercise pass. Original fixed-delay browser scripts raced Select/Tab focus and Toast F8; diagnostic copies awaited observable state/focus instead. No application workaround or verification framework added. Initial unrestricted Vitest run timed out Dashboard filtering and a registry mutation check under concurrent load; bounded-worker full rerun passes.

Direct verification is local Chrome/DOM/pointer/keyboard behavior on this Mac.
Screen-reader announcements, physical touch devices, Safari/WebKit and Firefox
were not tested. Automated accessibility scans do not establish those behaviors.

Original-candidate captures: [Arabic/light FileTree](evidence/file-tree-ar-light.jpg),
[English/dark connected tools](evidence/tool-connected-en-dark.png),
[narrow visible focus](evidence/narrow-visible-focus.png),
[Dashboard customer creation](evidence/dashboard-created-customer.png).
Full local captures/results/logs: `/tmp/tiraz-consistency-review/` (not committed).

## Final-source follow-up — 17 October 2026

The two later commits were user-requested additions, separate from the original
consistency fixes:

- `2c2a5734c4ae9d3e40ffbb4b19f054330ebae950` adds seven paired accents: lime,
  amber, teal, cyan, indigo, rose and slate. It expands the existing `Accent` type
  to eleven values, localizes the choices, accepts them in current and legacy
  preference readers, and updates configuration guidance. Original presets retain
  their values. Charts use the active action color followed by sage/blue/plum/clay,
  excluding the active preset from those fallbacks; palette wrap reuses
  `var(--action)` rather than an undefined new `--chart-*` token.
- `b8c81df53a9303947d7f175b28171dbf1a7006a0` replaces only the documentation
  Accent menu with the already-installed Radix Select primitive. Every option
  and selected value shows the current theme's swatch beside its localized name.
  Decorative dots are excluded from accessible names. The popup uses the nearest
  settings drawer container on mobile, preserving layer dismissal and focus.
  No new component, prop or dependency was introduced by these additions.

### Confirmed documentation findings and corrections

- **P3 — incomplete choice list:** README workbench guidance still named only
  Green/Blue/Purple/Brown. It now lists all eleven choices and explains
  their theme-aware swatches; the original four values remain unchanged.
- **P3 — stale chart metadata:** all four chart registry entries described a
  fixed four-color default. They now describe the selected accent plus the
  deduplicated sage/blue/plum/clay fallbacks, cycling after four or five entries.
  Conservative advice to choose deliberate colors beyond four series remains.

Both were secondary descriptions missed when the preset list expanded. Independent
read-only review of `b4e1cd6..b8c81df` found these documentation mismatches and no
confirmed implementation defect. Corrections change README/registry wording only;
component source and behavior remain exactly as at `b8c81df`. Independent re-review
of the corrections, report and linked evidence found no actionable issues.

### Verification against the final source

These are fresh local checks of the `b8c81df` implementation with the documentation
corrections above, reusing the existing tests and temporary Playwright checks:

- Focused tests: `npm test -- src/system/config.test.ts src/system/charts.test.tsx src/workbench/storage.test.ts src/workbench/Workbench.test.tsx src/workbench/action-lifecycle.test.tsx` — 5 files / 64 tests passed. Covers all preset pairs, contrast against the specified action/text backgrounds, current/legacy persistence, palette wrap, copied configuration, selection/cancellation/focus, and pending feedback.
- Full suite: `npm test -- --maxWorkers=2` — 67 files / 579 tests passed, including generated usage checks and strict compilation of relocated source-only examples. This does **not** repeat the original standalone source-copy Vite/browser exercise.
- `npm run build`, `npm run lint`, `npm run format:check`, explicit report formatting and `git diff --check` pass. Build retains the existing large-chunk warning.
- **88 swatch cases:** all 11 presets × Arabic/English × light/dark × 1440/390px. Theme-specific option/selected swatches, names, actual selection, persisted values, popup bounds and page overflow pass. Arrow keys, Home/End, Enter and Escape preserve/commit values and return focus to the Accent trigger. English typeahead passes. Mobile popup stays in the drawer; first Escape closes it, next Escape closes the drawer and restores its header trigger.
- **44 persistence/copy cases:** all 11 presets × both languages/themes survive reload, reach playground/example action tokens, and appear in the complete copied prompt containing the displayed usage code. Reset restores Green and the shared light theme; the actual header control restores each dark test case.
- **176 chart cases:** all four chart kinds × 11 presets × both languages/themes. Real SVG stroke/fill and legend swatches use the same theme colors; hiding/revealing a series does not recolor its legend. The existing six-series regression covers palette wrap, and the existing chart suite covers explicit colors.
- Short 390×360px English/dark drawer: keyboard-visible 2px focus, bounded/scrollable popup, selection and trigger focus pass with both OS motion preferences. Popup entrance is 120ms normally and effectively disabled under reduced motion.

The earlier 50-page visual review, 600-case matrix and 100 shared-settings checks
belong to `b4e1cd6`; they were **not** rerun wholesale on `b8c81df`. This follow-up
visually inspects the accent menu across both languages/themes and narrow layouts,
and checks the connected chart paths above. Direct behavior evidence is installed
Google Chrome on this Mac with DOM/pointer/keyboard automation. Screen-reader speech,
physical touch devices, Safari/WebKit and Firefox remain untested.

Final-source captures (separate from the original candidate's images):
[Arabic/light desktop swatches](evidence/final-swatches-ar-light.png),
[English/dark desktop swatches](evidence/final-swatches-en-dark.png),
[Arabic/light mobile layering](evidence/final-swatches-ar-light-mobile.png),
[English/dark mobile layering](evidence/final-swatches-en-dark-mobile.png),
[English/dark lime chart](evidence/final-chart-lime-en-dark.png).
Full temporary checks/results/logs: `/tmp/tiraz-final-review/` (not committed).
No new verification framework was added.
