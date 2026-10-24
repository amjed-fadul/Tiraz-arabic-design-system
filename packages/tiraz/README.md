# Tiraz · طِراز

Arabic-first React components, editable source and AI-ready guidance. MIT.
Requires Node >=22.12 and React/React DOM 19.

## Use the package

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

`styles.css` loads IBM Plex Sans Arabic, tokens and components. To use your own
font, import `@amjedfadul/tiraz/tokens.css` and `@amjedfadul/tiraz/components.css` separately. Preserve
`:dir()` in your CSS target: Chrome/Edge 120+, Firefox 114+, Safari 16.4+.

## Updating to 0.1.2

This patch removes the upward text offset in buttons, badges, tabs, inputs,
selects, menu items, sidebar labels and tags. Text uses the controls' normal
alignment in Arabic and English. Component APIs are unchanged.

```sh
npm install @amjedfadul/tiraz@0.1.2
```

If you copied the source, compare this package's
`source/system/components.css` with your copy and remove the old
`--optical-lift` overrides, preserving your own changes. Updating the npm
dependency does not change copied source; the installer never overwrites it.

## Own the source

```sh
npx @amjedfadul/tiraz init --new my-app
cd my-app
npm run dev
```

Inside an existing **Vite React TypeScript** application:

```sh
npx @amjedfadul/tiraz init
```

The installer copies the complete library to `src/system`, optional Khayt
runtime to `src/mascot`, retains assets/licenses and adds an `AGENTS.md` pointer.
It preserves routes, entry files, scripts and existing dependency versions.
It refuses existing source folders; there is no overwrite flag. Other React bundlers can use the compiled package imports above. Read
`TIRAZ_SETUP.md` for the entry imports. `--no-install` prepares files without
running npm. Review compatibility if your existing app uses React before 19.

## Verify and customize editable source

```sh
npx @amjedfadul/tiraz init --dir src/ui
npx @amjedfadul/tiraz verify
```

`--dir` chooses the parent of `system` and `mascot`. The installer writes
`tiraz.project.json` with real entry, stylesheet, guidance and knowledge paths,
plus SHA-256 hashes. `verify` reports missing or modified files without changing
them; your intentional edits are reported too. Keep that baseline for upgrades.
It is a local change check, not a signature or proof of remote provenance.

The generated knowledge bundle describes the current public TypeScript APIs
and CSS tokens. Start with `ai/generated/manifest.json`, then read only the
needed API file. Source and exported types remain authoritative.

## Business patterns

`CustomerEditSheet`, `PreferenceSettings` and `InvoiceActions` compose the
shared controls for common application workflows. They are exported from the
package root and from editable source. Pass translated labels and async
callbacks; use the callback's `AbortSignal` to cancel pending work. Destructive
invoice actions require confirmation copy. See
`source/system/patterns/README.md` and its compiling example for the full APIs.
A cancelled UI cannot undo a write your server already accepted.

## Optional Khayt avatar

```tsx
import "@amjedfadul/tiraz/mascot.css";
import { Khayt } from "@amjedfadul/tiraz/mascot";

const agentPresentation = {
  avatar: <Khayt state="working" color="#946D91" size={48} animated />,
  color: "#946D91",
};
```

Pass this through a supported component's `agentPresentation` prop. Map the real
task state to `idle`, `thinking`, `working`, `waiting`, `done` or `blocked`.
The avatar is decorative; keep visible names and status text. Reduced motion is
respected by the runtime.

### Updating to 0.1.1

The `working` state now uses the Mini weaving loop: Khayt feeds cotton across
a small weave, follows it with his eyes, and gently tightens each pass. Agent
colors, pause behavior and reduced motion still work with the same props.

For package imports, run `npm install @amjedfadul/tiraz@latest`. If you copied
the source, compare and port `source/mascot/khayt-motion.ts` and
`source/mascot/khayt-renderer.ts` from this package into your mascot directory,
preserving your own changes. The installer does not overwrite existing source.

The complete AI guide and registry are included at
`node_modules/@amjedfadul/tiraz/source/system/ai/README.md` and `registry.json`. Query only
the component you need, then check its source and exported types. The library
has no backend or model credentials; example actions are local demonstrations.

[Website and examples](https://tiraz.dev) ·
[Source](https://github.com/amjed-fadul/Tiraz-arabic-design-system)
