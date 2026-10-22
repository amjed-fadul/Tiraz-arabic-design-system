# Formic reference observations — 2026-10-16

All three supplied live references were available and inspected in the browser:

- <https://formicai.dev/preview.html#/loadingstate>
- <https://formicai.dev/preview.html#/thinkingindicator>
- <https://formicai.dev/preview.html#/thinkingstate>

Observed Formic v0.5.2. Loading variants ran together for about seven seconds. Indicator examples were replayed and sampled for about 18.5 seconds, including custom words and text-only output. ThinkingState was replayed, expanded while active, observed through completion, then collapsed/reopened. The current reference uses a small static four-point star for ThinkingState; the circle/infinity morph belongs to ThinkingIndicator.

The following durations were read from rendered computed styles/SVG declarations, rather than estimated from screenshots: Drive/Dots 650ms, Orbit 950ms, shimmer 1.4s, SVG morph 6s, word entrance 240ms, disclosure 400ms, chevron 300ms and completed-label fade 350ms. Sampled word changes were approximately 3.2 seconds apart (observed intervals about 3.15–3.31 seconds); this is not a claim of exact reference timer scheduling.

Loading uses a 15×15px grid, 4px cells and 1.5px gaps. Drive/Dots row-major pulse delays are 90/180/270/0/90/180/90/180/270ms; Orbit follows the perimeter with 110ms offsets and a still, faint center. Cells pulse in opacity without translation. The label shimmer moves through a neutral muted/text gradient. ThinkingIndicator uses an 18px glyph, 1.6-unit stroke in a 24-unit viewBox, morphing through circle/infinity/reversed-circle/infinity/circle with spline easing. Incoming whole words fade upward by 4px; no individual letters animate. The compact disclosure has a neutral glyph, summary and chevron, a thin detail rail, small check-mark steps and a plain supplied completed summary.

Tiraz recreates these visual primitives and rhythms using its own CSS/SVG, typography, semantic colors and motion tokens. Existing documentation layout is retained. Elapsed time is supplied by the host rather than starting a library execution clock. Whole-word rotation is cosmetic and never changes the stable accessible label. No Formic orchestration or automatic progress sequence was adopted.

[Rendered measurements and time samples](reference-measurements.json), [loading screenshot](reference-loading.png), [indicator screenshot](reference-indicator.png), [state screenshot](reference-thinking-state.png).
