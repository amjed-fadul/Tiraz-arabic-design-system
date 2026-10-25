# Updating copied components — local verification

Date: 2026-10-25. Checkout: `/Users/amjedfadul/Tiraz-worktrees/woven`.
Branch: `codex/source-updates`, based on `41ce688`. The tested source tree is
recorded in the commit containing this report. No merge, push, publication,
version bump or deployment was performed. The public package remains `0.1.2`;
these commands belong to the local development CLI.

## Delivered

- Full and selective installations retain original source bytes separately in
  `.tiraz/baseline.json`, validated against `tiraz.project.json`.
- `update` previews changes without writing application files or fetching code.
- Non-overlapping local/upstream edits merge using
  [Git merge-file](https://git-scm.com/docs/git-merge-file). Conflicts require
  explicit review in a separate folder. Conflict markers never enter live source.
- `--prepare`, `--apply --review <id>` and `--restore <id>` cover review,
  application and guarded restoration. Every applied update saves a backup.
- Stale source, review, dependency or target-release inputs block application.
- User themes, routes, entry files and project instructions are excluded.
- Missing original baselines can be reconstructed with `--from` only if every
  original hash matches. Full/schema-1 and selective/schema-2 installs work.
- New dependencies are listed and added; incompatible existing ranges stop the
  update. No automatic npm install, range upgrade or dependency removal.

From an installed app, with the local package already built:

```sh
node /Users/amjedfadul/Tiraz-worktrees/woven/packages/tiraz/bin/tiraz.mjs update
node /Users/amjedfadul/Tiraz-worktrees/woven/packages/tiraz/bin/tiraz.mjs update --prepare
node /Users/amjedfadul/Tiraz-worktrees/woven/packages/tiraz/bin/tiraz.mjs update --apply
```

Use the CLI from the desired incoming release. For a conflict, edit the printed
review's `plan.json` decisions and use `--apply --review <id>` instead. The
[package README](../../packages/tiraz/README.md) documents every choice and recovery.

## Local checks

- `npm test -- src/tests/source-updates.test.ts --maxWorkers=1`: 20 passed.
  Tests run real CLI commands in temporary apps: multiple update generations,
  conflicts, deleted/binary/untracked files, dependencies, stale reviews, modified
  clean proposals, legacy baselines, unsafe paths, restore and injected failures.
- `npm test -- --maxWorkers=2`: 1,989 passed across 157 files, including generated
  example compilation and package installation tests (341.29 seconds).
- `npm run build`: passed, including package/declarations, generated registry,
  TypeScript and site. Vite retains its existing large-chunk advisory.
- `npm run lint -- --ignore-pattern output/`: passed with no warnings/errors.
  Owner's unrelated untracked `output/` is excluded and untouched.
- `npm run format:check`: passed.
- `npm run knowledge:check`: passed.
- `npm run registry:check`: passed. An earlier parallel attempt overlapped the
  package test's artifact rebuild; the serialized retry passed.
- Registered-family CSS audit: `[]`.
- `git diff --check`: passed.

## Real packaged consumer

Packed the real local package as `amjedfadul-tiraz-0.1.2.tgz`, extracted it and
installed `button`, `input`, and `badge` into a separate Vite/React app with its
own installed dependencies. Added a custom button class and blue/radius theme.
A copied incoming package with a **test-only** version `0.1.3` changed a different
line in the same Button source. No repository/package version was changed.

Preview identified a merge. Apply retained both edits, left the theme byte-for-byte
unchanged and saved a backup. Restoring then preparing/applying a review with the
final CLI also succeeded. Both resulting consumers passed `tsc --noEmit && vite
build`. A test-only `0.1.4` payload with Git absent from PATH safely requests manual
review and leaves installed source, theme, manifest and baseline unchanged.

Consumer: `/var/folders/wk/dcql9dfd74l1ktt20q5rvln40000gn/T/tiraz-update-proof-3h0m0ez1/app`.
Preview: <http://127.0.0.1:5414/>. Existing documentation preview remains
<http://127.0.0.1:5411/library>; the previous consumer on 5413 is preserved.

Browser inspection confirmed Arabic/English labels and direction, light/dark
custom colors, responsive wrapping at 390 CSS pixels with no horizontal overflow,
input accessible names, Tab from the input to the button, Enter submission and
focus retained after the success label appeared. No browser warnings/errors were
recorded. This is a consumer sanity check, not a full accessibility certification.

Evidence lives outside the repo:
`/Users/amjedfadul/.codex/visualizations/2026/10/25/tiraz-source-updates/`:
`arabic-light.png`, `english-dark.png`, `arabic-phone.png`, `english-phone.png`.
Temporary browser emulation was reset and the documentation tab restored.

## Independent review and decisions

One fresh read-only review found one Important issue: strings written by `add`
were not normalized for rollback's byte comparison. A real add test failed at
its final baseline rename, demonstrating changed metadata left behind. The fix
normalizes writes to bytes at the transaction boundary; the new regression and
all focused tests pass. No other blocking issue was reported.

Deferred minor: the existing full-source `init` command does not participate in
the `add`/`update` write lock. Do not run initial installation commands concurrently.
This is documented; updating an already-installed app uses the lock.

Rulings made during implementation:

1. Use Git's existing merger with manual review when Git is unavailable. Cost:
   automatic two-sided text merging needs Git on PATH.
2. Reject edits to a clean generated proposal; edit app source and prepare again.
   Cost: an extra preparation step, avoiding silently discarded review edits.
3. Do not automatically install or upgrade dependencies. Cost: the consumer runs
   npm install and validates its app after accepting required dependencies.
4. Atomic writes are per file, with guarded rollback and durable recovery data.
   Cost: a hard process interruption can require manual recovery; this is not an
   all-file transaction or a guarantee against power loss.
5. Exclude unrelated owner `output/` from lint. Cost: those files are not certified.
6. The independent reviewer did not repeat the consumer, browser or full suite;
   the parent ran them locally. Cost: that evidence is not independently duplicated.
7. Abrupt process death/power loss was not simulated. Caught disk-write failures
   and concurrent user edits were tested; hard-interruption recovery remains manual.

The updater needs an installed `tiraz.project.json`; arbitrary manual copies without
an installation record still need manual comparison. A text merge does not migrate
changed component APIs or prove semantic compatibility.
Consumers still need their own type checks, tests and browser review. This Mac run
also does not certify Windows-specific filesystem behavior.
