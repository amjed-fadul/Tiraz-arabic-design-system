import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ThumbsUp } from "lucide-react";
import { useLocalResponse } from "./useLocalResponse";
import {
  Button,
  ChatComposer,
  ChatThread,
  Markdown,
  PromptBar,
  StreamingText,
  ThinkingIndicator,
  useSystem,
} from "../../index";
import type { ChatMessage } from "../../index";
type Language = "ar" | "en";
/** Config or OS preference; scripted openings start on their final state. */
function useReducedMotion() {
  const { config } = useSystem();
  return (
    config.reducedMotion ||
    (typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
  );
}

export function ChatThreadExample({
  language = "ar",
  longContent = false,
  followOutput = false,
}: {
  language?: Language;
  /** Accepted for compatibility; assistant replies carry no identity. */
  identities?: boolean;
  longContent?: boolean;
  followOutput?: boolean;
}) {
  const ar = language === "ar",
    [helpful, setHelpful] = useState(false);
  const tips = ar
    ? [
        "التزم بنوع واحد من الأرقام في الجداول، عربية أو لاتينية.",
        "ضع الإجراء الأساسي في آخر الصف حسب اتجاه القراءة.",
        "جرّب أسماء طويلة مثل «مؤسسة رواسي للتجارة العامة» داخل البطاقات.",
        "اعكس أيقونات الأسهم مع اتجاه الواجهة، واترك أيقونات التشغيل كما هي.",
        "اكتب التواريخ كما يقرؤها الناس: ١٥ أكتوبر ٢٠٢٦ لا 2026-10-15.",
        "ضع رسالة الخطأ بجوار الحقل، واكتبها بلا مصطلحات تقنية.",
        "تأكّد أن رموز المنتجات مثل SKU-4821 تُقرأ من اليسار إلى اليمين.",
        "راجع المسافات بعد علامات الترقيم العربية مثل الفاصلة «،».",
      ]
    : [
        "Use Arabic or Latin digits consistently across tables.",
        "Place the primary action at the end of the row in reading order.",
        "Test long names such as «Rawasi General Trading Est.» inside cards.",
        "Mirror directional icons with the interface, but keep media icons as they are.",
        "Show dates in the reader's format: 15 October 2026 rather than 2026-10-15.",
        "Keep error messages next to the field and free of technical terms.",
        "Check that product codes like SKU-4821 stay left-to-right.",
        "Review spacing after Arabic punctuation such as the comma «،».",
      ];
  const messages: ChatMessage[] = [
    {
      id: "question",
      role: "user",
      content: ar
        ? "كيف نجهّز واجهة عربية واضحة؟"
        : "How do we prepare a clear Arabic interface?",
    },
    {
      id: "answer",
      role: "assistant",
      content: (
        <Markdown
          text={
            (ar
              ? "ابدأ بتسميات **واضحة** ومسافات مدمجة، واترك الكود `LTR` داخل النص العربي."
              : "Start with **clear labels** and compact spacing. Preserve Arabic shaping and keep `LTR` code readable.") +
            (longContent
              ? "\n\n" + tips.map((tip, i) => `${i + 1}. ${tip}`).join("\n")
              : "")
          }
        />
      ),
      actions: (
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={ar ? "رد مفيد" : "Good response"}
          aria-pressed={helpful}
          onClick={() => setHelpful(!helpful)}
        >
          <ThumbsUp size={16} fill={helpful ? "currentColor" : "none"} />
        </Button>
      ),
    },
  ];
  return (
    <ChatThread
      messages={messages}
      followOutput={followOutput}
      style={{ maxBlockSize: 300 }}
    />
  );
}

/** Application-owned conversation. Replies are fixed local text; there is no network. */
export function ChatConversation({
  language = "ar",
  compact = false,
  disabled = false,
}: {
  language?: Language;
  compact?: boolean;
  disabled?: boolean;
}) {
  // A locale change unmounts the host and cancels its pending run.
  return (
    <ConversationHost
      key={language}
      language={language}
      compact={compact}
      disabled={disabled}
    />
  );
}
type Message = { id: string; role: "user" | "assistant"; text: string };
type Phase = "idle" | "streaming" | "completed" | "stopped";
/** Appends one exchange and streams the fixed reply into its assistant message. */
function exchange(
  start: ReturnType<typeof useLocalResponse>["start"],
  setMessages: Dispatch<SetStateAction<Message[]>>,
  setPhase: (phase: Phase) => void,
  id: string,
  text: string,
) {
  const started = start(
    (reply) =>
      setMessages((previous) =>
        previous.map((message) =>
          message.id === `assistant-${id}`
            ? { ...message, text: reply }
            : message,
        ),
      ),
    () => setPhase("completed"),
  );
  if (!started) return;
  setMessages((previous) => [
    ...previous,
    { id: `user-${id}`, role: "user", text },
    { id: `assistant-${id}`, role: "assistant", text: "" },
  ]);
  setPhase("streaming");
}
function ConversationHost({
  language,
  compact,
  disabled,
}: {
  language: Language;
  compact: boolean;
  disabled: boolean;
}) {
  const ar = language === "ar";
  const response = useLocalResponse(language),
    { start } = response,
    sequence = useRef(0),
    reduced = useReducedMotion(),
    played = useRef(reduced);
  const opening = ar
    ? "كيف أجهّز واجهة عربية واضحة؟"
    : "How do I prepare a clear Arabic interface?";
  const [messages, setMessages] = useState<Message[]>(() =>
      reduced
        ? [
            { id: "user-opening", role: "user", text: opening },
            {
              id: "assistant-opening",
              role: "assistant",
              text: response.reply,
            },
          ]
        : [],
    ),
    [draft, setDraft] = useState("");
  const [phase, setPhase] = useState<Phase>(reduced ? "completed" : "idle");
  // The opening exchange plays once; reduced motion starts on its final state.
  useEffect(() => {
    if (played.current || reduced) return;
    const timer = setTimeout(() => {
      played.current = true;
      exchange(start, setMessages, setPhase, "opening", opening);
    }, 500);
    return () => clearTimeout(timer);
  }, [reduced, start, opening]);
  const last = messages.at(-1)?.id;
  const replyStatus = {
    idle: ar ? "اكتمل الرد" : "Response complete",
    streaming: ar ? "يصل الرد تباعًا" : "Receiving response",
    completed: ar ? "اكتمل الرد" : "Response complete",
    stopped: ar ? "توقف الرد" : "Response stopped",
  };
  const entry = {
    value: draft,
    onValueChange: setDraft,
    onSubmit: (text: string) => {
      if (disabled || response.active.current || !text.trim()) return;
      setDraft("");
      exchange(start, setMessages, setPhase, String(++sequence.current), text);
    },
    disabled,
    state: phase === "streaming" ? ("streaming" as const) : ("idle" as const),
    onStop: () => {
      response.cancel();
      setPhase("stopped");
    },
  };
  return (
    <div className="tz-chat-demo">
      <ChatThread
        followOutput
        label={ar ? "المحادثة" : "Conversation"}
        messages={messages.map((message) => {
          const live = phase === "streaming" && message.id === last;
          return {
            id: message.id,
            role: message.role,
            content:
              message.role === "user" ? (
                message.text
              ) : live && !message.text ? (
                <ThinkingIndicator
                  label={ar ? "جارٍ إعداد الرد" : "Preparing reply"}
                  announcement="off"
                />
              ) : (
                <StreamingText
                  text={message.text}
                  state={live ? "streaming" : "completed"}
                  announcement={message.id === last ? "polite" : "off"}
                  statusLabel={message.id === last ? replyStatus[phase] : ""}
                />
              ),
          };
        })}
      />
      {compact ? (
        <PromptBar
          {...entry}
          suggestions={[
            ar ? "كيف أبدأ باستخدام طِراز؟" : "How do I start with Tiraz?",
          ]}
          onSuggestionSelect={setDraft}
        />
      ) : (
        <ChatComposer {...entry} />
      )}
    </div>
  );
}
export function ChatComposerExample(props: {
  language?: Language;
  disabled?: boolean;
}) {
  return <ChatConversation {...props} />;
}
export function PromptBarExample({
  language = "ar",
  disabled = false,
}: {
  language?: Language;
  disabled?: boolean;
}) {
  const ar = language === "ar",
    [draft, setDraft] = useState("");
  return (
    <PromptBar
      value={draft}
      onValueChange={setDraft}
      disabled={disabled}
      onSubmit={() => setDraft("")}
      suggestions={
        ar
          ? [
              "لخّص اجتماع الإطلاق",
              "صُغ ردًا على شركة الندى",
              "راجع نصوص صفحة الدفع",
            ]
          : [
              "Summarize the launch meeting",
              "Draft a reply to Al Nada Trading",
              "Review the checkout copy",
            ]
      }
      onSuggestionSelect={setDraft}
    />
  );
}

/** Sending fails: the message explains why and the draft stays put. */
export function ChatEntryFailure({
  language = "ar",
  compact = false,
}: {
  language?: Language;
  compact?: boolean;
}) {
  const ar = language === "ar",
    [draft, setDraft] = useState(
      ar
        ? "لخّص ملاحظات اجتماع الإطلاق في خمس نقاط"
        : "Summarize the launch meeting notes in five points",
    );
  const Entry = compact ? PromptBar : ChatComposer;
  return (
    <Entry
      value={draft}
      onValueChange={setDraft}
      onSubmit={() => Promise.reject(new Error("Network unavailable"))}
    />
  );
}
export function ChatEntryStates({
  language = "ar",
  compact = false,
}: {
  language?: Language;
  compact?: boolean;
}) {
  const ar = language === "ar";
  const Entry = compact ? PromptBar : ChatComposer;
  return (
    <div style={{ display: "grid", gap: "var(--space-5)" }}>
      <section>
        <h3>{ar ? "تعذّر الإرسال" : "Submission failure"}</h3>
        <ChatEntryFailure language={language} compact={compact} />
      </section>
      <section>
        <h3>{ar ? "معطّل" : "Disabled"}</h3>
        <Entry
          value={ar ? "أرفق تقرير الربع الثالث" : "Attach the Q3 report"}
          onValueChange={() => {}}
          onSubmit={() => {}}
          disabled
        />
      </section>
    </div>
  );
}
