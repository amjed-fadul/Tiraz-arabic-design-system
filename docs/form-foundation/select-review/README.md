# Select review fixes

Starting commit: `32622da0862f6702cc7b88012867aa16adfb5e9a`, on the existing isolated `codex/form-foundation` branch. Scope: cancelled reset and validation focus ownership only. Original checkout/index/unrelated edits preserved; no installed dependency changes or native-method patches.

## Trace and implementation

Radix Select 2.4.1 `SelectProvider` installs a target-phase native form reset listener which calls `setValue(initialValueRef.current)` without checking cancellation. In controlled mode that callback runs before React's bubble-phase `onReset`; in uncontrolled mode Radix's own state can already mutate. `SelectBubbleInput` mirrors value through a real native select. The wrapper now always supplies a controlled Radix value, maintains public uncontrolled state locally, and observes reset at the associated native form in capture phase. It suppresses the premature Radix request and commits only uncancelled reset in the next task, after both React cancellation phases. Microtasks alone are insufficient for trusted clicks because they can run between native listeners. Pending tasks are cancelled on unmount, and commits check that the control remains connected to the same form. The public value/callback/ref/form contract is unchanged.

Tiraz's previous invalid capture handler prevented the native event and scheduled focus from every invalid notification, including static checkValidity and cancelled events. Its timer could overwrite an application's explicit summary focus. The timer and invalid interception are removed. A focus-capture handler redirects only actual focus of the native select to the visible trigger, and only while that native select still owns focus. The browser chooses interactive validation order/scope; static validation never initiates focus. Ancestor invalid handlers retain cancellation and summary ownership. No global checkValidity/reportValidity/reset patch is used.

## Test-first evidence

Before product changes, the new unit file failed 12/16 tests: all eight controlled/uncontrolled × nested/external × onReset/onResetCapture cancellations, both static-validation cases and both invalid-event summary-ownership cases. Successful-reset cases already passed and are retained.

Chromium baseline: 29/90 passed, 61 failed — cancelled reset 16 failures, static focus 4 failures, application cancellation/summary ownership 40 failures, and direct control reporting 1 failure. All 20 existing interactive form-order cases passed before the fix and remain required afterward.

The former unit test expecting `form.checkValidity()` to focus the first Select is corrected. It now checks that static validation retains focus and that actual native focus redirects to the trigger. Interactive focus remains verified using real Chromium Submit clicks, Enter, requestSubmit, form/control reportValidity, mixed Input/Select ordering and external controls.

Evidence: [baseline unit failures](unit-before.txt), [fixed focused units](unit-after.txt), [baseline Chromium results](before/results.json), [fixed Chromium results](after/results.json).

## Final verification

- Focused units: 23 passed across the new regressions and existing forms tests. Full suite: 121 passed in 15 files, including strict generated-code and portable-bundle integrity checks.
- Chromium: 90/90 review cases, no errors. Existing native validation: 15/15. Form geometry: 16 combinations; nested form flows: 32 combinations, no errors. The existing successful-reset browser assertions now wait for the committed value after dispatch.
- Existing interaction regressions: passed with no failures. Additional regression suite: 58 checks, no failures. Standalone copied-source host: strict type check, build and 14 browser groups passed with no errors.
- TypeScript/Vite build, lint (no warnings), repository formatting, added browser/report formatting and git diff check passed.
- Independent re-review: no actionable findings; independently repeated 90 Chromium cases. Additional probes covered external form reassociation, both reset cancellation phases, successful/unchanged reset callback counts, latest callback handling, unmount cleanup and ancestor focus ownership. See [review assessment](independent-review/review.json) and [independent browser results](independent-review/results.json).
- Original main checkout preserved: HEAD, branch, index bytes/entries, status, full diff and README/workbench CSS hashes match the before-work snapshot. Work was confined to the existing form-foundation worktree. package.json and package-lock.json are unchanged from the starting commit. No installed dependency file was edited.

Commands: `npm test -- src/system/select-form-regressions.test.tsx src/system/forms.test.tsx --maxWorkers=2`, `npm test -- --maxWorkers=2`, `npm run build`, `npm run lint`, `npm run format:check`, and Prettier checks for changed browser fixtures/scripts and reports. Chromium harnesses: `select-review.mjs`, `native-validation.mjs`, `forms.mjs`, `interactions.mjs`, `regressions.mjs`, plus `tests/ai-exercise/prepare.mjs`. Node 24.21.0 and macOS Chrome were used. The browser harnesses accept `TIRAZ_URL`, `TIRAZ_PLAYWRIGHT`, `TIRAZ_BROWSER` and `TIRAZ_EVIDENCE`.

See [machine-readable summary](verification.json), [full suite output](full-unit-output.txt), [build](build-output.txt), [lint](lint-output.txt), [format](format-output.txt), [additional formatting](added-format-output.txt), [forms](forms/results.json), [native validation](native-validation/results.json), [interactions](interactions/interactions.json), [additional regressions](regressions/regressions.json) and [source-copy build](source-copy/copy-build.json).

Limits: verified in Chromium; other engines, touch and screen readers were not tested. Successful Select reset now commits in the next task after event dispatch; controlled consumers must accept the reset callback. This follow-up changes no public API and begins no other milestone.

## External-form follow-up

The subsequent [association report](../select-association/README.md) records reset handling for a form replaced under the same ID or mounted after Select, with the Select kept mounted. These cancellation and validation-focus results remain covered.
