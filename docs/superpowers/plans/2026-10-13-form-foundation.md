# Form foundation implementation plan

Goal: deliver Field, Input, Select and a connected Create customer example within the existing Arabic-first workbench.

Architecture: Field supplies typed `FieldControlProps` through a render function; Input and Select accept them as `field` and merge external description IDs. Input preserves native editing/form behavior. Select uses Radix Select 2.4.1, inspected against the official API and React 19 peer compatibility, with popper positioning inside the current provider/Sheet container. Application code owns validation and customer state.

Constraints: start at 2a84c371dc87110c0bb9aa271fb5c003a8255f02; isolated codex/form-foundation branch; original checkout/index/README/CSS untouched. Keep documentation layout, compact defaults, semantic tokens and coupled language/direction. Single select only. Local milestone commit only.

1. Add failing association, native form/state/ref and Select regression tests; implement Field/Input/Select and shared token geometry. Run focused checks.
2. Add customer flow tests; implement application-owned validation, draft discard, synchronous save guard, semantic customer list and Toast. Verify reopening/focus.
3. Extend inventory, models/normalization, minimal inspector, playground, examples, complete APIs, generated code and prompts. Update nine-family portable registry/guidance and independent source-copy exercise. Run compilation and persistence/reset tests.
4. Extend inventory-driven browser checks and add forms/flow checks. Inspect Arabic/English, themes/densities/typography, narrow/short screens; record screenshots and computed measurements. Preserve existing browser regressions.
5. Run full tests, generated compilation, source-copy build/browser checks, lint/build/format. Request independent review, fix actionable findings and re-review. Record evidence and limitations, verify original checkout preservation and create local milestone commit.

Review focus: external aria-describedby IDs; native reset in both state modes; nested modal and short viewport popup scope; stationary-pointer early keyboard interaction; double submission and dismissal during opening/closing.

Progress and verification are recorded in docs/form-foundation/verification.md.
