# Source updates implementation plan

> Use superpowers:executing-plans task by task; one final independent review.

**Goal:** Deliver upstream source updates while preserving and reviewing local edits.

**Architecture:** Share selective payload assembly and guarded file transactions
with add. Persist original content separately from app-owned files. Plan updates
from three snapshots, then apply or review explicit conflicts with backups.

**Tech stack:** Existing Node ESM CLI, semver, Git merge-file, Vitest and Vite.

**Spec:** `docs/superpowers/specs/2026-10-25-source-updates-design.md`.

## Global constraints

- Local only; no push, merge, publication, deployment or version bump.
- Theme and unrelated app files stay user-owned. No silent network/install.
- Existing full and selective manifests remain supported.
- Preserve source paths, licenses, Arabic/English guidance and current docs UI.

## Review focus

- Missing/deleted, binary and untracked files never silently lose user work.
- Baselines and review plans cannot claim unrelated app paths or stale inputs.
- Failed/partially interrupted writes leave recovery material; restore checks edits.
- Dependency changes do not widen existing ranges or leave mixed release baselines.
- A second update must preserve the edits retained by the first update.

### Task 1: Reliable original-source records

Files: `packages/tiraz/bin/{add-components,source-manifest,tiraz}.mjs`, new
`source-files.mjs`; `src/tests/source-updates.test.ts`, package-release tests.

Interfaces: `createComponentPayload({packageRoot,release,names,directory})` returns
`{files,manifest,dependencies}`; snapshot encode/decode validates manifest hashes;
guarded `commitPlan(root,writes,guards)` supports writes/deletions and rollback.

- [x] Test new installs and incremental additions retaining upstream baselines.
- [x] Observe failures; extract payload assembly and transaction helpers.
- [x] Save/validate baselines for full and selective installs; run focused tests.

### Task 2: Preview, merge, review, apply and restore

Files: new `update-source.mjs`, `merge-source.mjs`; CLI command dispatch and tests.

Interfaces: `updateSource({packageRoot,release,from,prepare,apply,review,restore})`;
`mergeSource(base,local,incoming)` returns a status and proposed bytes.

- [x] Write failing real CLI tests for preview/no writes, clean updates,
      local-only and non-overlapping merges, conflicts, deletion/binary handling.
- [x] Implement validated snapshot planning and explicit review decisions.
- [x] Test stale/tampered review and cache, unsafe paths and dependency conflicts.
- [x] Implement guarded apply with upstream baseline advancement and backups.
- [x] Test restore, later-edit refusal, repeat updates and rollback; run focused checks.

### Task 3: Consumer proof, guidance and local gate

Files: package README, source AI README, local verification report and tests.

- [x] Document exact local commands, legacy bootstrap, conflict decisions and limits.
- [x] Install a real local package into a temporary consumer, customize source/theme,
      update from a changed local payload and build it; inspect the preserved UI.
- [x] One fresh review; fix Critical/Important findings with regression tests.
- [x] Run full local tests/build/lint/format/metadata checks; record results.
- [x] Commit locally, verify 5411 and return branch/commit/preview URL.
