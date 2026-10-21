import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck } from "lucide-react";
import {
  AskUserQuestions,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  DatePicker,
  FileDropzone,
  Input,
  OTPInput,
  Steps,
} from "../../system";
import type { QuestionAnswers, StepItem, UserQuestion } from "../../system";
import { ScreenFrame, ScreenHeader } from "../frame/ScreenFrame";
import { recorded, useScreen } from "../frame/screen";
import { assistant, company, limits, steps } from "./data";
import "./onboarding.css";

interface Entry {
  name: string;
  registration: string;
  fiscalStart: string;
  code: string;
  files: File[];
}
type Field = "name" | "registration" | "fiscalStart" | "code" | "files";

/** Digits typed on an Arabic keyboard count as digits. */
const latin = (text: string) =>
  text.replace(/[٠-٩۰-۹]/g, (digit) =>
    String(digit.charCodeAt(0) - (digit <= "٩" ? 0x660 : 0x6f0)),
  );

/** The fields a step still lacks, in the order they appear. */
function missing(step: number, entry: Entry): Field[] {
  const found: Field[] = [];
  if (step === 0) {
    const number = latin(entry.registration).replace(/\s/g, "");
    if (!entry.name.trim()) found.push("name");
    if (!/^\d+$/.test(number) || number.length !== limits.registrationDigits)
      found.push("registration");
    if (!entry.fiscalStart) found.push("fiscalStart");
  } else if (step === 1) {
    if (entry.code.length !== limits.codeDigits) found.push("code");
  } else if (step === 2) {
    if (entry.files.length !== limits.files) found.push("files");
  }
  return found;
}

// The first control a failed «متابعة» finds invalid: a field's input or
// trigger, or the dropzone's browse button, which is what its file input
// stands behind.
const INVALID =
  'input:not([type="file"])[aria-invalid="true"], button[aria-invalid="true"], [data-invalid="true"] > .tz-file-browse';

export function Onboarding() {
  return (
    <ScreenFrame slug="onboarding">
      <OnboardingContent />
    </ScreenFrame>
  );
}

function OnboardingContent() {
  const { language, t, number, date, href, open } = useScreen();
  const [step, setStep] = useState(0);
  const [entry, setEntry] = useState<Entry>({
    name: "",
    registration: "",
    fiscalStart: company.fiscalStart,
    code: "",
    files: [],
  });
  // Errors show after the first «متابعة» on a step, and then follow the fields.
  const [attempted, setAttempted] = useState(false);
  const [misses, setMisses] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswers>({});
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [round, setRound] = useState(0);
  const formId = useId();
  const titleId = useId();
  const card = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const questionsRoot = useRef<HTMLDivElement>(null);
  const arrived = useRef(false);
  const editing = useRef(false);
  const done = step === steps.length;
  const lacking = attempted ? missing(step, entry) : [];

  // A step the person moves to takes focus on its heading, never on mount.
  useEffect(() => {
    if (arrived.current) heading.current?.focus();
  }, [step]);
  // After a failed «متابعة» focus goes to the first invalid field, once its
  // error is in the page so the field's description reads it.
  useEffect(() => {
    if (misses) card.current?.querySelector<HTMLElement>(INVALID)?.focus();
  }, [misses]);
  // Editing the answers opens the question again, and its heading takes focus
  // in place of the button that left.
  useLayoutEffect(() => {
    if (!editing.current) return;
    editing.current = false;
    questionsRoot.current
      ?.querySelector<HTMLElement>(".tz-question-heading")
      ?.focus();
  }, [round]);

  function go(to: number) {
    arrived.current = true;
    setAttempted(false);
    setStep(to);
  }
  function next(event?: FormEvent) {
    event?.preventDefault();
    if (missing(step, entry).length) {
      setAttempted(true);
      setMisses((count) => count + 1);
      return;
    }
    go(step + 1);
  }
  const update = (change: Partial<Entry>) =>
    setEntry((current) => ({ ...current, ...change }));

  const registered = t(company.registered.ar, company.registered.en);
  const typed = entry.name.trim();
  // The documents leave a question open only when the name differs from theirs.
  const matches = [company.registered.ar, company.registered.en].some(
    (name) => name.toLowerCase() === typed.toLowerCase(),
  );
  const questions: UserQuestion[] = matches
    ? []
    : [
        {
          id: "name",
          label: t("أي الاسمين هو الصحيح؟", "Which name is right?"),
          description: t(
            `يذكر السجل التجاري «${registered}»، بينما أدخلت «${typed}».`,
            `The registration says “${registered}”, but you entered “${typed}”.`,
          ),
          choices: [
            {
              value: "registered",
              label: registered,
              description: t("كما في السجل التجاري", "As on the registration"),
            },
            {
              value: "typed",
              label: typed,
              description: t("كما أدخلته", "As you entered it"),
            },
          ],
        },
      ];
  // «متابعة» on the review sends the answer through the question's own form,
  // so the form checks it and focuses the question when it is missing. Once the
  // host accepted it, the same button finishes.
  function review() {
    if (!questions.length || accepted) go(steps.length);
    else questionsRoot.current?.querySelector("form")?.requestSubmit();
  }

  const items: StepItem[] = steps.map((item, index) => ({
    id: item.id,
    label: t(item.label.ar, item.label.en),
    status:
      index < step ? "completed" : index === step ? "current" : "upcoming",
  }));
  const text = done ? undefined : steps[step];
  const finalName = answers.name?.choice === "registered" ? registered : typed;
  // The number as the page writes digits, one at a time so nothing is grouped.
  const registration = [...latin(entry.registration).replace(/\s/g, "")]
    .map((digit) => (/\d/.test(digit) ? number(Number(digit)) : digit))
    .join("");

  const heading2 = (title: string) => (
    <h2
      id={titleId}
      ref={heading}
      tabIndex={-1}
      className="tz-card-title onboarding-title"
    >
      {title}
    </h2>
  );

  return (
    <div className="onboarding">
      <ScreenHeader
        title={t("سجّل منشأتك", "Register your company")}
        description={
          done
            ? t("اكتملت الخطوات الأربع.", "All four steps are done.")
            : `${t(
                `الخطوة ${number(step + 1)} من ${number(steps.length)}`,
                `Step ${number(step + 1)} of ${number(steps.length)}`,
              )} · ${t(
                `نحو ${number(limits.minutes)} دقائق`,
                `about ${number(limits.minutes)} minutes`,
              )}`
        }
      />
      <Steps
        label={t("خطوات التسجيل", "Registration steps")}
        items={items}
        locale={language}
      />
      {text ? (
        <Card
          key={step}
          ref={card}
          role="region"
          aria-labelledby={titleId}
          className="onboarding-card"
        >
          <CardHeader>
            {heading2(t(text.title.ar, text.title.en))}
            <p className="tz-card-description">
              {t(text.description.ar, text.description.en)}
            </p>
          </CardHeader>
          <CardContent>
            {step === 0 && (
              <form
                id={formId}
                noValidate
                className="onboarding-fields"
                onSubmit={next}
              >
                <Input
                  label={t("اسم المنشأة", "Company name")}
                  autoComplete="organization"
                  required
                  value={entry.name}
                  error={
                    lacking.includes("name")
                      ? t("أدخل اسم المنشأة.", "Enter the company name.")
                      : undefined
                  }
                  onChange={(event) => {
                    update({ name: event.currentTarget.value });
                    // An answer about the old name no longer stands.
                    setAccepted(false);
                    setAnswers({});
                  }}
                />
                <Input
                  label={t(
                    "رقم السجل التجاري",
                    "Commercial registration number",
                  )}
                  helper={t("عشرة أرقام.", "Ten digits.")}
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  value={entry.registration}
                  error={
                    lacking.includes("registration")
                      ? t(
                          "أدخل رقم السجل التجاري المكوّن من عشرة أرقام.",
                          "Enter the ten-digit registration number.",
                        )
                      : undefined
                  }
                  onChange={(event) =>
                    update({ registration: event.currentTarget.value })
                  }
                />
                <DatePicker
                  label={t("بداية السنة المالية", "Fiscal year starts")}
                  helper={t("بالتقويم الميلادي.", "In the Gregorian calendar.")}
                  locale={language}
                  yearRange={[2020, 2030]}
                  value={entry.fiscalStart}
                  error={
                    lacking.includes("fiscalStart")
                      ? t(
                          "اختر تاريخ بداية السنة المالية.",
                          "Choose the date the fiscal year starts.",
                        )
                      : undefined
                  }
                  onValueChange={(fiscalStart) => update({ fiscalStart })}
                />
              </form>
            )}
            {step === 1 && (
              <form
                id={formId}
                noValidate
                className="onboarding-fields"
                onSubmit={next}
              >
                <OTPInput
                  label={t("رمز التحقق", "Verification code")}
                  helper={t("ستة أرقام.", "Six digits.")}
                  length={limits.codeDigits}
                  required
                  value={entry.code}
                  error={
                    lacking.includes("code")
                      ? t(
                          "أدخل الرمز المكوّن من ستة أرقام.",
                          "Enter the six-digit code.",
                        )
                      : undefined
                  }
                  onValueChange={(code) => update({ code })}
                />
              </form>
            )}
            {step === 2 && (
              <form
                id={formId}
                noValidate
                className="onboarding-fields"
                onSubmit={next}
              >
                <FileDropzone
                  label={t("ملفات المستندات", "Document files")}
                  helper={t(
                    `ملف PDF أو صورة، حتى ${number(limits.fileSize)} ميغابايت للملف الواحد.`,
                    `PDF or image, up to ${number(limits.fileSize)} MB each.`,
                  )}
                  multiple
                  maxFiles={limits.files}
                  maxFileSize={limits.fileSize * 1024 * 1024}
                  accept=".pdf,image/*"
                  value={entry.files}
                  error={
                    lacking.includes("files")
                      ? t(
                          "أرفق المستندين: السجل التجاري وشهادة ضريبة القيمة المضافة.",
                          "Attach both documents: the commercial registration and the VAT certificate.",
                        )
                      : undefined
                  }
                  onValueChange={(files) => update({ files })}
                />
              </form>
            )}
            {step === 3 && (
              <div className="onboarding-fields">
                <dl className="onboarding-review">
                  <div>
                    <dt>{t("اسم المنشأة", "Company name")}</dt>
                    <dd>
                      <bdi>{typed}</bdi>
                    </dd>
                  </div>
                  <div>
                    <dt>
                      {t("رقم السجل التجاري", "Commercial registration number")}
                    </dt>
                    <dd>
                      <bdi dir="ltr">{registration}</bdi>
                    </dd>
                  </div>
                  <div>
                    <dt>{t("بداية السنة المالية", "Fiscal year starts")}</dt>
                    <dd>{date(entry.fiscalStart)}</dd>
                  </div>
                  <div>
                    <dt>{t("المستندات", "Documents")}</dt>
                    <dd>
                      <ul className="onboarding-files">
                        {entry.files.map((file, index) => (
                          <li key={index}>
                            <bdi dir="ltr">{file.name}</bdi>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                </dl>
                {questions.length ? (
                  <div ref={questionsRoot} className="onboarding-questions">
                    <AskUserQuestions
                      appearance="plain"
                      headingLevel={3}
                      agent={t(assistant.ar, assistant.en)}
                      questions={questions}
                      value={answers}
                      onValueChange={setAnswers}
                      resetKey={round}
                      receipt
                      answered={accepted}
                      onEditAnswers={() => {
                        editing.current = true;
                        setAccepted(false);
                        setRound((count) => count + 1);
                      }}
                      onSubmit={async (_answers, { signal }) => {
                        setSaving(true);
                        try {
                          await recorded(signal);
                          setAccepted(true);
                        } finally {
                          setSaving(false);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <p className="onboarding-note">
                    {t(
                      "تطابق بياناتك ما في مستنداتك، فلا أسئلة تنتظرك.",
                      "Your entries match your documents, so no questions wait for you.",
                    )}
                  </p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <a className="onboarding-skip" href={href("month-end-close")}>
              {t("تخطَّ الآن", "Skip for now")}
            </a>
            <Button
              variant="ghost"
              disabled={step === 0}
              onClick={() => go(step - 1)}
            >
              <ArrowLeft
                size={15}
                aria-hidden="true"
                className="tz-mirror-rtl"
              />
              {t("السابق", "Back")}
            </Button>
            <Button
              {...(step < 3
                ? { type: "submit" as const, form: formId }
                : { onClick: review })}
              state={saving ? "loading" : "idle"}
            >
              {t("متابعة", "Continue")}
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="tz-mirror-rtl"
              />
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card
          ref={card}
          role="region"
          aria-labelledby={titleId}
          className="onboarding-card"
        >
          <CardContent className="onboarding-done">
            <span className="onboarding-done-mark" aria-hidden="true">
              <BadgeCheck size={26} />
            </span>
            {heading2(t("اكتمل التسجيل", "Registration complete"))}
            <p className="tz-card-description">
              {t(
                `سجّلنا «${finalName}» وحفظنا مستنداتك. يمكنك الآن بدء إقفال الشهر.`,
                `We registered “${finalName}” and saved your documents. You can start the month-end close now.`,
              )}
            </p>
            <Button onClick={() => open("month-end-close")}>
              {t("ابدأ إقفال الشهر", "Start the month-end close")}
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="tz-mirror-rtl"
              />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
