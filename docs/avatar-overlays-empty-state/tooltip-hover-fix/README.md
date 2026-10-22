# Tooltip focused hover correction

Starting commit: `a6c6b0573838d02231258db7630bb33816956792`.
Branch: `codex/avatar-overlays-empty-state`.
Local Mac checkout: `/Users/amjedfadul/.codex/worktrees/avatar-overlays-empty-state/Tiraz`.
Preview: <http://127.0.0.1:5206/>.

Pointer-down and Escape set dismissal, but the trigger can retain focus. The original leave handler cleared dismissal only inside its unfocused-only timer; a focused trigger remained suppressed on every later hover. Moving the reset to the common leave path fixes this without changing any API, CSS, delay, timer cleanup, focus handler or key handling.

## Reproduction and checks

- [Red unit evidence](unit-red.txt): both new click/Escape cases fail because the Tooltip remains absent after focused leave/re-entry and the full hover delay; the existing 20 tests pass. They check that no stationary-pointer reopening occurs, reopening waits the configured 80ms, and focus/ref/description/name/caller handler counts remain correct.
- [Red Chrome evidence](browser-red.txt) and [captured state](browser-red/documentation-results.json): the actual Arabic TooltipExample fails to reopen while its trigger remains focused after click/leave/re-entry. Its action still reveals details.
- [Complete standalone unit suite](unit.txt): 29 files / 241 tests passed with two local workers.
- Build, lint and source/project/browser formatting passed ([build](build.txt), [lint](lint.txt), [format](format.txt), [browser format](browser-format.txt)); the existing nonblocking bundle-size warning remains.
- [Focused checks](focused.txt): 6 files / 49 tests passed, including Tooltip and overlay contracts, clipboard/generated examples, strict generated compilation and relocated portable-source compilation.
- [Documentation browser checks](browser/documentation-results.json): actual Arabic/English TooltipExample now dismisses immediately on click/Escape, remains closed for 600ms under a stationary pointer, stays closed at 250ms after genuine leave/re-entry, then reopens with focus preserved. Tooltip content remains hoverable. Existing narrow documentation checks and live customization also pass with no page errors.
- [Complete existing browser matrix](browser/results.json): all 48 combinations passed with zero page errors, including unfocused handoff past its grace period, fresh focus, descriptions/refs, Tooltip-before-Modal Escape, live customization and application/OS reduced motion.
- [Independent re-review](../review.md#tooltip-focused-hover-correction-re-review): no actionable findings; 22/22 focused tests and independent Chrome checks passed, including fresh focus, focused/unfocused handoff, refs/descriptions and Tooltip-before-Modal Escape.

The existing browser checks were extended rather than replaced. `TIRAZ_EVIDENCE` selects a separate output directory so original batch evidence is preserved. No new harness or dependency was added.

## Local commands

Use the Mac's installed Node 24.21.0:

```sh
export PATH=/Users/amjedfadul/.nvm/versions/node/v24.21.0/bin:$PATH
npm test -- src/system/avatar-overlays-empty-state.test.tsx src/system/overlay-regressions.test.tsx src/workbench/generated-batch.test.tsx src/workbench/avatar-overlays-pages.test.tsx src/workbench/generated-code.test.ts src/system/ai-registry.test.ts --maxWorkers=4
npm test -- --maxWorkers=2
npm run build
npm run lint
npm run format:check
node node_modules/prettier/bin/prettier.cjs --check tests/browser/avatar-overlays* docs/avatar-overlays-empty-state/tooltip-hover-fix/README.md docs/avatar-overlays-empty-state/{review,verification}.md
TIRAZ_PLAYWRIGHT=/Users/amjedfadul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright \
TIRAZ_EVIDENCE=docs/avatar-overlays-empty-state/tooltip-hover-fix/browser \
node tests/browser/avatar-overlays-docs.mjs
TIRAZ_PLAYWRIGHT=/Users/amjedfadul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright \
TIRAZ_EVIDENCE=docs/avatar-overlays-empty-state/tooltip-hover-fix/browser \
node tests/browser/avatar-overlays.mjs
git diff --check
```

An initial full run concurrent with build/browser/review timed out in `ai-registry.test.ts`'s `tabs.label` integrity test and `generated-data-table.test.tsx`'s copied create/filter/details test. [That run](unit-concurrent-timeouts.txt) is retained; repository test timeout/configuration was not changed. Final standalone full-suite and browser-matrix results are linked from the verification report.

The original checkout, index, two unrelated edits and other servers remain untouched. Port 5206 continues serving the updated source. No push, merge, deployment or further component work is part of this correction. VoiceOver speech was not tested.
