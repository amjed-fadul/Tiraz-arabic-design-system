import { useEffect, useRef, useState } from "react";
import {
  DraftReview,
  numberLocale,
  useReducedMotion,
  useSystem,
} from "../../index";
import type { DiffSegment, DraftReviewProps, DraftTone } from "../../index";
import { money, story } from "./finance-story";
type Language = "ar" | "en";
type Status = DraftReviewProps["status"];
type Decisions = Record<string, "accepted" | "rejected">;

// The page's phases are the pattern's statuses.
const statuses: readonly string[] = [
  "writing",
  "ready",
  "sending",
  "sent",
  "discarded",
];
// How the host paces it: the draft arrives three words every 140 ms, and
// sending takes 600 ms. With undo on, the host first holds the message for
// 10 seconds on its own timer.
const wordMs = 140,
  wordsPerBeat = 3,
  sendMs = 600,
  holdSeconds = 10;

export function DraftReviewExample({
  language = "ar",
  appearance = "card",
  undo = true,
  phase,
  onPhaseChange,
}: {
  language?: Language;
  appearance?: "card" | "plain";
  /**
   * Stands in for the person's own setting, which your app reads before they
   * meet the window: off, or a hold they can lengthen to at least ten times
   * the default (WCAG 2.2.1). On, each message waits 10 s before it is sent.
   */
  undo?: boolean;
  /**
   * "writing", "ready", "sending", "sent" or "discarded", held as given.
   * Sending, discarding and Undo move the draft on and report where it went.
   * Without a phase the draft rests on ready.
   */
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  const ar = language === "ar",
    { config } = useSystem(),
    reduced = useReducedMotion();
  const t = (arabic: string, english: string) => (ar ? arabic : english);
  const n = (value: number) =>
    new Intl.NumberFormat(numberLocale(config, language)).format(value);

  const [local, setLocal] = useState<Status>("ready");
  const status = statuses.includes(phase ?? "") ? (phase as Status) : local;
  const report = useRef(onPhaseChange);
  useEffect(() => {
    report.current = onPhaseChange;
  });
  function move(next: Status) {
    setLocal(next);
    report.current?.(next);
  }
  // Your records: the tone, the person's decisions on the suggestion, and the
  // message once it is theirs (what they sent, or kept after Undo).
  const [tone, setTone] = useState<DraftTone>("friendly"),
    [decisions, setDecisions] = useState<Decisions>({}),
    [own, setOwn] = useState<string | null>(null);

  // The reminder for Madar's late invoice, with the assistant's three changes:
  // say how late it is, mention the copy attached, and ask for this week.
  const first = story.draft.recipient[language].split(" ")[0],
    invoice = story.draft.invoice,
    amount = money(story.draft.amount, language, config.numerals),
    due = n(Number(story.draft.due.slice(8))),
    late = n(story.draft.daysLate);
  const segments: DiffSegment[] = ar
    ? [
        {
          id: "opening",
          kind: "same",
          text: `مرحبًا ${first}،\n\nنودّ تذكيرك بأن الفاتورة ${invoice} بمبلغ ${amount} استُحقّت في ${due} أكتوبر`,
        },
        { id: "late", kind: "insert", text: `، أي قبل ${late} يومًا` },
        { id: "unpaid", kind: "same", text: "، ولم يصلنا سدادها بعد." },
        { id: "attached", kind: "insert", text: " تجدين نسخة منها مرفقة." },
        { id: "ask", kind: "same", text: "\n\nنرجو السداد " },
        { id: "soon", kind: "delete", text: "في أقرب وقت" },
        { id: "week", kind: "insert", text: "خلال هذا الأسبوع" },
        {
          id: "closing",
          kind: "same",
          text: `، وإن كان قد تمّ فيُرجى تجاهل هذه الرسالة.\n\nمع الشكر،\n${story.team.ar}`,
        },
      ]
    : [
        {
          id: "opening",
          kind: "same",
          text: `Hello ${first},\n\nThis is a reminder that invoice ${invoice} for ${amount} was due on October ${due}`,
        },
        { id: "late", kind: "insert", text: `, ${late} days ago` },
        {
          id: "unpaid",
          kind: "same",
          text: ", and we haven't received the payment yet.",
        },
        { id: "attached", kind: "insert", text: " A copy is attached." },
        { id: "ask", kind: "same", text: "\n\nPlease settle it " },
        { id: "soon", kind: "delete", text: "as soon as you can" },
        { id: "week", kind: "insert", text: "this week" },
        {
          id: "closing",
          kind: "same",
          text: `. If it's already paid, please disregard this message.\n\nThank you,\n${story.team.en}`,
        },
      ];
  // The draft as the assistant wrote it, before any change.
  const draft = segments
    .filter((segment) => segment.kind !== "insert")
    .map((segment) => segment.text)
    .join("");

  // While writing, the draft arrives a few words at a time.
  const words = draft.match(/\S+\s*/gu) ?? [];
  const [beat, setBeat] = useState({ status, n: 0 });
  if (beat.status !== status) setBeat({ status, n: 0 });
  const written = reduced
    ? words.length
    : Math.min(
        (beat.status === status ? beat.n : 0) * wordsPerBeat,
        words.length,
      );
  useEffect(() => {
    if (reduced || status !== "writing" || written >= words.length) return;
    const timer = setTimeout(
      () => setBeat((current) => ({ ...current, n: current.n + 1 })),
      wordMs,
    );
    return () => clearTimeout(timer);
  }, [reduced, status, written, words.length]);

  // Your hold: the seconds left before you send, on your own timer. When it
  // is over, you send, and then mark the message sent.
  const hold = undo ? holdSeconds : 0;
  const [held, setHeld] = useState({ status, left: hold });
  if (held.status !== status) setHeld({ status, left: hold });
  const left = held.status === status ? held.left : hold;
  useEffect(() => {
    if (status !== "sending") return;
    const timer =
      left > 0
        ? setTimeout(
            () =>
              setHeld((current) => ({ ...current, left: current.left - 1 })),
            1000,
          )
        : setTimeout(() => {
            setLocal("sent");
            report.current?.("sent");
          }, sendMs);
    return () => clearTimeout(timer);
  }, [status, left]);

  return (
    <DraftReview
      status={status}
      title={t("تذكير بالسداد", "Payment reminder")}
      agent={story.agents.collections[language]}
      record={{
        id: invoice,
        customer: story.customers[0].name[language],
        amount,
        overdue: t(`متأخرة ${late} يومًا`, `${late} days overdue`),
      }}
      recipients={[{ id: "sara", label: story.draft.recipient[language] }]}
      attachments={[{ id: "invoice", label: `${invoice}.pdf` }]}
      body={
        status === "writing" ? words.slice(0, written).join("") : (own ?? draft)
      }
      // Once the message is the person's own, it is a text area to edit.
      onBodyChange={setOwn}
      suggestion={
        status === "ready" && own === null
          ? {
              title: t("أوضح", "Clearer"),
              segments,
              decisions,
              onDecisionsChange: setDecisions,
            }
          : undefined
      }
      tone={tone}
      onToneChange={setTone}
      // Keep exactly the text on screen, and send it once your hold is over.
      onSend={(text) => {
        setOwn(text);
        move("sending");
      }}
      onDiscard={() => move("discarded")}
      // The seconds left in your hold, and Undo only while you can honor it:
      // it cancels the hold, so the message never leaves.
      undoWindow={undo ? left : undefined}
      onUndo={
        undo
          ? () => {
              if (left > 0) move("ready");
            }
          : undefined
      }
      appearance={appearance}
    />
  );
}
