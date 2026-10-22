# Khayt raster layers

Created for Tiraz on 22 October 2026 with image generation, using the owner's
selected Khayt concept as the reference. Original outputs are preserved here.
These are original character assets, not artwork from OpenAI, Grok, or other
reference brands.

The original three images are 1254 × 1254 RGBA. The generator returned this size despite
smaller requested dimensions. Rendering uses explicit source crops:

| File             | Contents                                          | Source crop (x, y, width, height) |
| ---------------- | ------------------------------------------------- | --------------------------------- |
| khayt-body.png   | Four cotton tiers and ivory rims, no face or tail | 232, 144, 790, 1020               |
| khayt-thread.png | One loose cotton thread, attached at lower left   | 118, 145, 1042, 1002              |
| khayt-eye.png    | One dark ceramic eye, drawn twice                 | 446, 254, 362, 744                |

Keep these layers together with `Khayt.tsx` and its renderer. Runtime tinting
preserves ivory and cotton shading. Alpha values below 12 are ignored to remove
the generator's almost-transparent fringe without altering the source PNGs.

## Approved expression layers

The owner selected the second expression sheet on 22 October 2026, preserved
at `docs/woven/khayt-state-reference.png`. These additional original RGBA
outputs follow that image. Each was generated separately, inspected, and
checked for genuine alpha. The renderer bounds decoded resolution and caches
up to eight identity colors. Source files remain unchanged.

| File                      | Intrinsic dimensions | Source crop (x, y, width, height) |
| ------------------------- | -------------------- | --------------------------------- |
| khayt-eye-white.png       | 1086 × 1448          | 245, 268, 594, 929                |
| khayt-eye-happy.png       | 1470 × 1070          | 275, 303, 921, 474                |
| khayt-eye-concerned.png   | 1071 × 1469          | 184, 375, 757, 729                |
| khayt-thread-thinking.png | 1139 × 1381          | 48, 118, 1076, 1189               |
| khayt-thread-working.png  | 992 × 1586           | 76, 108, 864, 1373                |
| khayt-thread-done.png     | 936 × 1681           | 53, 96, 858, 1467                 |
| khayt-thread-blocked.png  | 1064 × 1478          | 94, 150, 936, 1154                |

Built-in Image Gen source IDs:

- White: `exec-6449e592-8448-4bff-9a50-fae6e4430dc0`; happy:
  `exec-be6fef9a-3f79-48fc-b833-6b63ebf4b60c`; concerned:
  `exec-a1c40ffb-a922-4664-8cf6-fa8fa9998017`.
- Thinking: `exec-447016a9-0c09-4162-8fef-4bac649d15e7`; blocked:
  `exec-59a1972c-7b7d-4012-b7c6-37e46eb6ff90`.
- Working: `exec-506f11d0-d343-48c1-997a-cbd70855cbba`; done:
  `exec-4bd3e09c-67af-458e-8337-375cdf053f43`.

Prompt set: isolated blank ivory eye surround, charcoal happy closed eye,
worried left eye with a small cotton upper lid, inward-curled thinking thread,
open flowing working thread, relaxed completion loop, and one simple blocked
knot. All use the approved cotton/ceramic materials, plum dye, soft lighting,
transparent background, and no body, text, or props. The existing hook is
reused in Ready and raised in Needs you.
