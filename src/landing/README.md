# Tiraz landing page

## Scope and design

Baseline: `e0fc39d7be1aed9c0723be415f3810e326003c5b` (fetched origin/main).
Branch: `codex/landing-page`. All page implementation, styling, tests and build configuration live here; `landing.html` is the only root addition. Shared components, tokens, dependencies, entry and workbench remain unchanged.

The supplied implementation brief is the specification: Arabic-first public introduction for application builders, restrained craft-inspired geometry, compact IBM Plex Sans Arabic typography, existing components and honest source-owned adoption guidance. Seven sections vary between split composition, a working dashboard, editorial columns, a curated component selection, numbered setup and an open-source close. Language changes direction together; one theme applies throughout.

Execution: inspect APIs and references → focused behavior tests → landing and decorative shader → existing checks and production multi-entry build → local browser matrix → independent source/render review → fixes/re-review → local commit and running preview.

## Run and build

From this checkout, `npm ci` then `npm run dev -- --host 127.0.0.1 --port 5237 --strictPort`. Open `/landing.html`. Use a free port and preserve other servers.

The default Vite build only emits index.html. Build the dedicated entry without editing shared Vite configuration:

```sh
npm run build -- --config src/landing/vite.config.ts
npm run preview -- --host 127.0.0.1 --port 5238 --strictPort
```

The landing-specific config extends the existing config with both HTML inputs. Both index.html (unchanged documentation/dashboard entry) and landing.html are emitted. `npm run build` itself remains unchanged and is checked separately. Run `npx prettier --check landing.html src/landing` in addition to the existing formatting command.

## Reference and shader decision

Inspected locally: https://formicai.dev/ and https://shaders.com/ (2026-10-15). The web text reader could not retrieve Formic; the local browser succeeded. Formic informed concise product explanation and working examples; no structure, copy or visual assets were copied.

Shader reference: https://github.com/shader-effects-inc/shaders at `81fd4ece5d493ca6c424a2af41f0e2c361ec8258`. Its LICENSE is MIT (2026 Shader Effects Inc.); README distinguishes package/engine MIT from separate platform/preset terms. React uses `shaders/react` with a Shader parent and layer children; current engine is WebGPU-only and bindings support React 18/19. Inspected package source did not contain automatic `prefers-reduced-motion` support; layer speed controls are not an automatic OS preference policy.

Decision: no third-party shader code, presets or dependency. An original small WebGL fragment shader enhances an inline static SVG. It is dynamically imported only when visible and motion is allowed, bounded to a four-second entrance, stopped when offscreen/hidden, and cleaned up on theme/preference change or unmount. Failed imports, unavailable WebGL, compile/link failure and context loss leave the static fallback visible. The canvas is decorative, aria-hidden and pointer-inert. No content depends on its loading or rendering.

## Deferred integration

Root remains the documentation entry. A later integration must explicitly choose the public documentation URL and route ownership, add landing to the default build inputs, and route `/` to landing while preserving documentation/dashboard routes. The workbench currently uses in-memory/persisted active component selection, with no URL component routing. Landing links target actual `index.html` anchors (`main-content`, `playground-heading`, `examples-heading`, `usage-heading`); source links point to implemented files. Component-specific documentation deep links require a shared routing change and are deliberately deferred. New component-library work must be integrated separately, followed by a fresh check against its APIs.

Sample order data lives only in page memory; period selection changes chart and total. No backend, persistence or actual export is implied. Existing system customization uses paired sage/plum accents in the example only. Page language/theme use landing-owned memory with Arabic/light defaults.

## Verification and screenshots

See [verification results](evidence/verification.md) and [independent review](evidence/review.md).

- [Arabic desktop, light](evidence/arabic-desktop-light-viewport.jpg)
- [English desktop, dark](evidence/english-desktop-dark-viewport.jpg)
- [Arabic mobile, light](evidence/arabic-mobile-light-viewport.jpg)
- [English mobile, dark](evidence/english-mobile-dark-viewport.jpg)
