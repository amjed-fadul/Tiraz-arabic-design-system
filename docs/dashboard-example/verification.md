# Local verification · 14 October 2026

Baseline: `585d18bcd3a064a03daae4e17d1551b2a154cb21`.
Branch: `codex/dashboard-example`.
Checkout: `/Users/amjedfadul/.codex/worktrees/dashboard-example/Tiraz`.
Documentation: `http://127.0.0.1:5211/`.
Dashboard: `http://127.0.0.1:5211/examples/dashboard`.
The development server remains running with the final source.

All implementation and verification ran locally on the user's Mac with installed
Node 24.21.0, the repository's existing Vitest/TypeScript/Vite/Oxlint/Prettier,
and local Chrome 155.0.8059.40 through the supplied Playwright runtime. The
default shell Node 20 was below the project requirement; reinstalling the locked
dependencies under Node 24 resolved startup. No package/lock changes or new
dependencies were needed.

## Checks

| Check                                                       | Result                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------- |
| Focused `npm test -- src/examples/dashboard --maxWorkers=2` | 2 files, 9 tests passed                                             |
| Full `npm test -- --maxWorkers=2` on final source           | 38 files, 350 tests passed, including generated example compilation |
| `npm run build`                                             | TypeScript and Vite passed; large-chunk advisory retained           |
| `npm run lint`                                              | Passed, no warnings                                                 |
| `npm run format:check`                                      | Passed                                                              |
| Prettier check for new docs and browser harness             | Passed                                                              |
| `git diff --check`                                          | Passed                                                              |
| `tests/browser/dashboard.mjs`                               | Passed; [structured results](browser/results.json)                  |

The browser harness inspected Arabic/English × light/dark × 1440/768/390/320px,
loaded local IBM Plex Sans Arabic, paired language/direction and checked page
overflow. It exercised shared period calculations against both native chart
tables/summaries, combined filters, page resets, ascending/descending sorting,
name/email validation, first-invalid focus, repeated synchronous submissions,
customer count changes with unchanged orders/revenue, hidden-customer reveal,
Toast, cancel/close/Escape draft discard and trigger restoration.

Sample/loading/empty/error and Retry worked. Creating in Empty produced one
customer and zero orders. Reload restored the sample. Live dark tokens reached
the Sheet; nested Select Escape dismissed the Select, restored its trigger and
then dismissed the Sheet. Mobile navigation handed focus to all real section
destinations in normal and reduced motion; Escape restored navigation trigger
focus. Loading Skeleton animation was `none` under OS reduced motion. The wide
customer table stayed in its own keyboard-focusable scroll region (286px
container / 512px content at 320px). The console had no errors or warnings.
The final sample accessibility scan found no WCAG A/AA violations.

## Independent review

A separate reviewer read repository/portable guidance, source, tests and browser
results; inspected representative Arabic/English desktop/mobile light/dark and
validation/empty/error screenshots; and checked live long-name/mobile navigation
behavior in local Chrome. It found one P3 reuse issue: Sheet navigation links
relied on the documentation stylesheet's anchor reset. The fix scoped link
appearance/focus to `.dashboard-host`, covering portal siblings. A regression
check removes the documentation stylesheet and verifies inherited token color,
no underline and trigger focus restoration.

The reviewer independently rechecked that setup at 390px across both languages
and themes and confirmed the issue resolved, with no remaining actionable
findings. Review was read-only and changed no server.

## Preservation and limits

The original `/Users/amjedfadul/Tiraz` HEAD, working-tree diff, index diff and
status matched the pre-work snapshots. Its documentation process on port 5210
retained PID 75716 and returned HTTP 200. This task changed or stopped no unrelated
server. The new documentation and dashboard URLs also returned HTTP 200.
No push, merge, deployment or publication was performed.

No component/API gap required a new family, dependency or shell framework. The
example and its source remain outside the public thirty-two-family count.
Sample records/preferences are deliberately ephemeral. Manual screen-reader
speech, Safari/Firefox and physical touch hardware were not verified. Automated
accessibility checks do not establish full conformance. The production build
retains Vite's advisory about a chunk larger than 500kB; bundle restructuring is
outside this focused composition example.
