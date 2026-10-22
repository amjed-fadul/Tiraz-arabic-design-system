# Local FileTree verification

Checkout: `/Users/amjedfadul/.codex/worktrees/file-tree/Tiraz`
Branch: `codex/file-tree`
Base: `939215aa7ef0d699ef1ae8091314e9ce01f9e678`
Runtime: Node 24.21.0 on the user's Mac. No dependencies or lockfile changes.
Preview: http://127.0.0.1:5247/ — choose Files → FileTree (الملفات → شجرة الملفات).
The exact final local commit is returned in the chat. All final checks below use
its source; the final commit also includes this evidence.

## Checks

- `npm test -- --maxWorkers=4`: **61 files, 520 tests passed**, including every
  generated example in Arabic/English, controlled/empty FileTree variants and
  registry/source-only compilation after relocating only the library.
- `npm run build`: passed (TypeScript and Vite). Vite reports its >500 kB chunk
  advisory; no compiler errors.
- `npm run lint`: passed without warnings.
- `npm run format:check` plus Prettier checks of the new browser fixture/script,
  portable composition guidance, reports and plan: passed.
- `git diff --check`: passed.
- Independent review: all three P2 findings fixed and re-reviewed; no remaining
  actionable findings. See review.md and the failing-before-fix evidence.

## Rendered verification

Local Chrome checks and screenshots are in browser/; the reproducible command is
`node tests/browser/file-tree.mjs`. The script covers all 32 combinations of
Arabic/English, light/dark, 1440/320 px, compact/standard density and
standard/large typography. It checks long mixed-direction names, filename/icon
alignment, row/document overflow and application-owned selected-file preview.

The same script exercises visible-node keyboard navigation, Home/End, repeated
character typeahead, expansion/collapse, selection vs focus, Space vs Enter,
controlled nested collapse, data deletion/reorder/empty/refill, and outside focus
on both a button and a nonfocusable heading. RTL horizontal arrows and both
application/OS reduced motion are checked. Continuous documentation and copied
code/prompt synchronization are exercised in Chrome. The component Axe scan has
zero violations; its empty-tree `aria-required-children` result requests manual
review because no items are supplied. Browser accessible snapshots and an
independent Chrome accessibility-tree inspection confirm individual filenames
and metadata descriptions. This does not substitute for screen-reader testing.

## Development-run notes and limits

Earlier development runs included a missing relocated raw-source fixture (fixed)
and two timing failures under concurrent load: the registry validator's
`rejects incorrect required=false for tabs.label` timeout and the existing Toast
`expires a new toast after pointer-only dismissal of the last message` check.
The final settled-source full suite passed with four workers. Intentional failing
FileTree regressions are preserved separately. Long Chrome screenshot runs timed out during capture. The final complete run
uses a fresh tab for every case and captures static animation frames; reduced
motion is checked separately. All 32 final captures and interaction checks passed.

The installed jsdom accessibility-name calculator includes grouped descendant
names in a parent tree item, unlike Chrome and the APG pattern. Unit focus tests
locate the row by its own visible filename; browser role/name checks and AX
inspection verify naming.

DOM assertions, accessible snapshots and automated scans do not establish actual
screen-reader behavior. VoiceOver and other screen readers were not manually
verified; Safari and Firefox were not inspected. Host filesystem/opening behavior
is deliberately outside the component: this is supplied data and host callbacks.

The original checkout's README/workbench CSS edits and index were untouched.
Landing checkout stayed at `9881dbc9c8b52aa80aea38e79ab9476b45f5bb0a`.
Unrelated servers remain running; this work adds only the preview on port 5247.
No push, merge, deployment or additional component family was performed.
