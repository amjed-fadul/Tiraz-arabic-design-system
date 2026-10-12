# First AI instruction layer

Baseline: `ce78408818b6a9866ab0faa7748404cba44d8939`. Local branch:
`milestone/ai-instructions`. No push, merge, deployment, release or subsequent
milestone was performed. The original main checkout and its index are preserved.

## Structure and changed files

| File/group                                              | Responsibility                                                                                                                                                                           |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                             | Short contributor/consumer distinction; points to portable bundle                                                                                                                        |
| `src/system/ai/README.md`                               | Discovery, source-root resolution, copying, dependencies/fonts/provider setup                                                                                                            |
| `src/system/ai/registry.json`                           | Six stable families, 24 real public exports, full curated props/records, defaults, values, inherited API/exclusions, control/events/accessibility/limits, support APIs and example links |
| `src/system/ai/composition.md`                          | Task-to-component mapping, Arabic/bilingual content, semantic configuration, interactions and practical validation                                                                       |
| `src/system/ai/examples/usage.tsx`                      | Strictly compiling six-family composition with icon-only naming and scoped nested menu                                                                                                   |
| `src/system/ai-registry.test.ts`                        | Registry/path/export/type/value integrity and compilation after source-only relocation                                                                                                   |
| `src/workbench/generate.ts`, `generate-prompts.test.ts` | Portable Arabic/English copied prompts and relocation checks; generated usage code unchanged                                                                                             |
| `src/workbench/Workbench.tsx`, `Workbench.test.tsx`     | Complete LTR isolation for new instruction/import paths in Arabic; existing one-line prompt/Copy presentation retained                                                                   |
| `tests/ai-exercise/*`                                   | Independent consumer app, findings, reusable fresh-copy/build/browser harness; never imported by production entry                                                                        |
| `tests/browser/ai-prompts.mjs`                          | Bilingual desktop/320px prompt, complete clipboard/code, same-row Copy and path-isolation checks                                                                                         |
| `tests/browser/interactions.mjs`                        | Keeps 1-second expiry checks; gives separate live-style inspection a 5-second notice and records elapsed time                                                                            |
| `docs/superpowers/plans/2026-10-12-ai-instructions.md`  | Scoped milestone plan                                                                                                                                                                    |
| `docs/ai-instruction-evidence/*`                        | Fresh results, initial failures, traces and representative screenshots                                                                                                                   |

Registry paths resolve from the directory containing `index.ts`, not from an
application/checkout root. Copying the whole reusable source retains `ai/` and
its examples. Public source/types remain authoritative; the workbench inspector
is explicitly a subset. No component API, implementation, stylesheet, production
entry, dependency or approved documentation layout was changed.

## Independent agent exercise and observed improvements

A fresh consumer agent read the bundle and source, without reading production
workbench files, and built an Arabic invoice dashboard using all six families.
It changed real local invoice/reminder/project state. The deliberately requested
DataTable was correctly reported unavailable; a captioned application-owned
HTML table with shared tokens and Tiraz menu actions was used instead. No
invented export, prop or new family was added.

The exercise was built at `src/vendor/tiraz` in a separate app with the full
instruction/source bundle and no checkout README/workbench. A second harness
run copied it again into a fresh temporary app, strictly compiled both the app
and bundled example, built it, and passed the same 13 browser groups.

Observed friction informed the final guidance:

- **Language scope:** initially only main content had `lang=en`; sibling
  Sheet/menu/Toast content inherited `ar`. A host language wrapper above
  SystemProvider corrected all four scopes. [Before](ai-instruction-evidence/language-before.json),
  [after](ai-instruction-evidence/language-after.json).
- **Escape ordering:** a project-selection Toast became the newest Radix
  dismissable layer. First Escape dismissed it even with focus in the Sheet;
  a later Escape closed the Sheet and restored focus. This existing behavior
  is now documented; tests observe actual layer removal rather than guessing
  from focus or waiting a fixed animation interval. [Trace](ai-instruction-evidence/agent-exercise/focus-trace.json),
  [control cases](ai-instruction-evidence/agent-exercise/escape-cases.json).
- **Responsive native table:** the consumer grid initially expanded to the
  table's minimum width. Only exercise CSS was corrected with shrinking grid
  columns and `min-inline-size: 0`; guidance now calls for internal overflow.
- **Host setup and assertions:** CSS import declarations belong to the host
  toolchain; deferred focus/transition checks need observable state; semantic
  success colors must not be mistaken for accent colors; accessible viewport
  labels should be checked by role/name. [Agent findings](../tests/ai-exercise/exercise-notes.md).

Arabic/RTL and English/LTR, light/dark, all accents, density, typography, radius,
application/OS reduced motion, Tabs/Switch keyboard use, early End/Enter in a
48-command nested menu, genuine pointer hover, focus trapping/restoration,
repeated Toast close/expiry, local form validation and narrow/short scrolling
were checked. Font file responses were HTTP 200. Screenshots were visually
inspected; browser checks do not establish complete accessibility.

Representative captures:

- [Arabic compact light dashboard](ai-instruction-evidence/root-copy-exercise-final/01-arabic-rtl-light.png)
- [English dark customized dashboard](ai-instruction-evidence/root-copy-exercise-final/05-english-ltr-dark.png)
- [Narrow Arabic dashboard](ai-instruction-evidence/root-copy-exercise-final/06-narrow-arabic.png)
- [Scrolling nested menu](ai-instruction-evidence/root-copy-exercise-final/07-short-sheet-menu.png)
- [320px Arabic prompt/Copy row](ai-instruction-evidence/prompts/ar-320.png)

## Verification and review

| Check                                             | Result                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Initial new registry/prompt tests                 | 14 expected failures before bundle/prompt implementation; relocation test already passed                 |
| New complete-path bidi test                       | Failed before rendering change, then passed                                                              |
| Final full Vitest suite                           | 83/83 tests across 11 files, including strict generated-usage compilation                                |
| Final registry/type/source-copy checks            | 3/3 pass                                                                                                 |
| Independent consumer exercise                     | 13/13 browser groups; strict TypeScript and standalone build pass                                        |
| Second fresh-copy exercise                        | 13/13 groups; strict TypeScript, bundled example and standalone build pass                               |
| Bilingual prompt clipboard/layout                 | 4/4 desktop/narrow checks pass                                                                           |
| Existing browser regression/customization scripts | Both pass, zero failures/errors                                                                          |
| Existing interaction script                       | Initial live-style timeout; corrected test window passes, all 1-second expiry assertions retained        |
| Build                                             | Initial test-helper generic inference error; corrected `flatMap<unknown>` annotation, final build passes |
| Lint and formatting                               | Pass                                                                                                     |
| Independent reviewer and re-review                | No actionable defects; real API/metadata and test-window adjustment checked                              |

The initial interaction probe used a one-second notice for three live settings
changes and then timed out finding the notice. Its expiry/pause checks had
already passed. The separate style inspection now uses the normal five-second
window; its final measured actions took 102 ms and retained all original
semantic style/focus assertions. Initial failure records are kept instead of
replacing them with successful results. A package-directory Playwright override
also exposed an ESM directory-import harness error; the reusable verifier now
uses the same `createRequire` pattern as existing browser scripts, and the
fresh-copy rerun passed.

[Verification summary](ai-instruction-evidence/verification.json),
[consumer results](ai-instruction-evidence/agent-exercise/browser-results.json),
[fresh-copy results](ai-instruction-evidence/root-copy-exercise-final/browser-results.json),
[copy/build record](ai-instruction-evidence/root-copy-exercise-final/copy-build.json),
[prompt results](ai-instruction-evidence/prompts/results.json),
[initial interaction failure](ai-instruction-evidence/interactions-initial.json),
[final interaction results](ai-instruction-evidence/interactions-final.json).

## Reproduce

Use Node >=22.12 with installed project dependencies. Browser scripts accept
`TIRAZ_PLAYWRIGHT` (package/module path) and `TIRAZ_BROWSER` (executable path)
when browser tooling is supplied externally. No dependency was added.

```sh
npm test
npm run build
npm run lint
npm run format:check
TIRAZ_EVIDENCE=/tmp/tiraz-consumer node tests/ai-exercise/prepare.mjs
TIRAZ_URL=http://127.0.0.1:5187 TIRAZ_EVIDENCE=/tmp/tiraz-prompts \
  node tests/browser/ai-prompts.mjs
```

Run the three existing scripts by absolute script path from separate evidence
directories containing `docs/review-evidence/`, so historical records remain
intact. `prepare.mjs` uses a fresh temp app and port 5190 by default, accepts
`TIRAZ_EXERCISE_PORT`, and closes that temporary server after verification.

## Preservation and limits

Original main remains at the baseline. Its raw index bytes, uncommitted binary
diff, README/layout CSS file bytes and status are identical in the recorded
[before](ai-instruction-evidence/original-before.json) and
[after](ai-instruction-evidence/original-after.json) fingerprints. The independent
fixture is outside the production entry, and generated usage code is unchanged.

This is evidence from one independent consumer exercise using Chrome on macOS,
not a general agent benchmark. Firefox/Safari, touch/swipe, forced colors and
manual screen-reader quality were not tested. Metadata is curated and protected
by source/type/path checks, not automatically exhaustive for future dependency
versions. React 19 is the verified ref-forwarding boundary. The fixture uses
in-memory state, with no backend, persistence, message delivery, table sorting
or pagination. Existing application data/notice strings are not translated
automatically when language changes. Unsupported capabilities stay explicit.
