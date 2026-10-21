# Screens integration — 21 Oct 2026

The ten example screens and Dashboard are integrated on `claude/woven` and ready for the owner's visual test at <http://127.0.0.1:5411/>. The final code commit is `15d7fa8`. The integration checkout is `/Users/amjedfadul/Tiraz-worktrees/woven`.

This report supersedes the state tables in [the original handoff](handoff-codex.md). Plan 5 Task 8 remains pending until after the visual test.

## Completed

- Finished Content studio: image generation states, version selection, caption suggestions, cancellation, keyboard focus, and localized copy. Prompt text remains English in both page languages.
- Reviewed Sales pipeline, Content studio, and Contract review against the screen brief. The final scoped independent review has zero remaining Critical or Important findings.
- Fixed Sales follow-up cancellation when a Sheet closes or a responsive change removes it. StrictMode cleanup cancels pending work without closing a newly opened Sheet; focus returns to the selected stage after resize.
- Gave each reviewed screen one initially empty polite live region. Added supported, default-preserving announcement opt-outs to composed components and preserved DraftReview retry/Undo bookkeeping when announcements are off.
- Kept Contract suggestions below the reviewed clause on phones through a supported inline SuggestedEdits placement. Desktop keeps floating placement; resizing preserves decisions and restores lost review focus.
- Finished the Team settings model-context digit fix (`١٢٨ ألف رمز`) with a regression test.
- Merged `claude/woven-s2`, `claude/woven-s3`, `claude/woven-s4`, and `claude/woven-p5` using `--no-ff`. The original system fixes `5d4e19c` and `1a34769` were already ancestors of the integration branch.

## Verification

Commands used Node 22.18.0; the CSS audit used Node 24.21.0. No tracked browser evidence script was run.

- Full suite: `npm test -- --maxWorkers=2` — **121 files, 1,626 tests passed** at `c383655`.
- The subsequent build caught a parameter-property syntax error in a new test fixture. `15d7fa8` changes that fixture to an explicit property assignment, with no runtime behavior change. Its five Sales tests passed again in isolation.
- After that correction: `npm run lint`, `npm run build`, and `npm run format:check` all passed. Lint returned zero diagnostics. Vite retains its large-chunk size advisory.
- CSS audit across system families, the screen frame, and all ten screens: `[]`.
- Sales, Content, and Contract browser matrix: Arabic light at 1,280 / 1,024 / 390 px, English light at 1,280 px, and Arabic dark at 1,280 px. No horizontal overflow or page errors; one h1 and one empty status region at mount.
- Automated WCAG A/AA checks for those three screens at 1,280 and 390 px returned no violations. Contract was checked again after its placement fix.
- Sales cancellation, resize focus, reopening an unsent draft, and retry passed three repeated browser runs. Content generation, version selection, caption Apply, and Undo passed a keyboard flow.
- Contract geometry and keyboard checks passed at 390 and 1,280 px, including focus across placement changes. The phone suggestion no longer covers preceding clauses or leaves a reserved blank tail.
- Docs stage: at a viewport height of 1,000 px, stage height remained 740 px at widths 1,024 / 1,280 / 1,440. At 390 px, the first five animation-frame samples all used Phone. Tab left the iframe for the outer document.

Throwaway browser scripts, captures, and reports are in `/tmp/tiraz-codex-checks/`. Detailed review reports and rulings remain in `.superpowers/sdd/2026-10-21-woven-5-wave-2/`.

## Next checkpoint

Visually test the screens in the docs under **شاشات / Screens**, especially Sales pipeline, Content studio, and Contract review on desktop and phone. Woven's existing preview remains on port 5411; no other Woven preview is listening on ports 5412–5416.

After that visual pass, continue [Plan 5 Task 8](../superpowers/plans/2026-10-21-woven-5-wave-2.md): collect the intended tracked evidence, write `docs/woven/plan-5-review.md`, perform one fix wave, then update the roadmap. The deferred RTL category bars, Arabic separators, same-slug iframe focus guard, dashboard evidence script, and other listed system gaps remain for that wave. Plan 5 is not marked done.
