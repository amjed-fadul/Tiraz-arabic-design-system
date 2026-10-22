# Sidebar interaction correction — 22 October 2026

The previous sidebar derived its only expanded section from the current route. Selecting a section both navigated and removed the previous list. In a desktop reproduction (Forms to Files), the Files heading moved upward by 98 px and sidebar scrollTop changed from 639 to 111. Repeating that exact sequence after the fix moved the heading by 0 px and preserved scrollTop at 671.

The [affectUI Button page](https://www.affectui.com/components/button) was inspected live. Its gallery titles navigate, while separate disclosure controls expand and collapse independently. Tiraz now follows that distinction while preserving its text-only menu items, section ordering, typography, and RTL layout.

## Result

- Section titles open their gallery. Adjacent Phosphor chevrons expand or collapse that section without navigating, closing another section, or moving focus.
- Open sections remain open while browsing, switching language, hiding/showing the sidebar, or reopening the mobile drawer. Navigation opens the destination section without resetting the other choices. A fresh page load starts with the current page's section open.
- The list expands over the existing 200 ms motion token and collapses over 150 ms. System reduced motion removes those transitions. Hidden descendants become inert and leave the accessibility tree immediately, including during collapse.
- The desktop and mobile scroll areas contain scrolling and do not anchor themselves to content that moves when a section opens. The clicked lower heading and scroll position stayed unchanged in all six browser cases.
- The disclosure has a 40 px desktop target and a 44 px touch target, a localized accessible name, stable aria-controls, and an expanded state. The title and disclosure have separate focus targets.
- Navigation rendering is extracted from Workbench into ComponentNavigation; open-section state is shared by desktop and mobile navigation.

## Verification

Baseline: `8fd1dc3`, checkout `/Users/amjedfadul/Tiraz-worktrees/woven`, branch `claude/woven`.

- Regression tests were observed failing before the implementation. Focused navigation and surrounding workbench tests pass.
- Six browser configurations: English/light 1440, Arabic/dark 1440, English/dark 1024 with reduced motion, Arabic/light 390 touch, English/dark 390 touch, and Arabic/dark 320 touch with reduced motion.
- Each checks independent sections, unchanged URL/focus on disclosure, stable lower-section position, gallery navigation, collapsed content, illustrations, overflow, runtime errors, and axe WCAG A/AA checks. All passed; measured heading and scroll movement on expansion were 0 px.
- Focus-ring clearance is verified in both directions: the full 4 px outline and offset fit inside the animated clip.
- Additional browser checks pass for rapid reversals, immediate inertness, Tab traversal, Back/Forward, language switching, whole-sidebar hide/show, and zero-duration transitions under reduced motion.
- `npm run lint -- --max-warnings 0`, `npm run build`, and `npm run format:check` pass. The system/screen, documentation, and sidebar CSS audits return `[]`; `git diff --check` passes.
- Full `npm test -- --maxWorkers=2`: 140 files / 1,782 tests; 1,781 passed, with one unrelated timing failure in `src/system/avatar-overlays-empty-state.test.tsx` (the hover test checks for no tooltip after awaiting a hover with a real 40 ms delay). The required isolated rerun, `npm test -- src/system/avatar-overlays-empty-state.test.tsx --maxWorkers=1`, passed all 22 tests. Tooltip source and tests were not changed. All sidebar tests passed in the full run.
- Verification used Node 24.21.0. These results apply to the code in the commit containing this report.
- The same independent expansion was verified directly in the in-app browser. Both local preview servers respond with HTTP 200 (5411 and 5243) and remain running.

Throwaway browser scripts and measurements are under `/tmp/tiraz-sidebar-20261022`. No tracked browser scripts were run. Chrome desktop and touch emulation were used; physical-device and manual screen-reader testing were not performed. Build retains the existing large-chunk warning.

## Visual evidence

[In-app browser](2026-10-22-sidebar-interactions/in-app-ar.png) · [Arabic desktop](2026-10-22-sidebar-interactions/after-ar.png) · [English desktop](2026-10-22-sidebar-interactions/after-en.png) · [Arabic mobile](2026-10-22-sidebar-interactions/mobile-ar.png)
