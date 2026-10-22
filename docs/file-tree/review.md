# Independent review

An independent reviewer inspected the entire branch diff, component behavior,
metadata, documentation and generated examples. Review was performed locally,
without modifying the implementation.

Three P2 findings were reproduced, fixed and re-reviewed:

1. Empty → populated updates now transfer focus from the owned empty tree root
   to the first visible item, preserving outside focus.
2. Empty folders are end nodes: folder icons remain, but there is no chevron,
   aria-expanded or expansion action. The close arrow immediately visits a parent.
3. The application example now previews the selected file, including Space
   selection, in both controlled and internal modes. Arrow focus leaves selection
   and preview unchanged; folder selection asks for a file.

Regression failures before the fixes are recorded in review-red.txt and
review-two-red.txt. The reviewer re-ran focused tests and independently exercised
reparenting, updated-ancestry collapse, and reorder followed by deletion.
Final assessment: no remaining actionable findings. Final focus state uses pure
render-state reconciliation; DOM focus recovery runs after commit.

The final Axe scan also prompted removal of redundant explicit row labels.
Native treeitem naming now takes the visible filename, while nested groups
exclude descendant names; metadata is separately referenced as a description.
The independent reviewer verified exact names and metadata descriptions through
Chrome's accessibility tree and re-reviewed the settled source with no findings.
See axe-name-investigation.json for the before/after diagnostic probe, and the
final browser/axe.json for actual source results. Empty-tree required-child
output remains a manual-review item because the supplied data has no children.

Reference: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
