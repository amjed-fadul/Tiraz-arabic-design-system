# Textile motion verification — 2026-10-16

Checkout: `/Users/amjedfadul/.codex/worktrees/ai-feedback/Tiraz`

Branch: `codex/ai-feedback`

Starting commit: `2dd01e92cf08da213f7a6289042a7b57111e835c`

Preview: <http://127.0.0.1:5251/> — AI patterns. The exact new local commit is returned in chat.

## Result

LoadingState's default mark has three 17px parallel threads and a perpendicular thread that moves across them. Its middle gap reveals the middle thread, producing an over/under/over crossing. ThinkingIndicator has three 4×2px rectangular stitches with sequential brightness and 1px sideways movement. Active ThinkingState reuses ThinkingIndicator with `announcement="off"`; the outer summary remains its single polite status. Expanded text stays still.

Both marks are 24×16px, use only `--action`, and share `calc(var(--motion-state) * 9)` = **1.62 seconds** with eased matching endpoints. Reduced motion leaves a centered woven mark and static stitches. Existing `indicator="spinner"` selects the woven default for API compatibility; `indicator="skeleton"` retains its existing placeholder behavior. General Spinner source, global tokens and styles preceding the AI-feedback section are unchanged. No dependency, public API, inspector control, disclosure logic or demo timer changed.

## Recording and visual evidence

- [MP4 recording](weaving-threads.mp4): **9.72 seconds**, six complete cycles, H.264 at 50 fps, 960×800. All three patterns run together with default compact sizing and fixed sample text.
- [Animated GIF preview](weaving-threads.gif): the same recording at 25 fps, trimmed to six cycles for continuous replay.
- [Recording provenance](recording.json): actual local browser `Page.startScreencast` frames, sorted by browser timestamps before encoding with local FFmpeg. No synthetic motion was substituted.
- [Seam contact sheet](seams.png): enlarged crops from actual browser screenshots across the cycle and immediately before/at/after three loop boundaries. Rows are LoadingState, ThinkingIndicator and ThinkingState.
- [Phase measurements](phases.json): browser CSS animations frozen by a verification-only fixture clock at 13 exact times. At 0, 1620, 3240 and 4860ms, thread positions and stitch opacities/positions match within numerical tolerance. The only nonzero endpoint difference is floating-point noise below 1e-29px. Text and mark layout boxes remain identical, text has no animations, and status text has zero mutations. Peaks occur in stitch order 1→2→3, 540ms apart.
- [English/light/blue desktop](en-light-blue-1440.jpg), [Arabic/dark/plum at 320px](ar-dark-plum-320.jpg), [English/light recording view](en-light-desktop.jpg).

The full ten-second realtime capture and phase/contact-sheet views were inspected for several cycles and their seams. The small marks remain legible, with restrained accent opacity and no text bounce, glow or layout movement.

## Browser checks

[Matrix](matrix.json): **32 cases**, Arabic/English × light/dark × 1440/320 CSS pixels × all four accents. Actual `innerWidth` is asserted. Every mark remains 24×16px; all three resolve to the selected accent; no horizontal document overflow occurs. Both language layouts were inspected visually.

[Additional checks](checks.json): large typography/standard density in both languages/themes at 320px; **8 reduced-motion cases** covering application and OS preference independently in both languages/themes. Each disables all mark animations, centers the weft at x=12 and retains three static stitches at opacity 0.65. Chevron transition is 0s. OS preference was emulated per tab and cleared afterward.

The reused ThinkingIndicator preserves one polite ThinkingState status, exact button/panel names, keyboard Enter/Space disclosure, removal of collapsed content from tab order and controlled-collapse focus recovery. Existing unit regressions also cover outside focus, replaced detail children, retained form values, replay/cancel/unmount cleanup and cancellation/completion focus. Animation frames never mutate labels or status text.

The reproducible showcase is `tests/browser/ai-feedback-motion.html`, served by the same preview. Parameters: `lang=ar|en`, `theme=light|dark`, `accent=sage|blue|plum|clay`, `custom=true`, `motion=true`. The optional test-only `phase=<milliseconds>` freezes browser CSS animations for seam inspection; omit it for normal motion/recording. It is not a component prop or public customization control.

## Local verification

All checks ran on the user's Mac with the existing Node 24.21.0 installation.

- `npm test -- src/system/ai-feedback.test.tsx src/system/ai-feedback-examples.test.tsx src/system/feedback.test.tsx src/system/taskrows-agent.test.tsx src/system/ai-registry.test.ts src/workbench/ai-feedback-pages.test.tsx src/workbench/generated-code.test.ts src/workbench/generate-prompts.test.ts src/workbench/navigation-groups.test.tsx --maxWorkers=1 --testTimeout=20000`: **9 files, 158 tests passed**.
- This includes generated examples and a relocated source-only consumer compilation, accessible labels/announcement ownership, disclosure/focus, demo cancellation and existing general feedback/Spinner regressions.
- `npm run build`: TypeScript and Vite passed; the existing >500 kB bundle advisory remains.
- `npm run lint`: passed without warnings after correcting a dependency warning in the verification-only fixture.
- `npm run format:check` and explicit Prettier checks of the fixture, Markdown and JSON evidence: passed.
- `git diff --check`: passed.
- Independent review: **no actionable findings**. The reviewer checked drawing order, negative delays, smooth endpoints, reduced motion, naming/disclosure and documentation consistency, and independently passed 3 suites/19 tests. No review fixes were required.

The existing complete 537-test batch result remains recorded in the parent report. This refinement's 158-test run covers the affected families/compositions and general loading/disclosure regressions; unrelated families' behavior and shared primitives were not changed.

## Limits and preservation

DOM/ARIA checks do not establish actual VoiceOver speech. Safari/Firefox and other screen readers were not manually inspected. Screenshot zoom was accounted for using measured CSS viewport widths; recordings retain the browser-rendered mark sizing. Browser phase controls are confined to the verification fixture.

The original checkout's index, README and workbench CSS hashes match the starting snapshot; its `.claude/` directory and edits remain untouched. Landing remains at `9881dbc9c8b52aa80aea38e79ab9476b45f5bb0a`. Existing servers, including preview port 5251, remain running. No push, merge, deployment or additional component family was performed.
