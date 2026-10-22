# Select external form association

Starting commit: `cf6f173659f22b14030862c331f725ecc5a05631`, on `codex/form-foundation` in the existing isolated worktree. Scope: keep a mounted Select aligned with its currently associated form during reset. The previous cancellation and validation-focus fixes remain unchanged.

## Reproduction and trace

Select is associated using `form="choices"`, starts at Alpha (`a`), and changes to Beta (`b`). Replace the form with a new element retaining `id="choices"`, or mount that form after Select already changed to Beta. Reset then leaves the trigger/application at Beta/`b`, resets native value and FormData to `a`, and emits no callback.

The old Tiraz effect reads `nativeSelect.form` only when its scope/form prop effect runs. It therefore remains bound to the old form node or never binds when the form is initially absent. Installed Radix Select 2.4.1 similarly resolves its associated form in an effect and subscribes to that element; its controlled setter changes identity when value changes, so its native reset listener can remain on a detached former form between changes.

The hook now observes document capture and resolves the native select's form at each reset dispatch. This covers connected late/replacement forms immediately, without a MutationObserver, remount or native-method patch. It also keeps a capture listener on the element bound alongside Radix's value/form changes, so resetting a detached former form cannot invoke Radix's stale callback. Duplicate document/form capture of one event is ignored. Only the currently associated form can commit reset; the existing next-task cancellation check and unmount cleanup remain. Selection survives replacement and reset callbacks still require controlled owners to update value. No dependency file was edited and no public API changed.

## Test-first evidence

Before implementation, the new unit matrix had **12 failures / 24 passes**. Chromium independently reproduced **12 failures / 24 passes**, with no page errors. All successful-reset cases for replacement, late insertion and retained former forms failed in both value modes and both reset methods. Cancellation remained green. [Unit baseline](unit-before.txt), [Chromium baseline](before/results.json).

The new matrix covers controlled/uncontrolled values × replaced/late/retained-form lifecycle × no cancellation/onReset/onResetCapture × form.reset()/reset-button clicks. It asserts trigger identity (Select stays mounted), label, native select value, current FormData, application state and exact callback values/counts. Replaced forms are reset again while detached; retained former forms are reset while still connected under another ID. Detached buttons use their native click method; connected reset buttons receive real browser clicks. Chromium replacement cases repeat the cycle after another selection change to exercise Radix listener rebinding.

## Verification

- New association matrix: **36/36 Chromium cases passed**, no page errors. [Fixed browser results](after/results.json).
- Focused unit checks: **59 tests in 3 files passed**. Full suite: **157 tests in 16 files passed**, including generated example compilation and portable bundle checks. [Focused output](unit-after.txt), [full suite](full-unit-output.txt).
- Preserved cancellation/focus matrix: **90/90 Chromium cases**; native validation ordering: **15/15**. Existing form harness: **16 geometry combinations and 32 nested form flows**, no page errors. [Previous fixes](previous-review/results.json), [native validation](native-validation/results.json), [forms](forms/results.json).
- Existing interactions passed; additional regression suite **58 checks**, no failures. Copied-source exercise passed strict type checking, production build and **14 browser groups**, no page errors. [Interactions](interactions/interactions.json), [regressions](regressions/regressions.json), [source-copy](source-copy/copy-build.json).
- TypeScript/Vite build, lint with no warnings, repository and added-file formatting, and git diff check passed. [Build](build-output.txt), [lint](lint-output.txt), [format](format-output.txt), [added formatting](added-format-output.txt). The first build caught an unsupported Playwright locator option in a unit test; it was corrected before the final successful run.
- Independent re-review: **no actionable findings**. Reviewer independently passed focused **59/59**, Chromium **36/36**, additional DOM-only probes **6/6**, and synchronous insertion/replacement/reset probes **16/16**. Repeated connected/detached historical forms, native cancellation, same-task reset and callback counts agree. [Assessment and considered behaviors](independent-review/review.md), [matrix](independent-review/matrix/results.json), [DOM-only](independent-review/extra-results.json), [synchronous](independent-review/synchronous-results.json).
- Original main checkout is preserved: HEAD, branch, index bytes/entries, status, complete diff and README/workbench CSS content hashes match the before-work snapshot. package.json/package-lock.json and installed dependency source are unchanged. No native methods were globally patched.

Commands: `npm test -- src/system/select-association.test.tsx src/system/select-form-regressions.test.tsx src/system/forms.test.tsx --maxWorkers=2`, `npm test -- --maxWorkers=2`, `npm run build`, `npm run lint`, `npm run format:check`, and Prettier on the added fixtures/scripts/reports. Browser scripts: `select-association.mjs`, `select-review.mjs`, `native-validation.mjs`, `forms.mjs`, `interactions.mjs`, `regressions.mjs`, plus `tests/ai-exercise/prepare.mjs`. Node 24.21.0 and macOS Chrome were used. Harnesses accept `TIRAZ_URL`, `TIRAZ_PLAYWRIGHT`, `TIRAZ_BROWSER`, `TIRAZ_EVIDENCE`.

[Machine-readable report](verification.json), [fixed Chromium cases](after/results.json), [focused unit output](unit-after.txt).

Limits: Chromium on macOS verified; other engines, touch and screen readers were not tested. Successful reset commits after event dispatch in the next task; controlled callers must accept onValueChange. No merge, deployment or other milestone is part of this fix.
