import { ArrowLeft, ArrowRight } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { Field } from "./Field";
import { Input } from "./Input";
import { RadioGroup } from "./RadioGroup";
import { Textarea } from "./Textarea";
import { useDecisionTask } from "./decision-task";
import { useSystem } from "./useSystem";
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
}
const arabicDigits = new Intl.NumberFormat("ar-u-nu-arab");
function digits(value: number) {
  return arabicDigits.format(value);
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
}: AskUserQuestionsProps) {
  const { config } = useSystem(),
    ar = config.direction === "rtl",
    id = useId();
  const [index, setIndex] = useState(0),
    [attempted, setAttempted] = useState(false),
    [focusVersion, setFocusVersion] = useState(0);
  const root = useRef<HTMLFormElement>(null),
    focusTarget = useRef<"input" | "heading" | null>(null),
    task = useDecisionTask();
  const question = questions[index],
    answer = question ? (value[question.id] ?? {}) : {};
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
  function incomplete(q: UserQuestion) {
    const a = value[q.id];
    if (q.required === false && !a?.choice && !a?.text?.trim()) return false;
    if (q.type === "text") return !a?.text?.trim();
    if (a?.choice === "other" && q.allowOther) return !a.text?.trim();
    return !q.choices?.some((choice) => choice.value === a?.choice);
  }
  useLayoutEffect(() => {
    if (!focusTarget.current) return;
    const target =
      focusTarget.current === "heading"
        ? root.current?.querySelector<HTMLElement>("h3")
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
    attempted && question && incomplete(question)
      ? ar
        ? "أجب عن هذا السؤال للمتابعة."
        : "Answer this question to continue."
      : undefined;
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
      aria-label={label ?? (ar ? "أسئلة المساعد" : "Assistant questions")}
      tabIndex={-1}
      className={`tz-ask-questions ${className}`}
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
      {question ? (
        <>
          {questions.length > 1 && (
            <div className="tz-question-progress">
              <p className="tz-decision-position">
                {ar
                  ? `السؤال ${digits(index + 1)} من ${digits(questions.length)}`
                  : `Question ${index + 1} of ${questions.length}`}
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
          <h3 tabIndex={-1} id={`${id}-title`} dir="auto">
            {question.label}
          </h3>
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
                    if (
                      event.key === "Enter" &&
                      (event.metaKey || event.ctrlKey)
                    ) {
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
                    ? [{ value: "other", label: ar ? "إجابة أخرى" : "Other" }]
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
                <Field label={ar ? "إجابة أخرى" : "Other answer"} error={error}>
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
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="tz-decision-status"
          >
            {task.state === "submitting"
              ? ar
                ? "جارٍ إرسال الإجابات"
                : "Submitting answers"
              : task.state === "accepted"
                ? ar
                  ? "أُرسلت الإجابات."
                  : "Answers accepted."
                : (error ?? "")}
          </p>
          {task.state === "failed" && (
            <Alert
              tone="error"
              title={
                ar
                  ? "تعذّر إرسال الإجابات. مسودتك محفوظة، حاول مرة أخرى."
                  : "Answers were not accepted. Your draft is preserved."
              }
              announcement="polite"
            />
          )}
          <div className="tz-decision-actions">
            <Button
              variant="ghost"
              disabled={busy || index === 0}
              onClick={() => move(index - 1)}
            >
              <ArrowLeft
                aria-hidden="true"
                size={15}
                className="tz-mirror-rtl"
              />
              {ar ? "السؤال السابق" : "Previous question"}
            </Button>
            {question.type !== "text" && !!question.choices?.length && (
              <span className="tz-question-hint" aria-hidden="true">
                {ar
                  ? `اضغط ${digits(1)}–${digits(Math.min(9, question.choices.length))} للاختيار`
                  : `Press 1–${Math.min(9, question.choices.length)} to choose`}
              </span>
            )}
            {index < questions.length - 1 && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => move(index + 1)}
              >
                {ar ? "السؤال التالي" : "Next question"}
                <ArrowRight
                  aria-hidden="true"
                  size={15}
                  className="tz-mirror-rtl"
                />
              </Button>
            )}
            <Button
              variant={index === questions.length - 1 ? "primary" : "secondary"}
              type="submit"
              disabled={busy}
            >
              {submitLabel ?? (ar ? "إرسال الإجابات" : "Submit answers")}
            </Button>
          </div>
        </>
      ) : (
        <p className="tz-decision-note">
          {ar ? "لا توجد أسئلة." : "No questions."}
        </p>
      )}
    </form>
  );
}
