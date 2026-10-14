# Sidebar corrections — local verification

Worktree: `/Users/amjedfadul/.codex/worktrees/sidebar-foundation/Tiraz`
Branch: `codex/sidebar-foundation`
Correction base: `7d3950bcc26254ff8be9f5b2441348998d306c64`.
Preview remains running at http://127.0.0.1:5212/ with the dashboard at
http://127.0.0.1:5212/examples/dashboard.

## Corrected shared layout

SidebarHeader lays out SidebarIdentity and the toggle at opposite ends of one
horizontal row, naturally mirroring in RTL. The rail stacks logo then toggle.
SidebarIdentity is a native div/ref for branding or avatar + SidebarLabel.
Collapsed label/heading space and scrollbar width are removed; all controls use
the same rail frame. Fixed frames preserve horizontal icon positions during width
motion. Footer stays anchored while SidebarContent scrolls. Dashboard-specific
padding/flex-basis offsets were removed, retaining its three real destinations.

The documentation example contains seven top-level entries across Library and
Workspace groups, three Library children and initially active Components. Counts
come from actual local documents, fictional contributors and reminder lists.
Every destination reveals local content. Recent selections, reminder clearing,
summary preferences and account details are real in-memory actions. No service,
file download, router, persistence, dependency or product destination was added.
Default example height fits the richer navigation; short-height checks bound it.

## Geometry

Baseline avatar box was 4.80px off-axis in each language/theme; expanded header
branding/toggle occupied separate rows. Regression assertions failed before fixes.
After correction, logo, toggle, all seven rail navigation icons, avatar's actual
box and footer action share the root center. Width-motion sampling also found zero
horizontal navigation-icon movement, confirmed by the independent reviewer.

| Language / theme | Rail width | Maximum center deviation |
| ---------------- | ---------- | ------------------------ |
| ar / light       | 56px       | 0.00px                   |
| ar / dark        | 56px       | 0.00px                   |
| en / light       | 56px       | 0.00px                   |
| en / dark        | 56px       | 0.00px                   |

Dashboard logo, toggle, all three icons and actual avatar also share its rail axis.
Raw measurements: [before](before/geometry.json), [after](after/geometry.json).

## Verification

All checks ran locally on the user's Mac with Node 24.21.0 and installed Chrome.
Use `/Users/amjedfadul/.nvm/versions/node/v24.21.0/bin/node` for these commands.

- `node node_modules/vitest/vitest.mjs run --maxWorkers=4`: **366 passed, 41 files**.
  Includes generated code, portable source relocation/compilation and API registry.
- Focused Sidebar/sample/dashboard suites: **18 passed**. Covers root/disclosure
  control, names, active state, refs/native props, external-collapse focus,
  hash history and all richer sample destinations/actions.
- `node node_modules/typescript/bin/tsc -b` and
  `node node_modules/vite/bin/vite.js build`: passed; existing bundle-size warning.
- `node node_modules/oxlint/bin/oxlint`: passed without warnings.
- Prettier check for source, standard project targets, changed browser scripts
  and these Markdown notes: passed. `git diff --check`: passed.
- `tests/browser/sidebar-corrections.mjs`: passed in Arabic/English light/dark,
  expanded/rail. Measured actual boxes, header row/stack, short rail Tab scrolling,
  fixed header/footer, focus during collapse/expand, long labels/count separation,
  active child/parent, both reduced-motion settings and a 390×300 mobile Sheet.
- `tests/browser/sidebar.mjs`: existing interaction/scroll/focus/Tooltip checks
  passed, including updated sample history and actual copied code/prompts.
- `tests/browser/dashboard.mjs`: passed again, including real section links,
  creation/validation/filtering, metrics, 320/390/768/1440 layouts, mobile dismissal
  and destination focus, short Sheet, no console errors/warnings and no axe A/AA
  findings. Use TIRAZ_URL/TIRAZ_EVIDENCE and the bundled TIRAZ_PLAYWRIGHT runtime;
  no project browser dependency was added.

Independent review was clean; a final re-review verified fixed frame width motion
and all centers with no actionable findings. The reviewer changed no files.

## Before / after screenshots

| View                  | Before                                   | After                                  |
| --------------------- | ---------------------------------------- | -------------------------------------- |
| Arabic light expanded | [before](before/ar-light-expanded.png)   | [after](after/ar-light-expanded.png)   |
| Arabic light rail     | [before](before/ar-light-collapsed.png)  | [after](after/ar-light-collapsed.png)  |
| English dark expanded | [before](before/en-dark-expanded.png)    | [after](after/en-dark-expanded.png)    |
| English dark rail     | [before](before/en-dark-collapsed.png)   | [after](after/en-dark-collapsed.png)   |
| Dashboard expanded    | [before](before/dashboard-expanded.png)  | [after](after/dashboard-expanded.png)  |
| Dashboard rail        | [before](before/dashboard-collapsed.png) | [after](after/dashboard-collapsed.png) |

All eight language/theme/state images are in each folder. Also see
[short rail](after/short-rail.png) and [short mobile Sheet](after/short-mobile-sheet.png).
The before images capture the actual prior implementation, not the unavailable
attachments. After images include the requested richer navigation.

## Preservation and limitations

Original checkout remains on main with its prior README.md and
src/workbench/workbench.css edits, and no staged changes. Port 5211 listener
PID 95351 and working preview PID 8345 were preserved. No unrelated server was
changed. Local commit only; no push, merge, deployment or publication.

The four attached reference files were not exposed in this conversation; the
implementation follows the user's concrete corrections and measured prior UI.
VoiceOver and other browser engines were not manually verified. Automated scans
are evidence, not a claim of complete accessibility conformance. Build retains a

> 500kB bundle warning. The local example resets on reload.
