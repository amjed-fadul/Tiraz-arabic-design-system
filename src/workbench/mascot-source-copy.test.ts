import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import * as ts from "typescript";
import { expect, it } from "vitest";
import { agentPreviewComponents } from "./agent-preview";
import { defaultPlaygrounds } from "./model";
import { generateCode } from "./generate";
import { defaultConfig } from "../system/config";

it("compiles mascot examples with only copied library and avatar runtime at a different path", () => {
  const original = ts.sys.getCurrentDirectory();
  const temporary = mkdtempSync(resolve(tmpdir(), "tiraz-mascot-consumer-"));
  try {
    const kit = resolve(temporary, "app/vendor/tiraz"),
      mascot = resolve(temporary, "app/mascot");
    mkdirSync(dirname(kit), { recursive: true });
    mkdirSync(mascot, { recursive: true });
    cpSync(resolve(original, "src/system"), kit, {
      recursive: true,
      filter: (path) => !path.includes(".test."),
    });
    for (const file of [
      "Khayt.tsx",
      "khayt-artwork.ts",
      "khayt-renderer.ts",
      "khayt-motion.ts",
      "khayt.css",
      "assets",
    ])
      cpSync(resolve(original, "src/mascot", file), resolve(mascot, file), {
        recursive: true,
      });
    const source = readFileSync(resolve(mascot, "Khayt.tsx"), "utf8").replace(
      '"../system/useReducedMotion"',
      '"../vendor/tiraz/useReducedMotion"',
    );
    writeFileSync(resolve(mascot, "Khayt.tsx"), source);
    symlinkSync(
      resolve(original, "node_modules"),
      resolve(temporary, "node_modules"),
      "dir",
    );
    const entries: string[] = [];
    for (const language of ["ar", "en"] as const)
      for (const id of agentPreviewComponents) {
        const entry = resolve(temporary, `app/${id}-${language}.tsx`);
        writeFileSync(
          entry,
          generateCode(
            id,
            defaultPlaygrounds(language)[id],
            defaultConfig,
            language,
          ).replaceAll('"./system', '"./vendor/tiraz'),
        );
        entries.push(entry);
      }
    const program = ts.createProgram(entries, {
      target: ts.ScriptTarget.ES2023,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      types: ["vite/client"],
      typeRoots: [
        resolve(temporary, "node_modules/@types"),
        resolve(temporary, "node_modules"),
      ],
    });
    expect(
      ts
        .getPreEmitDiagnostics(program)
        .map((d) => ts.flattenDiagnosticMessageText(d.messageText, " ")),
    ).toEqual([]);
    expect(
      program
        .getSourceFiles()
        .some((file) =>
          resolve(file.fileName).startsWith(resolve(original, "src")),
        ),
    ).toBe(false);
    expect(existsSync(resolve(mascot, "assets/khayt-body.png"))).toBe(true);
    expect(existsSync(resolve(mascot, "assets/README.md"))).toBe(true);
    expect(existsSync(resolve(temporary, "app/workbench"))).toBe(false);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}, 15000);
