# Working on Tiraz

Read `llms.txt` and `docs/ai/integration.md`, then retrieve only the relevant component contract in `knowledge/components/`. Full inherited prop types and union branches are in `knowledge/api/`. Do not guess unsupported exports or props.

Runtime APIs live in `src/system`; reusable patterns in `src/patterns`. Preserve Arabic/RTL defaults, scoped theme tokens, Radix behavior, and nested portal context. Source APIs own types; `src/knowledge` owns authored intent; generated `knowledge/` and component Markdown must not be edited manually.

After changes run `npm run knowledge:build`, `npm run registry:build`, and `npm run verify`. For browser/consumer changes run `npm run test:consumer` (install Chromium with `npx playwright install chromium` first). Inspect `docs/ai/rules.md` for composition and accessibility rules. Keep consumer setup independent of the workbench. Do not claim SSR, Figma parity, or a published registry without verification.
