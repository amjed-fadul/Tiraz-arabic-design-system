# Structure and navigation batch

The user's October 14 brief is the implementation specification. Start at
0808c1a48a552e4920e979b0aea789795742f84a in the isolated local worktree on
codex/structure-and-navigation. Preserve the original checkout and servers.

- [x] Add focused tests before implementation for native Card parts/ref,
      single-open controlled/uncontrolled Accordion and primitive keyboard behavior,
      Breadcrumb navigation/current text, Pagination normalization/range/boundaries.
- [x] Implement Card/CardHeader/CardTitle/CardDescription/CardContent/CardFooter
      using native props/ref and shared tokens. Applications compose actions inside
      header/footer. CardTitle is a native h3; native headings may replace it.
- [x] Implement Accordion(items, value?, defaultValue?, onValueChange?,
      collapsible=false, headingLevel=3, className?) using Radix single/vertical.
      Items have stable unique nonempty value, label, content, optional disabled.
- [x] Implement Breadcrumbs(items, label, native nav props/ref). Ancestors with
      href are links; final item is current-page text. Decorative separators mirror.
- [x] Implement Pagination(page, totalPages, onPageChange, labels, locale?,
      disabled?, native nav props/ref) using Button. Floor finite values, clamp to
      [1, totalPages], normalize nonfinite to 1, cap total at MAX_SAFE_INTEGER.
      At most seven slots; ellipses never interactive. No callback during render.
- [x] Add continuous documentation pages, minimal controls, focused local examples
      with actual reveal/navigation/slicing outcomes, complete code and copied prompts.
- [x] Synchronize public exports, registry, API reference and portable guidance.
      Keep DataTable unchanged; it owns its existing sorting/paging/loading lifecycle.
- [x] Run focused checks, generated and relocated compilation, full unit/build/
      lint/format on this Mac using Node 24. Browser-inspect all requested dimensions,
      live settings, keyboard/focus, reduced motion and Arabic/mixed text.
- [x] Obtain independent review, fix confirmed findings, re-review. Commit locally
      only after verification. Keep dedicated Vite preview running and return its URL,
      checkout, branch, SHA, verification report and screenshots.
