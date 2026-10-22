# Screen refresh — 21 October 2026

Checkout: `/Users/amjedfadul/Tiraz-worktrees/woven`, branch `claude/woven`.
Baseline: `fff1735`. The preview remains at `http://127.0.0.1:5411/`.

## Delivered

- Every screen presents its opening activity on entry. Prompt flows animate typing, sending, and agent work; other screens show a short inspection sequence. Pause, Resume, Replay, reduced motion, and hidden-tab suspension are supported. Actual approvals, reminders, contract sends, and publishing remain manual.
- Customer dashboard uses the same frame and navigation as the other business screens. The sample strip, preview-state picker, and inset metric boxes are removed. The shared footer has Sara Ali's name and the existing portrait asset.
- Customer and invoice assistants have a distinct AI identity and panel treatment. Control room has agent overview cards, current work, and an accessible workspace sheet on smaller screens.
- Content studio is retained with larger artwork, a campaign header, four visual directions, clearer brief controls, and a compact phone layout.
- Numeric counters are circular. Sales pipeline appears after Customer profile; Team settings remains last. Moving a deal gets brief visual feedback and retains keyboard focus.
- Screen previews in the Library were refreshed. Preview capture disables the opening presentation to produce stable, finished states.

## Review and fixes

A fresh reviewer checked Critical and Important issues in source and local Chrome. Fixes addressed replay resetting user state, paused animations hiding newly selected content, phone agent cards failing to open their workspace, focus clearing a partial prompt, and a synthetic Send activating a hidden saved draft.

Replay now overlays a presentation without resetting forms, messages, or decisions. A Send or Generate activation during presentation takes control without submitting the underlying saved input; a fresh activation can submit the now-visible input. Pointer and keyboard regression checks cover this behavior.

Announcement ownership is explicit in composed screens. Optional `announcement` props were added to the relevant system components, with registry metadata and component tests kept in sync. Copy feedback uses the answer's existing live region.

Microinteraction diagnostic: 9/10 (seven of eight rows). Visible triggers, states, predictable rules, immediate feedback, proportional motion, explicit presentation controls, and first-use clarity passed review. Progressive reduction across visits is intentionally absent: the requested behavior is to play the opening each time the screen opens. Pause, immediate takeover, and reduced-motion support keep control with the viewer.

## Verification

- Local Chrome: 96 layouts covering 12 screens at 390, 768, 1,024, and 1,440 px in Arabic/dark and English/light. One h1, no horizontal overflow, circular counters, and no page errors.
- Opening interactions: Arabic/English typing, send pulse, pause/resume, completion, reduced motion, input takeover, and cleanup. Real sends and decisions stay manual.
- Interaction review: preserved replay state, paused-tab content visibility, mobile workspace opening/Escape focus return, saved-draft Send protection, and partial-prompt focus handoff.
- The system/screen CSS audit returned `[]`.
- `npm test -- --maxWorkers=2`: 124 files and 1,674 tests passed after the last review fixes.
- `npm run lint`, `npm run build`, and `npm run format:check`: passed; lint produced no warnings. The preview generator and this report also passed their separate Prettier check.

Disposable browser scripts and logs are under `/tmp/tiraz-screen-refresh/`; Content studio visual captures are under `/tmp/tiraz-studio-review/`. No tracked browser-evidence scripts were run. Physical screen-reader testing and non-Chromium browsers were not exercised. The production build retains the existing large-chunk advisory.

Plan 5 Task 8 and the handoff's separate deferred system work are not marked complete by this refresh.
