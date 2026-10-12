# Documentation workbench update

Historical plan: inspector placement and independent themes were superseded by the compact workbench update in README.md.

Specification: user brief in the attached Pasted text. Existing component behavior is retained; landing-page work remains paused. No push, merge, publish or deploy.

1. Separate persisted documentation appearance/language/UI, typed component configuration, and per-component playground models. Add an optional typography scale without breaking existing configuration consumers. Default Button size to sm and system density to compact; retain md and normal density.
2. Define a model/inspector field catalog from the actual TypeScript APIs. Cover explicit props, ReactNode/collection presets, native attribute/style editors for Button and Switch, callback behavior and non-editable refs/DOM details. Scoped provider overrides are identified separately from component props. Generate usage code and an agent prompt from the same model used to render each playground.
3. Build a quiet continuous component page: title, agent prompt, one live playground, examples, generated usage and API disclosure. Compact 190px navigation with an independent collapsible contextual inspector. A borderless floating system panel uses reserved space; drawers replace side panels at narrow widths.
4. Verify source behavior with focused tests, full existing checks, generated-code TypeScript compilation, browser interaction on every control and all six pages, independent themes and preview portals, locale/direction switching, small screens and reduced motion. Run an independent review, fix findings and request review of the fixes. Save new screenshots and verification record.

Key boundaries: the shell uses a fixed documentation SystemProvider. Every preview and example group gets its own nested SystemProvider and portal container. Only document theme/language update the document element; component settings cannot restyle the shell. Per-page props persist across navigation and reload. Resets target only their own state layer. Native attribute editors accept only supported DOM attributes, and structured collection edits validate before applying.
