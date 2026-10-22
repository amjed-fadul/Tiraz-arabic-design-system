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
