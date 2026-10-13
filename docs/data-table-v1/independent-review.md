# DataTable v1 independent review

Reviewed on the user's Mac on 2026-10-13 in
`/Users/amjedfadul/.codex/worktrees/data-table-v1/Tiraz`, branch
`codex/data-table-v1`. This review covers the working-tree implementation above
baseline `06a8b13d237d303b48979edeac223f726126d57f`; HEAD still points to that
baseline at review time. Read `AGENTS.md` and `src/system/ai/README.md` first.

## Findings

No actionable defects found in the reviewed source or focused checks. This is
not a claim of exhaustive behavior or accessibility coverage.

## Scope and evidence

- Examined DataTable's public types, sorting, pagination reset/clamping, stable
  row keys, native table composition and translated controls; the connected
  customer example's filtering, create reuse, details transition, explicit
  presets; generated snippets/prompts, documentation controls, exports,
  registry and portable-consumption guidance.
- Confirmed `src/system/Table.tsx` has no changes against the baseline with
  `git diff --exit-code 06a8b13d237d303b48979edeac223f726126d57f -- src/system/Table.tsx`.
- `npm test -- src/system/data-table.test.tsx src/workbench/customer-data-table.test.tsx src/workbench/generated-data-table.test.tsx src/workbench/data-table-page.test.tsx`
  passed: 4 files, 8 tests. These exercised natural ascending/descending sort,
  row identity/header focus, default pagination, reset/clamp behavior,
  combined search/status, duplicate-save guard, filtered creation, details
  content/focus restoration, error/Retry, copied runtime execution and
  documentation clipboard content.
- `npm test -- src/system/ai-registry.test.ts` passed: 1 file, 8 tests. These
  include export/metadata agreement and compilation of the portable source
  bundle and registered examples outside the workbench.
- Both npm commands used
  `PATH=/Users/amjedfadul/.nvm/versions/node/v24.21.0/bin:$PATH`.

The independent reviewer did not run the full suite, production build, lint,
formatting, manual browser, screen-reader or physical touch checks. The main
implementer owns the full checks and rendered browser inspection; jsdom
focus tests do not establish browser or accessibility conformance. Production
files and the original checkout were not modified by this review.

## Final update re-review

Re-reviewed the final working-tree updates on 2026-10-13: application-scoped
customer column proportions and density-token action sizing, the real-source
Vite `?raw` relocation harness, both navigation-count updates, the additional
caller-locale/stable-tie/Arabic sorting test, and compilation of all five
DataTable presets in both languages. No actionable findings. Table source
remains unchanged against the baseline.

Ran the following focused command again with the Node 24 PATH above:

```sh
npm test -- src/system/data-table.test.tsx src/workbench/customer-data-table.test.tsx src/workbench/generated-data-table.test.tsx src/workbench/data-table-page.test.tsx src/workbench/generate-prompts.test.ts src/workbench/generated-code.test.ts src/workbench/Workbench.test.tsx src/workbench/labeled-input-page.test.tsx
```

Passed: 8 files, 51 tests. This independently verifies the updated relocation
harness, generated preset/language compilation, locale-sensitive sorting and
navigation assertions as well as the earlier connected-flow checks. CSS was
reviewed in source; manual rendering of the new proportions/dimensions remains
part of the main implementer's browser verification, not independent reviewer
coverage.

The subsequent final visual correction was also reviewed in source: customer
columns now use 30/38/16/16 percent and the example table has a 36rem minimum.
Both selectors remain scoped to `.customer-data-example`; the reusable Table
foundation retains its original 32rem minimum, and its source still matches
the baseline. The example inherits Table's existing internal horizontal scroll
container on narrow screens. No actionable finding; no broad tests repeated for
this CSS-only correction. The main implementer reports the final rendered
matrix and overlay/standalone supplement passed, but those runs are not counted
as independent reviewer browser coverage.
