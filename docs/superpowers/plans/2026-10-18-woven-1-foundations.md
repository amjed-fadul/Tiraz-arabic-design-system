# Woven Foundations Implementation Plan (Plan 1 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task by task. Each task names its implementer model; a fresh Opus subagent reviews every task before the next starts (see the roadmap). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land everything the rest of the Woven work stands on:

- the in-flight numerals setting and browser-test repairs;
- the remaining Arabic digit fixes, pinned by tests;
- the workbench's enum and fallback bugs, fixed;
- Woven tokens with contrast tests, input modality, a CSS audit harness, the shared StatusIcon and one remove button.

**Architecture:**

- Tokens stay in `src/system/tokens.css`, defined on `.tiraz-system`, its dark theme, large typography, and the reduced-motion and keyboard-modality rules.
- The Provider gains one shared, ref-counted modality listener that sets `data-modality` on each provider root.
- Two new Vitest suites read CSS with postcss, so tests can enforce visual rules: `tokens.test.ts` (values and contrast) and `css-audit.test.ts` (per-family rules that Plan 3 switches on family by family).

**Tech Stack:** React 19, TypeScript ~6.0, Vite 8, Vitest 5 (jsdom), Testing Library, postcss 8.5 (installed through Vite; declared as a devDependency here), and Playwright from `TIRAZ_PLAYWRIGHT` for evidence.

**Specs:**

- `docs/superpowers/specs/2026-10-18-woven-visual-language-design.md` (sections 7–16, 18–21)
- `docs/superpowers/specs/2026-10-18-workbench-docs-design.md` (section 12, items 1–2)
- `docs/superpowers/specs/2026-10-18-ai-task-patterns-design.md` (section 16a, "Tests to add before changing anything")
- Roadmap: `docs/superpowers/plans/2026-10-18-woven-roadmap.md`

**Working directory for every command:** `/Users/amjedfadul/Tiraz-worktrees/woven`. `$SCRATCH` means a directory outside the repository, for example `$TMPDIR/woven-carry`.

**Spec corrections committed with this plan.** These came from checking the plan against the code. They are already in the specs:

1. **Dark text tiers.** Dark `--text-secondary` stays at today's #adb9af, and dark `--text-muted` becomes #9ba8a0. The first values (#a5b0a9, #8e9a93) put muted text at 3.88:1 on the dark AI tint, which breaks section 20's soft-tone rule. Lightness was raised; hue was kept.
2. **Muted text on trays.** On a tray, hoverable rows use `--text` or `--text-secondary`. Muted text on a hovered light tray falls to 4.40:1.
3. **Missing tokens.** Tokens for durations and leadings that the spec's tables pin but its token lists left out: `--motion-release`, `--motion-toast-exit`, `--motion-collapse-exit`, `--motion-loop-skeleton`, `--leading-title` and `--leading-figure`.
4. **Contrast test file.** The contrast checks live in a new `tokens.test.ts` beside `config.test.ts`.
5. **Stale line.** A leftover line about accent-to-AI "maps" now names the fixed colors.
6. **Page count.** The docs spec counted 68 pages. There are 67 (`navigationCatalog`), because `field` opens Input.

## Global Constraints

- **Font.** No new face. `--font: "IBM Plex Sans Arabic", system-ui, sans-serif`. Bundled weights stay 400, 500 and 600 via `@fontsource/ibm-plex-sans-arabic`. No remote font request. `font-synthesis: none` stays.
- **Digits.** Every Arabic number or date goes through `numberLocale(config, language?)`: `ar-u-nu-arab` by default, `ar-u-nu-latn` when `numerals` is `"latn"`. Plain `"ar"` is never passed to a number or date formatter (current ICU renders it with Western digits). `Intl.PluralRules("ar")` is fine; plural rules do not depend on digits.
- **Config.** `SystemConfig` gains only `numerals?: "arab" | "latn"` (default `"arab"`). AI and attention colors are fixed tokens, not config.
- **Direction.** RTL is the default. Use logical CSS properties. No letter-spacing, `text-transform` or italics on Arabic.
- **Motion.** Interface motion stays within 90–240 ms. Reduced motion (OS or `config.reducedMotion`) zeroes all motion. Keyboard modality zeroes interaction motion, but not streamed words or the decorative loops.
- **Contrast.**
  - Text: at least 4.5:1 on page, tray, paper, well and every soft tone, in both themes and with all twelve accents.
  - Boundaries and indicators (field edges, focus ring, switch track, status discs): at least 3:1.
  - The five semantic colors: at least 0.08 apart in OKLab.
- **Tests.** The baseline is 82 files and 806 tests. Change an existing test only where a spec changes what it asserts, and name it in the commit message.
- **Commits.** One per task, each ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never push.
- **Other worktrees** are read-only. `/Users/amjedfadul/Tiraz-worktrees/component-craft` and `/Users/amjedfadul/Tiraz-worktrees/numerals` are read once, in Tasks 1 and 2.

## Review Focus

1. **Saved workbench props from before this change** (`tiraz.playgrounds.v2`) still load. Valid values are kept per page, an invalid value falls back to that page's own default, and nothing throws. → Task 4, test `restores a legacy saved object without losing valid per-page values`.
2. **A keyboard user who then clicks** gets pointer motion back at once. Modifier keys alone never switch to keyboard modality, so Shift-click stays pointer. → Task 7, tests `switches between keyboard and pointer` and `ignores modifier and other non-navigation keys`.
3. **Nested providers** (the docs chrome provider wrapping the preview provider) share one modality value and one document listener. Unmounting one never strands the other, and a modality change does not re-render every `useSystem()` consumer. → Task 7, tests `shares one document listener across nested providers` and `does not re-render system consumers when modality changes`.
4. **Removing a filter keeps keyboard focus in the bar.** Focus moves to the next filter's remove button, or to the controls after the last one. Today this works by looking up the remove button's class, which Task 10 renames. → Task 10, test `moves focus to the next remove button after a removal`.
5. **A host that sets `numerals: "latn"` in Arabic** sees Western digits everywhere the numerals work formats, the source count included; the default shows Arabic-Indic. → Task 2 (`numerals.test.tsx`), Task 3 (`agrees Arabic source counts with their noun`, `formats Arabic digits only through numberLocale`).

---

### Task 0: Capture the before evidence

**Model:** Haiku

**Files:**
- Create: `tests/browser/woven-evidence.mjs`
- Create: `docs/woven/before/<variant>/<page>.jpg`

**Interfaces:**
- Produces: `node tests/browser/woven-evidence.mjs`, configured by environment variables:
  - `TIRAZ_URL` (default `http://127.0.0.1:5411`);
  - `TIRAZ_PLAYWRIGHT` (required: path to a Playwright package);
  - `TIRAZ_EVIDENCE` (output root);
  - `TIRAZ_VARIANTS` (comma-separated variant names; default all nine).

  Task 11 and Plans 2–4 rerun it into new folders.

The variants cover the Woven spec's evidence matrix (section 20):

| Variant | Language | Theme | `tiraz.system.v3` overrides | Viewport |
| --- | --- | --- | --- | --- |
| `ar-light` | ar | light | none | 1280 × 900 |
| `ar-dark` | ar | dark | none | 1280 × 900 |
| `en-light` | en | light | none | 1280 × 900 |
| `en-dark` | en | dark | none | 1280 × 900 |
| `ar-light-r0` | ar | light | `radius: 0` | 1280 × 900 |
| `ar-light-r16` | ar | light | `radius: 16` | 1280 × 900 |
| `ar-light-standard` | ar | light | `density: "standard"` | 1280 × 900 |
| `ar-light-large` | ar | light | `typography: "large"` | 1280 × 900 |
| `ar-light-390` | ar | light | none | 390 × 844 |

- [ ] **Step 1: Confirm the dev server.** The controller starts it from the `woven` launch configuration before dispatching this task. Run `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5411/`. Expected: `200`. If not, stop and report.

- [ ] **Step 2: Write `tests/browser/woven-evidence.mjs`.**
  - **Setup.** Load Playwright and launch Chrome the way `tests/browser/ai-decisions.mjs:1–9` does: `createRequire`, `require(process.env.TIRAZ_PLAYWRIGHT)`, then `chromium.launch({ headless: true, channel: "chrome" })`.
  - **Page ids.** Read `src/workbench/catalog.ts` as text, take the part between `export const catalog = [` and `] as const`, and collect `/id: "([^"]+)"/g`. Drop `field`, which opens the Input page. That leaves 67 ids.
  - **For each selected variant:** create a context with its viewport and `deviceScaleFactor: 1`. Then, for each id:
    1. In the page, write three keys, JSON-encoded the way `src/workbench/storage.ts` reads them:
       - `tiraz.documentation.v2` = `{ language, active: id, systemPanelOpen: false, inspectorOpen: false }`;
       - `tiraz.theme.v1` = the theme;
       - `tiraz.system.v3` = `{ density: "compact", accent: "sage", typography: "standard", radius: 8, reducedMotion: false, ...overrides }`.
    2. Reload, await `document.fonts.ready`, and wait 1,200 ms.
    3. Screenshot the `.playground-section` element as JPEG at quality 70 to `${TIRAZ_EVIDENCE}/${variant}/${id}.jpg`.
  - **Errors.** Append page errors (`pageerror`) to `${TIRAZ_EVIDENCE}/errors.txt` without failing.
  - **Fonts.** Record every request of resource type `font` whose origin is not `TIRAZ_URL`'s. No remote font may load (Woven spec, section 20).
  - **Exit 1** if a page has no `.playground-section` or a remote font was requested.
  - **Output.** Print `<variant>: <n> screenshots` per variant.

- [ ] **Step 3: Run it once per variant.** Each run takes about two minutes; use a 10-minute command timeout.

  ```bash
  TIRAZ_PLAYWRIGHT=/Users/amjedfadul/.npm/_npx/e41f203b7505f1fb/node_modules/playwright TIRAZ_EVIDENCE=docs/woven/before TIRAZ_VARIANTS=ar-light node tests/browser/woven-evidence.mjs
  ```

  Repeat with each variant name from the table. Expected: `<variant>: 67 screenshots` each time, and `find docs/woven/before -name '*.jpg' | wc -l` prints `603`. Report the line count of `errors.txt`.

- [ ] **Step 4: Commit**

  ```bash
  git add tests/browser/woven-evidence.mjs docs/woven/before
  git commit -m "test(browser): capture before evidence for the Woven restyle"
  ```

### Task 1: Bring in the browser-test repairs

**Model:** Haiku

**Files:**
- Modify: the 42 scripts under `tests/browser/` changed in `/Users/amjedfadul/Tiraz-worktrees/component-craft`
- Create: its four untracked fixtures: `tests/browser/charts-fixture.html`, `charts-fixture.tsx`, `feedback-form-fixture.html` and `feedback-form-fixture.tsx`

**Interfaces:** none (evidence scripts only).

- [ ] **Step 1: Check the source base.** Run `git -C /Users/amjedfadul/Tiraz-worktrees/component-craft rev-parse HEAD`. Expected: `aa1d0e380510522406f92c4afa557fab0aa2706a`, the same code this branch builds on. If it differs, stop and report.

- [ ] **Step 2: Export the repairs without touching the source worktree.**

  ```bash
  mkdir -p "$SCRATCH"
  git -C /Users/amjedfadul/Tiraz-worktrees/component-craft diff --binary -- tests/browser > "$SCRATCH/browser-repairs.patch"
  ```

- [ ] **Step 3: Apply them.** Run `git apply --index "$SCRATCH/browser-repairs.patch"`. Then copy the four fixtures from the component-craft worktree to the same paths here and `git add` them.

- [ ] **Step 4: Verify.**
  - `git diff --cached --stat | tail -1` shows `46 files changed`.
  - `npm test` passes: 82 files, 806 tests.
  - `npm run lint` passes.

- [ ] **Step 5: Commit**

  ```bash
  git commit -m "test(browser): bring in evidence script repairs from component-craft"
  ```

### Task 2: Bring in the numerals setting

**Model:** Opus. This is a three-way merge: 29 of the 43 files also changed in the six commits after the work's base.

**Files:**
- Modify: the 43 files changed in `/Users/amjedfadul/Tiraz-worktrees/numerals` (base `4b5650a`):
  - **Core:** `src/system/config.ts`, `Provider.tsx`, `chart-format.ts`.
  - **Components:** AvatarGroup, Charts, LoadingState, Pagination, Progress, Steps, ApprovalFlow, AskUserQuestions, ContextMeter, DatePicker, FileDropzone, InsightCards, NotificationList, Sidebar, Sources, TagInput, TaskRows and ToolChips (`.tsx`).
  - **Examples and agent docs:** `src/system/ai/examples/{AIResultsExamples,ChartExamples,SliderExamples,StructureExamples,TimelineExamples}.tsx` and `src/system/ai/{README.md,composition.md,registry.json}`.
  - **Workbench and root:** `src/workbench/{Appearance.tsx,generate.ts,generate-batch.ts,generate-charts.ts,i18n.ts,preferences.ts,storage.ts}`; the tests `avatar-overlays-empty-state.test.tsx`, `SidebarExamples.test.tsx`, `Workbench.test.tsx`, `generated-code.test.ts`, `storage.test.ts` and `tags-filters-copy-pages.test.tsx`; and `README.md`.
- Create: `src/system/numerals.test.tsx` (untracked in the source worktree).

**Interfaces:**
- Produces:
  - `export type Numerals = "arab" | "latn"`;
  - `SystemConfig.numerals?: Numerals`, with `defaultConfig.numerals === "arab"`;
  - `export function numberLocale(config: { direction?: Direction; numerals?: Numerals }, language?: string): string`. It returns `ar-u-nu-<numerals>` for Arabic and passes other languages through; `language` defaults from direction. It is exported from `src/system/index.ts`.
  - `data-numerals` on the provider root;
  - the workbench Appearance control and its storage.

- [ ] **Step 1: Inspect the source without changing it.**
  - `git -C /Users/amjedfadul/Tiraz-worktrees/numerals rev-parse HEAD`. Expected: `4b5650a90b8cd7f6b67c8a94f90a4f329ec7e3f3`.
  - `git -C /Users/amjedfadul/Tiraz-worktrees/numerals status --short`. Expected: 43 ` M` lines and `?? src/system/numerals.test.tsx`.

- [ ] **Step 2: Export.** Run `git -C /Users/amjedfadul/Tiraz-worktrees/numerals diff --binary > "$SCRATCH/numerals.patch"`, then copy `src/system/numerals.test.tsx` to the same path here.

- [ ] **Step 3: Apply with a three-way merge.** Run `git apply --3way "$SCRATCH/numerals.patch"`. The commits after the base are 27d1757, 8dd8a52, 97efe12, 185943c, b15defe and aa1d0e3. Expected: some files apply cleanly and some report conflicts.

- [ ] **Step 4: Resolve every conflict.**
  - Keep every change from those six commits, especially:
    - the plural source counts and the AI redesign (27d1757);
    - the natural Arabic copy (185943c).
  - Re-apply the numerals intent on top: Arabic numbers and dates format with `numberLocale(config, language)`, never a hard-coded `"ar-u-nu-arab"` or plain `"ar"`.
  - Never drop newer copy or behavior to make a hunk fit.
  - **Known overlaps:**
    - `Sources.tsx`: keep `arabicSourceCount` and the copy «لا توجد مصادر», and format the count with `numberLocale`.
    - `ApprovalFlow.tsx`: format both the visible position and the screen-reader announcement with `numberLocale`. Today the announcement uses raw digits.
    - `ai/registry.json`: keep both sides. `configuration.defaults` must equal the new `defaultConfig`, and `publicExports` must list `Numerals` and `numberLocale`. `ai-registry.test.ts` checks both.
  - List each resolved file and what you kept, for the commit body.

- [ ] **Step 5: Adapt `numerals.test.tsx` to this branch's copy.** Its expected strings predate the copy rewrite and the plural counts. Update the copy and never the digit assertions. Known: one source now reads «مصدر واحد», not «١ مصادر».

- [ ] **Step 6: Run the focused tests, then everything.**
  - `npx vitest run src/system/numerals.test.tsx src/system/config.test.ts src/system/ai-registry.test.ts src/workbench/storage.test.ts`
  - `npm test && npm run lint && npm run build && npm run format:check`

  Expected: all pass.

- [ ] **Step 7: Commit**

  ```bash
  git add -A
  git commit -m "feat(config): add numerals setting for Arabic digits" -m "Brought in from the uncommitted work in claude/numerals-config (base 4b5650a), merged onto the code at aa1d0e3. Conflicts resolved in favor of newer copy and AI changes: <list>. numerals.test.tsx copy updated to the current Arabic text."
  ```

### Task 3: Finish the Arabic digit fixes

**Model:** Sonnet

**Files:**
- Test:
  - `src/system/ai-results.test.tsx` (append)
  - `src/system/ai-decisions.test.tsx` (append)
  - `src/system/digits.test.ts` (create)
  - `src/examples/dashboard/Dashboard.test.tsx` (append)
- Modify:
  - `src/examples/dashboard/Dashboard.tsx` (its three formatters, near lines 98, 149 and 438);
  - `src/system/ai/examples/FilterBarExamples.tsx:40`;
  - every other file `digits.test.ts` names;
  - `src/system/Sources.tsx`, only if the count test fails.

**Interfaces:**
- Consumes: `numberLocale` (Task 2) and `useSystem()`.

Terminal's `exit N` is fixed with its Arabic copy in Plan 3 (Woven spec, defects 15 and 16 together).

- [ ] **Step 1: Write the tests.**

  ```tsx
  // ai-results.test.tsx
  it("agrees Arabic source counts with their noun", () => {
    const make = (n: number): SourceReference[] =>
      Array.from({ length: n }, (_, i) => ({ id: `s${i}`, number: i + 1, title: `مصدر ${i + 1}` }));
    const cases: [number, string][] = [
      [1, "مصدر واحد"], [2, "مصدران"], [3, "٣ مصادر"], [11, "١١ مصدرًا"], [100, "١٠٠ مصدر"],
    ];
    for (const [n, text] of cases) {
      const { unmount } = render(
        <SystemProvider config={defaultConfig}><Sources items={make(n)} /></SystemProvider>,
      );
      expect(screen.getByRole("button", { expanded: false })).toHaveTextContent(text);
      unmount();
    }
  });
  ```

  ```tsx
  // ai-decisions.test.tsx
  it("ignores digit keys with modifiers or inside the other-answer field", async () => {
    const user = userEvent.setup();
    function Host() {
      const [value, setValue] = useState<QuestionAnswers>({});
      return (
        <SystemProvider config={defaultConfig}>
          <AskUserQuestions
            questions={[{ id: "q", label: "أي الفواتير أبدأ؟", allowOther: true, choices: [
              { value: "suppliers", label: "فواتير الموردين" },
              { value: "customers", label: "فواتير العملاء" },
              { value: "expenses", label: "المصروفات" },
            ] }]}
            value={value} onValueChange={setValue} onSubmit={async () => {}}
          />
        </SystemProvider>
      );
    }
    render(<Host />);
    await user.click(screen.getByRole("radio", { name: /فواتير الموردين/ }));
    await user.keyboard("۳");
    expect(screen.getByRole("radio", { name: /المصروفات/ })).toBeChecked();
    await user.keyboard("{Control>}١{/Control}");
    expect(screen.getByRole("radio", { name: /المصروفات/ })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: /إجابة أخرى/ }));
    await user.type(screen.getByRole("textbox", { name: "إجابة أخرى" }), "١");
    expect(screen.getByRole("textbox", { name: "إجابة أخرى" })).toHaveValue("١");
    expect(screen.getByRole("radio", { name: /إجابة أخرى/ })).toBeChecked();
  });
  ```

  `numerals.test.tsx` from Task 2 already covers the plain keys 2, ٢ and ۲.

  - **`digits.test.ts`, test `formats Arabic digits only through numberLocale`.**
    - Walk `src` with `readdirSync("src", { recursive: true })`, skipping `*.test.ts(x)` and `src/system/config.ts`.
    - Expect no line to match `/"ar-u-nu-(?:arab|latn)"|(?:NumberFormat|DateTimeFormat|toLocale(?:Date|Time)?String)\(\s*"ar"/`.
    - The failure message lists each `file:line`.
  - **`Dashboard.test.tsx`, test `shows Arabic-Indic digits in the Arabic dashboard`.** Render `<Dashboard />`, which is Arabic by default. The order count and order revenue KPIs and their period note contain `[٠-٩]` and no `[0-9]`.

- [ ] **Step 2: Run them.** Run `npx vitest run src/system/ai-results.test.tsx src/system/ai-decisions.test.tsx src/system/digits.test.ts src/examples/dashboard/Dashboard.test.tsx`. Expected:
  - the key test passes, because the behavior exists (`AskUserQuestions.tsx:157–175`);
  - the guard fails and names at least `src/system/ai/examples/FilterBarExamples.tsx:40`;
  - the dashboard test fails, because it formats with plain `"ar"`;
  - the count test passes after Task 2 (it fails only if the merge left Western digits).

- [ ] **Step 3: Fix what failed.**
  - Each named file formats with `numberLocale(config, language)`.
  - `Dashboard.tsx` reads `config` from `useSystem()` in the component that formats; it already renders inside its own `SystemProvider`.

- [ ] **Step 4: Run again, then everything.** Same command, then `npm test && npm run lint`. Expected: PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add src/system/ai-results.test.tsx src/system/ai-decisions.test.tsx src/system/digits.test.ts src/examples/dashboard src/system/ai/examples src/system/Sources.tsx
  git commit -m "fix(i18n): format every Arabic number through numberLocale"
  ```

### Task 4: Validate inspector values per page

**Model:** Sonnet

**Files:**
- Modify: `src/workbench/fields.ts` (add `selectOptions`)
- Modify: `src/workbench/model.ts` (the `enums` table and its loop inside `normalizePlaygrounds`, about lines 1091–1136)
- Test: `src/workbench/model.test.ts` (append), `src/workbench/inspector-values.test.tsx` (create)

**Interfaces:**
- Produces: `export function selectOptions(component: ComponentId, key: string): readonly string[] | undefined` in `fields.ts`. It returns the static `options` of the `select` field with that `key` in `fields[component]`, or `undefined`. Tabs' `value` select has no static options, so it stays unvalidated, as today.
- `fields.ts` must not import `model.ts` (no cycle).

Today the shared table resets eight valid values: `terminal.state` running and failed; `context-meter.preset` near, over, zero, missing and invalid; and `image-result.state` loaded. Three page selects are not validated at all: `image-result.aspectRatio`, `code-block.codeLanguage` and `filter-bar.initialKind`.

- [ ] **Step 1: Write the failing tests.**

  ```ts
  // model.test.ts — each patch has the same shape Workbench.tsx's patchPage builds.
  it("keeps every select option of every page through normalization", () => {
    const defaults = defaultPlaygrounds("ar") as unknown as Record<string, Record<string, unknown>>;
    for (const item of navigationCatalog)
      for (const f of fields[item.id] ?? []) {
        if (f.kind !== "select" || !f.options) continue;
        for (const option of f.options) {
          const out = normalizePlaygrounds(
            { ...defaults, [item.id]: { ...defaults[item.id], [f.key]: option } }, "ar",
          ) as unknown as Record<string, Record<string, unknown>>;
          expect(out[item.id][f.key], `${item.id}.${f.key}=${option}`).toBe(option);
        }
      }
  });
  it("resets an unknown select value to that page's own default", () => {
    const defaults = defaultPlaygrounds("ar");
    const out = normalizePlaygrounds({ terminal: { ...defaults.terminal, state: "bogus" } }, "ar");
    expect(out.terminal.state).toBe(defaults.terminal.state);
  });
  it("keeps shared validation for keys without a page-specific select", () => {
    const defaults = defaultPlaygrounds("ar");
    const keep = normalizePlaygrounds({ checkbox: { ...defaults.checkbox, mode: "uncontrolled" } }, "ar");
    expect(keep.checkbox.mode).toBe("uncontrolled");
    const reset = normalizePlaygrounds({ checkbox: { ...defaults.checkbox, mode: "bogus" } }, "ar");
    expect(reset.checkbox.mode).toBe("controlled");
  });
  it("restores a legacy saved object without losing valid per-page values", () => {
    const saved = { terminal: { state: "running" }, "image-result": { state: "loaded" }, "context-meter": { preset: "near" }, unknownPage: { x: 1 } };
    const out = normalizePlaygrounds(saved, "ar");
    expect(out.terminal.state).toBe("running");
    expect(out["image-result"].state).toBe("loaded");
    expect(out["context-meter"].preset).toBe("near");
  });
  ```

  ```tsx
  // inspector-values.test.tsx
  it("keeps a page-specific state chosen in the inspector", async () => {
    const user = userEvent.setup();
    persist(storageKeys.documentation, { language: "ar", active: "terminal", systemPanelOpen: false, inspectorOpen: true });
    render(<Workbench />);
    const state = within(screen.getByRole("complementary", { name: "التخصيص" })).getByRole("combobox", { name: "الحالة" });
    await user.selectOptions(state, "running");
    expect(state).toHaveValue("running");
  });
  ```

- [ ] **Step 2: Run them.** Run `npx vitest run src/workbench/model.test.ts src/workbench/inspector-values.test.tsx`. Expected:
  - FAIL for the eight values above and for the inspector test;
  - PASS for the shared-validation test.

- [ ] **Step 3: Implement.**
  - Loop over the union of the `enums` keys and the page's static select keys.
  - For each key, use `const allowed = selectOptions(component, key) ?? enums[key]`, and skip the key when neither has a list.

- [ ] **Step 4: Run.** `npx vitest run src/workbench`, then `npm test`. Expected: PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add src/workbench/fields.ts src/workbench/model.ts src/workbench/model.test.ts src/workbench/inspector-values.test.tsx
  git commit -m "fix(workbench): validate inspector values per page" -m "A shared enum table keyed only by field name reset Terminal, ImageResult and ContextMeter values; three page selects were not validated at all."
  ```

### Task 5: Make the playground and code generator exhaustive

**Model:** Sonnet

**Files:**
- Create: `src/workbench/exhaustive.ts`
- Modify: `src/workbench/Playground.tsx` (the `endsWith("-chart")` branch near line 457 and the final Toast fallback near line 941)
- Modify: `src/workbench/generate.ts` (`generateCode`: the `.includes(component)` branches at lines 102, 124, 145, 172, 194, 283 and 367, `endsWith("-chart")` at line 350, and the final `else` near line 598)
- Test: `src/workbench/exhaustive.test.ts`

**Interfaces:**
- Produces in `exhaustive.ts`:
  - `export function assertNever(value: never, context: string): never`. It throws `Error(\`${context}: unhandled component ${String(value)}\`)`.
  - `export function isOneOf<const T extends ComponentId>(id: ComponentId, ids: readonly T[]): id is T`. It is the narrowing replacement for `[...].includes(component)`.

- [ ] **Step 1: Write the failing tests.**

  ```ts
  it("emits Toast playground code only for the Toast page", () => {
    const defaults = defaultPlaygrounds("ar");
    for (const item of navigationCatalog) {
      const code = generateCode(item.id, defaults[item.id], defaultConfig, "ar");
      expect(code.includes('setEvent("toast: '), item.id).toBe(item.id === "toast");
    }
  });
  it("names the context when a component is not handled", () => {
    expect(() => assertNever("nope" as never, "Playground")).toThrow("Playground: unhandled component nope");
  });
  ```

  The first test looks for the Toast demo's event line, not `useToast`: DataTable's code also imports `useToast`, legitimately.

- [ ] **Step 2: Run.** Run `npx vitest run src/workbench/exhaustive.test.ts`. Expected: FAIL (`exhaustive.ts` does not exist yet).

- [ ] **Step 3: Implement.**
  - Replace each `.includes(component)` branch with `isOneOf(component, [...])`, and `endsWith("-chart")` with `isOneOf` over the chart ids from `catalog.ts`.
  - Turn each implicit Toast fallback into an explicit `component === "toast"` branch, followed by `return assertNever(component, "Playground")` (or `"generateCode"`).
  - TypeScript must narrow `component` to `never` at the end. The spec's "exhaustive switch" requirement is met as long as a missing branch fails type-checking.

- [ ] **Step 4: Verify.**
  - `npx vitest run src/workbench/exhaustive.test.ts` passes.
  - `npm run build` passes.
  - Temporarily delete one branch locally: `npm run build` must fail with a type error. Restore the branch; never commit the deletion.

- [ ] **Step 5: Commit**

  ```bash
  git add src/workbench/exhaustive.ts src/workbench/exhaustive.test.ts src/workbench/Playground.tsx src/workbench/generate.ts
  git commit -m "fix(workbench): make the playground and code generator exhaustive"
  ```

### Task 6: Woven tokens with contrast tests

**Model:** Sonnet

**Files:**
- Modify: `src/system/tokens.css`
- Modify: `package.json` and `package-lock.json` (devDependency `"postcss": "^8.5.29"`, already installed)
- Create: `src/system/tokens.test.ts`

**Interfaces:**
- Produces the token names that Tasks 7–10 and Plans 2–4 use, exactly as in the table in Step 3.
- Produces helpers private to `tokens.test.ts`:
  - `readRule(selector)` returns one rule's declarations from tokens.css, parsed with postcss.
  - `color(theme, name, accent?)` returns a token's hex value. It resolves `var()` and the `color-mix(in srgb, A p%, B)` forms used in tokens.css. `--action` comes from `accentColors[accent][theme]`. A mix with `transparent` is composited over the surface under test.
  - `contrast(a, b)` and `oklabDistance(a, b)`.

- [ ] **Step 1: Write the failing tests** in `tokens.test.ts`:
  - **`defines every Woven token in both themes`:**
    - every name in Step 3's table exists in `.tiraz-system`;
    - every color in the table's dark column is redefined in `.tiraz-system[data-theme="dark"]`;
    - the dark rule no longer defines `--shadow-surface`, so the alias reaches the dark paper shadow.
  - **`sets the type scale and leading`:** the exact values from Step 3, standard and large.
  - **`keeps text at 4.5:1 on every surface and soft tone`** (both themes, all twelve accents):
    - `--text`, `--text-secondary` and `--text-muted` on `--surface-page`, `--surface-tray`, `--surface` and `--surface-well`;
    - the same three on page and paper under `--wash` and `--wash-strong`;
    - the same three on `--ai-soft`, `--attention-soft`, `--success-soft`, `--danger-soft`, `--info-soft` and `--action-soft`;
    - `--text` and `--text-secondary` on the tray under `--wash` and `--wash-strong`.

    Measured lowest: 4.58 (light muted on the page under `--wash-strong`) and 4.59 (dark muted on `--ai-soft`).
  - **`keeps colored text at 4.5:1`:**
    - `--action` (twelve accents) on page, tray, paper, well and `--action-soft`;
    - `--ai`, `--attention`, `--success`, `--danger` and `--info` on page, tray, paper, well and their own soft fill;
    - both themes.
  - **`keeps boundaries and indicators at 3:1`** (both themes):
    - `--border-field` on page, paper and tray (lowest 3.02, light tray);
    - the focus ring (`--action`, twelve accents) on page, paper and tray;
    - `--switch-track` on page, paper and tray;
    - the status disc colors (`--ai`, `--attention`, `--success`, `--danger`) on paper and tray;
    - the disc glyph (`--surface`) on each disc color.
  - **`keeps the five semantic colors apart`:** `--ai`, `--attention`, `--success`, `--danger` and `--info` are pairwise at least 0.08 apart in OKLab, in each theme. Measured minimums: 0.091 light, 0.100 dark.
  - **`keeps code literals off the AI color`:** at least 0.15 from `--ai` in OKLab (measured 0.20), and at least 4.5:1 on the well (6.0 light, 9.0 dark).
  - **`derives every radius from --radius`:** the exact strings from Step 3.
  - **`keeps motion in budget and stops it under reduced motion`:**
    - the exact values from Step 3;
    - every interface duration (each `--motion-*` except stagger, word and the loops) lies within 90–240 ms;
    - both reduced-motion rules set every `--motion-*` to `0ms`.

  The spec names `config.test.ts` for these checks. They read tokens.css, so they live in this new file beside it (spec correction 4).

- [ ] **Step 2: Run.** Run `npx vitest run src/system/tokens.test.ts`. Expected: FAIL.

- [ ] **Step 3: Edit `tokens.css`** with exactly these values. Keep every existing token not listed.

  | Group | Light (`.tiraz-system`) | Dark (`[data-theme="dark"]`) |
  | --- | --- | --- |
  | Font (changed) | `--font: "IBM Plex Sans Arabic", system-ui, sans-serif;` | — |
  | Type (new) | `--text-display: 30px; --text-subheading: 16px; --text-reading: 15.5px; --text-label: 13px; --text-micro: 11px; --text-figure: 28px; --text-figure-small: 20px;` | — |
  | Type (changed) | `--text-meta: 12.5px;` (was 12px) | — |
  | Leading (new) | `--leading-display: 1.3; --leading-title: 1.35; --leading-heading: 1.5; --leading-reading: 1.95; --leading-meta: 1.6; --leading-micro: 1.4; --leading-figure: 1.25;` (`--line-height: 1.8` stays for body) | — |
  | Text tiers (changed) | `--text-secondary: #56615a; --text-muted: #616b64;` | `--text-muted: #9ba8a0;` (`--text-secondary` keeps `#adb9af`) |
  | AI (new) | `--ai: #4b47c6; --ai-soft: color-mix(in srgb, var(--ai) 11%, var(--surface));` | `--ai: #aba7ff; --ai-soft: color-mix(in srgb, var(--ai) 18%, var(--surface));` |
  | Attention (new) | `--attention: #935200; --attention-soft: color-mix(in srgb, var(--attention) 12%, var(--surface));` | `--attention: #f1b45e; --attention-soft: color-mix(in srgb, var(--attention) 16%, var(--surface));` |
  | Surfaces (new) | `--surface-tray: #eceeea; --surface-well: color-mix(in srgb, var(--surface-tray) 55%, var(--surface));` | `--surface-tray: #121714;` |
  | Code (changed) | `--code-surface: var(--surface-well); --code-literal: #9b3a6c;` | `--code-literal: #f0a5cb;` |
  | Field border (new) | `--border-field: #848a85;` | `--border-field: #5f6f65;` |
  | Shadows (new) | `--shadow-paper: 0 0 0 1px rgb(18 35 26 / 7%), 0 1px 2px rgb(18 35 26 / 5%), 0 10px 24px -16px rgb(18 35 26 / 30%); --shadow-chip: 0 0 0 1px rgb(18 35 26 / 10%), 0 1px 2px rgb(18 35 26 / 6%);` | `--shadow-paper: 0 0 0 1px rgb(255 255 255 / 7%), 0 12px 28px -18px rgb(0 0 0 / 80%); --shadow-chip: 0 0 0 1px rgb(255 255 255 / 10%), 0 1px 2px rgb(0 0 0 / 40%);` |
  | Shadow alias (changed) | `--shadow-surface: var(--shadow-paper);` | delete the dark `--shadow-surface` line |
  | Radii (new and changed) | `--tray-pad: 5px; --radius-item: var(--radius); --radius-control: calc(var(--radius) * 1.25); --radius-paper: min(24px, max(var(--radius-control), calc(var(--radius) * 1.875))); --radius-tray: calc(var(--radius-paper) + min(var(--tray-pad), calc(var(--radius) * 0.625))); --radius-pill: calc(var(--radius) * 999); --radius-panel: var(--radius-paper);` (`--radius-panel` was `calc(var(--radius) + 4px)`) | — |
  | Sizes (new, spec section 11) | `--status-size: 22px; --remove-size: 24px; --switch-track-width: 38px; --switch-track-height: 22px; --switch-thumb: 16px; --slider-track: 6px; --slider-thumb: 18px; --avatar-sm: 32px; --avatar-md: 40px; --chat-avatar: 24px;` | — |
  | States (new) | `--press-scale: 0.97; --disabled-opacity: 0.5;` | — |
  | Motion (changed) | `--motion-enter: 180ms; --motion-exit: 120ms; --motion-panel: 280ms; --motion-panel-exit: 200ms;` | — |
  | Motion (new) | `--motion-release: 160ms; --motion-dialog-enter: 220ms; --motion-dialog-exit: 150ms; --motion-toast: 240ms; --motion-toast-exit: 150ms; --motion-collapse: 200ms; --motion-collapse-exit: 150ms; --motion-stagger: 40ms; --motion-word: 34ms; --motion-loop-stitch: 800ms; --motion-loop-shimmer: 1900ms; --motion-loop-turn: 1800ms; --motion-loop-skeleton: 1600ms;` | — |

  - **Large typography.** Add `--text-display: 34px; --text-subheading: 18px; --text-reading: 17px; --text-label: 15px; --text-micro: 12.5px; --text-figure: 32px; --text-figure-small: 22px;` to the `[data-typography="large"]` rule. It already has body 16, meta 14, heading 20 and title 26.
  - **Reduced motion.** Add every new `--motion-*` token, set to `0ms`, to both reduced-motion rules (the media query and `[data-reduced-motion="true"]`).
  - **Expected side effects.** No component CSS changes in this task, but two token changes show through right away. Task 12 checks that nothing else moved.
    - The 12.5 px meta size grows the sizes derived from it: the small avatar goes from 33.6 to 35 px until Plan 3 moves it to `--avatar-sm`.
    - The new `--radius-panel` gives panels 15 px corners at the default radius, up from 12 px, and square corners at radius 0.

- [ ] **Step 4: Run.** `npx vitest run src/system/tokens.test.ts`, then `npm test && npm run lint`. Expected: PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add src/system/tokens.css src/system/tokens.test.ts package.json package-lock.json
  git commit -m "feat(tokens): add Woven foundations with contrast tests"
  ```

### Task 7: Input modality

**Model:** Opus. Focus and keyboard behavior across every overlay depend on it.

**Files:**
- Create: `src/system/useInputModality.ts`
- Modify: `src/system/Provider.tsx` (root attribute and a memoized context value) and `src/system/tokens.css` (the keyboard rule)
- Test: `src/system/modality.test.tsx`, plus one case in `src/system/tokens.test.ts`

**Interfaces:**
- Produces:
  - `export function useInputModality(): "pointer" | "keyboard"` (internal; not exported from `index.ts`);
  - `data-modality="pointer" | "keyboard"` on every `.tiraz-system` root;
  - the CSS rule `.tiraz-system[data-modality="keyboard"]`.

- [ ] **Step 1: Write the failing tests.** Add `afterEach(() => vi.restoreAllMocks())`.

  ```tsx
  it("starts in pointer modality", () => {
    const { container } = render(<SystemProvider><p>x</p></SystemProvider>);
    expect(container.querySelector(".tiraz-system")).toHaveAttribute("data-modality", "pointer");
  });
  it("switches between keyboard and pointer", () => {
    const { container } = render(<SystemProvider><p>x</p></SystemProvider>);
    const root = container.querySelector(".tiraz-system")!;
    fireEvent.keyDown(document, { key: "Tab" });
    expect(root).toHaveAttribute("data-modality", "keyboard");
    fireEvent.pointerDown(document.body);
    expect(root).toHaveAttribute("data-modality", "pointer");
    fireEvent.keyDown(document, { key: "ب" });
    expect(root).toHaveAttribute("data-modality", "keyboard");
  });
  it("ignores modifier and other non-navigation keys", () => {
    const { container } = render(<SystemProvider><p>x</p></SystemProvider>);
    for (const key of ["Shift", "Control", "Alt", "Meta", "CapsLock", "Backspace"]) fireEvent.keyDown(document, { key });
    expect(container.querySelector(".tiraz-system")).toHaveAttribute("data-modality", "pointer");
  });
  it("shares one document listener across nested providers", () => {
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    const { container, unmount } = render(
      <SystemProvider><SystemProvider><p>x</p></SystemProvider></SystemProvider>,
    );
    expect(add.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(1);
    fireEvent.keyDown(document, { key: "Tab" });
    const roots = container.querySelectorAll(".tiraz-system");
    expect([...roots].map((r) => r.getAttribute("data-modality"))).toEqual(["keyboard", "keyboard"]);
    unmount();
    expect(remove.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(1);
  });
  it("does not re-render system consumers when modality changes", () => {
    let renders = 0;
    function Consumer() { useSystem(); renders += 1; return null; }
    render(<SystemProvider><Consumer /></SystemProvider>);
    fireEvent.keyDown(document, { key: "Tab" });
    fireEvent.pointerDown(document.body);
    expect(renders).toBe(1);
  });
  ```

  Add to `tokens.test.ts`: **`zeroes interaction motion under keyboard modality`.**
  - `.tiraz-system[data-modality="keyboard"]` sets `0ms` on `--motion-press`, `--motion-release`, `--motion-fast`, `--motion-state`, `--motion-enter`, `--motion-exit`, `--motion-dialog-enter`, `--motion-dialog-exit`, `--motion-panel`, `--motion-panel-exit`, `--motion-toast`, `--motion-toast-exit`, `--motion-collapse`, `--motion-collapse-exit` and `--motion-stagger`.
  - It sets `--press-scale: 1`.
  - It leaves `--motion-word` and the `--motion-loop-*` tokens alone.
  - Toasts are included because the spec skips the toast stack's height animation under keyboard modality (Woven spec, section 20).

- [ ] **Step 2: Run.** Run `npx vitest run src/system/modality.test.tsx src/system/tokens.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement.**
  - **Store.** A module-level store holds the current value, its subscribers and a subscriber count.
  - **Listeners.** The first subscription adds capture-phase `keydown` and `pointerdown` listeners on `document`. The last unsubscription removes them and resets the value to `"pointer"`.
  - **Which keys count** (Woven spec, section 15): Tab, the four arrows, Enter, Space (`" "`), Escape, Home, End, and any single letter or digit (`/^[\p{L}\p{N}]$/u`, so Arabic letters count). Those keys set `"keyboard"`; `pointerdown` sets `"pointer"`. Notify subscribers only when the value changes.
  - **Hook.** `useInputModality` reads the store through `useSyncExternalStore`, with server snapshot `"pointer"`.
  - **Provider.** It renders `data-modality={useInputModality()}` and memoizes the context value on `config` and `container`.
  - **CSS.** Add the keyboard rule to `tokens.css` after the reduced-motion rules.

- [ ] **Step 4: Run.** Same command, then `npm test`. Expected: PASS, with no existing test broken.

- [ ] **Step 5: Commit**

  ```bash
  git add src/system/useInputModality.ts src/system/Provider.tsx src/system/tokens.css src/system/modality.test.tsx src/system/tokens.test.ts
  git commit -m "feat(provider): track input modality so keyboard actions never animate"
  ```

### Task 8: CSS audit harness

**Model:** Sonnet

**Files:**
- Create: `src/system/css-audit.ts`, `src/system/css-audit.families.ts`, `src/system/css-audit.test.ts`

**Interfaces:**
- Produces in `css-audit.ts`:
  - `export interface AuditIssue { selector: string; property: string; value: string; message: string }`
  - `export function auditFamily(css: string, prefixes: readonly string[]): AuditIssue[]`. It audits every rule, including rules nested in `@media` or `@supports`, that has a selector containing one of the prefixes as a class. A prefix must be followed by `-`, a non-identifier character or the end, so `.tz-button` matches `.tz-button` and `.tz-button-label` but not `.tz-buttons`. Declarations inside `@media (forced-colors: active)` are exempt from check 1.
- Produces in `css-audit.families.ts`: `export const wovenFamilies: Record<string, readonly string[]> = {}`. Tasks 9 and 10 add the first entries; Plan 3 adds each family as it migrates.

**Checks** (each issue carries one message):

1. **Color literals.** A hex color, `rgb()`/`rgba()`/`hsl()`/`hsla()`/`oklch()`, or the keywords `white` or `black`. `transparent`, `currentColor` and `inherit` are allowed.
2. **Font size.** A `font-size` other than `var(--text-…)`, `inherit` or `1em`.
3. **Radius.** A `border-radius` (or a logical radius property) that contains a length other than `0`, or that uses the raw `var(--radius)`. Allowed: the named radius tokens, `var(--tray-pad)` in arithmetic, `50%`, `0` and `inherit`.
4. **Times.** A `transition`, `transition-duration`, `transition-delay`, `animation`, `animation-duration` or `animation-delay` that contains a literal time other than `0ms` or `0s`. Times must be `var(--motion-…)`, alone or in `calc()`.
5. **Curves.** Any literal `cubic-bezier(`.
6. **Hover gating.** A selector containing `:hover` outside `@media (hover: hover) and (pointer: fine)`.
7. **Press scale.** A `transform: scale(<number>)` or `scale: <number>` in an `:active` or `[data-pressed]` selector. It must use `var(--press-scale)`.
8. **Line height.** A `line-height` other than `var(--leading-…)`, `var(--line-height)`, `1`, `0`, `inherit` or `normal`.
9. **Font weight.** A `font-weight` other than `var(--weight-…)`, `400`, `500`, `600`, `normal` or `inherit` (only those weights are bundled).
10. **Arabic letterforms.** A `letter-spacing` other than `0` or `normal`, a `text-transform` other than `none`, or `font-style: italic`, unless the selector contains `:lang(en)`.

- [ ] **Step 1: Write the failing self-tests.**
  - For each check, a fixture CSS string with exactly one violation produces exactly one issue naming that property.
  - A clean fixture, plus a fixture with a forced-colors block that uses system colors, produces `[]`.
  - A top-level `for (const [name, prefixes] of Object.entries(wovenFamilies)) it(\`${name} follows the Woven audit\`, …)` audits the real `components.css`. While the map is empty it creates no tests, and the self-tests keep the file non-empty.

- [ ] **Step 2: Run.** Run `npx vitest run src/system/css-audit.test.ts`. Expected: FAIL (`auditFamily` does not exist yet).

- [ ] **Step 3: Implement `auditFamily`** with `postcss.parse`. Walk the rules and read each rule's parent chain for the `@media` context.

- [ ] **Step 4: Run.** Same command. Expected: PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add src/system/css-audit.ts src/system/css-audit.families.ts src/system/css-audit.test.ts
  git commit -m "test(css): add the Woven CSS audit harness"
  ```

### Task 9: The shared StatusIcon

**Model:** Sonnet

**Files:**
- Create: `src/system/StatusIcon.tsx`
- Delete: `src/system/ToolStatus.tsx`. The AI patterns spec (section 16a) exports it as `StatusIcon`.
- Modify:
  - `src/system/ToolCall.tsx:145` and `src/system/ToolChips.tsx:44` (render `StatusIcon`);
  - `src/system/TaskRows.tsx` (the indicator near line 81);
  - `src/system/index.ts` (exports);
  - `src/system/ai/registry.json` (`publicExports` entries `{ name, source: "StatusIcon.tsx" }` for each new export, plus a `support` entry `{ id: "status-icon", exports, source, props, purpose }`);
  - `src/system/components.css` (a new "Status icon" section; old rules removed);
  - `src/system/css-audit.families.ts`;
  - `src/workbench/tool-activity-pages.test.tsx:86` (queries `.tz-status-icon` instead of `.tz-tool-status`; the spec renames the part).
- Test: `src/system/status-icon.test.tsx`

**Interfaces:**
- Consumes: `numberLocale`, `useSystem`, `useChanged(value)` (`src/system/useChanged.ts`), `Spinner`, and the tokens `--status-size`, `--ai`, `--attention`, `--success`, `--danger` and `--motion-state`.
- Produces:
  - `export type StatusIconState = "pending" | "running" | "needs-you" | "completed" | "failed" | "stopped" | "skipped"`
  - `export interface StatusIconProps { state: StatusIconState; number?: number; tone?: "ai" | "neutral"; label?: string; className?: string }`
  - `export function StatusIcon(props: StatusIconProps): JSX.Element`
- Markup: `<span class="tz-status-icon {className}" data-state={state} data-tone={tone ?? "neutral"} data-changed={changed || undefined}>`.
  - Without a `label` it is `aria-hidden="true"`; with one it has `role="img"` and `aria-label={label}`.
  - Each glyph carries `data-glyph` for tests.

| State | Glyph (`data-glyph`) | Look (Woven spec, section 13) |
| --- | --- | --- |
| pending | `number` (formatted with `numberLocale`) or empty | dashed `--border-strong` ring; number in `--text-secondary` at `--text-micro`, weight 600, tabular |
| running | `spinner` (`Spinner decorative`) | arc in `--ai` when `tone="ai"`, else `--text-secondary` |
| needs-you | `bang` (the text `!`) | filled `--attention` disc |
| completed | `check` (Lucide `Check`) | filled `--success` disc |
| failed | `x` (Lucide `X`) | filled `--danger` disc |
| stopped | `square` (an 8 px square, no radius) | `--border-strong` outline, `--text-secondary` square |
| skipped | `minus` (Lucide `Minus`) | dashed ring, `--text-muted` |

- **Sizes.** The disc is `--status-size` (22 px) and glyphs are 12 px. Glyphs on filled discs use `--surface`, which keeps at least 3:1 (Task 6 test).
- **Forced colors.** Filled discs also carry `border: 1px solid transparent`, so they keep an outline under forced colors (Woven spec, section 6).
- **Motion only after change.** The check and × draw only when `data-changed` is set, over `--motion-state` with `--ease-out`, with no pop and no spring. Remove `.tz-tool-status` and `.tz-agent-task-indicator` from the mount-time draw and pop selectors (`components.css`, about lines 6780–6820).

- [ ] **Step 1: Write the failing tests.**
  - Each state renders its `data-state` and its `data-glyph`.
  - Pending with `number={3}` shows `٣` under the default config and `3` with `numerals: "latn"`.
  - Without `label` the element is `aria-hidden`; with `label="مكتملة"` it is `getByRole("img", { name: "مكتملة" })`.
  - `tone="ai"` gives `data-tone="ai"`.
  - Rerendering from running to completed sets `data-changed`; a first render as completed does not.
  - `auditFamily(css, [".tz-status-icon"])` returns `[]`.

- [ ] **Step 2: Run.** Run `npx vitest run src/system/status-icon.test.tsx`. Expected: FAIL.

- [ ] **Step 3: Implement** StatusIcon and its CSS section, using Woven tokens only.
  - **Audit.** Add `"status-icon": [".tz-status-icon"]` to `wovenFamilies`.
  - **ToolCall and ToolChips.** Render `<StatusIcon state={…} tone="ai" />`, because the assistant is the actor. In chips, set `--status-size: 18px` on `.tz-tool-chip` so chip height does not change; Plan 3 revisits chips.
  - **TaskRows.** The indicator renders `<StatusIcon className="tz-agent-task-indicator" state={item.state} number={index + 1} tone="ai" />`. Keep the class: layout and `numerals.test.tsx` use it. Remove the old indicator color and background rules.
  - **Glyph and color changes.**
    - A completed task turns from the accent disc to the success disc.
    - A failed task shows × instead of CircleAlert.
    - The TaskRows running badge moves to the `ai` tone in Plan 3, when Badge gains it.
    - Name any test changed for this in the commit.

- [ ] **Step 4: Run.** Run `npx vitest run src/system/status-icon.test.tsx src/system/tool-activity.test.tsx src/system/taskrows-agent.test.tsx src/system/tasks-notifications.test.tsx src/system/numerals.test.tsx src/system/ai-registry.test.ts src/workbench/tool-activity-pages.test.tsx`, then `npm test`. Expected: PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add -A src/system src/workbench/tool-activity-pages.test.tsx
  git commit -m "feat(system): add the shared StatusIcon"
  ```

### Task 10: One remove button for tags, filters and files

**Model:** Sonnet

**Files:**
- Create: `src/system/RemoveButton.tsx` (internal; not exported from `index.ts`)
- Modify:
  - `src/system/TagInput.tsx:157–167`, `src/system/FilterBar.tsx:66–83` and `src/system/FileDropzone.tsx:277–292`;
  - `src/system/components.css`;
  - `src/system/css-audit.families.ts`;
  - `tests/browser/entry-refinements.mjs:110` (locator `.tz-tag-remove` → `.tz-remove-button`).
- Test: `src/system/remove-button.test.tsx`

**Interfaces:**
- Consumes: the tokens `--remove-size`, `--radius-small`, `--wash-strong`, `--press-scale`, `--disabled-opacity` and `--motion-fast`.
- Produces: `export function RemoveButton(props: { label: string; onClick(): void; disabled?: boolean }): JSX.Element`. It renders `<button type="button" class="tz-remove-button" aria-label={label}>` with a 12 px Lucide `X` (`aria-hidden`).
- CSS:
  - a `--remove-size` square with `border-radius: var(--radius-small)` and `color: var(--text-secondary)`;
  - hover, fine pointer only: `background: var(--wash-strong); color: var(--text)`;
  - `:active`: `transform: scale(var(--press-scale))`;
  - disabled: `opacity: var(--disabled-opacity)` with `cursor: not-allowed`.
- It is a plain `<button>`, not `.tz-button`, so Button's hover rule (0,5,0) can no longer hide its hover (Woven spec, defect 4).

Each caller keeps its own `onClick` logic and label:

| Caller | Label | Logic kept in `onClick` |
| --- | --- | --- |
| TagInput | `labels.remove(tag)`, or «حذف {tag}» / "Remove {tag}" | `disabled \|\| readOnly` |
| FilterBar | `filter.removeLabel` | focus moves to the next remove button or the controls, then `onRemove()`; the query becomes `.tz-filter-active .tz-remove-button` |
| FileDropzone | `labels.remove(file)`, or «إزالة {name}» / "Remove {name}" | the `blocked()` guard, focus to the browse button, the list update |

- [ ] **Step 1: Write the failing tests.**
  - In TagInput, FilterBar and FileDropzone, the remove control (found by the names above) has the class `tz-remove-button` and `type="button"`, and clicking it removes the item.
  - **`moves focus to the next remove button after a removal`:** a FilterBar with two filters; removing the first focuses the second's remove button.
  - `auditFamily(css, [".tz-remove-button"])` returns `[]`.

- [ ] **Step 2: Run.** Run `npx vitest run src/system/remove-button.test.tsx`. Expected: FAIL.

- [ ] **Step 3: Implement.**
  - Replace the three implementations with `RemoveButton`.
  - Delete the `.tz-tag-remove` rules, since nothing uses them any more.
  - Add `"remove-button": [".tz-remove-button"]` to `wovenFamilies`.

- [ ] **Step 4: Run.** Run `npx vitest run src/system/remove-button.test.tsx src/system/TagInput.test.tsx src/system/FilterBar.test.tsx src/system/files-colors.test.tsx src/system/numerals.test.tsx src/system/css-audit.test.ts`, then `npm test`. Expected: PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add src/system/RemoveButton.tsx src/system/TagInput.tsx src/system/FilterBar.tsx src/system/FileDropzone.tsx src/system/components.css src/system/css-audit.families.ts src/system/remove-button.test.tsx tests/browser/entry-refinements.mjs
  git commit -m "refactor(system): share one remove button across tags, filters and files"
  ```

### Task 11: After evidence and full verification

**Model:** Haiku

**Files:**
- Create: `docs/woven/after-foundations/<variant>/<page>.jpg`

- [ ] **Step 1: Verify everything.** Run `npm test && npm run lint && npm run build && npm run format:check`. Expected: all pass, with more than 806 tests (the baseline plus Tasks 2–10). Report the totals.

- [ ] **Step 2: Capture the four base variants.** Run the Task 0 command with `TIRAZ_EVIDENCE=docs/woven/after-foundations`, once each for `ar-light`, `ar-dark`, `en-light` and `en-dark`. Expected: `<variant>: 67 screenshots` each, 268 in total. Report the line count of `errors.txt`.

- [ ] **Step 3: Commit**

  ```bash
  git add docs/woven/after-foundations
  git commit -m "docs(woven): capture foundations evidence"
  ```

### Task 12: Whole-plan review and checkpoint

**Model:** Opus

**Files:**
- Create: `docs/woven/plan-1-review.md`

- [ ] **Step 1: Review the whole diff** from `2c81e61` against the specs' foundation sections:
  - Woven spec sections 7–16, 18 (defects 4, 11, 15, 23 and 29 in part), 19, 20 and 21 step 1;
  - docs spec section 12, items 1–2;
  - AI patterns spec section 16a's two tests.

  Confirm each Review Focus item has its passing test.

- [ ] **Step 2: Compare the evidence.** Compare `docs/woven/before` with `docs/woven/after-foundations` for Button, Input, Select, Tabs, Card, Toast, DataTable, TaskRows, ToolCall and AskUserQuestions, in `ar-light` and `ar-dark`.
  - Expected changes: token values (text tiers, meta size, panel radius, paper shadow, code colors), StatusIcon and the remove button.
  - Anything else is a finding.

- [ ] **Step 3: Write `docs/woven/plan-1-review.md`** with findings ranked by severity, what was deferred to Plans 2–4, and the test totals. Commit it:

  ```bash
  git add docs/woven/plan-1-review.md
  git commit -m "docs(woven): review the foundations plan"
  ```

- [ ] **Step 4: Stop for Amjed's checkpoint.** The controller reports the review, the evidence folders and anything deferred. Plan 2 is written after he approves.
