# Charts foundation verification

Implemented and verified locally on the user's Mac on October 14, 2026.

- Checkout: `/Users/amjedfadul/.codex/worktrees/charts-foundation/Tiraz`
- Branch: `codex/charts-foundation`
- Baseline: `4a164d9a56cecf9b6babdf8f21b26ec411364790`
- Preview: [http://127.0.0.1:5210/](http://127.0.0.1:5210/), serving this checkout.
- Runtime: bundled local Node 24.19.0, installed Google Chrome, React/React DOM/react-is 19.3.0, Recharts 3.10.1.
- Final local commit SHA is returned in the completion message. No push, merge, deployment or publication is included.

## Delivered

LineChart, AreaChart, BarChart and DonutChart use Recharts rendering with scoped Tiraz typography, surfaces, colors, grid, tooltip and legend. A small shared Cartesian renderer covers these three plots; Donut keeps its own positive-value geometry. There is no configuration framework or additional component kit.

Required accessible name and visible application summary accompany optional semantic tables. Legend buttons support Enter/Space, selected state and every series hidden. Removing interactive legend controls restores visible series. Missing/nonfinite values remain gaps; isolated points are opaque and visible; zero remains numeric. RTL preserves input chronology. Arabic digits and UTC date labels are locale aware, with English and explicit locale overrides supported. Drawing/position animations stay disabled, and token-based emphasis respects application and OS reduced motion.

Four continuous documentation pages retain the compact inspector, generated usage and full copied prompt. Sample, legend and Cartesian grid controls are relevant to each page. Portable registry metadata and compiling examples travel with the source root. The application-owned analytics Card uses Field/Select and shared charts: selecting October 4–6 changes six rows to three, total orders from 1,790 to 1,052, and channel totals to 672 and 380. Data is visibly marked as an in-memory sample. DataTable and its connected customer example have no source diff.

## Local checks

| Check                                                                    | Evidence                                                                                                |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Full Vitest suite, generated usage and relocated source-copy compilation | [341 tests / 36 files passed](test-output.txt), `npm test -- --maxWorkers=1`                            |
| TypeScript and Vite production build                                     | [Passed](build-output.txt), `npm run build`                                                             |
| Oxlint                                                                   | [Passed without warnings](lint-output.txt), `npm run lint`                                              |
| Repository formatting                                                    | [Passed](format-output.txt), `npm run format:check`                                                     |
| Four-chart browser matrix and interactions                               | [32 display scenarios and 34 checks passed](browser/results.json), [command output](browser-output.txt) |
| Independent source and evidence review                                   | [Review and fixes](independent-review.md)                                                               |

The browser matrix covers all four charts in Arabic/RTL and English/LTR, light/dark, 1440px desktop and 360px narrow layouts. Interaction checks cover plot keyboard tooltips, pointer tooltip boundaries and mixed long Arabic labels, legend Enter/Space and all hidden, semantic tables, single/multiple series, gaps, single points, zeros and empty data. They check live accent/text/density/radius updates with retained SVG identity, distinguishable Purple-accent colors, OS and system reduced motion, the connected period selector, current clipboard prompts and eight focused Axe scans. No console or page errors were recorded.

Independent Chrome checks additionally cover valid Cartesian rows containing application `key`/`label` fields, narrow RTL keyboard behavior, isolated markers, live settings and positive Donut segments without key-spread warnings: [keyboard](independent-keyboard.json), [markers](independent-points.json), [settings](independent-settings.json), [Donut console](independent-donut-console.json), and [Arabic first/last axis bounds](independent-axis-bounds.json).

An earlier unconstrained run hit test timeouts while the Mac was under heavy load; the Mac also temporarily reported ENOSPC. The final suite ran serially without changing test timeouts or skipping tests. The existing shared browser regression script uses a 0.001px tolerance for nominal 16px transformed SVG icon bounds, avoiding a false failure at 15.999969px; component behavior is unchanged.

## Screenshots

- [Arabic dark Line, narrow](browser/line-chart-ar-dark-360.png)
- [Arabic light Area, narrow](browser/area-chart-ar-light-360.png)
- [English light Bar, desktop](browser/bar-chart-en-light-1440.png)
- [English dark Donut, desktop](browser/donut-chart-en-dark-1440.png)
- [Long Arabic tooltip boundary](browser/tooltip-long-arabic-boundary.png)
- [Live customization](browser/live-customization.png)
- [Connected period selection](browser/connected-period-narrow.png)

The browser directory also contains every display matrix screenshot and focused gap, isolated-point and long-label captures.

## Preservation and limitations

The original `/Users/amjedfadul/Tiraz` checkout remains at `ce78408818b6a9866ab0faa7748404cba44d8939`, with its README and workbench CSS edits preserved. Original working-diff SHA-256 remains `60c40d75854dc2d4fe61a0257dd2470837f36dc8041d80db18e17cdc2e8b2d08`; its staged diff remains empty (`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`). Port 5208 was initially served by PID 2548 and was never used or changed by this task. No listener was present on 5208 at the final check after the interruption; this task did not restart that unrelated server. The dedicated 5210 preview responds with HTTP 200. Only this task's own server/check processes were started, stopped or restarted.

Manual screen-reader announcements and physical-device touch were not verified. Recharts' supported keyboard layer passes local browser checks; VoiceOver requires QuickNav off according to its official guidance. The summary and optional semantic table provide an alternative to plot navigation. Axe results do not establish full accessibility conformance.

The production documentation build retains a non-failing bundle-size advisory: approximately 1,000kB minified JavaScript, 296kB gzip. Chart examples are a lazy module, but Recharts remains in the shared production bundle; no claim of fully deferred engine loading is made. The default palette has four distinct colors; callers should supply deliberate colors beyond four series and reuse ordered series definitions/colors across comparable charts. Dates show month/day in UTC; include year/range context in the application summary. No stacking, fetching, backend or persistence is provided.

Official references checked before implementation: [Recharts installation](https://recharts.github.io/en-US/guide/installation/), [tooltip API](https://recharts.github.io/en-US/api/Tooltip/), [active index](https://recharts.github.io/en-US/guide/activeIndex/), [accessibility guidance](https://github.com/recharts/recharts/wiki/Recharts-and-accessibility), and the package's React 19 peer contract. Visual inspiration: [Tremor](https://www.tremor.so/charts) and [shadcn charts](https://ui.shadcn.com/docs/components/chart); neither kit was imported.
