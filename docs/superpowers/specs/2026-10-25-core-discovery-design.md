# Core-component discovery and customization

The user requested implementation of the next milestone locally. Build on
the approved sidebar and the individual-install/theme work at 63c177e. No push,
deploy, publication or merge. Preserve main, unrelated edits and Night loom.

## Outcome

A visitor should immediately recognize everyday controls, find a component by
its purpose or familiar name in either language, customize it, and carry the
same result into an application. Keep the continuous component documentation,
playground-first layout and compact prompt/copy row.

## Approach

Improve the existing catalog and inspector. A separate theme-builder route
would split the workflow; replacing the approved sidebar would discard recent
user feedback. Those are outside this milestone. The following detail choices
are implementation decisions, not new preferences attributed to the user.

- Default catalog: everyday components first, then the remaining components
  grouped by existing purpose categories without duplicates. Add an Essentials
  collection and in-content search. Keep legacy categories and section links.
- Show full-size, static renderings of core Tiraz controls instead of miniature
  screenshots. Preview content is decorative/inert; the named card link owns
  navigation. Keep screenshot previews for complex components and screens.
- Share bilingual search and aliases with the sidebar. Keep its title toggles,
  scrolling and Western counts unchanged. Search has an explicit clear action,
  empty state and keyboard behavior. No live-region announcements on filtering.
- Keep component properties and shared appearance distinct. Expose missing basic
  Input type and Select label/required controls; preserve valid models/code.
- Add optional custom action colors for light/dark to the appearance panel.
  Scope overrides to component previews, retain them between pages/reloads and
  clear them when a preset or appearance reset is chosen. Compute black/white
  action text for contrast; validation only accepts opaque hex colors.
- Export the selected colors and radius as editable `tiraz.theme.css`, with
  copy and selectable fallback. Remaining behavior settings stay in the existing
  config export. Generated examples/prompts include the exact theme when custom
  colors are used. Prompt instructions must respect selective source installs.
- Add related links for the everyday families, especially Badge versus TagInput
  and Input versus Select/Textarea. No invented library APIs or new dependencies.

## Verification

Focused behavioral tests precede implementation. Cover bilingual aliases,
collection membership, search/clear/navigation, decorative previews, custom
color validation/persistence/reset, exact exports, prompt/source compatibility
and generated example compilation. Inspect Arabic/English, light/dark, desktop
and narrow layouts, copy feedback and focus in a local browser. Then run full
tests, build, knowledge/registry checks, source lint and formatting on this Mac.
Keep the current branch documentation server on 5411. The earlier independent
consumer on 5413 is unrelated to this milestone and remains available.
