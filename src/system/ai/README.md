# Use Tiraz in an application

Tiraz is an Arabic-first, source-owned React dashboard library with **twenty**
component families: Button, Tabs, Switch, DropdownMenu, Sheet, Toast, Field, Input, Select, Table, DataTable, Badge, Checkbox, RadioGroup, Textarea, Avatar, AvatarGroup, Tooltip, Modal and EmptyState.
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
dialog, toast, select and popper (verified with @radix-ui/react-select 2.4.1). Read the checkout's package/lock files when available;
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

Use Checkbox for an independent form value, RadioGroup for one choice with native fieldset/legend and a stable shared name, and Textarea for multiline text. [The small preferences form](examples/FeedbackForm.tsx) combines all three with application-owned validation. Its Check form action checks required notes and reports the validation result; native reset restores the controls. These examples are host application code, not barrel exports.

Use Avatar with name and an explicit fallback for deliberate Arabic initials. Its internal image/fallback is decorative; the outer span announces name once. Set decorative when equivalent adjacent text supplies that name. No remote image is required: [AvatarExamples](examples/AvatarExamples.tsx) uses a local SVG portrait.

AvatarGroup composes members with stable unique id, name and optional src/fallback. Supply a group label and translated overflowLabel(count). The +N indicator is static; hidden member names remain available. [OverlayExamples](examples/OverlayExamples.tsx) contains a team, a Tooltip details toggle and one Modal display preview. Select and menu actions change/reset that preview; no values are persisted.

Tooltip accepts a focusable trigger and short string content. It preserves refs, handlers, names and external description IDs; hover waits 500ms, keyboard focus opens immediately, Escape dismisses it before a surrounding dialog. Use the already installed @radix-ui/react-popper positioning primitive (verified 1.4.0); source consumers need it explicitly along with the dependencies above. It portals into the nearest SystemProvider/Sheet/Modal.

Modal uses the same installed Radix Dialog as Sheet, with required trigger, title, description, closeLabel and children; footer and initialFocusRef are optional. Omit open for internal state, or update controlled open in onOpenChange. There is no defaultOpen. Use Radix Dialog.Close asChild for footer dismissal in either mode. Keep its trigger mounted. Nested non-dialog overlays stay scoped inside content. Use one centered dialog; no stack or global manager.

EmptyState requires title; description, illustration and action are optional. Custom illustration content is decorative and must contain no focusable controls. NoRecordsIllustration, NoSearchResultsIllustration and GettingStartedIllustration are original text-free token-based SVG exports. [EmptyStateExamples](examples/EmptyStateExamples.tsx) shows all three and an application action that reveals a small guide with a working Back action. Omit illustration for text-only content. EmptyState performs no data operation.

### Shared Radix overlay infrastructure

Source-only copies do not carry the repository package.json. For the verified Dialog 1.3.0, DropdownMenu 2.2.0, Toast 1.3.0 and Select 2.4.1 graph, preserve these npm overrides in the **host application's** package.json (or the host package manager's equivalent resolutions), then reinstall with the host toolchain:

```json
{
  "overrides": {
    "@radix-ui/react-dismissable-layer": "1.2.1",
    "@radix-ui/react-focus-scope": "1.3.1"
  }
}
```

These patches are already used by Select. Without a single resolved copy of each primitive, Radix layers maintain separate contexts: Escape in Select can dismiss its surrounding dialog too. Inspect the installed graph (`npm ls @radix-ui/react-dismissable-layer @radix-ui/react-focus-scope` for npm); verify nested Select Escape closes only Select, restores its trigger, then a second Escape closes Sheet/Modal. The required source dependencies include @radix-ui/react-popper 1.4.0 for Tooltip. Do not strip this dependency guidance when copying ai/.
