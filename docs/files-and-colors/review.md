# Independent source and browser-evidence review

Reviewed locally in `/Users/amjedfadul/.codex/worktrees/files-and-colors/Tiraz`, branch `codex/files-and-colors`, against baseline `89f7987a22ea828007bd823f024fbd416874a725`. This review covers the working-tree changes, including newly added files. The reviewer read AGENTS.md and the portable AI guidance, inspected the source/contracts, ran focused tests independently, and inspected the supplied browser screenshots and records. No component source was changed by the reviewer.

## Result

No outstanding actionable source or rendered-layout findings after the fixes below. This is a source/evidence review, not a manual screen-reader conformance claim. The final operating-system file-dialog recheck has the limitation recorded below.

## Findings and re-review

All line references below identify the final source locations of the corresponding fixes.

| Severity | Finding and reproduction | Final location | Re-review |
| --- | --- | --- | --- |
| P2 | Controlled ColorPicker retained stale invalid feedback: enter `#1`, blur, then replace the controlled value with `#abc`. HEX became valid while the error/aria-invalid remained. | `src/system/ColorPicker.tsx:80` | External replacement now clears draft and feedback together; regression test passes. |
| P2 | File example could report files absent from its visible uncontrolled picker: select a file, then change `multiple`; the old key remounted only the child while parent reporting state survived. | `src/system/ai/examples/FileDropzoneExamples.tsx:48` | Key now depends on mode only. Runtime example test verifies selection/report/reset remain synchronized through a multiple change. |
| P2 | Explicit native `aria-invalid="false"` incorrectly painted an error border because the new CSS matched attribute presence. | `src/system/components.css:2184` | Exact-value selector reviewed; final suite/browser checks pass. |
| P2 | Keyboard Browse names lacked their Field context, making multiple file fields indistinguishable. Standalone `aria-label` composition needed the same treatment. The native color chooser also had a generic name across multiple color fields. | `src/system/FileDropzone.tsx:204`; `src/system/ColorPicker.tsx:137` | Visible Browse and native color chooser names now preserve context and action text. The standalone Browse whitespace regression was corrected using separate ID references; tests pass. |
| P2 | The cleared native file input remained exposed to accessibility tools as an additional empty file control, contradicting the displayed selection. This was identified during the implementer's native Chrome inspection and reviewed jointly. | `src/system/FileDropzone.tsx:235` | Native input now uses `hidden`; visible Browse owns keyboard access, names and descriptions. This avoids programmatic focus into an aria-hidden control. Post-change scripted Browse selection, removal focus and keyboard-order checks pass. |

Core source contracts were also checked: browse/drop share one validation path; accepted files survive partial/total rejection; duplicate policy is explicit; removal returns focus to Browse; reset ownership/cancellation and external form association are explicit; HEX drafts and committed opaque RGB values are separate; submission uses the committed hidden color. No dashboard source changes were found. Exports, examples, generated-code wiring, registry and portable guidance agree with these contracts.

## Independent verification and visual evidence

The reviewer independently ran:

```text
/Users/amjedfadul/.nvm/versions/node/v24.21.0/bin/node node_modules/vitest/vitest.mjs run src/system/files-colors.test.tsx src/system/files-colors-examples.test.tsx src/workbench/files-colors-pages.test.tsx
3 test files passed; 23 tests passed.
```

The final supplied local suite log reports 48 test files and 419 tests passing. Build, lint and formatting checks also pass in the final records. The final initial-default capture uses lazy state; re-review found no contract change from that lint repair.

The final [browser results](browser/results.json) contain 30 passing checks, no page/console errors, no horizontal overflow at the recorded widths, and two scoped axe passes. Screenshots independently inspected include Arabic/dark and English/light 320px long-file layouts, Arabic/light desktop color layout, both narrow color layouts, native-color keyboard focus, the customized color example, and dark file keyboard focus. They show readable wrapping, mirrored controls with LTR HEX, distinct focus/selection indicators, and shared density/type/radius/accent changes. The customized invalid draft remains visible while the sample and submitted value retain the committed color. The continuous documentation layout and Files navigation remain present.

## Native interaction versus simulation

- The implementer's [native interaction record](native-checks.md) documents actual installed-Chrome/macOS UI: an Open sheet selected `/tmp/tiraz-local-browse.txt`, displaying its name and 35 B; the native color chooser's Red channel changed from 128 to 50, producing HEX/sample `#325475` and clearing the prior preset selection. The actual color chooser was reopened and checked after the appearance/contextual-name changes.
- The repeatable browser script clicks Browse, observes the browser filechooser event, then uses Playwright `filechooser.setFiles` with an existing local file. This verifies the final hidden-input Browse path, but does not automate the operating-system panel.
- Scripted color events and DataTransfer/drag events are synthetic. They are labeled as such in the results; they do not establish physical Finder dragging or operation of the native color popup.
- After the native file input gained `hidden`, the attempted final actual macOS Open-sheet recheck could not proceed because the Mac was locked. No unlock was attempted. The final Browse/filechooser path, selection, removal focus and keyboard order passed automation; actual OS-panel interaction was performed earlier. Manual screen-reader behavior and physical OS drag/drop remain unverified.
