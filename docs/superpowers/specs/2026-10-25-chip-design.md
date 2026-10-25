# Chip: filtering and category navigation

The user approved a reusable Chip and migration of the Components and Illustrations
category rows. Keep work local, preserve the Night loom landing, continuous docs,
and current preview server. Base: d496f85 in the woven checkout.

Chip is a controlled presentational choice: `selected?: boolean`,
`disabled?: boolean`, `size?: "sm" | "md"`, children and native attributes/ref.
Without `href` it is a native button (default type button, aria-pressed). With a
string href it is a native link (selected means aria-current=page). Discriminated
props retain the correct event/ref type. Disabled links lose href and tab access,
keep link semantics/aria-disabled, and suppress activation. No router dependency,
selection engine, internal live region, new CSS literal or new package dependency.
The host owns single/multiple selection and groups/names the choices.

Both modes share token-based rounded chip styles with visible selected, hover,
focus and disabled states; layout works in RTL/LTR, long labels, wrapping and
both themes. Use native keyboard behavior; filtering keeps focus on its chip.
Navigation preserves real URLs, modifier clicks, new tabs and history.

Replace gallery bespoke category link styles and Illustration Button filters
with Chip. Reuse the docs' route click handling without nesting interactive nodes.
Add a discoverable Chip page, bilingual working filter/navigation example,
controls for label/mode/selected/disabled/size, accurate generated code/prompt,
API metadata, source-install catalog and compiling source-owned examples.
Keep Badge for status, TagInput for editable tags, FilterBar for composition and
Tabs for panels; explain these distinctions in guidance.
