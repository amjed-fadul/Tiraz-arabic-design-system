import { useState } from "react";
import { ChatThread, ChatThreadMessage } from "../../index";
import type { ChatThreadMessagePartProps } from "../../index";
type Reply = Pick<ChatThreadMessagePartProps, "id" | "role" | "status"> & {
  text: string;
};
/** ChatThreadMessage parts instead of `messages`; the application owns every message. */
export function CompoundChatThreadExample({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [replies, setReplies] = useState<Reply[]>([
    {
      id: "question",
      role: "user",
      text: t(
        "ما صافي التدفق النقدي لهذا الشهر؟",
        "What was net cash flow this month?",
      ),
    },
    {
      id: "answer",
      role: "assistant",
      status: "failed",
      text: t("انخفض صافي التدفق النقدي", "Net cash flow fell"),
    },
  ]);
  return (
    <ChatThread label={t("محادثة المحاسبة", "Accounting chat")}>
      {replies.map((reply) => (
        <ChatThreadMessage
          key={reply.id}
          id={reply.id}
          role={reply.role}
          identity={
            reply.role === "assistant" ? t("ترياز", "Tiraz") : undefined
          }
          status={reply.status}
          error={t(
            "انقطع الاتصال بدفتر الأستاذ.",
            "The ledger connection dropped.",
          )}
          onRetry={() =>
            setReplies((all) =>
              all.map((item) =>
                item.id === reply.id ? { ...item, status: "completed" } : item,
              ),
            )
          }
        >
          {reply.text}
        </ChatThreadMessage>
      ))}
    </ChatThread>
  );
}
