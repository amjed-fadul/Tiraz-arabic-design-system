# Feedback and Avatar photos — local verification

Date: 2026-10-13, macOS, Node 24.21.0. All implementation and verification ran on the user's Mac in `/Users/amjedfadul/.codex/worktrees/feedback-and-avatar-photos/Tiraz`.

- Branch: `codex/feedback-and-avatar-photos`.
- Verified starting HEAD/baseline: `96d14668b6e2011b2b42dd0c792582d4ee9d82ba`.
- Tested source: the local commit containing this report, based directly on that baseline. Obtain its exact SHA with `git log -1 --format=%H -- docs/feedback-and-avatar-photos/verification.md`. The completion response also supplies the SHA. [Source inventory](tested-source.sha256) records the verified source/test files without a self-referential commit hash.
- Preview: [http://127.0.0.1:5207/](http://127.0.0.1:5207/), Vite PID 68472, serving this branch from the isolated checkout. HTTP 200 verified; left running.

## Delivered scope

Alert, Skeleton, Progress and Spinner use existing system tokens, semantic tones, IBM Plex Sans Arabic and shared settings. No dependencies or framework were added. Alert urgency is explicit, static default silent, actions/dismissal application-owned. Skeleton is decorative, with host-owned loading announcement. Progress clamps finite values to 0–100, preserves zero/completion/fractions, and makes no numeric claim for unknown/nonfinite values. Arabic percentages explicitly request Arabic digits. Spinner has a required name or decorative composition; both reduced-motion sources stop rotation/pulsing while retaining static indicators. Button and Avatar implementations/APIs are unchanged.

Avatar documentation exposes initials/photo and an optional existing src URL. Individual photos and mixed groups import two fictional ImageGen portraits bundled as small 256px JPEGs. Their [portable provenance](../../src/system/ai/assets/README.md), [MIT license](../../src/system/ai/assets/LICENSE.txt) and hashes travel with the source. No runtime external image service, upload, cropping or storage was introduced. Generated code and both language prompts preserve selected appearance and asset imports.

Four continuous documentation pages, minimal controls, explicit states, complete generated examples, API tables, exports, registry (24 families) and portable guidance are synchronized. Alert note dismiss/restore and Skeleton ready/loading buttons have real local outcomes. No timers, fake service or customer workflow expansion.

## Commands and results

Commands use `PATH=/Users/amjedfadul/.nvm/versions/node/v24.21.0/bin:$PATH` in this checkout.

| Check                                                                                                                                         | Result                                                                                                                                                                | Evidence                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline `npm test -- --maxWorkers=2`                                                                                                         | 29 files / 241 tests passed                                                                                                                                           | [Baseline](baseline.txt)                                                                                                                                                                  |
| Preimplementation focused red test                                                                                                            | 19 expected failures on missing feedback exports / existing Avatar case passed                                                                                        | [Red](red.txt)                                                                                                                                                                            |
| `npm test -- src/system/feedback.test.tsx src/workbench/feedback-photos-pages.test.tsx src/workbench/generated-batch.test.tsx --maxWorkers=2` | 3 files / 29 tests passed                                                                                                                                             | [Focused](focused-green.txt)                                                                                                                                                              |
| `npm test -- --maxWorkers=2`                                                                                                                  | 31 files / 276 tests passed                                                                                                                                           | [Full suite](unit-final.txt)                                                                                                                                                              |
| Generated compilation and relocated source/assets                                                                                             | Included in full suite; all family defaults in both languages and variants compile; relocated library compiles without checkout root; Vite emits byte-identical JPEGs | [Tests](../../src/system/ai-registry.test.ts), [generated compilation](../../src/workbench/generated-code.test.ts), [relocated prompt test](../../src/workbench/generate-prompts.test.ts) |
| `npm run build`                                                                                                                               | TypeScript + Vite passed; both portrait assets emitted                                                                                                                | [Build](build.txt)                                                                                                                                                                        |
| `npm run lint`                                                                                                                                | Passed with no warnings                                                                                                                                               | [Lint](lint.txt)                                                                                                                                                                          |
| `npm run format:check` and supplemental Prettier check                                                                                        | Passed                                                                                                                                                                | [Formatting](format.txt), [evidence formatting](format-evidence.txt)                                                                                                                      |
| `git diff --check`                                                                                                                            | Passed                                                                                                                                                                | [Final audit](final-audit.txt)                                                                                                                                                            |
| Independent review / corrections / re-review                                                                                                  | Approved, no remaining confirmed findings; independent TypeScript and diff check passed                                                                               | [Review](review.md)                                                                                                                                                                       |

Vite reports a documentation JavaScript chunk above its 500kB warning threshold. Build succeeds; code splitting is outside this batch.

## Browser evidence

Command: `TIRAZ_PLAYWRIGHT=/Users/amjedfadul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright node tests/browser/feedback-photos.mjs`, using local `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. [Script](../../tests/browser/feedback-photos.mjs), [fixture](../../tests/browser/feedback-photos-fixture.tsx), [results](browser/results.json).

32 component combinations cover Arabic/English × light/dark × compact/standard density × standard/large text × 1280/320px widths. Another 24 focused documentation views cover all six affected pages in both languages and widths, including opened API disclosures. No page errors or horizontal clipping; local font and portrait loading verified. Real browser checks cover:

- Held local image request/loading initials, failed source, replacement, removal, cached restoration and single accessible naming.
- Static Alert silence, explicit polite/status and assertive/alert, real note dismissal/restoration and focus transfer both ways.
- Skeleton decorative shapes, host busy/status and real ready/loading button.
- Progress zero/completion/clamping/fractions/unknown/nonfinite values, Arabic/English percentage text, correct RTL/LTR fill geometry.
- Named/decorative Spinner composition; computed animation stops for app and OS reduced motion.
- Live accent/theme/density/text/radius customization and semantic color independence from accent.
- Documentation photo/custom URL controls, source failure/removal, matching clipboard code/prompts and portable asset/license paths; live Progress state/customization controls.
- Axe on the composed examples with no violations. Manually inspected screenshots for English desktop, Arabic narrow and focused documentation. These checks establish browser/DOM semantics; no manual VoiceOver spoken-output session was performed.

Representative composed captures include all four feedback components and Avatar photos/groups:

|         | Desktop                                                   | Narrow                                                  |
| ------- | --------------------------------------------------------- | ------------------------------------------------------- |
| Arabic  | [Arabic desktop](browser/feedback-photos-ar-desktop.png)  | [Arabic narrow](browser/feedback-photos-ar-narrow.png)  |
| English | [English desktop](browser/feedback-photos-en-desktop.png) | [English narrow](browser/feedback-photos-en-narrow.png) |

Focused documentation captures: [Alert English](browser/docs-alert-en-desktop.png), [Alert Arabic](browser/docs-alert-ar-narrow.png), [Skeleton English](browser/docs-skeleton-en-desktop.png), [Skeleton Arabic](browser/docs-skeleton-ar-narrow.png), [Progress English](browser/docs-progress-en-desktop.png), [Progress Arabic](browser/docs-progress-ar-narrow.png), [Spinner English](browser/docs-spinner-en-desktop.png), [Spinner Arabic](browser/docs-spinner-ar-narrow.png), [Avatar English](browser/docs-avatar-en-desktop.png), [Avatar Arabic](browser/docs-avatar-ar-narrow.png), [AvatarGroup English](browser/docs-avatar-group-en-desktop.png), [AvatarGroup Arabic](browser/docs-avatar-group-ar-narrow.png).

## Preservation and completion

Original `/Users/amjedfadul/Tiraz` remains on `main` at `ce78408818b6a9866ab0faa7748404cba44d8939`, with its original unstaged README.md and src/workbench/workbench.css changes and empty staged diff. No checkout, reset, stash, index update or file edit was performed there. Existing servers on 5189, 5191, 5193, 5205 and 5206 retain their PIDs. The earlier preview at [5206](http://127.0.0.1:5206/) still responds HTTP 200. Only this isolated branch receives the local commit. No push, merge, deployment, release, publication or further component batch.
