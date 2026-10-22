# Tiraz 0.1.0 release verification

Local checkout: `/Users/amjedfadul/Tiraz-worktrees/woven`, branch `claude/woven`.
The release starts from `6ea6937`; the owner authorized main integration,
GitHub push, npm publication, Vercel deployment and connection to tiraz.dev.

## Local candidate

- Full local suite: **1,894 tests, 150 files passed** with
  `npm test -- --maxWorkers=2`.
- Package/installer tests: **36 passed**, including a production React render
  after building from the test environment, source collisions, symlinks,
  unsupported React/ReactDOM versions, non-Vite refusal and package contents.
- Final guide/portable registry checks: **17 passed**; registry delivery checks: **7 passed** after correcting the test module import for the website typecheck.
- Lint: zero warnings. Website build and formatting pass. CSS audit: `[]`.
- Packed `@amjedfadul/tiraz@0.1.0` installed into a separate app with real npm dependencies;
  that app typechecks and builds. Its installed CLI creates a fresh Vite app,
  runs npm install, and the generated source app also typechecks/builds.
- Ten Chrome browser scenarios check the two guide locations in Arabic/English,
  desktop/phone, stable icon-only copy controls, actual clipboard commands,
  collapsed prompts, no horizontal overflow, and the installed package's Khayt
  assets with animated and reduced-motion canvas frames.
- Independent review found three issues, all fixed and re-reviewed: test-mode
  JSX output, incomplete React version preflight, and unsupported non-Vite
  source copying. No remaining Critical/Important findings were reported.
- AI-ready extensions reviewed independently. Custom destination collisions
  (including case variants) and hidden-directory imports were fixed and verified.
  No remaining Critical/Important findings in the review.
- Generated API/token knowledge and registry freshness checks pass. All three
  business patterns ship in runtime exports, declarations and editable source.
- Real shadcn 4.22.1 install: 552 files; all 551 source hashes verify. Fresh
  consumer typecheck/build and Arabic/English fonts, portraits and Khayt checks pass.
- The installed npm CLI builds both default and custom (`src/.ui`) fresh apps;
  each verifies all 551 files. The compiled package consumer also builds.
- Packed business patterns: eight Chrome scenarios across Arabic/English,
  light/dark and desktop/phone pass cancellation, confirmation and focus checks;
  no browser errors or axe violations.
- npm authentication confirmed as the owner account before publication.

The package keeps React as a peer and external import. Mascot PNGs are emitted
as runtime assets rather than embedded base64 in JavaScript. The same source
and provenance ship for source-owning consumers. CLI-only semver is not added
to generated app dependencies.

The existing website build's large-chunk advisory remains. Safari, Firefox,
physical touch devices and manual screen-reader sessions are untested.
Local scripts, screenshots and full logs are under `/tmp/tiraz-release/`.

## Publication and production

Initial main integration completed at `f84016f`; GitHub main and Woven reached
`4b68801`. The unscoped npm name was rejected by the registry similarity policy;
the owner selected `@amjedfadul/tiraz` and approved the AI-ready additions.

Final tested tarball: `@amjedfadul/tiraz@0.1.0`, SHA-512 integrity
`sha512-vK3P7rvcNduwPIJJZrsBa1vD2587SHVuPi2iuUQe8En7H75JK8m63fKclvD7kX2w9aQKu8z0xi/IXn9P0zpUFA==`.

Vercel project `tiraz` is connected to the intended GitHub repository in team
`team_9mgxRbrPlrY6rwLal9hJ4Gpg`. Project ID:
`prj_75uv04BOPWWWArHPSJQJ5HNKEnSp`. Vite, Node 24, `npm run build`, output `dist`.
`tiraz.dev` is attached, owned by that team, verified and configured correctly.
No nameserver or mail-record changes were required.

Published `@amjedfadul/tiraz@0.1.0` after the owner's npm browser approval.
The public registry's version and integrity match the tested artifact exactly;
the public npm package page confirms version 0.1.0 and public visibility.

The AI-ready integration is recorded at `2de443b` (implementation `be54c0c`);
`codex/tiraz-ai-ready` is an ancestor of both main and Woven. Both were pushed
without force and remote commit IDs verified. The merge retains the adapted
current tree, with historical pilot/research kept in ancestry.

Production deployment `dpl_8vWsHrdUC4382qY16G2eYybUDEdm` is Ready from remote main
`2de443b`. Public HTTPS checks pass at https://tiraz.dev. Sixty-eight Chrome
route scenarios cover landing, library, Start here, illustrations, a component,
an embedded screen and all eleven standalone screens, across Arabic/English and
1280/390 widths: one h1, correct direction, no page overflow, JavaScript errors
or failed responses. Ten live guide/mascot scenarios also pass. A fresh real
shadcn install from https://tiraz.dev/r/tiraz-system.json verifies 551 source
files and typechecks/builds. `/llms.txt` and its guidance endpoints respond.

The final website-only release-status change marks the version published after
registry confirmation; it is verified and pushed separately from the package.
Local preview 5411 stays on Woven. The unrelated approved landing preview 5243
and owner worktrees remain untouched. Temporary consumer servers are stopped
at handoff. Main's prior local edits remain in the named stash and external
backup documented in worktree-audit.md.
