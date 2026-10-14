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
