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
- **Component strip.** All 41 families drift in two rows; one accessible list
  carries the names once.
- **Why Tiraz.** The pinned three-chapter story keeps its scroll logic. Its images
  are woven in: rows enter from the right edge, bottom row first (`weft-clip.ts`).
  Images and their meaning are documented in
  [assets/loom/README.md](assets/loom/README.md).
- **Component gallery.** Real Tiraz components (Input, Button, OTPInput, Badge,
  Progress, DatePicker, Switch, Slider, BarChart, Alert) in one SystemProvider,
  with a pointer-following border light.
- **Start and closing.** The adoption steps beside a real snippet, then the
  finished-band image under a giant طِراز wordmark.

Dark is the default theme. Language, theme and accent remain single page-wide
preferences, and demo state survives their changes.

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
itself still ships with IBM Plex Sans Arabic, as the gallery note states.

The Thmanyah license permits use in websites, but forbids hosting the font files,
making them downloadable or letting visitors extract them, including through web
embedding. `fonts.css` therefore resolves the faces only with `local()`: the font
renders where it is installed on the viewer's device and nothing is served. Other
visitors see IBM Plex Sans Arabic. To show Thmanyah to every visitor, obtain
written permission from Thmanyah (ask@thmanyah.com) before adding font files.
Never commit Thmanyah font files to this repository.

## Brand concepts

[Brand preview](brand-preview.html) presents three original monochrome SVG symbols,
paired with the typographic طِراز / Tiraz wordmark, reversed samples, 16/24/32px
sizes and header examples. The user selected **01 — Warp**; the landing header
and footer pair it with the existing wordmark. The preview marks it selected and
retains the other two concepts for comparison. Original SVG downloads:

- [01 — السدى / Warp](brand/assets/01-warp.svg)
- [02 — العبور / Crossing](brand/assets/02-crossing.svg)
- [03 — النول / Loom](brand/assets/03-loom.svg)

## Run and build

Use the existing dependencies with Node 24 (the project requires Node >=22.12).
The dedicated entries work through the existing dev server:

```sh
npm run dev -- --host 127.0.0.1 --port 5237 --strictPort
npm run build -- --config src/landing/vite.config.ts
npm run preview -- --host 127.0.0.1 --port 5238 --strictPort
```

Open `/landing.html` and `/src/landing/brand-preview.html` on either server.
The landing-owned build config extends the existing config to emit the unchanged
documentation entry plus both landing entries. Default build/routing are untouched.
Use a free port when these are occupied; preserve unrelated servers, including 5227.

## Verification

The Night loom changes are covered by `loom/*.test.ts(x)`, `Landing.test.tsx` and
`WhyTiraz.test.tsx`, plus the full suite, lint, formatting and both builds. Axe
reported no violations in Arabic and English, dark and light, in the browser.
Everything below describes earlier iterations and is kept as history.

Earlier motion/story evidence lives in [evidence/motion-story](evidence/motion-story/),
including before/after screenshots, frame/time diagnostics, regression tests,
independent review and a 16.5-second actual compositor recording. The recording
preserves real capture timestamps, with static frame holds and no interpolated
motion. Earlier refinement evidence lives in [evidence/refinement](evidence/refinement/).
The first implementation's evidence is retained in the parent evidence directory
as history. Tests for the actual accent state were written first and observed
failing against the old picker; then the shared state was implemented. Focused
checks, production rendering, independent review/re-review and one serial full
suite use the local Mac. The former timeout investigation and current final-run
results are recorded in the refinement verification report.

## Deferred integration

Only landing-owned files change, plus the `lenis` dependency. Shared
components/tokens, documentation, dashboard source and root routing stay
untouched. A later integration must choose permanent documentation URL and
root ownership, add the entries to the default build, and preserve the dashboard.
The workbench still has no component-specific URL routing; existing documentation
anchors and actual component-source links remain. Source-owned adoption guidance
and in-memory sample data are unchanged. No push, merge, deploy or publication.
