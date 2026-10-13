# Sample portrait provenance and license

These two original fictional adult portraits were generated with OpenAI ImageGen on 2026-10-13 for Tiraz documentation. They are AI-generated images, not photographs of actual people; Sara Ali and Omar Noor are example names. No source photograph or external image service is used at runtime.

The project contributors distribute the bundled JPEG files under the repository MIT license, reproduced in [LICENSE.txt](LICENSE.txt). OpenAI's [Terms of Use](https://openai.com/policies/terms-of-use/) describe ownership of output to the extent permitted by applicable law; no uniqueness or exclusive copyright claim is made here.

Generation directions: a fictional adult Middle Eastern woman in a cream blouse (Sara), and a fictional adult Middle Eastern man in a navy shirt with a trimmed beard (Omar); centered head-and-shoulders composition, neutral gray background, soft daylight, natural photorealistic style, no text, logo or watermark, no resemblance to a real person or celebrity.

Packaging: original 1024px PNG outputs were converted using macOS sips, `sips -s format jpeg -s formatOptions 80 -Z 256 original.png --out portrait.jpg`. No cropping or other edits were applied.

- `sara.jpg`: 256 × 256 JPEG, 16071 bytes; SHA-256 `8c577c8fc534bec39283cc30513048dd6a93fd49233cc4a8e61467d92f003fca`.
- `omar.jpg`: 256 × 256 JPEG, 14257 bytes; SHA-256 `7bd2e811cbf4bb3ddd7435b0ad03e3bff64b46e435920e09d2a44e09d4b21904`.

Import these local files as src values. Copy the entire ai/assets directory, including this provenance and license, when relocating the library. Vite hosts need vite/client image declarations; other bundlers should use their existing image-module handling. Do not silently substitute remote URLs for bundled samples.
