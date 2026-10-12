import { useState } from "react";
import {
  Button,
  Tabs,
  Switch,
  DropdownMenu,
  Sheet,
  ToastProvider,
  useToast,
} from "../system";
import { Settings2 } from "lucide-react";
import type { ComponentId } from "./catalog";
import type { Language } from "./i18n";
import { words } from "./i18n";
import { optionNames } from "./fields";
import { localize } from "./i18n";
function ToastExamples({ language }: { language: Language }) {
  const { toast } = useToast();
  return (
    <div className="example-inline">
      {(["success", "error", "info"] as const).map((tone) => (
        <Button
          key={tone}
          variant="secondary"
          onClick={() =>
            toast({
              title: localize(optionNames[tone], language),
              description: words(language)(
                "رسالة تجريبية لنتيجة الإجراء.",
                "Example feedback for an action.",
              ),
              tone,
            })
          }
        >
          {localize(optionNames[tone], language)}
        </Button>
      ))}
    </div>
  );
}
function EditableSheet({ language }: { language: Language }) {
  const t = words(language);
  const [saved, setSaved] = useState({
    name: t("شركة مدار للتقنية", "Madar Technology"),
    email: "hello@madar.example",
  });
  const [draft, setDraft] = useState(saved);
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(value) => {
          if (value) setDraft(saved);
          setOpen(value);
        }}
        title={t("تفاصيل العميل", "Customer details")}
        description={t(
          "مثال للتعديل والحفظ المحلي",
          "Local editing and saving example",
        )}
        closeLabel={t("إغلاق المثال", "Close example")}
        trigger={
          <Button variant="secondary">
            {t("تعديل بيانات العميل", "Edit customer information")}
          </Button>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("إلغاء", "Cancel")}
            </Button>
            <Button form="example-customer-form" type="submit">
              {t("حفظ التغييرات", "Save changes")}
            </Button>
          </>
        }
      >
        <form
          id="example-customer-form"
          className="example-form"
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(draft);
            setOpen(false);
            setFeedback(
              t("حُفظت البيانات خلال هذه الجلسة.", "Saved for this session."),
            );
          }}
        >
          <label htmlFor="example-customer-name">
            {t("اسم الشركة", "Company name")}
          </label>
          <input
            id="example-customer-name"
            required
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <label htmlFor="example-customer-email">
            {t("البريد الإلكتروني", "Email address")}
          </label>
          <input
            id="example-customer-email"
            required
            type="email"
            dir="ltr"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
          />
          <p>
            <bdi dir="ltr">CUS-0082</bdi> ·{" "}
            <bdi dir="ltr">https://madar.example</bdi>
          </p>
        </form>
      </Sheet>
      <p role="status" className="example-feedback">
        {feedback}
      </p>
    </>
  );
}
export function Examples({
  component,
  language,
}: {
  component: ComponentId;
  language: Language;
}) {
  const t = words(language);
  const [event, setEvent] = useState("");
  const [checked, setChecked] = useState(false);
  if (component === "button")
    return (
      <div className="quiet-examples">
        <div className="example-row">
          <p>{t("الأنواع", "Variants")}</p>
          <div className="example-inline">
            {(["primary", "secondary", "ghost", "destructive"] as const).map(
              (variant) => (
                <Button
                  key={variant}
                  variant={variant}
                  onClick={() => setEvent(`${variant} · onClick`)}
                >
                  {localize(optionNames[variant], language)}
                </Button>
              ),
            )}
            <Button
              variant="secondary"
              iconOnly
              aria-label={t("إعدادات المثال", "Example settings")}
              onClick={() => setEvent("iconOnly · onClick")}
            >
              <Settings2 size={15} />
            </Button>
          </div>
        </div>
        <div className="example-row">
          <p>{t("الحالات والأحجام", "States and sizes")}</p>
          <div className="example-inline">
            <Button disabled>{t("معطّل", "Disabled")}</Button>
            <Button state="loading">{t("جارٍ الحفظ", "Saving")}</Button>
            <Button state="success">{t("تم الحفظ", "Saved")}</Button>
            <Button state="error">{t("تعذّر الحفظ", "Save failed")}</Button>
            <Button
              size="md"
              variant="secondary"
              onClick={() => setEvent("size md · onClick")}
            >
              {t("حجم عادي · md", "Regular · md")}
            </Button>
          </div>
        </div>
        <p className="example-feedback" role="status">
          {event}
        </p>
      </div>
    );
  if (component === "tabs")
    return (
      <div className="quiet-examples">
        <p className="example-caption">
          {t("اختيار مدمج لفترة التقرير", "A segmented report-period selector")}
        </p>
        <Tabs
          label={t("فترة التقرير", "Report period")}
          variant="segment"
          items={[
            {
              value: "week",
              label: t("الأسبوع", "Week"),
              content: (
                <p className="period-example">
                  {t(
                    "إيرادات الأسبوع: ٢٤٬٨٠٠ ر.س",
                    "Weekly revenue: SAR 24,800",
                  )}
                </p>
              ),
            },
            {
              value: "month",
              label: t("الشهر", "Month"),
              content: (
                <p className="period-example">
                  {t(
                    "إيرادات الشهر: ١٠٨٬٢٠٠ ر.س",
                    "Monthly revenue: SAR 108,200",
                  )}
                </p>
              ),
            },
          ]}
        />
      </div>
    );
  if (component === "switch")
    return (
      <div className="switch-examples">
        <Switch
          label={t("الملخص الأسبوعي", "Weekly summary")}
          checked={checked}
          onCheckedChange={setChecked}
        />
        <Switch
          label={t("مفعّل ومعطّل", "Checked and disabled")}
          checked
          disabled
        />
        <Switch
          label={t("متوقف ومعطّل", "Unchecked and disabled")}
          checked={false}
          disabled
        />
      </div>
    );
  if (component === "dropdown")
    return (
      <div className="quiet-examples">
        <p className="example-caption">
          {t(
            "محاذاة النهاية، مع إجراء معطّل وآخر للحذف",
            "End alignment with disabled and destructive actions",
          )}
        </p>
        <DropdownMenu
          align="end"
          trigger={
            <Button variant="secondary">
              {t("خيارات الفاتورة", "Invoice options")}
            </Button>
          }
          items={[
            {
              id: "copy",
              label: t("نسخ رقم الفاتورة", "Copy invoice ID"),
              onSelect: async () => {
                try {
                  await navigator.clipboard.writeText("INV-2048");
                  setEvent(t("تم نسخ INV-2048", "Copied INV-2048"));
                } catch {
                  setEvent(t("تعذّر النسخ", "Copy failed"));
                }
              },
            },
            {
              id: "archive",
              label: t("الأرشفة غير متاحة", "Archive unavailable"),
              disabled: true,
            },
            {
              id: "delete",
              label: t("حذف تجريبي", "Simulated delete"),
              destructive: true,
              separatorBefore: true,
              onSelect: () =>
                setEvent(
                  t("طُلب حذف تجريبي فقط.", "Simulated deletion requested."),
                ),
            },
          ]}
        />
        <p className="example-feedback" role="status" dir="auto">
          {event}
        </p>
      </div>
    );
  if (component === "sheet")
    return (
      <div className="quiet-examples">
        <p className="example-caption">
          {t(
            "نموذج محلي: حفظ التعديلات، أو تجاهل المسودة عند الإلغاء.",
            "A local form: save changes or discard a cancelled draft.",
          )}
        </p>
        <EditableSheet language={language} />
      </div>
    );
  return (
    <ToastProvider
      label={t("تنبيهات الأمثلة", "Example notifications")}
      closeLabel={t("إغلاق تنبيه المثال", "Dismiss example notification")}
    >
      <ToastExamples language={language} />
      <p className="example-caption">
        {t(
          "تتوقف المهلة أثناء التركيز أو مرور المؤشر. F8 للوصول إلى التنبيهات.",
          "Expiry pauses on focus or hover. Press F8 to reach notifications.",
        )}
      </p>
    </ToastProvider>
  );
}
