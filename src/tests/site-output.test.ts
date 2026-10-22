import { afterAll, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const folders: string[] = [];
const moduleUrl = pathToFileURL(resolve("scripts/prepare-site.mjs")).href;
const load = async (): Promise<{
  prepareSite: (directory: string) => Promise<void>;
}> => import(/* @vite-ignore */ moduleUrl);
afterAll(async () => {
  for (const path of folders) await rm(path, { recursive: true });
});

it("serves the landing at the filesystem root and preserves the workbench entry", async () => {
  const directory = await mkdtemp(join(tmpdir(), "tiraz-site-"));
  folders.push(directory);
  await writeFile(
    join(directory, "index.html"),
    '<div id="root"></div><script src="docs.js"></script>',
  );
  await writeFile(
    join(directory, "landing.html"),
    '<div id="landing-root"></div><script src="landing.js"></script>',
  );
  await (await load()).prepareSite(directory);
  expect(await readFile(join(directory, "index.html"), "utf8")).toContain(
    'id="landing-root"',
  );
  expect(await readFile(join(directory, "workbench.html"), "utf8")).toContain(
    'src="docs.js"',
  );
  expect(await readFile(join(directory, "landing.html"), "utf8")).toContain(
    'id="landing-root"',
  );
});

it("does not replace the workbench when the landing entry is missing", async () => {
  const directory = await mkdtemp(join(tmpdir(), "tiraz-site-"));
  folders.push(directory);
  await writeFile(join(directory, "index.html"), '<div id="root"></div>');
  await expect((await load()).prepareSite(directory)).rejects.toThrow();
  expect(await readFile(join(directory, "index.html"), "utf8")).toBe(
    '<div id="root"></div>',
  );
});
