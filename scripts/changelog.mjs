import semver from "semver";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const changelogOutput = "packages/tiraz/CHANGELOG.md";

const types = ["added", "changed", "fixed", "deprecated", "removed"];
const areas = ["provider", "tokens", "cli", "mascot", "package", "library"];
const areaNames = {
  provider: "Provider",
  tokens: "Tokens",
  cli: "CLI",
  mascot: "Mascot",
  package: "Package",
  library: "Library",
};

const fail = (message) => {
  throw new Error(`Invalid changelog: ${message}`);
};
const text = (value) => typeof value === "string" && value.trim() !== "";
const bilingual = (value, where) => {
  if (!value || typeof value !== "object" || !text(value.en) || !text(value.ar))
    fail(`${where} needs non-empty en and ar text.`);
};

export function validateChangelog(
  changelog,
  { registry, manifest, packageVersion },
) {
  if (changelog?.schemaVersion !== 1 || changelog.format !== "tiraz-changelog")
    fail("expected schemaVersion 1 and format tiraz-changelog.");
  const { releases } = changelog;
  if (!Array.isArray(releases) || releases.length === 0)
    fail("releases must be a non-empty array.");
  const ids = new Set(registry.components.map((component) => component.id));
  const manifestFiles = new Set(Object.keys(manifest.files));
  const seen = new Set();
  let previous;
  releases.forEach((release, index) => {
    const { version } = release;
    if (typeof version !== "string" || semver.valid(version) !== version)
      fail(`release ${index} has an invalid semver version: ${version}.`);
    if (seen.has(version)) fail(`release ${version} is duplicated.`);
    seen.add(version);
    if (previous && !semver.lt(version, previous))
      fail(
        `release ${version} must be older than ${previous} (newest first, strictly descending).`,
      );
    previous = version;
    if (
      typeof release.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(release.date) ||
      Number.isNaN(Date.parse(`${release.date}T00:00:00Z`)) ||
      new Date(`${release.date}T00:00:00Z`).toISOString().slice(0, 10) !==
        release.date
    )
      fail(`release ${version} needs an ISO date (YYYY-MM-DD).`);
    if (typeof release.published !== "boolean")
      fail(`release ${version} needs a boolean published.`);
    if (!Array.isArray(release.changes) || release.changes.length === 0)
      fail(`release ${version} needs at least one change.`);
    release.changes.forEach((change, number) => {
      const where = `release ${version} change ${number + 1}`;
      if (!types.includes(change.type))
        fail(`${where} has an unknown type: ${change.type}.`);
      if (!Array.isArray(change.components))
        fail(`${where} needs a components array.`);
      for (const id of change.components)
        if (!ids.has(id)) fail(`${where} names unknown component id: ${id}.`);
      if (change.components.length === 0) {
        if (!areas.includes(change.area))
          fail(
            `${where} has no components and needs an area (${areas.join(", ")}).`,
          );
      } else if (change.area !== undefined)
        fail(`${where} may set area only when components is empty.`);
      bilingual(change.summary, `${where} summary`);
      const steps = change.steps ?? [];
      if (!Array.isArray(steps)) fail(`${where} steps must be an array.`);
      steps.forEach((step, stepNumber) =>
        bilingual(step, `${where} step ${stepNumber + 1}`),
      );
      if (change.breaking !== undefined && typeof change.breaking !== "boolean")
        fail(`${where} breaking must be a boolean.`);
      if (change.breaking && steps.length === 0)
        fail(`${where} is breaking and needs at least one step.`);
      const files = change.files ?? [];
      if (!Array.isArray(files) || !files.every(text))
        fail(`${where} files must be an array of paths.`);
      if (index === 0)
        for (const file of files)
          if (!manifestFiles.has(file))
            fail(
              `${where} lists ${file}, which is not in the source manifest.`,
            );
    });
  });
  if (releases[0].version !== packageVersion)
    fail(
      `newest release ${releases[0].version} must equal the package version ${packageVersion}.`,
    );
}

function channel(release, latestStable) {
  if (!release.published) return "Not on npm";
  if (semver.prerelease(release.version)) return "Preview";
  return release === latestStable ? "Latest" : "Stable";
}

export function renderChangelogMarkdown(changelog, { registry }) {
  const names = new Map(
    registry.components.map((component) => [component.id, component.api]),
  );
  const latestStable = changelog.releases.find(
    (release) => release.published && !semver.prerelease(release.version),
  );
  const lines = [
    "# Changelog",
    "",
    "What changed in each Tiraz release, and how to update source you copied into your app. Generated from `source/system/ai/changelog.json`; full notes at https://tiraz.dev/changelog.",
  ];
  for (const release of changelog.releases) {
    const stepCount = release.changes.reduce(
      (total, change) => total + (change.steps?.length ?? 0),
      0,
    );
    const steps =
      stepCount === 0
        ? "No manual steps."
        : stepCount === 1
          ? "1 manual step."
          : `${stepCount} manual steps.`;
    lines.push(
      "",
      `## ${release.version} — ${release.date}`,
      "",
      `_${channel(release, latestStable)} · Run \`tiraz update\`. ${steps}_`,
      "",
    );
    for (const change of release.changes) {
      const subject = change.components.length
        ? change.components.map((id) => names.get(id)).join(", ")
        : areaNames[change.area];
      const label = `${change.type[0].toUpperCase()}${change.type.slice(1)}`;
      lines.push(
        `- **${subject}** ${change.summary.en} _(${label})_${change.breaking ? " _(Breaking)_" : ""}`,
      );
      for (const step of change.steps ?? [])
        lines.push(`  - Manual step: ${step.en}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

export function loadChangelogInputs(base = root) {
  const read = (path) => JSON.parse(readFileSync(resolve(base, path), "utf8"));
  return {
    changelog: read("src/system/ai/changelog.json"),
    registry: read("src/system/ai/registry.json"),
    manifest: read("src/system/ai/generated/manifest.json"),
    packageVersion: read("packages/tiraz/package.json").version,
  };
}

/** Validates the authored changelog and writes or checks CHANGELOG.md. */
export function writeOrCheckChangelog(check = false, base = root) {
  const { changelog, registry, manifest, packageVersion } =
    loadChangelogInputs(base);
  validateChangelog(changelog, { registry, manifest, packageVersion });
  const markdown = renderChangelogMarkdown(changelog, { registry });
  const target = resolve(base, changelogOutput);
  if (check) {
    const current = existsSync(target) ? readFileSync(target, "utf8") : null;
    if (current !== markdown)
      throw new Error(
        `${changelogOutput} is stale. Run npm run changelog:build.`,
      );
  } else {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, markdown);
  }
  return markdown;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const check = process.argv.includes("--check");
  writeOrCheckChangelog(check);
  console.log(check ? "Changelog is current." : "Changelog generated.");
}
