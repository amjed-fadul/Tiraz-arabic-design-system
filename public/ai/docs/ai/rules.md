# Tiraz usage rules

- Read the consumer manifest and the relevant component contract before generating code. Use real public exports; report missing capabilities explicitly.
- Runtime TypeScript owns API facts. Authored guidance explains intent. The workbench editor has narrower serializable values and does not define library limits.
- Preserve Radix interaction/focus behavior and provider portal scoping. Do not reimplement an existing control with generic markup.
- Use semantic tokens for design choices. Do not hardcode accent colors to reproduce a screenshot. Theme, accent, density, typography, radius and reduced motion belong to SystemConfig.
- Arabic/RTL is the default. Use logical CSS properties; isolate emails, URLs and identifiers with bdi or explicit direction. Mirror directional icons only; do not mirror logos, numbers or media controls indiscriminately.
- Language, regional locale, numbering system and text direction are separate decisions. Use the application's locale for Intl number/date formatting. Supply translated labels and errors to patterns.
- For invoice detail actions, reuse `InvoiceActions actionsInDetails`; the nested menu shares the toolbar lifecycle. Read the pattern guidance before duplicating async state or importing internal helpers.
- Use callback functions for application actions; do not serialize/evaluate JavaScript strings. Represent async pending/success/error in state; no simulated timers in production save logic.
- Prefer supported props and documented parts. Do not assume every component accepts className, children, ref, asChild or all native attributes.
- Ensure icon-only actions have accessible names, form inputs have labels, and errors persist near the relevant form. Toasts supplement persistent errors.
- Validate generated code in the actual consumer. Compile, test meaningful interactions and inspect RTL/LTR, light/dark, keyboard focus, reduced motion and long labels. Automated axe results do not establish full accessibility conformance.
