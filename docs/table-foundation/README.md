# Table foundation — local verification

Baseline: `1aac66e61a99c66605363f1715ab568936cbf388`.
Working branch: `codex/table-foundation` in
`/Users/amjedfadul/.codex/worktrees/table-foundation/Tiraz`.
Preview: <http://127.0.0.1:5175/>. All implementation, unit tests, compilation,
browser probes, builds, lint, and formatting ran locally on the user's Mac through
this Codex session. The returned local commit contains the verified source;
[verification.json](verification.json) records source hashes, commands and evidence.

Table is a small native family: Table, TableHeader, TableBody, TableRow, TableHead,
and TableCell. Caption/ARIA names the table and keyboard scrolling region.
Attributes/ref remain on their native element; containerProps is separate.
Shared system density, typography, theme and direction apply. No dependency or
advanced grid feature was added. CreateCustomer handlers/state are preserved;
its empty content and saved name/email/status now appear in semantic Table rows.
Field remains a public helper documented under Input.

## Checks

- Baseline: 169 unit tests passed. Six initial regressions failed before Table existed.
- Focused: 15 tests in 5 files passed, including generated code, portable source copy,
  native semantics/ref/attributes, saved Table page, complete copying, stable customer
  rows, validation, duplicate-save guard, cancellation and focus restoration.
- Independent review reproduced a caption + ARIA naming mismatch in Chrome.
  Supplemental regression: 1 failed / 3 passed before the fix; all 4 Table tests
  passed afterward. Review and re-review found no remaining actionable issues.
- Final full suite: `npm test -- --maxWorkers=2` — **176 tests, 20 files passed**.
- `npm run build`, `npm run lint`, `npm run format:check` — passed.
  Additional Prettier check for AGENTS.md and changed browser scripts — passed.
- `node tests/browser/table.mjs` — **65 checks, 64 measurements, 30 screenshots**,
  no console/page errors. Table and connected Sheet in 32 combinations: Arabic/English,
  light/dark, compact/standard density, standard/large text, 1440/390px.
- Existing `node tests/browser/labeled-input.mjs` — **19 checks**, no errors.
  Saved Field redirection, Input customization and complete prompt/code copying remain intact.

Browser runs used local runtime Playwright via `TIRAZ_PLAYWRIGHT`, local Google Chrome
via `TIRAZ_BROWSER`, and `TIRAZ_URL=http://127.0.0.1:5175`. Full paths and logs are
in verification.json. [Browser results](browser/results.json) record each measured
configuration; [Input regression results](input-regressions/results.json) retain
previous-flow checks. At standard text scale on English desktop, compact row height
was **34.1875px**, standard **42.1875px** (+8px). All narrow cases had internal
horizontal overflow, keyboard arrow scrolling and no document horizontal overflow.
Cells wrap at both text scales. Shared Blue accent/12px corners applied to focus
and containers. Visual inspection covered representative Arabic/English,
light/dark, desktop/narrow and both density/text scales.

## Representative captures

- [Arabic Table, desktop](browser/table-ar-light-compact-standard-1440.png)
- [English Table, desktop](browser/table-en-light-compact-standard-1440.png)
- [Arabic Table, dark/narrow/large](browser/table-ar-dark-standard-large-390.png)
- [English Sheet, large/standard](browser/sheet-en-light-standard-large-1440.png)
- [English Sheet, dark/narrow](browser/sheet-en-dark-compact-standard-390.png)
- [Arabic customer form, dark/narrow/large](browser/sheet-ar-dark-standard-large-390-form.png)

## Limits

Firefox/WebKit, a manual screen-reader session, physical touch devices and production
were not tested. Automated semantics/AX checks are evidence, not a guarantee of
accessibility. Sorting, filtering, pagination, selection, editing, virtualization
and sticky columns are outside this foundation. Customer data remains in memory.
No push, merge, deployment or further milestone occurred.
