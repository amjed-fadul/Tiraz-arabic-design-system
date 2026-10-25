# Updating owned source safely

The user explicitly requested the next local milestone: update copied components
without losing custom changes. Build on 41ce688 in the existing woven checkout.
Do not push, publish, deploy or merge. Keep the documentation preview running.

## Approach

Hash-only replacement can preserve edited files but cannot deliver upstream fixes
into them. Blind overwrite loses edits. Use a three-way comparison of original,
local and incoming bytes, with Git's merge-file engine for text changed on both
sides. This is an implementation choice within the requested milestone, not an
additional preference attributed to the user. No new npm dependency is needed.

## Contract

- New full and selective installs save original bytes in `.tiraz/baseline.json`.
  Further adds update this baseline from upstream, never from customized source.
  The cache must match the installed manifest's hashes exactly.
- `tiraz update` previews the installed selection against the invoking CLI's
  source payload. It does not write project files or fetch packages.
- `update --prepare` also creates a review directory with original/local/incoming
  files and proposed text. Conflict decisions start unset. Existing review work
  is never overwritten. The printed path identifies this particular review.
- `update --apply [--review <id>]` applies a conflict-free plan, or explicit
  reviewed resolutions. Choices are local, incoming, delete, or an edited merged
  file. Unresolved markers, changed inputs, binary merges and unknown decisions
  block application. Conflicts never reach application files.
- Files changed only upstream update; local-only changes remain; non-overlapping
  text edits merge; overlapping edits, add collisions and modify/delete cases
  need review. Removed upstream files with local edits can be kept as untracked
  source. New dependencies are added, incompatible ranges stop before writing;
  no dependency is silently upgraded or removed and npm install is never automatic.
- The app's theme, routes, entry files, AGENTS and setup guide are not update
  targets. Shared source/managed assembly files participate in the same merge.
- Baselines advance to upstream bytes, not merged bytes, so future updates still
  recognize local changes. Updates cover the full installed selection, including
  its dependency closure, to avoid mixed-release metadata.
- Legacy schema-1/full and schema-2/selective installs work. If the baseline is
  absent, `--from <original-package-directory>` reconstructs it only when every
  hash matches. Never infer original content from edited files or fetch silently.
- Every applied update saves a durable before/after backup. `update --restore
<id>` restores only when affected files still match that backup's after-state.
  Later edits block restoration. Backups remain available after failures.
- Validate inventory, paths, symlinks, regular files and release identity before
  writes. Recheck files at commit, serialize add/update writes with a lock, and roll back
  write failures without overwriting concurrent edits. Stop on downgrade.

## Boundaries and verification

This is source reconciliation, not an API migration engine. A clean text merge
still requires the consumer's type checks, tests and browser inspection. Renames
are represented as additions/deletions. No package release or site redesign.

Exercise real temporary apps and fake release payloads: unchanged/local/upstream
and overlapping changes, binary files, deletion, new dependencies, stale reviews,
legacy bootstrap, tampered baselines, unsafe paths, symlinks, rollback and restore.
Use a real local package consumer for update/build verification. Run full local
tests, build, lint, formatting and metadata checks. Record limitations and keep
5411 available, preserving unrelated servers and `output/`.
