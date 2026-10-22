import assert from "node:assert/strict";
import { test } from "node:test";
import {
  existsSync,
  readFileSync,
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { buildKnowledge, writeOrCheck } from "../../scripts/knowledge.mjs";
import { execFileSync } from "node:child_process";

test("published contracts preserve actual Button accessibility and Switch inheritance", () => {
  assert.ok(
    existsSync("knowledge/components/button.json"),
    "generate component contracts",
  );
  const button = JSON.parse(readFileSync("knowledge/api/Button.json", "utf8"));
  assert.equal(button.props.variant.type, "ButtonVariant | undefined");
  assert.ok(
    button.branches.some(
      (b) => b.required.includes("aria-label") && b.props.iconOnly === "true",
    ),
  );
  assert.ok(
    button.branches.some((b) => b.props.iconOnly === "false | undefined"),
  );
  const toggle = JSON.parse(readFileSync("knowledge/api/Switch.json", "utf8"));
  assert.equal(toggle.props.label.required, true);
  assert.ok(toggle.props.onCheckedChange);
  assert.equal(toggle.props.asChild, undefined);
  assert.equal(toggle.props.children, undefined);
});
test("knowledge has real dependencies and separates the workbench model from the public API", () => {
  assert.ok(
    existsSync("knowledge/system.manifest.json"),
    "generate system manifest",
  );
  const manifest = JSON.parse(
    readFileSync("knowledge/system.manifest.json", "utf8"),
  );
  assert.equal(manifest.components.length, 6);
  assert.ok(manifest.dependencies["@radix-ui/react-direction"]);
  assert.equal(manifest.dependencies["@tailwindcss/vite"], undefined);
  const menu = JSON.parse(
    readFileSync("knowledge/api/DropdownMenu.json", "utf8"),
  );
  assert.equal(menu.props.trigger.required, true);
  assert.equal(menu.props.triggerLabel, undefined);
  assert.ok(existsSync("docs/ai/components/dropdown.md"));
});
test("generated artifacts are reproducible", () => {
  assert.ok(existsSync("scripts/knowledge.mjs"), "implement generator");
  execFileSync(process.execPath, ["scripts/knowledge.mjs", "--check"], {
    stdio: "pipe",
  });
});

test("token mode conditions and enum members remain machine-readable", () => {
  const tokens = JSON.parse(readFileSync("knowledge/tokens.json", "utf8"));
  assert.ok(
    tokens.tokens["--motion-fast"].values.some((v) =>
      v.context.includes("@media (prefers-reduced-motion: reduce)"),
    ),
  );
  const button = JSON.parse(readFileSync("knowledge/api/Button.json", "utf8"));
  assert.ok(button.relatedTypes.ButtonVariant.members.includes('"primary"'));
  assert.ok(existsSync("public/llms.txt"));
});
test("the freshness check rejects changed generated output", () => {
  const output = buildKnowledge();
  output.set("llms.txt", output.get("llms.txt") + "stale");
  assert.throws(
    () => writeOrCheck(output, true),
    /Stale generated artifacts: llms.txt/,
  );
});

test("obsolete generated files are rejected and removed only in owned output directories", () => {
  mkdirSync("node_modules/.tmp", { recursive: true });
  const fixture = mkdtempSync("node_modules/.tmp/tiraz-generated-");
  try {
    writeFileSync(`${fixture}/current.json`, "current");
    writeFileSync(`${fixture}/obsolete.json`, "obsolete");
    const output = new Map([[`${fixture}/current.json`, "current"]]);
    assert.throws(
      () => writeOrCheck(output, true, [fixture]),
      /Obsolete generated artifacts/,
    );
    writeOrCheck(output, false, [fixture]);
    assert.equal(existsSync(`${fixture}/obsolete.json`), false);
    assert.equal(readFileSync(`${fixture}/current.json`, "utf8"), "current");
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
