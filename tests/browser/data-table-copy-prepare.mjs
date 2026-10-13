import {
  cpSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  symlinkSync,
} from "node:fs";
import { resolve } from "node:path";
const destination =
  process.env.TIRAZ_COPY_ROOT || "/tmp/tiraz-data-table-source-copy";
mkdirSync(destination, { recursive: true });
cpSync("src/system", resolve(destination, "system"), {
  recursive: true,
  filter: (path) => !path.includes(".test."),
});
cpSync(
  "docs/data-table-v1/browser/copied-example.tsx",
  resolve(destination, "App.tsx"),
);
writeFileSync(
  resolve(destination, "main.tsx"),
  'import { createRoot } from "react-dom/client"; import App from "./App"; createRoot(document.getElementById("root")!).render(<App />);',
);
writeFileSync(
  resolve(destination, "index.html"),
  '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Copied Tiraz customer table</title><style>body{margin:24px;background:#fff}#root{max-width:960px;margin:auto}</style></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>',
);
writeFileSync(
  resolve(destination, "package.json"),
  JSON.stringify({
    ...JSON.parse(readFileSync("package.json", "utf8")),
    scripts: { dev: "vite", build: "tsc --noEmit && vite build" },
  }),
);
writeFileSync(
  resolve(destination, "tsconfig.json"),
  JSON.stringify({
    compilerOptions: {
      target: "ES2023",
      module: "ESNext",
      moduleResolution: "Bundler",
      jsx: "react-jsx",
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      skipLibCheck: true,
      types: ["vite/client"],
    },
    include: ["*.tsx", "system"],
  }),
);
writeFileSync(
  resolve(destination, "vite.config.mjs"),
  'import react from "@vitejs/plugin-react"; export default {plugins:[react()]};',
);
try {
  symlinkSync(
    resolve("node_modules"),
    resolve(destination, "node_modules"),
    "dir",
  );
} catch (error) {
  if (error.code !== "EEXIST") throw error;
}
console.log(
  JSON.stringify({
    destination,
    source: "actual clipboard code + relocated system only",
    workbenchFiles: false,
  }),
);
