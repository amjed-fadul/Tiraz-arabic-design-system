import {
  Children,
  isValidElement,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import type { ComponentPropsWithRef, ReactElement, ReactNode } from "react";
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
type ArticleProps = Omit<ComponentPropsWithRef<"article">, "children">;
/** One message from a record, as `messages` holds it. A native `id` and `role` stay native. */
type ChatThreadMessageRecordProps = ArticleProps & {
  message: ChatMessage;
  children?: never;
};
/**
 * One message as a part, for `ChatThread` children or alone. Every prop is a
 * plain value apart from the content, which is the children, and `onRetry`.
 * Avatars and `actions` are nodes and stay in the `messages` API.
 */
export type ChatThreadMessagePartProps = Omit<ArticleProps, "id" | "role"> & {
  /** The message's unique, stable application ID. It is never a DOM id. */
  id: string;
  role: ChatMessage["role"];
  /** Who is speaking, as text, in the message's header. */
  identity?: string;
  status?: ChatMessage["status"];
  /** Why a failed reply failed, kept as text beside the partial reply. */
  error?: string;
  /** Offers «أعد المحاولة» on a failed reply. */
  onRetry?: () => void;
  /** The message content. */
  children?: ReactNode;
  message?: never;
};
export type ChatThreadMessageProps =
  ChatThreadMessageRecordProps | ChatThreadMessagePartProps;
/**
 * One message, as ChatThread draws it: identity, content and actions, with the
 * note of a stopped reply or the error of a failed one beside it. It works
 * alone, for a message shown outside a thread. Give it a `message` record, or
 * its fields as props with the content as children.
 */
export function ChatThreadMessage(props: ChatThreadMessageProps) {
  if (props.message) return <MessageView {...props} />;
  const { id, role, identity, status, error, onRetry, children, ...article } =
    props;
  return (
    <MessageView
      {...article}
      message={{
        id,
        role,
        identity,
        content: children,
        status,
        error,
        onRetry,
      }}
    />
  );
}
function MessageView({
  message,
  className = "",
  ref,
  ...props
}: ChatThreadMessageRecordProps) {
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
  messages?: ChatMessage[];
  /**
   * ChatThreadMessage parts, as an alternative to `messages`. Put each part
   * directly inside the thread; any other child is drawn after the messages.
   */
  children?: ReactNode;
  label?: string;
  followOutput?: boolean;
};
const isPart = (
  child: ReactNode,
): child is ReactElement<ChatThreadMessageProps> =>
  isValidElement(child) && child.type === ChatThreadMessage;
const partId = ({ message, id }: ChatThreadMessageProps) =>
  message ? message.id : id;
/** Keyed presentation only. Caller supplies immutable updates and stable message IDs. */
export function ChatThread({
  messages = [],
  children,
  label,
  followOutput = false,
  ref,
  onScroll,
  className = "",
  ...props
}: ChatThreadProps) {
  const ar = useSystem().config.direction === "rtl";
  const parts = Children.toArray(children);
  // Messages on the first render are history; only later ones enter.
  const arrivals = useArrivals([
    ...messages.map((message) => message.id),
    ...parts.filter(isPart).map((part) => partId(part.props)),
  ]);
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
        {parts.map((part) => {
          if (!isPart(part)) return part;
          const id = partId(part.props);
          return (
            <ChatThreadMessage
              {...part.props}
              key={part.key}
              data-fresh={arrivals.fresh(id) || undefined}
              onAnimationEnd={(event) => {
                part.props.onAnimationEnd?.(event);
                if (event.target === event.currentTarget) arrivals.settle(id);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
