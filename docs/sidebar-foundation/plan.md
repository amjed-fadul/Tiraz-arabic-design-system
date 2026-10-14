# Sidebar foundation

User brief is the specification. Work locally from reviewed main in isolated
`codex/sidebar-foundation`; preserve the original checkout and port 5211.

- [x] Add Sidebar composition with native attributes/React 19 refs. Root owns
      controlled/uncontrolled collapse. Content scrolls between persistent slots.
      Native links, buttons, one disclosure level, optional heading/count, Tooltip
      rail labels. Focus moves out of hidden children to their parent; hidden slot
      content moves to toggle. Rail disclosure expands root and opens children.
- [x] Add continuous documentation, compact controls, honest local anchor
      examples, generated code/prompts, exports, API registry and portable guidance.
- [x] Replace dashboard desktop navigation with Sidebar and reuse content in
      existing mobile Sheet. Preserve section anchors, focus handoff and data flows.
- [x] Verify focused tests, full suite, generated/relocated source compilation,
      build, lint, formatting, rendered language/theme/width/motion/focus matrix and
      customer workflows. Independent review, fix, re-review; local commit only.

Review focus: controlled external collapse while child has focus; disclosure
closure focus; long labels/counts; footer action focus; short mobile scrolling
and navigation dismissal/restoration. No new dependency.

Execution: native implementation in this session; independent reviewer at end.
Detailed scope is already authorized by the user's request. Missing attached
images: use Tiraz tokens and the expanded/rail appearance described by the user.

## Documentation grouping clarification

User explicitly authorizes grouping only: Forms, Navigation, Data, Files,
Display & feedback, Overlays, Charts and AI patterns. Render implemented groups
only, with small translated headings, always expanded compact rows, the existing
page IDs/URLs/selected-state handlers and scrolling. No new component/page.
Files and AI patterns have no implemented page and remain absent.

- [x] Add documentation group metadata and render in the existing desktop/mobile menu.
- [x] Check page coverage/selection/localization, browser scrolling/layout, full
      verification, independent review and local commit. Keep preview on 5212.

## Shared Sidebar correction

User specifies a single expanded header row (branding at inline-start, toggle at
inline-end), logo then expand toggle in the rail, no empty gap before navigation,
and one rail axis for actual logo/toggle/icon/avatar/action boxes. Fix shared
slots, not example offsets. Add a small native SidebarIdentity slot for both
branding and account composition; hide collapsed label space inside it. Header
owns row/stack layout; footer remains fixed, navigation scrolls. Rail scrollbars
must not shift icons off-axis. Dashboard retains its three destinations.

Documentation: seven top-level entries (Overview, expandable Library, Documents,
People, Activity, Notifications, Settings) in two named groups. Library has three
children, one initially active. Static documents/contributors and local reminders
supply real counts; selected content, reminder clearing, summaries and account
information are real local actions, with no service or persistence claim.

- [x] Capture before state and failing geometry/sample regressions.
- [x] Fix shared identity/header/footer/rail styling; synchronize exports/API/AI.
- [x] Expand the portable example and generated snippets; retain native links,
      history and mobile post-dismissal focus.
- [x] Local geometry + keyboard + short/mobile + reduced-motion checks, full
      suite/build/lint/format, independent review/fixes/re-review and local commit.
