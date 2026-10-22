# Streaming playground refinement — 17 October 2026

The old interactive playground rendered StreamingText with `state="completed"`, so there was no incoming content to animate. It now composes the same local fixed-chunk host demo with one-shot autoplay. It runs on entry and after language/Markdown configuration changes, with Replay and Cancel controls. The standalone example remains explicitly started by default. Production StreamingText's public API and host-driven update behavior are unchanged; its implementation still has no typing queue, transport or timer.

Plain chunks arrive every 160ms instead of 320ms. New words use a lighter 360ms reveal (0.9px initial blur instead of 2px), overlapping with following words; the caret pulses gently over 1100ms. The demo root fills the available width, preventing horizontal recentering as its response grows. Arabic glyphs and settled words have no layout transforms. Completion stops decoration, and system/OS reduced motion disables animations.

Autoplay startup is a cancellable host callback. Stable callbacks preserve cancellation across rerenders; StrictMode cleanup, configuration changes and unmount invalidate pending work. Cancel keeps the received content and does not restart automatically. The new regression was run red against the old completed sample, then green after the change. Portable examples, metadata, API docs and generated prompts reflect autoplay and the new duration.

Verified locally on the user's Mac in `/Users/amjedfadul/.codex/worktrees/ai-content/Tiraz`, branch `codex/ai-content`, with bundled Node 24.19.0:

- Focused component/playground checks: 24/24 passed, including StrictMode automatic start, completion, cancellation, replay, configuration changes and cleanup.
- Full `npm test -- --maxWorkers=2 --testTimeout=15000`: 69 files, **609 tests passed**, including generated and source-only compilation.
- Build, lint (no warnings), formatting and diff whitespace checks passed. Existing bundle-size advisory remains.
- Independent review found no actionable issues; its focused/prompt rerun passed 133/133 tests.
- Browser: automatic entry observed, first-word and completed-response x positions both 256.818px; completion removes the cursor. Markdown and Arabic language changes restart correctly; cancellation preserves content.
- Browser: both OS and system reduced motion computed `animation-name: none`. Arabic/dark at 320px has document width 320px. English/light desktop also inspected.
- [Browser evidence](browser.json), [desktop screenshot](autoplay-en-light-desktop.jpg), [Arabic mobile screenshot](autoplay-ar-dark-320.jpg), and [updated interaction recording](playground.mp4).

Preview remains at <http://127.0.0.1:5291/>. No push, merge, deployment, landing edits or unrelated-server changes. Browser checks use the in-app browser with temporary responsive/media emulation reset afterwards; no manual VoiceOver or physical-device testing was performed.
