# Formic reference inspection

All three supplied pages were available and inspected in the browser before implementation:

- [LoadingState](https://formicai.dev/preview.html#/loadingstate): compact pixel-grid loader, shimmering label and elapsed time, with Drive/Dots/Orbit examples. Changed the playground variant to Dots and inspected the examples visually.
- [ThinkingIndicator](https://formicai.dev/preview.html#/thinkingindicator): small morphing glyph and rotating words, with custom words/text-only examples and replay. Inspected visual states and triggered replay.
- [ThinkingState](https://formicai.dev/preview.html#/thinkingstate): compact summary disclosure above detail content, with steps/search/coding examples and automatic demo progression. Opened the steps disclosure, inspected expanded content and replayed it.

Tiraz adapts the hierarchy and compact disclosure pattern using its own tokens and primitives. It does not copy Formic implementation, elapsed timers, rotating words, automatic execution sequences, simulated logs or reasoning content. ThinkingState presents only brief user-facing activity summaries and details supplied by the application. Its demo starts explicitly and is labeled a local simulation.
