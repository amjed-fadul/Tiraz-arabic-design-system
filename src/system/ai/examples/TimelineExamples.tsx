import { useRef, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { Button, Timeline } from "../../index";
import type { TimelineItem } from "../../index";

export interface TimelineExampleProps {
  language?: "ar" | "en";
  descriptions?: boolean;
  icons?: boolean;
  actions?: boolean;
  empty?: boolean;
  longContent?: boolean;
}
export function TimelineExample({
  language = "ar",
  descriptions = true,
  icons = true,
  actions = true,
  empty = false,
  longContent = false,
}: TimelineExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [appended, setAppended] = useState<
    Array<{ id: string; dateTime: string }>
  >([]);
  const [details, setDetails] = useState(false);
  const nextId = useRef(1);
  const format = (dateTime: string) =>
    new Intl.DateTimeFormat(language === "ar" ? "ar-u-nu-arab" : "en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Dubai",
    }).format(new Date(dateTime));
  const sample: TimelineItem[] = empty
    ? []
    : [
        {
          id: "brief",
          title: longContent
            ? t(
                "إضافة ملاحظات تفصيلية لمراجعة الطلب مع جميع أعضاء فريق المشروع",
                "Add detailed application notes for review with every member of the project team",
              )
            : t("إضافة ملاحظة تجريبية", "Sample note added"),
          timestamp: format("2026-10-15T05:12:00Z"),
          dateTime: "2026-10-15T05:12:00Z",
          description: descriptions ? (
            <>
              {t("معرّف المثال: ", "Sample identifier: ")}
              <bdi dir="ltr">DOC-42/2026</bdi>
              {longContent &&
                t(
                  " — ملاحظة طويلة تلتف بوضوح دون تغطية خط الأحداث أو الخروج من المساحة المتاحة.",
                  " — A long note that wraps clearly without covering the event connector or overflowing the available space.",
                )}
            </>
          ) : undefined,
          icon: icons ? <FileText /> : undefined,
          content: actions ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                aria-expanded={details}
                onClick={() => setDetails((value) => !value)}
              >
                {details
                  ? t("إخفاء التفاصيل المحلية", "Hide local details")
                  : t("عرض التفاصيل المحلية", "Show local details")}
              </Button>
              {details && (
                <p>
                  {t(
                    "هذه تفاصيل نموذجية في الذاكرة فقط.",
                    "These are sample details held only in memory.",
                  )}
                </p>
              )}
            </>
          ) : undefined,
        },
        {
          id: "review",
          title: t("تجهيز المعاينة", "Preview prepared"),
          timestamp: format("2026-10-15T06:40:00Z"),
          dateTime: "2026-10-15T06:40:00Z",
          description: descriptions
            ? t(
                "بيانات نموذجية قابلة للتعديل محليًا.",
                "Sample data available to edit locally.",
              )
            : undefined,
        },
      ];
  const items: TimelineItem[] = [
    ...sample,
    ...appended.map((event, index) => ({
      id: event.id,
      title: t(`حدث محلي ${index + 1}`, `Local event ${index + 1}`),
      timestamp: format(event.dateTime),
      dateTime: event.dateTime,
      description: descriptions
        ? t(
            "أُضيف بالضغط على الزر في هذا المثال.",
            "Appended by pressing the button in this example.",
          )
        : undefined,
      icon: icons ? <Plus /> : undefined,
    })),
  ];
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-4)",
        inlineSize: "100%",
        minInlineSize: 0,
      }}
    >
      <p style={{ margin: 0, color: "var(--text-secondary)" }}>
        {t(
          "بيانات نموذجية في الذاكرة؛ تُمسح عند إغلاق هذا المثال.",
          "In-memory sample data; cleared when this example unmounts.",
        )}
      </p>
      <Timeline
        label={t("النشاط المحلي", "Local activity")}
        items={items}
        emptyState={t("لا توجد أحداث محلية بعد.", "No local events yet.")}
      />
      <div>
        <Button
          variant="secondary"
          onClick={() => {
            const event = {
              id: `local-${nextId.current++}`,
              dateTime: new Date().toISOString(),
            };
            setAppended((events) => [...events, event]);
          }}
        >
          {t("إضافة حدث محلي", "Append local event")}
        </Button>
      </div>
      <span className="tz-visually-hidden" role="status">
        {appended.length > 0 &&
          t(
            `أُضيف ${appended.length} من الأحداث المحلية.`,
            `${appended.length} local events appended.`,
          )}
      </span>
    </div>
  );
}
