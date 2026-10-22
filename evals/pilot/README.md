# Real-screen diagnostic pilot

See the [pilot report](../../docs/tiraz-ai-pilot-2026-10-22.md) for findings, the fix and verification results.

This pilot uses one fresh-context agent to generate a three-screen business workspace from Tiraz's installed manifest and focused documentation. It is a bounded diagnostic, not a statistically meaningful model benchmark. The explicit user request to keep usage efficient replaces the broader protocol's optional three-trial sampling: one initial generation, independent evaluation, and at most one guided repair.

- `prompt.md` is the exact product brief; the dispatch additionally supplies the temporary consumer directory and write boundaries.
- `app/api.ts` is the evaluator-provided deterministic async service. Failure/hold/cancellation are controlled externally, without timers in generated UI code.
- `app/main.tsx` is the evaluator-provided provider/bootstrap. Generated code must reuse its providers and installed source.
- `initial/` preserves the generated files before compiler/browser feedback.
- `app/Pilot.tsx` and `app/pilot.css` hold the final repaired screen implementation.
- `results/initial/` and `results/final/` hold recorded outcomes; additional regression runs write `.artifacts/pilot`.
- `run.json` records provenance, model visibility limits and unavailable token metrics. No guessed billing or aggregate success rate is reported.

The evaluator installs only the manifest runtime dependency set plus Vite/TypeScript/type packages, pinned to the repository lockfile. The same consumer can be evaluated before and after fixes. Use `npm run test:pilot` to rebuild and test the final screens against current Tiraz. The original brief and first output remain fixed; guided-repair success is not an independent cold-start sample or causal evidence of better model accuracy.

The screens use local fixtures, not real customer or billing data. Their mock service is intentionally controllable by the browser evaluator and must not be used as a production backend.
