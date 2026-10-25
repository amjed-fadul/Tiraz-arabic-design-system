import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { same } from "./source-files.mjs";

export function isText(bytes) {
  if (bytes === null || bytes.includes(0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}
export const hasMarkers = (bytes) =>
  /^(?:<{7}|\|{7}|={7}|>{7})(?: |\r?$)/m.test(bytes.toString());

export async function mergeSource(base, local, incoming) {
  if (same(local, incoming)) return { status: "current", content: local };
  if (same(base, incoming)) return { status: "local", content: local };
  if (same(base, local))
    return {
      status: incoming === null ? "remove" : base === null ? "add" : "update",
      content: incoming,
    };
  if (base === null || local === null || incoming === null)
    return {
      status: "conflict",
      content: local,
      reason: base === null ? "untracked collision" : "modify/delete",
    };
  if (![base, local, incoming].every(isText))
    return { status: "conflict", content: local, reason: "binary content" };
  const folder = await mkdtemp(join(tmpdir(), "tiraz-merge-"));
  try {
    await Promise.all(
      [
        ["base", base],
        ["local", local],
        ["incoming", incoming],
      ].map(([name, bytes]) => writeFile(join(folder, name), bytes)),
    );
    const result = spawnSync(
      "git",
      [
        "merge-file",
        "--stdout",
        "--diff3",
        "-L",
        "TIRAZ_LOCAL",
        "-L",
        "TIRAZ_BASE",
        "-L",
        "TIRAZ_INCOMING",
        join(folder, "local"),
        join(folder, "base"),
        join(folder, "incoming"),
      ],
      { maxBuffer: 64 * 1024 * 1024 },
    );
    if (result.error?.code === "ENOENT")
      return {
        status: "conflict",
        content: local,
        reason: "Git unavailable; merge manually",
      };
    if (result.error || result.status === null || result.status > 127)
      throw new Error(
        `Cannot merge source: ${result.error?.message ?? result.stderr.toString()}`,
      );
    return {
      status: result.status === 0 ? "merge" : "conflict",
      content: result.stdout,
      reason: result.status === 0 ? undefined : "overlapping edits",
    };
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
}
