# Independent review

Reviewed the landing changes against the requested brief and baseline `bbd738c1a1eea9fccce28e59e46e6ae3552769fd`. Source inspection covered `Landing.tsx`, `LiveExample.tsx`, `landing.css`, `WhyTiraz.tsx`, `story.css`, `Weave.tsx`, and the shader changes. Visual inspection used the running local preview at `http://127.0.0.1:5238/landing.html` through an independent Chrome tab controlled with CUA.

No actionable findings in the reviewed source or visual scope. No application source edits or tests were performed by this reviewer.

## Observations

- Before editing, the normal-motion canvas was visible, the document was visible, reduced motion was off, and pause was unchecked. Captures eight seconds apart showed modest variation, although the baseline read as nearly static at normal viewing size. Canvas presence alone was not treated as proof of motion.
- After editing, an actual eight-second compositor capture showed gentle textile displacement and changing traveling illumination while the copy remained stable. The corner cells were substantially quieter. The final continuous recording includes eight seconds of hero motion followed by normal document scrolling through all three story states.
- Normal desktop scrolling activated chapters 0, 1, and 2. All three distinct images loaded. A transition was observed in progress with outgoing/incoming computed opacity approximately 0.06/0.94, and the final images were inspected. The sticky visual appeared on the right in English and on the left in Arabic.
- The hero caption, swatch helper, principle strip, and live-example introduction were removed in both languages. The swatches remain present. The actual example overlaps the hero by 20px in normal flow and is visible in the initial desktop viewport.
- English dark and Arabic light desktop and narrow mobile views were inspected. The mobile example controls fit, and no horizontal overflow was observed. At the requested 390×844 emulation, all three story images were loaded and displayed inline with readable messages.
- Desktop reduced-motion emulation switched the story to a stacked layout. All three inline images were loaded, displayed, and exposed with `aria-hidden="false"`; the sticky visual was hidden. Source inspection confirmed the absence of story movement in that mode.

## Evidence and limits

- Before Arabic light and English dark PNGs are 1440×1000. The Arabic before pair is separated by eight seconds.
- `after-ar-light-desktop.png` and `after-ar-story-01.png` through `03.png` are inspected 1440×1000 compositor frames converted to PNG without resizing.
- The regular tab screenshot API returned 1425×990 desktop captures and 375×812 narrow captures despite requested emulation sizes of 1440×1000 and 390×844. English desktop, English mobile, and Arabic mobile PNGs preserve their actual captured dimensions without stretching. Some supplementary story captures also retain the screenshot API dimensions.
- `recording.json` describes 75 actual JPEG compositor frames, their timestamps, native scroll positions, and capture intervals. Raw frames are in `/tmp/tiraz-motion-story-recording`; the final capture lasts about 16.50 seconds including the last static hold. Story holds emit sparse frames because Chrome emits on visual changes. MP4 encoding and playback inspection are owned by the main task.
- This review does not independently establish WebGL initialization/time/frame counters, pause/resume, accent propagation, forced WebGL fallback, full keyboard behavior, or accessibility compliance. Those focused checks are owned by the main task. Baseline and final visual captures were made with normal motion, not forced fallback.
- Scoped viewport and reduced-motion emulation were cleared after inspection. The original checkout, index, and unrelated servers were not changed.
