# Structure and navigation verification

Implemented locally on the user's Mac on October 14, 2026.

- Checkout: `/Users/amjedfadul/.codex/worktrees/structure-and-navigation/Tiraz`
- Branch: `codex/structure-and-navigation`
- Baseline: `0808c1a48a552e4920e979b0aea789795742f84a`
- Preview: [http://127.0.0.1:5208/](http://127.0.0.1:5208/), dedicated Vite server
  serving this working branch. The final tested local commit SHA is returned in
  the completion message; this report is committed with that implementation.
- Runtime: Node `v24.21.0`, installed locally at
  `/Users/amjedfadul/.nvm/versions/node/v24.21.0/bin`; macOS arm64 and installed
  Google Chrome. The default shell Node was too old; no toolchain files were
  changed to accommodate it.

## Result and scope

Card, Accordion, Breadcrumbs and standalone Pagination are exported, documented
and included in the portable registry. Card parts retain native attributes/ref;
Accordion delegates single-open keyboard/association behavior to Radix;
Breadcrumbs uses native destinations/current text; Pagination requests normalized
pages using existing Buttons and static ellipses. Added only the focused Radix
Accordion 1.3.1 dependency and its Collapsible 1.2.1 dependency. No unrelated
package upgrades. Documentation retains the continuous layout and one-line
prompt/Copy row with focused local examples and complete generated code.

DataTable and CustomerDataTable have no diff against baseline. Their data
handling/reset/clamping/loading and connected actions remain separate. No backend,
persistence, fake services or customer-workflow expansion was added.

## Local checks

Every npm command used the Node 24 PATH above. Full logs are linked.

| Check                     | Command                                                                                                                                                                                                                                                        | Result                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Baseline                  | `npm test`                                                                                                                                                                                                                                                     | [276 tests, 31 files passed](baseline.txt)                                       |
| Focused integration       | `npm test -- src/system/structure-navigation.test.tsx src/workbench/structure-navigation-pages.test.tsx src/workbench/generated-structure.test.tsx src/workbench/generated-code.test.ts src/workbench/generate-prompts.test.ts src/system/ai-registry.test.ts` | [96 tests passed before the final two exit-focus regressions](focused-final.txt) |
| Exit-focus correction     | `npm test -- src/system/structure-navigation.test.tsx src/workbench/generated-structure.test.tsx src/system/ai-registry.test.ts`                                                                                                                               | [38 tests passed](exit-focus-green.txt)                                          |
| Full suite                | `npm test -- --maxWorkers=2`                                                                                                                                                                                                                                   | [314 tests, 34 files passed](unit-final.txt)                                     |
| Build                     | `npm run build`                                                                                                                                                                                                                                                | [Passed](build.txt)                                                              |
| Lint                      | `npm run lint`                                                                                                                                                                                                                                                 | [Passed, no warnings](lint.txt)                                                  |
| Formatting                | `npm run format:check`                                                                                                                                                                                                                                         | [Passed](format.txt)                                                             |
| Browser/report formatting | `npx prettier --check tests/browser/structure-navigation* docs/structure-and-navigation/*.md`                                                                                                                                                                  | [Evidence](evidence-format.txt)                                                  |

Focused tests cover native semantics/refs; controlled/uncontrolled and reordered
Accordion values, disabled skipping, heading/button/region associations,
ArrowUp/Down/Home/End/Space/Enter, optional collapse and immediately inert closed
panels; Breadcrumb destinations/current text/decorative separators; Pagination
zero, negative, fractional, nonfinite, oversized inputs, MAX_SAFE_INTEGER,
range transitions, boundary disabling, controlled callbacks, nav ref, global
disabling and Arabic digits independent of direction.

Generated examples run actual Card reveal, real Breadcrumb anchor destinations,
local list slicing and both Accordion modes in Arabic/English. The generated-code
compiler checks every family and additional new presets against real exports.
Registry checks copy only `src/system` into a different application's
`app/ui/vendor/tiraz`, then compile every linked example with no workbench or
repository entry dependency. Prompt relocation checks produce identical prompts
from two physical checkout locations. These run in the full suite.

The default-worker full run overlapped browser/build/reviewer workloads and
failed 15 tests, including five-second UI timeouts, a fifteen-second compilation
timeout and downstream focus assertions. The complete names and output are kept
in [unit-concurrent.txt](unit-concurrent.txt): avatar-overlays-pages,
customer-flow, feedback-photos-pages, form-controls-pages, generated-batch,
generated-code, generated-data-table, overlay-regressions and
structure-navigation-pages. Final verification limits workers to two and runs
without concurrent browser/build workloads; no timeout was increased.

Build emits Vite's nonfatal warning for the documentation bundle exceeding
500 kB (about 571.5 kB minified). Code splitting is outside this small batch.

## Browser verification

[Main harness](../../tests/browser/structure-navigation.mjs),
[fixture](../../tests/browser/structure-navigation-fixture.tsx),
[results](browser/results.json), [console report](browser.txt).

- **64 combinations:** Arabic/English, light/dark, compact/standard density,
  standard/large type, 1280px/360px widths and OS motion/no-preference.
- Every combination exercises native semantics, disabled skipping, primitive
  keyboard navigation, one-open/optional collapse, normalized boundaries,
  compact ellipses, retained Next focus, font loading, mixed-direction isolation,
  mirrored separators and absence of document overflow.
- **Eight axe checks** on rendered fixture content: no violations. Automated
  checks supplement browser inspection and do not prove accessibility.
- Live provider changes exercise theme, accent, density, type, radius, direction
  and application reduced motion. Both motion sources stop disclosure motion.
- **16 documentation checks:** four pages × both languages × desktop/narrow,
  connected outcomes and actual clipboard code/prompt completeness. Real
  appearance controls update the mounted preview without a reload.
- [Supplemental keyboard/hover harness](../../tests/browser/structure-navigation-focus.mjs)
  and [results](browser/focus-hover.json): all four language/theme combinations
  pass Tab into open content, disabled skipping, visible 2px focus outline,
  hover feedback, immediate closed-content exclusion and native anchors.
- Successful final browser runs report **no page errors**. Representative
  screenshots were visually inspected for Arabic shaping, wrapping, spacing and
  mixed identifiers. No VoiceOver/screen-reader session was performed.

## Review and corrections

[Independent review and re-review](independent-review.md) found two confirmed
issues and both are resolved: the verification harness used the wrong English
copy-button name; Accordion's animated closing panel initially remained tabbable
while Radix retained it for visual exit. The latter was reproduced before the
fix, pinned with two failing regression tests and corrected with synchronous
native `inert`/`aria-hidden` while retaining animation and primitive keyboard
behavior. Independent rapid-exit browser checks pass. Stale navigation count
assertions were also updated from 23 to 27 for the four added pages.

## Checkout and server protection

[Protection record](checkout-protection.json) confirms the original
`/Users/amjedfadul/Tiraz` stays on `main` at
`ce78408818b6a9866ab0faa7748404cba44d8939`, with the same unrelated README and
workbench.css edits and byte-identical working/index diffs. All 20 original
application listener ports remain available. No existing process/server was
stopped. The OS rapportd service changed its own transient listener ports during
verification; its PID and persistent listener remain.

Worktree and documentation preview are retained. No push, merge, deployment,
publishing or next batch was performed.

## Representative captures

- [Arabic/light/narrow: all four components](browser/components-ar-light-narrow.png)
- [English/dark/desktop: all four components](browser/components-en-dark-desktop.png)
- [Arabic Card documentation](browser/docs-card-ar-narrow.png)
- [English Accordion documentation](browser/docs-accordion-en-desktop.png)
- [Live customized Pagination](browser/docs-pagination-live-customization.png)
