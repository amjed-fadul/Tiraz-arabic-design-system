# Khayt design QA

Date: 22 October 2026. Worktree: `woven`, branch: `claude/woven`.

final result: passed

## Target and comparison

The owner selected concept **3, Khayt / خيط**, from the mascot exploration.
The selected source board was inspected alongside the implemented studio and
agent panel screenshots. Its defining features are preserved: four rounded
cotton tiers, ivory spool rims, dark oval eyes, a loose hooked thread, and a
plum identity color. Material shading is retained through color changes.

Intentional adaptations: the editorial concept board becomes an interactive
studio using Tiraz's existing layout and controls. The eyes keep one consistent
construction across states, with gaze, blink, and squash conveying expression.
The existing app panels retain their operational controls. The concept board's
Arabic avatar/header color mismatch is corrected by sharing one identity color.

Local preview: `http://127.0.0.1:5411/illustrations/khayt`.

## Evidence

- [Recorded motion preview](docs/woven/khayt-motion-preview.mp4), captured from
  the actual interactive canvas through thinking, working, waiting, and done.
- [In-context preview](docs/woven/khayt-context-preview.png).
- Eight full-page screenshots: Arabic and English, light and dark, at 1440 px
  and 390 px. Temporary evidence: `/tmp/tiraz-khayt-20261022/studio-*.png`.
- Actual Invoices and Customer profile panel screenshots, palette popover,
  black/white custom colors, and 24/32/48 px samples inspected locally.
- Browser results: `/tmp/tiraz-khayt-20261022/results.json`, `lifecycle.json`,
  and `bounds.json`. Throwaway scripts are outside the repository.

## Interaction checks

| Check                                                       | Result                                  |
| ----------------------------------------------------------- | --------------------------------------- |
| Arabic / English reading order and numerals                 | Passed                                  |
| Desktop / phone horizontal overflow                         | None                                    |
| Six state controls and task playback                        | Passed                                  |
| Explicit decision before preview completion                 | Passed; no send action exists           |
| Pause holds pose; resume continues                          | Passed with canvas pixel comparison     |
| Done and waiting settle                                     | Passed; finite animation stops          |
| Reduced motion                                              | Static poses with readable status       |
| Hidden document / return                                    | Animation pauses and resumes            |
| Unmount                                                     | No drawing into the removed canvas      |
| Palette Escape / focus restoration                          | Passed                                  |
| Color persistence and matching panel tint                   | Passed across reload                    |
| Very dark / white identity colors                           | Readable eyes; neutral name/status text |
| H1 count / polite announcement count                        | One each; announcement empty at mount   |
| Axe, new studio, eight viewport/theme/language combinations | Zero violations                         |
| Browser JavaScript errors                                   | None                                    |
| Motion bounds, 80 sampled poses per state                   | No clipped pixels at canvas edges       |

An unloaded single-browser check measured 61 animation frames over roughly one
second. This is a local smoke check, not a cross-device performance guarantee.

## Fixes from review

1. Reduced the thread reach to prevent clipping during the working gesture.
2. Removed older screen color overrides that kept panels violet after changing
   agent identity color.
3. Preserved elapsed time and pose across pause/resume and color changes.
4. Kept physical character orientation consistent in RTL, including the static
   fallback layers.
5. Updated the gallery's expected counts and checked focus-triggered motion for
   the new Khayt entry.

The new controls reuse Tiraz Button, Tooltip, and ColorPicker. CSS audit output
for the mascot, studio, color controls, and changed screen families is `[]`.
The React review checked effect cleanup, deferred asset results, bounded color
caching, transient animation state outside React renders, and direct imports.

## Limits

This is an internal 2D raster character rig, not a public system export or a
3D asset. Browser checks used local Chrome; native Safari/Firefox and mobile
hardware were not exercised. Fine cotton detail simplifies at small sizes;
the silhouette and name carry identity there. Human visual testing remains
useful, especially for personal preferences about motion amplitude.

## Code verification

Local verification:

- `npm test -- --maxWorkers=2`: 142 files, 1,793 tests passed.
- `npm run lint`: zero warnings and zero errors.
- `npm run build`: passed, including TypeScript and generated examples.
- `npm run format:check`: passed.
- CSS audit: `[]` for all checked families, including the new mascot styles.

The first complete run found an outdated gallery count (updated for Khayt), a
chart timeout, and clipboard feedback checked before its update. The latter two
passed individually without source changes; the final full run passed all
tests. Existing timeouts were kept at 15 seconds.

After the complete test run, the shared palette function moved to a plain
TypeScript module to satisfy the React Fast Refresh lint rule. The affected
mascot, gallery, and screen tests were rerun: eight files and 61 tests passed,
followed by clean lint, build, and formatting. No behavior changed in that
cleanup.
