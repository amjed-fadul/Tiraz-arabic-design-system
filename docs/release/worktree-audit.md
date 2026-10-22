# Worktree and branch release audit

22 October 2026; fetched origin before comparison. Release base: `claude/woven` at `6ea6937`. Remote main `ab0649b` is an ancestor, 196 commits behind this base.

| Branch                              | Disposition                                                                                                                                                                                                                                           |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `claude/component-craft`            | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `claude/landing-night-loom`         | Older landing snapshot, superseded by the integrated Night loom landing and current showcase; preserve, do not merge.                                                                                                                                 |
| `claude/numerals-config`            | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `claude/suspicious-bun-04b6a2`      | The minmax(0, 1fr) demo-frame fix is already implemented in current components.css; no separate merge needed.                                                                                                                                         |
| `claude/woven`                      | Release source.                                                                                                                                                                                                                                       |
| `claude/woven-dash`                 | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `claude/woven-p5`                   | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `claude/woven-s1`                   | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `claude/woven-s2`                   | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `claude/woven-s3`                   | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `claude/woven-s4`                   | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/ai-content`                  | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/ai-context-controls`         | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/ai-decisions`                | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/ai-feedback`                 | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/ai-results`                  | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/avatar-overlays-empty-state` | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/charts-foundation`           | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/chat-foundation`             | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/consistency-review`          | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/dashboard-example`           | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/data-table-v1`               | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/feedback-and-avatar-photos`  | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/file-tree`                   | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/files-and-colors`            | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/form-controls-and-badge`     | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/form-foundation`             | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/labeled-input`               | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/landing-page`                | Older landing snapshot, superseded by the integrated Night loom landing and current showcase; preserve, do not merge.                                                                                                                                 |
| `codex/sidebar-foundation`          | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/slider-otp-date`             | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/steps-and-timeline`          | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/structure-and-navigation`    | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/table-foundation`            | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/tags-filters-copy`           | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/tasks-and-notifications`     | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/terminal-and-chat-app`       | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `codex/tiraz-ai-ready`              | Useful additions ported to current APIs and verified: three business patterns, generated knowledge, source verification/custom paths, shadcn registry and hosted AI guidance. Record integration ancestry after the final gate; see comparison below. |
| `codex/tool-activity`               | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `fix/nested-menu-focus-race`        | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `main`                              | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `milestone/ai-instructions`         | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |
| `review/component-customization`    | Already contained in Woven; no separate merge needed.                                                                                                                                                                                                 |

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

Ruling: npm rejected unscoped tiraz as too similar to tiag. The owner selected @amjedfadul/tiraz; the brand and tiraz.dev stay unchanged.

## AI-ready branch capability comparison

The earlier blanket superseded ruling was too broad. `codex/tiraz-ai-ready`
contains commits `00c3d43` and `3744f72`, based on the earlier six-component
system. It must not replace current component APIs, RTL Sheet placement or the
current workbench. Its additional capabilities are distinct from the current
portable `src/system/ai` registry.

| Capability                         | Current release                                                                      | Branch addition                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| AI component guidance and examples | Current portable guidance, broad registry and compiling examples ship in the package | Focused contracts for the earlier six-component system                              |
| Editable source installer          | npm CLI creates or adds to Vite React TypeScript apps                                | Configurable source destination, manifest hashes and verify command                 |
| Compiled npm package               | ESM, declarations, CSS, fonts and optional Khayt runtime                             | No compiled public npm package                                                      |
| Business patterns                  | Existing modern component families and example screens                               | All three adapted and exported by the current package                               |
| Metadata tooling                   | Authored portable component registry                                                 | Regenerated TypeScript API facts, token inventory and freshness checks now included |
| shadcn delivery                    | Registry built from the same release source; local real CLI install verified         | Prepared local registry and schema checks, not yet hosted or remotely verified      |
| Pilot and evaluation               | Release fixtures and consumer/browser verification                                   | Separate pilot app, benchmark scenarios and research reports                        |

Ruling: the owner approved including the useful AI-ready additions before release.
They are adapted to the current components, cancellation rules and package rather
than restoring the earlier six-component implementation. Generated metadata is
rebuilt against current APIs. The historical pilot/evaluation project and research
remain in branch history; they are not runtime package content. Existing authored
AI guidance remains the entry point, supplemented by generated facts.

Ruling: the optional shadcn path delivers the same Tiraz source for people already
using that workflow. Tiraz's own npm installer remains the primary quick start.
Generated public AI/registry files are build outputs; the deployment regenerates
them from the tested package source.

Main integration: `f84016f`. The previous README and panel-inset bytes remain in
`stash@{0}` (`pre-release-main-local-edits-2026-10-22`) and in
`/Users/amjedfadul/.codex/backups/tiraz-release-2026-10-22-main/`. Untracked
`.claude/` and `docs/research/` in main remain untouched.
