# Worktree and branch release audit

22 October 2026; fetched origin before comparison. Release base: `claude/woven` at `6ea6937`. Remote main `ab0649b` is an ancestor, 196 commits behind this base.

| Branch                              | Disposition                                                                                                                                                                                           |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `claude/component-craft`            | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `claude/landing-night-loom`         | Older landing snapshot, superseded by the integrated Night loom landing and current showcase; preserve, do not merge.                                                                                 |
| `claude/numerals-config`            | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `claude/suspicious-bun-04b6a2`      | The minmax(0, 1fr) demo-frame fix is already implemented in current components.css; no separate merge needed.                                                                                         |
| `claude/woven`                      | Release source.                                                                                                                                                                                       |
| `claude/woven-dash`                 | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `claude/woven-p5`                   | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `claude/woven-s1`                   | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `claude/woven-s2`                   | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `claude/woven-s3`                   | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `claude/woven-s4`                   | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/ai-content`                  | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/ai-context-controls`         | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/ai-decisions`                | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/ai-feedback`                 | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/ai-results`                  | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/avatar-overlays-empty-state` | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/charts-foundation`           | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/chat-foundation`             | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/consistency-review`          | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/dashboard-example`           | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/data-table-v1`               | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/feedback-and-avatar-photos`  | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/file-tree`                   | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/files-and-colors`            | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/form-controls-and-badge`     | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/form-foundation`             | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/labeled-input`               | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/landing-page`                | Older landing snapshot, superseded by the integrated Night loom landing and current showcase; preserve, do not merge.                                                                                 |
| `codex/sidebar-foundation`          | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/slider-otp-date`             | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/steps-and-timeline`          | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/structure-and-navigation`    | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/table-foundation`            | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/tags-filters-copy`           | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/tasks-and-notifications`     | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/terminal-and-chat-app`       | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `codex/tiraz-ai-ready`              | Earlier AI-ready prototype: repository-level knowledge/pilot tooling is superseded by the portable system/ai registry, guidance and source-copy checks. Preserve as research; do not merge wholesale. |
| `codex/tool-activity`               | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `fix/nested-menu-focus-race`        | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `main`                              | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `milestone/ai-instructions`         | Already contained in Woven; no separate merge needed.                                                                                                                                                 |
| `review/component-customization`    | Already contained in Woven; no separate merge needed.                                                                                                                                                 |

All remote branches are contained except the same two historical landing refs, whose content is superseded. No branch or worktree was deleted.

## Uncommitted work

| Checkout                                                          | Findings and disposition                                                                                                                                                                                           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/Users/amjedfadul/Tiraz`                                         | README and old customization-panel inset edits, plus untracked local/research files. Preserve before main integration; do not include obsolete panel layout in the release.                                        |
| `/Users/amjedfadul/Tiraz-worktrees/component-craft`               | Browser evidence scripts/fixtures, including old model names, disclosure timing and former docs layout. Product commits already included; leave the evidence work untouched.                                       |
| `/Users/amjedfadul/Tiraz-worktrees/landing-night-loom`            | Earlier landing adjustments; current landing carries the approved direction plus the updated shared QuickStart, brand and component/screen showcase. Keep the old preview/edits untouched.                         |
| `/Users/amjedfadul/Tiraz-worktrees/numerals`                      | Numeral preference plumbing and tests are already in Woven (numberLocale, chart-format, numerals tests and persisted preferences). Preserve this earlier dirty checkout; do not replace modern components with it. |
| `/Users/amjedfadul/Tiraz/.claude/worktrees/suspicious-bun-04b6a2` | Untracked local .claude state; preserve, exclude from release.                                                                                                                                                     |

## Rulings

Ruling: Woven is the integration source — it already includes the component, numeral, Woven stream and dashboard commits; merging historical snapshots would conflict with accepted UI.

Ruling: preserve main's old local panel edits separately if they cannot apply to the new layout — the owner's bytes must survive, but obsolete layout must not replace the approved workbench.

Ruling: publish from packages/tiraz — the root remains a private website/test workspace, preventing accidental publication of the workbench or local evidence.

Ruling: source init is limited to Vite React TypeScript apps — the portable sample assets use Vite URL imports and the avatar imports PNGs. Other React bundlers use compiled package imports; unsupported source targets fail before writes.

Ruling: force production mode before importing Vite in the package builder — tests spawn the builder with NODE_ENV=test, which must never change release JSX. A real production render checks that boundary.
