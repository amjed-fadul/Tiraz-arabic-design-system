# AI results verification

Implemented ImageResult, Sources / InlineCitation and InsightCards under the existing AI patterns category. Shared continuous pages, demo frames and compact inspectors are preserved. No dependency was added.

- Baseline: `8614ad317e619e4e76743aa0e55b33009e0bb1c4`.
- Branch: `codex/ai-results`.
- Checkout: `/Users/amjedfadul/.codex/worktrees/ai-results/Tiraz`.
- Retained documentation preview: <http://127.0.0.1:5327/>. HTTP 200 verified; process cwd is this checkout.
- Local Mac verification using Node 24.21.0. Exact commit is returned in the handoff; all results below apply to its source tree.

## Checks

| Check                                                                   | Result                                                                                                         |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Focused component, registry, generated code and prompt relocation tests | 161 passed across 4 files                                                                                      |
| Full suite                                                              | 678 passed across 73 files                                                                                     |
| Generated examples                                                      | Both languages; all new image state/ratio combinations, long sources and long findings compile                 |
| Source-only consumption                                                 | Whole system relocated without checkout/workbench dependencies; generated snippets and linked examples compile |
| Default consumer production asset build                                 | All three SVGs and both reference documents emitted and byte-compared; no forced asset-inline override         |
| TypeScript and Vite production build                                    | Passed; existing large-chunk warning remains                                                                   |
| Oxlint                                                                  | Passed, no warnings or errors                                                                                  |
| Project Prettier check                                                  | Passed                                                                                                         |
| Diff whitespace                                                         | Passed                                                                                                         |
| Independent review                                                      | Approved after fixes and re-review; no remaining actionable findings                                           |

Commands, using the local Node 24 runtime in PATH:

```sh
node node_modules/vitest/vitest.mjs run src/system/ai-results.test.tsx src/system/ai-registry.test.ts src/workbench/generated-code.test.ts src/workbench/generate-prompts.test.ts
node node_modules/vitest/vitest.mjs run --maxWorkers=2 --testTimeout=15000
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js build
node node_modules/oxlint/bin/oxlint
node node_modules/prettier/bin/prettier.cjs --check src index.html vite.config.ts *.json README.md docs/implementation-plan.md
```

The initial baseline run timed out in DatePicker's LTR month navigation test; an intermediate concurrent run timed out in Workbench's Arabic/dark accent test. Both passed in the final lower-concurrency full runs. The final suite uses a 15-second per-test ceiling to accommodate Mac runtime variance; assertions were not weakened. A generator relocation fixture needed its new raw-example import added. No failures remain.

## Browser and interaction evidence

[Browser results](browser-verification.json) record local Google Chrome checks. The first in-app browser emulation produced unreliable scaling; those captures were discarded and the viewport matrix was rerun in Chrome with verified CSS viewport dimensions and actual rendered-family assertions.

- 24 combinations: ImageResult, Sources and InsightCards × Arabic/English × light/dark × 1280×900 / 320×568. No horizontal document overflow or unexpected broken images.
- 320×360 with long mixed Arabic/English titles, long URL metadata, large typography, standard density, blue accent and 16px radius. Citation popup remains within viewport and scrolls; long error alt text begins visibly and can scroll to its end.
- Image loading → actual browser failure → retry → loaded keeps frame dimensions. Keyboard Retry retains focus on the same stable figure. Local candidate selection and Use selected image report the correct selected candidate.
- Citation disclosure and source list use the same source IDs and destinations. Reordering preserves explicit numbers 1 and 2. Direct native navigation opens the real sample file. Unsafe and missing destinations remain honest text.
- Nested Popover portals remain inside Modal and Sheet. Tab reaches Open source; first Escape closes the citation and restores its trigger; second Escape closes the outer dialog and restores its trigger after exit animation.
- Insight paging, boundary focus, unavailable activation, connected details and evidence links work. Semantic tone stays neutral in the samples. Numeric zero supporting content is retained.
- Both documentation demo frames respond to shared density and typography changes. Popup typography, radius, direction and theme remain scoped.
- Application and OS reduced-motion settings stop Skeleton animation.
- Actual default production build served temporarily on port 5331: loaded `/assets/coffee-sage-*.svg`, and a native citation opened `/assets/menu-audit-*.txt` with readable Arabic and English. That temporary server was stopped; port 5327 remains running.

The local sample documents retain UTF-8 BOMs so plain-text navigation preserves Arabic. Examples use `?url&no-inline`; retaining this is necessary because a small inlined source document would otherwise become a rejected `data:` URL. Portable guidance explains equivalent real-file URLs for other bundlers.

Representative screenshots:

- [ImageResult documentation](screenshots/docs-images-en-light-desktop.png)
- [Sources documentation](screenshots/docs-sources-en-light-desktop.png)
- [InsightCards documentation](screenshots/docs-insights-en-light-desktop.png)
- [Arabic dark mobile citation](screenshots/docs-citation-ar-dark-320.png)
- [Arabic dark mobile insights](screenshots/docs-insights-ar-dark-320.png)
- [Customized citation](screenshots/docs-citation-customized-desktop.png)
- [Nested citation](screenshots/nested-citation-modal.png)
- [Long citation, short viewport](screenshots/long-citation-ar-dark-320-short.png)

[Interaction recording](interaction.mp4): 11.7-second local Chrome screencast showing image failure/recovery, candidate selection, citation disclosure, source reordering, insight paging and a connected detail action. Idle gaps are shortened; the recording contains actual UI interactions.

## Reference inspection

All three supplied Formic references were available. Loading/progress, landscape, portrait, failure and candidate states were inspected. Candidate selection/use and retry were exercised. Regenerate, Open, Download and Use controls report demo notifications; Open did not reveal a viewer requiring a new subsystem. Sources provides focus-triggered compact citation details and expandable source rows. InsightCards provides one finding at a time with previous/next, a supporting surface and a follow-up pill; metric switching and allocation inspection were exercised.

Tiraz deliberately uses activation for interactive citation disclosures, with native link mode for direct navigation. It omits unconnected image toolbar actions, generation/retrieval, viewer/download infrastructure and specialized chart-card families. Supporting evidence and content stay application-owned.

## Review corrections

Independent review identified retry focus loss, unreachable overflowing fallback content and a mismatch between a sample claim and its linked document. These were fixed and re-reviewed. The actual failure demo's extra remount was removed. Final keyboard checking also fixed focus loss at insight paging boundaries with guarded aria-disabled controls. Default production asset handling is now tested without an artificial no-inline build setting. Independent re-review approved the resulting changes.

## Preservation and limits

The original checkout remains on `ce78408818b6a9866ab0faa7748404cba44d8939` with the same unstaged README/workbench CSS edits and untracked `.claude/`; its index was not changed. Landing work and unrelated servers were preserved. Work is committed locally only, with no push, merge or deployment.

Real physical devices, screen readers, Safari/WebKit and Firefox/Gecko were not tested. Chrome viewport emulation and keyboard/DOM checks do not establish those results. No external generation, retrieval or image service was exercised or added.
