# Public release implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan inline, task by task.

**Goal:** Release the approved Tiraz website and an installable design-system package.

**Architecture:** A separate public manifest packages the existing authoritative
source, ESM build and declarations. A small Node installer copies that same
payload; the shared QuickStart documents both installation modes. Woven is
integrated into main only after local verification, then deployed from Git.

**Tech Stack:** Node 24, npm, React 19, TypeScript, Vite, Vitest, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-22-public-release.md`.

## Global constraints

- Preserve existing owner edits and all unrelated branches/worktrees.
- No force push, branch deletion, credential logging or bulk staging.
- Node >=22.12; React/React DOM 19 peers; retain MIT and asset provenance.
- Arabic RTL and English LTR; preserve :dir() and reduced motion.
- Existing app routes, entry files and dependency versions are not overwritten.

## Review focus

- Existing source directories or symlinks: fail before writing any files.
- Existing package scripts/dependency versions: preserve them.
- Packed artifacts: exclude private files and include all runtime sprite assets.
- Package consumers: no duplicate React, unresolved types or repo-relative imports.
- Production: correct Git commit, public deep links, iframe routes and HTTPS.

## Task 1: audit and protect local work

- [x] Fetch origin; audit all local/remote branch ancestry and dirty worktrees.
- [x] Compare exceptional branches against the current release functionality.
- [x] Record dispositions in `docs/release/worktree-audit.md`.
- [ ] Preserve main's local changes before merging; leave other worktrees alone.

## Task 2: npm artifact and installer

Files: `packages/tiraz/package.json`, `packages/tiraz/README.md`,
`packages/tiraz/bin/tiraz.mjs`, `scripts/build-package.mjs`,
`tsconfig.package.json`, `src/tests/package-release.test.ts`.

- [x] Add failing installer tests for new/existing apps, collision preflight,
      dependency/script preservation and AGENTS.md idempotency.
- [x] Implement the public package build, declarations and additive installer.
- [x] Build and pack; inspect the allowlisted file list and dependency boundary.
- [x] Install the tarball into clean app fixtures; typecheck/build direct imports
      and the installed CLI's new-project output. Verify mascot asset loading.
- [ ] Commit package and tests by explicit paths.

## Task 3: installation guidance

Files: `src/workbench/QuickStart.tsx`, `src/workbench/QuickStart.test.tsx`,
`src/system/ai/README.md`, repository README and package README.

- [x] Replace placeholders with tested install/import and source-init instructions.
- [x] Keep prompts collapsed and localize visible copy; keep prompts English.
- [x] Test copied commands, new/existing selection and honest registry status.
- [x] Check landing and Start here in both languages on desktop and phone.

## Task 4: verify and integrate

- [x] Run focused tests, full tests, lint with zero warnings, build, formatting
      and CSS audit; record local results.
- [x] Review the final package boundary and installer failure paths.
- [ ] Preserve main edits, merge tested release into main, restore owner work.
- [ ] Push main and release branch without force; verify remote commit IDs.
- [ ] Publish the verified tarball after npm authentication and confirm registry.

## Task 5: deploy and connect domain

- [ ] Create/reuse the Git-connected Tiraz project in the discovered Vercel team.
- [ ] Deploy remote main; inspect build state and check rendered preview routes.
- [ ] Attach tiraz.dev and verify the returned DNS configuration and HTTPS.
- [ ] Check landing, library, Start here, illustration and screen deep links.
- [ ] Keep localhost 5411 running; record URLs, commits and any unfinished step.
