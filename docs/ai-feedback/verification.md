# AI feedback local verification

Latest verification: [Textile motion refinement — 2026-10-16](motion/verification.md), including the recording, updated screenshots and focused checks.

## Original batch at 2dd01e9

Checkout: `/Users/amjedfadul/.codex/worktrees/ai-feedback/Tiraz`

Branch: `codex/ai-feedback`

Base: `3eb0b8c9a5c49707fdb24d4e3999b52b8668311e`

Preview: <http://127.0.0.1:5251/> — AI patterns → LoadingState, ThinkingIndicator, ThinkingState.

Runtime: existing Node 24.21.0 on the user's Mac. No dependency/lockfile changes.
The final exact local commit is returned in chat; it includes this evidence.

## Implementation

- LoadingState composes decorative Spinner or Skeleton with a required label and optional description.
- ThinkingIndicator uses decorative CSS dots and a stable supplied label.
- ThinkingState accepts required label, active and children, with internal or controlled disclosure. Focus recovery follows the existing TaskRows approach and also handles focused content replaced during collapse. Closed content stays mounted, hidden and inert.
- Execution state, summaries and details belong to the application. No private model reasoning, generated logs, execution timers or automatic transitions belong to the library.
- Standalone examples and one explicitly started, labeled local simulation live in the portable bundle. The simulation cancels timers on replay/cancel/unmount. Cancel remains mounted and aria-disabled when inactive to retain focus.
- All pages use the existing continuous layout and contextual inspector in AI patterns. Exports, complete registry metadata, API reference, generated code/prompts and portable guidance are synchronized.

## Local commands and results

All commands run in this checkout with `PATH=/Users/amjedfadul/.nvm/versions/node/v24.21.0/bin:$PATH`.

- `npm test -- --maxWorkers=1 --testTimeout=20000`: **64 files, 537 tests passed**.
- Further focused run of `generated-code.test.ts`, `generate-prompts.test.ts`, `ai-registry.test.ts`, `ai-feedback.test.tsx`, `ai-feedback-examples.test.tsx`, and `ai-feedback-pages.test.tsx`, with the same worker/timeout settings: **6 files, 121 tests passed**. This adds generated skeleton/no-description, inactive/expanded and mixed-language/quoted-label cases after the full run.
- Generated examples compile in Arabic/English. Registry tests compile examples after relocating only the library, including generated snippets for all three new families.
- `npm run build`: TypeScript and Vite passed. Existing >500 kB bundle advisory remains.
- `npm run lint`: passed without warnings.
- `npm run format:check`: passed. New fixture, Markdown reports and browser JSON also checked explicitly.
- `git diff --check`: passed.
- Preview responds HTTP 200. Only the new port 5251 server was started.

## Browser evidence

Browser inspection ran locally through Codex's in-app browser on the Mac.

- [Component matrix](browser/matrix.json): **16 cases**, Arabic/English × light/dark × 1440/320 CSS pixels × default/custom settings. Custom uses standard density, large typography, plum accent and radius 2. No document or section overflow. Browser zoom was accounted for; actual `innerWidth` is recorded and asserted at 1440/320.
- [Documentation matrix](browser/docs-matrix.json): **24 cases**, all three pages × Arabic/English × light/dark × 1440/320 CSS pixels. All continuous headings remain present and no document overflow occurs.
- [Interaction evidence](browser/checks.json): Enter/Space and Tab in Arabic/English; hidden/inert panels; controlled focus recovery; focus recovery when the host replaces a focused child; outside-focus preservation; retained input values; active disclosure; cancel/completion focus; unmount/remount; provider and OS reduced motion.
- DOM MutationObserver evidence shows no status-text mutations during decorative animation/disclosure. A supplied label update generates one atomic polite change. Connected demo transitions have one status owner; nested loading/inline visuals opt out.
- Actual browser clipboard output matches displayed code and is included in the copied portable prompt: [code](browser/copied-code.tsx), [prompt](browser/copied-prompt.txt). Unit fake-clock regressions exercise stale replay deadlines and timer cancellation on unmount directly.
- Shared customization was also exercised through the real documentation controls, with computed styles checked on the rendered feedback.

The browser fixture is `tests/browser/ai-feedback-fixture.html`, served by the same preview. Query parameters: `lang=ar|en`, `theme=light|dark`, `custom=true|false`, `motion=true|false`. It supplies host-controlled disclosure and replacement/focus probes; it is verification code, not a library API.

Representative screenshots:

- [Arabic ThinkingState, light desktop](browser/docs-ar-light-1440.jpg)
- [English LoadingState, dark desktop](browser/docs-loading-en-dark-1440.jpg)
- [English ThinkingIndicator, dark desktop](browser/docs-indicator-en-dark-1440.jpg)
- [English ThinkingState, dark 320px](browser/docs-en-dark-320.jpg)

## Independent review

A fresh reviewer inspected source, metadata, lifecycle and accessibility behavior independently. Three P2 findings were fixed: focus loss when replacing focused details during collapse, disappearing demo Cancel control, and registry/catalog ordering. The first two were reproduced with failing regressions before fixes. The existing registry integrity test caught the third. Re-review found **no remaining actionable findings** and independently probed focus recovery, outside-focus preservation, announcement opt-out and label separation. See [review record](review.md).

## Development-run notes and limits

The default shell Node 20 cannot run this repo's Vite/Vitest toolchain; the installed Node 24 was selected explicitly. An initial concurrent full run failed the new registry ordering and in-progress review regressions, and hit existing timing failures in Dashboard's customer save test, DatePicker's LTR month navigation, feedback documentation, and Toast's subsequent manual-dismissal expiry test. A focused registry run also hit the existing 5-second type-check timeout. The complete settled-source serial run passed with a 20-second timeout; no unrelated production code or global test settings were changed.

Accessibility checks cover DOM/ARIA, keyboard and focus behavior. Actual VoiceOver speech and Safari/Firefox were not manually verified. OS reduced motion was emulated per browser tab, not changed in macOS. No real AI/network backend was tested or implied by the local simulation.

The original checkout remains on `ce78408818b6a9866ab0faa7748404cba44d8939`; its index SHA-1 (`91150b79e7091167e2133ae89525aa0c5395852e`), README and workbench CSS hashes match the initial snapshot, and `.claude/` remains untouched. The landing worktree remains at `9881dbc9c8b52aa80aea38e79ab9476b45f5bb0a`. All initially observed server PIDs/ports remain present. No push, merge, deployment, landing changes or additional component families were performed.
