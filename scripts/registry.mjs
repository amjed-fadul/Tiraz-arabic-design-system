import { distribution } from "./distribution.mjs";
import { writeOrCheck } from "./knowledge.mjs";
const { files, manifest } = distribution();
const item = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "tiraz-system",
  type: "registry:item",
  title: "Tiraz",
  license: "MIT",
  description:
    "Arabic-first source-owned React system, patterns, contracts and examples.",
  dependencies: Object.entries(manifest.dependencies).map(
    ([name, version]) => `${name}@${version}`,
  ),
  files: [...files].map(([path, content]) => ({
    path: `tiraz/${path}`,
    type: "registry:file",
    target: `~/src/tiraz/${path}`,
    content,
  })),
};
item.files.push({
  path: "tiraz.project.json",
  type: "registry:file",
  target: "~/tiraz.project.json",
  content: JSON.stringify(manifest, null, 2) + "\n",
});
writeOrCheck(
  new Map([
    ["public/r/tiraz-system.json", JSON.stringify(item, null, 2) + "\n"],
    [
      "public/r/registry.json",
      JSON.stringify(
        {
          $schema: "https://ui.shadcn.com/schema/registry.json",
          name: "tiraz",
          homepage: "https://github.com/amjed-fadul/Tiraz-arabic-design-system",
          items: [item],
        },
        null,
        2,
      ) + "\n",
    ],
  ]),
  process.argv.includes("--check"),
  ["public/r"],
);
console.log("Registry artifacts are ready. No registry has been published.");
