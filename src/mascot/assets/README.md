# Khayt raster layers

Created for Tiraz on 22 October 2026 with image generation, using the owner's
selected Khayt concept as the reference. Original outputs are preserved here.
These are original character assets, not artwork from OpenAI, Grok, or other
reference brands.

All three images are 1254 × 1254 RGBA. The generator returned this size despite
smaller requested dimensions. Rendering uses explicit source crops:

| File             | Contents                                          | Source crop (x, y, width, height) |
| ---------------- | ------------------------------------------------- | --------------------------------- |
| khayt-body.png   | Four cotton tiers and ivory rims, no face or tail | 232, 144, 790, 1020               |
| khayt-thread.png | One loose cotton thread, attached at lower left   | 118, 145, 1042, 1002              |
| khayt-eye.png    | One dark ceramic eye, drawn twice                 | 446, 254, 362, 744                |

Keep these layers together with `Khayt.tsx` and its renderer. Runtime tinting
preserves ivory and cotton shading. Alpha values below 12 are ignored to remove
the generator's almost-transparent fringe without altering the source PNGs.
