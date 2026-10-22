import {
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { Button } from "./Button";
import { useArrivals } from "./useArrivals";
import { useSystem } from "./useSystem";
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  identity?: ReactNode;
  avatar?: ReactNode;
  content: ReactNode;
  actions?: ReactNode;
  /** The reply's state. A stopped one says so; a failed one shows `error`. */
  status?: "streaming" | "completed" | "stopped" | "failed";
  /** Why a failed reply failed, kept as text beside the partial reply. */
  error?: ReactNode;
  /** Offers «أعد المحاولة» on a failed reply. */
  onRetry?: () => void;
};
// The words a stopped or failed message shows, picked by direction.
const messageCopy = {
  ar: {
    stopped: "أُوقف الرد",
    failed: "تعذّر إكمال الرد",
    retry: "أعد المحاولة",
  },
  en: {
    stopped: "Response stopped",
    failed: "Couldn't finish the response",
    retry: "Try again",
  },
};
export type ChatThreadMessageProps = Omit<
  ComponentPropsWithRef<"article">,
  "children"
> & {
  message: ChatMessage;
};
/**
 * One message, as ChatThread draws it: identity, content and actions, with the
 * note of a stopped reply or the error of a failed one beside it. It works
 * alone, for a message shown outside a thread.
 */
export function ChatThreadMessage({
  message,
  className = "",
  ref,
  ...props
}: ChatThreadMessageProps) {
  const copy =
    messageCopy[useSystem().config.direction === "rtl" ? "ar" : "en"];
  const root = useRef<HTMLElement>(null);
  useImperativeHandle(ref, () => root.current!, []);
  return (
    <article
      tabIndex={-1}
      {...props}
      ref={root}
      className={`tz-chat-message ${className}`}
      data-role={message.role}
      data-message-id={message.id}
      data-status={message.status}
    >
      {(message.identity || message.avatar) && (
        <header className="tz-chat-identity">
          {message.avatar}
          <span>{message.identity}</span>
        </header>
      )}
      <div className="tz-chat-content" dir="auto">
        {message.content}
      </div>
      {message.status === "stopped" && (
        <p className="tz-chat-message-note">{copy.stopped}</p>
      )}
      {message.status === "failed" && (
        <div className="tz-chat-message-note" data-tone="danger">
          <p>
            <strong>{copy.failed}</strong>
            {message.error != null && <span> {message.error}</span>}
          </p>
          {message.onRetry && (
            <Button
              variant="secondary"
              onClick={() => {
                message.onRetry?.();
                // The button goes when the host retries, so focus stays on the
                // message rather than dropping to the page.
                root.current?.focus();
              }}
            >
              {copy.retry}
            </Button>
          )}
        </div>
      )}
      {message.actions && (
        <div className="tz-chat-message-actions">{message.actions}</div>
      )}
    </article>
  );
}
export type ChatThreadProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  messages: ChatMessage[];
  label?: string;
  followOutput?: boolean;
};
/** Keyed presentation only. Caller supplies immutable updates and stable message IDs. */
export function ChatThread({
  messages,
  label,
  followOutput = false,
  ref,
  onScroll,
  className = "",
  ...props
}: ChatThreadProps) {
  const ar = useSystem().config.direction === "rtl";
  // Messages on the first render are history; only later ones enter.
  const arrivals = useArrivals(messages.map((message) => message.id));
  const root = useRef<HTMLDivElement>(null),
    content = useRef<HTMLDivElement>(null),
    nearBottom = useRef(true);
  useImperativeHandle(ref, () => root.current!, []);
  const follow = useCallback(() => {
    const node = root.current;
    const selection = node?.ownerDocument.getSelection();
    if (
      node &&
      followOutput &&
      nearBottom.current &&
      !(
        selection &&
        !selection.isCollapsed &&
        node.contains(selection.anchorNode)
      )
    )
      node.scrollTop = node.scrollHeight;
  }, [followOutput]);
  useLayoutEffect(() => {
    follow();
  });
  useLayoutEffect(() => {
    if (!followOutput || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(follow);
    observer.observe(content.current!);
    return () => observer.disconnect();
  }, [followOutput, follow]);
  return (
    <div
      {...props}
      ref={root}
      role={props.role ?? "region"}
      aria-label={
        label ?? props["aria-label"] ?? (ar ? "المحادثة" : "Conversation")
      }
      tabIndex={props.tabIndex ?? 0}
      className={`tz-chat-thread ${className}`}
      onScroll={(event) => {
        const node = event.currentTarget;
        nearBottom.current =
          node.scrollHeight - node.clientHeight - node.scrollTop <= 48;
        onScroll?.(event);
      }}
    >
      <div ref={content} className="tz-chat-messages">
        {messages.map((message) => (
          <ChatThreadMessage
            key={message.id}
            message={message}
            data-fresh={arrivals.fresh(message.id) || undefined}
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget)
                arrivals.settle(message.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}
