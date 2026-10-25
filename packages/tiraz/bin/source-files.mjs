import { createHash, randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  open,
  readFile,
  rename,
  rm,
  rmdir,
  writeFile,
} from "node:fs/promises";
import { dirname } from "node:path";
import { safePath } from "./source-manifest.mjs";

export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const json = (value) => JSON.stringify(value, null, 2) + "\n";
export const baselinePath = ".tiraz/baseline.json";
export async function readOptional(root, path) {
  const target = await safePath(root, path);
  try {
    const stat = await lstat(target);
    if (!stat.isFile() || stat.nlink !== 1)
      throw new Error(`Expected a regular, unlinked file: ${path}`);
    return await readFile(target);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}
export const same = (a, b) =>
  a === null ? b === null : b !== null && a.equals(b);

export function encodeBaseline(manifest, files) {
  return json({
    schemaVersion: 1,
    sourceDigest: manifest.sourceDigest,
    files: Object.fromEntries(
      Object.keys(manifest.files).map((path) => {
        const bytes = files.get(path);
        if (!bytes || hash(bytes) !== manifest.files[path])
          throw new Error(
            `Original source does not match installed baseline: ${path}`,
          );
        return [path, bytes.toString("base64")];
      }),
    ),
  });
}
export function decodeBaseline(manifest, bytes) {
  const data = JSON.parse(bytes.toString());
  if (
    data.schemaVersion !== 1 ||
    data.sourceDigest !== manifest.sourceDigest ||
    !data.files ||
    Array.isArray(data.files) ||
    JSON.stringify(Object.keys(data.files).sort()) !==
      JSON.stringify(Object.keys(manifest.files).sort())
  )
    throw new Error(
      "Original source baseline does not match the installed manifest.",
    );
  const result = new Map();
  for (const [path, expected] of Object.entries(manifest.files)) {
    if (typeof data.files[path] !== "string")
      throw new Error(`Invalid original source: ${path}`);
    const content = Buffer.from(data.files[path], "base64");
    if (
      content.toString("base64") !== data.files[path] ||
      hash(content) !== expected
    )
      throw new Error(`Original source baseline is corrupt: ${path}`);
    result.set(path, content);
  }
  return result;
}

export async function withSourceLock(root, action) {
  const path = await safePath(root, ".tiraz/write.lock");
  await mkdir(dirname(path), { recursive: true });
  let lock;
  try {
    lock = await open(path, "wx");
  } catch (error) {
    if (error.code === "EEXIST")
      throw new Error(
        "Another Tiraz write is active. If it was interrupted, inspect the backup and remove .tiraz/write.lock before retrying.",
      );
    throw error;
  }
  try {
    await lock.writeFile(json({ pid: process.pid }));
    return await action();
  } finally {
    await lock.close();
    await rm(path);
  }
}

/** Preflight every guard; roll back only files still equal to this transaction's writes. */
export async function commitPlan(root, writes, guards = new Map()) {
  // Installation templates arrive as strings; rollback compares on-disk bytes.
  writes = new Map(
    [...writes].map(([path, change]) => [
      path,
      {
        ...change,
        content:
          typeof change.content === "string"
            ? Buffer.from(change.content)
            : change.content,
      },
    ]),
  );
  for (const [path, before] of guards)
    if (!same(await readOptional(root, path), before))
      throw new Error(
        `File changed during update: ${path}. Prepare a fresh review.`,
      );
  for (const [path, { before }] of writes)
    if (!same(await readOptional(root, path), before))
      throw new Error(
        `File changed during installation: ${path}. Retry after reviewing it.`,
      );
  const applied = [],
    directories = [];
  try {
    for (const [path, { before, content }] of writes) {
      const target = await safePath(root, path);
      if (!same(await readOptional(root, path), before))
        throw new Error(`File changed during installation: ${path}.`);
      if (content === null) {
        await rm(target);
        applied.push([path, before, content]);
        continue;
      }
      const missing = [];
      for (
        let parent = dirname(target);
        parent !== root;
        parent = dirname(parent)
      ) {
        try {
          await lstat(parent);
          break;
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
          missing.push(parent);
        }
      }
      await mkdir(dirname(target), { recursive: true });
      directories.push(...missing.reverse());
      const temporary = `${target}.tiraz-${randomUUID()}.tmp`;
      const mode = before === null ? 0o666 : (await lstat(target)).mode & 0o777;
      const handle = await open(temporary, "wx", mode);
      try {
        await handle.writeFile(content);
        await handle.sync();
        await handle.close();
        if (!same(await readOptional(root, path), before))
          throw new Error(`File changed during installation: ${path}.`);
        await rename(temporary, target);
        applied.push([path, before, content]);
      } finally {
        await handle.close();
        await rm(temporary, { force: true });
      }
    }
  } catch (error) {
    const retained = [];
    for (const [path, before, content] of applied.reverse()) {
      try {
        const current = await readOptional(root, path);
        if (!same(current, content)) {
          retained.push(path);
          continue;
        }
        const target = await safePath(root, path);
        if (before === null) await rm(target);
        else await writeFile(target, before);
      } catch {
        retained.push(path);
      }
    }
    for (const path of [...new Set(directories)].reverse()) {
      try {
        await rmdir(path);
      } catch {
        /* Keep concurrent user files. */
      }
    }
    if (retained.length)
      error.message += ` Recovery requires review for: ${retained.join(", ")}. For an update, recovery data is in .tiraz/backups. No concurrent changes were overwritten.`;
    throw error;
  }
}
