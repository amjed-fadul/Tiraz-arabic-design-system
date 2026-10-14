# Independent charts review

Reviewed locally on 2026-10-14 in `/Users/amjedfadul/.codex/worktrees/charts-foundation/Tiraz`, branch `codex/charts-foundation`, baseline `4a164d9a56cecf9b6babdf8f21b26ec411364790` plus uncommitted changes. Read `AGENTS.md`, portable AI guidance/registry, chart source and formatting, examples, generators, workbench integration, dependencies and local verification evidence. This reviewer changed only review/evidence files; no product code, servers or original-checkout files.

**Final verdict: no remaining actionable findings.** The implementation meets the requested small four-chart foundation within its documented limits. Manual screen-reader announcements remain unverified.

## Findings and re-review

All five initial findings were P2 and are resolved:

1. **Cartesian tooltip inferred chart type from caller data.** Rows containing both `key` and `label` were mistaken for donut entries, losing the category and values. Explicit tooltip kind now preserves valid application metadata. Independent Chrome reproduction shows `Day one / Sales / 42` on focus and keyboard navigation.
2. **Missing-value sample summary understated Cartesian totals.** The example reused donut aggregates, which deliberately omit the Store aggregate in the gaps sample. Totals now follow the actual plotted dataset. The regression verifies **1,642**, replacing the incorrect 976.
3. **Portable prompt relocation test failed.** The new generator and raw chart-example source were absent from its relocated fixture. Both are included; generated/relocated examples compile in the final suite.
4. **Plum accent made both example series identical.** Explicit accent/Plum overrides collided. Examples now reuse ordered definitions with the default palette, which excludes the current accent. Independent live settings verify distinct Plum/Sage colors and preserved plot identity.
5. **Unfocused isolated points were nearly invisible.** Line dots inherited white fill; Area dots inherited 0.1 fill opacity. Both now use explicit series color and opacity 1. Independent Chrome confirms opaque markers and the screenshot shows both isolated points; the focused regression passes.

Family-count metadata is synchronized to thirty-two. Subsequent source fixes also pass review: removing interactive legend controls restores visible data; empty-state detection considers visible series; chartSample is internal; DonutSegment removes dataset key from JSX spreads and passes it explicitly to Sector. The final focused chart suite passes 16 tests; a separate Chrome check renders two donut segments without console/page errors. Locked and installed React, React DOM and react-is are all **19.3.0**, matching portable guidance; Recharts is **3.10.1**.

## Final evidence

- `test-output.txt`: **341 tests / 36 files pass**, using bundled local Node 24.19.0 and `npm test -- --maxWorkers=1`. Includes public contracts, generated examples and source-copy/relocation compilation.
- `browser/results.json` and `browser-output.txt`: **32 matrix scenarios + 34 checks pass**, zero failures, console errors or page errors. Matrix covers four charts, Arabic/English, light/dark and 1440/360px. Additional checks cover edge datasets, keyboard tooltips/legends, pointer bounds, live settings, both reduced-motion sources, connected periods, copied prompts and axe.
- Build, lint and formatting evidence passes. The build retains the size advisory: main JavaScript is approximately **1,000kB minified / 296kB gzip**. Only the examples are split into their own small chunk; this review does not claim Recharts is absent from unrelated documentation loads.
- Inspected representative screenshots for Arabic dark narrow Line, Arabic long-label Bar, English desktop Donut, missing values, isolated points, tooltip bounds and the connected period. Styling is restrained, Arabic labels shape/read correctly, tables remain contained, and chronological input order remains left to right.
- Independent `independent-keyboard.json`: all four charts pass focus, ArrowRight/Left, Escape, Enter/Space all-hidden legends, original-value table retention and restoration in Arabic RTL/dark at a 270px host width. Tooltips distinguish real Arabic zero from missing data.
- `independent-settings.json`: Blue/Plum, typography, density and radius updates preserve the SVG surface and update tooltip/legend tokens. `independent-points.json`/`.png` and `independent-donut-console.json` verify final marker opacity and warning-free donut rendering.

The suspected Arabic last-tick clipping is **not reproduced**. `independent-axis-bounds.json` measures all three Cartesian charts at 360px. Their SVG spans x=21–339; Line/Area's last Arabic tick spans x=304.764–338.703, while Bar's spans x=285.671–319.609. First/last ticks remain inside the SVG. Actual XAxis text anchor is `middle`, so RTL does not reverse start/end anchoring here.

The unrelated existing icon regression now accepts a difference below 0.001px from its 16px expected SVG bounds. That correctly handles the observed 15.999969px floating-point result without changing product behavior or weakening meaningful geometry checks. This review inspected that adjustment; it does not claim an unobserved rerun result.

Named chart regions/plots reference visible summaries; optional semantic tables preserve exact original values. Missing/nonfinite/nonnumeric data remains null gaps, finite zero is retained, and donuts render positive finite values only. Drawing/tooltip-position animations are disabled; CSS emphasis uses shared OS/system reduced-motion tokens. Automated accessibility checks and keyboard tests do not establish manual screen-reader behavior or full conformance.
