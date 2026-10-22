# Quick start and launch requirements

The approved Night Loom landing comes from `claude/landing-night-loom`, including its local refinements. A read-only copy is integrated into `claude/woven`; the original worktree remains untouched. Its existing **04 · Start from source** section now shares content with `/start` in the workbench.

## What ships in this change

- Start here at the top of every workbench sidebar; Illustrations at the bottom. Section titles open their filtered galleries and expand only the matching item list. The standalone Library row is removed, and item rows stay text-only.
- The workbench top bar contains the sidebar toggle, brand, language, and theme controls. Its redundant Library link is removed. The standalone Docs area is removed; old `/docs/*` links resolve to Start here.
- Screens have text-only sidebar rows. Assistant workspace is removed from discovery and its example route; existing links resolve to the Screens catalog. The exported `ChatApp` component remains compatible for consumers.
- One bilingual quick-start component in the landing and Start here: new/existing-project npm previews, collapsed source setup instructions and three English screen prompts, followed by concise coding-tool and verification guidance. GitHub and source-guide download buttons are removed. Long prompts start collapsed.
- Two Vite HTML entries: the workbench and the selected landing. Local previews use `/landing.html` for the landing and `/library` for the catalog.

The [Formic quick start](https://formicai.dev/#start) informed the sequence: setup, a first useful prompt, then verification. Formic publishes an installer. Tiraz's npm panel is explicitly marked **Coming soon / Preview only**. The literal `<tiraz-package>` is a placeholder, not a published package name, and has no copy action. The source setup prompt remains available under **Use the source today** for users who already have the source. No package has been published or installer implemented by this change.

## Requirements for a future one-command installer

1. **A published source release.** Choose a versioning policy and publish a bundle containing the complete `src/system`, its agent guide, registry, examples, assets, and licenses. Publish the reviewed Woven version before directing users to it as the current release. The quick start will expose release links and a runnable install command only after the reviewed source and installer are published.
2. **A small installer.** Support a new React/TypeScript project and an existing one. Detect its package manager, inspect compatible dependencies, copy the source, and wire CSS, font imports, and the provider. Preview changes and protect existing files; repeated execution must be safe.
3. **Agent entry points.** Point the host's `AGENTS.md` at the copied `system/ai/README.md`. Keep implementation examples and registry synchronized with exported APIs. Do not duplicate the full guide across tool-specific files.
4. **A setup check.** Verify dependency resolution, CSS imports, font requests, provider context, and direction support in the host build. Run the host's own checks; Tiraz's repository scripts are not automatically present in consumer apps.
5. **Fixture coverage and release checks.** Test a fresh Vite app, an existing app with conflicting files, repeated installation, and upgrades preserving edits. Add other frameworks only when their fixtures pass. Choose and verify an npm package name before publishing a command.

No backend, database, account system, or MCP server is needed for the current source-copy workflow. An installer is a separate implementation milestone.

## Vercel and tiraz.dev

The repository is a Vite static build, supported by [Vercel's Vite integration](https://vercel.com/docs/frameworks/frontend/vite). The local `vercel.json` prepares `npm run build`, `dist`, and explicit rewrites: `/` serves the landing; `/library`, `/start`, `/illustrations`, and `/examples` serve the workbench entry. Legacy `/docs` also reaches the app for migration. Asset paths are not rewritten.

Before going live:

- Deploy the reviewed source as a preview, then verify both HTML entries, deep links, asset loading, and Arabic/English layouts there. Local Vite checks do not validate hosted rewrites.
- Publish the matching source release so the quick start points to the version visitors are seeing.
- Attach `tiraz.dev` to the chosen project and apply the exact DNS records Vercel provides. See [Vercel's custom-domain setup](https://vercel.com/docs/domains/working-with-domains/add-a-domain). Choose one canonical host and redirect the other if using `www`.
- Keep the landing's licensed Thmanyah fonts local-only unless separate web-embedding permission is obtained. IBM Plex Sans Arabic remains the bundled fallback.

Vercel Pro and the domain are useful deployment resources. They do not publish the library source or supply an installer automatically. No deployment, account configuration, DNS change, push, or publication was performed in this change.

## Local verification

Verified on the user's Mac in `/Users/amjedfadul/Tiraz-worktrees/woven`, branch `claude/woven`:

- `npm test -- --maxWorkers=2`: 135 files, 1,751 tests verified. The full run passed 131 files; four older navigation tests needed to open their section before selecting a component. After those test-only updates and a test-query type correction, a focused rerun passed all 57 tests in the five touched files. Production code did not change after the full run.
- `npm run lint`: passed with no warnings.
- `npm run build`: passed, producing `dist/index.html` and `dist/landing.html`. Vite retains its large-chunk advisory; bundle splitting is not part of this change.
- `npm run format:check`: passed. The new landing HTML, Vercel configuration, and this document were also checked explicitly.
- System/screens, shared navigation/illustrations, Customize hint, and QuickStart CSS audits: `[]`.
- Throwaway browser checks outside the repository: Arabic/English, light/dark, widths 320–1440, sidebar order and open/close, keyboard focus, clipboard success/fallback, legacy links, language/theme continuity, landing anchor focus, and direct `#start` loading.
- QuickStart axe checks in both page contexts and all four language/theme combinations: no violations in the checked WCAG A/AA rules. This complements the manual focus and layout inspection; it is not a claim of complete accessibility conformance.
- Image-generation browser checks: a monochrome halftone field based on the publicly visible [Kobra preview](https://kobra.systems/components/image-generation), with drifting bright regions and a late whole-image reveal driven by actual host progress. Unknown progress holds the reveal; failed and reduced-motion states stay still. No paid source is used.
- Sidebar navigation follows section titles, informed by [affectUI’s section navigation](https://www.affectui.com/blocks). Deep links select their matching group; changing sections replaces the visible item list and opens only that section’s gallery.
- A first-visit annotation points to Customize. Opening the panel or dismissing the hint records `tiraz.customize-hint.v1` locally. It never takes focus on mount; its dismissal preserves focus. Browser checks cover Arabic/English, 320–1440 px, panel opening, Escape, reload persistence, overflow, and annotation spacing.
- Browser verification used local Chrome. Safari and Firefox were not tested in this iteration.

The updated landing is at `http://127.0.0.1:5411/landing.html#start`; the unchanged original preview remains at `http://127.0.0.1:5243/landing.html`. Both respond successfully and remain running. Hosted Vercel routing and DNS are not yet tested.
