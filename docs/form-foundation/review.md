# Independent review — 2026-10-13

A fresh reviewer inspected the user requirements, AGENTS.md, portable guidance, implementation, generated examples, workbench normalization and customer lifecycle, and performed independent Chromium checks.

1. Controlled Input playground passed both value and defaultValue, producing a React warning. Fixed by passing defaultValue only in uncontrolled mode; added a console-warning regression. Reviewer confirmed the fix.
2. Native required Select redirected focus on every invalid event, leaving focus on the last Select. Regression reproduced before the fix. The reviewer also reproduced mixed Select/Input ordering, and distinguished programmatic requestSubmit from trusted user clicks. Final implementation finds the first invalid form-associated control, schedules trigger focus in a subsequent task, cleans the timer on unmount, and checks connected/enabled/still-invalid state. Unit and real-browser regressions cover the fix.

Final independent assessment: no remaining actionable findings. Reviewer independently passed all 15 native-validation cases across Submit clicks, Enter and requestSubmit, with Select-only, mixed-order and external form-associated controls. The reviewer also verified the early-opening nested Select at 320×420 and reran targeted form/customer tests.

Consumer composition cleanup also retains one external draft-error description in the independent exercise, avoiding duplicate identical messages.

No deferred findings or new milestone scope.
