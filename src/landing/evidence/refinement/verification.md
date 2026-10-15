# Textile refinement verification

Local Mac, 2026-10-15. Checkout:
`/Users/amjedfadul/.codex/worktrees/landing-page/Tiraz`, branch
`codex/landing-page`, refinement starts at
`450e776e2b04e3633aec5a1752dfcce1d46f0138`.

## Automated checks

- `npm test -- src/landing/Landing.test.tsx --maxWorkers=1`: 1 file, 4 tests passed.
  The new shared-accent/state-preservation test was observed failing before the
  implementation; `accent-before.txt` retains that evidence.
- `npm test -- --maxWorkers=1 --no-file-parallelism`: **53 files, 464 tests
  passed**, 239.67 seconds. Original test limits, isolation and shared configuration
  retained. Includes generated-example compilation and documentation/dashboard tests.
- `npm run lint`: passed.
- `npm run format:check`, plus Prettier checks of the dedicated HTML entries:
  passed. New browser evidence JSON was formatted after an initial formatting
  failure; final check is green.
- `npm run build -- --config src/landing/vite.config.ts`: TypeScript and combined
  production build passed. Existing shared-system chunk exceeds Vite's 500 kB
  advisory threshold. The original native shader chunk is approximately 4.62 kB,
  2.16 kB gzip; the clean 1942×809 PNG is approximately 2.8 MB.

Previous full-suite runs had intermittent timeouts under parallel load. Isolated
rechecks had passed. This final run serialized files and workers without competing
build/browser work from this task; it passed every test at the original limits.
The Mac still had unrelated jobs (load average approximately 9.9), preserved.
This resolves the requested clean final run; it does not establish that the
existing suite is free from timing flakes under arbitrary parallel contention.
The final navigation change is CSS only and was built and inspected afterward.

## Browser behavior and rendering

Built preview: `http://127.0.0.1:5238/landing.html`.
Brand preview: `http://127.0.0.1:5238/src/landing/brand-preview.html`.
Documentation: `http://127.0.0.1:5238/index.html`.

- Arabic/English × light/dark × 320/390/768/1440 CSS pixels: all 16 combinations
  loaded the real image with no horizontal document overflow. HTML headline,
  actions and swatches remain outside the canvas. See `browser-matrix.json` and
  the independent review for the final navigation-overlay recheck.
- Final overlay measurements at 768px in all four language/theme combinations:
  transparent header ends at 88px, copy begins at 210px, no overflow. At 320px
  Arabic/light and English/dark, the wrapped header ends at 119px and copy begins
  at 170px; all three navigation links fit. Temporary emulation was cleared.
- Pointer selection of every swatch updated the actual GL tint uniform and actual
  live action color while preserving canvas identity, the 672 recent-period total
  and typed input. Keyboard arrows moved focus and selection through all four
  native radios. One SystemProvider; supported palette values only.
- Neutral page background and semantic success badge color stayed identical
  through all four accents. The chart and relevant selected controls inherit the
  same provider. No duplicated demo picker or accent configuration remains.
- OS reduced motion removes the canvas and retains the same image. Dynamically
  returning to no-preference restores the effect. Manual pause freezes shader
  time, including through an accent change. Offscreen scrolling pauses it.
- Visibility-change handling was tested with a scoped `document.hidden` override
  and actual visibilitychange events; time remained frozen. The override was
  immediately removed. This was a simulation, not a native OS background test.
- Unavailable WebGL and forced context loss both left canvas count zero, the same
  loaded image and real content intact. Fault injection was restored and the
  page reloaded. Import/compile/link/upload failure cleanup also reviewed in source.
- Four axe scans (both languages/themes): zero reported violations. Image-backed
  color contrast was marked incomplete; manual visual inspection supplements it.
- Root isolated IAB console checks returned no warnings/errors. Independent Chrome
  automation logged three identical asynchronous message-channel listener errors;
  source contains no extension messaging, but their exact origin is unestablished.
  See `review.md`; this is not presented as a completely clean Chrome session.
- Hero documentation action opens the real built workbench; explore/home anchors
  were exercised. Both entries, documentation and dashboard URLs return HTTP 200.

## Review, evidence and preservation

Independent source/visual review found helper contrast and reduced-motion recovery
issues; both were fixed and independently re-reviewed. Three original monochrome
SVG concepts were inspected at 16/24/32 pixels and in Arabic/English header samples.
The landing keeps its existing typographic wordmark. Final screenshots are direct
production captures, without image edits; `review.md` lists them.

Only landing-owned files and `landing.html` change. Original checkout worktree/index
diffs were compared byte-for-byte with snapshots; unrelated edits and servers were
preserved. No dependency, shared component/token, dashboard, documentation entry,
root routing, or other branch changes. Existing documentation server 5227 and
landing dev/production servers 5237/5238 remain running. No push/merge/deploy/publish.

Limitations: no physical-device, manual screen-reader, alternate-browser/GPU-driver
certification or exhaustive image/pixel contrast measurement. WebGL creation and
context loss were fault-injected; every possible shader/driver failure was not.
