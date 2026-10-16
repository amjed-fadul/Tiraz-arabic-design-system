# Documentation consistency review — 16 October 2026

Baseline: `80543531f1634cf0b77c71b48d6d66acb12bb707`.
Branch: `codex/consistency-review`.
Checkout: `/Users/amjedfadul/.codex/worktrees/consistency-review/Tiraz`.
Preview: <http://127.0.0.1:5274> (retained).

| Severity | Confirmed before                                                                                                                   | Small fix and verified after                                                                                                                                                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P2       | Select/RadioGroup: edit Options into invalid or unapplied JSON, then Reset while the model is still default. Draft/error survives. | Explicit reset remounts inspector controls only. Defaults return, error clears and the reset button retains focus. [Before](evidence/before-collection-reset.png) / [after](evidence/after-collection-reset.png).                                                                    |
| P2       | FileDropzone: set maximum files to 1 or accept `.csv`; help still promises PDFs/images and 3 files, including copied examples.     | Constraint-neutral bilingual default help in model and portable example; migrate only historical default strings, retain custom help. Actual CSV acceptance and second-file rejection verified. [Before](evidence/before-file-helper.png) / [after](evidence/after-file-helper.png). |
| P2       | CustomerDataTable loading/error presets announce `0–0 of 0 customers` although data is unavailable.                                | Localized loading/unavailable count copy; Retry restores `1–10 of 26 customers`. Both languages checked. [After](evidence/customer-unavailable-en-dark.png).                                                                                                                         |
| P3       | A one-file rejection says `Maximum of 1 files.`                                                                                    | Singular `file` for limit 1; plural otherwise. Actual second-file rejection regression and browser check pass. [After](evidence/after-file-helper.png).                                                                                                                              |

No redesign, new components, dependencies or public APIs. Continuous page order,
combined customization rail and navigation groups retained. Other component source
remains unchanged. Independent read-only review identified the first three issues;
re-review of the fixes and final singular wording found no actionable issues.

## Local verification

- Baseline: 66 test files / 555 tests passed. Final: `npm test -- --maxWorkers=2`, 66 files / 563 tests passed, including generated example type-checking, copied-code execution and portable registry/source checks. Eight new regression cases observed failing before their fixes. Focused final file checks: 25/25 passed.
- `npm run build`, `npm run lint`, `npm run format:check`, and `git diff --check` pass. Build retains the existing large-chunk warning.
- Mac Google Chrome: visually reviewed all 50 navigation pages in Arabic/light and English/dark, including their examples. Browser matrix: 600 settled cases (50 × 4 language/theme combinations × 1440/390/320px), no page overflow or uncaught errors. Field remains documented under Input.
- 100 bilingual checks: shared theme/accent/density/radius/typography/motion reach playground and examples; contextual edits, reset and actual clipboard code/full-prompt equality pass. All 50 navigation destinations traversed by Tab in both languages with visible focus and scrolling. Composite OTP/file/color focus rings checked directly.
- Connected Dashboard filtering, sorting, creation/validation/cancel/focus; forms/reset; nested overlays and popups; FileTree selection/preview/keyboard; TaskRows disclosure/replay/retry; AI feedback simulation/cancel/replay; ToolChips → real ToolCall details/focus and failed-call retry/reset pass. Existing Dashboard, form-validation, avatar-overlays, FileTree and TaskRows browser checks exercised these flows.
- OS and application reduced motion tested separately; activity rotation/SVG/CSS stop while feedback remains. Normal animation verified in both themes. Narrow and short overlay layouts, keyboard dismissal and focus restoration checked.
- Source-only copy of the whole library: standalone strict compilation, Vite build and browser exercise pass. Original fixed-delay browser scripts raced Select/Tab focus and Toast F8; diagnostic copies awaited observable state/focus instead. No application workaround or verification framework added. Initial unrestricted Vitest run timed out Dashboard filtering and a registry mutation check under concurrent load; bounded-worker full rerun passes.

Direct verification is local Chrome/DOM/pointer/keyboard behavior on this Mac.
Screen-reader announcements, physical touch devices, Safari/WebKit and Firefox
were not tested. Automated accessibility scans do not establish those behaviors.

Representative captures: [Arabic/light FileTree](evidence/file-tree-ar-light.jpg),
[English/dark connected tools](evidence/tool-connected-en-dark.png),
[narrow visible focus](evidence/narrow-visible-focus.png),
[Dashboard customer creation](evidence/dashboard-created-customer.png).
Full local captures/results/logs: `/tmp/tiraz-consistency-review/` (not committed).
