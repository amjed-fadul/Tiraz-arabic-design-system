# Library still previews

These images are generated from Tiraz's own example screens and standalone component playgrounds. They use local fictional example content and the existing bundled assets. They are static previews, so browsing the Library starts no demos, timers, sends, or decisions.

Each curated entry has Arabic and English images in light and dark themes. The gallery follows the shared language and theme. Images are decorative; the adjacent linked name identifies the item.

With the Woven dev server running on port 5411, generate missing images with:

```sh
TIRAZ_PLAYWRIGHT=/path/to/node_modules/playwright node scripts/library-previews.mjs
```

Pass `--overwrite` to refresh all images after changing example visuals. `TIRAZ_URL` can point to a different local Vite server. The script writes only this directory, not tracked browser evidence under `docs/`.
