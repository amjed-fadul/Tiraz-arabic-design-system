# Tiraz landing page

## Current approved direction

Refinement baseline: `450e776e2b04e3633aec5a1752dfcce1d46f0138` on
`codex/landing-page`. The user's woven-textile mockup supersedes the original
split hero. The original system baseline remains
`e0fc39d7be1aed9c0723be415f3810e326003c5b`.

A clean wide textile photograph fills the whole hero; all text, links and
controls are real HTML outside the canvas. The mockup screenshot is never used
as the image. The clean asset was unavailable, reported to the user, and a new
matching image was explicitly authorized. See [asset and exact generation
prompt](assets/README.md). Ivory fabric and a dark green woven band remain visible,
with quiet masks behind the copy and a stronger tablet crop mask. Navigation
overlays the same image, with a fading contrast veil and room above the hero copy
at mobile widths. Header branding remains the existing typographic wordmark.

Four hero swatches use Tiraz's actual sage, blue, plum and clay pairs through the
existing RadioGroup. Each has a 20px visible circle inside a 44px target, native
keyboard behavior, translated names, visible focus and a selected ring. One
selected-accent state and one SystemProvider configure the whole landing and live
composition. Theme changes remain a separate single preference. Neutral surfaces
and semantic success/error colors remain stable; period selection, input values
and other demo state survive color/theme/language changes. The live example's
separate color picker/provider have been removed.

## Image shader and reference research

Rechecked https://shaders.com/ and https://github.com/shader-effects-inc/shaders
on 2026-10-15. Repository HEAD was still
`81fd4ece5d493ca6c424a2af41f0e2c361ec8258`.
ImageTexture supports image URL and object-fit; DisplacementMap can use directional
or luminance displacement; LightEdge has a speed control; BlockDissolve uses stable
shuffled cells. Its engine/package source is MIT (2026 Shader Effects Inc.);
platform/editor/preset terms are separate. The web text reader could not retrieve
the specific image-texture documentation URL; repository source was inspected
directly. Automatic OS reduced-motion handling was not found in the inspected
package source.

Decision: extend the existing small original WebGL implementation; no shader
framework, package, preset, dependency or license attribution requirement added.
The photo itself is uploaded as a texture. One fragment pass combines tiny
thread-scale UV displacement, a slow directional light and restrained stable
cell dissolution at the lower-left edge. Vertex geometry never animates; there
are no pointer listeners or replayed entrances. Accent/theme changes update
uniforms on the same canvas and preserve its clock, crop and geometry.

The exact same image remains an ordinary HTML img below the optional lazy-loaded
canvas. Reduced motion removes the canvas and keeps that image. Visibility and
intersection changes pause/resume the same controller and clock; a user pause
button is available while the shader works. Context creation, image upload,
compile/link and context-loss failures preserve the image. GPU resources and
listeners are cleaned up; toggling OS reduced motion off can initialize the
shader again. Text and controls never enter the canvas.

## Brand concepts

[Brand preview](brand-preview.html) presents three original monochrome SVG symbols,
paired with the typographic طِراز / Tiraz wordmark, reversed samples, 16/24/32px
sizes and header examples. These are **concepts for selection**, not approved logos.
The landing header keeps its existing wordmark. Original SVG downloads:

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

Current refinement evidence lives in [evidence/refinement](evidence/refinement/).
The first implementation's evidence is retained in the parent evidence directory
as history. Tests for the actual accent state were written first and observed
failing against the old picker; then the shared state was implemented. Focused
checks, production rendering, independent review/re-review and one serial full
suite use the local Mac. The former timeout investigation and current final-run
results are recorded in the refinement verification report.

## Deferred integration

Only landing-owned files and the dedicated landing.html entry change. Shared
components/tokens, documentation, dashboard source, root routing and dependencies
stay untouched. A later integration must choose permanent documentation URL and
root ownership, add the entries to the default build, and preserve the dashboard.
The workbench still has no component-specific URL routing; existing documentation
anchors and actual component-source links remain. Source-owned adoption guidance
and in-memory sample data are unchanged. No push, merge, deploy or publication.
