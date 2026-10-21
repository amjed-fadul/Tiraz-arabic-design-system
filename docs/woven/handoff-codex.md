# Tiraz: handoff (21 Oct 2026)

> **Current state:** the screen integration and reviews are complete. See [the Codex integration report](screens-integration-2026-10-21.md) for commits, verification, and the owner's visual-test checkpoint. The sections below preserve the original handoff snapshot.

**Tiraz** is an Arabic-first, right-to-left React design system with a docs workbench. This is its "Woven" direction.
- **Stack:** Vite, React, TypeScript, Vitest with jsdom, oxlint and Prettier.
- **Font:** IBM Plex Sans Arabic.
- **This file:** it continues work that Claude ran as parallel agents, and it lists what is done, what was in flight, and what is left.

## 0. Final state when Claude stopped (read this first)

Every Claude agent is stopped, and only the woven dev server (5411) is running.

| Worktree | Last commit | Uncommitted work | Next step |
| --- | --- | --- | --- |
| `woven` (`claude/woven`) | `5087110`, this file | none | Merge the rows below once each is ready. The gate on the merged tree was stopped before it finished, so run it. |
| `woven-p5` | `1a34769` | none | System fixes `5d4e19c` and `1a34769` are done but not yet in `claude/woven`. Merge `claude/woven-p5`. |
| `woven-s2` | `82f9744`, Sales pipeline | none | Built but **not reviewed** and not merged. Review it, fix, then merge `claude/woven-s2`. |
| `woven-s3` | `8bf7d5f`, Contract review | Content studio, half built: `ContentStudio.tsx`, `content-studio.css`, a new `ContentStudio.test.tsx` and `data.ts` | Finish Content studio (spec §3.7), then commit. Contract review's review was stopped, so review it too. Contract review is already in `claude/woven`. |
| `woven-s4` | `08fc314` | The Team settings digits fix (§3 item 3) in `TeamSettings.tsx`, `TeamSettings.test.tsx` and `data.ts` | Two long Team tests failed in the last gate, probably from machine load. Re-run that file alone, then commit and merge `claude/woven-s4`. |

`claude/woven` holds eight screens. Sales pipeline and Content studio still show as placeholders there.

## 1. Where things are

- **Main checkout:** `/Users/amjedfadul/Tiraz`, on branch `main`. Leave it alone; it holds the owner's own edits.
- **Worktrees** are under `/Users/amjedfadul/Tiraz-worktrees/`:

  | Worktree | Branch | Role |
  | --- | --- | --- |
  | `woven` | `claude/woven` | The integration branch. The owner tests here, with the dev server on port 5411. |
  | `woven-p5` | `claude/woven-p5` | Plan 5: the screen frame, the docs screen pages, and system fixes. |
  | `woven-s1` … `woven-s4` | `claude/woven-s1` … `-s4` | One per screen stream (see §2). |
  | `woven-dash` | `claude/woven-dash` | The dashboard rework. It is merged, so this worktree can be removed. |

- **Never modify** the `component-craft`, `numerals` or `landing-night-loom` worktrees.
- **Dev server:** `npm --prefix /Users/amjedfadul/Tiraz-worktrees/woven run dev -- --host 127.0.0.1 --port 5411 --strictPort`. The owner wants only this one running when testing.
- **`claude/woven` HEAD at handoff:** `f4f1f36`. It contains:
  - Plans 1–4;
  - Plan 5 tasks 1–7;
  - the rebalanced Dashboard;
  - the screen frame and the screen pages in the docs;
  - each stream's commits up to the merge (see §2).

## 2. The ten example screens

The spec is `docs/superpowers/specs/2026-10-21-example-screens-design.md`. Read §1 (rules), §2 (frame) and the screen's §3.

**Routes and docs pages.**
- Each screen lives in `src/examples/<slug>/` and is routed at `/examples/<slug>`.
- In the docs it opens under «شاشات» / Screens as a page with an iframe stage:
  - Desktop is 1,280 px wide, scaled to fit the stage;
  - Tablet is 768 px and Phone is 390 px;
  - a new-tab link opens the standalone route.

| # | Screen (slug) | Stream | Commits | Review | In `claude/woven` |
| --- | --- | --- | --- | --- | --- |
| 1 | Month-end close (`month-end-close`) | s1 | 4f1e4c8, faef631 | fixed | yes |
| 2 | Agent control room (`agent-control-room`) | s1 | 0ca4f59, 9271cdf | screen fixed; 2 system fixes pending (§3 item 4) | yes |
| 3 | Invoices (`invoices`) | s2 | de553b1, 24d4d64 | fixed | yes |
| 4 | Customer profile (`customer-profile`) | s2 | 957794d | approved | yes |
| 5 | Sales pipeline (`sales-pipeline`) | s2 | in flight | not reviewed | no (placeholder) |
| 6 | Help center (`help-center`) | s3 | e4bd6a1 | approved | yes |
| 7 | Contract review (`contract-review`) | s3 | 8bf7d5f | review was running | yes (pre-review) |
| 8 | Content studio (`content-studio`) | s3 | in flight | not reviewed | no (placeholder) |
| 9 | Onboarding (`onboarding`) | s4 | e40a007, 08fc314 | fixed | yes |
| 10 | Team and AI settings (`team-settings`) | s4 | c84036d | 1 fix in flight (§3 item 3) | yes (pre-fix) |

The Dashboard (`/examples/dashboard`) is also a screen page. Its rework is merged.

## 3. First, see what finished after this file was written

Agents may have finished, or been cut off. For each of `woven-p5` and `woven-s2` to `woven-s4`, run:
- `git -C <worktree> log --oneline -5`
- `git -C <worktree> status --short`

Uncommitted changes mean an agent stopped mid-task. Finish the task from its brief rather than discarding it.

1. **s2, Sales pipeline (spec §3.10).** Stage columns of Cards, each with a keyboard «نقل إلى» menu, and no drag and drop.
   - Finish it, run the gate and commit `feat(examples): add the Sales pipeline screen`.
2. **s3, Content studio (spec §3.7).** Finish it the same way.
   - If `screen-contract-review-findings.md` exists (see §6), apply its findings in a separate fix commit.
3. **s4, Team settings digits.**
   - In `data.ts:221` and `:231`, set `context: 128_000`.
   - At `TeamSettings.tsx:186`, use `` context: t(`${number(item.context / 1000)} ألف رمز`, `${number(item.context / 1000)}k`) ``.
   - Add a test that the Arabic model list has no Western digits.
   - Commit `fix(examples): Arabic digits in the Team settings model list`.
4. **woven-p5, system fixes.** The brief is `rtl-bars-brief.md` (see §6).
   - Done: `5d4e19c`, focus stays in the prompt after a keyboard send.
   - Done: `1a34769`.
     - DecisionInbox doesn't announce when an agent filter changes.
     - AskUserQuestions' busy submit uses `aria-disabled`, so focus stays and Escape can cancel.
   - If these two aren't in `claude/woven` yet, merge `claude/woven-p5`.
   - Deferred: the brief's first section, Arabic category bar charts reading right to left.

## 4. Then

1. **Review** Sales pipeline, Content studio and Contract review against `screen-review-brief.md` (see §6). Fix only Critical and Important findings.
   - Earlier reviews kept finding the same bugs. Check for each:
     - closing a Sheet mid-send still recording;
     - a disabled busy button dropping focus to `<body>`;
     - Arabic gender agreement;
     - two live regions on one screen;
     - Western digits in Arabic;
     - a card heading hugging one edge.
2. **Merge.** In the `woven` worktree, `git merge --no-ff` each of `claude/woven-s2`, `-s3`, `-s4` and `claude/woven-p5`, then run the gate.
3. **Hand over for testing.** Leave only the 5411 server running, then ask the owner to test the screens visually.
4. **Plan 5 Task 8.** Its plan is `docs/superpowers/plans/2026-10-21-woven-5-wave-2.md`.
   1. Collect evidence with `tests/browser/woven-evidence.mjs`, using `TIRAZ_PLAYWRIGHT=/Users/amjedfadul/.npm/_npx/e41f203b7505f1fb/node_modules/playwright`.
   2. Run a whole-plan review and write it to `docs/woven/plan-5-review.md`.
   3. Do one fix wave.
   4. Mark Plan 5 done in `docs/superpowers/plans/2026-10-18-woven-roadmap.md`.

## 5. Rules the owner set (keep them)

**Git**
- No `Co-Authored-By` trailer in commits.
- Stage by path; never `git add -A`.
- Never push, never merge into `main`, never open a PR unless asked. Merges into `claude/woven` are asked for.

**Gate and tests**
- The gate is `npm test && npm run lint && npm run build && npm run format:check`.
  - Lint must show 0 warnings.
  - The CSS audit must return `[]`.
  - Tests have a 15 s timeout. Under load, re-run a failing file alone before suspecting it.
- Never run `tests/browser/*.mjs` except to produce evidence: they overwrite tracked screenshots under `docs/`. For checks, use a throwaway Playwright script outside the repo.

**Scope**
- Keep it lean: fix Critical and Important only, and don't over-engineer.

**Arabic first**
- Digits come only through the `numberLocale` helpers, which give Arabic-Indic digits in Arabic.
- Write no +/− signs.
- Use logical CSS properties.
- Directional icons take `.tz-mirror-rtl`.
- Latin ids go in `<bdi dir="ltr">`.
- Get gender and number agreement right.
- The page language drives the copy, but a prompt text is always English.

**Decision safety**
- Closing a Sheet or Modal, Escape in an inbox row, or an unmount records nothing.
- No approve-all and no bulk send.
- Irreversible actions confirm first.
- Receipts say only what was recorded.
- Nothing plays on its own.

**Accessibility**
- One h1 per page.
- Visible text comes first in an accessible name.
- At most one polite live region per screen. It is empty at mount and speaks only on transitions, never on filtering.
- When the focused element disappears, focus goes somewhere sensible.

**Screen CSS**
- Every selector names `.<slug>`, and keyframes are named `<slug>-…`.
- Tokens only.
- Put `:hover` inside `@media (hover: hover) and (pointer: fine)`.

**Balance**
- Rows span the column.
- Cards in a row share one height.
- No capped card hugs one edge with empty space beside it.

## 6. Notes on disk

These are git-ignored. They are in `/Users/amjedfadul/Tiraz-worktrees/woven/.superpowers/sdd/2026-10-21-woven-5-wave-2/`:
- `progress.md`: the ledger. Every decision is a "Ruling:" line.
- `global-constraints.md`
- `stream-brief.md`
- `screen-review-brief.md`
- `rtl-bars-brief.md`
- `screen-*-findings.md`, plus the stream and task reports

## 7. Deferred for the final fix wave

**Visible**
- **Bar order:** Arabic category bar charts read left to right (`src/system/Charts.tsx`). See the first section of `rtl-bars-brief.md`.
- **Separator:** in Plex Arabic, «·» next to Arabic-Indic digits looks like «٠». Check it in the browser, then use «،» or a dash in Arabic copy.
- **Docs stage, unchecked in a browser:**
  - its height should be constant at 1,024, 1,280 and 1,440 px;
  - at 390 px it should be on Phone from the first paint;
  - Tab should be able to leave the iframe.
- **Focus guard:** when the iframe asks to open the screen already open, focus moves to main. Add `target.slug !== current` in `Workbench.tsx`.
- **Dashboard script:** `tests/browser/dashboard.mjs` needs updating for the reworked Dashboard.

**System gaps the builders worked around**
- the patterns' 38rem card cap;
- ChangeSummary pills wrapping beside the sparkline;
- fixed chart heights;
- the empty-data copy for Donut and Area;
- Tray has no `as` prop;
- ToolCall's narrow layout should be a container query;
- `formatCount` isn't exported;
- OTPInput shows Western digits in Arabic;
- AskUserQuestions can't hide its action row;
- Modal's Cancel can't take a Button ref;
- DataTable can't size columns;
- the frame's `date()` has no year;
- deleting a memory is immediate;
- the screens' CSS audit misses `:is()` and `:has()`.

**Carried from earlier**
- The README says "seventy-four" families in one place and "seventy-five" in another.
- Tests are flaky under load.
- The standalone playground route puts an h1 over each pattern's h3. Use `headingLevel={2}`.
