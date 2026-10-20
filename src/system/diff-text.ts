import type { DiffSegment } from "./InlineDiff";

// The text work behind InlineDiff and Suggested edits. It lives here because a
// component file that exports anything but components breaks fast refresh.

/**
 * A passage as InlineDiff shows it: unchanged text, or a change. A change is a
 * run of consecutive inserts and deletes, keyed by its first segment's id,
 * with the text it removes and the text it adds.
 */
export type DiffPart =
  | { kind: "same"; id: string; text: string }
  | {
      kind: "change";
      id: string;
      removed: string;
      added: string;
      segments: DiffSegment[];
    };

export function diffParts(segments: readonly DiffSegment[]): DiffPart[] {
  const parts: DiffPart[] = [];
  for (const segment of segments) {
    if (segment.kind === "same") {
      parts.push({ kind: "same", id: segment.id, text: segment.text });
      continue;
    }
    let run = parts[parts.length - 1];
    if (run?.kind !== "change") {
      run = {
        kind: "change",
        id: segment.id,
        removed: "",
        added: "",
        segments: [],
      };
      parts.push(run);
    }
    run.segments.push(segment);
    if (segment.kind === "delete") run.removed += segment.text;
    else run.added += segment.text;
  }
  return parts;
}

/**
 * The passage once decided: an accepted change keeps its inserts and drops its
 * deletes; a rejected or undecided one keeps the original text.
 */
export function diffText(
  segments: readonly DiffSegment[],
  decisions: Readonly<Record<string, "accepted" | "rejected">>,
): string {
  return diffParts(segments)
    .map((part) =>
      part.kind === "same"
        ? part.text
        : decisions[part.id] === "accepted"
          ? part.added
          : part.removed,
    )
    .join("");
}
