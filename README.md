# طِراز · Tiraz

An Arabic-first, MIT-licensed React design system with 79 component families,
AI interaction patterns, example business screens and the Khayt agent mascot.
Arabic RTL and English LTR, light/dark themes and reduced motion are supported.

[Website](https://tiraz.dev) · [Library](https://tiraz.dev/library) ·
[Get started](https://tiraz.dev/start)

## Install

Use Node.js **22.12 or newer** and React **19**.

```sh
npm install @amjedfadul/tiraz
```

```tsx
import "@amjedfadul/tiraz/styles.css";
import { Button, SystemProvider, defaultConfig } from "@amjedfadul/tiraz";

export function App() {
  return (
    <div lang="ar" dir="rtl">
      <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
        <Button>ابدأ الآن</Button>
      </SystemProvider>
    </div>
  );
}
```

The stylesheet includes IBM Plex Sans Arabic, tokens and component styles.
The package also includes TypeScript declarations, editable source, AI guidance
and optional `@amjedfadul/tiraz/mascot` / `@amjedfadul/tiraz/mascot.css` exports.

## Own the source

Create a new Vite React TypeScript application:

```sh
npx @amjedfadul/tiraz init --new my-app
cd my-app
npm run dev
```

Inside an existing Vite React TypeScript application, run `npx @amjedfadul/tiraz init`. The installer copies
`src/system` and `src/mascot`, retains licenses/assets, adds an additive
`AGENTS.md` pointer, and preserves routes, entry files and dependency versions.
It refuses existing source directories. `--no-install` skips npm installation.
Read the generated `TIRAZ_SETUP.md` for existing-entry setup. Add
`--dir src/ui` to choose a source parent. `tiraz.project.json` records the actual
paths and file hashes; `npx @amjedfadul/tiraz verify` reports missing or modified
source without changing it.

Before building a screen with a coding agent, follow `tiraz.project.json` to the
guide (default `src/system/ai/README.md`)
and query the bundled registry for the component needed. With package imports,
that guide is at `node_modules/@amjedfadul/tiraz/source/system/ai/README.md`.
Generated TypeScript contracts and CSS token facts are indexed by
`ai/generated/manifest.json`. Component source and exported types are authoritative.

The package also exports `CustomerEditSheet`, `PreferenceSettings` and
`InvoiceActions`, with translated labels, cancellation signals and confirmation
for destructive actions. See `src/system/patterns/README.md`.

For an existing shadcn workflow, the optional source registry is
`https://tiraz.dev/r/tiraz-system.json`. It installs the same Tiraz library under
`src/tiraz` and writes `tiraz.project.json`; Tiraz's own installer remains the
primary quick start. The hosted AI entry point is `https://tiraz.dev/llms.txt`.

This checkout also includes an **unreleased local preview** of individual component
installation and a user-owned theme. Build the package locally, then use its CLI
`add button input badge` from a Vite React 19 TypeScript app. See the
[selective installation guide](packages/tiraz/README.md#select-individual-components-local-preview-not-yet-published)
for exact local commands, customization and preservation rules. The published
`0.1.2` CLI and full-system shadcn registry keep their current installation path.

## Develop this repository

The repository root is a private website/test workspace. The public npm
manifest lives in `packages/tiraz`; its payload is generated from the same
component and mascot source used by the website.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5411 --strictPort
npm test -- --maxWorkers=2
npm run lint
npm run build
npm run format:check
npm run pack:package
```

The build serves the landing as `index.html` and keeps the docs entry at
`workbench.html`. `vercel.json` routes library/start/illustration/example deep
links to that workbench entry. All example data and actions are local demonstrations; no
backend or model credentials are required.

Use browser evidence scripts only when deliberately refreshing tracked
screenshots. For checks, use throwaway scripts outside the repository.
See [release branch/worktree audit](docs/release/worktree-audit.md) and
[release plan](docs/superpowers/plans/2026-10-22-public-release.md).
