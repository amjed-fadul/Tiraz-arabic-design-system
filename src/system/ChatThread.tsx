import {
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { useSystem } from "./useSystem";
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  identity?: ReactNode;
  avatar?: ReactNode;
  content: ReactNode;
  actions?: ReactNode;
};
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
          <article
            key={message.id}
            className="tz-chat-message"
            data-role={message.role}
            data-message-id={message.id}
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
            {message.actions && (
              <div className="tz-chat-message-actions">{message.actions}</div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
