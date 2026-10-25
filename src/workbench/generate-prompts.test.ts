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
      // Every read target must exist in the source bundle.
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
      // The instructions are English on every page; the example code keeps
      // the page's language.
      expect(prompt).toContain("source copy");
      expect(prompt).toContain("Adjust");
      expect(prompt).not.toContain("npx");
      expect(prompt).toContain(generateCode(entry.id, model, config, language));
      expect(prompt).toMatch(/\n```$/);
      expect(prompt).toContain(JSON.stringify(config));
      expect(prompt.startsWith("First locate Tiraz")).toBe(true);
      expect(prompt).toContain("If you cannot locate the system");
      const instructions = prompt.split("```tsx\n")[0];
      expect(instructions).not.toMatch(/[\u0600-\u06ff]/);
      expect(instructions).toContain("## Locate the source");
      expect(instructions).toContain("## Current settings");
      expect(instructions).toContain("## Integrate");
      expect(instructions).toContain("## Validate");
      expect(instructions).toContain("## Current example");
      expect(instructions).toContain("query only the relevant entries");
      expect(instructions).toContain("records");
      expect(instructions).toContain("Respect the installed subset");
      expect(instructions).toContain(
        "Retain the installed guidance, provenance and licenses",
      );
      expect(instructions).toContain("keyboard");
      expect(instructions).toContain("accessible names");
      expect(instructions).toContain("RTL and LTR");
      expect(instructions).toContain(
        `Language: ${language === "ar" ? "Arabic" : "English"} (${language})`,
      );
    });
  }
}
it("includes portrait guidance only when the current example imports bundled photos", () => {
  const models = defaultPlaygrounds("en");
  const instructionsFor = (
    component: Parameters<typeof generatePrompt>[0],
    model = models[component],
  ) =>
    generatePrompt(component, model, defaultConfig, "en").split("```tsx\n")[0];
  expect(instructionsFor("button")).not.toContain("portrait");
  expect(
    instructionsFor("avatar", { ...models.avatar, appearance: "initials" }),
  ).not.toContain("portrait");
  expect(
    instructionsFor("avatar", {
      ...models.avatar,
      appearance: "photo",
      src: "",
    }),
  ).toContain("bundled portraits");
  expect(
    instructionsFor("avatar", {
      ...models.avatar,
      appearance: "photo",
      src: "https://example.com/photo.jpg",
    }),
  ).not.toContain("bundled portraits");
  expect(instructionsFor("skeleton")).toContain("bundled portraits");
});
it("keeps Terminal and ChatApp integration guidance specific to their own example", () => {
  const models = defaultPlaygrounds("en");
  const terminal = generatePrompt(
    "terminal",
    models.terminal,
    defaultConfig,
    "en",
  ).split("```tsx\n")[0];
  const chat = generatePrompt(
    "chat-app",
    models["chat-app"],
    defaultConfig,
    "en",
  ).split("```tsx\n")[0];
  expect(terminal).toContain("No HTML/ANSI interpretation");
  expect(terminal).not.toContain("Host owns conversations");
  expect(chat).toContain("Host owns conversations");
  expect(chat).not.toContain("Terminal is read-only");
});
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
      "src/workbench/agent-preview.ts",
      "src/workbench/generate-batch.ts",
      "src/workbench/generate-charts.ts",
      "src/workbench/theme-customization.ts",
      "src/workbench/exhaustive.ts",
      "src/system/ai/examples/team.ts",
      "src/workbench/catalog.ts",
      "src/workbench/model.ts",
      "src/workbench/fields.ts",
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
    for (const name of [
      "TerminalExamples",
      "ChatAppExample",
      "useLocalResponse",
      "AgentTaskExamples",
      "TaskStarterExamples",
      "SuggestedEditsExamples",
      "ImageGenerationExamples",
      "DraftReviewExamples",
      "CitedAnswerExamples",
      "DataAnswerExamples",
      "DecisionInboxExamples",
      "ChangeSummaryExamples",
      "AssistantControlsExamples",
      "AIDecisionsExamples",
      "AIContextExamples",
      "AIResultsExamples",
      "AIFeedbackExamples",
      "AIContentExamples",
      "ChatExamples",
      "ToolActivityExamples",
      "FileTreeExamples",
      "TaskRowsExamples",
      "NotificationListExamples",
      "StepsExamples",
      "TimelineExamples",
      "CreateCustomer",
      "CustomerDataTable",
      "OverlayExamples",
      "SkeletonExample",
      "StructureExamples",
      "ChartExamples",
      "SidebarExamples",
      "TagInputExamples",
      "FileDropzoneExamples",
      "ColorPickerExamples",
      "SliderExamples",
      "ChipExamples",
      "OTPInputExamples",
      "DatePickerExamples",
      "FilterBarExamples",
      "InputCopyExamples",
    ]) {
      const path = `src/system/ai/examples/${name}.${name === "useLocalResponse" ? "ts" : "tsx"}`;
      const outputPath = join(first, path + "?raw");
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(
        outputPath,
        `Object.defineProperty(exports, "__esModule", { value: true }); exports.default = ${JSON.stringify(readFileSync(join(projectRoot, path), "utf8"))};`,
      );
    }
    for (const path of [
      "src/workbench/agent-preview.ts",
      "src/workbench/playground-agent.tsx",
    ]) {
      writeFileSync(
        join(first, path + "?raw"),
        `Object.defineProperty(exports, "__esModule", { value: true }); exports.default = ${JSON.stringify(readFileSync(join(projectRoot, path), "utf8"))};`,
      );
    }
    cpSync(first, second, { recursive: true });
    const run = `const {generatePrompt}=require('./src/workbench/generate.js');const {catalog}=require('./src/workbench/catalog.js');const {defaultPlaygrounds}=require('./src/workbench/model.js');const {defaultConfig}=require('./src/system/config.js');console.log(JSON.stringify(['ar','en'].flatMap(language=>catalog.map(entry=>generatePrompt(entry.id,defaultPlaygrounds(language)[entry.id],defaultConfig,language)))));`;
    const original = execFileSync(process.execPath, ["-e", run], {
      cwd: first,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });
    const relocated = execFileSync(process.execPath, ["-e", run], {
      cwd: second,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });
    expect(JSON.parse(original)).toHaveLength(catalog.length * 2);
    expect(relocated).toBe(original);
    expect(original).not.toContain(first);
    expect(relocated).not.toContain(second);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
