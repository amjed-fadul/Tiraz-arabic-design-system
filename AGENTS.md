# Working with Tiraz

**Consuming the library:** start at [src/system/ai/README.md](src/system/ai/README.md).
Its registry, composition guidance and examples travel with `src/system` and
resolve from the library directory, including in another application.

**Contributing to this repository:** component source and exported TypeScript
are authoritative. Read the same bundle before changing APIs or examples;
keep metadata synchronized with actual types and behavior. The workbench
inspector is a curated subset, not the public API specification. Preserve the
approved continuous documentation layout and one-line prompt/Copy row unless
the user requests a design change. Landing-page work is paused.

Use focused tests for the change, then the existing tests (including generated
example compilation), build, lint and formatting. Inspect rendered interaction
changes and accessible names/focus in a browser; automated checks do not prove
accessibility. Keep unrelated local edits untouched. Publish, push, merge or
begin another milestone only when requested.

**Working preview:** keep the documentation server running during development
and after completion, serving the current working branch. Return its URL and
checkout/branch, and verify it responds. Preserve unrelated localhost servers;
use a free port for an isolated checkout.
