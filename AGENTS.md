# Working with Tiraz

**Consuming the library:** start at [src/system/ai/README.md](src/system/ai/README.md).
Its registry, composition guidance and examples travel with `src/system` and
resolve from the library directory, including in another application.

**Contributing to this repository:** component source and exported TypeScript
are authoritative. Read the same bundle before changing APIs or examples;
keep metadata synchronized with actual types and behavior. The workbench
inspector is a curated subset, not the public API specification. Preserve the
approved continuous documentation layout and one-line prompt/Copy row unless
the user requests a design change. Preserve the approved Night loom landing.
Public packaging lives in `packages/tiraz`; `npm run build:package` builds its
runtime, declarations and editable source. The repository root stays private.

Use focused tests for the change, then the existing tests (including generated
example compilation), build, lint and formatting. Inspect rendered interaction
changes and accessible names/focus in a browser; automated checks do not prove
accessibility. Keep unrelated local edits untouched. Publish, push, merge or
begin another milestone only when requested.

**Working preview:** keep the documentation server running during development
and after completion, serving the current working branch. Return its URL and
checkout/branch, and verify it responds. Preserve unrelated localhost servers;
use a free port for an isolated checkout.

**Local implementation and verification:** run implementation, tests, builds,
lint, formatting, and browser inspection on the user's Mac through this Codex
session, using the local Tiraz checkout/worktree. Do not use GitHub Actions or
remote Codex tasks for verification. Start with focused checks, then run the
relevant full checks. Report the local checkout, tested commit, commands/results,
and any untested behavior. Keep its documentation preview running for the user.
GitHub is for source review and explicitly authorized pushes/merges.
