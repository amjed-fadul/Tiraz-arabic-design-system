# Individual component installation: local verification

Verified on the user's Mac on 25 October 2026 in
`/Users/amjedfadul/Tiraz-worktrees/woven`, branch `codex/component-installs`.
Base commit: `5f90935989871f947e628a00d8fef03f3f4a9b38`.
The tested source is committed with this report. No merge, push, deployment,
version bump or npm publication was performed. Main and unrelated edits remain
untouched.

## Delivered

- `tiraz add <components>` installs selected source, transitive dependencies and
  filtered CSS from all 78 authored catalog entries. `add --list`, `--dir` and
  `--no-install` are available.
- A separate consumer-owned `tiraz.theme.css` overrides light/dark colors,
  typography and radius. The provider accepts theme overrides without
  `!important`; the original defaults remain unchanged.
- Subsequent additions preserve customized source and theme bytes. Managed
  assembly files are regenerated only while unmodified. Preflight rejects
  collisions, missing tracked files, unsafe paths, symlinks, incompatible
  dependency ranges and mixed release versions before writing.
- The full-source installer and its version-1 verification remain supported.
  Selective installs use a version-2 manifest and guidance describing their
  actual installed subset. Published version 0.1.2 remains unchanged.

From a Vite React 19 TypeScript application's directory, try the local build:

```sh
node /Users/amjedfadul/Tiraz-worktrees/woven/packages/tiraz/bin/tiraz.mjs add button input badge
```

Use the generated `TIRAZ_SETUP.md` for the exact stylesheet imports and provider
setup. The package README contains theme and file-ownership guidance.

## Local checks

| Check                                                    | Result                                                            |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| Focused installer, theme, metadata and integration tests | 130 passed across 8 files                                         |
| `npm test -- --maxWorkers=2`                             | 1,949 passed across 154 files                                     |
| `npm run build`                                          | Passed, including package, registry, TypeScript and website build |
| `npm run knowledge:check`                                | Current                                                           |
| `npm run registry:check`                                 | Current                                                           |
| `npm run lint -- --ignore-pattern output/`               | Passed, zero warnings                                             |
| `npm run format:check`                                   | Passed                                                            |
| `git diff --check`                                       | Passed                                                            |
| Independent installs of all 78 catalog entries           | TypeScript compilation: zero diagnostics                          |
| Fresh consumer installed from a local npm archive        | Own dependency installation and TypeScript/Vite build passed      |

The normal lint command also scans the owner's untracked `output/` animation
scratch files. It reports two existing unused-variable warnings there; those
unrelated files were not changed or staged. Vite reports large website chunks;
the build succeeds. These checks did not add a bundle-splitting change.

The packed consumer installs Button, Input and Badge, modifies Button source and
the theme, then adds Card and Modal. Both customized files remained byte-for-byte
unchanged. Its own dependency install included no chart, Markdown or mascot
packages. Its production output included 48.19 kB of CSS and 273.18 kB of JS
(86.96 kB gzipped), plus font assets.

## Browser verification

Live previews:

- Documentation: <http://127.0.0.1:5411/library/components/button>
- Installed consumer: <http://127.0.0.1:5413/>

Checked Arabic RTL and English LTR, light and dark appearances, and narrow
layouts without horizontal overflow. The consumer's custom blue action color
and radius override provider defaults, including inside the portalled Modal.
The original documentation button retains its original green appearance.

The Modal has its visible Arabic title as its accessible name, takes focus on
open and returns focus to its trigger after Escape. The busy Save button keeps
focus, exposes its busy state and announces completion through one polite live
region. Browser console warnings and errors were empty.

Screenshots are saved locally in
`/Users/amjedfadul/.codex/visualizations/2026/10/25/tiraz-component-installs/`:
`arabic-light.png`, `english-dark.png` and `arabic-phone.png`.

The standalone consumer lives at
`/var/folders/wk/dcql9dfd74l1ktt20q5rvln40000gn/T/tiraz-component-preview-J77QOY/app`.
Its temporary path is also recorded in `/tmp/tiraz-component-preview-path`.

## Review and scope decisions

A fresh review found one important issue: overlapping dependency ranges could
retain a version outside Tiraz's supported range. Four new regression cases
failed before changing validation to require the existing range to be a subset
of the supported range. The final suite includes those passing regressions.

The reviewer did not independently judge browser behavior, the consumer archive
or Windows filesystem behavior. The first two were verified locally as described
above. Windows is untested. Every catalog entry was compiled; browser inspection
covered representative controls and Modal, not all 78 entries individually.

This milestone keeps the existing Vite source-install scope. Next.js integration,
per-component shadcn delivery and updating already customized source are deferred.
The existing full-system shadcn registry remains available. Add does not convert
an older complete-source install or merge upgrades. If an assembly file has been
customized, installation stops and requires manual reconciliation instead of
overwriting it.
