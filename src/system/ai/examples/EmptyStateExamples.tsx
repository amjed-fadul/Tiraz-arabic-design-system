import { useState } from "react";
import {
  Button,
  EmptyState,
  GettingStartedIllustration,
  NoRecordsIllustration,
  NoSearchResultsIllustration,
} from "../../index";
export function EmptyStateExamples({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const ar = language === "ar";
  const [started, setStarted] = useState(false);
  return (
    <div className="tz-empty-examples">
      <EmptyState
        title={ar ? "لا توجد فواتير بعد" : "No invoices yet"}
        description={
          ar
            ? "ستظهر فواتيرك هنا حين تنشئ أول فاتورة."
            : "Your invoices will appear here once created."
        }
        illustration={<NoRecordsIllustration />}
      />
      <EmptyState
        title={ar ? "لا توجد نتائج لـ «الريان»" : "No results for “Rayyan”"}
        description={
          ar
            ? "جرّب اسمًا آخر أو رقم فاتورة."
            : "Try another name or invoice number."
        }
        illustration={<NoSearchResultsIllustration />}
      />
      {started ? (
        <div className="tz-empty-state">
          <h3>{ar ? "دليل البداية" : "Getting started guide"}</h3>
          <p>
            {ar
              ? "١. أضف بيانات شركتك. ٢. أضف أول عميل. ٣. أرسل أول فاتورة."
              : "1. Add your company details. 2. Add your first customer. 3. Send your first invoice."}
          </p>
          <Button variant="secondary" onClick={() => setStarted(false)}>
            {ar ? "العودة" : "Back"}
          </Button>
        </div>
      ) : (
        <EmptyState
          title={ar ? "ابدأ بخطوة بسيطة" : "Start with a small step"}
          description={
            ar
              ? "ثلاث خطوات تفصلك عن أول فاتورة."
              : "Three steps to your first invoice."
          }
          illustration={<GettingStartedIllustration />}
          action={
            <Button variant="secondary" onClick={() => setStarted(true)}>
              {ar ? "عرض دليل البداية" : "View getting started guide"}
            </Button>
          }
        />
      )}
    </div>
  );
}
