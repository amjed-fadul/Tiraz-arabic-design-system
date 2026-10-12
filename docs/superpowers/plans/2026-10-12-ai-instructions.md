# AI Instruction Layer Implementation Plan

> **For agentic workers:** Execute the scoped tasks in this session; independent exercise and final review are required.

**Goal:** Give coding agents portable, accurate instructions for consuming Tiraz.
**Architecture:** Keep consumer guidance, a JSON registry and compiling examples under `src/system/ai`. Keep runtime components and the workbench layout unchanged; update only shared copied prompt text.
**Tech Stack:** TypeScript, React, Vitest, Playwright, existing Vite application.
**Spec:** User's first AI instruction layer request attached to this task.

## Global constraints

- Baseline main `ce78408818b6a9866ab0faa7748404cba44d8939`; isolated branch, original checkout/index/README/layout CSS unchanged.
- Six families only; source and public types are authoritative, inspector limits are not API limits.
- No landing page, UI panels, installer, CLI, MCP, backend, runtime behavior changes or dependencies.
- One local milestone commit; no push, merge, deployment or publication.

## Review focus

- Source-copy paths must work without workbench files or the original project root.
- Controlled state callbacks must update caller state; no invented `defaultOpen` or `Toast` exports.
- Full inherited native/Radix props must be distinguished from curated wrappers.
- Required accessible labels, scoped portals, transient feedback and OS reduced motion must survive composition.
- Clipboard text and usage code must remain complete despite one-line presentation.

## Tasks

1. [x] Add failing registry integrity and portable prompt checks. Validate real exports/types and paths, rather than snapshots of prose. Run focused Vitest checks and record expected failures.
2. [x] Add `src/system/ai/{README.md,registry.json,composition.md,examples/usage.tsx}` and root `AGENTS.md`. Registry paths resolve from directory containing `index.ts`; no machine-specific paths. Run integrity checks, enum/type checks and strict example compilation.
3. [x] Update only `generatePrompt` in `src/workbench/generate.ts`, both languages. Preserve generated code/config and events; locate either full checkout or source copy, then read bundle and real APIs. Verify relocation and existing clipboard/layout checks.
4. [x] Request independent consumer agent using bundle to implement standalone Arabic dashboard exercise outside production entry. Copy source to a different app path; inspect browser RTL/LTR, themes/config, keyboard/nested overlays and deliberate unavailable-component handling. Record misunderstanding and improve guidance if needed.
5. [x] Run focused exercise/prompt browser checks, then full tests including generated-module compilation, lint, build and formatting. Request independent reviewer and re-review any fixes. Fingerprint original checkout/index; prepare the verified files for one scoped local milestone commit.
