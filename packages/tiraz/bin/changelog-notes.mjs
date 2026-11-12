import semver from "semver";

const areaLabels = {
  provider: "SystemProvider",
  mascot: "Khayt",
  cli: "CLI",
  package: "Package",
  library: "Library",
  tokens: "Tokens",
};
const maxLabelWidth = 18;
const gap = "   ";
const fullNotes = "Full notes: https://tiraz.dev/changelog";

function inRange(version, from, to) {
  return (
    semver.valid(version) && semver.gt(version, from) && semver.lte(version, to)
  );
}

export function selectChangelogNotes(changelog, { from, to, components } = {}) {
  if (!changelog || !Array.isArray(changelog.releases)) return [];
  if (!semver.valid(from) || !semver.valid(to)) return [];
  const wanted = components ? new Set(components) : null;
  return changelog.releases
    .filter((release) => release && inRange(release.version, from, to))
    .sort((a, b) => semver.rcompare(a.version, b.version))
    .map((release) => ({
      ...release,
      changes: (release.changes ?? []).filter(
        (change) =>
          !wanted ||
          !change.components?.length ||
          change.components.some((id) => wanted.has(id)),
      ),
    }))
    .filter((release) => release.changes.length > 0);
}

function labelFor(change, registry) {
  if (change.label) return change.label;
  if (change.area && areaLabels[change.area]) return areaLabels[change.area];
  const apis = (change.components ?? []).map(
    (id) => registry?.components?.find((component) => component.id === id)?.api,
  );
  return apis.filter(Boolean).join(", ");
}

function block(heading, entries, width) {
  if (!entries.length) return [];
  const indent = " ".repeat(2 + width + gap.length);
  const lines = [heading];
  for (const { label, summary, steps } of entries) {
    if (label.length > width) {
      lines.push(`  ${label}`, `${indent}${summary}`);
    } else {
      lines.push(`  ${label.padEnd(width)}${gap}${summary}`);
    }
    for (const step of steps) lines.push(`${indent}→ ${step}`);
  }
  return lines;
}

export function formatChangelogNotes(releases, { from, to, registry } = {}) {
  const action = [];
  const automatic = [];
  for (const release of releases ?? []) {
    for (const change of release.changes ?? []) {
      const steps = (change.steps ?? []).map((step) => step.en);
      const entry = {
        label: labelFor(change, registry),
        summary: change.summary.en,
        steps,
      };
      if (steps.length || change.breaking) action.push(entry);
      else automatic.push(entry);
    }
  }
  if (!action.length && !automatic.length) return [];

  const labels = [...action, ...automatic].map((entry) => entry.label);
  const width = Math.min(
    maxLabelWidth,
    Math.max(...labels.map((label) => label.length)),
  );
  const sections = [
    block("Action needed", action, width),
    block("Updates automatically", automatic, width),
  ].filter((section) => section.length);

  return [
    `What changed for your components (${from} → ${to})`,
    "",
    ...sections.flatMap((section, index) =>
      index === 0 ? section : ["", ...section],
    ),
    "",
    fullNotes,
  ];
}
