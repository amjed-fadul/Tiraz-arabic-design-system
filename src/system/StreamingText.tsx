import type { ComponentPropsWithRef } from "react";
import { Markdown } from "./Markdown";
import { useSystem } from "./useSystem";
export type StreamingTextProps = Omit<
  ComponentPropsWithRef<"div">,
  "children"
> & {
  text: string;
  state: "streaming" | "completed";
  markdown?: boolean;
  statusLabel?: string;
  announcement?: "polite" | "off";
};
/** Host updates are rendered immediately. No transport, clock or typing queue. */
export function StreamingText({
  text,
  state,
  markdown = false,
  statusLabel,
  announcement = "polite",
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
          <Markdown text={text} />
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
        {statusLabel ??
          (active
            ? ar
              ? "جارٍ استلام الرد"
              : "Receiving response"
            : ar
              ? "اكتمل الرد"
              : "Response complete")}
      </span>
    </div>
  );
}
