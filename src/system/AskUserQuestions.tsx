import { ArrowLeft, ArrowRight } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AIMark } from "./AIMark";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { Field } from "./Field";
import { Input } from "./Input";
import { RadioGroup } from "./RadioGroup";
import { StatusPill } from "./StatusPill";
import { Textarea } from "./Textarea";
import { Tray } from "./Tray";
import { askUserQuestionsCopy } from "./decision-copy";
import { useDecisionTask } from "./decision-task";
import { useSystem } from "./useSystem";
import { useChanged } from "./useChanged";
import { numberLocale } from "./config";
export interface UserQuestion {
  id: string;
  label: string;
  description?: string;
  type?: "choice" | "text";
  choices?: readonly { value: string; label: string; description?: string }[];
  allowOther?: boolean;
  /** Defaults to true; optional questions may be left blank. */
  required?: boolean;
}
export interface QuestionAnswer {
  choice?: string;
  text?: string;
}
export type QuestionAnswers = Readonly<Record<string, QuestionAnswer>>;
/** Every built-in string the questions show; `labels` overrides any of them. */
export interface AskUserQuestionsLabels {
  /** The form's name when `label` is not given. */
  name: string;
  /** «السؤال ١ من ٢». The digits arrive formatted for the page's numerals. */
  position: (current: string, total: string) => string;
  previous: string;
  next: string;
  /** The submit button when `submitLabel` is not given. */
  submit: string;
  skip: string;
  /** The free-answer choice. */
  other: string;
  /** Names the free-answer field. */
  otherAnswer: string;
  /** Asks for an answer left out. */
  required: string;
  submitting: string;
  accepted: string;
  failed: string;
  /** The 1–9 key hint. The digits arrive formatted. */
  hint: (first: string, last: string) => string;
  empty: string;
  /** Heads the receipt. */
  answers: string;
  editAnswers: string;
  /** The status pill while the questions wait. */
  needsYou: string;
}
export interface AskUserQuestionsProps {
  questions: readonly UserQuestion[];
  value: QuestionAnswers;
  onValueChange: (answers: QuestionAnswers) => void;
  onSubmit: (
    answers: QuestionAnswers,
    context: { signal: AbortSignal },
  ) => void | Promise<void>;
  label?: string;
  submitLabel?: string;
  resetKey?: string | number;
  className?: string;
  /** "card" sits on a tray, at most 38rem wide; "plain" lives on its host's paper. */
  appearance?: "card" | "plain";
  /** The question heading's level; 3 by default. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  labels?: Partial<AskUserQuestionsLabels>;
  /** Names the asking agent in the header. */
  agent?: ReactNode;
  /** Lets the person skip questions the agent can do without. */
  onSkip?: () => void;
  /** Folds the answers the host accepted into «إجاباتك». */
  receipt?: boolean;
  /** Offers «تعديل الإجابات» on the receipt. */
  onEditAnswers?: () => void;
}
/** Application-supplied single-choice/Other and text questions, with controlled drafts. */
export function AskUserQuestions(props: AskUserQuestionsProps) {
  return (
    <QuestionsInstance
      key={JSON.stringify([props.questions, props.resetKey])}
      {...props}
    />
  );
}
function QuestionsInstance({
  questions,
  value,
  onValueChange,
  onSubmit,
  label,
  submitLabel,
  className = "",
  appearance = "card",
  headingLevel = 3,
  labels,
  agent,
  onSkip,
  receipt = false,
  onEditAnswers,
}: AskUserQuestionsProps) {
  const { config } = useSystem(),
    copy = {
      ...askUserQuestionsCopy[config.direction === "rtl" ? "ar" : "en"],
      ...labels,
    },
    digits = new Intl.NumberFormat(numberLocale(config), {
      useGrouping: false,
    }),
    id = useId();
  const [index, setIndex] = useState(0),
    [attempted, setAttempted] = useState(false),
    [focusVersion, setFocusVersion] = useState(0),
    [sent, setSent] = useState<QuestionAnswers>({});
  const root = useRef<HTMLFormElement>(null),
    heading = useRef<HTMLHeadingElement>(null),
    focusTarget = useRef<"input" | "heading" | null>(null),
    task = useDecisionTask();
  const question = questions[index],
    answer = question ? (value[question.id] ?? {}) : {};
  // Options cascade in only once the question changed, never on mount.
  const changed = useChanged(index);
  const hadFocus = useRef(false);
  useLayoutEffect(() => {
    if (
      task.state === "accepted" &&
      hadFocus.current &&
      root.current?.ownerDocument.activeElement ===
        root.current?.ownerDocument.body
    )
      root.current?.focus();
  }, [task.state]);
  const busy = task.state === "submitting" || task.state === "accepted";
  const answered = receipt && task.state === "accepted";
  function incomplete(q: UserQuestion) {
    const a = value[q.id];
    if (q.required === false && !a?.choice && !a?.text?.trim()) return false;
    if (q.type === "text") return !a?.text?.trim();
    if (a?.choice === "other" && q.allowOther) return !a.text?.trim();
    return !q.choices?.some((choice) => choice.value === a?.choice);
  }
  // The receipt shows what the host accepted, in the person's words.
  function accepted(q: UserQuestion) {
    const a = sent[q.id];
    return q.type === "text" || a?.choice === "other"
      ? a?.text?.trim()
      : q.choices?.find((choice) => choice.value === a?.choice)?.label;
  }
  useLayoutEffect(() => {
    if (!focusTarget.current) return;
    const target =
      focusTarget.current === "heading"
        ? heading.current
        : root.current?.querySelector<HTMLElement>(
            question?.type !== "text" && answer.choice === "other"
              ? 'input[type="text"]'
              : "input,textarea",
          );
    target?.focus();
    focusTarget.current = null;
  }, [index, focusVersion, answer.choice, question?.type]);
  function move(next: number, focus: "input" | "heading" = "heading") {
    focusTarget.current = focus;
    setIndex(next);
    setFocusVersion((n) => n + 1);
  }
  function update(next: QuestionAnswer) {
    if (!busy && question) onValueChange({ ...value, [question.id]: next });
  }
  const error =
    attempted && question && incomplete(question) ? copy.required : undefined;
  const Heading = `h${headingLevel}` as const;
  const header = (
    <div className="tz-question-header" data-zone="header">
      <AIMark />
      {agent != null && <span className="tz-question-agent">{agent}</span>}
      {task.state !== "accepted" && (
        <StatusPill state="needs-you" label={copy.needsYou} />
      )}
    </div>
  );
  const content = answered ? (
    <>
      <Heading tabIndex={-1} className="tz-question-heading">
        {copy.answers}
      </Heading>
      <dl className="tz-question-receipt">
        {questions.map((q) => {
          const text = accepted(q);
          return text ? (
            <div key={q.id}>
              <dt dir="auto">{q.label}</dt>
              <dd dir="auto">{text}</dd>
            </div>
          ) : null;
        })}
      </dl>
    </>
  ) : question ? (
    <>
      {questions.length > 1 && (
        <div className="tz-question-progress">
          <p className="tz-decision-position">
            {copy.position(
              digits.format(index + 1),
              digits.format(questions.length),
            )}
          </p>
          <span className="tz-question-steps" aria-hidden="true">
            {questions.map((q, i) => (
              <span
                key={q.id}
                data-state={
                  i === index
                    ? "current"
                    : i < index || !incomplete(q)
                      ? "done"
                      : "upcoming"
                }
              />
            ))}
          </span>
        </div>
      )}
      <Heading
        ref={heading}
        tabIndex={-1}
        id={`${id}-title`}
        className="tz-question-heading"
        dir="auto"
      >
        {question.label}
      </Heading>
      {question.type === "text" ? (
        <Field
          className="tz-question-control"
          label={question.label}
          helper={question.description}
          required={question.required !== false}
          error={error}
        >
          {(control) => (
            <Textarea
              {...control}
              value={answer.text ?? ""}
              disabled={busy}
              onChange={(event) => update({ text: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
          )}
        </Field>
      ) : (
        <>
          <RadioGroup
            className="tz-question-control"
            label={question.label}
            name={`${id}-${question.id}`}
            helper={question.description}
            required={question.required !== false}
            error={error}
            disabled={busy}
            value={answer.choice ?? ""}
            options={[
              ...(question.choices ?? []),
              ...(question.allowOther
                ? [{ value: "other", label: copy.other }]
                : []),
            ]}
            onValueChange={(choice) =>
              update({
                choice,
                ...(choice === "other" ? { text: answer.text ?? "" } : {}),
              })
            }
          />
          {question.allowOther && answer.choice === "other" && (
            <Field label={copy.otherAnswer} error={error}>
              {(control) => (
                <Input
                  {...control}
                  value={answer.text ?? ""}
                  disabled={busy}
                  onChange={(event) =>
                    update({ choice: "other", text: event.target.value })
                  }
                />
              )}
            </Field>
          )}
        </>
      )}
    </>
  ) : (
    <p className="tz-decision-note">{copy.empty}</p>
  );
  // The status line keeps its place whatever the content above it, so the
  // live region never remounts.
  const paper = (
    <>
      {content}
      {question && (
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="tz-decision-status"
        >
          {task.state === "submitting"
            ? copy.submitting
            : task.state === "accepted"
              ? copy.accepted
              : (error ?? "")}
        </p>
      )}
      {task.state === "failed" && (
        <Alert tone="error" title={copy.failed} announcement="polite" />
      )}
    </>
  );
  const actions = answered ? (
    onEditAnswers && (
      <Button variant="ghost" onClick={onEditAnswers}>
        {copy.editAnswers}
      </Button>
    )
  ) : question ? (
    <>
      {onSkip && (
        <Button variant="ghost" disabled={busy} onClick={onSkip}>
          {copy.skip}
        </Button>
      )}
      <Button
        variant="ghost"
        disabled={busy || index === 0}
        onClick={() => move(index - 1)}
      >
        <ArrowLeft aria-hidden="true" size={15} className="tz-mirror-rtl" />
        {copy.previous}
      </Button>
      {question.type !== "text" && !!question.choices?.length && (
        <span className="tz-question-hint" aria-hidden="true">
          {copy.hint(
            digits.format(1),
            digits.format(Math.min(9, question.choices.length)),
          )}
        </span>
      )}
      {index < questions.length - 1 && (
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => move(index + 1)}
        >
          {copy.next}
          <ArrowRight aria-hidden="true" size={15} className="tz-mirror-rtl" />
        </Button>
      )}
      <Button
        variant={index === questions.length - 1 ? "primary" : "secondary"}
        type="submit"
        disabled={busy}
      >
        {submitLabel ?? copy.submit}
      </Button>
    </>
  ) : null;
  const decision = actions ? (
    <div className="tz-decision-actions" data-zone="decision">
      {actions}
    </div>
  ) : undefined;
  return (
    <form
      ref={root}
      onFocusCapture={() => {
        hadFocus.current = true;
      }}
      onBlurCapture={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          hadFocus.current = false;
      }}
      noValidate
      aria-label={label ?? copy.name}
      tabIndex={-1}
      className={`tz-ask-questions ${className}`}
      data-appearance={appearance}
      data-changed={changed || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        if (busy || !questions.length) return;
        setAttempted(true);
        const missing = questions.findIndex(incomplete);
        if (missing >= 0) {
          move(missing, "input");
          return;
        }
        const answers: Record<string, QuestionAnswer> = Object.create(null);
        for (const q of questions) {
          const a = value[q.id] ?? {};
          answers[q.id] =
            q.type === "text"
              ? { text: a.text ?? "" }
              : a.choice === "other" && q.allowOther
                ? { choice: "other", text: a.text ?? "" }
                : a.choice
                  ? { choice: a.choice }
                  : {};
        }
        setSent(answers);
        void task.run((signal) => onSubmit(answers, { signal }));
      }}
      onKeyDown={(event) => {
        if (busy || !question || event.altKey || event.ctrlKey || event.metaKey)
          return;
        const target = event.target as HTMLElement;
        if (target.matches('textarea,input:not([type="radio"])')) return;
        // Arabic keyboards type ١–٩ (or ۱–۹) on the number row.
        const number = Number(
          event.key.replace(/[٠-٩۰-۹]/, (digit) =>
            String(digit.charCodeAt(0) - (digit <= "٩" ? 0x660 : 0x6f0)),
          ),
        );
        if (number >= 1 && number <= 9 && question.choices?.[number - 1]) {
          event.preventDefault();
          update({ choice: question.choices[number - 1].value });
          root.current
            ?.querySelectorAll<HTMLInputElement>('input[type="radio"]')
            [number - 1]?.focus();
        }
      }}
    >
      {appearance === "card" ? (
        <Tray header={header} footer={decision} paper={false}>
          <div className="tz-tray-paper tz-question-paper" data-zone="paper">
            {paper}
          </div>
        </Tray>
      ) : (
        <>
          {header}
          <div className="tz-question-paper" data-zone="paper">
            {paper}
          </div>
          {decision}
        </>
      )}
    </form>
  );
}
