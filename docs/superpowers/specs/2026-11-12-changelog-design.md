# Changelog for people and agents

Status: approved direction (2026-11-12). Lean build: three coarse tasks, Sonnet/Haiku
implementers, Opus advises and reviews.

## Why

Someone who copied Tiraz source into their app needs to know, for each new
version, **what changed in each component they use and how to update their
copy**. Their AI agent needs the same answer in a form it can query. People look
in two places: the docs site and the terminal while running `tiraz update`.

## Goals

- One authored source, `src/system/ai/changelog.json`, travels with the AI
  registry (ships in the npm package and full source installs).
- A generated `packages/tiraz/CHANGELOG.md` for GitHub/npm readers.
- A docs page at `/changelog` in the approved simple "version first" layout.
- `tiraz update` (preview, `--prepare`, `--apply`) prints only the entries for the
  project's installed components between its version and the target.
- Back-fill 0.1.0 through 0.1.3-preview.5 from git history.

## Non-goals

- Docs-site/landing/workbench-only changes (analytics, landing copy, sidebar).
  The changelog covers the library: components, provider, tokens, CLI, mascot.
- Contributor credits, PR/commit links, RSS, search or filters.
- No per-component changelog section on component pages (pages stay three parts).

## Data (`src/system/ai/changelog.json`)

```jsonc
{
  "schemaVersion": 1,
  "format": "tiraz-changelog",
  "releases": [                       // newest first
    {
      "version": "0.1.3-preview.5",    // semver, unique, strictly descending
      "date": "2026-10-28",            // ISO date
      "published": true,               // on npm
      "changes": [
        {
          "components": ["chat-thread"], // registry component ids; [] = library-wide
          "area": "provider",            // only when components is []: provider | tokens | cli | mascot | package | library
          "label": "Toast",              // optional display name; replaces registry api names / area label
          "type": "added",               // added | changed | fixed | deprecated | removed
          "breaking": false,             // optional, default false
          "summary": { "en": "…", "ar": "…" },          // predicate continuing the bold label, e.g. "accepts … as children."
          "steps":   [{ "en": "…", "ar": "…" }],        // optional manual steps for copied source
          "files":   ["ChatThread.tsx"]                  // system-root paths (manifest keys)
        }
      ]
    }
  ]
}
```

Rules (enforced by a test and the generator):
- The newest release version equals `packages/tiraz/package.json` version.
- Component ids exist in `ai/registry.json`; `area` only when `components` is empty.
- `breaking: true` requires at least one step.
- `files` of the newest release exist in `ai/generated/manifest.json`.
- Every summary/step has both `en` and `ar`. Arabic is natural, not literal.
- Derived, not stored: "Run `tiraz update`. No manual steps." vs "N manual steps";
  "Preview" for prereleases; "Latest" for the newest published stable; "Not on npm"
  for unpublished.

Area display labels: provider → "SystemProvider", mascot → "Khayt", cli → "CLI",
package → "Package", library → "Library", tokens → "Tokens". The oldest release shows
its channel label but no "Run `tiraz update`" line. Summaries are short predicates
(about 14 words) with identifiers in backticks.

0.1.0 is one library-wide entry ("First release" + a sentence on what it contains).

## Docs page (approved mockup "Version A, simpler")

- Route `{ kind: "changelog" }` at `/changelog` (+ Vercel rewrite). Sidebar link under
  "Getting started", after "Start here": "Changelog" / "سجل التغييرات".
- Title, one-line lede, then one section per release:
  heading = version + muted "date · channel"; one muted line on how to update;
  a plain list, one line per change: **Component name(s)** + summary + small muted
  type label (Breaking shown as its own label). Manual steps appear as a quiet
  inset note under the change (inline-start rule). No cards, no coloured pills,
  no file lists on the page.
- Component names link to their docs page when the id is in the catalog.
- Anchor per release (`#0.1.3-preview.5`) so the CLI and others can deep-link.
- Arabic RTL and English LTR; dates via `Intl.DateTimeFormat` with `numberLocale`
  digits; Tiraz tokens for spacing; works at 320px; both themes; focus visible.

## Terminal (`tiraz update`)

Before the file status lines:

```
What changed for your components (0.1.2 → 0.1.3-preview.5)

Action needed
  TaskRows   TaskRowsRoot takes no emptyState.
             → Move it into <TaskRowsEmpty>.

Updates automatically
  Tooltip    Compound parts added. Existing <Tooltip> unchanged.
  …

Full notes: https://tiraz.dev/changelog
```

- Range: `installed.version < release ≤ target`. Selective installs filter by
  `installed.components`; full installs show everything. Library-wide entries always.
- English only, no colour (matches the existing CLI). Nothing printed when no entries.
- Reads `source/system/ai/changelog.json` from the target package; a missing file
  prints nothing (older packages).

## Agents

- `ai/README.md`: one short section — read `ai/changelog.json` before updating
  copied source; entries list components, files and manual steps.
- Selective-install subset README: one line pointing at the package's
  `source/system/ai/changelog.json` and tiraz.dev/changelog.

## Tasks

1. **Data, generator, back-fill (Sonnet).** `changelog.json`, `scripts/changelog.mjs`
   (validate + render Markdown, write/`--check`, wired into `build:package`),
   `packages/tiraz/CHANGELOG.md` (+ `files`), agent docs, tests for the rules.
2. **Docs page (Sonnet).** Route, nav link, page component + CSS, tests.
3. **CLI (Haiku, precise brief).** Selection + printing in `update-source.mjs`, tests.

Tasks 2 and 3 run in parallel after task 1. Opus reviews each diff (Critical and
Important only), then polishes spacing in the browser.
