import { describe, expect, it } from "vitest";
// @ts-expect-error The generator is an untyped ESM script.
import * as generator from "../../scripts/changelog.mjs";

type Change = Record<string, unknown>;
type Release = {
  version: string;
  date: string;
  published: boolean;
  changes: Change[];
};
type Changelog = {
  schemaVersion: number;
  format: string;
  releases: Release[];
};
const { validateChangelog, renderChangelogMarkdown, loadChangelogInputs } =
  generator as {
    validateChangelog: (changelog: unknown, inputs: unknown) => void;
    renderChangelogMarkdown: (changelog: unknown, inputs: unknown) => string;
    loadChangelogInputs: () => {
      changelog: Changelog;
      registry: { components: { id: string; api: string }[] };
      manifest: { files: Record<string, string> };
      packageVersion: string;
    };
    writeOrCheckChangelog: (check: boolean) => string;
  };

const both = (text: string) => ({ en: text, ar: `${text} (ar)` });
const inputs = {
  registry: {
    components: [
      { id: "tooltip", api: "Tooltip" },
      { id: "task-rows", api: "TaskRows" },
    ],
  },
  manifest: { files: { "Tooltip.tsx": "x" } },
  packageVersion: "0.2.0-preview.1",
};
const fixture = (): Changelog => ({
  schemaVersion: 1,
  format: "tiraz-changelog",
  releases: [
    {
      version: "0.2.0-preview.1",
      date: "2026-11-01",
      published: true,
      changes: [
        {
          components: ["tooltip"],
          label: "Tip",
          type: "added",
          summary: both("has compound parts."),
          files: ["Tooltip.tsx"],
        },
        {
          components: ["task-rows"],
          type: "changed",
          breaking: true,
          summary: both("Empty state moved."),
          steps: [both("Move it into TaskRowsEmpty.")],
        },
        {
          components: [],
          area: "cli",
          type: "fixed",
          summary: both("Update prints notes."),
        },
      ],
    },
    {
      version: "0.1.0",
      date: "2026-10-01",
      published: true,
      changes: [
        {
          components: [],
          area: "library",
          type: "added",
          summary: both("First release."),
        },
      ],
    },
  ],
});
const rejects = (edit: (changelog: Changelog) => void, message: RegExp) => {
  const changelog = fixture();
  edit(changelog);
  expect(() => validateChangelog(changelog, inputs)).toThrow(message);
};

describe("changelog", () => {
  it("validates the authored changelog and matches the package version", () => {
    const real = loadChangelogInputs();
    expect(() => validateChangelog(real.changelog, real)).not.toThrow();
    expect(real.changelog.releases[0].version).toBe(real.packageVersion);
  });

  it("keeps CHANGELOG.md in sync with the authored data", () => {
    expect(() => generator.writeOrCheckChangelog(true)).not.toThrow();
  });

  it("accepts a well-formed fixture", () => {
    expect(() => validateChangelog(fixture(), inputs)).not.toThrow();
  });

  it.each([
    [
      "an invalid version",
      (c: Changelog) => (c.releases[1].version = "one"),
      /invalid semver/,
    ],
    [
      "a duplicate version",
      (c: Changelog) => (c.releases[1].version = "0.2.0-preview.1"),
      /duplicated/,
    ],
    [
      "ascending order",
      (c: Changelog) => (c.releases[1].version = "0.3.0"),
      /older than/,
    ],
    [
      "a newest release that is not the package version",
      (c: Changelog) => (c.releases[0].version = "0.2.0-preview.2"),
      /package version/,
    ],
    [
      "an unknown component",
      (c: Changelog) => (c.releases[0].changes[0].components = ["nope"]),
      /unknown component/,
    ],
    [
      "area on a component change",
      (c: Changelog) => (c.releases[0].changes[0].area = "cli"),
      /only when components is empty/,
    ],
    [
      "a library-wide change without area",
      (c: Changelog) => delete c.releases[0].changes[2].area,
      /needs an area/,
    ],
    [
      "an unknown area",
      (c: Changelog) => (c.releases[0].changes[2].area = "docs"),
      /needs an area/,
    ],
    [
      "a breaking change without steps",
      (c: Changelog) => delete c.releases[0].changes[1].steps,
      /needs at least one step/,
    ],
    [
      "a newest-release file missing from the manifest",
      (c: Changelog) => (c.releases[0].changes[0].files = ["Gone.tsx"]),
      /source manifest/,
    ],
    [
      "a summary without Arabic",
      (c: Changelog) =>
        (c.releases[0].changes[0].summary = { en: "Only English." }),
      /en and ar/,
    ],
    [
      "an empty step translation",
      (c: Changelog) =>
        (c.releases[0].changes[1].steps = [{ en: "Do it.", ar: " " }]),
      /en and ar/,
    ],
    [
      "an empty label",
      (c: Changelog) => (c.releases[0].changes[0].label = " "),
      /label must be/,
    ],
    [
      "an unknown type",
      (c: Changelog) => (c.releases[0].changes[0].type = "improved"),
      /unknown type/,
    ],
    [
      "a malformed date",
      (c: Changelog) => (c.releases[0].date = "2026-13-40"),
      /ISO date/,
    ],
  ])("rejects %s", (_name, edit, message) => rejects(edit, message));

  it("renders headings, derived lines, labels and manual steps", () => {
    const markdown = renderChangelogMarkdown(fixture(), inputs);
    expect(markdown).toMatch(/^# Changelog\n/);
    expect(markdown).toContain("## 0.2.0-preview.1 — 2026-11-01");
    expect(markdown).toContain(
      "_Preview · Run `tiraz update`. 1 manual step._",
    );
    expect(markdown).toContain("\n_Latest_\n");
    expect(markdown).not.toContain("_Latest ·");
    expect(markdown).toContain("- **Tip** has compound parts. _(Added)_");
    expect(markdown).toContain(
      "- **TaskRows** Empty state moved. _(Changed)_ _(Breaking)_",
    );
    expect(markdown).toContain("  - Manual step: Move it into TaskRowsEmpty.");
    expect(markdown).toContain("- **CLI** Update prints notes. _(Fixed)_");
    expect(markdown).toContain("- **Library** First release. _(Added)_");
    expect(markdown).not.toContain("(ar)");
    expect(markdown).not.toContain("Tooltip.tsx");
  });

  it("labels unpublished releases and pluralises manual steps", () => {
    const changelog = fixture();
    changelog.releases[0].published = false;
    (changelog.releases[0].changes[0] as Change).steps = [both("One more.")];
    const markdown = renderChangelogMarkdown(changelog, inputs);
    expect(markdown).toContain(
      "_Not on npm · Run `tiraz update`. 2 manual steps._",
    );
  });
});
