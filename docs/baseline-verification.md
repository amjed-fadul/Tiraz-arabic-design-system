# Initial source baseline verification

Date: 2026-10-12. This record applies to the initial Git commit containing it.
Destination: `amjed-fadul/Tiraz-arabic-design-system`, branch `main`.

## Automated checks

The following checks ran against the implementation before committing:

- `npm test`: 51 tests passed across 7 files.
- The generated-code suite strictly compiles 19 generated usage modules.
- Portable-prompt coverage checks all six components in Arabic and English,
  verifies existing relative read targets, rejects absolute project roots, and
  compares output from two physical checkout locations.
- Workbench clipboard coverage compares the complete copied prompt with the
  current generator output after changing component properties and system settings.
- `npm run lint`: passed (Oxlint).
- `npm run build`: passed (TypeScript and Vite production build).
- `npm run format:check`: passed.

## Browser and review evidence

The portable-prompt change was manually verified in the local workbench before
preparing this baseline. All six pages displayed the matching relative component
source path and README guidance, without a machine-specific project root.

A Button prompt remained a single line with `white-space: nowrap` and
`text-overflow: ellipsis`: its content width was 8,910px inside a 674px text region.
Copying returned the full 1,890-character prompt, matching the displayed prompt
after whitespace normalization and containing the complete generated module,
the edited Arabic label and the current blue accent. Playground edits were then
restored. See [the prompt screenshot](screenshots/portable-prompt.jpg).

Independent review of the focused portable-prompt change found no actionable
issues. Earlier implementation and browser evidence remains in
[workbench verification](workbench-verification.json),
[compact workbench verification](compact-workbench-verification.json), and
[browser verification](browser-verification.json). Those files describe their
respective historical states; they are not claims of new browser scans for this
commit. The pushed baseline is intended for independent review before the next
milestone.

## Repository preparation

The workspace had no Git repository or existing local history. The destination
was confirmed empty using both Git refs and GitHub repository metadata. A new
repository was initialized on `main` with the authorized destination as `origin`.

The baseline includes the six-component library, documentation workbench, tests,
project configuration and lockfile, setup and usage documentation, MIT license,
verification records, and screenshots. Dependencies, generated build output,
logs, caches, local environment files and private-key files are ignored. A scan
of candidate text files for common private-key and credential signatures found
no matches; it is not a comprehensive security audit.

## Remaining limitations

- No manual screen-reader or physical touch-device pass.
- Automated accessibility scans do not establish full WCAG conformance.
- The compact inspector demonstrates common properties and representative
  content; complete APIs remain available in source and documentation.
- No release or deployment is part of this baseline. Landing-page work remains
  paused.
