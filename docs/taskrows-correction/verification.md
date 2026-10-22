# TaskRows agent-task correction

Verified locally on the user's Mac on 15 October 2026 (Asia/Dubai).

- Previous reviewed/pushed HEAD: `a65a1434c99bff67c806d3fed42211eaf0976ed5`.
- Baseline/remote main: `497d8960a84425e11699d1534234a84805a5fc70`. The prior batch had **not** been merged when checked. Existing history was retained.
- Branch: `codex/tasks-and-notifications`.
- Checkout: `/Users/amjedfadul/.codex/worktrees/tasks-and-notifications/Tiraz`.
- Preview kept running: http://127.0.0.1:5244/ (original PID 9117).

## Corrected purpose

TaskRows now renders expandable agent-task execution rows, replacing the earlier
checklist interpretation. Items have stable id, title, optional short summary,
application-supplied pending/running/completed/failed state and detail content.
The library adds no execution runtime, timers, network or progression. Native
disclosures associate visible state text with linked hidden/inert panels. Actions
stay outside triggers. Capsule and connected-list appearances share Tiraz tokens.
Controlled/uncontrolled expansion preserves supplied order, identity and focus.

The compiling example has clearly labeled local Run/Replay, intentional failure,
explicit retry to completion, another prewritten completed sample and useful
expandable details. Example timers cancel on replay/unmount with generation guards.
Copy explicitly states that no real files, emails or backend tasks were processed.
TaskRows now appears under the implemented AI patterns section. There are still
45 families; ToolCall and ToolChips were not implemented.

## Reference inspection before editing

The supplied Formic URL was available in a local browser. Opened completed capsule
details, opened the second capsule, invoked Play Capsules again and Play List
again, and opened connected-row details with Enter. Visually inspected the compact
indicator/title/summary/status/chevron alignment and details beneath the header.
Reference interaction happened before implementation edits. The reference's
scripted execution was adapted into explicit, accurately labeled local example
controls; the library itself never executes tasks.

## Verification

- Focused baseline: 13 tests passed before replacement.
- Final focused checks: **23 tests in 5 files passed**, covering all four states,
  both appearances, native attributes/ref, Enter/Space, panel association/inertness,
  preserved detail values, state/action separation, stable identity/order/focus,
  controlled collapse recovery, deliberate outside blur and repeated expansion,
  replay/retry cancellation, unmount cancellation and truthful simulation copy.
  NotificationList and navigation/copied-example regressions are included.
- Final full command: `npm test -- --maxWorkers=2` — **502 tests in 59 files passed**.
  Includes generated examples, source-only relocation compilation, full copied
  prompts, registry/type integrity and explicit rejection of the old checklist
  props. Both appearances and controlled/uncontrolled modes compile.
- `npm run build`, `npm run lint`, `npm run format:check`, browser-file Prettier
  check and `git diff --check` passed. Build retains the existing large documentation
  chunk warning; no dependency changes or unrelated bundle refactor.
- `node tests/browser/tasks-notifications.mjs` passed **seven verification groups**.
  The 16-case matrix covers Arabic/English, light/dark, desktop/320px and both
  appearances with long mixed text, no horizontal overflow and no row entrance
  animation. Four static execution states are shown alongside the live example.
  Native keyboard disclosure, linked hidden panels, controlled collapse focus,
  deliberate outside departure, state/retry focus and stable IDs were verified.
- Live density, typography, accent and theme changes passed; system and emulated
  OS reduced motion passed. Full copied TaskRows prompt includes the generated
  example and selected appearance. Documentation and minimal inspectors update.
  Browser errors: none. Notification read/filter/action/focus regressions passed.
- Independent source/test/screenshot review and re-review completed. A P2 focus
  issue and its related repeated-expansion edge were reproduced, fixed and covered
  by regressions. Final reviewer found no remaining actionable findings and
  independently passed all 11 TaskRows tests. See `review.md`.

## Before and after evidence

- `browser/before-ar-light-desktop.jpg`, `browser/before-ar-light-320.jpg`: original checklist.
- `browser/after-ar-light-desktop.jpg`, `browser/after-ar-light-320.jpg`: corrected capsules with useful details.
- `browser/after-ar-light-desktop-list.jpg`: corrected connected list.
- `browser/ar-light-320-capsules.jpg`, `browser/en-dark-320-list.jpg`: narrow complete fixtures.
- `browser/running-en-light.jpg`: explicit local running simulation.
- `browser/matrix.json`, `browser/results.json`, `browser/copied-task-prompt.txt`: measurements and full copied prompt.

## Preservation and limits

NotificationList source and its portable example are unchanged. Removed only the
obsolete TaskRows selectors from previously shared CSS; all NotificationList style
values remain identical. Landing and dashboard files were untouched. The original
checkout stayed on main at `ce78408818b6a9866ab0faa7748404cba44d8939`, with its original
README/workbench.css edits unchanged (matching diff hash) and no staged changes. Landing work
remained on its existing branch at `bbd738c1a1eea9fccce28e59e46e6ae3552769fd`.
Port 5241 retained PID 83235. No unrelated servers were restarted or signaled.
No push, merge, reset, force-push, deployment or additional family work occurred.

The first full correction run exposed the old navigation tests' expectation that
AI patterns remain hidden; assertions now reflect the requested implemented page.
A test build also found obsolete exact-match options in the carried-over combined
test file; removing those unsupported options changes no NotificationList behavior.
The earlier reports under tasks-and-notifications describe the prior committed
batch, not this corrected purpose.

Manual VoiceOver/screen-reader announcements and Safari/Firefox remain unverified.
The application supplies unique IDs, valid content and execution states. Native
keyboard and automated evidence do not establish full accessibility conformance.
