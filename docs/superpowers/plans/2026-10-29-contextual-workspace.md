# Contextual workspace implementation plan

> **For agentic workers:** Use superpowers:executing-plans in this session. The user approved the design in the conversation and requested implementation. No further approval gate, commit, push or publish.

**Goal:** Useful agent activity beside a real conversation, a colored native effort slider, Khayt task headers, thin milestones and panels that only close on user action.

**Architecture:** Reuse ChatComposer and ChatThreadMessage. Each keyed reply owns its activity, persistent visibility and connections. A local sample host supplies ordered events and evidence. The experiment’s legacy visibility hook stays unchanged.

**Tech stack:** React, TypeScript, Tiraz, Vitest, local browser inspection.

**Spec:** The approved conversation recommendation, reflected in docs/agent-workspace-integration.md when complete.

## Constraints

Preserve the 38rem composer, continuous docs, prompt/Copy row and Night loom. Use a native range with four named colors. Panels never auto-close; dismissal suppresses reopening for that reply. Show actual supplied activity and evidence, without configuration controls. The demo stays explicitly local. Verify on this Mac and leave its preview running.

## Review focus

- Completion and later replies retain panels and earlier results.
- Closing does not stop execution or reopen on subsequent events.
- Stop/unmount cancel timers and ignore late events.
- Slider exposes named values, native keyboard behavior and disabled state.
- Arabic, narrow layouts, reduced motion and focus restoration remain usable.

## Tasks

- [x] Add regression tests for slider, persistence, progress and reply ordering; observe the old implementation fail.
- [x] Compose Slider with local effort aliases; replace settings panels with evidence and compact task progress.
- [x] Add per-reply persistent panels and chat history above the composer, preserving cancellation and settings snapshots.
- [x] Update docs and metadata, documenting example-owned parts and tokens.
- [x] Run focused and full tests, generated examples, build, lint, formatting and browser inspection.

## Execution record

Base 7b89a52ada798c585742f26ac06fcce503ea26b1 on codex/agent-composer-study. Existing uncommitted work remains intact. Implementation proceeds in this checkout under the user’s approval.

- Implemented and locally verified. Full suite: 2,044 passed; final focused suite: 17 passed. Build, lint, formatting and diff checks passed. Browser evidence and integration boundaries are recorded in docs/agent-workspace-integration.md.
- Review correction: Stop takes precedence over needs-input; canceled input-waiting activity becomes stopped. Existing error evidence stays available.
- Shared presentation copy was moved out of the component module to preserve Fast Refresh and remove lint warnings.
