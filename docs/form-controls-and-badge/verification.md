# Badge and native form controls verification

Implemented and verified locally on the user's Mac, 13 October 2026 (Asia/Dubai).
Baseline: `c913c58df76a100b87044f65e7d04fdd0e4c33a2`.
Checkout: `/Users/amjedfadul/.codex/worktrees/form-controls-and-badge/Tiraz`.
Branch: `codex/form-controls-and-badge`.
Preview: <http://127.0.0.1:5205/>. Vite remains running from this checkout; HTTP 200 verified. The final chat response records the local tested commit.

Badge provides static neutral/success/error/info status text. CustomerDataTable uses it for customer statuses. Checkbox reuses Field associations on a native input. RadioGroup uses native fieldset/legend and radios with a caller-supplied stable name and values. Textarea mirrors Input's labeled/composed modes and preserves native editing, selection, ref and vertical resizing. Shared tokens handle density, typography, themes, accent, corners, direction and reduced motion. No dependency or framework was added.

Four documentation pages preserve the continuous layout and one-line prompt/Copy row. The noninteractive Badge page has no event-status invitation. API references, barrel exports, registry, portable examples and composition guidance match source. Field remains documented under Input. FeedbackForm is the single small combined form example; its validation belongs to the application. It uses portable token layout classes and does not change the customer workflow.

## Local commands and evidence

Use the installed Node v24.21.0:

```sh
export PATH=/Users/amjedfadul/.nvm/versions/node/v24.21.0/bin:$PATH
npm ci
npm test -- src/system/form-controls.test.tsx src/workbench/form-controls-pages.test.tsx src/workbench/generated-code.test.ts src/system/ai-registry.test.ts
npm test
npm run build
npm run lint
npm run format:check
node node_modules/prettier/bin/prettier.cjs --check tests/browser/small-controls*
```

- Baseline generated/registry checks: 2 files, 9 tests passed (`baseline.txt`).
- Red behavior tests: six expected failures before the new exports existed (`red.txt`). New documentation/form tests initially failed on the missing example (`pages-red.txt`).
- Focused checks: 4 files, 17 tests passed (`focused.txt`).
- Final full suite: 26 files, 203 tests passed (`unit.txt`). This includes all component tests, generated snippets in both languages and controlled/uncontrolled modes, every family prompt, registry/type integrity, and strict compilation of examples after copying only the source library to an unrelated application path without workbench/root documentation.
- Build: strict TypeScript and Vite passed (`build.txt`). Vite reports a nonblocking >500 kB bundle warning; no unrelated bundling refactor was made.
- Lint: passed without warnings (`lint.txt`). Formatting: source/project and new browser files passed (`format.txt`, `browser-format.txt`). `git diff --check` passed.

The first shell runtime was too old for the existing toolchain, and the original checkout's installed dependencies predated Select. Dependencies were installed from the unchanged lockfile only in the isolated checkout using Node 24. Two old navigation-count assertions were updated for the four pages. No original dependency directory was changed.

## Browser verification

Run with local Chrome and the bundled Playwright capability (no project dependency added):

```sh
export TIRAZ_PLAYWRIGHT=/Users/amjedfadul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright
export TIRAZ_BROWSER='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
export TIRAZ_URL=http://127.0.0.1:5205
node tests/browser/small-controls.mjs
```

`browser/results.json` records 128 passing cases: all four documentation pages × Arabic/English × light/dark × compact/standard density × standard/large typography × 320/1440px widths. Thirty-two representative captures cover every page/language/theme at compact desktop and standard/large narrow settings. No document horizontal overflow or page errors occurred. IBM Plex Sans Arabic font files loaded. Representative Arabic and English captures were visually inspected for shaping, label wrapping, layout, focus and selected marks.

Native checks cover checkbox Space, radio arrow navigation/wrapping and disabled-option skipping, one checked choice, FormData, native uncontrolled reset and cancellation, external form association, application-owned controlled reset, textarea editing/selection/vertical resizing and interactive native required-field focus. Unit checks cover refs, accessible names/descriptions, deduplicated caller/helper/error IDs, controlled callbacks, disabled state and readOnly behavior.

Live customization changes mounted controls through theme, accent, density, text scale, corners and reduced motion. A mounted documentation textarea retains its node and draft through shared customization changes. Both configuration reduction and OS reduced motion yield zero transitions, including when configuration is false. The combined form validates, focuses the associated error, saves and resets.

All Badge tones measured at least 5.0055:1 text/background contrast in light and dark. A representative form documentation page had zero axe violations with color-contrast excluded from that scan and Badge contrast measured separately. These are browser/DOM checks; actual assistive-technology speech and other browser engines were not tested.

Visual inspection found legacy `.example-form input` styles stretching form radios to 252px and crushing labels at 320px. The dedicated portable preferences form layout fixed the selector collision. Geometry failed before the fix (`geometry-red.txt`), then measured an 18px radio and readable label (`geometry-green.txt`); the final matrix asserts compact choice geometry and label space on every Textarea-page case. The Badge event invitation also has a recorded failing regression (`static-badge-red.txt`) and passing final coverage. Browser harness adjustments corrected exact settings names and equivalent zero-duration CSS serialization; a navigation was aborted during one development run, then the final stable run passed.

## Review and checkout preservation

Independent source review, focused tests and RTL browser inspection were followed by review of the confirmed layout fix and Badge documentation correction. The reviewer confirmed compact/readable Arabic 320px radios and no remaining actionable findings. See `independent-review.md`.

The original checkout remains at `ce78408818b6a9866ab0faa7748404cba44d8939` with its existing README/workbench CSS edits. Binary working diff SHA-256 remains `60c40d75854dc2d4fe61a0257dd2470837f36dc8041d80db18e17cdc2e8b2d08`; staged diff remains empty. All 17 pre-existing Node server PID/port pairs remain present. The only added preview is PID 59300 on 5205. No push, merge, deploy, publish or subsequent batch was performed.
