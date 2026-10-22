# Tiraz: AI readiness research and architecture review

Research and local review: **22 October 2026**.

**Recommendation:** retain Tiraz’s source-owned React components, Radix behavior, scoped CSS, and Arabic-first defaults. Build a versioned, machine-readable description of the system around them. Use that description to supply focused documentation, reproducible installation, composition examples, and validation. Add a dedicated MCP server only when it provides capabilities beyond those simpler delivery mechanisms.

Tiraz already supports assisted component use. It does not yet provide a complete, portable workflow for an agent to discover, adopt, compose, and verify the system in another application. That is the main opportunity.

## Scope and evidence

The comparison covers shadcn/ui, Material UI, Chakra UI, Ant Design, IBM Carbon, Adobe React Spectrum/React Aria, and Atlassian Design System. These are an established, representative sample, not a measured popularity ranking. Panda CSS, Storybook, Figma Code Connect, and DTCG specifications provide additional architectural references.

External findings come from official documentation, specifications, and first-party engineering explanations. Published capabilities were researched; the external MCP servers and commercial features were not installed or benchmarked. Availability and documentation were checked on the review date. A vendor’s assertion of better AI output is not evidence of a measured improvement for Tiraz.

The local audit covers the working tree at `/Users/amjedfadul/Tiraz`, based on commit `ce78408`, including existing local changes in `README.md` and `src/workbench/workbench.css`. The six components, provider, tokens, component styles, public exports, workbench catalog/models/API tables/generators, test code, build configuration, and adoption instructions were inspected. No runtime source was changed for this review.

No Tiraz Figma file was supplied or inspected. The absence of local Code Connect mappings establishes a repository gap, not the absence of a separate design library. Historical browser evidence was inspected as historical evidence; browser, screen-reader, physical-device, and fresh-consumer installation tests were not rerun here.

## 1. What the reference systems actually do

### shadcn/ui: source distribution plus project awareness

**Construction.** shadcn presents open component source, consistent composition interfaces, default styling, and a distribution schema. Its registry items describe files, item types, package dependencies, registry dependencies, and optional CSS variables. This makes a component a deliverable with known prerequisites. [Introduction](https://ui.shadcn.com/docs), [registry item specification](https://ui.shadcn.com/docs/registry/registry-item-json).

**AI layer.** Its MCP supports discovering and installing registry items. A compatible custom registry can use this infrastructure. Its skill reads project configuration, including aliases, installed components, framework, and underlying component library, then retrieves relevant component documentation. This matters because correct code depends on the consumer’s actual project. [Registry MCP](https://ui.shadcn.com/docs/registry/mcp), [agent skills](https://ui.shadcn.com/docs/skills).

**Lesson for Tiraz.** Preserve source ownership. Add a dependency-aware registry and an installed-project manifest. Tiraz can borrow the delivery model without adopting shadcn’s visual language or replacing Radix. Compatibility must be tested with Tiraz’s scoped styles, fonts, and provider bootstrap; a registry entry alone does not establish it.

### Material UI: a stable component API with authoritative documentation retrieval

**Construction.** MUI supports theme-level component defaults, slot-specific style overrides, and variants. This creates named, intentional customization points rather than requiring every consumer to discover DOM selectors. [Themed components](https://mui.com/material-ui/customization/theme-components/).

**AI layer.** The official MCP retrieves MUI documentation and examples. Its guidance explicitly describes an iterative documentation workflow: retrieve relevant package documentation, then follow returned documentation URLs. It is chiefly an authoritative knowledge interface; that does not itself prove application correctness. [MUI MCP](https://mui.com/material-ui/getting-started/mcp/).

**Lesson for Tiraz.** State the supported customization surface for every component. Agents need to know whether `className` targets a root, a wrapper, or an internal control, and whether a prop is intentionally unavailable. Maintain version-matched API references and a clear retrieval entry point.

### Chakra UI: tokens, recipes, and focused component tools

**Construction.** Chakra separates tokens, semantic tokens, text/layer styles, conditions, component recipes, and slot recipes. Recipes encode base styles, variants, compound variants, and defaults. Generated typings and strict-token settings can constrain permitted style values. [Theming architecture](https://chakra-ui.com/docs/theming/overview), [recipes](https://chakra-ui.com/docs/theming/recipes).

**AI layer.** Its MCP exposes component listing, prop lookup, examples, theme lookup, customization guidance, and migration guidance. Pro template retrieval has a separate license requirement. [Chakra MCP](https://chakra-ui.com/docs/get-started/ai/mcp-server).

**Lesson for Tiraz.** Make variants, defaults, token roles, and component parts explicit data. An agent should retrieve one component contract and its relevant tokens, rather than infer the entire system from CSS. Tiraz does not need to migrate to Chakra or a CSS-in-JS engine to gain this structure.

### Ant Design: token derivation, component semantics, and version-aware tools

**Construction.** Ant’s theme model distinguishes seed, map, and alias tokens, with component-level token customization and algorithms for theme variation. This makes relationships between design decisions explicit. [Theme architecture](https://ant.design/docs/react/customize-theme/).

**AI layer.** The official CLI/MCP documents tools for component lists, prop specifications, docs, demos, token values, design language, semantic DOM, and changelogs. Its MCP configuration supports selecting an Ant Design version. It also offers documentation files as an alternative to MCP. [Official MCP documentation](https://ant.design/docs/react/mcp/).

**Lesson for Tiraz.** Provide structural information as well as props: component parts, styling boundaries, required providers, event behavior, and version changes. An answer that is correct for another library version is still wrong for the installed project.

### IBM Carbon: design guidance, contextual tokens, and review tools

**Construction.** Carbon connects foundations, components, patterns, and data visualization. Its color system distinguishes explicit layer tokens from contextual tokens whose resolved values depend on nesting. This is useful when reusable components appear on different surfaces. [Development overview](https://www.carbondesignsystem.com/getting-started/developing/overview), [color and layering](https://www.carbondesignsystem.com/building-blocks/foundations/color/guidelines).

**AI layer.** Carbon documents separate documentation search, code search, chart retrieval, experimental-component search, and `code_audit`. The overview still lists Carbon Patterns context and some migration capabilities as planned; those should not be assumed to be fully available today. The concepts page documents Labs search while the overview discusses further Labs updates. [MCP concepts](https://www.carbondesignsystem.com/getting-started/carbon-mcp/concepts), [MCP overview and roadmap](https://www.carbondesignsystem.com/getting-started/carbon-mcp/overview).

**Lesson for Tiraz.** Deliver usage guidance and a verification loop alongside examples. A model-generated audit should complement deterministic checks, not substitute for compilation, browser tests, and accessibility review.

### Adobe React Spectrum / React Aria: separate behavior from presentation

**Construction.** Adobe’s foundational architecture separates state management, accessible behavior, and rendered components. React Spectrum supplies Adobe’s design system, while React Aria allows other systems to reuse interaction behavior. Spectrum’s current styling documentation also provides token-based style macros. [Architecture explanation](https://react-aria.adobe.com/blog/introducing-react-spectrum), [Spectrum styling](https://react-spectrum.adobe.com/styling).

**AI layer.** Both current documentation sites describe agent skills, MCP access, per-page Markdown, copy-for-LLM controls, and `llms.txt` indexes. [React Spectrum AI guidance](https://react-spectrum.adobe.com/ai), [React Aria AI guidance](https://react-aria.adobe.com/ai).

**Lesson for Tiraz.** Retain the separation between proven interaction primitives and Tiraz styling. Add small, directly retrievable documentation pages. A useful baseline should work even when a consumer has no MCP connection.

### Atlassian: constrained layout composition and enforceable conventions

**Construction.** Atlassian provides layout primitives such as Box, Inline, and Stack, with additional layout tools. These give teams a shared way to assemble screens. Its development guidance includes design-system lint tooling. [Primitives](https://atlassian.design/components/primitives/overview), [development setup](https://atlassian.design/get-started/develop/atlassians).

**AI layer.** Atlassian documents a public CLI and MCP for structured content. Its listed internal skills are currently private to Atlassian, an important distinction from the public tooling. It recommends selecting relevant skills and keeping them updated. [Working with AI](https://atlassian.design/get-started/develop/with-ai).

**Lesson for Tiraz.** Give agents a small layout vocabulary and enforceable rules. Separate component knowledge, style rules, and task-specific instructions so every request does not receive the whole system.

### Supporting infrastructure worth learning from

| Reference | Documented capability | Application to Tiraz |
| --- | --- | --- |
| Panda CSS | Queries the project’s resolved tokens, recipes, patterns, conditions, and usage through MCP | Expose the consumer’s resolved configuration, not only upstream defaults. [Panda MCP](https://panda-css.com/docs/get-started/mcp-server) |
| Storybook | Generates component/docs manifests and supplies agent tools for documentation, stories, and testing | Reuse executable examples as evidence. Manifest support depends on framework/configuration; related APIs are documented as preview. [AI overview](https://storybook.js.org/docs/ai), [best practices](https://storybook.js.org/docs/ai/best-practices) |
| Figma Code Connect | Supplies real code references and implementation snippets for mapped design components | Map Tiraz variants and properties to its actual public API. Keep mappings versioned and current. [Code Connect integration](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/) |
| DTCG | Specifies exchangeable typed token data and resolution across contexts | Adopt a portable token representation when generating CSS, design-tool exports, and token documentation. The 2025.10 final reports are stable community specifications, not W3C Recommendations. [Format](https://www.designtokens.org/TR/2025.10/format/), [resolver](https://www.designtokens.org/TR/2025.10/resolver/) |

## 2. The layers that make a system effective for AI

The following model is my synthesis of the evidence, not a universal industry standard. A system can implement these responsibilities with different tools.

| Layer | What it tells the agent | Failure it prevents |
| --- | --- | --- |
| 1. Product intent | What the system is for, design principles, supported use cases, exclusions | Producing a generic interface that ignores the product |
| 2. Foundations | Token roles, values, aliases, themes, density, typography, motion | Arbitrary colors and spacing; broken theme combinations |
| 3. Component contracts | Exact imports, props, defaults, parts, states, events, prerequisites | Invented props, missing providers, inconsistent composition |
| 4. Patterns | Approved combinations for real tasks and their responsive/state behavior | Individually correct controls assembled into a poor screen |
| 5. Retrieval | Searchable index, concise Markdown, structured component/token records | Reading too much irrelevant material or guessing from memory |
| 6. Project integration | Installed revision, paths, aliases, dependencies, CSS/fonts, client boundaries | Code that only works in the library’s own demo |
| 7. Design-to-code mapping | Component identities, variant mappings, token bindings | Recreating existing components from visual appearance |
| 8. Verification | Compilation, interactions, accessibility, screenshots, policy checks | Plausible code that fails when used |
| 9. Maintenance | Releases, migrations, deprecations, ownership, generated-artifact freshness | Documentation and examples drifting away from implementation |

MCP is one delivery mechanism for layers 5–8. It does not create the underlying knowledge. Likewise, `llms.txt` is a documentation index, not a schema validator or a guarantee that agents will read it.

For efficiency, use **progressive retrieval**: a small index first; one contract next; a focused example and only the needed token or pattern details after that. Include source revision and project context. Evaluate whether this reduces corrections and context use; do not assume that a longer prompt or more tools improves results.

## 3. Tiraz’s present strengths

**A small, understandable runtime.** Six components live separately from the workbench and are exported through one entry point. This gives agents a tractable implementation to inspect. The source-owned approach is an advantage, especially for a young system. [Public exports](/Users/amjedfadul/Tiraz/src/system/index.ts:1).

**Useful constraints already exist.** Button variants and states are finite unions. Icon-only buttons require an `aria-label` in TypeScript. Loading blocks repeated clicks and exposes busy state. Switch requires a label and excludes unsupported `children`/`asChild` usage. These constraints are more reliable than prose alone. [Button](/Users/amjedfadul/Tiraz/src/system/Button.tsx:3), [Switch](/Users/amjedfadul/Tiraz/src/system/Switch.tsx:5).

**Arabic and direction are architectural decisions.** The provider propagates direction and applies scoped configuration. Logical CSS properties appear throughout the component styles, and examples isolate mixed-direction content. This is a strong foundation for Arabic business software. It should be preserved and made explicit in machine-readable guidance. [Provider](/Users/amjedfadul/Tiraz/src/system/Provider.tsx:7), [component styles](/Users/amjedfadul/Tiraz/src/system/components.css:24).

**Theme and overlay context are handled deliberately.** Menus portal into the system container. Sheet supplies an inner portal container for nested overlays. This is important behavior an agent should reuse, rather than recreate. [DropdownMenu](/Users/amjedfadul/Tiraz/src/system/DropdownMenu.tsx:31), [Sheet](/Users/amjedfadul/Tiraz/src/system/Sheet.tsx:28).

**Semantic CSS tokens are already present.** Surfaces, text, feedback colors, focus, spacing, typography, density, motion, and paired accents exist. The system needs structured descriptions and provenance around these decisions, rather than a replacement palette. [Tokens](/Users/amjedfadul/Tiraz/src/system/tokens.css:1), [configuration](/Users/amjedfadul/Tiraz/src/system/config.ts:1).

**Generated examples are tested.** The generator produces concrete TSX and current configuration. Tests compile generated modules under strict TypeScript and verify portable prompt paths. Workbench validation rejects unsupported attributes and malformed collections. This is a valuable starting point for an AI evaluation and artifact-generation pipeline. [Generated-code tests](/Users/amjedfadul/Tiraz/src/workbench/generated-code.test.ts:10), [prompt tests](/Users/amjedfadul/Tiraz/src/workbench/generate-prompts.test.ts:23), [validation](/Users/amjedfadul/Tiraz/src/workbench/model.ts:264).

## 4. The main gaps, with specific evidence

### A. Knowledge is distributed across manually maintained representations

The catalog contains IDs, bilingual names/descriptions, and source filenames. Inspector fields separately enumerate choices. API tables contain handwritten type descriptions. Models, defaults, validation, and the generator maintain further representations of the same concepts. For example, Button variants exist in the runtime type and are repeated in inspector options and example rendering. [Catalog](/Users/amjedfadul/Tiraz/src/workbench/catalog.ts:2), [fields](/Users/amjedfadul/Tiraz/src/workbench/fields.ts:78), [API table](/Users/amjedfadul/Tiraz/src/workbench/ApiReference.tsx:15).

This is a **drift risk**, not proof that every current representation is wrong. An MCP server built directly on these separate sources would inherit that risk.

**Improve:** create one generated component contract per public component, supplemented by authored usage guidance. Derive types from exported TypeScript; share variant constants where useful; validate defaults and examples against the public API. Generate the catalog, API reference, Markdown, and registry metadata from those records where practical. Keep behavioral explanations authored and reviewed; type extraction cannot infer intent.

### B. Prompt portability covers relocated repositories, not adopted components

The adoption instructions say to copy `src/system`, excluding tests. The prompt asks the agent to locate the Tiraz root and read its README, `src/system`, and `src/main.tsx`, then create `src/Example.tsx`. Generated imports assume `./system`. A consumer following the copy instructions may have neither the workbench nor Tiraz’s original main entry or README. [Adoption instructions](/Users/amjedfadul/Tiraz/README.md:82), [generator](/Users/amjedfadul/Tiraz/src/workbench/generate.ts:146).

The relocation test copies the generator and checks identical output in another directory. That establishes independence from an absolute machine path; it does not establish compatibility with a different consumer layout.

**Improve:** distribute an installed-project manifest recording the system location, import entry, styles, fonts, version/revision, and integration mode. Separate “try this example in the Tiraz workbench” from “use this component in my existing application.” Resolve the consumer’s paths and reuse its existing provider. Do not always emit another standalone demo or force a fixed output filename.

### C. Public machine-readable discovery is missing

The inspected checkout has no `llms.txt`, per-component static Markdown API corpus, structured public component manifest, registry, MCP implementation, or portable consumer instruction bundle. The existing catalog is useful internal UI data, but lacks the contracts and dependencies needed for external use. A `.claude/launch.json` exists; it is launch configuration, not a system knowledge package.

**Improve:** start with a small index and six generated component pages containing exact APIs, examples, usage decisions, and prerequisites. Add a concise consumer `AGENTS.md` or installable skill after its referenced artifacts actually exist. Existing tests intentionally reject invented instruction paths; preserve that intent when updating them.

### D. Tokens have values but limited explicit semantics and provenance

CSS custom properties and accent values in TypeScript are the current sources. Their purposes are largely inferred from names. Some component-specific values remain literal: menu width, Sheet width, overlay z-index values, switch dimensions, and spinner duration. [Tokens](/Users/amjedfadul/Tiraz/src/system/tokens.css:1), [component metrics](/Users/amjedfadul/Tiraz/src/system/components.css:214).

Literal values are not inherently wrong. A one-pixel border or implementation-specific transform does not automatically need a global token.

**Improve:** define token types, semantic roles, aliases, modes, and intended scope. Extract repeated or intentionally configurable component decisions into named tokens. Generate existing CSS names initially to preserve compatibility. Establish which values are fixed engineering details and which are supported design choices.

### E. Examples have not become reusable product patterns

There are meaningful examples, including editing customer data in a Sheet. However, the form and its layout live in the workbench, use native inputs, and depend on workbench classes. The public library exports six controls, with no field, layout, page, or business-pattern layer. [Editable Sheet example](/Users/amjedfadul/Tiraz/src/workbench/Examples.tsx:43), [public exports](/Users/amjedfadul/Tiraz/src/system/index.ts:1).

An agent asked for an invoice screen must invent much of the composition. This can produce inconsistent screens even if every Button is correct.

**Improve:** first establish a minimal layout and form vocabulary, then extract three complete patterns with independent styles and explicit states. Good starting candidates are customer editing, preference settings, and invoice row actions/details. Add missing controls according to these tasks rather than building a large catalog speculatively.

### F. Composition boundaries need clearer contracts

Tiraz’s constrained, data-driven interfaces are useful: Tabs receives items; DropdownMenu receives actions; Sheet receives trigger/content/footer. There is no need to convert everything into compound components.

There are important differences agents must understand: Switch’s `className` affects its wrapper while native attributes apply to its control; DropdownMenu exposes neither general `className` nor arbitrary children; Sheet’s `side` is physical `left`/`right`, with a directional default. Generated Sheet footers import `Close` from Radix directly. [API reference](/Users/amjedfadul/Tiraz/src/workbench/ApiReference.tsx:15), [Sheet generator](/Users/amjedfadul/Tiraz/src/workbench/generate.ts:129).

**Improve:** document parts, prop targets, provider requirements, state ownership, and intentionally unsupported features. Consider exporting a stable Tiraz `SheetClose` helper. Add logical `start`/`end` placement only through an explicit compatibility plan. Document that successful saves may close a panel, while failed saves should preserve the form and display feedback.

### G. Agent-facing serialization must not confuse demo controls with runtime APIs

The workbench models represent labels/content as strings and actions as presets. Public components accept richer React nodes and callback functions. Collection validation limits editor collections to 12 entries; the runtime component types do not impose that limit. The generator accepts a component ID and an independently typed union of models, then casts inside branches. [Models](/Users/amjedfadul/Tiraz/src/workbench/model.ts:16), [collection validation](/Users/amjedfadul/Tiraz/src/workbench/model.ts:297), [generator signature](/Users/amjedfadul/Tiraz/src/workbench/generate.ts:38).

**Improve:** distinguish the full React API from a serializable configuration format and from workbench-only controls. Use a discriminated request type that binds component identity to the correct model. Describe callback signatures; do not represent executable functions as JSON strings. An agent spec must not incorrectly advertise the workbench’s 12-item editor limit as a library restriction.

### H. Verification exists, but is not yet an adoption or agent-quality gate

The project has substantial unit, interaction, generator, and browser-test code. However, `package.json` exposes no browser-test command, Playwright is not declared there, no repository CI workflow was found, and the lint rules do not enforce Tiraz token/component conventions. Historical accessibility results exist, but the inspected executable tests do not provide a current integrated axe gate. [Package scripts](/Users/amjedfadul/Tiraz/package.json:6), [browser harness](/Users/amjedfadul/Tiraz/tests/browser/customization.mjs:1), [lint configuration](/Users/amjedfadul/Tiraz/.oxlintrc.json:1).

The main app TypeScript configuration does not enable `strict`, though generated-code tests do. A separate strict check passed during this review, so enabling it appears to be a small, worthwhile next step. [App configuration](/Users/amjedfadul/Tiraz/tsconfig.app.json:2).

**Improve:** make checks reproducible from a fresh checkout and run a real consumer fixture outside the workbench. Add contract/docs freshness checks, deterministic lint rules, and an agent task benchmark. Keep manual screen-reader and device checks distinct from automated accessibility scans.

### I. Version and compatibility information is insufficient for external adoption

The package is private and has version `0.1.0`; the public distribution method is source copying. This is a legitimate development state, but copied code has no installed revision record or upgrade/diff workflow. No tested framework support matrix is documented beyond the current React/Vite workbench.

**Improve:** record the source revision, file checksums, schema version, tested dependency ranges, and supported environments in the installed manifest. Treat Vite/React as the initial verified target. If Next.js or other server-rendered environments matter, add client boundaries and SSR/hydration tests before claiming support. Do not infer Next.js support from the current Vite build.

### J. Arabic-first guidance should become a reusable product capability

Direction, Arabic typography, and mixed-direction examples are implemented, but there is no separate language/layout/content contract for agents to query.

**Improve:** explicitly specify logical spacing and alignment, directional icons versus non-directional icons, email/URL/identifier isolation, long Arabic labels, and locale-sensitive number/date formatting. Locale should not be inferred solely from text direction: Arabic users can have different regional and numbering preferences. Keep API identifiers stable in code, while supporting Arabic and English search aliases and guidance.

## 5. A concrete target architecture

The proposed structure below describes responsibilities, not a requirement to reorganize the repository immediately.

```text
Runtime TypeScript APIs + authored guidance + token definitions + tested examples
                                  |
                         build / validate metadata
                                  |
               versioned component and system knowledge
                    /              |               \
             workbench       Markdown / index    registry items
                    \              |               /
                     project-aware agent workflow
                                  |
               compile + interaction + visual + accessibility checks

Optional adapters: Figma Code Connect; focused Tiraz MCP tools
```

Suggested artifacts:

| Artifact | Responsibility |
| --- | --- |
| `tiraz.project.json` | Consumer paths, installed revision, provider entry, style/font bootstrap, tested framework |
| `system.manifest.json` | Available components/patterns, capabilities, supported configuration, schema version |
| `components/button.json` and peers | Generated API facts plus authored intent, prerequisites, parts, examples, constraints |
| `tokens/*.tokens.json` | Typed token definitions and aliases; mode resolution documented separately |
| `docs/ai/*.md` and `llms.txt` | Focused, directly readable documentation and index |
| `examples/*.tsx` | Small compiling examples, with separate application integration examples |
| `patterns/*` | Reusable product compositions with state and layout guidance |
| Registry build output | Files and dependencies for source installation, generated from the same knowledge |
| `evals/*` | Repeatable tasks and objective checks for agent output |

**Keep ownership explicit.** Runtime TypeScript owns prop types. Token definitions own design values. Authored guidance owns when/why rules. Examples own executable demonstrations. Generated output is not edited independently. CI should fail when regeneration changes committed artifacts unexpectedly.

An illustrative Tiraz-specific component record could contain:

```json
{
  "schemaVersion": "1",
  "id": "button",
  "exportName": "Button",
  "source": "src/system/Button.tsx",
  "searchAliases": { "ar": ["زر", "إجراء"], "en": ["button", "action"] },
  "intent": "Trigger an action in the current workflow.",
  "avoidFor": ["Navigation requiring link semantics"],
  "prerequisites": ["system-provider", "system-styles", "font-bootstrap"],
  "apiContract": "./generated/button.api.json",
  "rules": [
    { "id": "icon-name", "description": "Icon-only usage requires an accessible name." },
    { "id": "loading", "description": "Loading blocks clicks and exposes busy state." }
  ],
  "examples": ["button-basic", "button-async-save", "button-icon-only"],
  "sourceRevision": "<revision inserted by the build>"
}
```

This is a proposed Tiraz metadata format, not the shadcn registry schema and not a substitute for the full TypeScript API. A generator should translate the relevant delivery fields into a valid registry item.

For tokens, preserve a small, intentional hierarchy:

1. **Reference values:** palette, spacing scale, typography, timing.
2. **Semantic roles:** action background, text, border, error feedback, focus.
3. **Component decisions:** specific dimensions or state treatments where a stable customization point is useful.

Do not create every possible token in all three layers. Generate the existing `--action`, `--surface`, and other CSS names initially. Describe mode precedence: theme plus accent resolves action color; density affects control metrics; typography affects text sizes; OS reduced-motion preference remains effective. Use DTCG-compatible representation where feasible; document build-specific expressions such as `color-mix()` and calculated dimensions rather than claiming every CSS expression is directly portable.

## 6. Delivery choices and tradeoffs

**First: portable files and focused instructions.** A consumer should be able to use Tiraz with local files and ordinary repository tools. Put invariant rules in a short instruction entry and link to focused references. Include exact provider/font setup, supported APIs, required checks, and behavior when a requested component is absent.

**Then: a shadcn-compatible registry if Tiraz will be adopted across projects.** This is the closest match to its existing source-copy model. Start with a complete system/base delivery because today’s barrel exports and shared styles bind the six components together. Split component installs only after dependency closure is tested. Explicitly include fonts, hooks, configuration, direction support, CSS, and required Radix/Lucide dependencies. Avoid pulling workbench dependencies into consumer code unnecessarily.

**Storybook is an option, not a prerequisite.** Keep the useful workbench. Shared TSX examples can later feed both it and Storybook. Choose Storybook when its manifest, testing, and visual-review infrastructure saves maintenance; do not create a second independently maintained documentation system just to obtain an MCP endpoint. Its current manifest caveats should inform that decision. [Storybook AI best practices](https://storybook.js.org/docs/ai/best-practices).

**Add a dedicated Tiraz MCP when project-specific queries justify it.** Proposed operations are `search_components`, `get_component`, `get_pattern`, `get_tokens`, and `get_project_context`. Responses should include revision, relevant prerequisites, and source links. Query only the requested portion. Deterministic validation can begin as ordinary scripts, with an MCP adapter later. A generic registry MCP handles discovery/delivery; it will not automatically understand all Tiraz-specific usage policies.

**Figma mapping follows stable APIs.** If a Tiraz Figma library exists, align component names and properties, bind variables, and map design variants to code. Begin with the six existing components and verify generated snippets against them. Code Connect improves the context given to an agent; the agent still generates and verifies the implementation. [Figma’s division of responsibilities](https://developers.figma.com/docs/figma-mcp-server/mcp-vs-agent/).

## 7. Recommended implementation milestones

| Priority | Work | Done when |
| --- | --- | --- |
| P0: trustworthy contracts | Generate six component records; add concise usage/avoidance guidance; distinguish demo and public APIs; enable strict checking; investigate timing-sensitive tests | Every record resolves to real exports; examples compile; generated docs match types; test failures are understood |
| P0: portable adoption | Add consumer manifest and complete bootstrap; separate workbench prompts from application prompts | A clean consumer outside this repository renders and operates all six components using documented steps |
| P1: readable knowledge | Generate per-component Markdown, an index, and a small instruction bundle | A fresh agent can find correct props, setup, and examples without browsing the workbench UI |
| P1: composition and tokens | Add minimal layout/form foundations; formalize token roles; extract three independent patterns | Patterns work without workbench CSS and cover error/loading/empty states where applicable in both directions |
| P1: reproducible quality | Add browser scripts/dependencies and CI; integrate accessibility and freshness checks | A clean checkout runs the documented gates, including consumer and generated-artifact tests |
| P2: distribution | Publish a tested source registry with revision/dependency metadata | Install, compile, and render work in a fresh supported project, with a clear update/diff path |
| P2: design/tool adapters | Add Code Connect and focused MCP capabilities if needed | They retrieve or generate the correct installed API and demonstrably improve the task benchmark |

The first complete slice should be **Button + SystemProvider + font/CSS bootstrap + one strict consumer fixture + one generated contract/page**. Use it to validate the pipeline, then expand to all six. Include an overlay and a toast early enough to expose provider and portal assumptions. Do not use Button alone as proof that the full system is portable.

For product breadth, prioritize the controls needed by the first patterns: field/label/help/error, input, checkbox/select as required, a small layout vocabulary, and status/empty/loading presentations. Add a table or advanced selection component when the targeted invoice/customer workflow needs it. A large inventory of isolated components would leave the composition problem unresolved.

## 8. How to prove the improvements work

Define a task suite before adding more AI tooling. Suggested scenarios:

| Task | Evidence of success |
| --- | --- |
| Add an async save action | Correct Button API; no duplicate submission; failure feedback; no demo timers in production logic |
| Add an icon-only action | Accessible name; correct icon treatment; keyboard operation |
| Implement notification settings | Labeled Switch; controlled state correctly wired; persistence supplied by the application |
| Show customer details with tabs | Unique values; keyboard behavior; appropriate active state |
| Add row actions | Valid menu items; disabled/destructive handling; callbacks connected |
| Open an edit Sheet | Correct labels and focus; successful save closes; failed save retains entered data |
| Open a menu inside a Sheet | Scoped tokens and nested focus/portal behavior remain correct |
| Emit sequential toasts | Correct provider; queue/expiry/dismissal behavior; no lost caller state |
| Change theme/accent/density | Uses system configuration; avoids local style overrides that break consistency |
| Compose mixed Arabic/Latin content | Logical layout; readable labels; identifiers/URLs isolated appropriately |
| Integrate in a new app | Correct real paths, imports, dependency versions, fonts, styles, and provider |
| Request an unavailable control | Agent reports the gap and follows the agreed extension policy without inventing a Tiraz export |

Run language-sensitive cases in Arabic and English. Use both themes and directions for deterministic component tests, with a focused cross-mode browser matrix for overlays, typography, and reduced motion. Include actual Arabic generator output in compilation tests: the current generated-module matrix constructs bilingual models but passes `"en"` to `generateCode` for every compiled module. [Compilation call](/Users/amjedfadul/Tiraz/src/workbench/generated-code.test.ts:85).

Compare the same tasks under three conditions: current source/README; structured docs/contracts; structured docs plus registry/MCP. Hold model version, task text, starting repository, and tool permissions constant. Repeat runs and record failures rather than reporting only the best output.

Measure first-pass compilation, unknown props/imports/tokens, required human corrections, interaction failures, RTL/accessibility defects, context tokens, retrieval calls, and elapsed time. Use independent behavior checks and human design review; a passing type-check cannot establish appropriate layout or component choice. Define thresholds after the baseline, rather than inventing expected percentage improvements.

## 9. Verification performed in this review

| Check | Observed result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run build` | Passed TypeScript build and Vite production build |
| Initial `npm test` | 77 passed, 2 failed, out of 79 |
| Isolated overlay test file | All 13 passed |
| Second full `npm test` | All 79 passed across 10 files |
| `tsc -p tsconfig.app.json --strict --noEmit` | Passed |

The initial failures were `expires subsequent toasts after a manual dismissal` and `keeps focus in a sibling toast when another toast closes`. Both use a fixture with a 150 ms real-time expiry. Passing in isolation and on the subsequent full run is consistent with timing sensitivity, but does not establish root cause. The initial suite overlapped with the build/lint process, which may be relevant to load. Stabilize and diagnose the tests before using them as a release gate; do not treat retries as a fix. [Toast test fixture](/Users/amjedfadul/Tiraz/src/system/overlay-regressions.test.tsx:124).

The README still describes 19 generated modules. The current test constructs 56 cases by its loops and explicit entries. That documentation discrepancy is a small example of why verification facts should be generated or tied to a specific run. The separate strict pass also does not mean `strict` is enabled in the committed app configuration.

No claim is made here that Tiraz has passed a fresh browser audit, complete accessibility conformance, a production consumer installation, a Figma parity review, or an AI benchmark. Those are acceptance gates for the proposed work.

**Recommended next investment:** a portable contract-and-example pipeline for the existing six components, followed by a small set of Arabic business patterns. This would give Tiraz a useful, testable AI workflow while preserving the decisions that already make it distinctive.
