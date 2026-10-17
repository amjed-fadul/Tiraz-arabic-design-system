# Live Formic reference inspection — 18 October 2026

All three requested references loaded successfully in the Mac's browser. The
inspection happened before implementation; no reference was unavailable.

- [SelectionActions](https://formicai.dev/preview.html#/selectionactions): a
  compact row beneath the highlighted passage. Default state shows a small edit
  field and Explain/Improve, with More expanding Shorten/Tone/Grammar in the same
  row. Exercised More/Fewer, Explain, the pending/result state, and keyboard
  activation of Discard. Tab moved through ordinary buttons. Its running demo
  simulates rewriting and offers Keep/Discard/Try again; native selection capture
  could not be established from that preselected demo alone.
- [ContextMeter](https://formicai.dev/preview.html#/contextmeter): a 16px ring and
  compact count pair; separate bar examples show a breakdown, model/cost metadata
  and high-usage status. Exercised the 84% and 97% disclosures with Enter, inspected
  their breakdowns, and dismissed with Escape, retaining trigger focus. At 97% the
  reference predicts trimming; Tiraz deliberately makes no such host-behavior claim.
- [ModelSelector](https://formicai.dev/preview.html#/modelselector): compact
  provider mark/name/chevron trigger; provider groups, name/tags, secondary
  description, context/price column and current-choice check. Disabled local
  choice remains visible. Exercised opening, ArrowDown then Enter changing the
  visible choice from Sonnet to Opus, reopening and Escape restoring the trigger.
  An earlier End-key attempt scrolled the continuous reference; Home/End support
  was not established there. Tiraz uses its existing Radix selection behavior.

Tiraz follows this hierarchy with its own semantic tokens, IBM Plex Sans Arabic,
compact controls and shared customization. Deliberate scope differences:

- Selection actions are application callbacks; no editing field, rewrite stream,
  AI execution or automatic replacement. The local example appends/copies/quotes.
- Context uses an explicit keyboard/click disclosure rather than depending on
  hover. Values, estimates, breakdown and metadata are entirely host supplied.
- Model descriptions, tags, context, price and availability are supplied display
  data. Example models are fictional and explicitly labeled as samples.
