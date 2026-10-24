# Sidebar Exploration Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implement the approved bilingual sidebar, shared collection map and persistent global search locally.

**Architecture:** Derive collection entries and search from the existing curated catalog. Workbench owns selection/query/disclosure state and keyboard search activation. ComponentNavigation renders the fixed map, scrolling real links and bottom Illustrations destination; LibraryPage uses the same collection definitions.

**Tech Stack:** Existing React/TypeScript, Tiraz primitives, Phosphor, Vitest/jsdom and CSS tokens.

**Spec:** `docs/superpowers/specs/2026-10-24-sidebar-exploration.md`

## Global Constraints

- Local only; no push, merge, deploy or package publication. Keep the 5411 documentation server running.
- Preserve pending typography/analytics changes and unrelated `output/` files.
- Arabic/English, logical CSS, localized digits, no new dependency or public API.
- Preserve component documents, playgrounds, prompt/Copy row and landing.

## Review Focus

- Search punctuation, Arabic diacritics, aliases and zero results must not invent a component or expose internal-only parts.
- Browser Back and specialist deep links must restore the appropriate list and selected parent.
- Keyboard search activation must open hidden/mobile navigation and focus exactly one live search input.
- Collapsing a list or selecting a search result must leave focus on a sensible visible target.
- Long lists and short/mobile viewports must retain reachable section titles and Illustrations without horizontal overflow.

### Task 1: Collection and search behavior

Files: create `src/workbench/navigation-model.ts`; modify `library-entries.ts`; test `sidebar-exploration.test.tsx`.
Interfaces: `NavigationSection = 'screens' | 'components' | 'ai' | 'illustrations'`; `navigationSection(route)` resolves existing URLs and nested parts; `sectionEntries(section, language)` returns curated, localized entries; `searchEntries(query, language)` returns ranked entries with localized names/descriptions and real routes.

- [x] Write failing Workbench tests for the system map, separate Components/AI collections, bilingual chip aliases and no-result recovery.
- [x] Run the new test file and confirm missing behavior fails.
- [x] Add the shared model and aliases, preserving curated IDs and existing category URLs.

### Task 2: Sidebar and collection integration

Files: `ComponentNavigation.tsx`, `Workbench.tsx`, `site-sidebar.css`, `LibraryPage.tsx`; update navigation integration tests for anchor semantics and the approved single-context list.
Interfaces: controlled selected section, expanded flag, query and search focus request passed from Workbench; use existing `Navigate` and `SiteLink`.

- [x] Add tests for repeated full-title clicks, retained focus, real result links, clear/Escape, shortcut opening, Back and mobile result selection.
- [x] Replace the long accordion navigation with the fixed map and independent list. Retain mobile drawer and sidebar collapse.
- [x] Make gallery titles/entries agree with the selected section; remove redundant gallery search.
- [x] Update affected existing navigation tests without weakening demo behavior assertions.
- [x] Run focused search/navigation/analytics tests.

### Task 3: Verification and review

- [x] Inspect Arabic/English, light/dark, list scrolling, shortcut, Escape and mobile focus in the browser. Save screenshots outside tracked evidence folders.
- [x] Run the complete local tests, then lint, build and formatting; rerun load-related timeouts individually. Run CSS audit and inspect the final diff.
- [x] Obtain a fresh review of the local diff, fix Critical/Important findings and rerun affected checks.
- [x] Record outcomes, verify HTTP 200 and leave 5411 running. Leave changes uncommitted for local review.

## Follow-up: flowing navigation

The user rejected fixed section titles. Replace the fixed map and pinned Illustrations with one scrolling area, nesting every collection under its title. Preserve search, routes, whole-title controls and focus. Search remains above the scrolling navigation.

- [x] Add failing bilingual nesting and search-to-collection tests.
- [x] Move all section titles and links into one flow, with unique controlled panels and scroll anchoring.
- [x] Confirm focused navigation tests pass (45/45).
- [x] Inspect desktop/mobile and both languages; rerun the full local checks.
- [x] Keep the preview running and all changes local.
