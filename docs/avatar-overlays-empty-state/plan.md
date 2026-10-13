# Avatar, overlays and empty states

User brief: implement this bounded component batch at d28bea820bb6f1c64e86c1738ab9876013b26d30. Work locally in an isolated checkout; preserve original edits/servers; commit only after verification. No publishing or next batch.

- [x] Pin behavior with focused tests: source failure/replacement and accessible Avatar naming; group limits and translated hidden members; tooltip hover/focus/Escape/ref/description/portal; dialog naming, containment, dismissal/restoration and nested overlays; decorative illustration slots.
- [x] Add five small component APIs and three original inline SVG exports. Reuse Radix Dialog and the already installed Radix Popper positioning primitive. Use shared tokens and logical CSS; compact defaults and inherited reduced motion.
- [x] Add five continuous documentation pages, minimal inspectors, complete generated examples and prompts, API tables, source-relative registry and portable guidance. Keep examples focused and application actions connected without persistence.
- [x] Run focused tests, generated/relocated compilation, full tests, build/lint/format; inspect Mac Chrome across locale/theme/density/text/viewport/motion/customization and interactions; capture evidence.
- [x] Request independent review; fix confirmed findings, re-review, rerun affected checks. Commit locally, verify preview response and original checkout/index preservation, return tested SHA and evidence.

Chosen interfaces: Avatar(name, src?, fallback?, size='sm', decorative?); AvatarGroup(members[{id,name,src?,fallback?}], label, overflowLabel(count), maxVisible=4, size='sm'); Tooltip(trigger, content:string, delayDuration=500); Modal follows Sheet's trigger/title/description/closeLabel/children/footer?/open?/onOpenChange? with optional initialFocusRef; EmptyState(title, description?, illustration?, action?). Illustrations: NoRecordsIllustration, NoSearchResultsIllustration, GettingStartedIllustration. No other workflow or manager.
