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

## Follow-up: match PromptBar focus styling

At the user's request, PromptBar now shares the composer's outline-free input
focus styling. Removed its outer focus border highlight while preserving the
normal border. Browser inspection confirmed a keyboard-focused PromptBar textarea
had outline none and the outer border still matched --border-strong. Evidence:
prompt-focus-removed.jpg.

Fresh focused chat/generated/source-only checks: 4 files, 22 tests passed. Build,
lint, formatting and diff checks passed. No API or interaction changes; the full
635-test suite was not repeated for this CSS-only follow-up.

## Follow-up: RTL entry caret starts on the right

The only runtime correction against e28f30bedd418741c2b107d89eb2319025583033 is
PromptEntry's default dir: it now follows SystemProvider direction rather than
auto. An explicit native dir still overrides that default. Both ChatComposer and
PromptBar reuse it. Empty and English-first drafts start on the right in RTL;
LTR remains left-start. Message content keeps separate auto direction.
components.css is byte-identical to that baseline: approved removal of focus
outlines and outer border highlights is preserved.

### Recorded original results and tested source

[rtl-tested-source.json](rtl-tested-source.json) pins SHA-256 and Git blob hashes
for the implementation, tests, guidance, styles and dependency files that matched
the existing successful run: 72 files / 639 tests, five focused files / 141 tests,
build, lint and formatting. The original full/focused/build logs are preserved in
rtl-full-test.txt, rtl-original-focused.txt and rtl-build.txt. Captured log files
have trailing whitespace and excess blank lines at EOF normalized; result counts
and diagnostic messages are unchanged. The two new direction regressions had
failed before the default was corrected.

Four additional mixed editing/selection and keyboard/IME verification tests were
then added. [rtl-publication-source.json](rtl-publication-source.json) records the
final tested snapshot and comparison with the original: only the test file differs
among the pinned files; implementation/guidance/styles/dependencies are unchanged.
Fresh verification of this expanded suite passed:

- Full suite: **72 files / 643 tests**, npx vitest run --maxWorkers=2 --reporter=dot.
- Focused chat, generation, source-only compilation and prompt portability:
  **5 files / 145 tests**.
- npm run build, npm run lint, npm run format:check and git diff --check passed.
- Logs: rtl-publication-full-test.txt, rtl-publication-focused.txt,
  rtl-publication-build.txt, rtl-publication-lint.txt and rtl-publication-format.txt.

### Browser and independent verification

[entry-direction-matrix.json](entry-direction-matrix.json) records 24 entry,
language and script cases, including empty fields after clearing drafts. Both
entries were also exercised in RTL and LTR using native keyboard selection
(Meta+A), mixed Arabic/English replacement and Shift+Enter. Each retained the exact
multiline draft; Enter submitted that exact value, the host cleared it, and focus
and provider direction remained on the textarea. Composition start plus Enter or
Send, native isComposing, and keyCode 229 were separately simulated in the browser:
all blocked submission. [rtl-editing-verification.json](rtl-editing-verification.json)
contains the four component/direction records. Computed outline was none and the
outer border matched the ordinary --border-strong token in every case. The native
insertion caret is the remaining visual cue.

Screenshots: composer-rtl-caret-right.jpg, prompt-rtl-caret-right.jpg,
rtl-editing-composer.jpg and rtl-editing-prompt.jpg.

A fresh independent reviewer found no implementation issues and independently ran
**2 files / 19 tests**, including the four later mixed editing/IME tests. The
reviewer requested that evidence distinguish the original 639-test result from
the expanded suite; this report and the paired source manifests do so. Completed
evidence re-review found no actionable issues, verified all pinned hashes and saved
logs, and confirmed the CSS still matches the base. No additional runtime changes
were made during review.

### Limitations and publication scope

IME events are synthetic; physical OS input methods were not exercised. These
are desktop browser checks, not physical mobile or manual screen-reader testing.
The pre-existing React act/suspension warning and production large-bundle warning
remain. Neither warning failed validation.

The user authorized committing and pushing this correction and its evidence on
codex/chat-foundation, without force. The focused comparison base is exactly
e28f30bedd418741c2b107d89eb2319025583033. No merge, deployment or additional component
work. Preview 5317 remains running and returns HTTP 200. Original checkout/index,
edits, landing work and unrelated servers remain untouched. Publication SHA and
remote equality are verified and returned after the commit is created.
