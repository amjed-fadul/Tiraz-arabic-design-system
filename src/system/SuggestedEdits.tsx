import * as Popper from "@radix-ui/react-popper";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FocusEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { AIMark } from "./AIMark";
import { Button } from "./Button";
import { DecisionBar } from "./DecisionBar";
import type { DecisionAction } from "./DecisionBar";
import { InlineDiff } from "./InlineDiff";
import type { DiffSegment, InlineDiffLabels } from "./InlineDiff";
import { SelectionActions } from "./SelectionActions";
import { Thread } from "./Thread";
import { Tray } from "./Tray";
import { numberLocale } from "./config";
import { diffParts, diffText } from "./diff-text";
import { formatCount } from "./format";
import { suggestedEditsCopy } from "./suggested-edits-copy";
import { useChanged } from "./useChanged";
import { useSystem } from "./useSystem";

type Decision = "accepted" | "rejected";
type Offsets = { start: number; end: number };

/** Every built-in string Suggested edits shows, InlineDiff's included; `labels` overrides any of them. */
export interface SuggestedEditsLabels extends InlineDiffLabels {
  /** Names the text region the person selects in. */
  region: string;
  /** The note below the selection while the assistant rewrites it, and its announcement. */
  rewriting: string;
  /** The card's heading, before the suggestion's own title. */
  title: string;
  /** The counter: «١ من ٣». */
  position: (current: string, total: string) => string;
  previous: string;
  next: string;
  rejectAll: string;
  acceptAll: string;
  apply: string;
  dismiss: string;
  undo: string;
  /** Shown when the selection spans formatting. */
  plainText: string;
  /** Announced when the card opens; `edits` is the count with its noun. */
  reviewing: (count: number, edits: string) => string;
  /** The receipt, and its announcement: «طُبّق تعديلان من ٣». */
  applied: (count: number, edits: string, total: string) => string;
}
export interface SuggestedEditsProps {
  /** The text region, as SelectionActions wraps it. */
  children: ReactNode;
  actions: readonly { id: string; label: string; icon?: ReactNode }[];
  /** The person chose an action: the selected text, and where it sits in the region's text content. */
  onAction(
    id: string,
    selection: { text: string; start: number; end: number },
  ): void;
  status: "idle" | "rewriting" | "reviewing" | "applied";
  /** Keep it through applied, with `decisions`: the receipt counts them. */
  suggestion?: { title: ReactNode; segments: readonly DiffSegment[] };
  /** The range the suggestion is for, as onAction reported it. Without it, the last action's range. */
  selection?: Offsets;
  /** Floating by default; inline keeps the review below the text in document flow. */
  reviewPlacement?: "floating" | "inline";
  /** Keyed by each change's first segment id. Without it the pattern keeps its own. */
  decisions?: Readonly<Record<string, Decision>>;
  /** Speak status changes politely, or leave announcements to the host. */
  announcement?: "polite" | "off";
  onDecisionsChange?(next: Record<string, Decision>): void;
  /** The text with the accepted changes, and the range it replaces. */
  onApply?(text: string, selection: Offsets): void;
  onUndo?(): void;
  onDismiss?(): void;
  labels?: Partial<SuggestedEditsLabels>;
}

const highlightName = "tz-suggestion";

/**
 * The range at these offsets of the scope's text content, or null when the
 * text no longer reaches them. A start on a boundary opens the next text node
 * and an end on one closes the current node, so the range takes in no element
 * it only touches.
 */
function rangeIn(scope: Node, start: number, end: number) {
  const doc = scope.ownerDocument!;
  const walker = doc.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  const range = doc.createRange();
  let at = 0,
    started = false;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const length = (node as Text).data.length;
    if (!started && start < at + length) {
      range.setStart(node, start - at);
      started = true;
    }
    if (started && end <= at + length) {
      range.setEnd(node, end - at);
      return range;
    }
    at += length;
  }
  return null;
}

/**
 * Suggested edits (spec section 12.6): improve selected text with tracked
 * changes the person accepts or rejects. The host owns the status, the
 * suggestion and the decisions, and replaces its own text on Apply; until
 * then its DOM is untouched. While rewriting and reviewing, the range keeps a
 * soft underline through the CSS Custom Highlight API, where the browser has
 * it. The rewriting note and the review card float in the provider's layer,
 * anchored below the range. The polite region says each status change unless
 * the host owns announcements.
 */
export function SuggestedEdits({
  children,
  actions,
  onAction,
  status,
  announcement = "polite",
  suggestion,
  selection,
  reviewPlacement = "floating",
  decisions,
  onDecisionsChange,
  onApply,
  onUndo,
  onDismiss,
  labels,
}: SuggestedEditsProps) {
  const { config, container } = useSystem();
  const copy: SuggestedEditsLabels = {
    ...suggestedEditsCopy[config.direction === "rtl" ? "ar" : "en"],
    ...labels,
  };
  const root = useRef<HTMLDivElement>(null),
    live = useRef<HTMLSpanElement>(null),
    lastFocus = useRef<HTMLElement | null>(null),
    heard = useRef<SuggestedEditsProps["status"] | null>(null);
  // The last action's range, and the decisions a host that passes none
  // leaves to the pattern; both start afresh with each action.
  const [picked, setPicked] = useState<Offsets | null>(null),
    [own, setOwn] = useState<Record<string, Decision>>({});
  const changed = useChanged(status);
  const range = selection ?? picked;
  const start = range?.start,
    end = range?.end;
  const decided = decisions ?? own;
  const ids = (suggestion ? diffParts(suggestion.segments) : []).flatMap(
    (part) => (part.kind === "change" ? [part.id] : []),
  );
  const accepted = ids.filter((id) => decided[id] === "accepted").length;
  const receipt = copy.applied(
    accepted,
    formatCount(accepted, "edit", config),
    new Intl.NumberFormat(numberLocale(config)).format(ids.length),
  );
  const scope = useCallback(
    () =>
      root.current?.querySelector<HTMLElement>("[data-tz-selection-scope]") ??
      null,
    [],
  );
  const marked =
    (status === "rewriting" || status === "reviewing") && range !== null;

  function decide(next: Record<string, Decision>) {
    if (!decisions) setOwn(next);
    onDecisionsChange?.(next);
  }
  function dismiss() {
    onDismiss?.();
    scope()?.focus({ preventScroll: true });
  }

  // One polite region, one sentence per change of status. It mounts empty,
  // and the status it mounts in is not news.
  const sentence =
    status === "rewriting"
      ? copy.rewriting
      : status === "reviewing"
        ? copy.reviewing(ids.length, formatCount(ids.length, "edit", config))
        : status === "applied"
          ? receipt
          : "";
  useEffect(() => {
    if (announcement === "off") {
      heard.current = status;
      return;
    }
    if (heard.current === null) {
      heard.current = status;
      return;
    }
    if (heard.current === status || !live.current) return;
    heard.current = status;
    live.current.textContent = sentence;
  });

  // The range keeps a soft underline in place of the person's selection.
  // Each instance adds and removes only its own range on the shared
  // highlight, and the name goes once the highlight is empty, so two
  // instances never erase each other's mark.
  useEffect(() => {
    const node = scope();
    if (!marked || !node || start === undefined || end === undefined) return;
    const chosen = node.ownerDocument.getSelection();
    if (chosen?.rangeCount && node.contains(chosen.anchorNode))
      chosen.removeAllRanges();
    const target = rangeIn(node, start, end);
    if (
      !target ||
      typeof CSS === "undefined" ||
      !CSS.highlights ||
      typeof Highlight === "undefined"
    )
      return;
    const registry = CSS.highlights;
    let mark = registry.get(highlightName);
    if (!mark) {
      mark = new Highlight();
      registry.set(highlightName, mark);
    }
    mark.add(target);
    return () => {
      const current = registry.get(highlightName);
      if (!current) return;
      current.delete(target);
      if (current.size === 0) registry.delete(highlightName);
    };
  }, [marked, start, end, scope]);

  // A control that took itself away (Apply, Undo) hands focus to the text
  // rather than dropping it to the page. While rewriting and reviewing, the
  // card decides.
  useLayoutEffect(() => {
    const element = lastFocus.current;
    if (
      !element ||
      element.isConnected ||
      status === "rewriting" ||
      status === "reviewing"
    )
      return;
    lastFocus.current = null;
    const doc = element.ownerDocument,
      active = doc.activeElement;
    if (!active || active === doc.body) scope()?.focus({ preventScroll: true });
  });

  // Popper measures the range each time it places the note or the card;
  // without one it measures the region.
  const anchor = useMemo(
    () => ({
      current: {
        getBoundingClientRect: () => {
          const node = scope();
          const at =
            node && start !== undefined && end !== undefined
              ? rangeIn(node, start, end)
              : null;
          return (at ?? node)?.getBoundingClientRect() ?? new DOMRect();
        },
      },
    }),
    [scope, start, end],
  );

  // Actions are offered when nothing is pending: before a suggestion, and
  // after one is applied.
  const offered =
    status === "idle" || status === "applied"
      ? actions.map((action) => ({
          id: action.id,
          label: action.label,
          icon: action.icon,
          onSelect: (text: string, at: Offsets) => {
            setPicked(at);
            setOwn({});
            onAction(action.id, { text, ...at });
          },
        }))
      : [];

  const restoreReviewFocus = useCallback(
    () => !!lastFocus.current && !lastFocus.current.isConnected,
    [],
  );

  const review =
    status === "reviewing" && suggestion ? (
      <ReviewCard
        placement={reviewPlacement}
        restoreFocus={restoreReviewFocus}
        copy={copy}
        title={suggestion.title}
        segments={suggestion.segments}
        ids={ids}
        decisions={decided}
        onDecisionsChange={decide}
        onApply={
          onApply && start !== undefined && end !== undefined
            ? () =>
                onApply(diffText(suggestion.segments, decided), {
                  start,
                  end,
                })
            : undefined
        }
        onDismiss={onDismiss ? dismiss : undefined}
        scope={scope}
        start={start}
        end={end}
        opened={changed}
      />
    ) : null;

  return (
    <div
      ref={root}
      className="tz-suggested-edits"
      data-status={status}
      onFocus={(event) => {
        lastFocus.current = event.target as HTMLElement;
      }}
      onBlur={(event: FocusEvent<HTMLElement>) => {
        // Focus moved to another control on purpose is never reclaimed.
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget as Node)
        )
          lastFocus.current = null;
      }}
      onKeyDown={(event) => {
        if (
          event.key !== "Escape" ||
          event.defaultPrevented ||
          status === "idle" ||
          !onDismiss
        )
          return;
        event.preventDefault();
        dismiss();
      }}
    >
      <SelectionActions label={copy.region} actions={offered}>
        {children}
      </SelectionActions>
      {announcement === "polite" && (
        <span
          ref={live}
          className="tz-visually-hidden"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        />
      )}
      {status === "applied" && suggestion && (
        <p className="tz-suggested-edits-receipt">
          <Check size={14} aria-hidden="true" />
          <span>{receipt}</span>
          {onUndo && (
            <Button variant="ghost" size="sm" onClick={() => onUndo()}>
              {copy.undo}
            </Button>
          )}
        </p>
      )}
      <Popper.Root>
        <Popper.Anchor virtualRef={anchor} />
        {container &&
          status === "rewriting" &&
          createPortal(
            <Popper.Content
              className="tz-suggested-edits-working"
              data-changed={changed || undefined}
              dir={config.direction}
              side="bottom"
              align="center"
              sideOffset={6}
              collisionPadding={8}
              hideWhenDetached
            >
              <AIMark size="xs" working />
              <span className="tz-ai-shimmer">{copy.rewriting}</span>
              <Thread state="running" />
            </Popper.Content>,
            container,
          )}
        {reviewPlacement === "floating" &&
          container &&
          review &&
          createPortal(review, container)}
      </Popper.Root>
      {reviewPlacement === "inline" && review}
    </div>
  );
}

/**
 * The review card: the selected passage with its tracked changes on paper, a
 * counter with previous and next, Reject all and Accept all on the tray above
 * it, and Apply below. A non-modal popover; Escape reaches the pattern.
 */
function ReviewCard({
  placement,
  restoreFocus,
  copy,
  title,
  segments,
  ids,
  decisions,
  onDecisionsChange,
  onApply,
  onDismiss,
  scope,
  start,
  end,
  opened,
}: {
  placement: "floating" | "inline";
  restoreFocus: () => boolean;
  copy: SuggestedEditsLabels;
  title: ReactNode;
  segments: readonly DiffSegment[];
  ids: readonly string[];
  decisions: Readonly<Record<string, Decision>>;
  onDecisionsChange: (next: Record<string, Decision>) => void;
  onApply?: () => void;
  onDismiss?: () => void;
  scope: () => HTMLElement | null;
  start?: number;
  end?: number;
  /** Opened after the pattern mounted, rather than mounted open. */
  opened: boolean;
}) {
  const { config } = useSystem(),
    uid = useId();
  const card = useRef<HTMLDivElement>(null),
    heading = useRef<HTMLHeadingElement>(null),
    paper = useRef<HTMLDivElement>(null),
    note = useRef<HTMLParagraphElement>(null);
  const [current, setCurrent] = useState(0);
  const index = Math.min(current, Math.max(ids.length - 1, 0));
  const digits = new Intl.NumberFormat(numberLocale(config));

  // A card that opens takes focus from the page, or from the actions that
  // asked for it; focus the person put elsewhere stays there.
  useLayoutEffect(() => {
    const doc = heading.current?.ownerDocument,
      active = doc?.activeElement;
    if (
      (!opened && !restoreFocus()) ||
      !doc ||
      (active &&
        active !== doc.body &&
        !active.closest(".tz-selection-actions"))
    )
      return;
    heading.current?.focus({ preventScroll: true });
  }, [opened, restoreFocus]);
  // The diff is plain text, so a range across formatting is applied without
  // it, and the card says so.
  useLayoutEffect(() => {
    const node = scope();
    const range =
      node && start !== undefined && end !== undefined
        ? rangeIn(node, start, end)
        : null;
    if (note.current)
      note.current.hidden = !range?.cloneContents().querySelector("*");
  }, [scope, start, end]);

  function go(step: number) {
    const next = (index + step + ids.length) % ids.length;
    setCurrent(next);
    paper.current
      ?.querySelectorAll<HTMLElement>("[data-change-id]")
      [next]?.focus();
  }
  function all(decision: Decision) {
    onDecisionsChange(Object.fromEntries(ids.map((id) => [id, decision])));
  }
  const decisionActions: DecisionAction[] = [
    ...(onDismiss
      ? [{ id: "dismiss", label: copy.dismiss, onSelect: onDismiss }]
      : []),
    ...(onApply
      ? [
          {
            id: "apply",
            label: copy.apply,
            tone: "primary" as const,
            onSelect: onApply,
          },
        ]
      : []),
  ];

  const header = (
    <div className="tz-suggested-edits-header" data-zone="header">
      <div className="tz-suggested-edits-heading">
        <AIMark />
        <h3
          ref={heading}
          id={`${uid}-title`}
          tabIndex={-1}
          className="tz-suggested-edits-title"
        >
          {copy.title} · {title}
        </h3>
        {ids.length > 0 && (
          <div className="tz-suggested-edits-nav">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={copy.previous}
              onClick={() => go(-1)}
            >
              <ChevronLeft
                size={16}
                aria-hidden="true"
                className="tz-mirror-rtl"
              />
            </Button>
            <span className="tz-suggested-edits-position">
              {copy.position(
                digits.format(index + 1),
                digits.format(ids.length),
              )}
            </span>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={copy.next}
              onClick={() => go(1)}
            >
              <ChevronRight
                size={16}
                aria-hidden="true"
                className="tz-mirror-rtl"
              />
            </Button>
          </div>
        )}
      </div>
      {ids.length > 0 && (
        <div className="tz-suggested-edits-all">
          <Button variant="ghost" size="sm" onClick={() => all("rejected")}>
            {copy.rejectAll}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => all("accepted")}>
            {copy.acceptAll}
          </Button>
        </div>
      )}
    </div>
  );

  const Surface = placement === "inline" ? "div" : Popper.Content;
  return (
    <Surface
      ref={card}
      className="tz-suggested-edits-card"
      role="dialog"
      aria-labelledby={`${uid}-title`}
      data-changed={opened || undefined}
      dir={config.direction}
      data-placement={placement}
      {...(placement === "floating"
        ? {
            side: "bottom" as const,
            align: "center" as const,
            sideOffset: 8,
            collisionPadding: 8,
          }
        : {})}
    >
      <Tray
        paper={false}
        header={header}
        footer={
          decisionActions.length > 0 ? (
            <div className="tz-suggested-edits-decision" data-zone="decision">
              <DecisionBar actions={decisionActions} scope={card} />
            </div>
          ) : undefined
        }
      >
        <div
          ref={paper}
          className="tz-tray-paper tz-suggested-edits-paper"
          data-zone="paper"
          onFocus={(event) => {
            // The counter follows the change that has focus.
            const id = (event.target as Element)
              .closest("[data-change-id]")
              ?.getAttribute("data-change-id");
            const at = id ? ids.indexOf(id) : -1;
            if (at >= 0) setCurrent(at);
          }}
        >
          <p className="tz-suggested-edits-passage">
            <InlineDiff
              segments={segments}
              decisions={decisions}
              onDecisionsChange={onDecisionsChange}
              labels={copy}
            />
          </p>
          <p ref={note} className="tz-suggested-edits-note" hidden>
            {copy.plainText}
          </p>
        </div>
      </Tray>
    </Surface>
  );
}
