# DataTable v1 local verification

Implemented and verified on the user's Mac, 13 October 2026 (Asia/Dubai).
Baseline: `06a8b13d237d303b48979edeac223f726126d57f`.
Checkout: `/Users/amjedfadul/.codex/worktrees/data-table-v1/Tiraz`.
Branch: `codex/data-table-v1`.
Documentation preview: <http://127.0.0.1:5204>, kept running through development
and after completion. The final chat response records the committed/tested SHA.
No push, merge, deploy, publish or follow-on milestone was performed.

## Implementation

DataTable adds one internal client-side sort/page state to the unchanged native
Table family. The caller supplies typed columns, stable IDs, filtered records,
translations and empty content. Text sorting uses Intl.Collator; pagination
resets with sort/resetKey and permanently clamps when records shrink. No new
dependency or grid framework was added.

The customer example reuses the existing CreateCustomer validation/save/discard
flow through an application render callback. It owns 26 Arabic/English sample
records, search/status filtering, create/Toast, and menu-to-details Sheets. Active
filters remain applied after creation. Five explicit presets demonstrate normal,
loading, empty, no matching results and error/Retry without a fake service.

The distinct DataTable documentation page has only caption/state controls;
generated code embeds the actual customer and create source. Public exports,
API reference, registry, portable examples and composition guidance agree with
the source. Both languages/all five generated presets compile. Table's existing
source and basic API remain unchanged.

## Commands and results

Commands use Node `v24.21.0`, arm64 macOS, with:

```sh
export PATH=/Users/amjedfadul/.nvm/versions/node/v24.21.0/bin:$PATH
```

| Check                                  | Command                                                                                                                                                                                                                                 | Result                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Clean baseline                         | `npm ci`, `npm test`                                                                                                                                                                                                                    | 20 files / 176 tests passed                                        |
| First focused red                      | `npm test -- src/system/data-table.test.tsx`                                                                                                                                                                                            | 2 expected failures before DataTable export existed                |
| Focused feature + portability          | `npm test -- src/system/data-table.test.tsx src/workbench/customer-data-table.test.tsx src/workbench/customer-flow.test.tsx src/workbench/data-table-page.test.tsx src/workbench/generated-code.test.ts src/system/ai-registry.test.ts` | 6 files / 17 tests passed at that stage                            |
| Copied runtime + generated compilation | `npm test -- src/workbench/generated-data-table.test.tsx src/workbench/generated-code.test.ts`                                                                                                                                          | 2 files / 3 tests passed                                           |
| Final full unit suite                  | `npm test`                                                                                                                                                                                                                              | 24 files / 187 tests passed                                        |
| Production build                       | `npm run build`                                                                                                                                                                                                                         | TypeScript + Vite passed                                           |
| Lint                                   | `npm run lint`                                                                                                                                                                                                                          | Passed                                                             |
| Project formatting                     | `npm run format:check`                                                                                                                                                                                                                  | Passed                                                             |
| Added browser scripts                  | `npx prettier --check tests/browser/data-table*.mjs`                                                                                                                                                                                    | Passed                                                             |
| Clipboard consumer preparation         | `node tests/browser/data-table-copy-prepare.mjs`                                                                                                                                                                                        | Actual clipboard code + only relocated source bundle, no workbench |
| Independent consumer build             | `npm --prefix /tmp/tiraz-data-table-source-copy run build`                                                                                                                                                                              | Strict TypeScript + Vite passed                                    |
| Original protection                    | original index/file SHA1 + binary diff comparison                                                                                                                                                                                       | Unchanged; see checkout-protection.json                            |
| Independent review + re-reviews        | Reviewer source inspection and 8 focused files                                                                                                                                                                                          | 51 tests passed; no actionable findings                            |

The first shell selected Node 20, which caused dependency/runtime startup issues.
Reinstalled only this worktree's dependencies using installed Node 24; the clean
baseline then passed. The first full run found two old navigation-count assertions
and a relocation harness needing Vite's real-source raw loading. Updated those
checks and reran the full suite successfully. Browser harness corrections covered
installed Chromium version, exact settings labels, modal-hidden background roles,
and waiting for Sheet animations before capturing screenshots.

## Browser evidence

Use the locally installed Chromium with the bundled Playwright package:

```sh
export TIRAZ_PLAYWRIGHT=/Users/amjedfadul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright
export TIRAZ_BROWSER='/Users/amjedfadul/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
node tests/browser/data-table.mjs
node tests/browser/data-table-copy-prepare.mjs
npm --prefix /tmp/tiraz-data-table-source-copy run build
# Serve that copied application locally on 127.0.0.1:5205 for the next check.
node tests/browser/data-table-final.mjs
```

- Main run: 32 combinations (Arabic/English, light/dark, compact/standard,
  standard/large typography, 1440/390px); 34 interaction checks and 23 captures,
  no page/console errors. `browser/results.json` records geometry/tokens/font
  loading/no row animation and checks. Narrow table keyboard scrolling remains
  internal; document width equals viewport width. Search and sorting preserve
  control focus. Name and email sort controls use native buttons and aria-sort.
- Combined filters, stable row DOM identity, three-page pagination/reset, explicit
  loading/error/Retry/empty/no-results, validation focus, repeated save protection,
  retained filters, correct details, keyboard menu/dialog navigation, modal Tab,
  Escape/focus restoration and draft discard were exercised in local Chromium.
- Supplement: live menu accent and open details density/type/radius/theme/language/
  direction changes preserved records, query and sort; 320px Arabic create Sheet
  with OS reduced motion and app setting false; actual clipboard app pagination/
  search/create-once/Toast/details/keyboard restoration. Three checks passed with
  no page errors. `browser/final-results.json` records measured tokens.
- Open modal background controls are intentionally inaccessible during a Sheet.
  Live-provider changes while overlays remain open were tested by dispatching
  native control change events through the real workbench handlers, not by
  pretending keyboard/pointer access to the modal-hidden background is allowed.
- Visually inspected representative Arabic/English, both themes/densities/text
  scales, desktop/narrow captures, presets, menus, create/details and standalone
  copied app. Final captures wait for dialog animations to settle.

Example captures: `browser/table-ar-light-compact-standard-1440.png`,
`browser/table-en-dark-standard-large-1440.png`,
`browser/table-ar-light-standard-large-390.png`,
`browser/created-customer-details.png`, `browser/live-sheet-dark-arabic-custom.png`,
`browser/arabic-320-os-reduced-sheet.png`, `browser/source-copy-details.png`.

## Remaining limits

No manual screen-reader, physical-device touch, Safari or Firefox pass was run.
DOM/keyboard assertions and Chromium visual inspection do not establish full
accessibility conformance. The independent reviewer performed source/focused
unit checks, not an independent manual browser or screen-reader pass; see
independent-review.md. Data intentionally remains in memory. Server data,
selection, bulk actions, editing, deletion, virtualization and sticky columns
are outside v1.
