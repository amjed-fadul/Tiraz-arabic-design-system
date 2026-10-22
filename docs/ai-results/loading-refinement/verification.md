# Image loading refinement

ImageResult now combines a soft Skeleton backdrop, an image placeholder and the existing Progress primitive. Optional `progress={42}` displays a localized percentage supplied by the host. Missing, null or nonfinite progress stays indeterminate; finite values clamp to 0–100. Reaching 100 does not replace actual image readiness. No timer or transport service fabricates progress.

The documentation defaults to loading and provides an inspector percentage plus a clearly labelled local sample slider. Percentage updates preserve the image and frame instead of restarting the request. Loading and loaded documentation frames retain the same 640 × 426.66px size.

## Verification

- Full suite: 682 tests across 74 files passed, including generated examples, source-only relocation and production example asset checks.
- Focused component/metadata/generated-code/prompt checks: 164 tests passed. Component plus new workbench integration checks: 33 tests passed.
- TypeScript, Vite production build, Oxlint, project Prettier and diff whitespace passed. Existing production chunk-size warning remains.
- Chrome: Arabic/English × light/dark × 1280×900 and 320×568, no horizontal overflow. Shared large typography and reduced motion checked; Skeleton animation and progress transitions stop.
- Progress updates, unknown/invalid percentages, Arabic formatting, image retention and 100%-while-loading covered by regressions. Existing image failure/retry coverage remains green.
- Independent review found and verified the fix for an inspector-induced remount. Final re-review approved with no actionable findings, including final documentation sizing.

[Browser measurements](browser.json) · [Representative screenshot](loading-preview.png)

The original [interaction recording](../interaction.mp4) documents image failure/recovery and the connected results patterns. It predates this percentage refinement.

Preview remains at <http://127.0.0.1:5327/> in `/Users/amjedfadul/.codex/worktrees/ai-results/Tiraz`, branch `codex/ai-results`. Work remains local only. Physical devices, screen readers, Safari/WebKit and Firefox/Gecko were not tested.
