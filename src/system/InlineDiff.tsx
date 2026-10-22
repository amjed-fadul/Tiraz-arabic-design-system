import { Fragment, useId, useRef } from "react";
import type { KeyboardEvent } from "react";
import { Kbd } from "./Kbd";
import { diffParts } from "./diff-text";
import { inlineDiffCopy } from "./inline-diff-copy";
import { useSystem } from "./useSystem";

/** A run of the passage: text that stays, or text a change inserts or deletes. */
export interface DiffSegment {
  id: string;
  kind: "same" | "insert" | "delete";
  text: string;
}
/** Every built-in string InlineDiff shows; `labels` overrides any of them. */
export interface InlineDiffLabels {
  accept: string;
  reject: string;
  /** Names a change by what it does: «حذف «…» وإضافة «…»». */
  change: (removed: string, added: string) => string;
  /** Describes each button with its key: «اختصار لوحة المفاتيح: Y». */
  shortcut: (key: string) => string;
}
export interface InlineDiffProps {
  segments: readonly DiffSegment[];
  /** Keyed by each change's first segment id. */
  decisions: Readonly<Record<string, "accepted" | "rejected">>;
  onDecisionsChange: (next: Record<string, "accepted" | "rejected">) => void;
  labels?: Partial<InlineDiffLabels>;
}

const textField =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

/**
 * Tracked changes in running text (spec section 11). A change is a run of
 * consecutive inserts and deletes: a focusable group named by what it does,
 * with its own accept (Y) and reject (N). The keys match by position
 * (`event.code`), so an Arabic layout works, and only while focus is in the
 * change; never on a repeat, with Ctrl, Meta or Alt, or in a text field.
 */
export function InlineDiff({
  segments,
  decisions,
  onDecisionsChange,
  labels,
}: InlineDiffProps) {
  const { config } = useSystem(),
    uid = useId();
  const root = useRef<HTMLSpanElement>(null);
  const copy: InlineDiffLabels = {
    ...inlineDiffCopy[config.direction === "rtl" ? "ar" : "en"],
    ...labels,
  };
  // A focused change's bar opens from the change's inline start. Near the end
  // of a line that would run past the passage, so it opens from the change's
  // inline end instead.
  function place(change: HTMLElement) {
    const bar = change.lastElementChild,
      edge = root.current?.parentElement?.getBoundingClientRect();
    if (!bar || !edge) return;
    delete change.dataset.flip;
    const box = bar.getBoundingClientRect();
    if (
      config.direction === "rtl" ? box.left < edge.left : box.right > edge.right
    )
      change.dataset.flip = "";
  }
  function decide(id: string, decision: "accepted" | "rejected") {
    if (decisions[id] !== decision)
      onDecisionsChange({ ...decisions, [id]: decision });
  }
  function keyDown(event: KeyboardEvent<HTMLElement>, id: string) {
    if (
      event.defaultPrevented ||
      event.repeat ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.nativeEvent.isComposing ||
      event.keyCode === 229 ||
      (event.target as Element).closest(textField)
    )
      return;
    const decision =
      event.code === "KeyY"
        ? "accepted"
        : event.code === "KeyN"
          ? "rejected"
          : undefined;
    if (!decision) return;
    event.preventDefault();
    decide(id, decision);
  }
  return (
    <span ref={root} className="tz-inline-diff">
      {diffParts(segments).map((part) => {
        if (part.kind === "same")
          return <Fragment key={part.id}>{part.text}</Fragment>;
        const decision = decisions[part.id];
        return (
          <span
            key={part.id}
            role="group"
            tabIndex={0}
            aria-label={copy.change(part.removed, part.added)}
            className="tz-inline-diff-change"
            data-change-id={part.id}
            data-decision={decision}
            onFocus={(event) => place(event.currentTarget)}
            onKeyDown={(event) => keyDown(event, part.id)}
          >
            {part.segments.map((segment) =>
              segment.kind === "delete" ? (
                <del key={segment.id}>{segment.text}</del>
              ) : (
                <ins key={segment.id}>{segment.text}</ins>
              ),
            )}
            <span className="tz-inline-diff-bar">
              <button
                type="button"
                aria-pressed={decision === "accepted"}
                aria-describedby={`${uid}-y`}
                onClick={() => decide(part.id, "accepted")}
              >
                {copy.accept}
                <Kbd keys={["Y"]} />
              </button>
              <button
                type="button"
                aria-pressed={decision === "rejected"}
                aria-describedby={`${uid}-n`}
                onClick={() => decide(part.id, "rejected")}
              >
                {copy.reject}
                <Kbd keys={["N"]} />
              </button>
            </span>
          </span>
        );
      })}
      <span id={`${uid}-y`} hidden>
        {copy.shortcut("Y")}
      </span>
      <span id={`${uid}-n`} hidden>
        {copy.shortcut("N")}
      </span>
    </span>
  );
}
