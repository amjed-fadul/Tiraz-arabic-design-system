import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// This is a release artifact, including when spawned by Vitest (NODE_ENV=test).
process.env.NODE_ENV = "production";
const { build } = await import("vite");

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(root, "packages/tiraz");
const manifest = JSON.parse(
  await readFile(resolve(target, "package.json"), "utf8"),
);
const app = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
for (const [name, version] of Object.entries(manifest.dependencies)) {
  if (app.dependencies[name] !== version)
    throw new Error(
      `Package dependency ${name} must match the verified app version.`,
    );
}
await rm(resolve(target, "dist"), { recursive: true, force: true });
await rm(resolve(target, "source"), { recursive: true, force: true });

await build({
  configFile: false,
  root,
  publicDir: false,
  plugins: [
    {
      name: "tiraz-mascot-assets",
      enforce: "pre",
      load(id) {
        const path = id.split("?")[0];
        if (
          path.startsWith(resolve(root, "src/mascot/assets")) &&
          path.endsWith(".png")
        )
          return `export default ${JSON.stringify(`__TIRAZ_ASSET_${basename(path)}__`)};`;
      },
      renderChunk(code) {
        return code.replace(
          /["']__TIRAZ_ASSET_([^"']+)__["']/g,
          (_, name) =>
            `new URL(${JSON.stringify(`./assets/${name}`)}, import.meta.url).href`,
        );
      },
    },
  ],
  build: {
    outDir: resolve(target, "dist"),
    emptyOutDir: false,
    cssTarget: ["chrome120", "edge120", "firefox114", "safari16.4", "ios16.4"],
    lib: {
      entry: {
        index: resolve(root, "src/system/index.ts"),
        mascot: resolve(root, "src/mascot/Khayt.tsx"),
      },
      formats: ["es"],
      fileName: (_, entry) => `${entry}.js`,
      cssFileName: "mascot",
    },
    rolldownOptions: {
      external: (id) =>
        Object.keys({
          ...manifest.dependencies,
          ...manifest.peerDependencies,
        }).some((name) => id === name || id.startsWith(`${name}/`)),
      output: { chunkFileNames: "[name]-[hash].js", banner: '"use client";' },
    },
  },
});
const types = spawnSync(
  process.execPath,
  [
    resolve(root, "node_modules/typescript/bin/tsc"),
    "-p",
    "tsconfig.package.json",
  ],
  { cwd: root, stdio: "inherit" },
);
if (types.status !== 0) process.exit(types.status ?? 1);

const filter = (path) =>
  !/\.test\.[cm]?[jt]sx?$|\.DS_Store$|css-audit(?:\.families)?\.ts$/.test(path);
await cp(resolve(root, "src/system"), resolve(target, "source/system"), {
  recursive: true,
  filter,
});
const runtime = [
  "Khayt.tsx",
  "khayt-artwork.ts",
  "khayt-renderer.ts",
  "khayt-motion.ts",
  "khayt.css",
  "assets",
];
await mkdir(resolve(target, "source/mascot"), { recursive: true });
for (const path of runtime)
  await cp(
    resolve(root, "src/mascot", path),
    resolve(target, "source/mascot", path),
    { recursive: true },
  );
await cp(resolve(root, "src/mascot/assets"), resolve(target, "dist/assets"), {
  recursive: true,
});
await cp(resolve(root, "LICENSE"), resolve(target, "LICENSE"));
await cp(resolve(root, "LICENSE"), resolve(target, "source/system/LICENSE"));
await writeFile(
  resolve(target, "fonts.css"),
  [400, 500, 600]
    .map(
      (weight) => `@import "@fontsource/ibm-plex-sans-arabic/${weight}.css";`,
    )
    .join("\n") + "\n",
);
await writeFile(
  resolve(target, "styles.css"),
  '@import "./fonts.css";\n@import "./source/system/tokens.css";\n@import "./source/system/components.css";\n',
);
console.log(
  `Built ${manifest.name}@${manifest.version} with editable source and declarations.`,
);
