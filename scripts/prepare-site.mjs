import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The host's filesystem index must be the landing, before fallback rewrites. */
export async function prepareSite(directory) {
  const [workbench, landing] = await Promise.all([
    readFile(resolve(directory, "index.html"), "utf8"),
    readFile(resolve(directory, "landing.html"), "utf8"),
  ]);
  if (
    !workbench.includes('id="root"') ||
    !landing.includes('id="landing-root"')
  )
    throw new Error("Expected fresh Vite workbench and landing entries.");
  await writeFile(resolve(directory, "workbench.html"), workbench);
  await writeFile(resolve(directory, "index.html"), landing);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await prepareSite(
    resolve(dirname(fileURLToPath(import.meta.url)), "../dist"),
  );
  console.log(
    "Website root serves the landing; workbench deep links use workbench.html.",
  );
}
