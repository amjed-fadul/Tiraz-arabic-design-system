# Individual Components Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task.

**Goal:** Install selected Tiraz components while preserving a separate consumer theme.

**Architecture:** Build a component catalog from TypeScript dependency closures
and ordered CSS rules. A separate CLI installer applies validated file plans;
the existing complete installer stays compatible. The provider supports theme
override variables without changing its public props.

**Tech Stack:** Node ESM, TypeScript compiler API, PostCSS, React, Vitest, Vite.

**Spec:** `docs/superpowers/specs/2026-10-25-component-installs-design.md`

## Global Constraints

- Local only; Node >=22.12 and React 19; existing Vite TypeScript source workflow.
- Preserve component edits, user-owned theme, existing dependencies and routes.
- Validate before writing; no symlinks, unsafe paths, mixed release or blind overwrite.
- Arabic RTL and English LTR, light/dark, keyboard focus and reduced motion.

## Review Focus

- Incremental installs with modified components, missing tracked files or custom managed files.
- Shared CSS, nested selectors, conditional motion rules and relative imports.
- Custom source directories and malicious/edited manifest fields.
- Theme precedence across provider accent/radius settings and overlays.
- Published archive completeness and consumer compilation with minimal dependencies.

### Task 1: Catalog and selective installation

**Files:** `scripts/component-catalog.mjs`, `scripts/build-package.mjs`,
`packages/tiraz/bin/add-components.mjs`, `packages/tiraz/bin/tiraz.mjs`,
`packages/tiraz/bin/source-manifest.mjs`, `src/tests/package-release.test.ts`.

**Interfaces:** `buildComponentCatalog({ root, packageRoot })` generates versioned
catalog data; `addComponents({ packageRoot, release, names, directory, install })`
validates and writes a selective installation. Catalog closures include source,
external dependencies and ordered style-rule IDs. `verifySource(project)` accepts
both complete v1 and selective v2 manifests.

- [x] Write failing CLI/closure tests for selective, repeated and incremental installs.
- [x] Run the focused file and observe unknown-command/missing catalog failures.
- [x] Implement catalog generation and non-overwriting installation with preflight.
- [x] Test safety: names, directories, manifest tampering, collisions, missing files,
      modified managed files, existing dependency ranges and mixed versions.
- [x] Compile all catalog entries and build a minimal installed consumer.

### Task 2: Consumer-owned theme

**Files:** `packages/tiraz/bin/theme.mjs`, `src/system/Provider.tsx`, installer
integration, `src/system/theme-overrides.test.tsx`, installer theme tests.

**Interfaces:** `themeSource` documents optional `--tiraz-action` and
`--tiraz-radius` overrides plus standard font/surface/text tokens. Provider inline
defaults use these optional CSS variables. Theme path is excluded from hashes.

- [x] Write failing tests for theme creation, preservation, verify exclusion and
      provider CSS fallback values.
- [x] Implement template, full-init import, subset stylesheet import and provider.
- [x] Browser-check two languages, two themes, focus, live theme edits and overlays.

### Task 3: Guidance, release checks and review

**Files:** `packages/tiraz/README.md`, root README, generated API facts as needed.

- [x] Document selective installation, generated-file boundaries and theme ownership.
- [x] Build/pack locally and exercise the archive in a minimal consumer.
- [x] Run full tests, build, lint (zero warnings), format and knowledge/registry checks.
- [x] Obtain a fresh whole-change review; fix consequential findings with regression tests.
- [x] Record verification and local commits, leave port 5411 running; no push/deploy/publish.

Verification: `docs/release/component-installs-local.md`. Source lint excludes
the owner's pre-existing untracked `output/` scratch files; those were preserved.
