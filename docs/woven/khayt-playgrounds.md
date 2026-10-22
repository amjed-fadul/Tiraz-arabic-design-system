# Khayt in component playgrounds

22 October 2026. Local checkout: `/Users/amjedfadul/Tiraz-worktrees/woven`,
branch `claude/woven`. Preview: <http://127.0.0.1:5411/library/components/agent-task>.

The ten components with agent-presentation slots now show Khayt in their
playgrounds: AgentTask, DraftReview, ImageGeneration, ChangeSummary, DataAnswer,
CitedAnswer, TaskStarter, AskUserQuestions, SuggestedEdits and AssistantControls.
The existing header owns the avatar; no separate mascot card is added.

## Customization

**Agent appearance / مظهر المساعد** switches between **AI icon / أيقونة الذكاء
الاصطناعي** and **Khayt / خيط**. Khayt is the default for these playgrounds.
Choosing the original icon removes the optional mascot runtime from copied code.
TaskStarter, CitedAnswer and AssistantControls retain their identity row with the
standard AI mark in that mode.

**Agent color / لون المساعد** uses Tiraz ColorPicker and appears when Khayt is
selected. Color tints the existing tray as well as the avatar. Appearance and
color are saved per component, and old saved settings gain the new defaults.
Invalid saved colors and option values fall back to valid defaults.

Identity changes update the mounted example. They do not replay a task, clear a
typed request, reset a selected tone or clear the selected example state.
Reset remains the explicit way to restart the playground. Reduced motion keeps
the appropriate static pose.

The example host supplies `getAgentPresentation(status)` using its real state,
including asynchronous question submission. The renderer maps working,
waiting, thinking, completed and failed states to the appropriate expression.
Public components continue to accept the neutral `agentPresentation` slot and
do not import Khayt.

## Copied examples

The generated code and agent prompt match the selected appearance and color.
The code uses the actual `agentPresentation` API through the example host,
rather than passing workbench-only setting names to the public component.
The API reference also documents the presentation slot.

With Khayt selected, the prompt names the optional runtime files, full sprite
assets and provenance to copy beside the library. It explains how to adjust the
runtime's reduced-motion import when the source-root folder is renamed. It
requires neither the studio nor the workbench. An integration test compiles all
ten examples in both languages after physically copying only the library and
those avatar files into another application path. The library-only source-copy
check separately uses the original icon, which needs no mascot files.

## Verification

- `npm test -- --maxWorkers=2`: **1,829 tests, 146 files passed**.
- `npm run lint`: passed, zero warnings.
- `npm run build`: passed; the existing large-chunk advisory remains.
- `npm run format:check`: passed.
- CSS audit: `[]`.
- Initial behavior tests failed before the feature was connected. They now
  cover all ten playground headers, switching without resetting user input or
  tone, selected-color persistence, invalid-setting recovery and generated code.
- Generated code compiles in both languages and both appearance modes. The
  source-copy and generator-relocation checks also pass.
- Throwaway Playwright checks outside the repository: **25 scenarios** across
  all ten pages in Arabic and English, dark/light layouts, mobile customization,
  persisted colors, original-icon switching, and failed/working/done poses.
- A further **13 scenario groups** check accessibility against the original-icon
  baseline, persisted icon choice in the standalone playground, and reduced
  motion. No new accessibility findings were introduced in the checked preview
  and settings surfaces.

Existing axe observations remain: default example h3 headings skip the docs
page's h1, and TaskStarter's existing textarea combobox role raises an
`aria-allowed-role` observation. Both also occur with the original icon. They
were kept outside this appearance update. Keyboard switching, focus and typed
input were checked in Chrome; Safari/Firefox, physical touch devices and manual
screen-reader sessions remain untested.

## Evidence

- [English playground and customization](khayt-playground-en.png)
- [Arabic draft playground and customization](khayt-playground-ar.png)
- [Phone customization sheet](khayt-playground-phone-settings.png)
