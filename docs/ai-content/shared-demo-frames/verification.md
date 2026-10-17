# Shared documentation demo frames

Follow-up to base commit `d8dfa8792dca91cfaed6d46bc7bbfb672ec9d8bf`.
Checkout: `/Users/amjedfadul/.codex/worktrees/ai-content/Tiraz`.
Branch: `codex/ai-content`. Preview: <http://127.0.0.1:5291/?component=streaming-text>.

StreamingText now uses Copy prompt and Replay with no stop control. Both demos
still autoplay. All documentation playgrounds and example sections use the same
portable DemoFrame helper: border, surface, radius, 24px desktop padding and 16px
narrow-screen padding. Controls follow the actual section: static displays and
paragraph-only guidance have copy only; interactive/stateful or animated examples
also offer replay/reset. Animated playground replay keeps its configured model;
other playground resets retain shared appearance settings. The helper is an
example utility, not a new public component family.

Copy uses the current generated prompt, including customization, complete example
source and dependency instructions. The new helper import is relocated to the
copied system root in generated examples. Clipboard success is check-only with
polite status; failure uses an error icon, accessible explanation and retry.
Streaming host responsibilities, cancellation guidance and local provenance remain
in portable documentation; cancellation has no demo control after this request.

## Local verification

- `npm test -- --maxWorkers=2 --testTimeout=15000`: 70 files, 618 tests passed.
  Includes generated examples, portable prompts, source-only compilation and
  component behavior/accessibility regressions.
- Final focused demo-frame tests: 6/6 passed, including exact clipboard text,
  failure/retry/stale completion, autoplay, replay focus, section-specific controls
  and appending/resetting an empty Timeline.
- `npm run build`, `npm run lint`, `npm run format:check`: passed. Lint has no
  warnings. Build retains the existing main-bundle size advisory.
- Independent review: portability and section-classification findings fixed and
  re-reviewed; final 6/6 focused checks passed, no remaining actionable findings.
- Native Chrome inspected all 53 documentation pages: two matching frames per
  page, matching padding/borders/surfaces/radii/widths and no document overflow.
  Measurements: [all-pages-desktop.json](all-pages-desktop.json).
- Arabic dark Markdown at 320px: both frames 288px wide with 16px padding, one copy
  control each, no page overflow, long tables scroll internally.
- Native Chrome prompt copy verified using Mac `pbpaste`: 9867 characters,
  complete multiline 7814-character source example preserved exactly, with the
  helper import and both required parser dependency instructions.
- Browser keyboard replay preserves the header button's focus and visibly starts
  streaming; completion stops the active indicator. Copy shows check feedback.

Screenshots: [streaming](streaming-desktop.png), [static copy-only headers](static-desktop.png),
[Arabic dark 320px](static-arabic-dark-320.png).
[Short recording](replay-copy.mp4) shows replay, streaming, completion and copying;
it uses actual timestamped browser screencast frames encoded locally.

Native clipboard was checked in Chrome because the in-app browser uses a clipboard
bridge. Clipboard failure/retry was verified with automated denial, not an OS
permission dialog. No new manual VoiceOver session or other browser/device testing
was performed. Existing Formic/reference and component-specific security checks
remain recorded in the parent verification report.
