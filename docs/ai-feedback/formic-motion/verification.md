# Formic motion replacement — 2026-10-16

Checkout: `/Users/amjedfadul/.codex/worktrees/ai-feedback/Tiraz`

Branch: `codex/ai-feedback`

Starting current HEAD: `28f856dfd090adc5079956cd38a283b9b3d4b5c5`

Preview: <http://127.0.0.1:5251/>

The current branch was inspected and extended in place. No reset to the original batch or earlier weaving commit occurred. The exact resulting local commit is returned in chat.

## Result and reference comparison

The weaving/stitch implementation is removed. LoadingState now has compact Drive/Dots/Orbit pixel pulses, restrained label shimmer and optional host-supplied `elapsedMs`. Existing `indicator` compatibility and Skeleton option remain. ThinkingIndicator has a circle/infinity SVG morph, optional configurable whole `words`, and `textOnly`; width is reserved for the largest word. ThinkingState matches the reference's static four-point glyph, shimmering current summary, chevron, animated disclosure, supplied steps and plain completed summary.

Existing APIs remain compatible. Execution, meaningful labels and elapsed time belong to the host. Cosmetic word rotation has one cleaned-up interval; it never drives execution. The explicit local demo owns its own progress and elapsed timers and cancels on replay/cancel/unmount. No dependencies, public animation controls or extra component families were added. General Spinner, tokens and component styles preceding the AI feedback section are unchanged.

All three live references were available, replayed/expanded and inspected over multiple cycles. [Reference observations](references.md) distinguish measured declarations from sampled approximate word timing. [Implementation samples](implementation-cycles.json) cover 90 observations over about 14.9 seconds: circle/infinity width moves between approximately 6px and 10.5px; all four words appear; the word container remains 54.197px wide; animated frames and words cause **zero live-status mutations**. Grid dimensions, pulse offsets and declared durations match the reference measurements. Tiraz's typography, neutral semantic colors and approved continuous documentation layout are retained.

## Recording and screenshots

- [18-second MP4 recording](formic-patterns.mp4), [GIF preview](formic-patterns.gif), [capture provenance](recording.json). Actual local browser screencast frames, sorted by browser timestamps, encoded with FFmpeg. The clip shows all three grid variants, glyph morph/word changes, disclosure, host completion/replay and the explicitly started connected local demo. It is a recording excerpt; its replay boundary is not a component animation seam.
- UI automation can briefly interrupt screencast delivery around clicks (largest capture gap about 263ms). Smooth disclosure is independently demonstrated by [DOM interpolation samples](disclosure-transition.json): height and opacity continuously fall to zero over the declared 400ms, while hidden/aria-hidden/inert apply immediately.
- [Morph cycle contact sheet](morph-cycles.png).
- [English/light desktop](patterns-en-light-1440.png), [Arabic/dark 320px](patterns-ar-dark-320.png).
- [Arabic documentation desktop](docs-ar-dark-desktop.png), [English ThinkingState documentation at 320px](docs-en-dark-narrow.png).

## Browser verification on the Mac

- [32-case component matrix](matrix.json): Arabic/English × light/dark × 1440/320 CSS pixels × sage/blue/plum/clay. Measured viewport widths match targets; no document/section horizontal overflow. Both scripts, directions, themes, small glyphs and narrow wrapping inspected visually.
- [Shared customization](customization.json): standard density and large typography at 320px in both languages/themes; 16px body text and no overflow. Semantic feedback stays neutral; accent controls and focus use the shared theme.
- [24-case documentation matrix](docs-matrix.json): all three continuous pages, both languages/themes/widths, expected headings and no horizontal overflow. Inspector, generated examples, variants and text-only options remain integrated.
- [Provider and OS reduced motion](reduced-motion.json): CSS animations stop, SMIL is removed, disclosure becomes immediate and the first whole word stays unchanged beyond a rotation interval. OS preference was emulated per tab and cleared afterward; macOS settings were not changed.
- [Keyboard/focus/status checks](interactions.json): Enter/Space disclosure in both directions, Tab skips collapsed details, focused input collapse and replacement of a focused child return focus to the trigger. One host label update produces one meaningful polite status change.
- [Demo lifecycle](demo-lifecycle.json): elapsed text changes without extra live updates; replay preserves the new deadline; cancellation remains cancelled past stale deadlines and retains Cancel focus; unmount/remount returns to idle. Fake-clock regressions additionally assert zero stale timers on unmount and reduced-motion timer cleanup.
- Arabic words are complete connected text nodes, not per-letter elements. Whole-word transitions and elapsed values are decorative; accessible labels remain stable. Active disclosure remains available.

## Local checks

Existing Node 24.21.0 selected through PATH. No dependency/lockfile changes.

- `npm test -- --maxWorkers=1 --testTimeout=20000`: **64 files / 542 tests passed**.
- Final focused `ai-feedback`, demo, pages, registry, generated-code and prompt suites: **6 files / 126 tests passed**. Includes explicit Drive/Dots/Orbit and words/textOnly generated cases, Arabic/English examples and relocated source-only compilation.
- `npm run build`: TypeScript and Vite passed. Existing >500kB bundle advisory remains.
- `npm run lint`: passed.
- `npm run format:check`: passed; fixture/evidence/report formatting also checked explicitly.
- `git diff --check`: passed.
- Independent review and final re-review: **no actionable findings**. Reviewer separately passed four focused files / 25 tests. See [review record](../review.md).

During implementation, new regressions first exposed missing new props/timer behavior; an integration test then caught the generic playground normalizer resetting Orbit to Drive. The normalizer now handles loading variants explicitly; the regression and final full suite pass. Browser automation limitations in screenshot resizing were handled by saving settled, visually inspected screenshots; no product workaround was added.

## Limits and preservation

DOM/ARIA checks do not establish actual VoiceOver speech. Safari/Firefox and other screen readers were not manually tested. SVG morph uses native SMIL; cross-browser rendering should be verified in a consuming app. No real AI/network service is invoked or implied. The implementation matches observed geometry and declared visual rhythms; no claim of pixel-identical rendering across fonts/browsers is made.

The original checkout/index/README/workbench CSS and `.claude/` are preserved. Landing remains at `9881dbc9c8b52aa80aea38e79ab9476b45f5bb0a`. Existing server PIDs/ports, including preview 5251, remain running. No push, merge, deployment or landing change was performed. Older textile evidence remains historical and is superseded by this report.
