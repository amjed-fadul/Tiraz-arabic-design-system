import { useEffect, useState } from "react";
import { Alert, Avatar, Button, Skeleton } from "../../index";
import { useReducedMotion } from "../../useReducedMotion";
import { saraPortrait } from "./portraits";
type Language = "ar" | "en";
/** An alert with an action: sending the reminder updates it in place. */
export function AlertActionExample({
  language = "ar",
}: {
  language?: Language;
}) {
  const ar = language === "ar";
  const [sent, setSent] = useState(false);
  return (
    <Alert
      title={
        ar
          ? "الفاتورة INV-2048 مستحقة غدًا"
          : "Invoice INV-2048 is due tomorrow"
      }
      description={
        sent
          ? ar
            ? "أرسلنا تذكيرًا إلى hello@madar.sa."
            : "We sent a reminder to hello@madar.sa."
          : ar
            ? "شركة مدار للتقنية · ١٢٬٤٠٠ ر.س"
            : "Madar Technology · SAR 12,400"
      }
      announcement="polite"
      action={
        <Button
          variant="secondary"
          state={sent ? "success" : "idle"}
          onClick={() => setSent(true)}
        >
          {sent
            ? ar
              ? "أُرسل التذكير"
              : "Reminder sent"
            : ar
              ? "إرسال تذكير"
              : "Send reminder"}
        </Button>
      }
    />
  );
}
export function AlertExamples({ language = "ar" }: { language?: Language }) {
  const ar = language === "ar";
  return (
    <div className="tz-feedback-examples">
      <Alert title={ar ? "حُفظت التغييرات" : "Changes saved"} tone="success" />
      <Alert
        title={ar ? "تعذّر حفظ التغييرات" : "Changes could not be saved"}
        description={
          ar
            ? "تحقّق من اتصالك بالإنترنت، ثم حاول مرة أخرى."
            : "Check your connection and try again."
        }
        tone="error"
      />
      <AlertActionExample language={language} />
    </div>
  );
}
export function SkeletonExamples({ language = "ar" }: { language?: Language }) {
  const ar = language === "ar";
  const reduced = useReducedMotion();
  // Plays the loading state once on mount. With reduced motion the skeleton
  // simply holds still (its shimmer is already off), so the page still shows it.
  const [ready, setReady] = useState(false);
  const loading = !ready;
  useEffect(() => {
    if (reduced) return;
    const timer = setTimeout(() => setReady(true), 2400);
    return () => clearTimeout(timer);
  }, [reduced]);
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
          <>
            <Avatar
              name={ar ? "سارة علي" : "Sara Ali"}
              fallback={ar ? "س ع" : "SA"}
              src={saraPortrait}
              decorative
            />
            <div className="tz-feedback-lines">
              <strong>{ar ? "سارة علي" : "Sara Ali"}</strong>
              <bdi dir="ltr">sara@madar.sa</bdi>
              <p style={{ margin: 0, color: "var(--text-secondary)" }}>
                {ar
                  ? "مديرة الحسابات في شركة مدار للتقنية. تتابع الفواتير المستحقة وتذكيرات العملاء."
                  : "Accounts manager at Madar Technology. Follows up on due invoices and customer reminders."}
              </p>
            </div>
          </>
        )}
      </div>
      <p role="status" className="tz-visually-hidden">
        {loading
          ? ar
            ? "جارٍ تحميل الملف الشخصي"
            : "Loading profile"
          : ar
            ? "تم تحميل الملف الشخصي"
            : "Profile loaded"}
      </p>
    </div>
  );
}
