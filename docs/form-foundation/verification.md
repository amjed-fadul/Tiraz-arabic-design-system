# Tiraz form foundation — 2026-10-13

Base: `2a84c371dc87110c0bb9aa271fb5c003a8255f02`. Branch: `codex/form-foundation` in an isolated managed worktree. Original checkout/index/README/layout edits remain untouched. The milestone results below are historical; the latest Select review fixes and branch push are recorded in the [follow-up report](select-review/README.md).

## Chosen APIs

- `Field({label, helper?, error?, required?, id?, className?, 'aria-describedby'?, children})`: children is `(control: FieldControlProps) => ReactNode`. Pass `field={control}` to one Input or Select. Stable IDs link label/help/error; external description IDs are deduplicated and preserved. No cloning or validation engine; application rules supply errors. Workbench metadata is `WorkbenchField`.
- `Input`: native `ComponentPropsWithRef<'input'>` with native size/type/children replaced; supported text/email/password/search/tel/url types, default text/sm, sm/md, invalid and field. React 19 ref targets HTMLInputElement. Native editing/selection/autofill/form behavior remain; controlled reset is application-owned.
- `Select`: Radix Select 2.4.1, unique nonempty `{value,label,disabled?}` options, value/defaultValue/onValueChange, placeholder, required/disabled, sm/md (sm default), invalid/field and native button attributes/ref. name/form/autoComplete configure the hidden native select. Native submission/reset/required work; controlled reset requires accepting the value callback. Static checkValidity leaves focus unchanged. Interactive native focus follows browser validation order and redirects the hidden select to its trigger; application invalid cancellation/summary focus are respected. Cancelled reset preserves value and emits no reset callback; successful reset waits until event dispatch completes. Popup uses nearest SystemProvider/Sheet container, popper collision handling, bounded internal scrolling and opacity-only motion.

Dependency check: inspected [official Radix Select API](https://www.radix-ui.com/primitives/docs/components/select), package peer dependencies (React 19 supported), installed types and native reset implementation before integration. Existing locked package versions retained.

## Connected example

Create customer → Sheet → application validation → in-memory customer list → Toast. Name required; email optional and validated with the native email validity rule when supplied; status Select has Arabic/English labels. Invalid values remain for correction. Submission focuses first invalid input. Cancel, close and Escape discard unsaved draft/errors; reopening starts clean. Synchronous guard prevents rapid duplicate submission; trigger remains for focus restoration. State lasts only while the example is mounted, with no backend/session storage.

The original Sheet editing regression remains, upgraded to Field/Input, alongside the new creation flow. The independent copied-source exercise uses the new three families and preserves its explicit unavailable DataTable request with an application-owned semantic HTML table.

## Measurements and visual inspection

At both 14px and 16px typography, equivalent Button/Input/Select sizes align exactly:

| Density  | sm height / inline padding | md height / inline padding |
| -------- | -------------------------- | -------------------------- |
| compact  | 32px / 10px                | 36px / 12px                |
| standard | 36px / 12px                | 40px / 16px                |

Measured all 16 direction/theme/density/typography combinations with settled fonts. Inspected Arabic shaping/mixed text, neutral surfaces, semantic errors, focus outlines, dark/light styling and short/narrow nested popups. The 32 compact/standard combinations at 320×420 and 800×340 exercise internal Sheet scrolling, viewport fit, scope, stationary pointer, early End/Enter, selection/restoration, Escape and modal Tab behavior. Motion uses a fade with no transform; app and OS reduction are checked.

## Verification

Final command outcomes and full output are saved beside this report. Browser scripts accept `TIRAZ_URL`, `TIRAZ_PLAYWRIGHT`, `TIRAZ_BROWSER` and `TIRAZ_EVIDENCE`. Node 24.21.0 was used because the shell's Node is below the repository engine requirement.

- Full Vitest suite, including generated-code compilation and portable source/type registry integrity: 105 tests, 14 files; `npm test -- --maxWorkers=2`.
- Generated examples: all nine families in Arabic/English, both state modes, all supported Input types, disabled/required/error presets and Button appearance combinations compile with strict TypeScript.
- Forms browser: 32 compact/standard short/narrow flow cases, plus eight desktop customer form/error captures at large typography; no page errors or failures.
- Inventory customization: 82 global-setting groups, 18 contextual/clipboard/persistence groups, 108 page renders and 36 reset groups; no page errors/failures.
- Native validation: 15 actual click/Enter/requestSubmit cases for mixed order and external form association. Reviewer independently repeated these.
- Existing interactions and regressions remain; Sheet editing save/cancel/focus retained. Menu race harness records opening animation at the actual End event, avoiding protocol-delay misclassification without weakening its early-motion assertion.
- Independent source-copy host: complete bundle copied without workbench/root README; strict type check, production build and 14 browser groups, including nested copied Select, pass.
- Lint, TypeScript/Vite build, repository formatting and formatting of added tests/guidance.

Earlier concurrent runs hit existing timing deadlines/Toast expiry while the machine was busy, and live source edits invalidated browser fixture state. Final checks run against settled source; the full suite uses two workers. First-invalid defects were reproduced with failing regressions and fixed rather than attributed to load. See [independent review](review.md).

## Limitations

Single select only; no search/multi-select or Table/DataTable family. No backend persistence or network operation. Controlled Input reset requires host onReset; controlled Select accepts the reset value callback. Option values must be unique/nonempty and labels meaningful. Verified in Chromium on macOS; screen-reader announcement quality, touch/swipe, forced-colors and other browser engines were not manually tested. DOM/keyboard checks and screenshots are evidence, not a full accessibility certification.

## Changed files and representative captures

See [changed implementation files](changed-files.md) for the complete source/test/documentation list. The evidence directories retain all nine documentation pages and the overlay/flow matrix.

- [Arabic/light/narrow Select in Sheet](browser/rtl-light-compact-normal-320-popup.png)
- [English/dark/short Select in Sheet](browser/ltr-dark-standard-normal-800-popup.png)
- [Input documentation, Arabic/light](customization/input-ar-light-desktop.jpg)
- [Select documentation, English/dark](customization/select-en-dark-desktop.jpg)
- [Arabic desktop validation](customer-captures/ar-light-compact-invalid.png)
- [English dark desktop form](customer-captures/en-dark-standard-form.png)
- [Computed geometry and flow results](browser/results.json)
- [Nine-page customization results](customization/customization.json)
- [Native validation ordering](native-validation/results.json)
- [Copied-source browser results](source-copy/browser-results.json)
- [Original checkout preservation](original-preservation.json)

## Select review follow-up

See [cancelled-reset and focus-ownership verification](select-review/README.md) for the regressions, Radix trace, before/after Chromium results and independent re-review of the fixes starting at `32622da0862f6702cc7b88012867aa16adfb5e9a`. The public API and dependency lock remain unchanged.
