/// <reference types="node" />
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import * as ts from "typescript";
import { expect, it } from "vitest";
import { catalog } from "./catalog";
import { defaultPlaygrounds } from "./model";
import { defaultConfig } from "../system/config";
import { generateCode, generatePrompt } from "./generate";
const projectRoot = resolve(ts.sys.getCurrentDirectory());
for (const language of ["ar", "en"] as const) {
  for (const entry of catalog) {
    it(`generates a portable ${language} prompt for ${entry.id} with real source and guidance paths`, () => {
      const model = defaultPlaygrounds(language)[entry.id];
      const config = {
        ...defaultConfig,
        theme: "dark" as const,
        accent: "blue" as const,
        direction: language === "ar" ? ("rtl" as const) : ("ltr" as const),
      };
      const prompt = generatePrompt(entry.id, model, config, language);
      // Read targets must exist; src/Example.tsx is explicitly a proposed output file.
      for (const path of [
        "src/system/ai/README.md",
        "src/system/ai/registry.json",
        "src/system/ai/composition.md",
        `src/system/${entry.file}`,
        "src/system/index.ts",
        "src/system/config.ts",
      ]) {
        expect(existsSync(resolve(projectRoot, path))).toBe(true);
        expect(prompt).toContain(path.replace("src/system/", ""));
      }
      expect(prompt).not.toMatch(/(?<![\w.:/])\/(?!\/)[\w-]+\//);
      expect(prompt).not.toMatch(/[A-Za-z]:\\/);
      expect(prompt).not.toContain(projectRoot.replace(/\/$/, ""));
      expect(prompt).not.toContain("Create src/Example.tsx under that root");
      expect(prompt).toContain(
        language === "ar" ? "نسخة المصدر" : "source copy",
      );
      expect(prompt).toContain(language === "ar" ? "عدّل" : "Adjust");
      expect(prompt).not.toContain("npx");
      expect(prompt).toContain(generateCode(entry.id, model, config, language));
      expect(prompt).toContain(JSON.stringify(config));
      expect(prompt).toContain(
        language === "ar" ? "اعثر أولًا" : "First locate Tiraz",
      );
      expect(prompt).toContain(
        language === "ar" ? "إذا لم تتمكن" : "If you cannot locate the system",
      );
    });
  }
}
it("generates identical prompts when the same checkout is relocated", () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), "tiraz-prompt-relocation-"));
  try {
    const first = join(temporaryRoot, "original-checkout"),
      second = join(temporaryRoot, "different-parent", "relocated-checkout");
    mkdirSync(first);
    writeFileSync(join(first, "package.json"), '{"type":"commonjs"}');
    // Compile the real pure generator and its runtime dependencies, then run that
    // same checkout from two physical locations/cwds, without mocking the generator.
    for (const path of [
      "src/workbench/generate.ts",
      "src/workbench/catalog.ts",
      "src/workbench/model.ts",
      "src/workbench/i18n.ts",
      "src/workbench/native-attributes.ts",
      "src/system/config.ts",
    ]) {
      const outputPath = join(first, path.replace(/\.ts$/, ".js"));
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(
        outputPath,
        ts.transpileModule(readFileSync(join(projectRoot, path), "utf8"), {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2023,
          },
        }).outputText,
      );
    }
    // Mirror Vite's ?raw loader using the real example source in both relocated trees.
    for (const name of ["CreateCustomer", "CustomerDataTable"]) {
      const path = `src/system/ai/examples/${name}.tsx`;
      const outputPath = join(first, path + "?raw");
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(
        outputPath,
        `Object.defineProperty(exports, "__esModule", { value: true }); exports.default = ${JSON.stringify(readFileSync(join(projectRoot, path), "utf8"))};`,
      );
    }
    cpSync(first, second, { recursive: true });
    const run = `const {generatePrompt}=require('./src/workbench/generate.js');const {catalog}=require('./src/workbench/catalog.js');const {defaultPlaygrounds}=require('./src/workbench/model.js');const {defaultConfig}=require('./src/system/config.js');console.log(JSON.stringify(['ar','en'].flatMap(language=>catalog.map(entry=>generatePrompt(entry.id,defaultPlaygrounds(language)[entry.id],defaultConfig,language)))));`;
    const original = execFileSync(process.execPath, ["-e", run], {
      cwd: first,
      encoding: "utf8",
    });
    const relocated = execFileSync(process.execPath, ["-e", run], {
      cwd: second,
      encoding: "utf8",
    });
    expect(JSON.parse(original)).toHaveLength(catalog.length * 2);
    expect(relocated).toBe(original);
    expect(original).not.toContain(first);
    expect(relocated).not.toContain(second);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
