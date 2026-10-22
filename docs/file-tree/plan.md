# FileTree implementation and verification

Base: 939215aa7ef0d699ef1ae8091314e9ce01f9e678. Local isolated branch: codex/file-tree.

- Add FileTree with discriminated supplied file/folder data, stable global IDs, internal/controlled expansion and single selection, and host-owned file activation.
- Use nested treeitem/group semantics, roving focus, RTL horizontal arrows, visible-node navigation, Home/End, prefix/repeated-character typeahead and sibling expansion. Keep selection independent of focus. Recover removed focus to the closest surviving ancestor, same visible position or empty root, respecting intentional blur.
- Reuse Lucide icons, logical layout, tokens, small default sizing, selected surfaces, full-row hover/focus and reduced-motion transitions. Truncate isolated filenames and metadata within narrow rows.
- Add Files documentation page through existing continuous layout and minimal inspector. Include nested project, application-owned sample string preview and empty state. Synchronize exports, metadata, generated source/prompts and portable source guidance.
- Verify focused behavior, complete Vitest suite including generated and relocated source compilation, build/lint/format; inspect local Chrome Arabic/English, both themes, desktop/320px, both densities/scales, keyboard, data changes and reduced motion. Independent review and re-review fixes. Keep the local preview running; commit only.

Review focus: collapse of a focused descendant; data removal/moves; intentional external blur; controlled callbacks without updates; names and metadata; current typeahead prefix; generated and source-only examples.
