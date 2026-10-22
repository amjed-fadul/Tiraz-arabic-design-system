import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
  useReducedMotion,
} from "../../index";
import type { ChatMessage } from "../../index";
type Language = "ar" | "en";
/**
 * Stands in for your server's response time: the send succeeds, or fails as
 * it would offline, after a moment. Unmounting cancels the wait.
 */
function useLatency() {
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);
  return useCallback(
    (ms: number, fail = false) =>
      new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          timers.current.delete(timer);
          if (fail) reject(new Error("Network unavailable"));
          else resolve();
        }, ms);
        timers.current.add(timer);
      }),
    [],
  );
}
/**
 * Reports where the visitor moves the example. It runs when that changes, not
 * when the phase does, so a phase the example was given is never sent back.
 */
function usePhaseReport(
  now: string,
  phase?: string,
  onPhaseChange?: (phase: string) => void,
) {
  const latest = useRef({ phase, onPhaseChange });
  useLayoutEffect(() => {
    latest.current = { phase, onPhaseChange };
  });
  useEffect(() => {
    const { phase, onPhaseChange } = latest.current;
    if (phase !== undefined && now !== phase) onPhaseChange?.(now);
  }, [now]);
}

export function ChatThreadExample({
  language = "ar",
  longContent = false,
  followOutput = false,
  phase,
}: {
  language?: Language;
  /** Accepted for compatibility; assistant replies carry no identity. */
  identities?: boolean;
  longContent?: boolean;
  followOutput?: boolean;
  /**
   * "default" (the reply is being prepared) or "new-message" (it has
   * arrived), held as given. Without a phase the reply arrives on its own.
   */
  phase?: string;
  /** Part of the phase pair; nothing here moves the thread, so it never fires. */
  onPhaseChange?: (phase: string) => void;
}) {
  const ar = language === "ar",
    [helpful, setHelpful] = useState(false),
    reduced = useReducedMotion(),
    [arrived, setArrived] = useState(false);
  // The reply arrives after a short thinking beat; reduced motion shows it at once.
  useEffect(() => {
    if (reduced || phase !== undefined) return;
    const timer = setTimeout(() => setArrived(true), 1400);
    return () => clearTimeout(timer);
  }, [reduced, phase]);
  const answered =
    phase === undefined ? reduced || arrived : phase === "new-message";
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
      content: !answered ? (
        <ThinkingIndicator
          label={ar ? "جارٍ إعداد الرد" : "Preparing reply"}
          announcement="off"
        />
      ) : (
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
      actions: answered && (
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
  failSend = false,
  phase,
  onPhaseChange,
}: {
  language?: Language;
  compact?: boolean;
  disabled?: boolean;
  /** Every send fails: the composer explains why and keeps the draft. */
  failSend?: boolean;
  /**
   * "empty", "writing", "submitting" or "failed": opens there, after the
   * opening exchange, and reports where the visitor moves it. Failed sends the
   * seeded draft to a host that is offline. Without a phase the opening
   * exchange plays on its own.
   */
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  // A locale change unmounts the host and cancels its pending run.
  return (
    <ConversationHost
      key={language}
      language={language}
      compact={compact}
      disabled={disabled}
      failSend={failSend}
      phase={phase}
      onPhaseChange={onPhaseChange}
    />
  );
}
type Message = { id: string; role: "user" | "assistant"; text: string };
type Stream = "idle" | "streaming" | "completed" | "stopped";
/** Appends one exchange and streams the fixed reply into its assistant message. */
function exchange(
  start: ReturnType<typeof useLocalResponse>["start"],
  setMessages: Dispatch<SetStateAction<Message[]>>,
  setStream: (stream: Stream) => void,
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
    () => setStream("completed"),
  );
  if (!started) return;
  setMessages((previous) => [
    ...previous,
    { id: `user-${id}`, role: "user", text },
    { id: `assistant-${id}`, role: "assistant", text: "" },
  ]);
  setStream("streaming");
}
function ConversationHost({
  language,
  compact,
  disabled,
  failSend,
  phase,
  onPhaseChange,
}: {
  language: Language;
  compact: boolean;
  disabled: boolean;
  failSend: boolean;
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  const ar = language === "ar";
  const response = useLocalResponse(language),
    { start } = response,
    sequence = useRef(0),
    input = useRef<HTMLTextAreaElement>(null),
    reduced = useReducedMotion(),
    // A phase opens on the finished opening exchange, as reduced motion does.
    settled = reduced || phase !== undefined,
    played = useRef(settled),
    wait = useLatency();
  const opening = ar
    ? "كيف أجهّز واجهة عربية واضحة؟"
    : "How do I prepare a clear Arabic interface?";
  const followUp = ar
    ? "وماذا عن الأرقام داخل النص العربي؟"
    : "What about numbers inside Arabic text?";
  const [messages, setMessages] = useState<Message[]>(() => [
      ...(settled
        ? [
            { id: "user-opening", role: "user" as const, text: opening },
            {
              id: "assistant-opening",
              role: "assistant" as const,
              text: response.reply,
            },
          ]
        : []),
      // Submitting: the follow-up has gone and its reply is on its way.
      ...(phase === "submitting"
        ? [
            { id: "user-follow-up", role: "user" as const, text: followUp },
            { id: "assistant-follow-up", role: "assistant" as const, text: "" },
          ]
        : []),
    ]),
    [draft, setDraft] = useState(
      phase === "writing" || phase === "failed" ? followUp : "",
    );
  const [stream, setStream] = useState<Stream>(
    phase === "submitting" ? "streaming" : settled ? "completed" : "idle",
  );
  // The draft the host turned down; the failed phase opens with it.
  const [turnedDown, setTurnedDown] = useState<string | null>(
    phase === "failed" ? followUp : null,
  );
  // The failed phase sends its draft once the entry is up, to a host that is
  // offline, so the entry shows what it does with a draft it cannot send. Only
  // the phase the example opened in does this, never a later move into it.
  const openedIn = useRef(phase);
  useEffect(() => {
    if (openedIn.current !== "failed") return;
    const timer = setTimeout(
      () =>
        input.current?.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true,
            cancelable: true,
          }),
        ),
      0,
    );
    return () => clearTimeout(timer);
  }, []);
  // The opening exchange plays once; reduced motion starts on its final state.
  useEffect(() => {
    if (played.current || reduced) return;
    const timer = setTimeout(() => {
      played.current = true;
      exchange(start, setMessages, setStream, "opening", opening);
    }, 500);
    return () => clearTimeout(timer);
  }, [reduced, start, opening]);
  usePhaseReport(
    stream === "streaming"
      ? "submitting"
      : turnedDown === draft
        ? "failed"
        : draft.trim()
          ? "writing"
          : "empty",
    phase,
    onPhaseChange,
  );
  const last = messages.at(-1)?.id;
  const replyStatus = {
    idle: ar ? "اكتمل الرد" : "Response complete",
    streaming: ar ? "يصل الرد تباعًا" : "Receiving response",
    completed: ar ? "اكتمل الرد" : "Response complete",
    stopped: ar ? "توقف الرد" : "Response stopped",
  };
  const entry = {
    ref: input,
    value: draft,
    onValueChange: setDraft,
    onSubmit: (text: string) => {
      if (disabled || response.active.current || !text.trim()) return;
      // Offline: the send is turned down, and the entry keeps the draft.
      if (failSend || phase === "failed")
        return wait(phase === "failed" ? 0 : 800, true).catch((error) => {
          setTurnedDown(text);
          throw error;
        });
      setDraft("");
      exchange(start, setMessages, setStream, String(++sequence.current), text);
    },
    disabled,
    state: stream === "streaming" ? ("streaming" as const) : ("idle" as const),
    onStop: () => {
      response.cancel();
      setStream("stopped");
      // A reply that had not begun leaves no empty bubble behind.
      setMessages((previous) =>
        previous.filter(
          (message) => message.role === "user" || message.text !== "",
        ),
      );
    },
  };
  return (
    <div className="tz-chat-demo">
      <ChatThread
        followOutput
        label={ar ? "المحادثة" : "Conversation"}
        messages={messages.map((message) => {
          const live = stream === "streaming" && message.id === last;
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
                  statusLabel={message.id === last ? replyStatus[stream] : ""}
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
  failSend?: boolean;
  /** "empty", "writing", "submitting" or "failed"; see ChatConversation. */
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  return <ChatConversation {...props} />;
}
const promptSuggestions = {
  ar: [
    "لخّص اجتماع الإطلاق",
    "صُغ ردًا على شركة الندى",
    "راجع نصوص صفحة الدفع",
  ],
  en: [
    "Summarize the launch meeting",
    "Draft a reply to Al Nada Trading",
    "Review the checkout copy",
  ],
};
export function PromptBarExample({
  language = "ar",
  disabled = false,
  failSend = false,
  phase,
  onPhaseChange,
}: {
  language?: Language;
  disabled?: boolean;
  /** Every send fails: the bar explains why and keeps the draft. */
  failSend?: boolean;
  /**
   * "empty" or "writing" (the first suggestion written in): opens there and
   * reports where the visitor moves it.
   */
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  const suggestions = promptSuggestions[language],
    [draft, setDraft] = useState(phase === "writing" ? suggestions[0] : ""),
    wait = useLatency();
  // A suggestion written in follows the interface language.
  const [shown, setShown] = useState(language);
  if (shown !== language) {
    setShown(language);
    const index = promptSuggestions[shown].indexOf(draft);
    if (index >= 0) setDraft(suggestions[index]);
  }
  usePhaseReport(draft.trim() ? "writing" : "empty", phase, onPhaseChange);
  return (
    <PromptBar
      value={draft}
      onValueChange={setDraft}
      disabled={disabled}
      onSubmit={() =>
        failSend ? wait(800, true) : wait(700).then(() => setDraft(""))
      }
      suggestions={suggestions}
      onSuggestionSelect={setDraft}
    />
  );
}
