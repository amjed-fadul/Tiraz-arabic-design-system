// Verification harness, not an application installer. Build/run in a fresh temp app.
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import * as ts from "typescript";
import { build, createServer } from "vite";
import react from "@vitejs/plugin-react";
const repo = fileURLToPath(new URL("../../", import.meta.url));
const app = await mkdtemp(join(tmpdir(), "tiraz-independent-consumer-"));
const source = join(app, "src");
await mkdir(source);
await cp(join(repo, "src/system"), join(source, "vendor/tiraz"), {
  recursive: true,
  filter: (path) => !/\.test\.[cm]?[jt]sx?$/.test(path),
});
for (const name of ["App.tsx", "main.tsx", "styles.css"])
  await cp(new URL(name, import.meta.url), join(source, name));
await cp(new URL("index.html", import.meta.url), join(app, "index.html"));
await symlink(join(repo, "node_modules"), join(app, "node_modules"), "dir");
await writeFile(
  join(app, "package.json"),
  '{"private":true,"type":"module"}\n',
);
const registry = JSON.parse(
  await readFile(join(source, "vendor/tiraz/ai/registry.json"), "utf8"),
);
const examples = [
  ...new Set(registry.components.flatMap((c) => c.examples)),
].map((path) => resolve(source, "vendor/tiraz", path));
const program = ts.createProgram([join(source, "main.tsx"), ...examples], {
  target: ts.ScriptTarget.ES2023,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  noEmit: true,
  noUnusedLocals: true,
  noUnusedParameters: true,
  skipLibCheck: true,
  types: ["vite/client"],
  typeRoots: [join(app, "node_modules/@types"), join(app, "node_modules")],
});
const errors = ts
  .getPreEmitDiagnostics(program)
  .map((d) => ts.flattenDiagnosticMessageText(d.messageText, " "));
if (errors.length) throw new Error(errors.join("\n"));
await build({
  root: app,
  configFile: false,
  plugins: [react()],
  logLevel: "warn",
});
const evidence = process.env.TIRAZ_EVIDENCE || join(app, "evidence");
await mkdir(evidence, { recursive: true });
await writeFile(
  join(evidence, "copy-build.json"),
  JSON.stringify(
    {
      sourceCopy: "src/vendor/tiraz",
      instructionBundleRetained: true,
      standaloneTypecheck: "passed",
      standaloneBuild: "passed",
      requiresWorkbench: false,
      requiresCheckoutReadme: false,
    },
    null,
    2,
  ),
);
const port = Number(process.env.TIRAZ_EXERCISE_PORT || 5190);
const server = await createServer({
  root: app,
  configFile: false,
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port,
    strictPort: true,
    fs: { allow: [app, join(repo, "node_modules")] },
  },
});
await server.listen();
try {
  const status = await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [fileURLToPath(new URL("verify.mjs", import.meta.url))],
      {
        cwd: app,
        env: {
          ...process.env,
          TIRAZ_URL: `http://127.0.0.1:${port}`,
          TIRAZ_EVIDENCE: evidence,
        },
        stdio: "inherit",
      },
    );
    child.once("error", reject);
    child.once("exit", resolve);
  });
  if (status !== 0) throw new Error(`Consumer browser checks exited ${status}`);
  console.log("Standalone source-copy build and browser exercise passed.");
} finally {
  await server.close();
}
