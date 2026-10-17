import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AskUserQuestions,
  ApprovalCard,
  ApprovalFlow,
  Button,
} from "../../index";
import type { ApprovalRequest, QuestionAnswers } from "../../index";
type Language = "ar" | "en";
function sampleRequest(
  ar: boolean,
  second = false,
  target?: string,
): ApprovalRequest {
  return {
    id: second ? "sample-note-v1" : "sample-title-v1",
    action: second
      ? ar
        ? "إضافة ملاحظة عينة"
        : "Add sample note"
      : ar
        ? "تغيير عنوان العينة"
        : "Rename sample draft",
    target: target ?? (ar ? "مسودة الاستوديو · عينة" : "Studio draft · sample"),
    details: second
      ? ar
        ? "النص: جاهز للمراجعة"
        : "Text: Ready for review"
      : ar
        ? "العنوان المقترح: مسودة موجزة"
        : "Proposed title: Concise draft",
    consequences: [
      second
        ? ar
          ? "عند التنفيذ، تُضاف الملاحظة لهذه المسودة فقط دون تغيير العنوان."
          : "If executed, the note would be appended to this draft only; its title would stay unchanged."
        : ar
          ? "عند التنفيذ، يتغير عنوان هذه المسودة فقط دون تغيير النص."
          : "If executed, only this draft title would change; its text would stay unchanged.",
      ar
        ? "يسجّل هذا العرض القرار فقط؛ لا ينفّذ التغيير."
        : "This demo records the decision only; it does not execute the change.",
    ],
    approveLabel: second
      ? ar
        ? "الموافقة على الملاحظة"
        : "Approve sample note"
      : ar
        ? "الموافقة على العنوان"
        : "Approve sample rename",
    rejectLabel: second
      ? ar
        ? "رفض الملاحظة"
        : "Reject sample note"
      : ar
        ? "الإبقاء على العنوان"
        : "Keep sample title",
  };
}
export function AskUserQuestionsExample({
  language = "ar",
  longContent = false,
}: {
  language?: Language;
  longContent?: boolean;
}) {
  const ar = language === "ar",
    [value, setValue] = useState<QuestionAnswers>({});
  return (
    <AskUserQuestions
      questions={[
        {
          id: "scope",
          label: ar
            ? "ما الذي أراجعه في المسودة؟"
            : "What should I review in the draft?",
          description: longContent
            ? ar
              ? "اختر نطاق المراجعة. هذه أسئلة يكتبها التطبيق، ويمكن تعديل الإجابات قبل إرسالها."
              : "Choose a review scope. These questions are supplied by the application; answers stay editable before submission."
            : undefined,
          choices: [
            { value: "title", label: ar ? "العنوان فقط" : "Title only" },
            {
              value: "intro",
              label: ar ? "العنوان والمقدمة" : "Title and introduction",
            },
          ],
          allowOther: true,
        },
        {
          id: "notes",
          type: "text",
          label: ar
            ? "ملاحظات إضافية (اختياري)"
            : "Additional notes (optional)",
          required: false,
        },
      ]}
      value={value}
      onValueChange={setValue}
      onSubmit={() => {}}
    />
  );
}
export function ApprovalCardExample({
  language = "ar",
  longContent = false,
}: {
  language?: Language;
  longContent?: boolean;
}) {
  const ar = language === "ar";
  return (
    <ApprovalCard
      request={sampleRequest(
        ar,
        false,
        longContent
          ? ar
            ? "مسودة الاستوديو الطويلة / Studio draft 2026 — عنوان للمراجعة فقط"
            : "Studio draft 2026 / مسودة طويلة — sample target for review only"
          : undefined,
      )}
      onDecision={() => {}}
    />
  );
}
export function ApprovalFlowExample({
  language = "ar",
  longContent = false,
}: {
  language?: Language;
  longContent?: boolean;
}) {
  const ar = language === "ar";
  return (
    <ApprovalFlow
      label={ar ? "مراجعة طلبي العينة" : "Review two sample requests"}
      requests={[
        sampleRequest(ar),
        sampleRequest(
          ar,
          true,
          longContent
            ? "Studio draft / مسودة الاستوديو 2026 — sample note"
            : undefined,
        ),
      ]}
      onDecision={() => {}}
    />
  );
}
/** Harmless local host simulation; reset/unmount abort every pending callback. */
export function AIDecisionsExample({
  language = "ar",
}: {
  language?: Language;
}) {
  const ar = language === "ar",
    [answers, setAnswers] = useState<QuestionAnswers>({}),
    [submitted, setSubmitted] = useState<QuestionAnswers>({}),
    [ready, setReady] = useState(false),
    [revision, setRevision] = useState(0),
    [failNext, setFailNext] = useState(true);
  const selectedDraft =
    submitted.scope?.choice === "other"
      ? (submitted.scope.text ?? "")
      : submitted.scope?.choice === "short"
        ? ar
          ? "النسخة الموجزة"
          : "Concise draft"
        : ar
          ? "النسخة الكاملة"
          : "Full draft";
  const pending = useRef(new Set<() => void>());
  const root = useRef<HTMLDivElement>(null),
    hadFocus = useRef(false);
  useLayoutEffect(() => {
    if (
      ready &&
      hadFocus.current &&
      root.current?.ownerDocument.activeElement ===
        root.current?.ownerDocument.body
    )
      root.current?.querySelector<HTMLElement>(".tz-approval-card")?.focus();
  }, [ready]);
  useEffect(
    () => () => {
      for (const cancel of pending.current) cancel();
      pending.current.clear();
    },
    [],
  );
  function reset() {
    for (const cancel of pending.current) cancel();
    pending.current.clear();
    setAnswers({});
    setSubmitted({});
    setReady(false);
    setFailNext(true);
    setRevision((n) => n + 1);
  }
  function accept(signal: AbortSignal, fail: boolean) {
    return new Promise<void>((resolve, reject) => {
      const cancel = () => {
        clearTimeout(timer);
        signal.removeEventListener("abort", cancel);
        pending.current.delete(cancel);
        reject(new DOMException("Cancelled", "AbortError"));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", cancel);
        pending.current.delete(cancel);
        if (signal.aborted)
          return reject(new DOMException("Cancelled", "AbortError"));
        if (fail) reject(new Error("Local host failure"));
        else resolve();
      }, 650);
      pending.current.add(cancel);
      signal.addEventListener("abort", cancel, { once: true });
      if (signal.aborted) cancel();
    });
  }
  return (
    <div
      ref={root}
      className="tz-decisions-example"
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
    >
      <p className="tz-decision-note">
        {ar
          ? "مساعد الاستوديو المحلي · بيانات عينة في الذاكرة فقط. يطلب إجابة ثم قرارين مستقلين؛ لا يُنفّذ إجراءات."
          : "Local Studio Assistant · in-memory sample data only. Asks a question, then two independent decisions; no actions executed."}
      </p>
      <Button variant="ghost" onClick={reset}>
        {ar ? "إعادة المثال" : "Reset example"}
      </Button>
      {!ready ? (
        <AskUserQuestions
          key={revision}
          questions={[
            {
              id: "scope",
              label: ar
                ? "أي نسخة نستخدم للمراجعة؟"
                : "Which draft should we review?",
              choices: [
                {
                  value: "short",
                  label: ar ? "النسخة الموجزة" : "Concise draft",
                },
                { value: "full", label: ar ? "النسخة الكاملة" : "Full draft" },
              ],
              allowOther: true,
            },
          ]}
          value={answers}
          onValueChange={setAnswers}
          onSubmit={async (acceptedAnswers, { signal }) => {
            await accept(signal, false);
            if (!signal.aborted) {
              setSubmitted(acceptedAnswers);
              setReady(true);
            }
          }}
        />
      ) : (
        <>
          <p className="tz-decision-note">
            {ar ? "اختيارك" : "Your answer"}: <bdi>{selectedDraft} </bdi>
          </p>
          <label className="tz-radio-option">
            <input
              type="checkbox"
              checked={failNext}
              onChange={(event) => setFailNext(event.target.checked)}
            />
            {ar
              ? "محاكاة فشل قبول القرار التالي"
              : "Simulate next decision failure"}
          </label>
          <ApprovalFlow
            key={revision}
            label={ar ? "قرارات مساعد الاستوديو" : "Studio Assistant decisions"}
            requests={[
              sampleRequest(ar, false, selectedDraft),
              sampleRequest(ar, true, selectedDraft),
            ]}
            onDecision={async (_request, _decision, { signal }) => {
              const fail = failNext;
              setFailNext(false);
              await accept(signal, fail);
            }}
          />
        </>
      )}
    </div>
  );
}
