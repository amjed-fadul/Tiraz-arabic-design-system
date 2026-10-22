# Independent Select association re-review

Verdict: no actionable findings in the reviewed uncommitted implementation, association tests, or updated AI/API documentation.

Checkout: /Users/amjedfadul/.codex/worktrees/form-foundation/Tiraz
Base/HEAD at review: cf6f173659f22b14030862c331f725ecc5a05631
Hook diff SHA-256: 4ee44f97e9c81557df86e3df9ae1611f56afa9c3cb745a484bab715925602472
No repository files, index, HEAD, branches, dependency files or native methods were modified by this reviewer.

Independent verification:

- Focused Vitest: select-association, select-form-regressions, forms: 59/59 passed (3 files).
- Supplied Chromium association matrix: 36/36 passed, no page errors. Includes repeated replacement following another selection update.
- Additional Chromium DOM-only probes: 6/6 passed, no page errors. Four consecutive replacements per mode/cancellation combination, alternating retained connected and detached historical forms, resetting all historical forms using reset and detached/connected button clicks; current-form reset and callback counts; native late insertion without React rerender.
- Additional synchronous Chromium probes: 16/16 passed. Both public value modes, replacement/late insertion, native cancellation/no cancellation, reset()/button.click(). Insertion/replacement and current-form reset occur in the same browser JavaScript task, with detached previous-form resets before and after current reset. Display/native/FormData/application/callback values all agree after the documented deferred reset completes.

Evidence: matrix/results.json, extra-results.json, synchronous-results.json. Independent probe scripts retained beside their evidence.

Considered and set aside:

- Immediate reads inside a successful reset event or before the next task: the hook intentionally defers application commitment to observe cancellation in both React phases. This is inherited and documented behavior, not a new association regression.
- Controlled owners rejecting the callback: the public contract requires owners to update value after onValueChange. Accepting controlled owners were tested.
- Native validation focus ownership: Select.tsx is unchanged; the existing focused static-validation and cancelled-invalid tests passed in the independent 59-test run. The parent's separate Chromium cancellation/focus and native-validation matrices are additional evidence rather than tests claimed as independently rerun here.
- Old connected and detached form reset requests: specifically tested across repeated replacements and after selected-value changes; no callback or value change occurred.
- Association that appears without a Select rerender: specifically tested with DOM insertion/replacement, including immediate synchronous reset; the document listener resolves current native.form correctly.
- Empty default values, prop/API changes, another browser engine, touch, screen readers, iframe adoption, or modified global native APIs: outside this association-specific diff; no evidence supporting a finding. The reported browser limitation is accurate.

One independent probe initially failed because its broad button locator matched both a retained historical form and the current form. The locator was scoped to #choices and the corrected probe passed; this was a harness error, not a product defect.
