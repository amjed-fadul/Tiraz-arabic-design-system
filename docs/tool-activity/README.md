# Tool activity verification

Implemented locally on the user's Mac on 16 October 2026, branch
`codex/tool-activity`, isolated checkout
`/Users/amjedfadul/.codex/worktrees/tool-activity/Tiraz`.
Base: `3fe382c609dd9e567258400910088feae4a19a75`.
Preview: http://127.0.0.1:5267/ (Vite, strict port, loopback only).
The selected documentation page is saved in the browser's local preferences;
the URL does not deep-link to a component.

## Reference inspection

Inspected the live [ToolCall](https://formicai.dev/preview.html#/toolcall) and
[ToolChips](https://formicai.dev/preview.html#/toolchips) references in the browser.
Expanded/collapsed call input/output, observed static pending/running/completed/error,
reloaded the live example to replay pending → running → completed, and activated
Try again (the reference reports a retry notification). Inspected rendered-node
output, aggregate summary expansion, tool-row expansion and file-chip diff preview.

ToolCall follows the thin frame, state glyph, readable action, monospace name,
optional duration and indented details pattern, using Tiraz tokens and typography.
ToolChips is the lean summary subset: compact labeled state/count chips with
host-connected buttons. It does not implement Formic's aggregate disclosure or
file diff previews. The connected example opens and focuses a real ToolCall.

No dependency was added. No tool execution, network integration, permission system,
orchestration, private reasoning or library execution timer was introduced.

## Local checks

Bundled Node v24.19.0, npm with the runtime Node directory prepended to PATH:

- `npx vitest run --maxWorkers=2`: **66 files, 555 tests passed**; see [tests.txt](tests.txt).
- Includes generated example TypeScript compilation, alternate inspector settings,
  relocated prompts, and source-only library/example compilation at a different path.
- `npm run build`: passed; Vite retains its large-chunk advisory; see [build.txt](build.txt).
- `npm run lint`: passed with no warnings; see [lint.txt](lint.txt).
- `npm run format:check`: passed; see [format.txt](format.txt).
- Browser fixture TSX/HTML checked separately with Prettier; `git diff --check` passed.

Initial full verification exposed a missing raw-source relocation fixture entry,
which was fixed. The simulation test now imports before enabling fake timers.
The original full-concurrency run also timed out in an existing DatePicker test;
the complete suite passed with two workers. No timeout increase was needed.

## Browser checks

[Matrix](browser-matrix.json): Arabic/RTL and English/LTR, light/dark, actual CSS
1280×900 and 320×900 viewports, all four static states, local font, no page overflow,
and zero buttons for informational chips. Screenshots are alongside this report.

[Interactions](browser-interactions.json): Enter/Space disclosure, controlled
collapse after replacing focused content, immediate hidden details/tab-order
exclusion, chip-to-call opening/focus, explicit running state, host retry/focus,
replay/reset/unmount cleanup and fresh pending state on remount. Informational
chips have no action semantics; interactive chip hover and keyboard focus were
inspected. OS and system reduced motion both yield static spinners and 0s disclosure
transitions. Shared accent, typography, density and radius changes were exercised
on both documentation pages.

Long RTL output initially exposed a scroll-origin issue; the output region now
uses `dir="auto"`. At actual 320px, its width is 240px, scrollWidth 3582px, height
288px and scrollHeight 1528px; the page stays 320px. ArrowRight moves the internal
horizontal scroll. See [long output screenshot](ar-dark-custom-long-320.jpg).

Inspected expanding/collapsing animation across three cycles, including intermediate
heights/opacities. [Interaction video](interaction.mp4), 7.3 seconds, shows replay,
running/completion/failure, host retry, and connected chip/disclosure interactions.
No browser runtime errors were captured. Temporary media/device overrides cleared.

## Independent review

A separate reviewer inspected the final source, examples, exports/metadata, portable
prompts and tests. The first finding was incorrect error color on the last detail
section when no error was supplied. It was fixed with an explicit error marker.
The reviewer rechecked that fix and the subsequent bidi/scroll fix, internal label
hook extraction and generated guidance. Final result: **no remaining actionable
findings**; final component/page rerun passed 9/9 tests. Independent review was code
and test review; browser inspection was performed by the implementing agent.

## Preservation and limits

Original checkout remained on `ce78408818b6a9866ab0faa7748404cba44d8939`.
Before/after status, tracked binary diff and cached diff compared byte-for-byte
identically. Existing README/workbench edits and .claude content were not touched.
Landing worktrees and unrelated servers were not changed or stopped; existing
port 5194 remained listening. Only this batch is committed locally.

No push, merge or deployment. No manual VoiceOver session or assistive-technology
conformance certification was performed; keyboard/accessibility-tree and DOM checks
are evidence of those interactions, not a claim of universal screen-reader support.
