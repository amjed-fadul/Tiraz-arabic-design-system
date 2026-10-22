import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Ajv from "ajv";
import formats from "ajv-formats";
import { hash } from "../../scripts/knowledge.mjs";
const read = (p) =>
  JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
test("registry follows the official schemas and matches installed file hashes", () => {
  const ajv = new Ajv({ strict: false, allErrors: true });
  formats(ajv);
  ajv.addMetaSchema(
    ajv.getSchema("http://json-schema.org/draft-07/schema#").schema,
    "https://json-schema.org/draft-07/schema#",
  );
  ajv.addSchema(
    read("./schemas/registry-item.schema.json"),
    "https://ui.shadcn.com/schema/registry-item.json",
  );
  for (const [schemaPath, dataPath] of [
    ["./schemas/registry-item.schema.json", "../../public/r/tiraz-system.json"],
    ["./schemas/registry.schema.json", "../../public/r/registry.json"],
  ]) {
    const validate = ajv.compile(read(schemaPath));
    assert.equal(
      validate(read(dataPath)),
      true,
      JSON.stringify(validate.errors),
    );
  }
  const item = read("../../public/r/tiraz-system.json");
  const manifest = JSON.parse(
    item.files.find((f) => f.target === "~/tiraz.project.json").content,
  );
  assert.ok(item.dependencies.some((d) => d.startsWith("react-dom@")));
  for (const [path, digest] of Object.entries(manifest.files))
    assert.equal(
      hash(item.files.find((f) => f.target === `~/${path}`).content),
      digest,
    );
  assert.ok(
    item.files.every(
      (f) => typeof f.content === "string" && f.target.startsWith("~/"),
    ),
  );
});
