import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  formatChangelogNotes,
  selectChangelogNotes,
} from "../../packages/tiraz/bin/changelog-notes.mjs";

const repo = resolve(import.meta.dirname, "../..");

const changelog = {
  schemaVersion: 1,
  format: "tiraz-changelog",
  releases: [
    {
      version: "0.1.3",
      changes: [
        {
          components: ["task-rows"],
          type: "changed",
          breaking: true,
          summary: { en: "TaskRowsRoot takes no emptyState.", ar: "" },
          steps: [{ en: "Move it into <TaskRowsEmpty>.", ar: "" }],
        },
        {
          components: ["tooltip"],
          type: "added",
          summary: { en: "Compound parts added.", ar: "" },
        },
        {
          components: [],
          area: "provider",
          type: "changed",
          summary: { en: "Locale defaults updated.", ar: "" },
        },
      ],
    },
    {
      version: "0.1.2",
      changes: [
        {
          components: ["chip"],
          type: "fixed",
          summary: { en: "Old fix.", ar: "" },
        },
      ],
    },
    {
      version: "0.1.4",
      changes: [
        {
          components: ["chip"],
          type: "fixed",
          label: "Filter chips",
          summary: { en: "New fix.", ar: "" },
        },
      ],
    },
  ],
};

const registry = {
  components: [
    { id: "task-rows", api: "TaskRows" },
    { id: "tooltip", api: "Tooltip" },
    { id: "chip", api: "Chip, ChipGroup" },
  ],
};

it("excludes the installed version and includes the target version", () => {
  const releases = selectChangelogNotes(changelog, {
    from: "0.1.2",
    to: "0.1.3",
    components: null,
  });
  expect(releases.map((release) => release.version)).toEqual(["0.1.3"]);
});

it("returns newest releases first", () => {
  const releases = selectChangelogNotes(changelog, {
    from: "0.1.1",
    to: "0.1.4",
    components: null,
  });
  expect(releases.map((release) => release.version)).toEqual([
    "0.1.4",
    "0.1.3",
    "0.1.2",
  ]);
});

it("keeps library-wide entries and entries for selected components", () => {
  const releases = selectChangelogNotes(changelog, {
    from: "0.1.2",
    to: "0.1.4",
    components: ["tooltip"],
  });
  expect(releases).toHaveLength(1);
  expect(releases[0].version).toBe("0.1.3");
  expect(releases[0].changes.map((change) => change.summary.en)).toEqual([
    "Compound parts added.",
    "Locale defaults updated.",
  ]);
});

it("keeps every change for a full install", () => {
  const releases = selectChangelogNotes(changelog, {
    from: "0.1.2",
    to: "0.1.4",
    components: null,
  });
  expect(releases.flatMap((release) => release.changes)).toHaveLength(4);
});

it("groups steps and breaking changes as action needed", () => {
  const releases = selectChangelogNotes(changelog, {
    from: "0.1.2",
    to: "0.1.3",
    components: null,
  });
  const lines = formatChangelogNotes(releases, {
    from: "0.1.2",
    to: "0.1.3",
    registry,
  });
  const action = lines.indexOf("Action needed");
  const automatic = lines.indexOf("Updates automatically");
  expect(action).toBeGreaterThan(0);
  expect(automatic).toBeGreaterThan(action);
  expect(lines.slice(action, automatic).join("\n")).toContain("TaskRows");
  expect(lines.slice(action, automatic).join("\n")).toContain(
    "→ Move it into <TaskRowsEmpty>.",
  );
  expect(lines.slice(automatic).join("\n")).toContain("Tooltip");
  expect(lines.at(-1)).toBe("Full notes: https://tiraz.dev/changelog");
  expect(lines[0]).toBe("What changed for your components (0.1.2 → 0.1.3)");
});

it("omits a group heading that has no items", () => {
  const lines = formatChangelogNotes(
    [
      {
        version: "0.1.3",
        changes: [
          {
            components: ["tooltip"],
            summary: { en: "Compound parts added.", ar: "" },
          },
        ],
      },
    ],
    { from: "0.1.2", to: "0.1.3", registry },
  );
  expect(lines).not.toContain("Action needed");
  expect(lines).toContain("Updates automatically");
});

it("prefers label, then area, then registry api names", () => {
  const lines = formatChangelogNotes(
    [
      {
        version: "0.1.3",
        changes: [
          {
            components: ["chip"],
            label: "Filter chips",
            summary: { en: "Labelled.", ar: "" },
          },
          {
            components: [],
            area: "cli",
            summary: { en: "Area labelled.", ar: "" },
          },
          {
            components: ["chip"],
            summary: { en: "Api labelled.", ar: "" },
          },
        ],
      },
    ],
    { from: "0.1.2", to: "0.1.3", registry },
  );
  const text = lines.join("\n");
  expect(text).toMatch(/Filter chips\s+Labelled\./);
  expect(text).toMatch(/CLI\s+Area labelled\./);
  expect(text).toMatch(/Chip, ChipGroup\s+Api labelled\./);
});

it("returns no lines when nothing applies", () => {
  expect(
    formatChangelogNotes([], { from: "0.1.2", to: "0.1.3", registry }),
  ).toEqual([]);
  expect(
    selectChangelogNotes(null, {
      from: "0.1.2",
      to: "0.1.3",
      components: null,
    }),
  ).toEqual([]);
  expect(
    selectChangelogNotes(
      { releases: "bad" },
      {
        from: "0.1.2",
        to: "0.1.3",
        components: null,
      },
    ),
  ).toEqual([]);
});

it("puts a long label on its own line with the summary indented below", () => {
  const lines = formatChangelogNotes(
    [
      {
        version: "0.1.3",
        changes: [
          {
            components: [],
            label: "A very long label here",
            summary: { en: "Short summary.", ar: "" },
          },
          {
            components: ["tooltip"],
            summary: { en: "Other.", ar: "" },
          },
        ],
      },
    ],
    { from: "0.1.2", to: "0.1.3", registry },
  );
  const index = lines.indexOf("  A very long label here");
  expect(index).toBeGreaterThan(0);
  expect(lines[index + 1]).toMatch(/^ {23}Short summary\.$/);
});

it("selects releases from the real changelog and registry", () => {
  const real = JSON.parse(
    readFileSync(resolve(repo, "src/system/ai/changelog.json"), "utf8"),
  );
  const realRegistry = JSON.parse(
    readFileSync(resolve(repo, "src/system/ai/registry.json"), "utf8"),
  );
  const releases = selectChangelogNotes(real, {
    from: "0.1.2",
    to: "0.1.3-preview.5",
    components: null,
  });
  expect(releases.length).toBeGreaterThan(0);
  expect(() =>
    formatChangelogNotes(releases, {
      from: "0.1.2",
      to: "0.1.3-preview.5",
      registry: realRegistry,
    }),
  ).not.toThrow();
});
