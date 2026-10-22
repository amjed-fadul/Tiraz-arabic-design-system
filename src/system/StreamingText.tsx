import type { ComponentPropsWithRef } from "react";
import { Markdown } from "./Markdown";
import type { MarkdownProps } from "./Markdown";
import { useSystem } from "./useSystem";
export type StreamingTextProps = Omit<
  ComponentPropsWithRef<"div">,
  "children"
> & {
  text: string;
  /** Stopped and failed keep the text that arrived and end the cursor and the
   * word motion; the hidden status says which. */
  state: "streaming" | "completed" | "stopped" | "failed";
  markdown?: boolean;
  statusLabel?: string;
  announcement?: "polite" | "off";
  /** In markdown mode, turns a `[n]` marker into this node (see Markdown). */
  renderCitation?: MarkdownProps["renderCitation"];
  /** In markdown mode, "strict" sends link targets through `sourceHref`. */
  links?: MarkdownProps["links"];
};
const statusLabels = {
  ar: {
    streaming: "جارٍ استلام الرد",
    completed: "اكتمل الرد",
    stopped: "أُوقف الرد",
    failed: "تعذّر إكمال الرد",
  },
  en: {
    streaming: "Receiving response",
    completed: "Response complete",
    stopped: "Response stopped",
    failed: "Couldn't finish the response",
  },
};
/** Host updates are rendered immediately. No transport, clock or typing queue. */
export function StreamingText({
  text,
  state,
  markdown = false,
  statusLabel,
  announcement = "polite",
  renderCitation,
  links,
  className = "",
  ...props
}: StreamingTextProps) {
  const ar = useSystem().config.direction === "rtl",
    active = state === "streaming";
  return (
    <div
      {...props}
      className={`tz-streaming-text ${className}`}
      data-state={state}
    >
      <div className="tz-stream-content">
        {markdown ? (
          <Markdown text={text} renderCitation={renderCitation} links={links} />
        ) : (
          <span className="tz-stream-prose">
            {(text.match(/\S+|\s+/gu) ?? []).map((word, index) =>
              /\S/u.test(word) ? (
                <span className="tz-stream-word" key={index}>
                  {word}
                </span>
              ) : (
                word
              ),
            )}
          </span>
        )}
        {active && <span className="tz-stream-cursor" aria-hidden="true" />}
      </div>
      <span
        role={announcement === "polite" ? "status" : undefined}
        className="tz-visually-hidden"
      >
        {statusLabel ?? statusLabels[ar ? "ar" : "en"][state]}
      </span>
    </div>
  );
}
