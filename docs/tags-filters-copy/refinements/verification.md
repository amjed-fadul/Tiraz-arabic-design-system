# TagInput focus and InputCopy refinements

Branch: `codex/tags-filters-copy`.
Checkout: `/Users/amjedfadul/.codex/worktrees/tags-filters-copy/Tiraz`.
Correction base: `aec53afa0bee391edbd09d7fab90c9302ce93a66`.
All implementation and verification ran locally on the user's Mac.
Documentation/dashboard preview remains on http://127.0.0.1:5213/ and
http://127.0.0.1:5213/examples/dashboard.

## Computed cause and scoped correction

The original draft matched this existing rule in `src/system/components.css`:

```css
.tiraz-system
  :where(button, a, input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 3px;
}
```

Actual Chrome computed styles showed a 2px solid outline on `.tz-tag-draft` while
`.tz-tag-input` had no visible outline; its `:focus-within` only changed the border.
The native rectangular draft therefore drew a second shape inside the rounded field.
[Before measurements and matched rules](before/results.json).

The correction leaves that global rule unchanged. A scoped
`.tz-tag-input:has(> .tz-tag-draft:focus)` supplies the same 2px ring and 3px offset
around the rounded container. Only that focused composite suppresses its draft's
outline and shadow. Remove buttons keep their original keyboard ring; the outer
ring switches off when a remove action is focused. Invalid borders remain red
alongside the focus ring. No border widths, dimensions or overflow clipping change.
[After measurements](after/results.json).

InputCopy retains the native input's visual boundary. The real copy button is
positioned inside it at logical end, with reserved logical padding and a contained
keyboard ring. Its icon changes to a check only after Clipboard API success, then
returns after two seconds. Success uses the existing visually hidden utility and
an explicit polite status, without visible success text/row or geometry changes.
Existing visible failure/manual-copy guidance remains; the value stays selectable.
Pending copying keeps keyboard focus using aria-disabled plus a repeat-activation
guard, with aria-busy on this component's wrapper. Caller-disabled remains native
input/button disabled. Shared Button behavior and unrelated input focus are unchanged.
Value replacement/unmount still invalidate pending feedback and clear timers.
Public props are unchanged; portable/API guidance reflects the refined behavior.

## Local verification

Node: `/Users/amjedfadul/.nvm/versions/node/v24.21.0/bin/node` (24.21.0).
Browser: installed Google Chrome, with the bundled Playwright runtime; no dependency
added. All final commands exited successfully.

- `node node_modules/vitest/vitest.mjs run --maxWorkers=4`: **392 tests / 45 files**.
  Includes generated and relocated portable compilation and dashboard unit flows.
  [Full tests](tests.txt).
- Focused TagInput/InputCopy/FilterBar/documentation tests: **19 / 4 files**.
  [Focused tests](focused.txt). New success-status and busy-focus regressions join
  existing copy failure, exact value, timers and stale-result checks.
- `node node_modules/typescript/bin/tsc -b`: passed. [Compile log](compile.txt).
- `node node_modules/vite/bin/vite.js build`: passed with the existing >500kB chunk
  warning. [Build log](build.txt).
- Oxlint and project/source/changed-browser-script Prettier checks: passed without
  lint warnings. [Lint](lint.txt), [format](format.txt). Whitespace check passed.
- `tests/browser/entry-refinements.mjs`: passed Arabic/English, light/dark,
  TagInput at 1440/390px and InputCopy at 1440/320px. Real Tab/Shift+Tab reached both
  remove actions and the draft. Computed outline/shadow assertions verify the actual
  conflict, outer/remove ring ownership, unrelated native Input focus, error border
  plus focus, no focus-induced geometry shift and no clipping/overflow. Click/add/
  remove and wrapped error states passed. Copy-button boxes are inside the native
  input at the correct logical end; padding reserves the text area. Real keyboard
  activation wrote the entire long value including surrounding spaces. Check-only
  success preserved button focus and all control geometry. Native selection,
  simulated rejected/unavailable writes and pending-value replacement passed.
  [Focused browser log](browser.txt), [raw results](after/results.json).
- `tests/browser/tags-filters-copy.mjs`: passed all **48** component/language/theme/
  density/width combinations plus 320px smoke checks, native clipboard, selection,
  IME events, filtering, live settings and app/OS reduced motion. No console errors/
  warnings or settled-state axe A/AA findings. The harness now waits for its chosen
  heading before asserting selection. Final browser runs were sequential after
  implementation/build/test work had settled.
  [Batch browser log](batch-browser.txt), [results](batch-browser/results.json).

The computed-style regression failed against the original draft outline:
[style red](style-red.txt). Hidden-success and pending-button regressions also failed
before their corresponding corrections: [status red](unit-red.txt),
[busy red](busy-red.txt). The final logs above replace incomplete diagnostic runs.
Text logs have trailing whitespace normalized without changing their results.

## Before and after screenshots

| Case                         | Before                                  | After                                                 |
| ---------------------------- | --------------------------------------- | ----------------------------------------------------- |
| TagInput, English light      | [before](before/tag-en-light-1440.png)  | [after](after/tag-en-light-1440.png)                  |
| TagInput, Arabic dark narrow | [before](before/tag-ar-dark-390.png)    | [after](after/tag-ar-dark-390.png)                    |
| InputCopy, English light     | [before](before/copy-en-light-1440.png) | [after success](after/copy-success-en-light-1440.png) |
| InputCopy, Arabic dark 320px | [before](before/copy-ar-dark-320.png)   | [after success](after/copy-success-ar-dark-320.png)   |

Also inspect [wrapped invalid focus](after/tag-invalid-wrapped-en-light-390.png)
and [honest clipboard failure](after/copy-failure.png). Each folder includes the
other language/theme cases. Images are actual Mac browser captures.

## Independent review and preservation

Reviewer independently inspected source, before/after captures, computed styles,
keyboard focus and real clipboard behavior; see [review](review.md).

The original `/Users/amjedfadul/Tiraz` checkout, README/workbench edits and index
retain their preflight hashes. Reviewed preview 5212 PID 8345 and working preview
5213 PID 31442 were preserved; 5211 had no listener at preflight. No unrelated server
was modified. No push, merge or deployment.

Physical IME, VoiceOver and other browser engines were not manually verified.
Clipboard success/selection are real; rejection/unavailability/delayed completion
are simulated. Automated accessibility scans are limited evidence. The existing
bundle warning remains. Dashboard layout and navigation code were not changed.
