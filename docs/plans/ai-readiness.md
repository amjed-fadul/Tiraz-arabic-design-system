# Tiraz AI readiness implementation

Approved architecture: [research report](../research/tiraz-ai-readiness-2026-10-22.md). Execution: main agent implements shared infrastructure; one bounded sub-agent implements independent patterns; one final focused review. Preserve the original checkout and its uncommitted changes.

## Constraints and decisions

- Keep source ownership, current component APIs, scoped CSS, Arabic/RTL defaults, Radix behavior, and the workbench.
- Initial supported consumer: React 19 + Vite + TypeScript. No untested SSR claim.
- Local artifacts must work without hosted services. Prepare a compatible registry; public hosting and Figma mappings require a real destination/library and are not fabricated.
- Generate prop facts using the TypeScript compiler. Author intent and examples explicitly. Never publish editor-only limits as runtime constraints.
- Source hashes describe shipped files, avoiding commit-hash self-reference in generated artifacts.
- Use one metadata generator and one installer/consumer verifier, without adding a bespoke MCP server.

## Tasks

1. **Contracts and documentation** — `scripts/knowledge.mjs`, `src/knowledge/catalog.ts`, `knowledge/`, `docs/ai/`, `public/llms.txt`. Extract real exported component prop types/conditional branches; include defaults, prerequisites, state ownership, dependencies, provenance, and curated rules. Generate focused Markdown and source-backed token inventory. Reuse catalog in workbench. Tests: exact public APIs and icon-only union requirements; stale output is rejected; CSS/token coverage; no demo-only props.
2. **Portable delivery** — `scripts/install.mjs`, registry output, `tiraz.project.json`, examples/bootstrap. Copy runtime plus knowledge into an arbitrary consumer directory; produce relative paths/import specifiers and checksums; validate paths, reject overwrites and unsafe targets. Generate registry JSON from the same file inventory. Tests: fresh temp consumer build, dependency closure, modified target protection, unsupported paths.
3. **Reusable patterns** — `src/patterns/`. CustomerEditSheet, PreferenceSettings, InvoiceActions; small shared field/layout helpers; independent logical CSS; caller labels/callbacks. Tests: successful/failed saves, repeated actions, cancellation/reopen races, unique IDs.
4. **Project-aware prompts and validation** — adjust generator to locate manifest before checkout assumptions; retain complete local demo, add application integration path. Correct Arabic compilation coverage, enable strict TS, isolate toast expiry assertions from wall-clock interaction time. Add browser consumer test (all components, RTL/LTR, themes, keyboard, axe), CI, documented verification command, evaluation tasks and honest benchmark status.
5. **Review and finish** — run unit/tooling tests, consumer build/browser, artifact freshness, lint/build/format; review diff and fix important findings; commit on isolated branch. Report measured results and remaining conditional integrations.

## Review focus

- Missing inherited props or erased discriminated unions in generated contracts.
- Consumer folders containing spaces, traversal, symlinks, existing files, or unrelated applications.
- Copied code relying on original workbench CSS, fonts, imports, or dependency resolution.
- Async save completing after close/reopen, or repeated clicks during pending work.
- Existing keyboard/portal behavior, mixed-direction labels, and deterministic toast timing.

## Progress

- Worktree created from ce78408 on codex/tiraz-ai-ready. Existing original checkout edits remain there; research copied into branch.
- Ruling: prior written research and explicit instruction to implement supply architecture approval. This plan records implementation choices without another approval round.
- Ruling: bootstrap contracts and generated files are sufficient first retrieval surface. Dedicated MCP and remote Figma publishing remain conditional as the approved report specifies.
- Completed contracts, focused/static docs and token inventory, workbench API facts, manifest-first prompts, portable installer and registry artifacts, three patterns and compiling bilingual examples.
- Added CI, declared browser dependencies, strict TypeScript, deterministic toast timing, both-language generated-code compilation, isolated consumer build/browser checks and benchmark scenarios.
- Focused review found and fixed optional literal union loss, obsolete generated-file retention and unchecked manifest pointers; added regressions for all three. Corrected two pattern documentation claims against actual behavior.
- Consumer dependency installation uses repository lockfile versions for the generated dependency set. This keeps the check reproducible and independent of newly published package versions; a separate broader compatibility matrix remains future work.
- Conditional follow-ups: choose a real registry host and perform remote CLI installation; connect actual Figma library mappings; evaluate whether MCP adds value; run model task benchmarks before claiming better agent success or token cost.
