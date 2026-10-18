import { useRef, useState } from "react";
import { FileText, Phone } from "lucide-react";
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
  const [calls, setCalls] = useState<Array<{ id: string; dateTime: string }>>(
    [],
  );
  const [details, setDetails] = useState(false);
  const nextId = useRef(1);
  const format = (dateTime: string) =>
    new Intl.DateTimeFormat(language === "ar" ? "ar-u-nu-arab" : "en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Dubai",
    }).format(new Date(dateTime));
  const history: TimelineItem[] = empty
    ? []
    : [
        {
          id: "brief",
          title: longContent
            ? t(
                "أُنشئ عرض سعر تفصيلي لشركة الندى للتجارة يشمل التوريد والتركيب والصيانة السنوية",
                "Detailed quote created for Al Nada Trading covering supply, installation and annual maintenance",
              )
            : t("أُنشئ عرض السعر", "Quote created"),
          timestamp: format("2026-10-15T05:12:00Z"),
          dateTime: "2026-10-15T05:12:00Z",
          description: descriptions ? (
            <>
              {t("رقم العرض: ", "Quote number: ")}
              <bdi dir="ltr">PRO-2026-118</bdi>
              {longContent &&
                t(
                  " — يضم ثلاثة بنود بأسعار مختلفة ويُدفع على دفعتين، ومعه ملاحظات العميل عن التسليم آخر الشهر.",
                  " — Three line items with different prices and two-part payment terms, plus the client's notes on an end-of-month delivery.",
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
                  ? t("إخفاء التفاصيل", "Hide details")
                  : t("عرض التفاصيل", "Show details")}
              </Button>
              {details && (
                <p>
                  {t(
                    "٣ بنود · الإجمالي ٤٨٬٠٠٠ د.إ · صالح حتى ٣١ أكتوبر",
                    "3 line items · Total AED 48,000 · Valid until 31 Oct",
                  )}
                </p>
              )}
            </>
          ) : undefined,
        },
        {
          id: "review",
          title: t("أُرسل العرض إلى العميل", "Quote sent to client"),
          timestamp: format("2026-10-15T06:40:00Z"),
          dateTime: "2026-10-15T06:40:00Z",
          description: descriptions
            ? t("إلى شركة الندى للتجارة", "To Al Nada Trading")
            : undefined,
        },
      ];
  const count = new Intl.NumberFormat(
    language === "ar" ? "ar-u-nu-arab" : "en",
  ).format(calls.length);
  const items: TimelineItem[] = [
    ...history,
    ...calls.map((call) => ({
      id: call.id,
      title: t("مكالمة متابعة مع العميل", "Follow-up call with the client"),
      timestamp: format(call.dateTime),
      dateTime: call.dateTime,
      description: descriptions
        ? t("سجّلتها سارة علي", "Logged by Sara Ali")
        : undefined,
      icon: icons ? <Phone /> : undefined,
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
      <Timeline
        label={t("سجل النشاط", "Activity log")}
        items={items}
        emptyState={t("لا يوجد نشاط بعد.", "No activity yet.")}
      />
      <div>
        <Button
          variant="secondary"
          onClick={() => {
            const call = {
              id: `call-${nextId.current++}`,
              dateTime: new Date().toISOString(),
            };
            setCalls((previous) => [...previous, call]);
          }}
        >
          {t("تسجيل مكالمة", "Log a call")}
        </Button>
      </div>
      <span className="tz-visually-hidden" role="status">
        {calls.length > 0 &&
          t(
            `سُجّلت مكالمة متابعة (${count}).`,
            `Follow-up call logged (${count}).`,
          )}
      </span>
    </div>
  );
}
