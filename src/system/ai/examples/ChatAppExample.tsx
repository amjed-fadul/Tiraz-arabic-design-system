import { useRef, useState } from "react";
import {
  Avatar,
  Button,
  ChatApp,
  ChatComposer,
  ChatThread,
  ModelSelector,
  PromptBar,
  StreamingText,
  Terminal,
} from "../../index";
import { useLocalResponse } from "./useLocalResponse";
type Language = "ar" | "en";
type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  tool?: boolean;
};
type Conversation = {
  id: string;
  title: string;
  draft: string;
  model: string;
  messages: Message[];
  phase: "idle" | "streaming" | "completed" | "stopped";
};
function samples(ar: boolean): Conversation[] {
  return [
    {
      id: "build",
      title: ar ? "ملاحظات البناء" : "Build notes",
      draft: "",
      model: "concise",
      phase: "idle",
      messages: [
        {
          id: "sample-user",
          role: "user",
          text: ar ? "اعرض سجل البناء المرفق." : "Show the supplied build log.",
        },
        {
          id: "sample-assistant",
          role: "assistant",
          text: ar
            ? "هذه مخرجات مرفقة بالعينة، ولم يُنفّذ أي أمر."
            : "These are supplied sample outputs. No command was executed.",
          tool: true,
        },
      ],
    },
    {
      id: "arabic",
      title: ar ? "الواجهة العربية" : "Arabic interface",
      draft: "",
      model: "concise",
      phase: "idle",
      messages: [
        {
          id: "arabic-sample",
          role: "assistant",
          text: ar
            ? "راجع اتجاه الإدخال ولوحة المفاتيح والنص المختلط."
            : "Review input direction, keyboard navigation and mixed text.",
        },
      ],
    },
  ];
}
/** In-memory application example. Switching/new cancels and keeps received text; reset restores samples. */
export function ChatAppExample({
  language = "ar",
  longContent = false,
}: {
  language?: Language;
  longContent?: boolean;
}) {
  return (
    <ChatAppHost key={language} language={language} longContent={longContent} />
  );
}
function ChatAppHost({
  language,
  longContent,
}: {
  language: Language;
  longContent: boolean;
}) {
  const ar = language === "ar";
  const [conversations, setConversations] = useState(() => samples(ar)),
    [activeId, setActiveId] = useState("build");
  const sequence = useRef(0),
    response = useLocalResponse(language);
  const current = conversations.find((item) => item.id === activeId)!;
  function patch(id: string, update: (item: Conversation) => Conversation) {
    setConversations((previous) =>
      previous.map((item) => (item.id === id ? update(item) : item)),
    );
  }
  function cancel() {
    response.cancel();
    patch(activeId, (item) =>
      item.phase === "streaming" ? { ...item, phase: "stopped" } : item,
    );
  }
  function submit(text: string) {
    if (response.active.current || !text.trim()) return;
    const conversationId = activeId,
      id = ++sequence.current,
      assistantId = `assistant-${id}`;
    // Every callback is bound to this conversation AND this run; cancellation invalidates the scheduler.
    response.start(
      (text) =>
        patch(conversationId, (item) => ({
          ...item,
          messages: item.messages.map((message) =>
            message.id === assistantId ? { ...message, text } : message,
          ),
        })),
      () => patch(conversationId, (item) => ({ ...item, phase: "completed" })),
    );
    patch(conversationId, (item) => ({
      ...item,
      draft: "",
      phase: "streaming",
      messages: [
        ...item.messages,
        { id: `user-${id}`, role: "user", text },
        { id: assistantId, role: "assistant", text: "" },
      ],
    }));
  }
  const models = [
    { id: "concise", name: ar ? "عينة موجزة" : "Concise sample" },
    { id: "detailed", name: ar ? "عينة مفصّلة" : "Detailed sample" },
  ];
  const entry = {
    value: current.draft,
    onValueChange: (draft: string) =>
      patch(activeId, (item) => ({ ...item, draft })),
    onSubmit: submit,
    state:
      current.phase === "streaming"
        ? ("streaming" as const)
        : ("idle" as const),
    onStop: cancel,
  };
  const status = {
    idle: ar ? "جاهز لعينة محلية" : "Ready for local sample",
    streaming: ar ? "جارٍ استلام العينة المحلية" : "Receiving local sample",
    completed: ar ? "اكتمل الرد المحلي" : "Local response complete",
    stopped: ar ? "توقف الرد؛ احتُفظ بالنص" : "Stopped; received text kept",
  }[current.phase];
  return (
    <div className="tz-chat-app-example">
      <p className="tz-chat-app-note">
        {ar
          ? "تطبيق محادثة في الذاكرة · ردود ثابتة · لا اتصال بنموذج أو أدوات"
          : "In-memory chat app · fixed responses · no model or tool connection"}
      </p>
      <ChatApp
        conversations={conversations}
        activeConversationId={activeId}
        onConversationSelect={(id) => {
          if (id !== activeId) {
            cancel();
            setActiveId(id);
          }
        }}
        onNewConversation={() => {
          cancel();
          const id = `conversation-${++sequence.current}`;
          setConversations((previous) => [
            ...previous,
            {
              id,
              title: ar
                ? `محادثة ${sequence.current}`
                : `Conversation ${sequence.current}`,
              draft: "",
              model: current.model,
              messages: [],
              phase: "idle",
            },
          ]);
          setActiveId(id);
        }}
        brand={ar ? "استوديو طِراز" : "Tiraz Studio"}
        toolbar={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              response.cancel();
              setConversations(samples(ar));
              setActiveId("build");
            }}
          >
            {ar ? "إعادة ضبط المثال" : "Reset example"}
          </Button>
        }
        composer={
          <div style={{ display: "grid", gap: "var(--space-2)" }}>
            {current.messages.length === 0 ? (
              <PromptBar
                key={activeId}
                {...entry}
                suggestions={[
                  ar ? "راجع الواجهة العربية" : "Review the Arabic interface",
                ]}
                onSuggestionSelect={entry.onValueChange}
              />
            ) : (
              <ChatComposer key={activeId} {...entry} />
            )}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "var(--space-2)",
              }}
            >
              <ModelSelector
                models={models}
                value={current.model}
                onValueChange={(model) =>
                  patch(activeId, (item) => ({ ...item, model }))
                }
              />
              <span role="status" className="tz-chat-app-note">
                {status}
              </span>
            </div>
          </div>
        }
      >
        <ChatThread
          key={activeId}
          followOutput
          label={ar ? "محادثة محلية تجريبية" : "Local sample conversation"}
          messages={current.messages.map((message) => ({
            id: message.id,
            role: message.role,
            identity:
              message.role === "assistant"
                ? ar
                  ? "المساعد المحلي"
                  : "Local assistant"
                : undefined,
            avatar:
              message.role === "assistant" ? (
                <Avatar
                  name={ar ? "طِراز" : "Tiraz"}
                  fallback="ط"
                  size="sm"
                  decorative
                />
              ) : undefined,
            content:
              message.role === "user" ? (
                message.text
              ) : (
                <>
                  <StreamingText
                    text={message.text}
                    state={
                      current.phase === "streaming" &&
                      message.id === current.messages.at(-1)?.id
                        ? "streaming"
                        : "completed"
                    }
                    announcement="off"
                    statusLabel=""
                  />
                  {message.tool && (
                    <Terminal
                      label={ar ? "سجل بناء مرفق" : "Supplied build log"}
                      command="npm run build"
                      output={
                        "vite building for production…\n  ✓ 418 modules transformed.\n  dist/index.html    0.40 kB\n✓ built in 1.63s\n" +
                        (longContent
                          ? Array.from(
                              { length: 60 },
                              (_, i) => `  supplied log line ${i + 1}\n`,
                            ).join("")
                          : "")
                      }
                      state="completed"
                      exitCode={0}
                      duration="2s"
                    />
                  )}
                </>
              ),
          }))}
        />
      </ChatApp>
    </div>
  );
}
