# Chat foundation implementation plan

Goal: implement the supplied ChatThread, ChatComposer and PromptBar brief on baseline 9ce0ae99c405b971515148b8a01b86afab0e0766, locally only.

Architecture: ChatThread renders stable application-supplied message slots. ChatComposer and compact PromptBar share one internal controlled entry, composition guard, submission lock and bounded textarea sizing. Application examples own messages, draft, fixed response chunks and cancellation. No new dependency or ChatApp.

- [x] Add failing interaction regressions for exact submission text, whitespace, Enter/Shift+Enter, IME, async failure/draft/focus, busy/stop, stable message nodes and opt-in near-bottom scrolling.
- [x] Implement and export components, using Tiraz tokens and localized defaults. No decorative attachment/model/tool controls. PromptBar suggestions use a required callback when supplied.
- [x] Add portable application-owned conversation and static/state examples; test duplicate sends, stop/reset/unmount timer invalidation, stable assistant ID and announcements.
- [x] Add three pages under existing AI patterns, contextual inspector fields, API metadata, compiling generated source and portable guidance.
- [x] Run focused and full checks, source-only/generated compilation, build/lint/format; inspect English/Arabic, both themes, 320px/desktop/short viewport, customization and reduced motion. Capture screenshots and a short interaction recording.
- [x] Independent review, fix and re-review findings; commit locally; leave a free-port docs preview running. Verify original edits/index and unrelated servers remain intact.

Reference inspection: all three live Formic URLs loaded on 2026-10-17. Thread has end-aligned user bubbles and flat assistant prose, replay updates the final response. Composer is bordered multiline-looking entry with upward send; observed Shift+Enter submitted, which Tiraz deliberately corrects per brief. PromptBar has rounded/pill surfaces, suggestions populate, Enter starts streaming and changes Send to Stop. Its attachments, model, dictation, history and queue are outside this task. No claims of physical mobile or OS IME testing.

Review focus: pending submissions when host rerenders/unmounts; rejection without draft/focus loss; stable settled text selection during appends; reader scroll intent; stale simulation callbacks after stop/reset/configuration changes.

Execution notes: implemented in this session. One fresh independent reviewer found
native aria-label precedence and suggestion pending-state issues. Both received
failing regressions and were fixed; re-review found no remaining actionable issue.
All 635 tests pass with two workers; build/lint/format and the 24-case browser
matrix pass. See docs/review-evidence/chat-foundation/verification.md for evidence
and limitations. User-specified local-only integration is preserved.
