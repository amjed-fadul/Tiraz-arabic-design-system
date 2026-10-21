# Woven Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement each plan task by task, with the model tiers below. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the three approved specs: the Woven visual language across all 68 families, twelve task-level AI patterns, and the workbench demo frame with states and Replay.

**Specs:**

- `docs/superpowers/specs/2026-10-18-woven-visual-language-design.md`
- `docs/superpowers/specs/2026-10-18-ai-task-patterns-design.md`
- `docs/superpowers/specs/2026-10-18-workbench-docs-design.md`

**Branch and worktree:** `claude/woven` at `/Users/amjedfadul/Tiraz-worktrees/woven`. Specs committed in `2c81e61`. Never push, merge or open a pull request unless Amjed asks.

## Plans, in order

| # | Plan | Covers | Status |
| --- | --- | --- | --- |
| 1 | `2026-10-18-woven-1-foundations.md` | Before evidence; in-flight work brought in (numerals setting, browser-test repairs); the remaining Arabic digit fixes and the two missing Arabic tests; workbench enum and fallback bugs; Woven tokens with contrast tests; input modality; CSS audit harness; StatusIcon; shared remove button | done (0fb781a) |
| 2 | `2026-10-19-woven-2-demo-frame.md` | Docs spec §6–9, §11–14: DemoFrame states, notes and Replay; `demo-states.ts`; `phase` / `onPhaseChange` on lifecycle examples; notes for all 67 pages; page order | done |
| 3 | `2026-10-20-woven-3-restyle.md` | Woven spec §12–18: every family's restyle (forms, files, navigation, data, display, overlays, charts, AI parts at CSS level) and the docs chrome; each family joins the CSS audit | done (ad0683f) |
| 4 | `2026-10-20-woven-4-ai-patterns.md` | AI patterns spec: part API additions, new shared parts, Wave 1 patterns with their pages, navigation regroup, screens, agent-facing docs, consumer exercise | done (996e112) |
| 5 | `2026-10-21-woven-5-wave-2.md` | Spec §13 Wave 2 patterns (Ask your data, Decision inbox, Draft for review, Assistant controls) and the rest of §13a's Dashboard. **Changed by Amjed on 21 Oct:** runs right after Plan 4, without waiting for his review of Wave 1 | in progress on `claude/woven-p5` (worktree woven-p5) |

Each later plan is written just before it runs, from the code the previous plan produced. That way it names real files, exports and line numbers instead of guesses. Each plan is reviewed by Opus against its spec before execution starts.

## Model tiers (Amjed, 18 Oct 2026)

Every task names its implementer model. The controller passes it as the Agent tool's `model` parameter.

| Tier | Use for | Examples |
| --- | --- | --- |
| **Haiku** | Mechanical work with exact instructions: applying a known patch, renames, replacing literals from a given mapping, test-list updates, data fixtures copied from a spec table, running evidence scripts | bring in the browser-test repairs; capture screenshots |
| **Sonnet** | Normal implementation with tests, where the spec fixes the behavior and the implementer writes the code | tokens, enum validation, StatusIcon, most family restyles, most pattern pages |
| **Opus** | Hard or sensitive work: merges with conflicts; decision safety (approvals, keyboard shortcuts); focus, live regions and input modality; cross-cutting state plumbing; canvas and selection APIs | bring in the numerals work, input modality, Agent task, Approval request, Suggested edits, Image generation, navigation regroup |

**Review.** Every task, whatever its tier, is reviewed by a fresh **Opus** subagent before the next task starts. The reviewer checks spec compliance first, then code quality, and reports issues ranked by severity. Fixes go back to the implementer's tier.

**Escalation.** A task that fails review twice moves up one tier (Haiku → Sonnet → Opus) for its next attempt.

**End of each plan.**

1. A Haiku subagent runs `npm test`, `npm run lint`, `npm run build` and `npm run format:check`, and captures the plan's browser evidence with `tests/browser/woven-evidence.mjs`.
2. A fresh Opus subagent reviews the whole plan's diff, and the before and after evidence, against its spec.
3. The controller stops for Amjed's checkpoint before writing the next plan. **Changed by Amjed on 19 Oct:** after Plan 1, continue without waiting for approval, and keep Plans 2–4 lean ("don't over-engineer").

## Rules for every task

- One commit per task, made by the implementer, with the task's message and no Co-Authored-By trailer (Amjed, 20 Oct; earlier commits keep theirs).
- Tests first: write the failing test, watch it fail, implement, watch it pass.
- The baseline is 82 test files and 806 tests passing on `aa1d0e3`. Existing tests are only changed where they assert something a spec changes on purpose, and the commit message says which.
- Never modify the other worktrees (`component-craft`, `numerals`, `landing-night-loom`). Plan 1 reads from two of them once, read-only.
- Dev server for evidence: the controller starts it with the `woven` configuration in `/Users/amjedfadul/Tiraz/.claude/launch.json` (port 5411). Subagents never start servers.
