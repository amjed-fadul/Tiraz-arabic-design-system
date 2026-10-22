# Tiraz public release

The owner requested pushing the completed work, merging into main, deploying to
Vercel at tiraz.dev, publishing an npm-installable design system, and auditing
other worktrees for missing work. The current Woven landing and library are the
release source; the older landing stays preserved.

## Distribution

Publish `@amjedfadul/tiraz` version 0.1.0 as an MIT ESM package. Keep the repository app
private and put the public manifest in `packages/tiraz`. The public package
contains compiled components, TypeScript declarations, exported styles and fonts,
an optional Khayt entry, the complete editable system/mascot source and AI
guidance, assets and licenses. React and React DOM 19 are peer dependencies.
Exclude workbench/landing code, tests, screenshots, credentials and local data.

Support `npm install @amjedfadul/tiraz` with imports from `@amjedfadul/tiraz`, `@amjedfadul/tiraz/styles.css`, and
optional `@amjedfadul/tiraz/mascot` / `@amjedfadul/tiraz/mascot.css`. Also provide `npx @amjedfadul/tiraz init` for an
existing Vite React TypeScript project and `npx @amjedfadul/tiraz init --new my-app` for a Vite React TypeScript
starter. The installer copies source, retains licenses and guidance, adds needed
dependencies without replacing existing versions, and refuses existing source
directories instead of overwriting them. Existing routes and entry files remain
owned by the application. It writes setup instructions and an additive AGENTS.md
entry. `--no-install` supports offline preparation and integration tests.

The new starter loads IBM Plex Sans Arabic and preserves :dir() in the CSS build
target. It supports Arabic RTL and English LTR. No backend or real agent access
is needed. Node 22.12 or newer is required.

## Website and release

The shared QuickStart serves the landing and Start here page. Show real commands,
copy controls, collapsed agent prompts and clear setup for both distribution
modes. Do not claim npm publication until the registry confirms it.

Audit ancestry and uncommitted changes before integration. Preserve all existing
owner edits, worktrees and branches. Merge the tested Woven release into main;
push only the intended release refs. Deploy that exact remote main commit to a
new Tiraz Vercel project in the existing team, preserving the unrelated project.
Attach tiraz.dev, preserve unrelated DNS records, and verify HTTPS and deep links.

## Completion evidence

The packed artifact must install and build in a separate app; the source
installer must create a working new app and refuse collisions in an existing
app without partial writes. Check both languages in a browser, the full local
gate, npm contents, the remote commit, Vercel build state and public domain.
Publishing may require the owner to complete npm authentication; never request
or print an authentication token.

## Approved AI-ready branch integration

The owner explicitly selected inclusion of the useful additions from
`codex/tiraz-ai-ready` before the first public release. Adapt those capabilities
against the current Woven APIs; do not replace modern styling, RTL behavior,
portable guidance or workbench interfaces with the earlier six-component tree.

- Port CustomerEditSheet, PreferenceSettings and InvoiceActions into
  `src/system/patterns`, reuse current Input/Button/Switch/Sheet/DropdownMenu,
  and export the patterns from the main system entry. Use caller-owned labels
  and persistence, cancellation signals, duplicate-submit guards and stale-result
  protection. Closing details cancels outstanding work. Destructive actions
  require confirmation before their callback. Keep busy controls focusable.
- Generate public TypeScript contracts and a CSS token inventory from current
  authoritative source, with hashes and freshness checks. Keep authored guidance
  separate. Ship generated metadata inside `src/system/ai/generated` and expose
  the same guidance at `/llms.txt` and `/ai/` on the website.
- Extend the npm source installer with a relative installation manifest and
  `verify` command that reports modified/missing files without overwriting them.
  Support a safe custom system destination while preserving relative mascot
  imports. Reject traversal, symlinks and existing output before writing.
- Generate a shadcn-compatible complete source item from the same npm source
  payload, including binary assets in a supported delivery form. Test actual
  installation with the CLI against a locally served registry, then the deployed
  URL. No claim of working hosted installation until tested.
- Preserve prior pilot/research work in Git history and record the integration
  disposition. It is evidence and developer tooling, not package runtime.
