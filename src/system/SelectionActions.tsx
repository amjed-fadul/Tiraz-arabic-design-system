import * as Popper from "@radix-ui/react-popper";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useSystem } from "./useSystem";

export interface SelectionAction {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  /** The selected text, and where it sits in the scope's text content. */
  onSelect: (text: string, range: { start: number; end: number }) => void;
}
export interface SelectionActionsProps {
  children: ReactNode;
  actions: readonly SelectionAction[];
  /** Names the focusable content region. Alt+Enter moves to the action row. */
  label: string;
  labels?: { actions?: string; more?: string; less?: string; hint?: string };
  className?: string;
}
const excluded =
  'input, textarea, select, button, a, summary, [role="button"], [role="link"], [role="scrollbar"], [role="combobox"], [role="listbox"], [role="option"], [role="slider"], [role="spinbutton"], [role="textbox"], [role="searchbox"], [role="checkbox"], [role="radio"], [role="switch"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="tab"], [role="treeitem"], [contenteditable]:not([contenteditable="false"]), pre, code, [data-selection-actions-exclude]';
type Snapshot = {
  text: string;
  range: Range;
  anchor: Node;
  anchorOffset: number;
  focus: Node;
  focusOffset: number;
};
/** Where `range` sits in the text content of `scope`, which contains it. */
function offsetsIn(scope: Node, range: Range) {
  const before = scope.ownerDocument!.createRange();
  before.setStart(scope, 0);
  before.setEnd(range.startContainer, range.startOffset);
  const start = before.toString().length;
  return { start, end: start + range.toString().length };
}
/** Instance-scoped selection presentation; never executes or replaces content. */
export function SelectionActions({
  children,
  actions,
  label,
  labels,
  className = "",
}: SelectionActionsProps) {
  const { config, container } = useSystem(),
    ar = config.direction === "rtl";
  const scope = useRef<HTMLDivElement>(null),
    toolbar = useRef<HTMLDivElement>(null);
  const saved = useRef<Snapshot | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [expanded, setExpanded] = useState(false);
  const hint = useId();
  // Popper must receive a new measurable when native selection geometry changes.
  // A stable virtual anchor would keep the first few characters' measurements.
  const anchor = useMemo(
    () => ({
      current: {
        getBoundingClientRect: () =>
          snapshot?.range.getBoundingClientRect() ?? new DOMRect(),
      },
    }),
    [snapshot],
  );
  function dismiss(restoreFocus = false) {
    if (
      restoreFocus &&
      toolbar.current?.contains(
        scope.current?.ownerDocument.activeElement ?? null,
      )
    )
      scope.current?.focus({ preventScroll: true });
    saved.current = null;
    setSnapshot(null);
    setExpanded(false);
  }
  useEffect(() => {
    const node = scope.current!;
    const doc = node.ownerDocument,
      view = doc.defaultView;
    function read() {
      const selection = doc.getSelection();
      if (
        !selection ||
        selection.isCollapsed ||
        selection.rangeCount !== 1 ||
        !selection.anchorNode ||
        !selection.focusNode
      ) {
        dismiss(true);
        return;
      }
      const range = selection.getRangeAt(0);
      const element = (n: Node) =>
        n.nodeType === 1 ? (n as Element) : n.parentElement;
      const ends = [selection.anchorNode, selection.focusNode];
      if (
        ends.some(
          (n) =>
            !node.contains(n) ||
            element(n)?.closest("[data-tz-selection-scope]") !== node ||
            element(n)?.closest(excluded),
        ) ||
        !selection.toString().trim()
      ) {
        dismiss(true);
        return;
      }
      // Endpoints alone are insufficient: a range may cross an excluded control.
      if (
        Array.from(
          node.querySelectorAll(`${excluded}, [data-tz-selection-scope]`),
        ).some((el) => range.intersectsNode(el))
      ) {
        dismiss(true);
        return;
      }
      const next = {
        text: selection.toString(),
        range: range.cloneRange(),
        anchor: selection.anchorNode,
        anchorOffset: selection.anchorOffset,
        focus: selection.focusNode,
        focusOffset: selection.focusOffset,
      };
      const previous = saved.current;
      if (
        previous &&
        previous.text === next.text &&
        previous.anchor === next.anchor &&
        previous.anchorOffset === next.anchorOffset &&
        previous.focus === next.focus &&
        previous.focusOffset === next.focusOffset
      )
        return;
      saved.current = next;
      setSnapshot(next);
      setExpanded(false);
    }
    function pointer(event: PointerEvent) {
      if (!toolbar.current?.contains(event.target as Node)) dismiss();
    }
    function scroll(event: Event) {
      if (
        !(event.target instanceof node.ownerDocument.defaultView!.Node) ||
        !toolbar.current?.contains(event.target)
      )
        dismiss(true);
    }
    function focus(event: FocusEvent) {
      const target = event.target as Element;
      if (
        !toolbar.current?.contains(target) &&
        (!node.contains(target) || target.closest(excluded))
      )
        dismiss();
    }
    function resize() {
      dismiss(true);
    }
    doc.addEventListener("selectionchange", read);
    doc.addEventListener("focusin", focus);
    doc.addEventListener("pointerdown", pointer, true);
    view?.addEventListener("scroll", scroll, true);
    view?.addEventListener("resize", resize);
    view?.visualViewport?.addEventListener("resize", resize);
    view?.visualViewport?.addEventListener("scroll", resize);
    return () => {
      doc.removeEventListener("selectionchange", read);
      doc.removeEventListener("focusin", focus);
      doc.removeEventListener("pointerdown", pointer, true);
      view?.removeEventListener("scroll", scroll, true);
      view?.removeEventListener("resize", resize);
      view?.visualViewport?.removeEventListener("resize", resize);
      view?.visualViewport?.removeEventListener("scroll", resize);
      saved.current = null;
    };
  }, []);
  function restore() {
    const current = saved.current;
    if (
      !current ||
      !scope.current?.contains(current.anchor) ||
      !scope.current.contains(current.focus) ||
      current.range.toString() !== current.text
    ) {
      dismiss(true);
      return null;
    }
    const selection = scope.current.ownerDocument.getSelection();
    if (
      selection &&
      (selection.anchorNode !== current.anchor ||
        selection.anchorOffset !== current.anchorOffset ||
        selection.focusNode !== current.focus ||
        selection.focusOffset !== current.focusOffset)
    )
      selection.setBaseAndExtent(
        current.anchor,
        current.anchorOffset,
        current.focus,
        current.focusOffset,
      );
    return current;
  }
  const shown = snapshot && container && actions.length > 0;
  const visible = expanded ? actions : actions.slice(0, 2);
  function buttons() {
    return Array.from(
      toolbar.current?.querySelectorAll<HTMLButtonElement>(
        "button:not(:disabled)",
      ) ?? [],
    );
  }
  return (
    <Popper.Root>
      <div
        ref={scope}
        data-tz-selection-scope=""
        role="region"
        aria-label={label}
        aria-describedby={hint}
        tabIndex={0}
        className={`tz-selection-scope ${className}`}
        onKeyDown={(event) => {
          if (
            event.altKey &&
            event.key === "Enter" &&
            shown &&
            !(event.target as Element).closest(excluded)
          ) {
            event.preventDefault();
            buttons()[0]?.focus({ preventScroll: true });
          } else if (event.key === "Escape" && shown) {
            event.preventDefault();
            event.stopPropagation();
            dismiss();
          }
        }}
      >
        {children}
        <span id={hint} className="tz-visually-hidden">
          {labels?.hint ??
            (ar
              ? "حدّد نصًا ثم اضغط Alt+Enter للانتقال إلى الإجراءات، أو Escape للإغلاق."
              : "Select text, then press Alt+Enter for actions. Escape dismisses.")}
        </span>
      </div>
      <Popper.Anchor virtualRef={anchor} />
      {shown &&
        createPortal(
          <Popper.Content
            ref={toolbar}
            className="tz-selection-actions"
            role="toolbar"
            aria-label={
              labels?.actions ??
              (ar ? "إجراءات النص المحدّد" : "Selected text actions")
            }
            dir={config.direction}
            side="bottom"
            align="center"
            sideOffset={6}
            collisionPadding={8}
            hideWhenDetached
            onPointerDown={(event) => event.preventDefault()}
            onFocusCapture={() => {
              restore();
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                dismiss(true);
                return;
              }
              const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
              if (!keys.includes(event.key)) return;
              event.preventDefault();
              const all = buttons(),
                index = all.indexOf(event.target as HTMLButtonElement);
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? all.length - 1
                    : (index +
                        (event.key === (ar ? "ArrowLeft" : "ArrowRight")
                          ? 1
                          : -1) +
                        all.length) %
                      all.length;
              all[next]?.focus();
            }}
          >
            {visible.map((action) => (
              <button
                type="button"
                key={action.id}
                disabled={action.disabled}
                onClick={() => {
                  const current = restore();
                  if (current && scope.current)
                    action.onSelect(
                      current.text,
                      offsetsIn(scope.current, current.range),
                    );
                }}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
            {actions.length > 2 && (
              <button
                type="button"
                aria-label={
                  expanded
                    ? (labels?.less ?? (ar ? "إجراءات أقل" : "Fewer actions"))
                    : (labels?.more ??
                      (ar ? "المزيد من الإجراءات" : "More actions"))
                }
                aria-expanded={expanded}
                onClick={() => {
                  setExpanded(!expanded);
                }}
              >
                {expanded ? (
                  <ChevronLeft
                    size={14}
                    aria-hidden="true"
                    className="tz-mirror-rtl"
                  />
                ) : (
                  <ChevronRight
                    size={14}
                    aria-hidden="true"
                    className="tz-mirror-rtl"
                  />
                )}
              </button>
            )}
          </Popper.Content>,
          container,
        )}
    </Popper.Root>
  );
}
