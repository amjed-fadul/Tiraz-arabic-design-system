# Tooltip compound API — local verification

Producer milestone verified locally on `codex/tooltip-compound`, based on `7b89a52ada798c585742f26ac06fcce503ea26b1` (the source of Canvas's existing archive). This adds producer APIs only. Canvas still admits Button, Badge, Chip, Input and Table. No archive replacement, npm publication, merge, push or deployment is authorized here.

## Compatibility contract

- Existing Tooltip trigger/content usage and provider root DOM remain supported.
- Optional same-document portal destinations transfer configuration, language and explicit custom properties. Omitted destinations retain current hosts. Null means pending and withholds overlays while ordinary content remains.
- Selected Select labels and native form values stay registered while pending, using Radix's closed Content in a detached host. Citation and mention descriptions refer only to mounted content.
- Compound Tooltip supplies root, trigger and text-content exports, owner-controlled state, native button/asChild composition and optional collision bounds.
- An explicit nested Tooltip host must be inside the nearest Modal/Sheet content. Browser evidence showed outside destinations hidden from accessibility and blocked for pointers; those destinations are withheld.

## Verification evidence

Node 22.18.0; tests run locally, one package at a time after an idle window. Evidence: `/Users/amjedfadul/Tiraz-artifacts/tooltip-compound/`.

- Initial prepared API/portal tests: 47 failed, 2 passed before implementation.
- Provider and existing overlay/date/form regressions: 127 passed.
- Compound API, existing Tooltip group/Sidebar, Select and TaskStarter regressions: 157 passed.
- Independent review found Select registration, citation descriptions, native button type and callback-ref cleanup issues. Each received preceding failing tests and a passing focused rerun; callback refs include StrictMode.
- Browser RED: narrow Arabic boundary approximately 163px versus Tooltip 288px; transformed English boundary approximately 131px versus Tooltip 230px. Both outside Modal/Sheet Tooltip destinations had hidden ancestors and blocked pointers.
- Browser GREEN: widths now fit both normal and scaled bounds; null/replacement hosts preserve language, direction, themes and explicit custom properties. Inside-dialog destinations are accessible and dismiss one layer; outside component/provider destinations mount no Tooltip or description and let Escape close the dialog. Hover transfer, leave dismissal, reduced motion, keyboard focus and sibling actions passed.
- The first full suite reported 3 failures and 2,070 passes: two existing bare citation-preview uses and a generated-example compiler case. Ten preceding failing tests expanded bare-portal compatibility coverage. An internal resolver now distinguishes absent context (existing body fallback) from an explicitly pending provider/context. The compound example is separate because the current workbench generator slices OverlayExamples by function boundary. All 82 targeted compatibility checks then passed.
- Final full suite: **2,083 tests passed across 164 files** (`full-tests-final.log`). The subsequent build caught a test-only ref typing mismatch: Tiraz Button does not declare a public ref prop. The composition test now uses a native button, preserving its ref/handler assertions; all **11 focused tests passed** after that fixture correction. No production source changed after the full suite.
- Build, archive packing, clean package consumer install/typecheck/Vite build/compiled-runtime verification, lint, formatting, knowledge and registry checks passed sequentially. See `full-results.json`; retained failed attempts are not counted as passes.
- Lint exited zero with 15 warnings: React ref/immutability and effect heuristics, Fast Refresh module shape, and one cleanup dependency warning. This is not a warning-free result. Browser and StrictMode tests cover the relevant cleanup and interaction paths; React Compiler compatibility is not certified.
- Candidate: `amjedfadul-tiraz-0.1.3-preview.0.tgz`, SHA-256 `b365d61c12e5ba146e127708d92470c053661c76f3a1d6b01cbd77792ee7b12f`. The clean consumer receipt is in `verify-package.log`. External `provenance.json` records the final producer commit and archive identity.

## Scope and limitations

Independent reviews covered provider compatibility, compound API cleanup and the complete producer diff. All reported findings received regression coverage and fixes before this commit. Full-suite compatibility failures were also fixed test-first. Generated API changes include TypeScript union-order changes; facts were regenerated, not hand-edited.

This verifies the Tiraz producer candidate, not Canvas Tooltip admission, a deployed runtime, screen-reader behavior or SSR hydration. Same-document explicit custom properties transfer; arbitrary CSS ancestry does not. New explicit nested hosts must remain inside Modal/Sheet content. Existing bare overlay body fallbacks remain supported while explicit pending hosts never escape to body. The compound example lives in a separate file to preserve the existing workbench generator's function-boundary slicing.

Canvas archive/pin replacement requires separate owner approval. Package version, dependencies and npm publication remain unchanged.

Isolated preview: `http://127.0.0.1:55440/library`; test fixture `/verify/tooltip.html` with `?mode=geometry` for explicit narrow bounds. Checkout: `/Users/amjedfadul/Tiraz-worktrees/canvas-tooltip`. These fixtures have no Canvas workspace connection.
