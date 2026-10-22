# AI context controls verification — 18 October 2026

Implemented SelectionActions, ContextMeter and ModelSelector, three continuous
pages in the existing AI patterns group, and a connected local chat composition.
Exports, API metadata, portable prompts, compiling examples and source guidance
are included. No dependencies or additional component families were added.

- Branch: `codex/ai-context-controls`
- Baseline: `5f53b9c8949884ed1faa14eacd220739e81826ad`
- Checkout: `/Users/amjedfadul/.codex/worktrees/ai-context-controls/Tiraz`
- Preview left running: <http://127.0.0.1:5217/>
- Environment: local Mac, Node 24.21.0, installed desktop Chrome through Playwright.

## Results

| Check                                                                   | Result                                                                                            |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Focused controls, pages, prompts and source relocation                  | 153 tests passed before the final geometry regression; independent final focused runs also passed |
| Final full suite, `npm test -- --reporter=dot --maxWorkers=2`           | **705 tests / 76 files passed**, exit 0                                                           |
| Generated Arabic/English examples and relocated source-only compilation | Passed through `ai-registry.test.ts` in the final full suite; all three new families included     |
| Relocated source-only build and registry/export contracts               | Passed through the final full suite                                                               |
| `npm run build`                                                         | Passed; documentation bundle still emits Vite's >500kB chunk advisory                             |
| `npm run lint`                                                          | Passed, no warnings                                                                               |
| `npm run format:check` and browser harness formatting                   | Passed                                                                                            |
| Main browser regression harness                                         | **22 checks passed**, zero failures or page errors                                                |
| Additional docs/customization/motion/accessibility/touch harness        | **16 checks passed**, zero failures or page errors; one documented inherited axe diagnostic       |
| Independent review and re-review                                        | All actionable findings fixed; no remaining actionable source findings                            |

The initial shared-dependency attempt could not start under the Mac's default
Node 20. Dependencies were then installed with the unchanged baseline lockfile
inside this worktree using installed Node 24. A default-concurrency full run later
hit the existing Workbench English/light accent test's five-second timeout under
concurrent verification load. The final full-suite command limits workers to two
and passes all 705 tests; no timeout or test assertions were weakened. A first
relocation-harness failure exposed a missing raw example entry in its loader;
that entry was added and the final relocation checks pass.

## Interaction coverage

Main evidence: [results.json](browser/results.json).

- Model choice updates the actual local stable ID; normal draft edits and local
  submission preserve it. Disabled rows are visible and skipped; controlled IDs
  survive reorder/removal without unsolicited callbacks. Missing selection shows
  a placeholder and an empty list disables the trigger.
- Selected text is appended to an existing draft, copied to the actual browser
  clipboard, or quoted locally. The native selected text survives activation.
- Mixed Arabic/English backward ranges, native automated mouse dragging,
  Alt+Enter, arrow/Home/End navigation, disabled actions and Escape focus return.
- Selection outside the scope, code, editable fields/content, native and semantic
  controls, explicit exclusions and crossing excluded controls are
  rejected. Clearing/changing selection, scrolling, viewport resize and unmount
  are covered. The native-drag geometry regression checks the current Range and
  Popper anchor agree within one pixel.
- Nested ModelSelector and ContextMeter in Modal: Escape dismisses only the inner
  control, focus returns to its trigger, and a later Escape closes the Modal.
  Selection toolbar Escape similarly preserves the containing Modal.
- Zero, missing, NaN/negative/nonfinite and over-capacity context; visible status,
  full accessible value descriptions, estimated labels and supplied parts.

Additional evidence: [extra-results.json](browser/extra-results.json).

- All three documentation pages in Arabic/English and light/dark, at 1440×900,
  320×520 and 320×320; continuous playground/examples/usage sections, shared demo
  frames, no horizontal document overflow. Fixture menu/toolbar bounds also pass
  at 1100×800, 320×520 and 320×320 with long mixed-direction text.
- Live shared typography/density/radius customization, inherited popup tokens,
  and customized accent/theme fixtures. Local font readiness checked.
- Application reduced motion and emulated OS `prefers-reduced-motion` are tested
  independently and together. No macOS preference was changed.
- Targeted axe scans pass for closed controls, the active model popup and context
  details. A full-provider scan with Radix Select open reports `aria-hidden-focus`
  on its hidden background. The original diagnostic is preserved in the JSON.
  Independent source review confirms the existing primitive traps focus; Tab,
  Shift+Tab and attempted programmatic background focus stay on an option. This
  is documented rather than claiming a clean full-tree scan.

## Captures and recording

- [Connected screenshot](browser/connected-final.png)
- [Short connected interaction recording](browser/connected-interactions.webm)
- [Arabic dark mobile documentation](browser/docs-ar-dark-320x320-selection.png)
- [Model menu](browser/model-en-light-1100x800.png)
- [Native automated drag](browser/native-drag.png)
- [Live shared customization](browser/docs-customization.png)
- [Simulated touch](browser/simulated-touch.png)

The recording shows model selection, sample context details, native automated
mouse selection, keyboard action activation, local draft edits and local submit.
All remaining PNGs in `browser/` retain the language/theme/viewport matrix.

## Limits and preservation

DOM Range fixtures and emulated touchscreen taps are **simulated** checks.
Desktop mouse/keyboard input was automated in local Chrome. No physical phone,
physical touch selection handles, or manual VoiceOver/screen-reader session was
tested. Automated scans do not establish conformance. Shadow DOM, iframe,
contenteditable/custom editors and code controls are explicitly unsupported by
SelectionActions. Clipboard availability remains browser/host owned; failure is
reported in the connected example.

The original checkout remains on its original main HEAD with the same README,
workbench CSS edits and `.claude/` untracked directory. No original index/source
changes, landing edits, unrelated server stops, push, merge or deployment were
performed. The only documentation server started by this task uses port 5217.

See [reference inspection](references.md), [independent review](review.md), and
[portable AI guidance](../../src/system/ai/README.md) for details.

## Reproduce on this Mac

Use the installed Node 24 runtime on PATH. Run the normal npm checks above.
For browser harnesses, set `TIRAZ_PLAYWRIGHT` to the available external Playwright
package path, then run `node tests/browser/ai-context-controls.mjs`,
`node tests/browser/ai-context-controls-extra.mjs` and
`node tests/browser/ai-context-controls-record.mjs`. `TIRAZ_URL` and
`TIRAZ_EVIDENCE` override the preview and evidence paths. The library itself adds
no browser automation dependency.
