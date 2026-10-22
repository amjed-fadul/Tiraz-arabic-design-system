# Feedback and Avatar photos

Start at `96d14668b6e2011b2b42dd0c792582d4ee9d82ba` on the isolated Mac checkout and `codex/feedback-and-avatar-photos`. Preserve original checkout/index/edits/servers. Commit locally after verification; no publishing or next batch.

- [x] Baseline and source/portable contract inspection; baseline unit check.
- [x] Focused red/green tests and small implementations: Alert(title, description?, tone?, action?, announcement='off'|'polite'|'assertive'); Skeleton(shape='text'|'rectangle'|'circle', style?, className?); Progress(label, value?, showValue?, locale?); Spinner(label or decorative=true, size='sm'|'md'). No new dependency/framework/state system.
- [x] Original fictional photo portraits, local assets with provenance/license; initials/photo choice and optional src URL in Avatar docs; individual and mixed-group photos. Preserve Avatar API/implementation. Generated code imports bundled assets, retains license guidance, and reflects selection.
- [x] Four focused continuous documentation pages, minimal controls, explicit application actions without services/timers; API tables, barrel, registry, portable examples/guidance synchronized.
- [x] Focused and full local checks, generated/relocated source and asset compilation, build/lint/format; Arabic/English/light/dark/density/text/viewport/motion/live-customization browser checks with captures.
- [x] Independent review, fixes and re-review; local commit, reachable preview left running, final SHA/report/screenshots.

Progress uses 0–100: finite values clamp, zero/completion are preserved, missing/null/nonfinite values are indeterminate and never set aria-valuenow. Optional percentages use Intl.NumberFormat and caller locale (default follows system direction). Alert tone never chooses urgency; static default has no live role, polite uses status, assertive uses alert. Skeleton is always decorative and host owns aria-busy/loading text. Spinner requires an accessible label unless decorative and reuses the existing spinner glyph/rotation; reduced motion leaves an understandable static glyph. Semantic feedback colors use existing neutral/success/error/info tokens independently of accent.
