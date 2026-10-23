# Khayt 0.1.1 local release verification

Validated on 23 October 2026 in `/Users/amjedfadul/Tiraz-worktrees/woven`,
branch `claude/woven`, starting from `db158d0`.

Khayt's shared `working` state now feeds a continuous Mini weaving loop. The
public props, agent identity colors, decorative semantics, pause behavior and
reduced-motion support remain compatible. The package includes the compiled
mascot entry, declarations, assets and matching editable source.

## Checks

- Focused mascot, copied-source, installer, QuickStart and registry tests:
  58 passed across 5 files.
- `npm test -- --maxWorkers=2`: 1,900 passed across 151 files.
- `npm run build`: package, declarations, registry and production website pass.
- `npm run format:check`, `npm run knowledge:check`, `npm run registry:check`
  and `git diff --check`: pass.
- `npm run lint -- --ignore-pattern 'output/**'`: zero warnings. The excluded
  directory contains untracked social-export artifacts; its two existing unused
  variable warnings are unrelated to the release and those files are not shipped.
- Mascot CSS audit returns `[]` in the focused suite.
- Local Chrome checks cover Arabic/English, light/dark, 390px mobile, pause,
  custom colors and interruptions. Working loops also render in the AgentTask
  playground, Agent control room and landing AgentTask/ImageGeneration examples.
- A fresh app installs the exact tarball, imports `/mascot` and `/mascot.css`,
  typechecks and builds. Eight Chrome scenarios cover Arabic/English,
  light/dark and normal/reduced motion at 200px and 32px. All 48 canvases behave
  correctly, assets load, pause retains focus, and state switches work without
  browser errors, overflow or extra live regions.
- Installed renderer and motion source hashes match the approved working tree.

All implementation and verification ran locally on the owner's Mac. Safari,
Firefox and physical mobile devices were not tested for this patch. The existing
website large-chunk advisory remains.

## Artifact

Package: `@amjedfadul/tiraz@0.1.1`.

SHA-512 integrity of the tested tarball:

```text
sha512-EAy8SDoH8DHzQcYCYFHCo6v+rQNm9YaDwTviGzd55qqv+EkWeTxiXNc4sQ34Ombwi4DCtli7IoKxd9iQ5xRjkA==
```

Logs, consumer app and browser evidence are in
`/tmp/tiraz-khayt-release-0.1.1/`. The temporary consumer server was stopped.
The Woven documentation preview remains at `http://127.0.0.1:5411/`.

Package-import users receive the animation by updating their dependency.
Source-copy users should compare and port `khayt-motion.ts` and
`khayt-renderer.ts`, preserving their own edits; the installer continues to
refuse overwriting existing source directories.
