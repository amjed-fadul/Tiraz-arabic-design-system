# Use Tiraz in an application

Tiraz is an Arabic-first, source-owned React dashboard library with **fifteen**
component families: Button, Tabs, Switch, DropdownMenu, Sheet, Toast, Field, Input, Select, Table, DataTable, Badge, Checkbox, RadioGroup and Textarea.
Toast is an imperative hook/provider family, not an exported `Toast` component.
Input is the normal starting point for text entry; use optional label/helper/error
props for a complete labeled control. Field remains a public lower-level composition
helper and is documented under Input rather than a standalone navigation page.

1. Locate the directory containing `index.ts`, `config.ts`, `tokens.css`,
   `components.css` and `ai/`. Call that directory **source root**. In a full
   checkout it is usually `src/system`; a copied library may live anywhere.
   If it is missing, report the gap and request its location instead of
   inventing an import or installing a different library.
2. Read [registry.json](registry.json) for the relevant family and support
   APIs, then inspect the named source and exported types. Every registry path
   is relative to the source root, **not** the application or checkout root.
   The minimal workbench inspector is not a complete API reference.
3. Follow [composition.md](composition.md), map the user's task to available
   components, and connect events to application behavior. Preserve the supplied
   component props and shared settings unless the task requires changing them.
4. Adapt [the compiling usage example](examples/usage.tsx) to the host app.
   Its imports are relative to this bundle; generated workbench snippets use
   `./system` only as an example. Adjust all imports/CSS paths to the located
   source root. Validate the actual rendered result with the checklist below.

## Copy and setup

Copy the **whole source-root directory**, keeping `ai/`, its JSON/Markdown and
`ai/examples/`; tests (`*.test.*`) may be excluded. Do not copy only the barrel
or strip documentation from the bundle. No workbench files, root README or
root AGENTS.md are required to consume it. A host agent entry file may point
at the copied `ai/README.md`.

Use the existing project toolchain. The current checkout uses React/React DOM
19, TypeScript and Vite. Use React 19 for the verified ref-as-prop forwarding
through Button/Switch and Radix triggers; earlier React versions are not
verified. Consumer projects need compatible React compilation,
`lucide-react` and Radix packages for direction, tabs, switch, dropdown-menu,
dialog, toast and select (verified with @radix-ui/react-select 2.4.1). Read the checkout's package/lock files when available;
otherwise inspect imports and resolve compatible dependencies in the host.
No Tiraz installer, CLI, backend or MCP service is needed.

Load the library's `tokens.css` and `components.css` once. Load local IBM Plex
Sans Arabic at weights 400, 500 and 600 (the example imports the corresponding
`@fontsource/ibm-plex-sans-arabic` CSS). Inspect the host font entry; a source
copy does not include `src/main.tsx`. Verify font files load in the browser.
For TypeScript CSS imports, use the host bundler’s declarations (for example,
`vite/client` in Vite), rather than inventing a library API to solve a host
configuration error.

Wrap the interface in `SystemProvider`; configure with
`{ ...defaultConfig, ...overrides }`, not an incomplete config object. Put
`ToastProvider` inside it, and call `useToast` in a descendant. Keep the
provider around overlays so their tokens and direction remain scoped. Set
`lang` on a host ancestor above SystemProvider (or on the document), so sibling
portal and Toast content also inherit the chosen language; setting it only
on `<main>` is insufficient. SystemProvider does not accept a `lang` prop.

The source/type contract wins if metadata drifts. State the discrepancy and
validate against the real implementation; do not silently invent capabilities.

The connected [Create customer example](examples/CreateCustomer.tsx) composes Field/Input/Select/Table with Sheet/Button/Toast. It belongs to the host application and is not a barrel export. Its data lives only while mounted.

Table is a small native HTML foundation. Use [the populated/empty example](examples/TableExample.tsx) for composition; its data stays in the application. Table is not a DataTable or data-grid engine.

DataTable adds client-side text sorting and pagination to Table. Use
[the connected customer example](examples/CustomerDataTable.tsx) for search,
status filtering, create/Toast and row-specific details Sheets. These are
application behaviors, not a general grid API. Explicit populated/loading/empty/
no-results/error presets demonstrate states without fake services.

Badge is static status text, not an action or live region; neutral is the default and success/error/info reuse semantic tokens. CustomerDataTable uses Badge for readable customer statuses.

Use Checkbox for an independent form value, RadioGroup for one choice with native fieldset/legend and a stable shared name, and Textarea for multiline text. [The small preferences form](examples/FeedbackForm.tsx) combines all three with application-owned validation and native submission/reset. These examples are host application code, not barrel exports.
