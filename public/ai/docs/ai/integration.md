# Integrating Tiraz

Start with `tiraz.project.json` in the consumer project. Its `entry`, `styles`, `patternsEntry`, `knowledge` and `docs` paths are relative to that manifest's directory. Resolve imports relative to the file being edited (or through the consumer's configured aliases). Do not assume a `./system` import or the original Tiraz checkout.

## Source installation

From a Tiraz checkout, run `node scripts/install.mjs /absolute/path/to/consumer [src/tiraz]`. The target project must exist. The optional destination is relative to it. Installation refuses existing targets and manifests; it does not install packages or edit your application/package.json. It prints required dependencies and writes a manifest with hashes. Review the changes and install the listed dependencies using your project's package manager. Keep your existing React 19 installation compatible.

Import the manifest's `styles` once at the client entry. This loads local IBM Plex Sans Arabic 400/500/600, semantic tokens, component styles, and pattern styles. No Tailwind setup is needed by copied Tiraz runtime code.

Import `SystemProvider` and `defaultConfig` from the manifest's `entry`. Wrap the application (or the desired scoped subtree) once:

```tsx
<SystemProvider config={{ ...defaultConfig, direction: "rtl", theme: "light" }}>
  {children}
</SystemProvider>
```

For notifications, place `ToastProvider` inside SystemProvider and above components calling `useToast()`. Supply translated `label` and `closeLabel`. Reuse existing providers; a new provider around each generated control can change scoping and state.

The example module is available at the manifest's `examples` path. It demonstrates all six components, nested overlays, mixed-direction content, and notifications without importing the workbench. Business actions in examples only demonstrate event wiring; connect production callbacks to your application.

## Supported environment

React 19, TypeScript, browser-based Vite. SSR/Next.js and other environments require their own integration tests; they are not claimed supported here. Node 24.15 or newer is required for the repository toolchain. The runtime itself runs in the browser.

## Updates

Keep the installed manifest with copied source. `node scripts/install.mjs --verify /absolute/path/to/consumer` checks each installed file against recorded hashes and reports modifications/missing files. Install a newer revision into a separate directory or disposable project and review a diff. Do not overwrite local customizations automatically. Hashes detect changes, not trustworthiness of a remote source.

## Registry

`npm run registry:build` writes `public/r/registry.json` and `public/r/tiraz-system.json`. The single source item contains the complete system, examples, patterns, docs, and dependency list. It targets `src/tiraz` and `tiraz.project.json`; use the local installer for another directory. The registry is prepared locally; no public URL is implied. Publish those generated files at an actual chosen host before configuring a remote namespace. Never invent a registry URL.
