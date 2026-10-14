# Native macOS checks

Performed locally in the user's installed Google Chrome through CUA, against http://127.0.0.1:5214 on this worktree.

- Actual native color chooser: clicked the playground's native color input. Chrome's accessibility tree exposed its native saturation/lightness control, hue slider and Red/Green/Blue channel fields (initial channels 128/84/117). Set the native **Red channel** field to 50 and pressed Tab. After leaving the channel field, Tiraz HEX and local sample both became **#325475**, and the previously selected Plum swatch cleared. This was actual native chooser UI, not synthetic DOM input events.
- Actual native file browsing: clicked the FileDropzone Browse control. Chrome opened the macOS **Open** sheet. Used Go to Folder to select the disposable fixture `/tmp/tiraz-local-browse.txt`, then clicked Open. Tiraz displayed **tiraz-local-browse.txt, 35 B**. This was actual OS file-dialog selection; the separate reproducible script also covers filechooser interception.
- The in-app browser did not expose its native picker panels; installed Chrome was used for these native checks.
- Scripted drag/drop uses DataTransfer and dispatched drag events; physical Finder dragging is not claimed. Automated DOM/axe checks are not manual screen-reader verification.


Final accessibility refinement: the intentionally cleared native file input is now hidden from the accessibility tree; the visible Browse button retains the full Field/standalone name and description. Final browser automation still verifies Browse → native filechooser → real local fixture, removal focus and keyboard order. A final OS-dialog recheck after this refinement was attempted, but macOS had locked; no automatic unlock was attempted. Actual OS file browsing above was verified before that refinement. The real Chrome native color chooser was reopened and channel synchronization rechecked after the final chooser labeling/focus styling.
