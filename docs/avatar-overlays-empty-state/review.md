# Independent review

An independent reviewer inspected the source/diff, AGENTS.md, portable bundle, dependency graph and Chrome preview. It did not modify files.

## Confirmed findings and corrections

1. Short viewports with a wrapped Arabic title/description could leave zero usable body height. Modal now has one internal `.tz-modal-scroll` region containing header/body/footer. Nested overlay portals use the outer Content node, outside that scrolling region. Re-review at 320×240 confirmed initial focus, visible Select/menu, automatic scroll during Tab navigation, accessible footer, dismissal and trigger restoration.
2. An empty Tooltip installed an Escape listener even though it showed nothing. The listener now follows actual visible-content eligibility. A regression failed before the correction and passes afterward. Tooltip's Escape also closes only Tooltip before its enclosing Modal.
3. Browser verification found two Radix dismissable-layer/focus-scope versions in the baseline lockfile: Select used 1.2.1/1.3.1 while Dialog/Menu/Toast used 1.2.0/1.3.0. Their JavaScript implementations were independently compared and identical, but separate module instances created separate contexts. Targeted host overrides align the already-installed patches. The regression demonstrated a first Select Escape closing both Select and Modal before alignment; afterward it closes only Select, restores its trigger, and a second Escape closes Modal. Source-only dependency guidance carries exact host overrides and the inspection/interaction check. Vite required forced dependency re-optimization before browser verification reflected the corrected graph.

Browser inspection also found that fresh keyboard focus immediately after dismissing a hovered Tooltip could remain suppressed during the pointer-leave grace period. Tooltip now separates pointer-origin focus suppression from fresh keyboard focus; the regression fails before the change and passes afterward.

## Final re-review

No concrete findings remained. The reviewer confirmed the corrected short Arabic viewport and scoped overlays in Chrome, the deduped dependency graph and portable instructions, and Select's two-stage Escape/focus behavior after Vite re-optimization. It checked the installed Radix Slot's handler/ref/description merging used by Tooltip. Final independent focused run: 3 files, 30 tests passed.

## Tooltip focused-hover correction re-review

The user reported a click/Escape hover regression starting from `a6c6b0573838d02231258db7630bb33816956792`. Pointer-origin focus kept the trigger focused, so the unfocused-only leave path never cleared dismissal. The smallest correction moves `dismissed.current = false` to the common pointer-leave path, independently of focus. The delayed hide timer remains conditional on focus; hover re-entry still schedules the existing delay.

A fresh independent reviewer read AGENTS.md, the portable bundle and the change, and reported no actionable findings. Its local focused run passed 22/22 tests. Independent Chrome checks exercised the real TooltipExample in Arabic and English at 320×568: click/Escape remained dismissed for 650ms with a stationary pointer; genuine leave/re-entry while focused stayed closed at 250ms and subsequently opened. Focused and unfocused trigger-to-tooltip handoff survived 150ms. Immediate fresh keyboard focus, refs/descriptions and Tooltip Escape before Modal Escape were preserved. No browser page errors; `git diff --check` clean. The reviewer did not edit, commit or push files.

Parent verification and red/green evidence for this correction are recorded under [tooltip-hover-fix](tooltip-hover-fix/README.md) and in the updated verification report.
