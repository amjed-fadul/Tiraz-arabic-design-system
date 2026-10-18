import { useRef, useState } from "react";
import {
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
function conversationsFor(ar: boolean): Conversation[] {
  return [
    {
      id: "build",
      title: ar ? "ملاحظات البناء" : "Build notes",
      draft: "",
      model: "concise",
      phase: "idle",
      messages: [
        {
          id: "build-user",
          role: "user",
          text: ar
            ? "شغّل البناء وأخبرني إن ظهرت أخطاء."
            : "Run the build and tell me if anything fails.",
        },
        {
          id: "build-assistant",
          role: "assistant",
          text: ar
            ? "اكتمل البناء دون أخطاء: ٤١٨ وحدة في ١٫٦٣ ثانية، وحجم الصفحة الرئيسية ٠٫٤٠ كيلوبايت."
            : "The build finished cleanly: 418 modules in 1.63s, and the entry page is 0.40 kB.",
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
          id: "arabic-user",
          role: "user",
          text: ar
            ? "ما الذي أراجعه قبل إطلاق الواجهة العربية؟"
            : "What should I check before launching the Arabic interface?",
        },
        {
          id: "arabic-assistant",
          role: "assistant",
          text: ar
            ? "ثلاثة أمور: اتجاه حقول الإدخال، والتنقل الكامل بلوحة المفاتيح، وعرض النص المختلط مثل أسماء المنتجات اللاتينية داخل الجمل العربية."
            : "Three things: input direction, full keyboard navigation, and how mixed text such as Latin product names reads inside Arabic sentences.",
        },
      ],
    },
  ];
}
/** In-memory chat application. Switching or starting a conversation stops a reply and keeps received text. */
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
  const [conversations, setConversations] = useState(() =>
      conversationsFor(ar),
    ),
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
    {
      id: "concise",
      name: ar ? "موجز" : "Concise",
      description: ar
        ? "ردود قصيرة للمهام اليومية"
        : "Short answers for daily work",
    },
    {
      id: "detailed",
      name: ar ? "مفصّل" : "Detailed",
      description: ar
        ? "شرح أطول للمسائل المعقدة"
        : "Longer reasoning for complex questions",
    },
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
  const last = current.messages.at(-1)?.id;
  const replyStatus = {
    idle: ar ? "اكتمل الرد" : "Response complete",
    streaming: ar ? "جارٍ استلام الرد" : "Receiving response",
    completed: ar ? "اكتمل الرد" : "Response complete",
    stopped: ar ? "توقف الرد" : "Response stopped",
  };
  return (
    <div className="tz-chat-app-example">
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
                ? `محادثة ${conversations.length + 1}`
                : `Chat ${conversations.length + 1}`,
              draft: "",
              model: current.model,
              messages: [],
              phase: "idle",
            },
          ]);
          setActiveId(id);
        }}
        brand={ar ? "استوديو طِراز" : "Tiraz Studio"}
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
            <div style={{ display: "flex" }}>
              <ModelSelector
                models={models}
                value={current.model}
                onValueChange={(model) =>
                  patch(activeId, (item) => ({ ...item, model }))
                }
              />
            </div>
          </div>
        }
      >
        <ChatThread
          key={activeId}
          followOutput
          label={ar ? "الرسائل" : "Messages"}
          messages={current.messages.map((message) => {
            const live = current.phase === "streaming" && message.id === last;
            return {
              id: message.id,
              role: message.role,
              content:
                message.role === "user" ? (
                  message.text
                ) : (
                  <>
                    <StreamingText
                      text={message.text}
                      state={live ? "streaming" : "completed"}
                      announcement={message.id === last ? "polite" : "off"}
                      statusLabel={
                        message.id === last ? replyStatus[current.phase] : ""
                      }
                    />
                    {message.tool && (
                      <Terminal
                        label={ar ? "سجل البناء" : "Build log"}
                        command="npm run build"
                        output={
                          "vite v7.1.4 building for production…\n✓ 418 modules transformed.\ndist/index.html                  0.40 kB │ gzip:  0.27 kB\ndist/assets/index-4f2a9c1e.css  38.12 kB │ gzip:  7.41 kB\ndist/assets/index-b7d3a1f5.js  182.41 kB │ gzip: 58.12 kB\n" +
                          (longContent
                            ? Array.from(
                                { length: 60 },
                                (_, i) =>
                                  `dist/assets/route-${String(i + 1).padStart(2, "0")}-${((0x9e3779b1 * (i + 1)) >>> 0).toString(16).padStart(8, "0")}.js   ${(1 + ((i * 37) % 900) / 100).toFixed(2)} kB │ gzip: ${(0.4 + ((i * 37) % 900) / 300).toFixed(2)} kB\n`,
                              ).join("")
                            : "") +
                          "✓ built in 1.63s\n"
                        }
                        state="completed"
                        exitCode={0}
                        duration="2s"
                      />
                    )}
                  </>
                ),
            };
          })}
        />
      </ChatApp>
    </div>
  );
}
