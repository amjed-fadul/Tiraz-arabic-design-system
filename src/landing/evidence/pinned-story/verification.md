# Why Tiraz pinned scene verification

Scope: refine only the existing Why Tiraz section from local baseline `ebbf3ae157e0289ca35a85fc8f28fd8a115954c2` on `codex/landing-page`, in `/Users/amjedfadul/.codex/worktrees/landing-page/Tiraz`. Product changes are limited to `WhyTiraz.tsx`, `story.css`, and their focused test. Existing hero, shader, assets, logo, dashboard, shared components, routing and configuration are unchanged. No dependencies were added.

## Implementation

A native sticky 100svh scene occupies a 400svh document section. The header scrolls away, so there is no persistent navigation offset. CSS logical grid placement mirrors the full-height cover image and inset copy with document direction. Narrow screens use an image-above-copy split. The label sits inside the text panel, with the three copy blocks sharing one grid position.

One passive document scroll listener schedules a requestAnimationFrame update. Normalized section progress drives feathered upward masks, incoming-image scale from 1.03 to 1, and restrained text opacity/vertical movement. Hold intervals surround both transitions; the outgoing copy reaches zero before incoming copy appears. There are no wheel handlers, scroll snapping, nested scrollers, animation dependencies, or additional shaders. Deriving every value from scroll position makes backward scrolling reversible.

React image preload hints and eager image loading start all three existing assets together. Pinning begins only after every image is loaded. Reduced motion, viewports at most 560px high, or measured copy that cannot fit use the complete stacked story. A fit failure stays stacked until viewport resize, preventing the wider stacked copy from causing repeated re-pinning. ResizeObserver, font readiness, viewport resizing and language changes recheck content fit. All story headings and image descriptions stay available to assistive technology, without live announcements; inactive source-link tab stops are excluded.

## Local checks

Executed on the user's Mac with Node v24.21.0:

- Focused red run: all three replacement story tests failed on the old implementation, as recorded in `focused-red.txt`.
- A final fit-fallback regression failed before the fix (`fit-regression-red.txt`): widening the stacked copy incorrectly re-enabled pinning. The corrected implementation keeps the fallback stable until viewport resize.
- `npm test -- src/landing/WhyTiraz.test.tsx src/landing/Landing.test.tsx --maxWorkers=1 --no-file-parallelism`: 2 files, 9 tests passed (`focused-tests.txt`).
- `npm test -- --maxWorkers=1 --no-file-parallelism`: 54 files, 469 tests passed, without timeouts (`full-tests.txt`).
- `npm run build -- --config src/landing/vite.config.ts`: TypeScript and production build passed. Vite retained its existing warning about chunks larger than 500kB; this section adds no dependency.
- `npm run lint`: passed (`lint.txt`).
- `npm run format:check`: passed (`format.txt`).

The tested product-source SHA-256 values are recorded in `preservation.json`. Source and tests were unchanged after these checks. Evidence formatting does not change the product build. The ordinary-scrolling recording preceded the final fallback latch; final browser re-review checks that latch and the unchanged transition path.

## Browser and recording evidence

Independent source and production-preview review is in `review.md`, with measurements in `browser-matrix.json` and console events in `console-events.json`. It covers Arabic/English, desktop/narrow/short layouts, motion preferences, entry/exit, forward/backward wipes, image readiness and text/image synchronization. Screenshots show the actual local browser render.

`pinned-story.mp4` is a real Chrome compositor recording: 119 original JPEG frames captured over 16.640 seconds at 1440x1000, with wheel input through all three chapters, natural release, and reverse scroll. Encoding preserves captured timing, holding frames to produce a 30fps H.264 MP4 without interpolated motion. The encoded duration is 16.633 seconds (499 frames). `recording.json` retains original timestamps and scroll offsets; `video-info.json` records the encoded dimensions and duration. A decoded contact sheet was visually inspected.

Fresh browser capture showed no application exceptions or warnings. Installed Chrome extensions emitted unrelated unload/font messages; these are preserved rather than omitted from `console-events.json`.

## Preservation and preview

The original checkout's complete working diff, staged diff and status match snapshots taken before this change (`preservation.json`). No unrelated server was stopped. The previous 5238 preview was absent at the start of browser verification. An initial background restart ended with its parent test session; the final preview runs in its own persistent PTY session from this landing worktree. All three required preview pages returned HTTP 200 (`preview-http.json`):

- http://127.0.0.1:5238/landing.html
- http://127.0.0.1:5238/src/landing/brand-preview.html
- http://127.0.0.1:5238/index.html

Changes and evidence are committed locally only. No push, merge or deployment was performed.

## Limitations

Chrome responsive emulation and wheel input were used on the Mac. Physical iOS/Safari, touch input and native screen-reader sessions were not tested. Accessibility verification uses the browser accessibility tree, DOM, focused checks and keyboard inspection. Dark-theme Arabic/English desktop/narrow views and visible keyboard focus passed (see independent review and supplemental matrix). Actual 200% browser zoom was not verified: native Chrome control became unavailable when the Mac locked. Responsive viewport checks are not claimed as a substitute for actual browser zoom.
