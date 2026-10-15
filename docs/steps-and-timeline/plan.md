# Steps and Timeline focused batch

Baseline: e0fc39d7be1aed9c0723be415f3810e326003c5b. Work locally in the isolated codex/steps-and-timeline checkout. The detailed user brief is the specification and authorizes implementation and local commit.

- [x] Add focused failing contracts for statuses, ordered/current semantics, opt-in activation, refs/native props, form validation and preservation, event order/time, local append and empty state.
- [x] Implement Steps and Timeline with stable IDs, logical connector geometry, token-based compact styling, wrapping and reduced motion. No dependency changes.
- [x] Add portable application-owned examples: three-step validated local form and in-memory activity list.
- [x] Connect standard continuous docs, minimal inspectors, generated source and full copied prompts. Update exports, registry and portable guidance to 43 families.
- [x] Run focused/full tests, generated/portable compilation, build, lint and formatting. Inspect language/theme/orientation/viewport/long-text matrix, keyboard, customization and motion locally.
- [x] Independent source/evidence review; fix findings and re-review. Commit locally and leave the documentation preview running on a free port.

API choices: Steps accepts items with id/label/description/status; currentId identifies the single current step independently of an error status. Status=current also works when currentId is omitted (first current only receives aria-current). onStepActivate opts into real buttons for all supplied steps; the caller decides eligibility. Timeline accepts items with id/title/description/timestamp/dateTime/icon/content; timestamp is formatted application text, dateTime is an optional machine-readable HTML date. Empty content is caller-owned. Both roots are native ordered lists with native attributes and refs. Supplied order is always preserved.

References inspected in the local Mac browser: both Formic Steps and Timeline accessible. Inspiration: compact circles and quiet rails; no automatic navigation or entrance replay.

Verification risks: multiple current statuses, explicit currentId plus error, long unbroken mixed-direction content, narrow component containers, native button form behavior, stable item identity after reorder, no trailing rail, live inspector changes.
