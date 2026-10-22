# Files and colors batch

Baseline: 89f7987a22ea828007bd823f024fbd416874a725. Scope: the user's FileDropzone/ColorPicker brief, implemented inline on the Mac with no new dependencies.

- [x] Focused tests first: file validation parity, partial rejection, caps, duplicates, focus, reset and disabled; opaque HEX editing/commit/synchronization, controlled state and reset.
- [x] Native FileDropzone and ColorPicker with Field associations, compact semantic tokens and forwarded input refs. File selections stay in React; clear native picker for reliable reselection. Applications construct FormData from the selected File array. Multiple appends; single replaces on first valid file; duplicates match name/size/type/lastModified and are rejected with feedback.
- [x] Continuous docs, minimal inspectors, connected local examples, generated code/full prompts, exports, registry and portable guidance. Files navigation becomes visible. Dashboard unchanged.
- [x] Focused/full/generated/portable tests, build/lint/format and local browser evidence across language/theme/viewport/customization/motion. Independent source/evidence review, fixes and re-review.
- [x] Local commit, preserve original checkout/index and port 5213, retain free-port preview and report evidence/limitations.

Review focus: canceled/external reset; controlled parents rejecting changes; duplicate files in one batch; single-mode invalid replacement; incomplete text losing focus to swatches; long mixed-direction filenames; native picker versus simulated chooser events.
