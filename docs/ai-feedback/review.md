# Independent AI feedback review

A fresh reviewer inspected the local diff against `3eb0b8c9a5c49707fdb24d4e3999b52b8668311e`, without editing source.

| Finding                                                                                                                       | Resolution                                                                           | Evidence                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| P2: controlled collapse plus removal/replacement of the focused child skipped recovery because post-commit containment failed | Preserve captured panel focus ownership; deliberate departures still clear ownership | Failing-then-passing unit regression and browser replacement/collapse probe        |
| P2: conditional Cancel removal dropped keyboard focus on cancellation or completion                                           | Keep Cancel mounted, guard inactive activation and expose aria-disabled              | Failing-then-passing unit regression, completion/cancellation browser focus checks |
| P2: registry families appended while catalog families were prepended                                                          | Match registry order to catalog                                                      | Existing registry integrity test and independent re-review                         |

Re-review: **no remaining actionable findings**. Reviewer independently confirmed removed-child collapse recovery, outside focus, label/description separation, `announcement="off"` and registry order. Actual screen-reader speech was outside the source/JSDOM review.

## Textile motion refinement — 2026-10-16

A fresh independent review against `2dd01e92cf08da213f7a6289042a7b57111e835c` found **no actionable findings**. It checked SVG over/under drawing order, 1.62-second cycle endpoints, 540ms stitch offsets, reduced motion, active ThinkingState reuse/naming/disclosure, and portable documentation. The reviewer independently passed three suites / 19 tests and `git diff --check`; no files were edited. No review fixes were required. See the [current verification](motion/verification.md).
