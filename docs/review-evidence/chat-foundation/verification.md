# Chat foundation verification — 17 October 2026

- Checkout: `/Users/amjedfadul/.codex/worktrees/chat-foundation/Tiraz`
- Branch: `codex/chat-foundation`
- Exact baseline: `9ce0ae99c405b971515148b8a01b86afab0e0766`
- Documentation preview: <http://127.0.0.1:5317/> (kept running, HTTP 200)
- Local Mac execution, Node 24.21.0. No new dependencies. Local commit only.

## References

All three live pages were available and exercised:
[ChatThread](https://formicai.dev/preview.html#/chatthread),
[ChatComposer](https://formicai.dev/preview.html#/chatcomposer),
[PromptBar](https://formicai.dev/preview.html#/promptbar).

Observed thread replay, user bubbles at the end and flat assistant content.
Composer entry/send and Shift+Enter were exercised: the Formic example submitted
on Shift+Enter in this session; Tiraz follows the requested newline semantics.
PromptBar suggestions populate, Enter starts its streaming state, Stop ends it,
and ArrowUp recalls the submitted prompt. Rounded/pill surfaces informed compact
entry. History in Formic ChatComposer produced no visible panel in this session.
Attachment/model/dictation/queue families are excluded; microphone permissions and
external services were not exercised. No unavailable reference was substituted.

## Automated checks

Commands use `PATH=/Users/amjedfadul/.nvm/versions/node/v24.21.0/bin:$PATH`.

- Baseline suite: 70 files, 618 tests passed before implementation.
- Focused chat, prompt generation and navigation: 4 files, 128 tests passed.
- `npx vitest run --maxWorkers=2 --reporter=dot`: **72 files, 635 tests passed**.
- Full suite includes generated snippets in both languages and compilation of the
  library/examples copied to a different application directory. Chat snippets
  were added to the explicit relocated-source test as well as normal generation.
- `npm run build`: passed (TypeScript + production Vite build).
- `npm run lint`: passed, no diagnostics.
- `npm run format:check`: passed.
- `git diff --check`: passed.

Regressions cover Enter/real Shift+Enter newline, composition start/end,
isComposing/keyCode 229 and button guards, whitespace rejection, exact valid text,
controlled draft retention, failure/retry focus, pending duplicate sends, busy
editing, host stop, suggestion callbacks/pending state, native accessible names,
keyed message/action/word stability and settled selection, near-bottom following,
explicit-start local chunks, one user/assistant pair, stable assistant updates,
stop/reset/locale/unmount callback invalidation and completion.

An initial full run overlapped a production build and hit unrelated 5-second
interaction timeouts. It also correctly exposed two updated fixtures needed for
new pages: AI navigation membership and the raw-source relocation loader. Both
fixtures were updated, and the entire suite passed with two workers. The final
suite retains a pre-existing React act/suspension warning in ai-feedback.test.tsx;
the baseline produced the same warning. Production build retains the existing
large-bundle warning; no bundle splitting changes were made in this scope.

## Browser checks

`viewport-matrix.json` records **24 cases**: all three pages × Arabic/English ×
light/dark × desktop/320 CSS pixels. Measured widths were 1282 and 320; all had
zero document overflow. Desktop and 320×568 screenshots are included. An
additional measured 320×320 viewport checked short-height thread/composer use.

- Shared customization: large 16px typography, comfortable density, 16px radius,
  system reduced motion, inspector disabled state. Changes reached playground
  and examples; disabled entry blocked editing, then restored. Settings reset.
- Arabic shaping and Arabic/English mixed content remained legible. User bubbles
  mirror to inline-end; upward Send is intentionally unchanged in RTL.
- Composer bounded to 160px with 713px of editable content; internal scrolling
  remained available. PromptBar stayed compact with an 80px bound.
- Native wheel scrolling into older messages during a run retained scrollTop
  360.74 through completion while scrollHeight increased to 1151px, with a 144px
  thread in the short viewport. No forced return to bottom.
- Browser selection of received word “Start” survived completion: identical word
  and assistant DOM nodes; textarea focus remained. OS reduced-motion media was
  simulated and computed word animation was `none`.
- Send → streaming → Stop retained received text. A second send completed. The
  10.54-second MP4 is a browser screencast of these actions plus Shift+Enter.
- Local IBM Plex Sans Arabic font loaded. No chat model/network requests.

Browser viewport/media overrides and temporary selection instrumentation were
reset, and the preview tab reloaded. The preview remains available.

## Independent review

A separate reviewer inspected source, API boundaries, portable examples and
regressions, then independently ran focused checks. Two P2 findings were fixed:
PromptBar now respects native aria-label and suggestions use shared pending state.
Each fix was reproduced with a failing regression. Re-review reported **no
remaining actionable findings**; independent focused result: 4 files/128 tests.

## Limitations and preservation

IME coverage uses synthetic composition events; mobile coverage uses measured
browser viewport emulation. Neither is physical-device or OS-input-method testing.
No manual VoiceOver/screen-reader session was performed; automated roles, names,
focus, selection and live-region checks do not establish full accessibility
conformance. Partial Markdown syntax can still replace affected parser nodes,
as documented by existing Markdown/StreamingText APIs.

Original checkout remains on main at ce78408818b6a9866ab0faa7748404cba44d8939 with
its README.md/workbench.css edits and .claude/ untracked directory; its index
remains empty. No original files, landing work or unrelated servers were changed.
Only this worktree's preview was started. No push, merge, deployment or new
component family beyond the three requested foundations.

## Follow-up: remove ChatThread focus border

Removed the thread's focus outline at the user's request. The region remains
keyboard-focusable and scrollable; message-action and composer styles are unchanged.
Browser inspection confirmed the focused thread matched :focus-visible with
outline-style none. See thread-focus-removed.jpg.

Focused chat, generated-code and relocated-source checks: 4 files, 22 tests passed.
Build, lint, formatting and diff checks passed. The full suite was not rerun for
this CSS-only follow-up; the preceding implementation run passed all 635 tests.

## Screenshot clarification: composer focus styling

The supplied screenshot identified ChatComposer's nested textarea outline and
outer focus highlight, rather than the ChatThread scroll region. Both composer
focus decorations are now removed; its ordinary surface border remains. Browser
inspection of the keyboard-focused textarea confirmed :focus-visible, outline
none and the outer border matching --border-strong. Evidence:
composer-focus-removed.jpg. PromptBar keeps its existing focus treatment.

Fresh focused checks: 4 files, 22 tests passed. Build, lint, formatting and diff
checks passed. No new behavior or API changes; full-suite baseline remains the
preceding 635-test run.
