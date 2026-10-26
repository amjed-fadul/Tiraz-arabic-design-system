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

## Provider root props (local preview, not yet published)

`SystemProvider` accepts optional `className`, `style` and `lang` props on its
existing `.tiraz-system` root. Use them to embed Tiraz in a dashboard, size a
full-height application or identify a multilingual section. No extra wrapper is
added, and existing calls without these props keep their defaults.

```tsx
<SystemProvider
  config={{ ...defaultConfig, direction: "rtl" }}
  lang="ar"
  className="dashboard-root"
  style={{ minHeight: "100dvh", width: "100%" }}
>
  <Button>ابدأ الآن</Button>
</SystemProvider>
```

`lang` identifies the content language; it does not translate content or change
`config.direction`. Omit it to inherit the document or parent language.
`className` is added alongside `tiraz-system`. Layout styles are merged into the
root, but `config` retains ownership of `--action`, `--radius` and `colorScheme`.
Use the supported `--tiraz-action` and `--tiraz-radius` CSS hooks for theme
overrides. `SystemProviderProps` is exported for typed integrations.

This local `0.1.3-preview.0` prerelease has not been published to npm. Package updates do not
rewrite copied source; source owners can review and incorporate the provider
change separately.

Maintainers can verify a built archive without publishing it:

```sh
npm run pack:package
npm run verify:package -- ./amjedfadul-tiraz-0.1.3-preview.0.tgz
```

The verifier installs the archive into a temporary app, checks its public types,
builds its styles/fonts and components with Vite, and checks the compiled runtime.
It uses the repository's installed React/TypeScript/Vite versions and requires
registry access for dependencies. Add `--keep` to retain the app for browser review.

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
dependency does not change copied source. The published installer leaves existing
source untouched; the local update workflow below handles reviewed source changes.

## Own the source

### Select individual components (local preview, not yet published)

This checkout adds selective installation. Build it with `npm run build:package`
in the Tiraz repository, then run its CLI from an existing Vite React 19
TypeScript app:

```sh
node /path/to/Tiraz/packages/tiraz/bin/tiraz.mjs add button input badge
node /path/to/Tiraz/packages/tiraz/bin/tiraz.mjs add --list
```

The published `0.1.2` CLI does not have `add` or `update` yet. This local feature does not
publish or upgrade a package. `--no-install` skips npm installation and `--dir
src/ui` chooses the source parent. Later additions use the recorded directory.

Only selected components, their source dependencies, required CSS and shared
foundations are copied. Related exports in a shared source module arrive together
(for example the four chart types). A button does not install chart, Markdown,
date-picker or mascot dependencies. Existing routes, entry files, scripts and
compatible dependency versions stay intact.

For the default directory, add these imports to your application's entry:

```tsx
import "./system/styles.css";
import { Button, SystemProvider, defaultConfig } from "./system";
```

Wrap the app in `SystemProvider` as in the package example above. The stylesheet
loads the font, default tokens, selected component styles, then your theme.
`TIRAZ_SETUP.md` records your actual paths. Keep the same CLI release for later
additions; `add` refuses to mix versions and does not update installed source.

### Your theme (local preview)

The local installer creates `src/tiraz.theme.css` next to `system` (or inside your
custom source parent). **This file belongs to your application.** Adding components
preserves it byte for byte; intentional theme edits are excluded from `verify`.
The complete-source installer also creates it and imports it in new starters.
Existing apps should import it after the default styles.

```css
.tiraz-system {
  --tiraz-radius: 12px;
  --font: "IBM Plex Sans Arabic", system-ui, sans-serif;
}

.tiraz-system[data-theme="light"] {
  --tiraz-action: #365b87;
  --action-text: #ffffff;
}

.tiraz-system[data-theme="dark"] {
  --tiraz-action: #a8c6ef;
  --action-text: #17241c;
}
```

Use `--tiraz-action` and `--tiraz-radius` to override the provider's chosen presets
without `!important`. Other semantic tokens, including surfaces and text, can be
overridden normally. Load any custom font yourself. Check contrast, wrapping and
keyboard focus in Arabic/English and both themes after customization.

Component source remains editable. Add preserves those edits and their original
verification baseline. `index.ts`, `components.css`, `styles.css` and the small
installed-subset guidance are CLI-managed assembly files. If you edit them, add
stops before writing anything; preserve and reconcile your changes first. It also
stops on missing tracked files, untracked file collisions and symlinked paths.
Keep routine styling changes in your theme to make further additions easy.

### Install the complete source

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

## Update copied components (local preview, not yet published)

Use the CLI from the **target release** while inside your application. For this
unreleased milestone, build Tiraz locally and use its absolute CLI path:

```sh
node /path/to/Tiraz/packages/tiraz/bin/tiraz.mjs update
node /path/to/Tiraz/packages/tiraz/bin/tiraz.mjs update --prepare
node /path/to/Tiraz/packages/tiraz/bin/tiraz.mjs update --apply
```

`update` only previews. It performs no network requests or npm installation.
The update covers your entire installed selection and its shared dependencies,
or the full bundle if you used `init`. It leaves your theme, application entry
files, routes, `AGENTS.md` and setup guide alone. Dependency additions are shown;
incompatible existing ranges stop the update before any application writes.

New installs save original bytes in `.tiraz/baseline.json`. Keep that file with
`tiraz.project.json` in version control. Updates compare the original, your local
copy and the incoming release. Upstream-only changes update automatically,
local-only changes stay, and non-overlapping text changes merge using Git's
`merge-file` command. Git is needed for automatic three-way text merges; if it
is unavailable, those files require manual review. Binary edits, overlapping
edits, untracked collisions and modify/delete changes require a decision.

### Review conflicts

`--prepare` prints a unique review id and creates `.tiraz/reviews/<id>/` without
changing application files. Compare `base`, `local`, `incoming` and `merged`.
For each conflict in `plan.json`, replace `null` with one of:

- `local`: retain your local content (or intentional deletion).
- `incoming`: use the target release's version (or deletion).
- `merged`: use your edited UTF-8 file under `merged/`; remove conflict markers.
- `delete`: deliberately remove the file.

Only conflicted proposals are editable here. If you want to change a clean
proposal, edit your application source and prepare a fresh review. Applying a
review with edited clean proposals stops instead of silently discarding them.
Then use the same target CLI:

```sh
node /path/to/Tiraz/packages/tiraz/bin/tiraz.mjs update --apply --review <id>
```

Changed source, dependencies or target payload invalidate the review. A new
prepare creates a new folder and keeps earlier review work. Conflict markers
are never written into live source. After applying, run `npm install` if the
dependency list changed, then your type checks, tests and Arabic/English browser
checks. A clean text merge does not guarantee API or application compatibility.

### Older installations

For an installation without a baseline, supply the matching original extracted
Tiraz package directory (the directory containing its `package.json` and `source`):

```sh
node /path/to/target/bin/tiraz.mjs update --from /path/to/original-package --prepare
node /path/to/target/bin/tiraz.mjs update --from /path/to/original-package --apply --review <id>
```

Every original file must match the installed manifest hash. An untouched original
installation can also be passed to `--from`. If an old selective install has
customized assembly files and its package cannot reproduce their original bytes,
use that untouched installation or restore the original baseline from version
control. Never replace your customized source just to satisfy the check. The
successful update saves a baseline for subsequent updates. Untracked source
copies without `tiraz.project.json` need a manual comparison; the CLI will not
guess their origin.

### Recovery

Every applied update prints a backup id. To undo it before further changes:

```sh
node /path/to/Tiraz/packages/tiraz/bin/tiraz.mjs update --restore <backup-id>
```

Restore refuses to overwrite later edits. Backups in `.tiraz/backups/` remain
available on failure. Writes are atomic per file; caught failures roll back
unchanged transaction writes. After a process interruption, inspect the backup
and partially updated files before recovering manually; this is not a filesystem
transaction across all files. A leftover `.tiraz/write.lock` requires checking
that no CLI write is active before removing it. The lock protects `add` and
`update`; the older full-source `init` does not participate, so do not run it
concurrently with another installation command. Review folders/backups can include
your private custom source; keep them local unless you intend to share them.

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
