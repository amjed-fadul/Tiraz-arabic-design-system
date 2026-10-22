# Agent evaluation protocol

These are benchmark scenarios, not recorded model results. The deterministic CI checks validate contracts, source installation, compilation and browser behavior. They do not establish that an arbitrary model follows Tiraz guidance.

Run each task in `scenarios.json` against the same clean installed fixture, fixed model/version, tools and task prompt. Save the model configuration, source digest, complete prompt, generated diff, input/output token counts, elapsed time, tool calls and manual corrections. Start with three trials per scenario when a benchmark budget is approved. Keep evaluation tasks separate from examples supplied in context.

Compare a baseline (runtime source and existing README) with treatment (manifest, focused contracts and rules). Do not combine system changes and model changes in one comparison. Supply only the entry index initially; let the agent retrieve the relevant component contract and then full inherited API when needed.

Score each listed check as pass/fail with file or browser evidence. Compile and lint every output. Test keyboard, accessibility names, failed saves, duplicate submits, cancel/reopen, light/dark, RTL/LTR and mobile overflow as applicable. Report first-attempt compile rate, correct component reuse, unsupported-prop rate, verified behavior, corrections, token cost and time. A working screenshot alone is insufficient.

No model benchmark was run as part of this implementation. This keeps the implementation budget focused on deterministic checks; the task set and rubric make a later measurement reproducible.
