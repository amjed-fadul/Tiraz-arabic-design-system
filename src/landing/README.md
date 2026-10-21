# Tiraz landing page

## Current approved direction: Night loom

The landing tells one story: **a thread becomes a fabric, and a fabric becomes an
interface.** Weaving and interface design share a structure: a grid, written
rules and small parts that form a coherent whole. Each visual shows one step.
Approved on 2026-10-15 from a standalone preview; built on
`claude/landing-night-loom`, branched from `codex/landing-page` at `9881dbc`.

- **Hero loom (WebGL).** Ivory warp threads string outward, then a weft thread
  weaves a band row by row from the right, the direction Arabic is read. The band
  carries طِراز as a woven inscription, rendered from the page font and snapped to
  the weave grid (`loom/weave-mask.ts`), as historical tiraz bands carried woven
  inscriptions. The cloth ripples gently, warp threads part around the pointer and
  the accent picker recolors the border and shuttle. Light theme is a "day loom":
  ivory band, ink inscription.
- **From thread to interface.** The real live example rises out of a tilt as the
  page scrolls and the hero recedes.
- **Component strip.** A selection of foundational component families drifts in
  two rows; one accessible list carries the names once. The complete library now
  contains 78 families; see [the source guide](../system/ai/README.md).
- **Why Tiraz.** The pinned three-chapter story keeps its scroll logic. Its images
  are woven in: rows enter from the right edge, bottom row first (`weft-clip.ts`).
  Images and their meaning are documented in
  [assets/loom/README.md](assets/loom/README.md).
- **Component gallery.** Real Tiraz components (Input, Button, OTPInput, Badge,
  Progress, DatePicker, Switch, Slider, BarChart, Alert) in one SystemProvider,
  with a pointer-following border light.
- **Start and closing.** The shared quick-start guide with copyable setup, then the
  finished-band image under a giant طِراز wordmark.

Dark is the default for visitors without a saved theme. Language and theme share
the workbench's stored preferences so moving between the landing and library
keeps both choices. Accent remains a single page-wide preference, and demo state
survives preference changes.

## Motion and fallbacks

`loom/loom-renderer.ts` is plain WebGL with one full-screen fragment shader; no
3D or shader library. `loom/Loom.tsx` lazy-loads it and keeps a static CSS band
for no WebGL, startup and context loss. It pauses off-screen and in hidden tabs,
and offers a pause button. Reduced motion draws one finished frame, removes the
pause button, keeps native scrolling and shows every section without reveals.
`motion.ts` writes scroll progress to CSS custom properties from one throttled
listener, and adds Lenis inertial scrolling (pinned `1.3.26`) for fine pointers only.
In development, `landing.html?loom=8` starts the loom eight seconds into its
timeline, which helps when inspecting the finished weave; production builds strip it.

## Typography: Thmanyah

Headlines use Thmanyah Serif Display and body text Thmanyah Sans. The page sets
the system `--font` token, so the showcased components render in it too; Tiraz
itself still ships with IBM Plex Sans Arabic. The page no longer states this
next to the gallery, so this README is the reference for the font setup.

The Thmanyah license permits use in websites, but forbids hosting the font files,
making them downloadable or letting visitors extract them, including through web
embedding. `fonts.css` therefore resolves the faces only with `local()`: the font
renders where it is installed on the viewer's device and nothing is served. Other
visitors see IBM Plex Sans Arabic. To show Thmanyah to every visitor, obtain
written permission from Thmanyah (ask@thmanyah.com) before adding font files.
Never commit Thmanyah font files to this repository.

## Brand

The user selected **01 — Warp**, an original monochrome symbol. The landing
header and footer pair it with the typographic طِراز / Tiraz wordmark. The inline
SVG lives in `ComponentMarquee.tsx`. Earlier brand concepts remain in the source
landing worktree and are not part of this site.

## Run and build

Use the existing dependencies with Node 24 (the project requires Node >=22.12).
The entries share the existing development server on port 5411:

```sh
npm run dev -- --host 127.0.0.1 --port 5411 --strictPort
npm run build
```

Open `/landing.html` for the landing or `/library` for the workbench. Local `/`
still opens the workbench. The root Vite config emits `index.html` and
`landing.html`, preserving the library's CSS browser targets and Vitest settings.
Use the already-running server rather than starting another one.

The checked-in `vercel.json` prepares static routing: `/` serves the landing;
`/library`, `/start`, `/illustrations`, `/examples` and legacy `/docs` deep links
serve the app entry. Static assets keep their own paths. This configuration does
not deploy the site or change provider/domain settings.

## Verification

Focused coverage lives in `loom/*.test.ts(x)`, `Landing.test.tsx` and
`WhyTiraz.test.tsx`. Run `npm test -- src/landing` and `npx tsc -b`, then the
repository checks and browser review for a complete integration verification.
The source worktree retains its earlier screenshots, recordings and verification
history; those large evidence files are not copied into the integrated site.

## Integration

This subtree was copied from the current working source in
`claude/landing-night-loom`, including its uncommitted visual refinements. The
original worktree remains untouched. Component gallery links open actual library
pages, the dashboard opens `/examples/dashboard`, and the setup section uses
`../workbench/QuickStart` so its guidance stays shared with `/start`.
Original image provenance and prompts remain in
[assets/loom/README.md](assets/loom/README.md); assets use this project's license.
