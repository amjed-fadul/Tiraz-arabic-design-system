import { useEffect, useRef, useState } from "react";
import { Headset } from "lucide-react";
import {
  CitedAnswer,
  PromptBar,
  TaskStarter,
  useReducedMotion,
} from "../../system";
import type { CitedAnswerProps, FeedbackReason } from "../../system";
import { story } from "../../system/ai/examples/finance-story";
import { useScreenDemo } from "../frame/useScreenDemo";
import { ScreenFrame, ScreenHeader } from "../frame/ScreenFrame";
import { useScreen } from "../frame/screen";
import {
  articles,
  connectionError,
  figures,
  notFound,
  supportEmail,
  topics,
} from "./data";
import "./help-center.css";

type Status = CitedAnswerProps["status"];
type Topic = (typeof topics)[number];

// The host's moments: five beats of thinking, an article found on each of the
// first four, then the answer in parts of five words.
const thinkingBeats = 5;
const thinkingMs = 300;
const writingMs = 170;
const wordsPerBeat = 5;
/** A failing run breaks off two-fifths of the way through its answer. */
const failedAt = 0.4;

/** One answer: the question as typed, and how far the host has come with it. */
interface Run {
  id: number;
  text: string;
  topic?: Topic;
  /** The run fails partway through its answer. */
  fails: boolean;
  status: Status;
  /** Beats of thinking so far. */
  beat: number;
  /** Articles found so far. */
  found: number;
  /** Words written so far. */
  words: number;
}

const wordsOf = (text: string) => text.match(/\S+\s*/gu) ?? [];
/** A question compared by its words, without the final question mark. */
const plain = (text: string) =>
  text
    .trim()
    .replace(/[?؟]+$/u, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
const topicOf = (text: string) =>
  topics.find((topic) =>
    [topic.question.ar, topic.question.en].some(
      (question) => plain(question) === plain(text),
    ),
  );
const running = (run: Run) =>
  run.status === "thinking" || run.status === "writing";

/** The run's next beat, given the number of words in the answer being written. */
function advance(run: Run, total: number, reduced: boolean): Run {
  const searched = run.topic?.articles.length ?? 0;
  if (run.status === "thinking") {
    const beat = run.beat + 1;
    if (beat < thinkingBeats)
      return {
        ...run,
        beat,
        found: reduced ? searched : Math.min(beat, searched),
      };
    return { ...run, status: "writing", beat, found: searched };
  }
  const limit = run.fails ? Math.floor(total * failedAt) : total;
  const words = reduced ? limit : Math.min(run.words + wordsPerBeat, limit);
  if (words < limit) return { ...run, words };
  return { ...run, words, status: run.fails ? "failed" : "completed" };
}

function Help() {
  const { t, language, number, percent, money, date } = useScreen();
  const reduced = useReducedMotion();
  const demo = useScreenDemo();
  const [draft, setDraft] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [manualRun, setManualRun] = useState<Run | null>(null);
  const [rating, setRating] = useState<{
    value: "up" | "down" | null;
    reason?: FeedbackReason;
  }>({ value: null });
  // The topics asked so far: the accruals question fails on its first run only.
  const asked = useRef(new Set<string>());
  const runs = useRef(0);
  const starter = useRef<HTMLDivElement>(null);
  const answer = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);

  // The answer in the page's language, its {slots} filled with the frame's
  // formatters, so the digits follow the language.
  const facts: Record<string, string> = Object.fromEntries(
    Object.entries(figures).map(([key, [kind, value]]) => [
      key,
      kind === "number"
        ? number(value)
        : kind === "money"
          ? money(value)
          : percent(value),
    ]),
  );
  // The opening question is a presentation of the existing answer. Only a
  // question the person asks starts the host's timer or moves focus.
  const previewTopic = topics[0];
  const previewText = previewTopic.answer[language].replace(
    /\{(\w+)\}/g,
    (_, key: string) => facts[key] ?? "",
  );
  const previewStatus: Status =
    demo.phase === "complete"
      ? "completed"
      : demo.progress < 0.32
        ? "thinking"
        : "writing";
  const preview: Run | null = demo.submitted
    ? {
        id: 0,
        text: previewTopic.question[language],
        topic: previewTopic,
        fails: false,
        status: previewStatus,
        beat: Math.min(
          thinkingBeats,
          Math.floor((demo.progress / 0.32) * thinkingBeats),
        ),
        found: Math.min(
          previewTopic.articles.length,
          Math.floor((demo.progress / 0.32) * previewTopic.articles.length) + 1,
        ),
        words: Math.floor(
          wordsOf(previewText).length *
            Math.max(0, (demo.progress - 0.32) / 0.68),
        ),
      }
    : null;
  const presenting = demo.active && demo.automatic;
  const run = presenting
    ? preview
    : (manualRun ?? (draft === null ? preview : null));
  const answerText = (value: Run | null) =>
    !value
      ? ""
      : value.topic
        ? value.topic.answer[language].replace(
            /\{(\w+)\}/g,
            (_, key: string) => facts[key] ?? "",
          )
        : notFound[language];
  const text = answerText(run);
  const parts = wordsOf(text);
  const manualWords = wordsOf(answerText(manualRun)).length;

  // Only manual questions use this timer. The opening presentation follows
  // the shared clock, including its pause and replay controls.
  useEffect(() => {
    if (!manualRun || !running(manualRun)) return;
    const timer = setTimeout(
      () =>
        setManualRun((current) =>
          current && running(current)
            ? advance(current, manualWords, reduced)
            : current,
        ),
      manualRun.status === "thinking" ? thinkingMs : writingMs,
    );
    return () => clearTimeout(timer);
  }, [manualRun, manualWords, reduced]);

  // A new question replaces the form or the answer, so focus goes to the
  // answer's section rather than dropping to the page.
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    const target =
      answer.current?.querySelector("section") ??
      starter.current?.querySelector("textarea");
    target?.focus();
  }, [run?.id]);

  // A draft that a suggestion filled follows a change of language.
  const [spoken, setSpoken] = useState(language);
  if (spoken !== language) {
    setSpoken(language);
    const same = (current: string) =>
      topicOf(current)?.question[language] ?? current;
    setDraft((current) => (current === null ? null : same(current)));
    setReply(same);
  }

  function begin(from: Pick<Run, "text" | "topic" | "fails">, focus: boolean) {
    demo.stop();
    runs.current += 1;
    moveFocus.current = focus;
    setManualRun({
      ...from,
      id: runs.current,
      status: "thinking",
      beat: 0,
      found: 0,
      words: 0,
    });
    setRating({ value: null });
  }
  function ask(question: string) {
    const topic = topicOf(question);
    const first = !!topic && !asked.current.has(topic.id);
    if (topic) asked.current.add(topic.id);
    begin(
      { text: question.trim(), topic, fails: topic?.id === "accrual" && first },
      true,
    );
  }
  // Trying again or regenerating the same question never fails again.
  const again = () =>
    run && begin({ text: run.text, topic: run.topic, fails: false }, false);

  if (!run)
    return (
      <div
        ref={starter}
        data-demo-composer
        onFocus={(event) => {
          // Replay temporarily shows the starter over the person's answer.
          // A focus interrupt restores that answer without losing focus.
          if (presenting && manualRun) {
            moveFocus.current = true;
            return;
          }
          // Capture the visible text before a focus interrupt ends the demo.
          if (draft === null && event.target instanceof HTMLTextAreaElement) {
            const visible = event.target.value;
            setDraft((current) => current ?? visible);
          }
        }}
      >
        <TaskStarter
          headingLevel={2}
          greeting={t(`مرحبًا ${story.user.ar}`, `Hello, ${story.user.en}`)}
          title={t("كيف نساعدك؟", "How can we help?")}
          value={
            presenting
              ? demo.draft(previewTopic.question[language])
              : (draft ?? "")
          }
          onValueChange={setDraft}
          onSubmit={ask}
          suggestions={topics.map((topic) => ({
            id: topic.id,
            label: topic.question[language],
          }))}
          // The suggestion fills the draft and hands the field its focus, so
          // Enter sends it and typing changes it.
          onSuggestion={(id) => {
            const question = topics.find((topic) => topic.id === id)!.question[
              language
            ];
            if (presenting && manualRun) {
              setReply(question);
              moveFocus.current = true;
              return;
            }
            setDraft(question);
            starter.current?.querySelector("textarea")?.focus();
          }}
          labels={{
            field: t("سؤالك", "Your question"),
            placeholder: t(
              "اسأل عن المطابقة أو الاستحقاق أو الإقفال…",
              "Ask about reconciliation, accruals or the close…",
            ),
            suggestions: t("أسئلة شائعة", "Common questions"),
          }}
        />
      </div>
    );

  // What has been written, and the articles behind it: the search finds them
  // one by one, and the answer cites those whose markers it has reached.
  const shown =
    run.status === "completed" ? text : parts.slice(0, run.words).join("");
  const refs = (run.topic?.articles ?? []).map((id, index) => ({
    id,
    number: index + 1,
    title: articles[id].title[language],
    href: `#${id}`,
    description: articles[id].quote[language],
    metadata: t(
      `مقال · حُدّث ${date(articles[id].updated)}`,
      `Article · Updated ${date(articles[id].updated)}`,
    ),
  }));
  const beats = Math.ceil(parts.length / wordsPerBeat);
  const support =
    run.status === "failed" ||
    rating.value === "down" ||
    (run.status === "completed" && !run.topic);

  return (
    <>
      <div
        ref={answer}
        onClickCapture={() => {
          if (presenting && (manualRun || draft !== null))
            moveFocus.current = true;
        }}
        onKeyDownCapture={() => {
          if (presenting && (manualRun || draft !== null))
            moveFocus.current = true;
        }}
      >
        <CitedAnswer
          headingLevel={2}
          status={run.status}
          question={run.topic?.question[language] ?? run.text}
          content={shown}
          sources={refs.filter((source) =>
            shown.includes(`[${source.number}]`),
          )}
          thinking={{
            // Whole seconds, so «أُوقف بعد ٠ث» never reads as no time at all.
            elapsed: Math.round((run.beat * thinkingMs) / 1000),
            searched: refs
              .slice(0, run.found)
              .map(({ id, number, title, href }) => ({
                id,
                number,
                title,
                href,
              })),
          }}
          followUps={(
            run.topic?.followUps ?? topics.map((topic) => topic.id)
          ).map((id) => ({
            id,
            label: topics.find((topic) => topic.id === id)!.question[language],
          }))}
          onFollowUp={(id) =>
            ask(topics.find((topic) => topic.id === id)!.question[language])
          }
          feedback={rating.value}
          reason={rating.reason}
          onFeedbackChange={(value, reason) => setRating({ value, reason })}
          onCopy={(copied) => navigator.clipboard?.writeText(copied)}
          onRegenerate={again}
          onStop={() => {
            demo.stop();
            if (presenting && (manualRun || draft !== null)) return;
            setManualRun((current) => {
              const target = current ?? run;
              return running(target)
                ? { ...target, status: "stopped" }
                : target;
            });
          }}
          onRetry={again}
          duration={
            manualRun && run.status === "completed"
              ? (thinkingBeats * thinkingMs + beats * writingMs) / 1000
              : undefined
          }
          error={connectionError[language]}
        />
      </div>
      {support && (
        <p className="help-center-support">
          <Headset size={16} aria-hidden="true" />
          <a href={`mailto:${supportEmail}`}>
            {t("تواصل مع فريق الدعم", "Contact the support team")}
          </a>
        </p>
      )}
      {!running(run) && (
        <PromptBar
          value={reply}
          onValueChange={setReply}
          onSubmit={(question) => {
            setReply("");
            ask(question);
          }}
          label={t("سؤال آخر", "Another question")}
          placeholder={t("اكتب سؤالًا آخر…", "Ask another question…")}
        />
      )}
    </>
  );
}

export function HelpCenter() {
  return (
    <ScreenFrame slug="help-center">
      <div className="help-center">
        <ScreenHeader />
        <Help />
      </div>
    </ScreenFrame>
  );
}
