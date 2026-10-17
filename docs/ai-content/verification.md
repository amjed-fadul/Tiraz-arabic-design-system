# AI content verification — 17 October 2026

For the subsequent automatic playground and animation refinement, see [the follow-up verification](autoplay/verification.md). The [compact header refinement](compact-header/verification.md) replaces the large playback buttons. The results below record the original implementation.

Implemented CodeBlock, Markdown and StreamingText in the existing AI patterns category.
No new category, component family beyond these three, landing work, push, merge or deployment.

- Checkout: `/Users/amjedfadul/.codex/worktrees/ai-content/Tiraz`
- Branch: `codex/ai-content`
- Baseline: `52fd167729c3b7822cd92ea419f9e0d4c426010f`
- Preview kept running: <http://127.0.0.1:5291/> (HTTP 200 verified).
- Verification ran on the user's Mac through this session, with bundled Node 24.19.0.

## Reference inspection

All three live Formic references were available:

- <https://formicai.dev/preview.html#/codeblock>: inspected the compact language/copy header and syntax hierarchy, exercised internal copying.
- <https://formicai.dev/preview.html#/markdown>: inspected prose, nested lists, quote, table and fenced code; exercised fenced-code copying.
- <https://formicai.dev/preview.html#/streamingtext>: replayed and observed active and settled output over time. Words resolve from blur, a trailing cursor remains during the stream, and completion reveals supporting actions. The reference loops; Tiraz's explicitly started local demo completes without looping.

Tiraz follows those content hierarchies using existing typography/tokens and compact defaults. Copy success is check-only, as specifically requested. Markdown streaming is an optional composition of the same static renderer; references do not establish arbitrary Markdown streaming support themselves. No citation, follow-up or transport family was added.

## Parsing and presentation

Added `react-markdown@10.1.0` and `remark-gfm@4.0.1`: one maintained CommonMark parser/React renderer, plus the GFM dialect plugin needed for tables and strikethrough. No custom parser, animation package or highlighting framework. Portable AI README, registry, composition guidance and generated prompts include installation instructions.

Raw HTML is discarded; the maintained parser's default URL transform remains enabled for links/images. Rejected links become text and images retain alt text. Safe protocols do not establish destination trust; the host owns origins/resource loading and content limits. CodeBlock highlighting is deliberately lexical, with plain fallback for unsupported names. Clipboard copying receives the original source string.

StreamingText renders current host text immediately, with no second queue, clock or transport. Stable word nodes preserve selection in settled plain/Markdown prose. Markdown structural reinterpretation can still replace affected nodes. Completion removes the cursor and stops decorative activity. Local demo timers live only in the example and invalidate on replay, cancel, language/mode change and unmount.

## Automated checks

- Focused behavioral/page checks: **23/23 passed**.
- `npm test -- --maxWorkers=2 --testTimeout=15000`: **69 files, 608 tests passed**. Includes generated example type checking, relocated source-only compilation, portable registry/export contracts and prompt relocation.
- `npm run build`: passed. Existing workbench bundle-size advisory remains (main bundle about 1.55 MB minified); no build errors.
- `npm run lint`: passed without warnings.
- `npm run format:check`: passed.
- Explicit Prettier check of the new browser fixture: passed.
- `git diff --check`: passed.

Initial shell Node 20 could not load the toolchain's native bindings; switching to the bundled Node 24 resolved it. The initial baseline full run hit three existing five-second timeouts (`generated-data-table`, `steps-timeline-pages`, `structure-navigation-pages`). The complete run above uses two workers and a 15-second per-test allowance and passes all three. No production/test timeout configuration was changed.

## Browser and clipboard checks

[Matrix measurements](browser-matrix.json) and [behavior evidence](browser-behavior.json) accompany the screenshots.

- All three documentation pages: Arabic/English × light/dark × 1280px/320px = **24 captured views**. No document overflow; code stays LTR. Wide tables and source lines scroll internally at 320px.
- Shared accent, density and typography changes propagate to rendered components. Unsupported language control yields plain text with no syntax tokens.
- Real Mac clipboard checked with `pbpaste`: exact tab, Arabic/English source, two trailing spaces and `CRLF + LF` preserved. Copy was activated with Enter, kept button focus, showed a check and no visible success text. Denial simulation showed persistent failure guidance; missing clipboard is covered by focused tests.
- Unsafe raw script/image markup, JavaScript/entity-obfuscated URLs and data images produced no executable elements or unsafe URLs. A safe HTTPS link remained. Unknown fenced language rendered plain code.
- PageDown/ArrowRight scrolled a long pre internally while it kept keyboard focus.
- System and OS reduced motion both computed `animation-name: none` for words/cursor. Browser testing found and fixed an OS reduced-motion CSS specificity issue before completion.
- Browser selected `Hello` remained selected after a host append to its Markdown paragraph (content held focus). Plain and Markdown whitespace-only selection regressions also pass automated tests.
- Partial Markdown bold, unfinished/finished code fences and a gradually formed table updated without crashes or stale rendering. Cancellation kept received text; replay invalidated old callbacks; completion removed active cursor. Unmount invalidation is covered by timer regressions.

The short [interaction recording](streaming-copy-demo.mp4) shows local streaming, cancellation with retained content, replay, completion and check-icon copy feedback. It consists of actual browser captures, encoded locally as H.264; timing/state samples are in [video-timing.json](video-timing.json).

## Independent review

A separate reviewer inspected the branch against the baseline and re-reviewed fixes. It identified Markdown prefix-selection collapse and inherited language-name lookup, then a plain-text whitespace-only selection edge. All were reproduced with failing tests and fixed. Final independent re-review found no unresolved actionable issues; its independent focused rerun passed 23/23. It also checked the final OS reduced-motion selector.

## Preservation and limitations

Original checkout diff, index diff and status are byte-for-byte unchanged; see [preservation.json](preservation.json). No commands stopped, restarted or reused an unrelated server, and no landing checkout was edited. The final listener inventory no longer included the pre-existing debugger socket `127.0.0.1:9232` (PID 13250); this task did not stop it. Other baseline listening sockets remained present.

Browser checks used the Codex in-app browser with DevTools viewport/media emulation. Captures used explicit CSS clips to avoid the in-app surface's zoom/crop mismatch. Native clipboard was verified separately from the browser tool's clipboard bridge. This does not establish cross-browser/mobile-device or VoiceOver behavior. No manual screen-reader session was performed. Selection inside Markdown syntax that changes structure can move; arbitrary URL destination trust and response size/performance limits remain host responsibilities. No live model/network flow exists or was tested.
