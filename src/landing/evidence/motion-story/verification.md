# Motion and scroll-story verification

Local Mac, 2026-10-15. Worktree
`/Users/amjedfadul/.codex/worktrees/landing-page/Tiraz`, branch
`codex/landing-page`, starting HEAD `bbd738c1a1eea9fccce28e59e46e6ae3552769fd`.

## Diagnosis before changes

The built preview initialized WebGL with normal motion, a visible document and
pause disabled. A scoped draw-call probe counted 780 frames in 6.5 seconds;
shader time advanced from approximately 266.12 to 272.18 seconds. Pixel samples
also changed. The initial immediate post-reload canvas query occurred before
React initialization; it was not treated as WebGL failure. The probe's original
draw method was restored and temporary diagnostic properties were removed.

Independent eight-second visual inspection confirmed movement was present but
read as nearly static at normal size. This was an effect-amplitude/speed issue,
not a paused or fallback hero. `shader-before.json` and the before captures retain
the evidence. A long awaited CDP probe exceeded the tool command timeout, so a
nonblocking probe with automatic restoration was used for the final diagnosis.

## Changes

- Existing native WebGL texture pass now combines gentle low-frequency cloth
  drift, finer weave motion and traveling light. Edge cells are quieter. No new
  shader engine/dependency, pointer distortion, animated vertices or text motion.
- Removed both languages' hero caption, accent helper, principle strip and example
  introduction. Useful example controls, labels and accurate sample data remain.
- Example overlaps the hero by 20px in normal flow. Short desktop layouts and
  mobile have explicit spacing; there is no absolute-positioned example.
- Three compact Why Tiraz chapters use native observation, a mirrored sticky
  visual and restrained CSS fades/crossfades. All three remain readable. Under
  900px, reduced motion or unavailable IO, all three images appear inline.
- Three separate generated 4:3 compositions, optimized to 1200x900 WebP, total
  approximately 710 KiB. Exact prompts/provenance are in `assets/story`.

## Local checks

- Focused tests first failed against the old content and missing story component;
  final focused run: **2 files / 8 tests passed**. Covers chapter activation,
  observer cleanup, absent-observer/reduced-motion content, runtime motion
  preference changes, content removal and retained example state/controls.
- Full final run: `npm test -- --maxWorkers=1 --no-file-parallelism`:
  **54 files / 468 tests passed**, 208.05 seconds, original timeout limits.
  Browser work, encoding and builds were finished before this serial run.
- `npm run build -- --config src/landing/vite.config.ts`: TypeScript and production
  build passed. Existing shared-system chunk size advisory remains.
- `npm run lint` and full `npm run format:check`: passed.
- Production matrix: Arabic/English x light/dark at 1440x1000, 1440x700,
  1024x768, 768x1000, 390x844 and 320x844: **24 states**, no horizontal overflow,
  correct content-edge alignment, 20px overlap and example top initially visible.
- Every pointer swatch changes actual GL tint, primary action and chart stroke
  together. Canvas identity, 672 selected-period total and typed Nawa value persist.
  Neutral surface and semantic success color stay identical. Keyboard arrows
  cycle all four native radios with selected state and focus synchronized.
- Manual pause freezes shader time exactly through accent and keyboard changes;
  resume returns to running. New normal-motion probe counted 776 frames in 6.5s.
  Independent visual inspection and the recording establish perceptible motion;
  an initialized canvas or pixel counter alone was not treated as proof.
- Reduced motion removes the canvas, leaves the same 1942px static image, and
  exposes every inline story image. Returning to normal motion restores WebGL.
  Each preference transition awaited actual canvas attach/detach; rapid emulator
  toggles can coalesce and were corrected in the test procedure.
- Forced unavailable WebGL and actual WEBGL_lose_context loss both produce static
  fallback with the same loaded image and readable HTML. Prototype fault injection
  and media/viewport overrides were restored, then the page reloaded.
- Isolated browser console returned no warnings/errors. No manual screen-reader,
  physical-device, alternate-browser/GPU or exhaustive pixel-contrast certification.

## Independent review and evidence

`review.md` records source and visual review with no actionable findings. The
reviewer observed normal-scroll chapter states 0/1/2, all three images loaded,
an in-progress opacity crossfade and correct English/Arabic orientation. Mobile
and desktop reduced motion were inspected with all images available.

- Before: `before-ar-light.png`, `before-ar-light-8s.png`, `before-en-dark.png`.
- After: four `after-*-desktop.png` / `after-*-mobile.png` captures, three
  `after-ar-story-0*.png` captures and supplementary story/reduced-motion views.
- `motion-and-story.mp4`: **16.5 seconds, 1440x1000, H.264**, approximately 3.4 MB.
  Actual compositor recording: eight seconds of textile motion, then ordinary
  document scrolling through the three story states. `recording.json` retains
  original timestamps/scroll positions. The encoder holds sampled/static frames
  at their recorded times; no motion interpolation, synthetic animation, speed
  change, edited text or replaced imagery. A decoded contact sheet was inspected
  for all stages; video metadata is in `video-info.json`.

Capture limitation: Chrome's regular screenshot API excludes scrollbar/frame
pixels, yielding 1425x990 desktop and 375x812 mobile images for the requested
1440x1000/390x844 CSS viewports. Exact 1440x1000 compositor frames were used for
Arabic desktop/story views and the recording. Screenshot PNGs were saved without
resizing; some came from native JPEG captures. Raw compositor frames remain in
the temporary recording directory and are not committed; the MP4 and timing
manifest are committed. The regular screenshot API's content-only sizing is retained as a limitation.

## Preservation and previews

Only landing-owned files change; no shared components, tokens, dashboard,
documentation routing, root routing or dependencies. Original checkout/index
diffs and status match task-start snapshots. No unrelated server stop/restart
commands were issued by this task. Previews remain on 5237/5238; documentation
on 5238/index.html responds HTTP 200. The previously observed unrelated server
on 5227 was not listening at the final check; this task did not stop or restart
it. Final HTTP status and preservation results are recorded separately. Commit locally only; no push,
merge, deployment or publication.
