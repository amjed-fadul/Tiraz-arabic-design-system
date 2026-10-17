import { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Button,
  ChatComposer,
  ChatThread,
  Markdown,
  PromptBar,
  StreamingText,
  ThinkingIndicator,
} from "../../index";
import type { ChatMessage } from "../../index";
type Language = "ar" | "en";

export function ChatThreadExample({
  language = "ar",
  identities = true,
  longContent = false,
  followOutput = false,
}: {
  language?: Language;
  identities?: boolean;
  longContent?: boolean;
  followOutput?: boolean;
}) {
  const ar = language === "ar",
    [helpful, setHelpful] = useState(false);
  const assistant = ar ? "المساعد" : "Assistant";
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
      identity: identities ? assistant : undefined,
      avatar: identities ? (
        <Avatar name={assistant} fallback="ط" decorative />
      ) : undefined,
      content: (
        <Markdown
          text={
            (ar
              ? "ابدأ بتسميات **واضحة** ومسافات مدمجة. حافظ على اتجاه الشيفرة `LTR` داخل النص العربي."
              : "Start with **clear labels** and compact spacing. Preserve Arabic shaping and keep `LTR` code readable.") +
            (longContent
              ? "\n\n" +
                Array.from({ length: 12 }, (_, i) =>
                  ar
                    ? `ملاحظة ${i + 1}: راجع ترتيب القراءة والنص المختلط Tiraz / طِراز.`
                    : `Note ${i + 1}: review reading order and mixed text Tiraz / طِراز.`,
                ).join("\n\n")
              : "")
          }
        />
      ),
      actions: (
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={helpful}
          onClick={() => setHelpful(!helpful)}
        >
          {helpful
            ? ar
              ? "تم تسجيل الملاحظة"
              : "Marked helpful"
            : ar
              ? "رد مفيد"
              : "Helpful response"}
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

/** Application-owned demo. Every response is fixed local text; there is no network. */
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
  const [messages, setMessages] = useState<Message[]>([]),
    [draft, setDraft] = useState("");
  const [phase, setPhase] = useState<
    "idle" | "streaming" | "completed" | "stopped"
  >("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    generation = useRef(0),
    active = useRef(false),
    sequence = useRef(0);
  const invalidate = () => {
    generation.current++;
    active.current = false;
    clearTimeout(timer.current);
    timer.current = undefined;
  };
  useEffect(
    () => () => {
      generation.current++;
      active.current = false;
      clearTimeout(timer.current);
    },
    [],
  );
  function submit(text: string) {
    if (active.current || disabled || !text.trim()) return;
    invalidate();
    active.current = true;
    const run = generation.current;
    const id = ++sequence.current;
    setMessages((previous) => [
      ...previous,
      { id: `user-${id}`, role: "user", text },
      { id: `assistant-${id}`, role: "assistant", text: "" },
    ]);
    setDraft("");
    setPhase("streaming");
    const chunks = ar
      ? [
          "ابدأ ",
          "بتسميات ",
          "واضحة ",
          "ومسافات ",
          "مدمجة. ",
          "Tiraz ",
          "يحافظ ",
          "على ",
          "العربية ",
          "والنص ",
          "المختلط. ",
          "راجع ",
          "الواجهة ",
          "بلوحة ",
          "المفاتيح.",
        ]
      : [
          "Start ",
          "with ",
          "clear ",
          "labels ",
          "and ",
          "compact ",
          "spacing. ",
          "Tiraz ",
          "preserves ",
          "Arabic ",
          "and ",
          "mixed ",
          "text: ",
          "مرحبًا ",
          "بالعالم.",
        ];
    let index = 0;
    function tick() {
      if (generation.current !== run) return;
      index++;
      setMessages((previous) =>
        previous.map((message) =>
          message.id === `assistant-${id}`
            ? { ...message, text: chunks.slice(0, index).join("") }
            : message,
        ),
      );
      if (index === chunks.length) {
        active.current = false;
        timer.current = undefined;
        setPhase("completed");
      } else timer.current = setTimeout(tick, 280);
    }
    timer.current = setTimeout(tick, 280);
  }
  const status = {
    idle: ar
      ? "عينة محلية ثابتة · أرسل للبدء"
      : "Fixed local sample · send to begin",
    streaming: ar ? "جارٍ استلام العينة المحلية" : "Receiving local sample",
    completed: ar ? "اكتمل الرد المحلي" : "Local response complete",
    stopped: ar ? "توقف الرد؛ احتُفظ بالنص" : "Stopped; received text kept",
  }[phase];
  const entry = {
    value: draft,
    onValueChange: setDraft,
    onSubmit: submit,
    disabled,
    state: phase === "streaming" ? ("streaming" as const) : ("idle" as const),
    onStop: () => {
      invalidate();
      setPhase("stopped");
    },
  };
  return (
    <div className="tz-chat-demo">
      <ChatThread
        followOutput
        label={ar ? "محادثة محلية تجريبية" : "Local sample conversation"}
        messages={messages.map((message) => ({
          id: message.id,
          role: message.role,
          content:
            message.role === "user" ? (
              message.text
            ) : (
              <StreamingText
                text={message.text}
                state={
                  phase === "streaming" && message.id === messages.at(-1)?.id
                    ? "streaming"
                    : "completed"
                }
                announcement="off"
                statusLabel=""
              />
            ),
        }))}
      />
      <div className="tz-chat-demo-status">
        <span role="status">{status}</span>
        {phase === "streaming" && (
          <ThinkingIndicator
            label={ar ? "جارٍ إعداد الرد" : "Preparing reply"}
            announcement="off"
          />
        )}
      </div>
      {compact ? (
        <PromptBar
          {...entry}
          suggestions={[
            ar ? "كيف أبدأ مع طِراز؟" : "How do I start with Tiraz?",
          ]}
          onSuggestionSelect={setDraft}
        />
      ) : (
        <ChatComposer {...entry} />
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          invalidate();
          setMessages([]);
          setDraft("");
          setPhase("idle");
        }}
      >
        {ar ? "إعادة ضبط المحادثة" : "Reset conversation"}
      </Button>
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
    [draft, setDraft] = useState(""),
    [accepted, setAccepted] = useState("");
  return (
    <div style={{ display: "grid", gap: "var(--space-3)" }}>
      <PromptBar
        value={draft}
        onValueChange={setDraft}
        disabled={disabled}
        onSubmit={(text) => {
          setAccepted(text);
          setDraft("");
        }}
        suggestions={
          ar
            ? ["لخّص ملاحظات الواجهة", "راجع النص العربي"]
            : ["Summarize interface notes", "Review Arabic copy"]
        }
        onSuggestionSelect={setDraft}
      />
      <span
        role="status"
        style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}
      >
        {accepted
          ? (ar ? "قُبل الموجّه محليًا: " : "Prompt accepted locally: ") +
            accepted
          : ar
            ? "عينة محلية · اختر اقتراحًا أو اكتب مهمة"
            : "Local sample · choose a suggestion or enter a task"}
      </span>
    </div>
  );
}

export function ChatEntryStates({
  language = "ar",
  compact = false,
}: {
  language?: Language;
  compact?: boolean;
}) {
  const ar = language === "ar",
    [draft, setDraft] = useState(
      ar ? "مسودة محفوظة عند الفشل" : "Draft kept after failure",
    );
  const Entry = compact ? PromptBar : ChatComposer;
  return (
    <div style={{ display: "grid", gap: "var(--space-5)" }}>
      <section>
        <h3>{ar ? "فشل الإرسال" : "Submission failure"}</h3>
        <Entry
          value={draft}
          onValueChange={setDraft}
          onSubmit={() => Promise.reject(new Error("Local demo rejection"))}
        />
      </section>
      <section>
        <h3>{ar ? "معطّل" : "Disabled"}</h3>
        <Entry
          value={ar ? "غير متاح الآن" : "Unavailable for now"}
          onValueChange={() => {}}
          onSubmit={() => {}}
          disabled
        />
      </section>
    </div>
  );
}
