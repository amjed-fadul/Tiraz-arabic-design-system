import { readFile, realpath } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import semver from "semver";
import { createComponentPayload, validateProject } from "./add-components.mjs";
import {
  createSourceManifest,
  relocateSourceManifest,
  safePath,
  validateSubsetManifest,
} from "./source-manifest.mjs";
import {
  baselinePath,
  commitPlan,
  decodeBaseline,
  encodeBaseline,
  hash,
  json,
  readOptional,
  same,
  withSourceLock,
} from "./source-files.mjs";
import { hasMarkers, isText, mergeSource } from "./merge-source.mjs";

const sections = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];
const decode = (bytes, label) => {
  if (!bytes)
    throw new Error(
      `Missing ${label}. Run this command in an installed Tiraz application.`,
    );
  try {
    return JSON.parse(bytes.toString());
  } catch {
    throw new Error(`Invalid JSON in ${label}.`);
  }
};
const token = (id) => {
  if (
    typeof id !== "string" ||
    !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id)
  )
    throw new Error("Invalid review or backup id.");
  return id;
};

async function validateInstalled(root, installed) {
  if (
    !installed ||
    installed.name !== "@amjedfadul/tiraz" ||
    !semver.valid(installed.version) ||
    ![1, 2].includes(installed.schemaVersion) ||
    typeof installed.entry !== "string" ||
    !installed.entry.endsWith("/system/index.ts")
  )
    throw new Error("Unsupported installed source manifest.");
  const directory = installed.entry.slice(0, -"/system/index.ts".length);
  await safePath(root, directory);
  if (installed.schemaVersion === 2)
    await validateSubsetManifest(root, installed);
  const pointers =
    installed.schemaVersion === 2
      ? {}
      : {
          styles: `${directory}/system/styles.css`,
          patternsEntry: `${directory}/system/patterns/index.ts`,
          knowledge: `${directory}/system/ai/generated/manifest.json`,
          docs: `${directory}/system/ai/README.md`,
          examples: `${directory}/system/ai/examples/TaskStarterExamples.tsx`,
          instructions: `${directory}/system/ai/README.md`,
          mascotEntry: `${directory}/mascot/Khayt.tsx`,
        };
  if (
    !installed.files ||
    typeof installed.files !== "object" ||
    Array.isArray(installed.files) ||
    !Object.keys(installed.files).length ||
    hash(JSON.stringify(installed.files)) !== installed.sourceDigest
  )
    throw new Error("Invalid installed source inventory or digest.");
  for (const [key, path] of Object.entries({
    entry: `${directory}/system/index.ts`,
    ...pointers,
  }))
    if (installed[key] !== path || !Object.hasOwn(installed.files, path))
      throw new Error(`Invalid manifest pointer: ${key}.`);
  if (installed.theme && installed.theme !== `${directory}/tiraz.theme.css`)
    throw new Error("Invalid theme path.");
  const folded = new Set();
  for (const [path, checksum] of Object.entries(installed.files)) {
    if (
      !(
        path.startsWith(`${directory}/system/`) ||
        (installed.schemaVersion === 1 &&
          path.startsWith(`${directory}/mascot/`))
      ) ||
      typeof checksum !== "string" ||
      !/^[a-f0-9]{64}$/.test(checksum) ||
      folded.has(path.toLowerCase())
    )
      throw new Error(`Invalid installed source path: ${path}`);
    await safePath(root, path);
    folded.add(path.toLowerCase());
  }
  return directory;
}

async function payload(packageRoot, release, installed, directory) {
  if (installed.schemaVersion === 2)
    return createComponentPayload({
      packageRoot,
      release,
      names: installed.components,
      directory,
    });
  const manifest = relocateSourceManifest(
    await createSourceManifest(packageRoot, "source", release),
    directory,
  );
  if (installed.theme) manifest.theme = installed.theme;
  const files = new Map();
  for (const path of Object.keys(manifest.files))
    files.set(
      path,
      await readFile(
        await safePath(
          packageRoot,
          `source/${path.slice(directory.length + 1)}`,
        ),
      ),
    );
  const dependencies = { ...release.dependencies, ...release.peerDependencies };
  delete dependencies.semver;
  return { files, manifest, dependencies };
}

async function originalSource(root, installed, directory, cache, from) {
  if (!from) {
    if (!cache)
      throw new Error(
        "Original source baseline is missing. Use update --from <matching-original-package-directory> (or an untouched original installation). No files were changed.",
      );
    return decodeBaseline(installed, cache);
  }
  const origin = await realpath(resolve(from));
  const oldInstall = await readOptional(origin, "tiraz.project.json");
  if (oldInstall) {
    const manifest = decode(oldInstall, "original manifest");
    if (
      manifest.sourceDigest !== installed.sourceDigest ||
      manifest.version !== installed.version ||
      manifest.name !== installed.name
    )
      throw new Error(
        "Original installation does not match the installed release.",
      );
    const files = new Map();
    for (const path of Object.keys(installed.files))
      files.set(path, await readOptional(origin, path));
    return decodeBaseline(
      installed,
      Buffer.from(encodeBaseline(installed, files)),
    );
  }
  const release = decode(
    await readOptional(origin, "package.json"),
    "original package.json",
  );
  if (release.name !== installed.name || release.version !== installed.version)
    throw new Error(
      "Original package must match the installed release name and version.",
    );
  const old = await payload(origin, release, installed, directory);
  // An older assembler may differ. Only hash-verified unmodified managed files
  // can supply the original when the old package has no stored assembly bytes.
  for (const path of installed.managed ?? []) {
    if (
      !old.files.get(path) ||
      hash(old.files.get(path)) !== installed.files[path]
    ) {
      const bytes = await readOptional(root, path);
      if (bytes && hash(bytes) === installed.files[path])
        old.files.set(path, bytes);
    }
  }
  return decodeBaseline(
    installed,
    Buffer.from(encodeBaseline(installed, old.files)),
  );
}

function dependenciesFor(bytes, dependencies) {
  const project = decode(bytes, "package.json");
  validateProject(project);
  let changed = false;
  for (const [name, version] of Object.entries(dependencies)) {
    if (!semver.validRange(version))
      throw new Error(`Invalid incoming dependency range: ${name}`);
    const existing = sections.flatMap((section) =>
      project[section]?.[name] == null ? [] : [project[section][name]],
    );
    for (const range of existing)
      if (
        typeof range !== "string" ||
        !semver.validRange(range) ||
        !semver.subset(range, version)
      )
        throw new Error(
          `Dependency ${name} (${range}) is incompatible with ${version}. Resolve the range deliberately before updating; no files changed.`,
        );
    if (!existing.length) {
      project.dependencies ??= {};
      project.dependencies[name] = version;
      changed = true;
    }
  }
  return changed ? Buffer.from(json(project)) : bytes;
}

async function planUpdate(root, packageRoot, release, from) {
  const manifestBytes = await readOptional(root, "tiraz.project.json");
  const installed = decode(manifestBytes, "tiraz.project.json");
  const directory = await validateInstalled(root, installed);
  if (
    release.name !== installed.name ||
    !semver.valid(release.version) ||
    semver.lt(release.version, installed.version)
  )
    throw new Error(
      "Update requires the same package and a release at or above the installed version; downgrades are not supported.",
    );
  const cache = await readOptional(root, baselinePath);
  const base = await originalSource(root, installed, directory, cache, from);
  const incoming = await payload(packageRoot, release, installed, directory);
  await validateInstalled(root, incoming.manifest);
  const packageBytes = await readOptional(root, "package.json");
  const nextPackage = dependenciesFor(packageBytes, incoming.dependencies);
  const guards = new Map([
    ["tiraz.project.json", manifestBytes],
    ["package.json", packageBytes],
    [baselinePath, cache],
  ]);
  const entries = [];
  const allPaths = [
    ...new Set([...base.keys(), ...incoming.files.keys()]),
  ].sort();
  if (
    new Set(allPaths.map((path) => path.toLowerCase())).size !== allPaths.length
  )
    throw new Error(
      "Case-only source renames require manual review before updating.",
    );
  for (const path of allPaths) {
    const local = await readOptional(root, path),
      original = base.get(path) ?? null,
      next = incoming.files.get(path) ?? null;
    guards.set(path, local);
    entries.push({
      path,
      base: original,
      local,
      incoming: next,
      ...(await mergeSource(original, local, next)),
    });
  }
  const fingerprint = hash(
    json({
      release: release.version,
      incoming: incoming.manifest.sourceDigest,
      dependencies: hash(nextPackage),
      inputs: [...guards].map(([path, bytes]) => [
        path,
        bytes === null ? null : hash(bytes),
      ]),
    }),
  );
  const previousDependencies =
    decode(packageBytes, "package.json").dependencies ?? {};
  const dependencyChanges = Object.entries(
    decode(nextPackage, "package.json").dependencies ?? {},
  ).filter(([name, range]) => previousDependencies[name] !== range);
  return {
    installed,
    incoming,
    entries,
    guards,
    fingerprint,
    nextPackage,
    dependencyChanges,
  };
}

async function prepareReview(root, plan) {
  const id = randomUUID(),
    base = `.tiraz/reviews/${id}`;
  const resolutions = Object.fromEntries(
    plan.entries
      .filter((e) => e.status === "conflict")
      .map((e) => [e.path, null]),
  );
  const writes = new Map([
    [
      `${base}/plan.json`,
      {
        before: null,
        content: Buffer.from(
          json({
            schemaVersion: 1,
            fingerprint: plan.fingerprint,
            resolutions,
          }),
        ),
      },
    ],
  ]);
  const lines = [
    "# Tiraz source update review",
    "",
    "Application files have not changed. Compare base, local and incoming. Edit only conflicted merged files and set each conflict in plan.json to local, incoming, merged, or delete. Never copy conflict markers into your app. Other proposal files are read-only comparisons; to change a clean proposal, edit application source and prepare a new review.",
    "",
    "A clean text merge still needs your type checks, tests and browser review. Inspect every proposed change before applying.",
    "",
  ];
  if (plan.dependencyChanges.length) {
    lines.push(
      "Dependency additions:",
      ...plan.dependencyChanges.map(([name, range]) => `- ${name}: ${range}`),
      "",
    );
    writes.set(`${base}/local/package.json`, {
      before: null,
      content: plan.guards.get("package.json"),
    });
    writes.set(`${base}/incoming/package.json`, {
      before: null,
      content: plan.nextPackage,
    });
  }
  for (const entry of plan.entries) {
    if (entry.status === "current") continue;
    lines.push(
      `- ${entry.status}: ${entry.path}${entry.reason ? ` (${entry.reason})` : ""}`,
    );
    for (const [kind, bytes] of [
      ["base", entry.base],
      ["local", entry.local],
      ["incoming", entry.incoming],
      ["merged", entry.content],
    ])
      if (bytes !== null)
        writes.set(`${base}/${kind}/${entry.path}`, {
          before: null,
          content: bytes,
        });
  }
  lines.push(
    "",
    `Apply with the same target CLI: update --apply --review ${id}`,
    "If this is a legacy install without a saved baseline, also repeat --from.",
    "",
  );
  writes.set(`${base}/README.md`, {
    before: null,
    content: Buffer.from(lines.join("\n")),
  });
  await withSourceLock(root, () => commitPlan(root, writes, plan.guards));
  console.log(
    `Review: ${id}\nOpen ${base}/README.md. Application files are unchanged.`,
  );
}

async function resolveReview(root, plan, id) {
  const prefix = `.tiraz/reviews/${token(id)}`;
  const bytes = await readOptional(root, `${prefix}/plan.json`);
  const review = decode(bytes, "review plan");
  if (review.schemaVersion !== 1 || review.fingerprint !== plan.fingerprint)
    throw new Error(
      "Review is stale: source, dependencies or target release changed. Prepare a new review.",
    );
  const conflicts = plan.entries.filter((e) => e.status === "conflict");
  if (
    !review.resolutions ||
    Array.isArray(review.resolutions) ||
    JSON.stringify(Object.keys(review.resolutions).sort()) !==
      JSON.stringify(conflicts.map((e) => e.path).sort())
  )
    throw new Error("Review conflict inventory does not match this update.");
  plan.guards.set(`${prefix}/plan.json`, bytes);
  for (const entry of plan.entries.filter(
    (entry) => !["current", "conflict"].includes(entry.status),
  )) {
    const path = `${prefix}/merged/${entry.path}`;
    const proposal = await readOptional(root, path);
    if (!same(proposal, entry.content))
      throw new Error(
        `A clean proposal was edited: ${entry.path}. Move this edit into your application source, then prepare a fresh review; it will not be silently discarded.`,
      );
    plan.guards.set(path, proposal);
  }
  for (const entry of conflicts) {
    switch (review.resolutions[entry.path]) {
      case "local":
        entry.content = entry.local;
        break;
      case "incoming":
        entry.content = entry.incoming;
        break;
      case "delete":
        entry.content = null;
        break;
      case "merged": {
        const path = `${prefix}/merged/${entry.path}`;
        const merged = await readOptional(root, path);
        if (
          ![entry.base, entry.local, entry.incoming]
            .filter((bytes) => bytes !== null)
            .every(isText) ||
          !isText(merged) ||
          hasMarkers(merged)
        )
          throw new Error(
            `Unresolved markers or non-text merge: ${entry.path}. Choose local/incoming/delete for binary files.`,
          );
        entry.content = merged;
        plan.guards.set(path, merged);
        break;
      }
      default:
        throw new Error(
          `Unresolved conflict: ${entry.path}. Choose a resolution in the review plan.`,
        );
    }
  }
}

async function applyPlan(root, plan) {
  const writes = new Map();
  for (const entry of plan.entries)
    if (!same(entry.local, entry.content))
      writes.set(entry.path, { before: entry.local, content: entry.content });
  for (const [path, content] of [
    ["package.json", plan.nextPackage],
    ["tiraz.project.json", Buffer.from(json(plan.incoming.manifest))],
    [
      baselinePath,
      Buffer.from(encodeBaseline(plan.incoming.manifest, plan.incoming.files)),
    ],
  ])
    if (!same(plan.guards.get(path), content))
      writes.set(path, { before: plan.guards.get(path), content });
  if (!writes.size) {
    console.log("Already current. Local customizations were preserved.");
    return;
  }
  const id = randomUUID();
  const backup = {
    schemaVersion: 1,
    beforeManifest: plan.installed,
    afterManifest: plan.incoming.manifest,
    files: Object.fromEntries(
      [...writes].map(([path, { before, content }]) => [
        path,
        {
          before: before?.toString("base64") ?? null,
          after: content === null ? null : hash(content),
        },
      ]),
    ),
  };
  const backupBytes = Buffer.from(
    json({ ...backup, digest: hash(json(backup)) }),
  );
  await withSourceLock(root, async () => {
    await commitPlan(
      root,
      new Map([
        [`.tiraz/backups/${id}.json`, { before: null, content: backupBytes }],
      ]),
      plan.guards,
    );
    // Keep the durable backup even if the following commit fails or is interrupted.
    await commitPlan(root, writes, plan.guards);
  });
  console.log(
    `Updated source to ${plan.incoming.manifest.version}. Custom edits and the theme were preserved.\nBackup: ${id}\nRun npm install if dependencies changed, then your type checks, tests and browser checks.\nRestore (before further edits): update --restore ${id}`,
  );
}

async function restoreBackup(root, id) {
  const bytes = await readOptional(root, `.tiraz/backups/${token(id)}.json`);
  const { digest, ...backup } = decode(bytes, "backup");
  if (backup.schemaVersion !== 1 || digest !== hash(json(backup)))
    throw new Error("Invalid backup digest.");
  await validateInstalled(root, backup.beforeManifest);
  await validateInstalled(root, backup.afterManifest);
  const allowed = new Set([
    ...Object.keys(backup.beforeManifest.files),
    ...Object.keys(backup.afterManifest.files),
    "package.json",
    "tiraz.project.json",
    baselinePath,
  ]);
  const writes = new Map();
  for (const [path, state] of Object.entries(backup.files)) {
    if (
      !allowed.has(path) ||
      (state.before !== null && typeof state.before !== "string") ||
      (state.after !== null && !/^[a-f0-9]{64}$/.test(state.after))
    )
      throw new Error(`Invalid backup path: ${path}`);
    const current = await readOptional(root, path);
    if ((current === null ? null : hash(current)) !== state.after)
      throw new Error(
        `Cannot restore: ${path} changed after the update. Your later edits were preserved.`,
      );
    const content =
      state.before === null ? null : Buffer.from(state.before, "base64");
    if (content !== null && content.toString("base64") !== state.before)
      throw new Error(`Invalid backup content: ${path}`);
    writes.set(path, { before: current, content });
  }
  await withSourceLock(root, () => commitPlan(root, writes));
  console.log(
    `Restored backup ${id}. Run npm install if dependencies changed, then validate your app.`,
  );
}

export async function updateSource({
  packageRoot,
  release,
  from,
  prepare,
  apply,
  review,
  restore,
}) {
  const root = await realpath(process.cwd());
  if (restore) return restoreBackup(root, restore);
  const plan = await planUpdate(root, packageRoot, release, from);
  console.log(`Tiraz source: ${plan.installed.version} → ${release.version}`);
  for (const entry of plan.entries)
    if (entry.status !== "current")
      console.log(
        `${entry.status.padEnd(9)} ${entry.path}${entry.reason ? ` (${entry.reason})` : ""}`,
      );
  for (const [name, range] of plan.dependencyChanges)
    console.log(`dependency add ${name}: ${range}`);
  if (prepare) return prepareReview(root, plan);
  if (!apply) {
    console.log(
      "Preview only. Use --prepare to inspect changes or --apply to apply a clean update.",
    );
    return;
  }
  if (review) await resolveReview(root, plan, review);
  else if (plan.entries.some((entry) => entry.status === "conflict"))
    throw new Error(
      "Conflicts need review. Run update --prepare; no application files were changed.",
    );
  await applyPlan(root, plan);
}
