# Core discovery and customization — local verification

Date: 25 October 2026.

Checkout: `/Users/amjedfadul/Tiraz-worktrees/woven`, branch
`codex/core-discovery`, based on `63c177e6764e0833c20485e9d5a68425c608a95d`.
The commit containing this report is the tested implementation. No push,
merge, deployment or npm publication is part of this milestone.

## Delivered

- The core catalog starts with twelve everyday families, followed by the
  remaining components grouped by purpose. Every catalog entry appears once.
  Thirteen families use actual, inert Tiraz previews instead of small screenshots.
- Collection links and in-content search share bilingual aliases with the
  sidebar. Chips, radio buttons and other familiar names lead to the relevant
  controls. Category URLs, clear/Escape behavior and browser history remain usable.
- Related-component links connect common alternatives. Input type and Select
  label/required are now available in the customization panel.
- Separate custom action colors for light and dark modes persist locally.
  The preview uses a computed black/white foreground and a hover color that
  increases contrast. Choosing a preset or resetting appearance clears overrides.
- Theme export copies the colors and corners into editable `tiraz.theme.css`.
  Copied examples carry the same rules; the prompt explains how to consolidate
  them into the app-owned file and preserves selective source installations.
  Other behavior settings remain in the existing configuration/example export.

The approved sidebar, prompt/copy row and Night loom landing remain in place.
This milestone changes the workbench, not component APIs or the public package version.

## Local checks

All commands ran on the owner's Mac with Node 24.21.0.

- Focused regression checks: discovery, customization, sidebar/navigation,
  inspector, copy handling, standalone preview and generated TSX compilation.
  Custom-theme examples compile for every catalog family.
- Final `npm test -- --maxWorkers=2`: 1,969 passed across 156 files,
  including generated examples and CSS audit tests (316.80 seconds).
- `npm run build`: passed, including package runtime/declarations/editable
  source, registry generation, TypeScript and the production site. Vite retains
  its existing large-chunk warning.
- `npm run lint -- --ignore-pattern output/`: passed with no warnings/errors.
  The unrelated, untracked owner `output/` directory is excluded and untouched.
- `npm run format:check`: passed.
- `npm run knowledge:check`: passed.
- `npm run registry:check`: passed.
- `git diff --check`: passed.
- Direct `auditFamily` check of all registered Woven families and the new
  discovery stylesheet: `[]`.

The first full run exposed stale structural expectations for the new theme
section/related links and old full-bundle prompt expectations. Those assertions
now cover the intended layout and subset guidance; the relocated prompt fixture
also includes the new theme module. One clipboard fallback assertion passed
alone after failing in a combined run; it now awaits the asynchronous fallback.

## Browser evidence

Inspected the local site through the in-app browser in Arabic/English and
light/dark modes at desktop widths (1,190 and 1,440 CSS pixels) and a 390 × 844
CSS-pixel phone viewport. Temporary viewport overrides were reset afterward.

- Buttons, Input and Badge lead the wide catalog; phone collections wrap and
  previews form a single column. No horizontal overflow in the inspected views.
- “chips” finds Badge and TagInput. Searching within Forms keeps TagInput and
  excludes Badge. Clearing retains input focus; collection navigation retains
  link focus; Back restores the collection without resurrecting its old query.
- Mobile sidebar search opens with Command-K; Escape clears the query, then
  closes the panel and restores focus to its toggle.
- Custom light `#B43270` and dark `#D7ACF5` changed the preview, with white and
  black action text respectively. The documentation shell retained its palette.
  Radius and both colors appeared in the copied CSS; reset removed custom values.
- Input type changed to email in the rendered input. A customized Select label
  became its accessible name, and Required set `aria-required="true"`.
- Theme copying works in both languages. Closing the desktop panel or phone
  sheet restores focus to Customize. Denied-copy fallback and a single panel
  status region are covered by automated tests. Browser error/warning log: empty.

Screenshots are outside the repository at:
`/Users/amjedfadul/.codex/visualizations/2026/10/25/tiraz-core-discovery/`.
Files include `catalog-ar-light.png`, `catalog-en-dark.png`, both phone catalogs,
and Arabic/English phone customization.

## Review and limits

A fresh review found two important issues: mode-based hover mixing could reduce
contrast for mid-tone custom colors, and three prompts still required copying
the complete source bundle. Both have regression coverage and are fixed.
The React quality pass also removed a query-reset effect and separated preview
metadata from the component module; lint is clean.

Browser inspection supplements tests; it does not certify accessibility.
Physical devices, screen-reader speech and arbitrary consumer CSS/CSP were not
tested. Copy failure was simulated in tests. The existing consumer demo on 5413
was preserved but was not rebuilt for this workbench-only milestone.

Preview: `http://127.0.0.1:5411/library`. Keep this server running.
