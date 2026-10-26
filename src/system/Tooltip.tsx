import * as Popper from "@radix-ui/react-popper";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  ComponentPropsWithRef,
  ReactElement,
  ReactNode,
  Ref,
} from "react";
import { createPortal } from "react-dom";
import { useSystem } from "./useSystem";
import { useScopedPortalHost } from "./portal-scope";

export interface TooltipRootProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
}
export type TooltipTriggerProps = ComponentPropsWithRef<"button"> & {
  asChild?: boolean;
};
export interface TooltipContentProps extends Pick<
  Popper.PopperContentProps,
  | "side"
  | "sideOffset"
  | "align"
  | "alignOffset"
  | "collisionBoundary"
  | "collisionPadding"
  | "className"
  | "style"
> {
  children: string;
  ref?: Ref<HTMLDivElement>;
  /** Same-document destination. null withholds the tooltip until ready. */
  portalContainer?: HTMLElement | null;
}
export interface TooltipProps
  extends
    Omit<TooltipRootProps, "children">,
    Omit<TooltipContentProps, "children" | "ref"> {
  trigger: ReactElement;
  content: string;
}

// Shared across roots for compatibility with the original convenience API.
const group = { open: 0, closedAt: Number.NEGATIVE_INFINITY };
const WARM_WINDOW = 400;
function isWarm() {
  return group.open > 0 || Date.now() - group.closedAt < WARM_WINDOW;
}

function useTooltipState({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  delayDuration = 500,
}: Omit<TooltipRootProps, "children">) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? localOpen;
  const [described, setDescribed] = useState(false);
  const [instant, setInstant] = useState(false);
  const id = useId();
  const latest = useRef({
    open,
    controlled: controlledOpen !== undefined,
    onOpenChange,
  });
  latest.current = {
    open,
    controlled: controlledOpen !== undefined,
    onOpenChange,
  };
  const request = useCallback((next: boolean) => {
    const current = latest.current;
    if (current.open === next) return;
    if (!current.controlled) {
      current.open = next;
      setLocalOpen(next);
    }
    current.onOpenChange?.(next);
  }, []);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hovered = useRef(false),
    focused = useRef(false),
    dismissed = useRef(false),
    pointerFocus = useRef(false);
  const cancel = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const dismiss = useCallback(() => {
    cancel();
    dismissed.current = true;
    request(false);
  }, [cancel, request]);
  const leave = useCallback(() => {
    cancel();
    dismissed.current = false;
    if (!focused.current) timer.current = setTimeout(() => request(false), 100);
  }, [cancel, request]);
  useEffect(() => cancel, [cancel]);
  return {
    open,
    described,
    setDescribed,
    instant,
    setInstant,
    id,
    delayDuration,
    timer,
    hovered,
    focused,
    dismissed,
    pointerFocus,
    request,
    cancel,
    dismiss,
    leave,
  };
}
const TooltipContext = createContext<ReturnType<typeof useTooltipState> | null>(
  null,
);
function useTooltip() {
  const context = useContext(TooltipContext);
  if (!context)
    throw new Error("TooltipTrigger and TooltipContent require TooltipRoot.");
  return context;
}

/** Compose exactly one trigger and one short, noninteractive content string. */
export function TooltipRoot({ children, ...options }: TooltipRootProps) {
  const context = useTooltipState(options);
  return (
    <TooltipContext.Provider value={context}>
      <Popper.Root>{children}</Popper.Root>
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger({
  asChild = false,
  children,
  ref,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  onPointerDown,
  ...props
}: TooltipTriggerProps) {
  const tip = useTooltip();
  const describedBy =
    [props["aria-describedby"], tip.described ? tip.id : undefined]
      .filter(Boolean)
      .join(" ") || undefined;
  // Anchor is typed as a div, but asChild forwards these native button props
  // and both refs to the actual button (or the consumer's focusable child).
  return (
    <Popper.Anchor
      asChild
      {...(props as unknown as Popper.PopperAnchorProps)}
      ref={ref as Ref<HTMLDivElement>}
      aria-describedby={describedBy}
      onPointerEnter={(event) => {
        onPointerEnter?.(
          event as unknown as React.PointerEvent<HTMLButtonElement>,
        );
        if (event.defaultPrevented || event.pointerType === "touch") return;
        tip.hovered.current = true;
        tip.cancel();
        if (tip.dismissed.current) return;
        if (isWarm()) {
          tip.setInstant(true);
          tip.request(true);
          return;
        }
        tip.timer.current = setTimeout(
          () => {
            tip.setInstant(false);
            tip.request(true);
          },
          Number.isFinite(tip.delayDuration)
            ? Math.max(0, tip.delayDuration)
            : 500,
        );
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(
          event as unknown as React.PointerEvent<HTMLButtonElement>,
        );
        tip.hovered.current = false;
        tip.leave();
      }}
      onFocus={(event) => {
        onFocus?.(event as unknown as React.FocusEvent<HTMLButtonElement>);
        if (event.defaultPrevented) return;
        tip.focused.current = true;
        tip.cancel();
        if (!tip.pointerFocus.current) {
          tip.dismissed.current = false;
          tip.setInstant(isWarm());
          tip.request(true);
        }
        tip.pointerFocus.current = false;
      }}
      onBlur={(event) => {
        onBlur?.(event as unknown as React.FocusEvent<HTMLButtonElement>);
        tip.focused.current = false;
        tip.pointerFocus.current = false;
        if (!tip.hovered.current) {
          tip.cancel();
          tip.request(false);
          tip.dismissed.current = false;
        }
      }}
      onPointerDown={(event) => {
        onPointerDown?.(
          event as unknown as React.PointerEvent<HTMLButtonElement>,
        );
        tip.pointerFocus.current = true;
        tip.dismiss();
      }}
    >
      {asChild ? (
        children
      ) : (
        <button type={props.type ?? "button"}>{children}</button>
      )}
    </Popper.Anchor>
  );
}

export function TooltipContent({
  children,
  portalContainer,
  ref,
  className = "",
  style,
  side = "top",
  sideOffset = 6,
  align,
  alignOffset,
  collisionBoundary,
  collisionPadding = 12,
}: TooltipContentProps) {
  const tip = useTooltip();
  const system = useSystem();
  // Dialogs hide and block interaction outside their content. An explicit
  // destination must remain in that boundary, rather than describing hidden UI.
  const target =
    portalContainer &&
    system.portalBoundary !== undefined &&
    !system.portalBoundary?.contains(portalContainer)
      ? null
      : portalContainer;
  const { container, portal } = useScopedPortalHost(
    target,
    system.container,
    system.config,
    system.scope,
  );
  const bounded = Array.isArray(collisionBoundary)
    ? collisionBoundary.some(Boolean)
    : !!collisionBoundary;
  const shown = tip.open && !!children && !!container;
  const { setDescribed, dismiss, dismissed, id } = tip;
  useLayoutEffect(() => {
    setDescribed(shown);
    return () => setDescribed(false);
  }, [shown, setDescribed]);
  useEffect(() => {
    if (!shown) return;
    group.open += 1;
    return () => {
      group.open -= 1;
      group.closedAt = dismissed.current
        ? Number.NEGATIVE_INFINITY
        : Date.now();
    };
  }, [shown, dismissed]);
  useEffect(() => {
    if (!shown || !container) return;
    const view = container.ownerDocument.defaultView;
    function keydown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      dismiss();
    }
    view?.addEventListener("keydown", keydown, true);
    return () => view?.removeEventListener("keydown", keydown, true);
  }, [shown, container, dismiss]);
  const [present, setPresent] = useState(shown);
  if (shown && !present) setPresent(true);
  const node = useRef<HTMLDivElement | null>(null);
  const contentRef = useCallback(
    (element: HTMLDivElement | null) => {
      node.current = element;
      if (typeof ref === "function") {
        const cleanup = ref(element);
        return () => {
          node.current = null;
          if (typeof cleanup === "function") cleanup();
          else ref(null);
        };
      }
      if (ref) ref.current = element;
      return () => {
        node.current = null;
        if (ref) ref.current = null;
      };
    },
    [ref],
  );
  useLayoutEffect(() => {
    if (shown || !present) return;
    const exit = node.current && getComputedStyle(node.current);
    if (
      !exit?.animationName ||
      exit.animationName === "none" ||
      parseFloat(exit.animationDuration) <= 0.001
    )
      setPresent(false);
  }, [shown, present]);
  return (
    <>
      {portal}
      {present &&
        container &&
        children &&
        createPortal(
          <Popper.Content
            ref={contentRef}
            id={id}
            role="tooltip"
            className={["tz-tooltip", className].filter(Boolean).join(" ")}
            style={style}
            data-bounded={bounded || undefined}
            data-state={shown ? "open" : "closed"}
            data-instant={tip.instant || undefined}
            dir={system.config.direction}
            side={side}
            sideOffset={sideOffset}
            align={align}
            alignOffset={alignOffset}
            collisionBoundary={collisionBoundary}
            collisionPadding={collisionPadding}
            hideWhenDetached
            onPointerEnter={() => {
              tip.hovered.current = true;
              tip.cancel();
            }}
            onPointerLeave={() => {
              tip.hovered.current = false;
              tip.leave();
            }}
            onAnimationEnd={() => {
              if (!shown) setPresent(false);
            }}
          >
            {children}
          </Popper.Content>,
          container,
        )}
    </>
  );
}

/** Original convenience API, with additive state and destination controls. */
export function Tooltip({
  trigger,
  content,
  open,
  defaultOpen,
  onOpenChange,
  delayDuration = 500,
  ...placement
}: TooltipProps) {
  return (
    <TooltipRoot
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      delayDuration={delayDuration}
    >
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent {...placement}>{content}</TooltipContent>
    </TooltipRoot>
  );
}
