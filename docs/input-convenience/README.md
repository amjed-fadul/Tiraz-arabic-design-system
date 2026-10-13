# Input convenience and documentation

Base: `ed6484d4b2075741cbd81cab959764d7e2183ec6`. Local branch: `codex/labeled-input` in `/Users/amjedfadul/.codex/worktrees/labeled-input/Tiraz`. Working preview: http://127.0.0.1:5174/. No push, merge, deployment or Table work.

## Change

`<Input label="اسم العميل" placeholder="أدخل الاسم" helper="كما يظهر في الفاتورة" error={nameError} required />` uses the existing Field internally. The typed convenience branch requires label for helper/error and excludes field composition. Standalone Input and `<Field>{field => <Input field={field} />}</Field>` remain supported. Native attributes/events/forms and React 19 ref, className/style stay on the actual input. Existing association logic merges external description IDs; generated IDs remain stable when error content appears/disappears. Error display marks invalid but runs no validation rules.

Input is the primary text-entry page. Field remains exported and in the accurate nine-family registry/catalog, with its full composition reference inside Input's API disclosure. Eight navigation pages remain. Saved Field pages redirect to Input; Input customization persists. An old invalid preset becomes editable error text, leaving one error control rather than a duplicate Invalid toggle. Ordinary Input inspector edits keep its native node, associations and entered value; mode/initial-value and explicit reset still remount the demonstration when necessary.

The Input inspector contains Label, Placeholder, Helper, Error, Required, Size, Disabled and Read-only. Its playground, generated code and complete clipboard prompt use direct Input. Examples cover a basic native input, labeled helper text, required/error, disabled and read-only. Sheet retains connected customer creation; Select has a small status example. Bundled CreateCustomer now uses direct labeled Inputs and existing Field+Select composition, preserving source-copy portability. No Select implementation/API, Field or association implementation, CSS layout, dependency or public export changes were needed. AGENTS.md records the standing preview preference.

## Verification

- Baseline: 157 unit tests passed. Test-first convenience/page cases: 7 failed / 2 passed before implementation. Supplemental controlled/uncontrolled inspector tests reproduced 2 failures before the remount fix. [Initial failures](test-first-output.txt), [inspector failures](inspector-before-output.txt).
- Final: **169 tests in 18 files**, including strict generated positive/negative Input typing, complete clipboard output, native forms, Field compatibility, stable associations, customer flow and library-only copy compilation. Focused checks: **16 tests in 5 files**. [Full suite](full-unit-output.txt), [focused units](focused-unit-output.txt).
- Chromium: **16 before and 16 after captures**, Input and Sheet × Arabic/English × light/dark × 1440px/390px. Focused checks cover associations, native state controls, error clearing, same ID, saved-page redirection, customization persistence, full clipboard contents, shared density/type/accent/radius and customer validation/focus/single save. No page errors. [Before](before/results.json), [after](after/results.json).
- Existing interactive mixed Input/Select and external-form validation: **15 cases passed**. [Results](native-validation/results.json).
- Independent review and re-review: **no outstanding actionable findings**. Reviewer independently passed **30 distinct tests across 7 files**, checked generated typing and library-only copy portability, verified control/node/ID/value stability through inspector changes in both state modes, and inspected English 320/390px plus Arabic desktop. The remount finding was resolved and re-reviewed. [Assessment](independent-review/review.json), [browser stability](independent-review/remount-fix.json).
- TypeScript/Vite build, lint without warnings, repository/added-file formatting and git diff check passed. [Build](build-output.txt), [lint](lint-output.txt), [format](format-output.txt), [added formatting](added-format-output.txt).

Commands: `npm test -- --maxWorkers=2`, focused Vitest for labeled-input/labeled-input-page/generated-code/customer-flow/form-playground, `npm run build`, `npm run lint`, `npm run format:check`, Prettier checks for AGENTS/browser harness/report files, `tests/browser/labeled-input.mjs`, and `tests/browser/native-validation.mjs`. Node 24.21.0 was used. Browser harnesses accept TIRAZ_URL/TIRAZ_PLAYWRIGHT/TIRAZ_BROWSER/TIRAZ_EVIDENCE. Documentation preview remains running on the working branch.

## Visual comparison

[Input before](before/input-ar-light-1440.png) · [Input after](after/input-ar-light-1440.png). [English narrow/dark Input](after/input-en-dark-390.png) · [Arabic narrow Sheet](after/sheet-ar-light-390.png). All matrix captures are retained alongside their results. Observed labels/help/errors, narrow wrapping, native field geometry and theme contrast; shared typography/density/radius/accent remained applied. The approved article, rail placement, language/theme controls and one-line prompt/Copy row remain.

## Preservation and limits

Original `/Users/amjedfadul/Tiraz` HEAD/branch, exact index bytes/entries, status, complete diff and unrelated file hashes match the before-work snapshot. Existing localhost servers were not stopped or changed. Work stays in the isolated branch; no remote action is part of this task.

Verified with Chromium; screen readers, touch and other engines were not manually tested. Customer data is in-memory example state. Application validation and controlled-reset ownership remain explicit.

[Machine-readable summary](verification.json).
