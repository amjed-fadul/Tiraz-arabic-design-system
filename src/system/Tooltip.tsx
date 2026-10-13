import * as Popper from "@radix-ui/react-popper";
import { useEffect, useId, useRef, useState } from "react";
import type { HTMLAttributes, ReactElement } from "react";
import { createPortal } from "react-dom";
import { useSystem } from "./useSystem";
export interface TooltipProps {
  trigger: ReactElement;
  content: string;
  delayDuration?: number;
}
export function Tooltip({
  trigger,
  content,
  delayDuration = 500,
}: TooltipProps) {
  const { container, config } = useSystem();
  const [open, setOpen] = useState(false);
  const id = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hovered = useRef(false),
    focused = useRef(false),
    dismissed = useRef(false),
    pointerFocus = useRef(false);
  function cancel() {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }
  function dismiss() {
    cancel();
    dismissed.current = true;
    setOpen(false);
  }
  function leave() {
    cancel();
    dismissed.current = false;
    if (!focused.current)
      timer.current = setTimeout(() => {
        setOpen(false);
      }, 100);
  }
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );
  const shown = open && !!content && !!container;
  useEffect(() => {
    if (!shown || !container) return;
    const doc = container.ownerDocument;
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (timer.current !== null) clearTimeout(timer.current);
        dismissed.current = true;
        setOpen(false);
      }
    }
    const view = doc.defaultView;
    view?.addEventListener("keydown", keydown, true);
    return () => view?.removeEventListener("keydown", keydown, true);
  }, [shown, container]);
  const element = trigger as ReactElement<HTMLAttributes<HTMLElement>>;
  const props = element.props;
  const describedBy =
    [props["aria-describedby"], shown ? id : undefined]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <Popper.Root>
      <Popper.Anchor
        asChild

        aria-describedby={describedBy}
        onPointerEnter={(event) => {
          if (event.defaultPrevented || event.pointerType === "touch") return;
          hovered.current = true;
          cancel();
          if (!dismissed.current)
            timer.current = setTimeout(
              () => setOpen(true),
              Number.isFinite(delayDuration) ? Math.max(0, delayDuration) : 500,
            );
        }}
        onPointerLeave={() => {
          hovered.current = false;
          leave();
        }}
        onFocus={(event) => {
          if (event.defaultPrevented) return;
          focused.current = true;
          cancel();
          if (!pointerFocus.current) {
            dismissed.current = false;
            setOpen(true);
          }
          pointerFocus.current = false;
        }}
        onBlur={() => {
          focused.current = false;
          pointerFocus.current = false;
          if (!hovered.current) {
            cancel();
            setOpen(false);
            dismissed.current = false;
          }
        }}
        onPointerDown={() => {
          pointerFocus.current = true;
          dismiss();
        }}
      >
        {trigger}
      </Popper.Anchor>
      {shown &&
        createPortal(
          <Popper.Content
            id={id}
            role="tooltip"
            className="tz-tooltip"
            dir={config.direction}
            side="top"
            sideOffset={6}
            collisionPadding={12}
            hideWhenDetached
            onPointerEnter={() => {
              hovered.current = true;
              cancel();
            }}
            onPointerLeave={() => {
              hovered.current = false;
              leave();
            }}
          >
            {content}
          </Popper.Content>,
          container,
        )}
    </Popper.Root>
  );
}
