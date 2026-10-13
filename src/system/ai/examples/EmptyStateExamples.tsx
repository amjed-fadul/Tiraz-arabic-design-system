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
        title={ar ? "لا توجد سجلات بعد" : "No records yet"}
        description={
          ar
            ? "ستظهر سجلاتك هنا عند إضافتها."
            : "Your records will appear here when added."
        }
        illustration={<NoRecordsIllustration />}
      />
      <EmptyState
        title={ar ? "لا توجد نتائج" : "No search results"}
        description={
          ar ? "جرّب كلمات بحث مختلفة." : "Try different search terms."
        }
        illustration={<NoSearchResultsIllustration />}
      />
      {started ? (
        <div className="tz-empty-state">
          <h3>{ar ? "دليل البداية" : "Getting started guide"}</h3>
          <p>
            {ar
              ? "١. حدد المهمة. ٢. اختر المكوّن المناسب. ٣. اربط الإجراء بنتيجته."
              : "1. Define the task. 2. Choose a component. 3. Connect the action to its outcome."}
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
              ? "تعرف على خطوات استخدام المكوّنات."
              : "Learn the steps for using these components."
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
