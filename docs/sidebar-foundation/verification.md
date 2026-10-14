# Local Sidebar verification — 2026-10-14

Checkout: `/Users/amjedfadul/.codex/worktrees/sidebar-foundation/Tiraz`.
Branch: `codex/sidebar-foundation`; base `78f476e4da8764844e5ed2df3676fe2d5e370474`.
Fetched origin/main was exactly that reviewed dashboard commit before work began.
All implementation and checks ran locally on the user's Mac. No dependencies added.

Preview remains running: http://127.0.0.1:5212/
Dashboard: http://127.0.0.1:5212/examples/dashboard
Documentation navigation now uses six expanded translated groups; existing
page IDs/URLs, selection, scrolling and layout are retained. Files and AI patterns
remain absent because they have no implemented documentation pages.

## Commands and results

Use `/Users/amjedfadul/.nvm/versions/node/v24.21.0/bin/node` for the commands below.
The login shell's npm initially selected Node 20; reinstalling with the explicit
Node 24 npm CLI resolved missing optional native bindings. Package/lock unchanged.

- `node node_modules/vitest/vitest.mjs run --maxWorkers=4`: **365 tests, 41 files passed**.
  Baseline: 350 tests passed. Includes 17 focused Sidebar/sample/dashboard tests,
  generated snippet modes and relocated portable source/examples compilation.
- `node node_modules/typescript/bin/tsc -b` then
  `node node_modules/vite/bin/vite.js build`: **passed**; chunk-size warning remains.
- `node node_modules/oxlint/bin/oxlint`: **passed, no output/warnings**.
- `node node_modules/prettier/bin/prettier.cjs --check src index.html vite.config.ts '*.json' README.md docs/implementation-plan.md tests/browser/sidebar* tests/browser/dashboard.mjs docs/sidebar-foundation/plan.md`: **passed**.
- `git diff --check`: **passed**.
- `TIRAZ_URL=http://127.0.0.1:5212 TIRAZ_EVIDENCE=docs/sidebar-foundation/dashboard-browser TIRAZ_PLAYWRIGHT=<bundled-playwright> node tests/browser/dashboard.mjs`: **passed**.
- `TIRAZ_PLAYWRIGHT=<bundled-playwright> node tests/browser/sidebar.mjs`: **passed**.
  Playwright used the bundled local runtime and installed Google Chrome, without
  adding a project dependency. Scripts are reusable; pass TIRAZ_URL/EVIDENCE.

## Rendered checks

Arabic/RTL and English/LTR; light/dark; expanded/56px icon rail; compact IBM Plex
Sans Arabic; 1440/768/390/320 widths. Checked native names, Tooltip labels and
Escape, active child parent indication, Enter/Space disclosure, controlled external
collapse from a focused child, hidden/inert descendants, long text/count separation,
footer actions, bounded navigation wheel scrolling with fixed header/footer,
system and OS reduced motion. Width/label transitions retain icon positioning.

Mobile uses existing Sheet with the same navigation. Verified Tab trapping,
Escape/outside dismissal and trigger restoration, real section/note destination
focus after dismissal, and usable internal scrolling with contained footer at
390×300. Dashboard rail preserves data, actual anchors and theme/language controls.

Rechecked customer validation, repeated-save guard, draft discard on dismissal,
creation, existing combined filters, new customer hidden-by-filter reveal, clear
filters, sorting/pagination and unchanged order/revenue metrics. Loading/error/empty
sample states remain connected. No dashboard console errors/warnings or axe A/AA
findings. Sample Back/reload native links and actual copied prompts/code work.

See [independent review](review.md), [Sidebar browser results](browser/results.json),
[dashboard browser results](dashboard-browser/results.json), and raw logs here.

## Preservation and limitations

Original checkout remains on main with exactly its prior README.md and
src/workbench/workbench.css modifications, with no staged changes. Original port
5211 listener PID 95351 remains running. Unrelated servers were not changed.
Worktree is retained with local commit only: no push, merge, deploy or publish.

Attached visual references were unavailable in this chat; styling follows the
provided brief and Tiraz's existing tokens. Manual VoiceOver and other browser
engines were not verified. Automated accessibility checks establish no full
conformance claim. Build emits a >500kB chunk warning. The sample note example is
browser-hosted application code; Sidebar itself supplies no routing or persistence.

## Documentation grouping verification

The clarification explicitly authorized grouping, superseding only the former
requirement to leave documentation navigation unchanged. Forms, Navigation,
Data, Display & feedback, Overlays and Charts contain the existing 32 documented
pages exactly once. Files and AI patterns have no implemented page. No new
components or placeholder pages were added. Existing short localized item names
are retained; headings use 11px and rows 32px, with all groups expanded.

Focused grouping/workbench/input checks: 20 passed. Full suite: 365 passed across
41 files, including generated and relocated source compilation. Final build,
lint and formatting passed; see menu-tests.txt, menu-build.txt, menu-lint.txt and
menu-format.txt. Browser group checks pass both languages/themes, desktop/short
menu Tab scrolling, mobile shared groups/internal scrolling/dismissal/restoration,
and representative page selection without URL changes. See
[menu browser results](menu-browser/results.json) and its screenshots.
Dashboard and Sidebar browser suites were rerun sequentially and passed again,
including customer creation/filtering and short mobile Sheet focus/scrolling.
Independent grouping review is clean.

An initial overloaded verification run timed out in existing simulations,
generated compilation and dashboard tests while browser sweeps and preview
refreshes ran concurrently. No production workaround or timeout increase was
introduced; limiting the full suite to four workers and running browser sweeps
after source edits, sequentially, passed. The new grouping test's TypeScript
option and the new browser script's documentation-drawer selector were corrected.

## Follow-up shared layout corrections

See [corrections verification](corrections/verification.md) for the final current
layout, 366-test result, expanded library example, exact center measurements,
before/after images and clean independent re-review. The working branch and
preview port remain unchanged.
