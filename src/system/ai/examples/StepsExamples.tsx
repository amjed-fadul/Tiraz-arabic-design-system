import { useEffect, useId, useRef, useState } from "react";
import { Button, Input, Steps } from "../../index";
import type { StepStatus } from "../../index";

export interface StepsExampleProps {
  language?: "ar" | "en";
  orientation?: "horizontal" | "vertical";
  currentState?: StepStatus;
  longLabels?: boolean;
}
/**
 * Your application owns progress: Back and Next move through the stages, and
 * any stage can be opened directly. `currentState` styles the active stage.
 */
export function StepsExample({
  language = "ar",
  orientation = "horizontal",
  currentState = "current",
  longLabels = false,
}: StepsExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [step, setStep] = useState(1);
  const stages = [
    {
      id: "brief",
      label: longLabels
        ? t(
            "مراجعة المعلومات الأساسية للطلب مع فريق المشروع",
            "Review the application's essential information with the project team",
          )
        : t("المعلومات", "Information"),
      description: t("الاسم وبيانات التواصل", "Name and contact details"),
    },
    {
      id: "details",
      label: longLabels
        ? t(
            "تحديد التفاصيل والمتطلبات الإضافية للمشروع",
            "Define additional project details and requirements",
          )
        : t("التفاصيل", "Details"),
      description: t("متطلبات المشروع", "Project requirements"),
    },
    {
      id: "review",
      label: longLabels
        ? t(
            "مراجعة جميع البيانات والمرفقات قبل إرسال الطلب",
            "Review all information and attachments before submitting the application",
          )
        : t("المراجعة", "Review"),
      description: t("تأكيد البيانات", "Confirm the information"),
    },
  ];
  const done = step === stages.length;
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-5)",
        inlineSize: "100%",
        minInlineSize: 0,
      }}
    >
      <Steps
        label={t("مراحل الطلب", "Application stages")}
        locale={language}
        orientation={orientation}
        currentId={done ? "" : stages[step].id}
        onStepActivate={(id) =>
          setStep(stages.findIndex((stage) => stage.id === id))
        }
        items={stages.map((stage, index) => ({
          ...stage,
          status:
            index < step
              ? "completed"
              : index === step
                ? currentState
                : "upcoming",
        }))}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="ghost"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          {t("السابق", "Back")}
        </Button>
        {done ? (
          <p role="status" style={{ margin: 0 }}>
            {t("اكتملت جميع المراحل.", "All stages are complete.")}
          </p>
        ) : (
          <Button onClick={() => setStep(step + 1)}>
            {step === stages.length - 1
              ? t("إنهاء", "Finish")
              : t("التالي", "Next")}
          </Button>
        )}
      </div>
    </div>
  );
}

/** Host application code. All values, validation and progress live here. */
export function StepsFormExample({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [complete, setComplete] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null),
    emailRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusStage = useRef(false);
  useEffect(() => {
    if (focusStage.current) {
      focusStage.current = false;
      headingRef.current?.focus();
    }
  }, [step, complete]);
  const titleId = useId();
  const labels = [
    t("الاسم", "Name"),
    t("التواصل", "Contact"),
    t("المراجعة", "Review"),
  ];
  const ids = ["name", "contact", "review"];
  function move(next: number) {
    focusStage.current = true;
    setStep(next);
    setInvalid(false);
  }
  return (
    <form
      noValidate
      aria-labelledby={titleId}
      style={{
        display: "grid",
        gap: "var(--space-4)",
        minInlineSize: 0,
        inlineSize: "100%",
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const field =
          step === 0 ? nameRef.current : step === 1 ? emailRef.current : null;
        if (
          (step === 0 && !name.trim()) ||
          (step === 1 && (!email.trim() || !field?.validity.valid))
        ) {
          setInvalid(true);
          field?.focus();
          return;
        }
        if (step < 2) move(step + 1);
        else {
          focusStage.current = true;
          setComplete(true);
        }
      }}
    >
      <h3 id={titleId} ref={headingRef} tabIndex={-1} style={{ margin: 0 }}>
        {complete ? t("أُرسل الطلب", "Application submitted") : labels[step]}
      </h3>
      <Steps
        label={t("تقدّم الطلب", "Application progress")}
        locale={language}
        items={ids.map((id, index) => ({
          id,
          label: labels[index],
          status:
            complete || index < step
              ? "completed"
              : index === step
                ? invalid
                  ? "error"
                  : "current"
                : "upcoming",
        }))}
        currentId={complete ? "" : ids[step]}
      />
      {complete ? (
        <p role="status" style={{ margin: 0, overflowWrap: "anywhere" }}>
          {t("شكرًا ", "Thanks, ")}
          {name}
          {t("، سنتواصل معك على ", ". We'll contact you at ")}
          <bdi dir="ltr">{email}</bdi>
          {t(" خلال يومَي عمل.", " within two business days.")}
        </p>
      ) : (
        <>
          {step === 0 && (
            <Input
              ref={nameRef}
              label={t("الاسم", "Name")}
              name="name"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setInvalid(false);
              }}
              error={
                invalid
                  ? t("أدخل الاسم للمتابعة.", "Enter a name to continue.")
                  : undefined
              }
            />
          )}
          {step === 1 && (
            <Input
              ref={emailRef}
              label={t("البريد الإلكتروني", "Email")}
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setInvalid(false);
              }}
              error={
                invalid
                  ? t(
                      "أدخل بريدًا إلكترونيًا صالحًا.",
                      "Enter a valid email address.",
                    )
                  : undefined
              }
            />
          )}
          {step === 2 && (
            <dl style={{ margin: 0, overflowWrap: "anywhere" }}>
              <dt>{t("الاسم", "Name")}</dt>
              <dd>{name}</dd>
              <dt>{t("البريد الإلكتروني", "Email")}</dt>
              <dd>
                <bdi dir="ltr">{email}</bdi>
              </dd>
            </dl>
          )}
          <div
            style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}
          >
            <Button
              type="button"
              variant="ghost"
              disabled={step === 0}
              onClick={() => move(step - 1)}
            >
              {t("السابق", "Back")}
            </Button>
            <Button type="submit">
              {step === 2
                ? t("إرسال الطلب", "Submit application")
                : t("التالي", "Next")}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}

/** Optional activation has no built-in eligibility or automatic advancement. */
export function ActivatableStepsExample({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const [currentId, setCurrentId] = useState("brief");
  const ar = language === "ar";
  return (
    <Steps
      label={ar ? "أقسام الطلب" : "Application sections"}
      locale={language}
      currentId={currentId}
      onStepActivate={setCurrentId}
      items={[
        {
          id: "brief",
          label: ar ? "المعلومات" : "Information",
          status: currentId === "brief" ? "current" : "upcoming",
        },
        {
          id: "review",
          label: ar ? "المراجعة" : "Review",
          status: currentId === "review" ? "current" : "upcoming",
        },
      ]}
    />
  );
}
