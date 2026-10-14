# Tags, filters and copy — local verification

Checkout: `/Users/amjedfadul/.codex/worktrees/tags-filters-copy/Tiraz`.
Branch: `codex/tags-filters-copy`.
Fetched main and started from exact baseline
`73c5a453f74ea2bf5723fd2144c81714708888a9`.
Preview: http://127.0.0.1:5213/ and
http://127.0.0.1:5213/examples/dashboard. Both respond HTTP 200.

## Implementation

- TagInput: Input-style Field convenience/composition associations, native input
  attributes/ref/editing events, controlled/internal string arrays, trimmed Enter,
  exact case-sensitive duplicate feedback, IME protection, empty Backspace and
  explicit removal with input focus, optional cap, disabled/read-only. Native paste
  remains text. Repeated hidden names submit committed tags only; uncanceled
  uncontrolled reset restores initial defaultValue without callback. Controlled
  array reset belongs to the host; both modes clear draft/feedback after native
  reset cancellation is known. No required-tag validation or autocomplete.
- FilterBar: named group, search/control slots, removable active chips and optional
  Clear all. Uses existing controls, wrapping rows and explicit remove names.
  Removal focuses the next chip, a control or group. Application owns filtering,
  values, counts and page reset. Dashboard reuses its actual customer search/status
  logic and retains sorting, pagination, creation and hidden-new-customer reveal.
  No-results recovery now uses the same visible Clear filters action above the table.
- InputCopy: read-only selectable native value and adjacent copy Button. Exact full
  value is written with Clipboard API; success only after resolution, announced for
  two seconds. Failure/unavailable access explains manual copying. Value replacement
  and unmount invalidate pending feedback and clear timers; no deprecated fallback.
- Standard continuous pages, compact inspector controls, working local examples,
  generated code/full prompts, API registry and portable guidance. TagInput/InputCopy
  belong to Forms; FilterBar belongs to Data. Registry/source contracts match. Each
  copied example includes only its relevant family. No dependency changes.

## Reference inspection

All three requested pages loaded in the local Codex browser on the Mac:
[TagInput](https://formicai.dev/preview.html#/taginput),
[FilterBar](https://formicai.dev/preview.html#/filterbar) and
[InputCopy](https://formicai.dev/preview.html#/inputcopy). Inspected their wrapping
surfaces and controls; added a reference tag and observed reference copy success.
They inspired field/chip/row composition. Tiraz intentionally follows this batch's
Enter-only, literal-paste and application-owned-filter contracts.

## Checks on the Mac

Commands used installed dependencies and
`/Users/amjedfadul/.nvm/versions/node/v24.21.0/bin/node` (Node 24.21.0).
Browser automation used the bundled Playwright runtime with installed Google Chrome;
no project browser dependency was added.

- Focused three-family/documentation/dashboard regressions: **26 passed**, 5 files.
  [Focused log](focused.txt), initial missing-component [red log](focused-red.txt).
- Full `node node_modules/vitest/vitest.mjs run --maxWorkers=4`: **390 passed**,
  45 files. Includes generated snippet modes/contracts, portable source relocation
  and compilation, copied-prompt relocation and registry/source type checks.
  [Full log](tests.txt).
- `node node_modules/typescript/bin/tsc -b`: passed. [Compile log](compile.txt).
- `node node_modules/vite/bin/vite.js build`: passed; existing >500kB chunk warning.
  [Build log](build.txt).
- `node node_modules/oxlint/bin/oxlint`: passed without warnings. [Lint log](lint.txt).
- Prettier project/source and changed browser-script check: passed.
  [Formatting log](format.txt). `git diff --check` passed.
- `tests/browser/tags-filters-copy.mjs`: passed **48** component/language/theme/
  density/viewport cases (Arabic/English, light/dark, compact/standard, 1440/390px),
  plus 320px examples. No page/control overflow or chip-label/remove overlap; no
  settled-state axe A/AA findings or browser errors/warnings. Real Chrome clipboard
  writes/reads succeeded across all eight desktop language/theme/density combinations
  and for a long underlying value including spaces. Keyboard selection, literal native
  clipboard paste, IME events, duplicate/cap feedback, remove focus, trusted reset,
  composed filters and live settings passed. Both app and OS reduced motion checked.
  [Browser log](browser.txt), [raw measurements](browser/results.json).
- `tests/browser/dashboard.mjs`: passed the existing full flow across 1440/768/390/
  320px and both languages/themes, including connected order metrics, customer
  creation/validation, no-results filtering/recovery, sorting, page reset, filtered
  new-customer reveal, live theme, desktop rail and mobile Sheet destination focus,
  dismissal and trigger restoration. No console/axe findings.
  [Dashboard log](dashboard-browser.txt), [results](dashboard-browser/results.json).

Browser harness settings seed before React mounts to avoid persistence races;
assertions verify the actual selected family/theme/density. Contrast scans wait for
finite existing Button fades to finish. Reset waits for the documented next-task
cancellation check rather than asserting inside native event dispatch.

## Screenshots

- [Arabic TagInput](browser/tag-input-ar-default.png)
- [English dark FilterBar with two active filters](browser/filter-bar-en-applied.png)
- [Arabic dark InputCopy success](browser/input-copy-ar-success.png)
- [TagInput at 320px](browser/tag-input-320.png)
- [FilterBar at 320px](browser/filter-bar-320.png)
- [InputCopy at 320px](browser/input-copy-320.png)
- [Arabic long tag at 390px](browser/tag-input-ar-light-390.png)
- [English dark long filter at 390px](browser/filter-bar-en-dark-390.png)
- [Dashboard customer creation](dashboard-browser/created-customer.png)
- [Dashboard narrow Arabic layout](dashboard-browser/ar-light-390.png)

The browser directory also contains both languages/themes and long-label samples.
These are actual local screenshots, not generated mockups.

## Preservation and limits

Original `/Users/amjedfadul/Tiraz` remains at
`ce78408818b6a9866ab0faa7748404cba44d8939` on main with its existing README.md and
src/workbench/workbench.css edits and no staged changes. Content/index hashes matched
preflight. Port 5211 PID 95351 and reviewed preview 5212 PID 8345 were preserved.
The new preview is PID 31442 on 5213. No unrelated server was changed.

Clipboard rejection/unavailability and delayed writes are explicitly simulated;
success/selection/paste use actual Chrome clipboard behavior. IME composition events
are automated; a physical Japanese/Chinese IME and VoiceOver were not manually
verified. Other browser engines are untested. Automated accessibility scans do not
prove complete accessibility. Examples reset on reload and have no persistence.
The existing build chunk warning remains. No push, merge, deployment or publication.
