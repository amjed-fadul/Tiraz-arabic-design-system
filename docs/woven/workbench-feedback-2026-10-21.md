# Workbench feedback — 21 Oct 2026

Implemented locally in `/Users/amjedfadul/Tiraz-worktrees/woven` on `claude/woven`. Preview: <http://127.0.0.1:5411/>.

The header is sticky, language switches with one button, and the two extra header labels are removed. Screens comes first in navigation; section titles have stronger contrast and weight, and the AI patterns umbrella heading is removed. Component pages lead with the playground, followed by the English copy prompt, usage guidance, and API tables. Documentation headings are smaller. Guidance panels fill their available width, stack in narrow containers, and have no preceding divider. API subtitle and trailing commentary are removed.

The [Parts audit](workbench-navigation-audit.md) recommends keeping ten independent pages and folding five specialist entries into related documentation. All fifteen pages remain available in this change. The [Library, Docs, and Illustrations plan](../superpowers/plans/2026-10-21-library-docs-illustrations.md) is a proposal; implementation has not started.

## Local verification

- Focused regression run: `npm test -- src/workbench/Workbench.test.tsx src/workbench/demo-states.test.tsx src/workbench/navigation-groups.test.tsx --maxWorkers=2` — 109 passed.
- Full run: `npm test -- --maxWorkers=2` — 1,614 passed, four timed out, and one file's worker failed to start after a prolonged execution stall. No assertion failures occurred in this final full run.
- Each affected file was rerun alone with `npm test -- <file> --maxWorkers=1`: `src/workbench/table-page.test.tsx` (one passed), `src/system/chat-foundation.test.tsx` (21 passed), and `src/system/steps-timeline.test.tsx` (eight passed). Together with the full run, all 1,626 tests have passing results. The full invocation itself was not clean.
- `npm run lint` — no warnings or errors. `npm run build` — passed, retaining the existing large-chunk advisory. `npm run format:check` and explicit Prettier checks for the audit and plan — passed.
- Existing CSS audit for system families, screen frame, and ten example screens — `[]`.
- Throwaway Playwright checks covered Arabic/English and light/dark at 320, 390, 768, 1,024, 1,280, and 1,440 px. Checked containment, heading/order changes, sticky positions, keyboard language toggling and focus, settings dismissal, and mobile navigation. Eight desktop/phone accessibility scans reported no WCAG A/AA violations. Visual inspection covered both languages, guidance with docked settings, and phone/dark layouts. Browser console checks found no page errors.

Browser artifacts and command logs are in `/tmp/tiraz-workbench-feedback/`. Tracked browser evidence scripts were not run. Manual screen-reader testing and Plan 5 Task 8's whole-plan evidence/review remain outside this feedback pass.
