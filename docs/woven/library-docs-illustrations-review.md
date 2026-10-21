# Library, Docs, and Illustrations — implementation review

Date: 21 Oct 2026. Checkout: `/Users/amjedfadul/Tiraz-worktrees/woven`, branch `claude/woven`.

## Delivered

- Applied the approved Parts audit: ten independent pages moved into their job/category groups; five specialist pages now appear through parent documentation. Their exports, references, saved selections, and standalone examples remain available.
- Added Library, Docs, and Illustrations to the shared sticky header, with stable detail URLs, browser history, shared language/theme preferences, and mobile navigation.
- Library contains 83 entries: 12 screens and 71 components. Search accepts Arabic or English names; category filters survive reloads. The gallery uses 332 still previews across both languages and themes.
- Docs contains seven bilingual guides drawn from the source-owned system documentation. Copyable examples retain the actual import paths and provider contract.
- Illustrations exposes the three existing original SVG scenes, with size controls, theme-aware previews, decorative-use guidance, and example/source copying.

## Independent review and fix wave

A fresh, read-only reviewer examined `1d12eca..f826e6f` and checked Chrome behavior. No Critical findings; three Important findings were reproduced and fixed:

1. Back to the legacy `/` entry could resolve the latest saved component instead of the original page. The initial resolved path is now recorded in that history entry. A fresh visit still restores the saved page. A regression test failed before the fix and passed afterward; real Back/Forward behavior was also checked.
2. Closing the mobile drawer after selecting a destination could return focus to its trigger after the new page opened. Navigation dismissal now focuses main after closure; Escape still returns to the trigger. Choosing the current destination also closes the drawer without adding another history entry.
3. Lazy chart thumbnails could capture the loading fallback. The generator now waits for a rendered chart surface; all sixteen chart language/theme combinations were regenerated and the rendered output inspected.

Minor finding deferred: the Library search query is currently local to the gallery and resets after opening an item and returning with Back. Category selection is retained in the URL. This does not block browsing or direct links; query history can be a later refinement.

## Verification

Browser checks ran in local Chrome through disposable Playwright scripts outside the repository. No tracked browser-evidence scripts were run.

- 100 page/layout cases: five representative destinations at 390, 768, 1,024, 1,280, and 1,440 px, each in Arabic/English and light/dark, with reduced motion. Checked containment, direction, one h1, sticky navigation, search/filter behavior, and no mounted gallery examples.
- 40 axe scans across phone/desktop, languages, and themes: no WCAG A/AA violations reported. This is automated evidence, not a screen-reader audit.
- 40 additional guide/illustration detail cases: all seven guides and all three scenes, in both languages at phone/desktop widths. Checked guide clipboard contents, illustration sizes, and expanded code containment.
- Real browser checks passed for Back/Forward, the legacy root history entry, shared language, example/source clipboard content, mobile route/Escape focus, selecting the current drawer destination, specialist detail URLs, and legacy standalone URLs.
- All 332 preview files exist. Chart assets were checked after readiness was added.
- The isolated replay suite passed all 83 tests. Two older tests were updated to follow the curated navigation and screen-only iframe messaging. The replay timer assertion now flushes jsdom's zero-delay selection-change task from route focus before checking that no replay timers remain.
- System/screen CSS audit returned `[]`.

Final local gate passed on the implementation and review fixes:

| Command                                                                                      | Result                                                 |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `npm test -- --maxWorkers=2`                                                                 | 122 files, 1,633 tests passed; no failures or timeouts |
| `npm run lint`                                                                               | Passed, no warnings                                    |
| `npm run build`                                                                              | TypeScript and production build passed                 |
| `npm run format:check`                                                                       | Passed                                                 |
| Extra Prettier check for the preview generator, preview README, audit, plan, and this report | Passed                                                 |
| System/screen CSS audit                                                                      | `[]`                                                   |

The runtime was local Node 22.18.0; the TypeScript CSS-audit runner used Node 24.21.0. Temporary browser scripts and logs are under `/tmp/tiraz-library/`. The final snapshot was committed after this gate; no source changes followed verification. The preview remains at `http://127.0.0.1:5411/library`.

## Limits and separate work

Physical screen-reader testing, other browsers' clipboard permission behavior, and production-host deep-link rewrites were not exercised. The build retains the existing large-chunk advisory. The first gallery intentionally uses static previews; richer original illustration scenes are a later scope.

Plan 5 Task 8 and the handoff's deferred system fixes remain separate. This implementation does not mark that milestone complete.
