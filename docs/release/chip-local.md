# Shared Chip — local verification

Date: 25 October 2026. Checkout: `/Users/amjedfadul/Tiraz-worktrees/woven`.
Branch: `codex/chip`. Base: `d496f852d32b50918bba6557244f8d09f4e3b227`.
The tested source is recorded by the commit containing this report.
No merge, push, deployment, publication or package-version change.

## Delivered

- Native button and anchor modes with controlled selection, disabled state,
  forwarded native refs/attributes, and small/regular sizes.
- Components category navigation and Illustrations filters use the same Chip.
- Arabic/English playground with single selection, multiple selection and real
  navigation; editable labels, selection, disabled state and size.
- Public exports, AI registry, API facts, composition guidance, generated examples
  and selective source installation include Chip. Badge remains a status label.

## Local checks

- `npm test -- --maxWorkers=2`: 159 files, 2,006 tests passed (292.98 s).
- `npm run build`: passed, including package runtime/declarations/source,
  registry generation, TypeScript compilation and Vite site build.
- `npm run registry:check`: registry delivery current.
- `npm run knowledge:check`: generated knowledge current.
- `npm run lint -- --ignore-pattern output/`: zero errors and warnings.
- `npm run format:check`, additional plan/report formatting, and
  `git diff --check`: passed.
- Direct audit of all registered CSS families: `[]`.
- Preview returned HTTP 200; PID 25946 serves the woven checkout on 5411.

Vite reports its existing large-chunk advisory for documentation/QuickStart.
No bundle-size optimization was attempted in this component change. jsdom logs
its known unsupported full-document navigation message in modifier-link tests;
the assertions pass and browser navigation was inspected separately.

Focused package-release suite: 63 passed, including independent Chip installation
with its CSS and without Button, Lucide or Recharts dependencies.
Focused final regressions: 22 passed across Chip page, sidebar exploration and
all generated-code cases. Copied navigation now derives its current location
from the fragment; stable example IDs survive direct links and reloads.

## Browser inspection

Inspected the actual local site with the in-app browser at CSS viewports
1440 × 1000 and 390 × 844, in Arabic/RTL and English/LTR, light and dark.
Checked both gallery rows, selected styling, row wrapping, a long Arabic label,
customization controls, Enter/Space activation, focus retention, disabled state,
real native hrefs, fragment targets, Back/Forward, and reload at a fragment.
No horizontal page overflow in the inspected phone layouts. Both galleries use
36px controls in compact density. The native link lands focus on its section;
filter activation keeps focus on the chip. The component creates no live region.

Evidence directory:
`/Users/amjedfadul/.codex/visualizations/2026/10/25/tiraz-chip/`.
Files include `chip-customize-ar.png`, `chip-ar-light-desktop.png`,
`chip-en-dark-phone.png`, `chip-ar-dark-phone.png`, `library-ar-dark-phone.png`,
`library-en-light-desktop.png`, `illustrations-ar-dark-phone.png`, and
`illustrations-en-light-desktop.png`.

No screen-reader session or Firefox/Safari rendering session was run. Browser
inspection and accessibility-tree checks do not establish those results.
Forced-colors treatment is covered by the CSS rules/audit, not a visual OS check.

## Independent review and fix

One fresh read-only review found one Important issue: copied navigation did not
synchronize current-location state with browser history. A regression failed,
then passed after subscribing to native hash changes. A second regression caught
unstable fragment IDs across remounts; the example now uses a stable, optionally
customizable ID prefix. The core Chip remains stateless. Browser Back/Forward
and reload were then checked directly. No Critical or Minor findings remained.

The initial full gate caught three obsolete sidebar tests that treated “chip”
as a Badge alias. Focused reproduction confirmed this was the expected catalog
change; tests now require the real Chip result while retaining TagInput and
Arabic Badge alias coverage. A lint warning about mixed React/function exports
was fixed by moving the unchanged routing helper to its own module.
The relocation fixture was updated to include ChipExamples; the real generator
then produced identical prompts from both locations (168 focused tests passed).

## Decisions retained from the execution ledger

1. Selection and grouping belong to the application, with no router or selection
   engine inside Chip. The application must update `selected` and name its group;
   a missed host update leaves a controlled chip unchanged.
2. Disabled anchors lose href and Tab access but retain link semantics. This
   prevents native/new-tab activation; disabled choices are skipped by keyboard
   tabbing, like disabled buttons.
3. Selected anchors default to `aria-current="page"`; hosts can choose `location`
   for fragment navigation. The host must choose a truthful current state.
4. Reviewer-declined selection/group keyboard management stays outside Chip,
   consistent with the native controls above; consumers own that behavior.
5. Owner `output/` content remains untouched and is excluded from lint. This
   report makes no verification claim about those unrelated files.

No deferred minors. Working preview stays on port 5411; unrelated localhost
servers are preserved.

Native behavior follows the WAI guidance for
[buttons](https://www.w3.org/WAI/ARIA/apg/patterns/button/) and
[links](https://www.w3.org/WAI/ARIA/apg/patterns/link/).
