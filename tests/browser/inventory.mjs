import { readFile } from "node:fs/promises";
import * as ts from "typescript";
const source = await readFile(
  new URL("../../src/workbench/catalog.ts", import.meta.url),
  "utf8",
);
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const { navigationCatalog: catalog } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
);
export const ids = catalog.map((item) => item.id);
export const names = {
  ar: catalog.map((item) => item.name[0]),
  en: catalog.map((item) => item.name[1]),
};
