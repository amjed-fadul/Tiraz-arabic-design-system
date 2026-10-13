import { useEffect, useRef, useState } from "react";
import { Alert, Button, Skeleton, Progress, Spinner } from "../../index";
type Language = "ar" | "en";
export function AlertExamples({ language = "ar" }: { language?: Language }) {
  const ar = language === "ar";
  const [visible, setVisible] = useState(true);
  const actionRef = useRef<HTMLDivElement>(null);
  const focusRequested = useRef(false);
  useEffect(() => {
    if (focusRequested.current) {
      actionRef.current
        ?.querySelector<HTMLButtonElement>("[data-note-action]")
        ?.focus();
      focusRequested.current = false;
    }
  }, [visible]);
  function toggleNote() {
    focusRequested.current = true;
    setVisible((value) => !value);
  }
  return (
    <div ref={actionRef} className="tz-feedback-examples">
      <Alert
        title={ar ? "تم إعداد المعاينة" : "Preview prepared"}
        tone="success"
      />
      <Alert
        title={ar ? "تعذّر حفظ التغييرات" : "Changes could not be saved"}
        description={
          ar
            ? "هذا مثال ثابت لرسالة خطأ؛ لم يحدث طلب شبكة."
            : "This is a static error example; no network request occurred."
        }
        tone="error"
      />
      {visible ? (
        <Alert
          title={ar ? "ملاحظة للمعاينة" : "Preview note"}
          description={
            ar
              ? "إغلاق هذه الرسالة يخص هذا المثال فقط."
              : "Dismissing this message affects this example only."
          }
          action={
            <Button
              data-note-action=""
              variant="secondary"
              onClick={toggleNote}
            >
              {ar ? "إغلاق الملاحظة" : "Dismiss note"}
            </Button>
          }
        />
      ) : (
        <>
          <p role="status">{ar ? "أُغلقت الملاحظة" : "Note dismissed"}</p>
          <Button data-note-action="" variant="secondary" onClick={toggleNote}>
            {ar ? "إظهار الملاحظة" : "Show note"}
          </Button>
        </>
      )}
      <p>
        {ar
          ? "الرسائل الثابتة لا تعلن تلقائيًا. استخدم announcement=polite لتحديث عادي أو assertive لرسالة عاجلة."
          : "Static messages are silent. Use announcement=polite for a routine update or assertive for urgent feedback."}
      </p>
    </div>
  );
}
export function SkeletonExamples({ language = "ar" }: { language?: Language }) {
  const ar = language === "ar";
  const [loading, setLoading] = useState(true);
  return (
    <div className="tz-feedback-examples">
      <div aria-busy={loading} className="tz-feedback-placeholder">
        {loading ? (
          <>
            <Skeleton shape="circle" />
            <div className="tz-feedback-lines">
              <Skeleton style={{ inlineSize: "75%" }} />
              <Skeleton style={{ inlineSize: "55%" }} />
              <Skeleton shape="rectangle" />
            </div>
          </>
        ) : (
          <p>
            {ar
              ? "المحتوى النموذجي جاهز للقراءة."
              : "The sample content is ready to read."}
          </p>
        )}
      </div>
      <p role="status">
        {loading
          ? ar
            ? "جارٍ تجهيز المحتوى"
            : "Preparing content"
          : ar
            ? "المحتوى جاهز"
            : "Content ready"}
      </p>
      <Button variant="secondary" onClick={() => setLoading((value) => !value)}>
        {loading
          ? ar
            ? "عرض المحتوى"
            : "Show content"
          : ar
            ? "عرض حالة التحميل"
            : "Show loading state"}
      </Button>
    </div>
  );
}
export function ProgressExamples({ language = "ar" }: { language?: Language }) {
  const ar = language === "ar";
  return (
    <div className="tz-feedback-examples">
      <Progress
        label={ar ? "لم يبدأ" : "Not started"}
        value={0}
        showValue
        locale={language}
      />
      <Progress
        label={ar ? "مكتمل" : "Complete"}
        value={100}
        showValue
        locale={language}
      />
      <Progress
        label={ar ? "بانتظار معرفة الحجم" : "Waiting for total size"}
        locale={language}
      />
      <p>
        {ar
          ? "أمثلة حالات صريحة؛ قيمة null أو غير محدودة تعني تقدمًا غير محدد."
          : "Explicit example states; null or a nonfinite value means indeterminate progress."}
      </p>
    </div>
  );
}
export function SpinnerExamples({ language = "ar" }: { language?: Language }) {
  const ar = language === "ar";
  return (
    <div className="tz-feedback-examples">
      <div role="status" className="tz-preferences-actions">
        <Spinner decorative />
        <span>{ar ? "جارٍ تجهيز المحتوى" : "Preparing content"}</span>
      </div>
      <p>
        {ar
          ? "عند تقليل الحركة يبقى المؤشر ثابتًا والتسمية متاحة. استخدم decorative عندما يعلن النص المجاور الحالة."
          : "With reduced motion the indicator remains static and its label remains available. Use decorative when adjacent text announces the state."}
      </p>
    </div>
  );
}
