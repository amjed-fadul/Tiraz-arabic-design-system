# Individual components and user-owned themes

The user approved implementing the first milestone locally: install individual
components and provide a separate theme file. No push, merge, deploy or publish.

## Intended experience

`tiraz add button input badge` in an existing Vite React 19 TypeScript app copies
only the requested components, their source dependencies, required styles and
small shared foundations. `--dir src/ui` and `--no-install` work as with init.
`tiraz add --list` lists the available component names. Subsequent add commands
reuse the installed directory and preserve existing source customizations.

The component catalog is generated from the existing authored registry and real
TypeScript imports. Shared-module exports may arrive together (for example,
charts). No unrelated chart, markdown or mascot packages/assets accompany a
button. The full-source `init` command remains compatible.

`src/tiraz.theme.css` (or the selected directory) belongs to the consumer. It
contains documented light/dark color, font and radius overrides. Import it after
the defaults. Provider accent/radius defaults remain configurable, while explicit
theme overrides work without `!important`. Adding components never rewrites this
file. Theme edits are excluded from source verification.

## Approaches and implementation choices

The approved direction is selective source installation plus a separate theme.
Keeping the full source/CSS payload would retain today's adoption cost. A manual
second set of component implementations would drift from the public library.
Generate dependency closures and filtered CSS from authoritative source instead.
Keep CLI-managed index, stylesheet and subset guidance separate from editable
component source and the user-owned theme. Rebuild managed files only if their
recorded hashes still match; otherwise stop before writing anything.

## Safety and scope

- Node >=22.12 and React 19; keep the existing Vite/TypeScript source-install scope.
- Same release only for incremental additions. Upgrading copied source is a later
  milestone; reject mixed-version additions with an actionable message.
- Validate all component names, paths, manifests, dependencies and collisions
  before writing. Reject symlinks and unsafe paths. Preserve existing app entry,
  routes, scripts and dependency versions. Never overwrite an untracked file.
- Track installed upstream file hashes, actual exports, requested components,
  managed files and the user-owned theme in a schema-version-2 subset manifest.
  Continue verifying older schema-version-1 complete installations.
- Filtered guidance must describe the installed subset and resolve locally.
- Document local commands without advertising an unpublished release command as
  available on npm. Keep the approved website and landing layout unchanged.
- Do not add an updater, Next.js adapter or per-component shadcn registry in this
  milestone. The existing full-system registry remains valid.

## Acceptance

Install button/input/badge; compile and build a consumer with only its declared
dependencies; render customized Arabic/English light/dark controls. Add another
component after modifying source/theme and prove those edits remain byte-for-byte
intact. Prove invalid paths, collisions and customized managed files fail before
mutation. Check every catalog entry's dependency closure and generated styles.
Run focused tests, full tests, build, lint and format locally. Keep the woven
documentation preview running on port 5411 on the working branch.
