# Landing layout review — 23 October 2026

Reviewed the approved Night loom landing in Arabic and English: header and
hero, screen previews, Why Tiraz, component examples, installation, closing
section and footer. The shared Start here guide and example-screen branding
were checked alongside the landing.

## Changes

- Keep the Arabic wordmark in the landing, workbench and example screens;
  remove the English logo text.
- Correct the shared Tabs indicator measurement. Viewport rectangles included
  the landing preview's entrance transform, so the underline saved a scaled
  position and width. Layout coordinates keep it aligned during animation.
- Give component headings 40px separation on desktop and 32px on phones;
  place the library link below the heading on narrow screens. Reduce excessive
  section spacing without changing the approved page structure.
- Remove text overlays and mobile captions from the Why Tiraz images; retain
  descriptive image alternatives and the adjacent explanatory copy.
- Simplify installation to one header containing project choices and an
  icon-only Copy control, followed by the command. Move explanatory notes
  below the box and keep command lines intact with internal scrolling.
- Fit the installation controls at 320px. Previously focusing Copy scrolled
  the clipped toolbar horizontally; the compact spacing keeps it stationary.
- Shorten the hero and demo copy, distinguish sample interactions from live
  services, and separate installation prerequisites from introductory copy.
- Offset anchor navigation by the actual sticky-header height so headings
  remain visible after navigation.

## Local verification

Checkout: `/Users/amjedfadul/Tiraz-worktrees/woven`, `claude/woven`.

- `npm test -- --maxWorkers=4`: 1,896 tests in 151 files passed. After the
  final compact-toolbar, copy and branding refinements, the focused QuickStart,
  anchor navigation and ScreenFrame suites passed again: 19 tests.
- `npm run build`, `npm run lint`, `npm run format:check`,
  `npm run knowledge:check` and `npm run registry:check` passed; zero lint warnings.
- CSS audit returned `[]`.
- Production-build Chrome checks passed for Arabic/English at 320, 390, 768
  and 1440px across light/dark themes: exact clipboard contents, stable Copy
  position, heading separation, tab geometry and keyboard navigation, visible
  anchor targets, reduced-motion images, no page overflow or JavaScript errors.
- Four additional Start here and screen-brand checks passed at 320/1440px
  in both languages. Screenshots were visually inspected.
- Axe reported no WCAG A/AA violations in all four language/theme combinations
  on the landing outside embedded example frames.

Browser scripts, logs and screenshots are in `/tmp/tiraz-landing-audit/`.
The existing large-bundle build advisory remains. Safari, Firefox, physical
devices and manual screen-reader sessions were not tested in this review.
The published npm version remains 0.1.0; this update does not republish it.
