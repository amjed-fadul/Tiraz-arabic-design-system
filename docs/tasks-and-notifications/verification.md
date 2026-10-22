# TaskRows and NotificationList verification

Completed locally on the user's Mac, 15 October 2026 (Asia/Dubai).

- Baseline: `497d8960a84425e11699d1534234a84805a5fc70`.
- Checkout: `/Users/amjedfadul/.codex/worktrees/tasks-and-notifications/Tiraz`.
- Branch: `codex/tasks-and-notifications`.
- Preview: http://127.0.0.1:5244/ (Vite, strict port, kept running).
- Runtime: Node 24.21.0 from the existing local nvm installation. The default shell Node 20 could not run this toolchain; no project dependencies changed.

## Results

1. Focused baseline: 11 tests passed before implementation.
2. Focused component behavior, copied runtime and documentation checks: 13 passed after review fix. Includes completion/reopen, disabled, counts, order, native roots/refs, separate actions, timestamps, static/empty states, individual/all read, All/Unread, retained All focus and next/previous/filter focus recovery.
3. Full final suite: `npm test -- --maxWorkers=2` — **494 tests passed in 58 files**. Includes generated-code compilation, runtime checks, registry/type integrity, full prompt synchronization, relocated generated snippets and a source-only consumer with no root README/workbench required. See `test-final.txt`.
4. `npm run build` passed. Vite retains the existing documentation chunk-size warning (>500 kB); no new dependency or unrelated bundling change.
5. `npm run lint` passed without warnings; `npm run format:check`, additional browser fixture/script formatting and `git diff --check` passed.
6. `node tests/browser/tasks-notifications.mjs` passed seven browser verification groups in local headless Chrome. `browser/matrix.json` records exact CSS widths 1440/390/320 across Arabic/English and light/dark, with no document/list overflow. Long unbroken Latin identifiers and Arabic copy wrap. IBM Plex Sans Arabic is loaded. No row entry animations.
7. Browser keyboard checks cover completion/reopen and Tab skipping a disabled task; action/read separation; last-row, final-row and Show all focus; Arabic Mark all; real local details. Live theme, accent, density and typography update. Both system and emulated OS reduced motion were checked. Browser errors: none. Documentation narrow layouts, inspector changes, copied code and whole prompt verified.
8. Independent reviewer inspected source, registry, portable docs and corrected browser screenshots. One P2 Show all focus issue was reproduced by a regression test, fixed and independently re-reviewed. No remaining actionable findings. See `review.md`.

## Reference inspection

Both supplied Formic URLs were available in a local browser. TaskRows' quiet compact rows/state glyphs and NotificationList's count/read-state hierarchy informed the styling. Tiraz follows the requested application-owned task/read semantics: separate controls, no scripted run, automatic marking, dismissals or services.

## Preservation

The original checkout remains on `main` at `ce78408818b6a9866ab0faa7748404cba44d8939` with the original two unstaged paths (`README.md`, `src/workbench/workbench.css`) and no staged changes. No command wrote to it. The separate `codex/landing-page` checkout and its active edits were not changed by this batch. No landing/dashboard file differs from the supplied baseline in this branch. Port 5241 retains original PID 83235. No unrelated server was stopped, restarted or signaled. Only port 5244 was started for this checkout.

## Notes and limits

The first unconstrained full run passed 490 tests but hit two 5-second timeouts in existing DatePicker tests (logical LTR month navigation and broad year dropdown). The unchanged DatePicker file passed all 22 tests alone, and the complete final suite passed with two workers; no unrelated test timeouts or production code were changed.

Initial in-app-browser full-page screenshots were cropped by display scaling despite correct DOM geometry. They were replaced by exact-width local Chrome captures; `browser/results.json`, `browser/matrix.json` and `browser.txt` describe the final evidence. Temporary browser overrides were reset.

Manual VoiceOver/screen-reader announcements and Safari/Firefox were not verified. Automated/native semantics and keyboard evidence are not a full accessibility conformance claim. Application-supplied IDs, dateTime validity, data, actions and any persistence remain application responsibilities by design.
