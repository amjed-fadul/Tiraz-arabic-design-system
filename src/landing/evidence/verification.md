# Local verification — 2026-10-15

Checkout: `/Users/amjedfadul/.codex/worktrees/landing-page/Tiraz`
Branch: `codex/landing-page`
Fetched main baseline: `e0fc39d7be1aed9c0723be415f3810e326003c5b`
Runtime: installed Mac Node 24.21.0, explicitly selected in command PATH.

## Commands and outcomes

- `npm ci --no-audit --no-fund`: installed existing lockfile. No manifest, dependency version or lockfile changes. Initial shell selected Node 20 despite the host's Node 24; installation was rerun with Node 24 before valid verification.
- `npm test -- src/landing/Landing.test.tsx`: 3/3 passed. Tests exercise actual language/direction changes, sample-data period totals, single theme control and documentation/source-path behavior. Initial test run preceded implementation and failed resolving the not-yet-created module; after implementation a missing Lucide brand export caused render/type failures. This installed icon package has no Github export; the landing uses its existing GitFork icon with a GitHub accessible name. No shared code was changed.
- First unrestricted `npm test`: 455 passed, 8 timeouts, in 4 files: ai-registry (2), slider-otp-date (2), generated-code (1), dashboard (3). See tests.txt for exact names. The concurrent run saturated workers; bounded retry was warranted.
- Initial `npm test -- --maxWorkers=2`: **53 files / 463 tests passed**, including generated-example compilation and copied AI usage examples (recorded in the session). After the final shader-only portability correction, a fresh run had 462 passes and one existing five-second navigation timeout; see tests-bounded.txt. The navigation file then passed 2/2 in isolation at the default timeout; see navigation-recheck.txt. Final full-suite verification with two workers and a 15-second default timeout finished with **461 passed / 2 timed out**: generated-code and data-table-page. Both passed afterward with one worker at their original/default timeout, **2 files / 2 tests**; see compilation-page-recheck.txt. Thus all 463 tests were observed passing on the implementation across the full and focused runs, but the last single full run was not green. The generated-code test has its own explicit 15-second limit, unaffected by the CLI default. See tests-final.txt for exact failures. No test or shared configuration was modified.
- `npm run build`: passed; existing default documentation build retained unchanged. See build-default.txt.
- `npm run build -- --config src/landing/vite.config.ts`: passed; emits both index.html and landing.html. See build-landing.txt. Vite retains its existing large-chunk warning. The optional original shader is a separate ~2.68 kB / 1.35 kB gzip chunk. The existing shared React/chart code is substantial (~272 kB gzip in the combined build); no bundle-size performance claim is made.
- `npm run lint`, `npm run format:check`, and `npx prettier --check landing.html src/landing`: passed after the final formatting pass.
- `git diff --check`: passed. Only landing.html and src/landing are added. Shared entry/routing, system/components, tokens, package/lock, docs/workbench and dashboard remain unchanged against the baseline.

## Browser verification

All inspection ran locally on the Mac, using the Codex in-app browser and an independent reviewer's local browser. The browser had 1.21 page zoom; recorded widths are measured CSS innerWidth, not requested physical frame sizes. Initial matrix includes 767/1439 due rounding; exact-width-checks adds the requested 768/1440. The independent reviewer captured the final four production screenshots in local Chrome at exact 1440×1000 desktop / 390×844 mobile CSS pixels, deviceScaleFactor 1. Screenshots are clean viewport captures. In-app-browser virtual viewport expansion produced incorrect RTL framing, so those earlier captures were discarded.

- Arabic/RTL and English/LTR, each light/dark, at 320, 390, 768 and 1440 CSS pixels: no document horizontal overflow; one H1; local font loaded; small tables fit. See browser-matrix.json and exact-width-checks.json.
- Arabic letter shaping and isolated Latin source paths/order identifiers inspected visually. Fixed Arabic text carries lang=ar in English mode. Heading order and readable status text inspected.
- Sample period total: 1,124 across all six sample days, 672 across the last three. Mouse and keyboard ArrowRight/ArrowLeft switch actual Tiraz Tabs. Accent action changes chart and controls. Data disclosures expose translated semantic values. Sample orders are explicitly separate illustrative records.
- Skip link is first keyboard target with visible solid focus; Enter focuses main#content. Theme control has a visible keyboard outline; Start building transfers focus to #start. Existing chart keyboard behavior/semantic table are retained.
- Reduced motion: preference true, canvas absent, static SVG present, scroll-behavior auto. Unavailable WebGL and forced context loss both leave canvas absent and readable content/static SVG present. Temporary JS failure injection was restored immediately, media emulation/viewport overrides cleared, and the final page reloaded. See fallback-checks.json.
- Production console: no warnings/errors during normal inspection, including language/theme changes. The shader does not fetch remote assets.
- Axe WCAG 2 A/AA + 2.1 AA: **zero violations** in Arabic/light and English/dark. Both scans flag color-contrast as incomplete and therefore require manual judgment; these are not full accessibility conformance results. See axe-arabic-light.json / axe-english-dark.json.
- Real built Documentation link opens `/index.html#main-content`; main-content, playground-heading, examples-heading and usage-heading exist. Dashboard link opens the actual existing customer dashboard.
- Local landing, docs and dashboard URLs return HTTP 200. Repository, Input source, Progress source, Charts source, README, portable AI README and MIT license return 200. Two initial Node fetches failed transiently; curl retries returned 200. Source file URLs under GitHub /tree redirect normally to /blob. See link-results.json (initial results) and link-retries.txt.

## Independent review

Source and rendered-page reviewer identified inherited table minimum width and missing Arabic language metadata. Both were fixed locally. Re-review also inspected the real BarChart and focused getting-started action at CSS 320px: **no actionable findings remain**. See review.md.

## Isolation and running previews

The original `/Users/amjedfadul/Tiraz` diff and staged-index patches compare byte-for-byte with snapshots taken before work. Its README and workbench.css edits remain intact. Documentation server 5227 still has original PID 32252 and returns HTTP 200. No unrelated server was stopped.

Development preview: `http://127.0.0.1:5237/landing.html`.
Final built preview: `http://127.0.0.1:5238/landing.html` (left running; HTTP 200).

## Limitations and integration

No physical-device or manual screen-reader test; color-contrast scan incomplete. Local load exposed timing flakes: unrestricted parallelism had eight timeouts, and one final two-worker/default-five-second run hit the existing documentation navigation timeout. The earlier two-worker suite passed 463/463, and navigation passed in isolation. The last full run with a 15-second default timeout had two existing workbench timeouts (generated-code and data-table-page); both subsequently passed in a one-worker focused run at their original/default timeouts. Concurrent unrelated test jobs were observed on the Mac and left untouched. Timing contention is the evidence-supported explanation, not a guarantee that these tests are generally stable. No tests or shared code were changed to accommodate this. A final shader check replaced reversed smoothstep edges with an equivalent ascending-edge expression for GLSL portability; focused tests, production build and the full bounded suite were rerun. Original WebGL compile/link/import failure branches were inspected; browser fault injection exercised unavailable WebGL and context loss, not every GPU/driver failure.

Root-route ownership, permanent documentation URL, default multi-entry build and component-specific documentation deep links are deferred to integration. Current workbench does not provide URL component routing, so the page links real documentation anchors and actual component source. All adoption guidance is source-owned; no installer/package/CLI is claimed. No push, merge, deployment, publication or root-route change.
