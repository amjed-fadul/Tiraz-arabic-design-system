import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  root,
  runtimeFiles,
  filesUnder,
  hash,
  buildKnowledge,
  writeOrCheck,
} from "./knowledge.mjs";
export function distribution(destination = "src/tiraz") {
  // Refuse to distribute stale contracts, even if invoked outside CI.
  writeOrCheck(buildKnowledge(), true);
  const files = new Map(
    [
      ...runtimeFiles(),
      ...filesUnder("knowledge"),
      ...filesUnder("docs/ai"),
      "llms.txt",
      "LICENSE",
    ].map((p) => [p, readFileSync(resolve(root, p), "utf8")]),
  );
  files.set(
    "styles.css",
    '@import "./src/system/styles.css";\n@import "./src/patterns/patterns.css";\n',
  );
  const system = JSON.parse(files.get("knowledge/system.manifest.json"));
  const manifest = {
    schemaVersion: 1,
    name: "tiraz",
    version: system.version,
    sourceDigest: system.sourceDigest,
    entry: `${destination}/src/system/index.ts`,
    styles: `${destination}/styles.css`,
    patternsEntry: `${destination}/src/patterns/index.ts`,
    knowledge: `${destination}/knowledge/system.manifest.json`,
    docs: `${destination}/docs/ai/integration.md`,
    examples: `${destination}/src/examples/Components.tsx`,
    instructions: `${destination}/llms.txt`,
    dependencies: system.dependencies,
    files: Object.fromEntries(
      [...files].map(([p, contents]) => [
        `${destination}/${p}`,
        hash(contents),
      ]),
    ),
  };
  return { files, manifest };
}
