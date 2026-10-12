# Tiraz milestone 1

The supplied brief is the specification. Build an Arabic-first, source-owned design system for business dashboards, with six components and a local interactive workbench. The empty workspace uses React, TypeScript, Vite, Tailwind v4 and locally bundled IBM Plex Sans Arabic. No publishing, deployments, pushes or merges.

## Structure and decisions

- `src/system/`: typed configuration, provider, semantic CSS tokens, six component modules and public barrel. Radix primitives supply tested interaction foundations. Components accept caller copy and consume shared tokens; workbench copy stays in `src/workbench/`.
- `src/workbench/`: Arabic component catalog, live demos, copyable snippets, appearance inspector, preference persistence and reset. Right navigation, central preview, left inspector in RTL; logical grid order mirrors in LTR. Narrow screens collapse navigation to a horizontal strip and appearance controls to a modal Sheet.
- Accent presets use accessible light/dark pairs. Density and corner radius flow through the same typed config. Motion preview can reduce motion but never override an OS request to reduce it.
- Sheets default to the physical right in RTL and left in LTR. Directional arrows mirror; emails, code and identifiers use isolated LTR spans. Whole-label state changes preserve connected Arabic letterforms.

## Execution

1. [x] Foundations: scaffold, dependencies, configuration, local font, neutral tokens and sage accents. Test preference recovery from invalid storage before implementing persistence.
2. [x] Components: Button state/variant APIs; Tabs indicator and direction-aware keyboard behavior; Switch; anchored Dropdown; Sheet dismissal/focus trapping/restoration; Toast announcements/dismissal. Write focused integration tests before implementation, observe red, implement, then observe green.
3. [x] Workbench: all six demos, live simulated save with selectable outcome, controls, source snippets and responsive layout. Verify preferences persist and reset, async states and navigation in integration tests.
4. [x] Verification: full test suite, TypeScript/build, lint; real-browser inspection across light/dark, RTL/LTR, narrow screens and reduced motion. Check focus restoration, keyboard navigation and automated accessibility. Fix observed defects, retain screenshots and README.

## Review focus

- Corrupt or outdated local storage must recover safely; valid settings should persist.
- Disabled/loading controls must prevent duplicate actions.
- Menu/Sheet dismissal must restore focus; Sheet tabbing must remain in the dialog.
- RTL arrows and mixed-script identifiers must remain legible in both directions.
- Reduced motion, mobile overflow, high contrast and long Arabic labels must remain usable.

## Progress

Repository inspection: empty; no applicable AGENTS.md found in ancestor chain. Public reference text accessible for BoardUI, Transitions and beUI; FormicAI web reader failed. Work is local only, no Git repository to isolate or integrate.

Independent review found and resolved duplicate mobile slider IDs, hidden mobile reset, and outer RTL overriding a nested LTR Switch. Browser QA also resolved feedback-button hover colors, disabled metadata contrast, accented navigation metadata contrast, and keyboard access to overflowed code/API regions. Sheet save/cancel and initially disabled Tabs received regression tests.
