# Steps and Timeline verification

Completed locally on the user's Mac, 15 October 2026 (Asia/Dubai).

- Baseline: `e0fc39d7be1aed9c0723be415f3810e326003c5b`.
- Branch: `codex/steps-and-timeline`.
- Checkout: `/Users/amjedfadul/.codex/worktrees/steps-and-timeline/Tiraz`.
- Tested source: the local commit containing this report; final SHA returned in chat.
- Preview: <http://127.0.0.1:5241/> (Vite, strict port, left running).
- Local runtime: bundled Node 24.19.0. No dependency/package/lock changes.

## Delivered

Steps and Timeline, portable application-owned examples, continuous documentation
pages under Navigation and Data, minimal inspectors, complete generated usage and
copied prompts, exports and registry/record metadata. Portable family count is 43.
Both Formic references were accessible and visually inspected in the local Mac
browser. They inspired the compact indicators and quiet rails.

## Checks

- Focused behavior: initially seven passing contracts; now eight with the independent
  review regression. Covers statuses/current semantics, opt-in keyboard activation,
  native roots/refs, stable identity, form validation/focus/value preservation/local
  completion, supplied event order/dates, local append and empty content.
- `npm test -- --maxWorkers=2 --testTimeout=15000`: **55 files, 477 tests pass**.
  Includes both-language copied runtime, all generated code variants, exact prompt
  relocation, registry/type integrity, and an actual source-only relocated consumer
  compiling generated Steps/Timeline snippets alongside the portable examples.
- `npm run build`: pass. Existing large-chunk warning remains; no splitting/refactor
  was introduced in this focused batch.
- `npm run lint`: pass, no findings.
- `npm run format:check`: pass. Additional browser fixture/script and report formatting
  also checked with Prettier. `git diff --check`: pass.
- `node tests/browser/steps-timeline.mjs`: **23 grouped checks pass**, zero page errors.
  Sixteen combinations of Arabic/English, light/dark, horizontal/vertical and
  1440/360px, plus 320px overflow. Long multiline and unbroken mixed-direction
  content, logical order, indicator/connector alignment, absent trailing rails,
  localized dates and loaded IBM Plex font checked. Real browser form focus,
  Back/Next values and completion, Tab/Space activation/focus outline, timestamped
  in-memory append, empty/content actions, live orientation/theme/accent,
  application/OS reduced motion and full clipboard code/prompt all checked.
  Documentation axe structure, names and contrast pass after theme settles.
- Independent reviewer inspected source and browser evidence. Its P2 stage-focus
  ordering finding was reproduced, fixed, regression-tested and independently
  re-reviewed. Correct text at focus time verified through Next/Back/completion.
  No remaining actionable findings. See [review](review.md).

## Earlier failures and resolutions

The initial shell used Node 20, below this repository's engine requirement. Commands
were switched locally to bundled Node 24 and installation repeated using the existing
lockfile. No project/runtime dependency was changed.

Baseline: 457 pass, three timing failures (generated compiler and two DatePicker
month-navigation checks). An intermediate full run had compiler/Input timing failures
and the prompt relocation fixture lacked the two new raw-source entries. The latter
was fixed in the fixture. Compiler-only limits are now 45 seconds for the growing
43-family source graph; the final full run uses two workers and a 15-second default
for functional tests. All final checks pass. Initial logs are retained honestly.

## Preservation and limits

The original `/Users/amjedfadul/Tiraz` remains on main with its existing unstaged
README.md and src/workbench/workbench.css edits; its index remains empty. The batch
changes no entry point, dashboard files, workbench CSS, landing-page files or package
files. Existing port 5227 (PID 32252) and landing server 5237 (PID 76030) remain
running; no unrelated process was stopped. Preview 5241 responds HTTP 200.

No push, merge, deployment or publication. Chrome-based desktop automation does not
prove real screen-reader speech, Safari/Firefox behavior or physical touch-device
behavior; those were not manually tested. Event data is explicitly in-memory and
form completion makes no saving/backend claim. Timeline dates/valid dateTime values,
step eligibility and all process/navigation rules belong to the application.

## Representative captures

- [Arabic Steps documentation](browser/docs-steps-ar-light.png)
- [English Timeline documentation, dark](browser/docs-timeline-en-dark.png)
- [Arabic dark narrow long content](browser/ar-dark-360-vertical.png)
- [English light desktop long content](browser/en-light-1440-horizontal.png)
- [Machine-readable browser results](browser/results.json)
