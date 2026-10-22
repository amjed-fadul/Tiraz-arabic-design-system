# Tiraz 0.1.0 release verification

Local checkout: `/Users/amjedfadul/Tiraz-worktrees/woven`, branch `claude/woven`.
The release starts from `6ea6937`; the owner authorized main integration,
GitHub push, npm publication, Vercel deployment and connection to tiraz.dev.

## Local candidate

- Full local suite: **1,844 tests, 147 files passed** with
  `npm test -- --maxWorkers=2`.
- Package/installer tests: **14 passed**, including a production React render
  after building from the test environment, source collisions, symlinks,
  unsupported React/ReactDOM versions, non-Vite refusal and package contents.
- Final guide/navigation tests: **33 passed** after visual copy-control refinements.
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
- npm authentication confirmed as the owner account before publication.

The package keeps React as a peer and external import. Mascot PNGs are emitted
as runtime assets rather than embedded base64 in JavaScript. The same source
and provenance ship for source-owning consumers. CLI-only semver is not added
to generated app dependencies.

The existing website build's large-chunk advisory remains. Safari, Firefox,
physical touch devices and manual screen-reader sessions are untested.
Local scripts, screenshots and full logs are under `/tmp/tiraz-release/`.

## Publication and production

Main integration completed at `f84016f`; GitHub transfer is in progress.
The unscoped npm name was rejected by the registry similarity policy. The owner
selected `@amjedfadul/tiraz`; the renamed package passes 47 focused tests, lint,
build, formatting and a clean-consumer install/build.

Publication is held pending reconciliation of the distinct AI-ready branch
capabilities recorded in worktree-audit.md. No npm publication is claimed.
Record registry and deployment results here after completing them. The guide retains an unpublished status
until the npm registry confirms version 0.1.0.
