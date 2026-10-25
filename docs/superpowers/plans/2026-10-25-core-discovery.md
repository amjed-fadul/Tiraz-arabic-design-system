# Core discovery implementation plan

> **For agentic workers:** Use superpowers:executing-plans task by task.

**Goal:** Make finding, trying and customizing core Tiraz components a coherent workflow.

**Architecture:** Extend existing navigation metadata and catalog rendering;
reuse real controls for inert previews. A small workbench theme module owns
validated custom colors, CSS generation and preview variables. Shared appearance,
generated examples and prompts consume the same values.

**Tech Stack:** Existing React 19, TypeScript, CSS tokens, Vitest/jsdom and Vite.

**Spec:** `docs/superpowers/specs/2026-10-25-core-discovery-design.md`.

## Global constraints

- Local only, no push/deploy/publish/merge; preserve unrelated work and main.
- Preserve approved sidebar behavior, continuous docs and Night loom.
- Arabic/English, logical CSS, existing Tiraz controls, no new dependencies.
- No silent reset of custom colors; preset/reset are explicit reset actions.
- No filtering announcements; previews cannot create extra tab stops.

## Review focus

- Search/clear and browser history preserve the intended collection.
- Existing category URLs and the mobile sidebar remain functional.
- Exported CSS, generated example and rendered colors agree in both themes.
- Custom theme cannot recolor the documentation shell or alter semantic status colors.
- Copy failure exposes selectable text and does not move or discard focused controls.

### Task 1: Discover everyday components

**Files:** `navigation-model.ts`, `LibraryPage.tsx`, new `CorePreview.tsx`,
`core-discovery.css`, `catalog.ts`, discovery tests in `src/workbench`.

**Interfaces:** `essentialIds`, `galleryGroups(category, language, query)`;
`CorePreview({id, language})` renders a decorative source-based preview or null.

- [x] Add tests for essentials first, unique complete catalog, aliases, category
      search, clearing without leaving the category, real links and inert previews.
- [x] Observe failures, implement the collection model and responsive catalog.
- [x] Add relevant cross-links for core components; preserve sidebar semantics.
- [x] Run focused catalog/sidebar/navigation tests; inspect both languages.

### Task 2: Customize and carry the result into an app

**Files:** new `theme-customization.ts`, `ThemeExport.tsx`, `Appearance.tsx`,
`Workbench.tsx`, `storage.ts`, `fields.ts`, `generate.ts`, focused tests.

**Interfaces:** `BrandColors` (optional light/dark hex values),
`normalizeBrandColors(value)`, `themeStyle(config, colors)`,
`generateThemeCss(config, colors)`, `withCustomTheme(code, config, colors)`.

- [x] Add failing tests for safe stored colors, contrast foreground, exact CSS,
      generated theme, copy fallback, custom/reset persistence and shell isolation.
- [x] Implement current-theme custom color input and explicit preset/reset behavior.
- [x] Expose Input type and Select label/required; test generated code consistency.
- [x] Add theme export while retaining config export and prompt-row structure.
- [x] Update prompt source guidance for manifests/subsets without claiming the
      unpublished installer is available on npm.
- [x] Run focused tests and generated example compilation.

### Task 3: Review and verify locally

- [x] Browser-check desktop and phone, both languages/themes, discovery keyboard
      flow, custom color propagation, copy/fallback and panel focus restoration.
- [x] Fresh whole-change review; fix important findings with regression coverage.
- [x] Run full tests/build/lint/format and knowledge/registry checks.
- [x] Record local evidence and commit; verify port 5411 and return its URL.
