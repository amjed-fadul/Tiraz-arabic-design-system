# TaskRows sample details and disclosure polish

Verified locally on the user's Mac on 15 October 2026 (Asia/Dubai).

- Parent commit: `00859ba8232bb4de309390c8ef2ce1d9a17614dc`.
- Branch: `codex/tasks-and-notifications`.
- Checkout: `/Users/amjedfadul/.codex/worktrees/tasks-and-notifications/Tiraz`.
- Preview: http://127.0.0.1:5244/ — HTTP 200, existing PID 9117 retained.

The completed sample now contains aligned contact/tax-ID and stale-record counts
directly, replacing the Show local note button. It is still explicitly local,
illustrative data. State labels use Tiraz's existing Badge with neutral pending,
info running, success completed and error failed tones. Hover feedback covers the
whole task, including its details, in both capsule and connected-list appearances.

Disclosure opening and closing animate height and opacity through shared motion
tokens. Closing panels become aria-hidden and inert immediately; the native hidden
attribute is retained with a CSS grid override to allow visual exit. Panels stay
mounted, keep their content and preserve the existing collapse focus recovery.
System and OS reduced motion remove the transitions. No library timers or new
dependencies were added. Portable metadata, guidance and documentation agree.

## Checks

- Red run: two new focused regressions failed before implementation (`red.txt`).
- Focused: 15 tests in two files passed (`focused.txt`).
- Full: `npm test -- --maxWorkers=2` — 504 tests in 59 files passed (`test.txt`).
  This includes generated usage and source-only relocated consumer compilation.
- `npm run build`, `npm run lint`, `npm run format:check`, browser script Prettier
  check and `git diff --check` passed. Build retains the existing large-chunk warning.
- `node tests/browser/tasks-notifications.mjs` — eight groups passed (`browser.txt`).
  Sixteen combinations cover Arabic/English, light/dark, desktop/320px and both
  appearances, with four states, long mixed text and no horizontal overflow.
- Browser assertions cover actual semantic Badges, sample data without note
  buttons, hover originating in the details, measured opening and closing motion,
  immediate aria-hidden/inert, rapid reversal, native keyboard disclosure, external
  collapse focus, state/retry focus, replay cancellation and stable identity.
- Live customization, large Arabic typography, system/OS reduced motion and copied
  documentation prompts passed. NotificationList actions, filtering, counts and
  focus regressions passed. No uncaught browser errors.
- Independent reviewer inspected source, tests, documentation, four screenshots
  and the motion trace, with no actionable findings. Their separate focused run
  passed all 15 tests and diff whitespace checks. They reviewed supplied browser
  evidence; they did not perform an independent interactive browser run.

## Evidence

- [Updated task with sample data and whole-task hover](browser/sample-card-en-hover.jpg).
- [English fixture with expanded sample](browser/sample-data-en-hover.jpg).
- [Arabic desktop documentation](browser/after-ar-light-desktop.jpg).
- [Arabic 320px documentation](browser/after-ar-light-320.jpg).
- [Connected-list documentation](browser/after-ar-light-desktop-list.jpg).
- `browser/disclosure-motion.json`: opening 0 to 78.375px and closing 78.375 to 0px,
  with intermediate frame measurements.
- `browser/matrix.json`, `browser/results.json`, `browser/copied-task-prompt.txt`:
  layout measurements, results and full generated prompt.
- Previous evidence remains under `../taskrows-correction/browser/`; the user's
  supplied screenshots show the immediately preceding note-button version.

## Preservation and limits

NotificationList implementation and example, landing work and dashboard behavior
are unchanged. The original checkout's unstaged diff hash remained
`60c40d75854dc2d4fe61a0257dd2470837f36dc8041d80db18e17cdc2e8b2d08`; its index stayed
empty. Port 5241 retained PID 83235. Neither preview nor unrelated servers were
restarted. No push, merge, reset, deployment or additional component work occurred.

Safari, Firefox and manual VoiceOver announcements remain unverified. Chrome
interaction and screenshot evidence do not establish full accessibility conformance.
