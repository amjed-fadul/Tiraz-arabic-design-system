import { lazy, Suspense } from "react";
import type { ChartKind } from "../system/ai/examples/ChartExamples";
import {
  AlertExamples,
  SkeletonExamples,
  ProgressExamples,
  SpinnerExamples,
} from "../system/ai/examples/FeedbackExamples";
import { TeamExample } from "../system/ai/examples/OverlayExamples";
import { AvatarExamples } from "../system/ai/examples/AvatarExamples";
import { EmptyStateExamples } from "../system/ai/examples/EmptyStateExamples";
import { FeedbackForm } from "../system/ai/examples/FeedbackForm";
import { useState } from "react";
import {
  Badge,
  Checkbox,
  RadioGroup,
  Field,
  Input,
  Select,
  Sheet,
  Button,
  Tabs,
  Switch,
  DropdownMenu,
  ToastProvider,
  useToast,
} from "../system";
import { TableExample } from "../system/ai/examples/TableExample";
import { CreateCustomer } from "../system/ai/examples/CreateCustomer";
import { Settings2 } from "lucide-react";
import type { ComponentId } from "./catalog";
import type { Language } from "./i18n";
import { words } from "./i18n";
import { optionNames } from "./fields";
import { localize } from "./i18n";
const ChartExample = lazy(() =>
  import("../system/ai/examples/ChartExamples").then((module) => ({
    default: module.ChartExample,
  })),
);
const AnalyticsExample = lazy(() =>
  import("../system/ai/examples/ChartExamples").then((module) => ({
    default: module.AnalyticsExample,
  })),
);
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
          <Field
            id="example-customer-name"
            label={t("اسم الشركة", "Company name")}
          >
            {(field) => (
              <Input
                required
                field={field}
                value={draft.name}
                onChange={(e) =>
                  setDraft({ ...draft, name: e.currentTarget.value })
                }
              />
            )}
          </Field>
          <Field
            id="example-customer-email"
            label={t("البريد الإلكتروني", "Email address")}
          >
            {(field) => (
              <Input
                required
                field={field}
                type="email"
                dir="ltr"
                value={draft.email}
                onChange={(e) =>
                  setDraft({ ...draft, email: e.currentTarget.value })
                }
              />
            )}
          </Field>
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
  if (component.endsWith("-chart"))
    return (
      <Suspense
        fallback={
          <p role="status">{t("جارٍ عرض الأمثلة…", "Loading examples…")}</p>
        }
      >
        <div className="tz-chart-examples">
          <ChartExample
            language={language}
            kind={component.replace("-chart", "") as ChartKind}
            sample="single"
            legend={false}
          />
          <AnalyticsExample language={language} />
        </div>
      </Suspense>
    );
  if (["card", "accordion", "breadcrumbs", "pagination"].includes(component))
    return (
      <p className="example-caption">
        {component === "card"
          ? t(
              "البطاقة سطح للمحتوى. يملك التطبيق إجراءات الرأس والتذييل؛ ليست عنصرًا قابلًا للنقر.",
              "Card groups content. The application supplies header/footer actions; the surface has no interaction.",
            )
          : component === "accordion"
            ? t(
                "Accordion يظهر التفاصيل تحت العناوين. Tabs يبدّل بين عروض مرتبطة. قيم العناصر ثابتة وفريدة؛ لا تضع عناصر تفاعلية داخل التسميات.",
                "Accordion reveals details below headings. Tabs switches related views. Use stable unique values and no interactive content inside labels.",
              )
            : component === "breadcrumbs"
              ? t(
                  "الروابط تصل إلى أقسام فعلية في المثال. يحدد التطبيق الوجهات؛ الصفحة الحالية نص.",
                  "Links reach actual example sections. The caller supplies destinations; the current page is text.",
                )
              : t(
                  "المثال يقسم قائمة محلية صغيرة. Pagination يطلب الصفحة فقط؛ التطبيق يملك الحجم والتصفية والجلب. DataTable يملك حالة الفرز والصفحات الداخلية الخاصة به.",
                  "This example slices a small local list. Pagination requests a page; the caller owns size, filtering and fetching. DataTable retains its internal sorting and page state.",
                )}
      </p>
    );
  if (component === "alert") return <AlertExamples language={language} />;
  if (component === "skeleton") return <SkeletonExamples language={language} />;
  if (component === "progress") return <ProgressExamples language={language} />;
  if (component === "spinner") return <SpinnerExamples language={language} />;
  if (component === "avatar-group")
    return (
      <div className="tz-feedback-examples">
        <TeamExample language={language} photos />
        <p>
          {t(
            "صور محلية وأحرف ثابتة. الأسماء متاحة حتى للأعضاء المخفيين.",
            "Bundled portraits and stable initials. Names remain available for hidden members.",
          )}
        </p>
      </div>
    );
  if (component === "avatar") return <AvatarExamples language={language} />;
  if (component === "empty-state")
    return <EmptyStateExamples language={language} />;
  if (["tooltip", "modal"].includes(component))
    return (
      <p className="example-caption">
        {component === "tooltip"
          ? t(
              "مرّر المؤشر أو ركّز بلوحة المفاتيح لعرض التوضيح. Escape يغلقه؛ الزر يعرض التفاصيل.",
              "Hover or focus to see the explanation. Escape dismisses it; the button toggles details.",
            )
          : t(
              "نافذة واحدة. الاختيار يغيّر المعاينة، والقائمة تستعيد التخطيط الافتراضي. الإغلاق يعيد التركيز.",
              "One dialog. Select changes the preview, the menu resets its layout, and dismissal restores focus.",
            )}
      </p>
    );
  if (component === "badge")
    return (
      <div className="example-inline">
        <Badge>{t("متوقف", "Paused")}</Badge>
        <Badge tone="success">{t("نشط", "Active")}</Badge>
        <Badge tone="error">{t("تعذّر الإرسال", "Delivery failed")}</Badge>
        <Badge tone="info">{t("قيد المراجعة", "Under review")}</Badge>
      </div>
    );
  if (component === "checkbox")
    return (
      <div className="quiet-examples">
        <Checkbox
          label={t("موافقة مطلوبة", "Required consent")}
          error={t("أكد الموافقة للمتابعة.", "Confirm consent to continue.")}
          required
        />
        <Checkbox
          label={t("خيار غير متاح", "Unavailable option")}
          disabled
          defaultChecked
        />
      </div>
    );
  if (component === "radio-group")
    return (
      <RadioGroup
        label={t("طريقة التواصل", "Contact method")}
        name="example-contact"
        helper={t("اختر طريقة واحدة.", "Choose one method.")}
        error={t("حدد اختيارًا للمتابعة.", "Choose an option to continue.")}
        required
        options={[
          { value: "email", label: t("البريد", "Email") },
          { value: "phone", label: t("الهاتف", "Phone") },
          {
            value: "post",
            label: t("البريد العادي · غير متاح", "Post · unavailable"),
            disabled: true,
          },
        ]}
      />
    );
  if (component === "textarea")
    return (
      <div className="quiet-examples">
        <p className="example-caption">
          {t(
            "نموذج صغير · التطبيق يملك التحقق",
            "Small form · application-owned validation",
          )}
        </p>
        <FeedbackForm language={language} />
      </div>
    );
  if (component === "data-table")
    return (
      <p className="example-caption">
        {t(
          "Table للمحتوى الجدولي البسيط. DataTable للفرز وتقسيم الصفحات في الذاكرة؛ التطبيق يملك التصفية والإجراءات. اختر حالة المثال أعلاه لعرض التحميل أو الخطأ أو الفراغ.",
          "Use Table for simple tabular content. DataTable handles in-memory sorting and pagination; the application owns filtering and actions. Choose an example state above to demonstrate loading, error or empty data.",
        )}
      </p>
    );
  if (component === "table")
    return (
      <div className="quiet-examples">
        <div className="example-row">
          <TableExample
            language={language}
            caption={t("عملاء نموذجيون", "Sample customers")}
          />
        </div>
        <div className="example-row">
          <TableExample
            language={language}
            caption={t("قائمة فارغة", "Empty list")}
            empty
          />
        </div>
      </div>
    );
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
  if (component === "input")
    return (
      <div className="quiet-examples">
        <div className="example-row">
          <p>{t("إدخال أساسي", "Basic input")}</p>
          <Input
            aria-label={t("إدخال أساسي", "Basic input")}
            placeholder={t("أدخل الاسم", "Enter a name")}
          />
        </div>
        <div className="example-row">
          <p>{t("تسمية ومساعدة", "Label and helper")}</p>
          <Input
            label={t("اسم العميل", "Customer name")}
            helper={t("كما يظهر في الفاتورة", "As shown on the invoice")}
            placeholder={t("أدخل الاسم", "Enter a name")}
          />
        </div>
        <div className="example-row">
          <p>{t("مطلوب مع خطأ", "Required with error")}</p>
          <Input
            label={t("اسم الحساب", "Account name")}
            required
            error={t("أدخل اسم الحساب.", "Enter an account name.")}
          />
        </div>
        <div className="example-row">
          <p>{t("حالات الإدخال", "Input states")}</p>
          <div className="example-inline">
            <Input
              label={t("معطّل", "Disabled")}
              disabled
              defaultValue={t("غير متاح", "Unavailable")}
            />
            <Input
              label={t("للقراءة فقط", "Read only")}
              readOnly
              defaultValue={t("مدار", "Madar")}
            />
          </div>
        </div>
      </div>
    );
  if (component === "select")
    return (
      <div className="quiet-examples">
        <Field
          label={t("الحالة", "Status")}
          helper={t("اختر حالة واحدة.", "Choose one status.")}
        >
          {(field) => (
            <Select
              field={field}
              value={event}
              onValueChange={setEvent}
              placeholder={t("اختر الحالة", "Choose status")}
              options={[
                { value: "active", label: t("نشط", "Active") },
                { value: "paused", label: t("متوقف", "Paused") },
                {
                  value: "archived",
                  label: t("مؤرشف — غير متاح", "Archived — unavailable"),
                  disabled: true,
                },
              ]}
            />
          )}
        </Field>
        <output className="example-feedback" aria-live="polite">
          {event}
        </output>
      </div>
    );
  if (component === "sheet")
    return (
      <div className="quiet-examples">
        <p className="example-caption">
          {t(
            "إنشاء عميل: تحقق من البيانات ثم احفظها في ذاكرة المثال.",
            "Create a customer: validate, then save in this example’s memory.",
          )}
        </p>
        {component === "sheet" && <EditableSheet language={language} />}
        <ToastProvider
          label={t("تنبيهات العملاء", "Customer notifications")}
          closeLabel={t("إغلاق التنبيه", "Dismiss notification")}
        >
          <CreateCustomer language={language} />
        </ToastProvider>
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
