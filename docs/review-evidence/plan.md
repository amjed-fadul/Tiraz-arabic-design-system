# Component customization review plan

Goal: resolve the confirmed behavior defects against baseline 97a532a, preserving the existing README/CSS edits and approved documentation layout.

- [x] Inspect HEAD, dirty files, instructions; create local review/component-customization branch.
- [x] Reproduce density and frozen feedback in Chromium; measure computed metrics; reproduce nested/long menus in a real component fixture.
- [x] Add failing Workbench lifecycle, Switch description, nested modal and browser geometry regressions.
- [x] Fix size/density tokens and Button padding/gap/icon-only metrics, preserving equal variant geometry and readable 14/16px text.
- [x] Separate transient feedback from persisted props; cancel stale callbacks for all contextual edits, reset, navigation, language, unmount. Keep global settings live and inspector states intentional. Make generated examples reflect the lifecycle.
- [x] Scope child menu portals to Sheet content; bound menu height by Radix available-space variable and scroll vertically; verify focus, selection, dismissal.
- [x] Audit every exposed contextual and system control across six pages, clipboard, resets, persistence and overlays. Capture light/dark, Arabic/English, narrow/short browser evidence.
- [x] Run regressions/full suite/generated module checks/lint/build/format; independent reviewer; resolve actionable findings and re-review.
- [x] Save the verification matrix, measurements, evidence, and limitations. No push, merge, deployment, landing-page work, or AI instruction milestone.
