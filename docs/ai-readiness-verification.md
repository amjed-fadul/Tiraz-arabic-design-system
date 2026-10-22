# AI readiness implementation — 2026-10-22

Implemented on `codex/tiraz-ai-ready` in a managed worktree based on `ce78408`. Original-checkout edits were preserved. This completes the repository foundation milestones and prepares source distribution; it does not claim every optional adapter in the research report is deployed.

## Delivered

- Generated TypeScript contracts for six components, inherited props, enum members, Button's conditional accessible-name requirement, configuration, pattern types and source hashes. Authored usage/avoidance rules remain separate from extracted facts.
- Focused component Markdown, root and website `llms.txt`, an instruction file and a CSS token inventory retaining references, theme/density/typography and reduced-motion conditions. The workbench reads generated API facts.
- A source installer with relative manifest paths, a complete CSS/font bootstrap, runtime dependency inventory, license, examples, overwrite/path protections and drift verification. The shadcn registry uses the same delivery inventory and validates against official schema snapshots.
- CustomerEditSheet, PreferenceSettings and InvoiceActions with caller-owned persistence/localized labels, loading/error feedback, cancellation signals and stale-result protection. Small TextField/Stack/Inline helpers and bilingual compiling examples support their composition.
- Manifest-first agent prompts, strict TypeScript, deterministic toast-expiry checks, both-language generated example compilation, a reproducible consumer check, CI and eight agent benchmark scenarios.

## Verified locally

| Check                         | Result                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run verify`              | Passed: generated-artifact freshness, 10 tooling tests, 89 Vitest tests, lint without warnings, strict TypeScript, Vite build, formatting                                      |
| Generated usage compilation   | 50 cases per language; 100 complete Arabic/English modules                                                                                                                     |
| `npm run test:consumer`       | Passed with a fresh install outside the repository; destination contains spaces and is relocated before compilation                                                            |
| Consumer dependency isolation | Only manifest runtime dependencies plus TypeScript/Vite/type packages; versions pinned to the repository lockfile; no workbench dependencies or linked repository node_modules |
| Production browser checks     | Chromium serves the built consumer: all six components, all three patterns, nested portals, keyboard controls, focus return, local fonts and scoped CSS                        |
| Appearance/direction matrix   | Light/LTR, dark/LTR, light/RTL, dark/RTL passed                                                                                                                                |
| Mobile                        | 390px page and Sheet bounds passed in all four configurations; geometry checked after entrance animation completes                                                             |
| Accessibility                 | No violations in the automated WCAG A/AA axe rules used by the consumer check                                                                                                  |
| Registry                      | Official shadcn schemas and file checksums passed; no hosted CLI install claimed                                                                                               |
| Focused review                | Three metadata defects reproduced with failing tests and fixed: missing optional union constraints, stale generated-file retention, unchecked manifest pointers                |

Tests ran locally on macOS with Node 24.21.0 and Playwright Chromium. The standalone Vite build emits third-party `use client` directive warnings; browser checks passed, and SSR support is not claimed. The new GitHub workflow runs the same verification and consumer commands, but no remote workflow run or push occurred in this task.

One sub-agent was reused for the independent patterns, targeted test corrections and focused tooling review. No model benchmark runs were purchased or simulated.

## Remaining work and boundaries

- Choose a real registry host, publish it and test installation through the remote shadcn CLI. The generated item is currently a complete bundle; selective component packages can follow measured demand.
- Connect actual Figma library IDs/variables and Code Connect mappings. Add MCP only when retrieval requirements justify it.
- Run the documented model benchmark before claiming improved first-attempt success, reduced corrections or lower token cost.
- Additional environments, cross-browser/device testing and manual screen-reader testing remain unverified. Automated axe checks are not an accessibility conformance claim.
- The inventory is a Tiraz CSS contract, not DTCG interchange. Richer per-token guidance and a dedicated DTCG export can be added separately.
- The workbench still has its existing editor/model structures and component/model function arguments; this change shares catalog/API facts but does not replace the editor with a new serialized request schema.
- Cancellation is cooperative and cannot undo a completed server write. Production data layers must handle persistence, concurrent updates and idempotency.
