Schema snapshots retrieved 2026-10-22 from the official shadcn registry:

- https://ui.shadcn.com/schema/registry.json
- https://ui.shadcn.com/schema/registry-item.json

Vendored so CI validates without a network schema fetch. Update deliberately when changing the registry format. Validation covers the published JSON structure; consumer browser tests use Tiraz's local installer. A remote shadcn CLI installation is not claimed tested.
