import { TerminalStates } from "../system/ai/examples/TerminalExamples";
import { ChatAppExample } from "../system/ai/examples/ChatAppExample";
import { AIDecisionsExample } from "../system/ai/examples/AIDecisionsExamples";
import {
  AIContextExample,
  ContextMeterStates,
} from "../system/ai/examples/AIContextExamples";
import {
  ImageResultStates,
  SourcesStates,
  InsightCardsExample,
} from "../system/ai/examples/AIResultsExamples";
import {
  ChatConversation,
  ChatEntryStates,
} from "../system/ai/examples/ChatExamples";
import {
  CodeBlockExample,
  MarkdownExample,
  StreamingDemo,
} from "../system/ai/examples/AIContentExamples";
import {
  ToolRenderedOutputExample,
  ToolActivityDemo,
} from "../system/ai/examples/ToolActivityExamples";
import {
  LoadingStateExample,
  ThinkingIndicatorExample,
  ThinkingStateExample,
  AIFeedbackDemo,
} from "../system/ai/examples/AIFeedbackExamples";
import { FileTreeExample } from "../system/ai/examples/FileTreeExamples";
import {
  TaskRowsExample,
  TaskRowsStatesExample,
} from "../system/ai/examples/TaskRowsExamples";
import { NotificationListExample } from "../system/ai/examples/NotificationListExamples";
import {
  StepsExample,
  StepsFormExample,
  ActivatableStepsExample,
} from "../system/ai/examples/StepsExamples";
import { TimelineExample } from "../system/ai/examples/TimelineExamples";
import { SliderExample } from "../system/ai/examples/SliderExamples";
import { OTPInputExample } from "../system/ai/examples/OTPInputExamples";
import { DatePickerExample } from "../system/ai/examples/DatePickerExamples";
import { FileDropzoneExample } from "../system/ai/examples/FileDropzoneExamples";
import { ColorPickerExample } from "../system/ai/examples/ColorPickerExamples";
import { TagInputExample } from "../system/ai/examples/TagInputExamples";
import { FilterBarExample } from "../system/ai/examples/FilterBarExamples";
import {
  InputCopyExample,
  EntryCompositionExample,
} from "../system/ai/examples/InputCopyExamples";
import { SidebarExamples } from "../system/ai/examples/SidebarExamples";
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
import { hasExamples } from "./demo-capabilities";
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
function toastMessages(language: Language) {
  const t = words(language);
  return {
    success: {
      title: t("حُفظت الفاتورة", "Invoice saved"),
      description: t(
        "أُرسلت INV-2048 إلى شركة مدار.",
        "INV-2048 was sent to Madar.",
      ),
    },
    error: {
      title: t("تعذّر الإرسال", "Couldn’t send"),
      description: t(
        "تحقّق من الاتصال ثم حاول مرة أخرى.",
        "Check your connection and try again.",
      ),
    },
    info: {
      title: t("يتوفّر تحديث", "Update available"),
      description: t(
        "أُضيفت ثلاث فواتير جديدة إلى القائمة.",
        "Three new invoices were added to the list.",
      ),
    },
  };
}
function ToastExamples({ language }: { language: Language }) {
  const { toast } = useToast();
  return (
    <div className="example-inline">
      {(["success", "error", "info"] as const).map((tone) => (
        <Button
          key={tone}
          variant="secondary"
          onClick={() => toast({ ...toastMessages(language)[tone], tone })}
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
    email: "hello@madar.sa",
  });
  const [draft, setDraft] = useState(saved);
  const [open, setOpen] = useState(false);
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
          "حدّث بيانات التواصل لهذا العميل.",
          "Update this customer’s contact details.",
        )}
        closeLabel={t("إغلاق", "Close")}
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
            <bdi dir="ltr">CUS-0082</bdi> · <bdi dir="ltr">madar.sa</bdi>
          </p>
        </form>
      </Sheet>
    </>
  );
}
export function Examples({
  component,
  language,
  prompt,
  copyLabel,
}: {
  component: ComponentId;
  language: Language;
  prompt?: string;
  copyLabel?: string;
}) {
  const t = words(language);
  const [status, setStatus] = useState("");
  const [checked, setChecked] = useState(false);
  if (component === "loading-state")
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-8)" }}>
        {(["drive", "dots", "orbit"] as const).map((variant) => (
          <section key={variant}>
            <h3>
              {variant === "drive"
                ? "Drive"
                : variant === "dots"
                  ? "Dots"
                  : "Orbit"}
            </h3>
            <LoadingStateExample language={language} variant={variant} />
          </section>
        ))}
      </div>
    );
  if (component === "thinking-indicator")
    return (
      <div style={{ display: "grid", gap: "var(--space-8)" }}>
        <section>
          <h3>{t("كلمات متتابعة", "Rotating words")}</h3>
          <ThinkingIndicatorExample language={language} />
        </section>
        <section>
          <h3>{t("داخل المحادثة", "Inline in a conversation")}</h3>
          <p
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "var(--space-2)",
            }}
          >
            <span>{t("المساعد", "Assistant")}</span>
            <ThinkingIndicatorExample language={language} textOnly />
          </p>
        </section>
      </div>
    );
  if (
    ["ask-user-questions", "approval-card", "approval-flow"].includes(component)
  )
    return <AIDecisionsExample language={language} />;
  if (component === "selection-actions" || component === "model-selector")
    return <AIContextExample language={language} />;
  if (component === "context-meter")
    return <ContextMeterStates language={language} />;
  if (component === "image-result")
    return <ImageResultStates language={language} />;
  if (component === "sources") return <SourcesStates language={language} />;
  if (component === "insight-cards")
    return <InsightCardsExample language={language} />;
  if (component === "terminal") return <TerminalStates language={language} />;
  if (component === "chat-app")
    return <ChatAppExample language={language} longContent />;
  if (component === "chat-thread")
    return <ChatConversation language={language} />;
  if (component === "chat-composer" || component === "prompt-bar")
    return (
      <ChatEntryStates
        language={language}
        compact={component === "prompt-bar"}
      />
    );
  if (component === "code-block")
    return (
      <div style={{ display: "grid", gap: "var(--space-5)", minInlineSize: 0 }}>
        <CodeBlockExample language={language} codeLanguage="python" />
        <CodeBlockExample language={language} codeLanguage="unsupported" />
      </div>
    );
  if (component === "markdown")
    return <MarkdownExample language={language} longContent />;
  if (component === "streaming-text")
    return (
      <StreamingDemo
        language={language}
        markdown
        autoStart
        prompt={prompt}
        copyLabel={copyLabel}
      />
    );
  if (component === "tool-call" || component === "tool-chips")
    return (
      <div style={{ display: "grid", gap: "var(--space-8)", minInlineSize: 0 }}>
        <section>
          <h3>{t("مخرجات مخصّصة", "Custom output")}</h3>
          <ToolRenderedOutputExample language={language} />
        </section>
        <section>
          <h3>{t("ملخص متصل بالتفاصيل", "Summary linked to details")}</h3>
          <ToolActivityDemo language={language} />
        </section>
      </div>
    );
  if (component === "thinking-state")
    return (
      <div style={{ display: "grid", gap: "var(--space-8)" }}>
        <section>
          <h3>{t("ملخص جاهز", "Ready summary")}</h3>
          <ThinkingStateExample
            language={language}
            active={false}
            defaultExpanded
          />
        </section>
        <section>
          <h3>{t("أثناء العمل", "While working")}</h3>
          <AIFeedbackDemo language={language} />
        </section>
      </div>
    );
  if (component === "file-tree")
    return (
      <div style={{ display: "grid", gap: "var(--space-8)" }}>
        <section>
          <h3>
            {t("مشروع متداخل ومعاينة نصية", "Nested project and text preview")}
          </h3>
          <FileTreeExample language={language} mode="controlled" />
        </section>
        <section>
          <h3>{t("حالة فارغة", "Empty state")}</h3>
          <FileTreeExample language={language} empty />
        </section>
      </div>
    );
  if (component === "task-rows")
    return (
      <div style={{ display: "grid", gap: "var(--space-8)" }}>
        <section>
          <h3>{t("الحالات الأربع — كبسولات", "Four states — capsules")}</h3>
          <TaskRowsStatesExample language={language} appearance="capsules" />
        </section>
        <section>
          <h3>
            {t("الحالات الأربع — قائمة متصلة", "Four states — connected list")}
          </h3>
          <TaskRowsStatesExample language={language} appearance="list" />
        </section>
        <section>
          <h3>{t("حالة فارغة", "Empty state")}</h3>
          <TaskRowsExample language={language} empty />
        </section>
      </div>
    );
  if (component === "notification-list")
    return (
      <div style={{ display: "grid", gap: "var(--space-8)" }}>
        <section>
          <h3>
            {t(
              "محتوى طويل دون تعليم كمقروءة",
              "Long content without read controls",
            )}
          </h3>
          <NotificationListExample
            language={language}
            longContent
            readControls={false}
            avatars={false}
          />
        </section>
        <section>
          <h3>{t("لا توجد إشعارات", "No notifications")}</h3>
          <NotificationListExample language={language} empty />
        </section>
      </div>
    );
  if (component === "steps")
    return (
      <div
        style={{
          display: "grid",
          gap: "var(--space-8)",
          inlineSize: "100%",
          minInlineSize: 0,
        }}
      >
        <StepsFormExample language={language} />
        <section>
          <h3>
            {t("عمودي مع خطأ ونص طويل", "Vertical with error and long labels")}
          </h3>
          <StepsExample
            language={language}
            orientation="vertical"
            currentState="error"
            longLabels
          />
        </section>
        <section>
          <h3>{t("خطوات يمكن التنقّل بينها", "Navigable steps")}</h3>
          <ActivatableStepsExample language={language} />
        </section>
      </div>
    );
  if (component === "timeline")
    return <TimelineExample language={language} empty />;
  if (component === "slider")
    return <SliderExample language={language} mode="uncontrolled" />;
  if (component === "otp-input")
    return <OTPInputExample language={language} mode="uncontrolled" />;
  if (component === "date-picker")
    return <DatePickerExample language={language} mode="uncontrolled" />;
  if (component === "file-dropzone")
    return (
      <FileDropzoneExample
        language={language}
        mode="uncontrolled"
        multiple={false}
        helper={t("ملف واحد فقط.", "One file only.")}
      />
    );
  if (component === "color-picker")
    return <ColorPickerExample language={language} mode="uncontrolled" />;
  if (component === "tag-input")
    return (
      <TagInputExample language={language} mode="uncontrolled" maxTags={3} />
    );
  if (component === "filter-bar")
    return <FilterBarExample language={language} initialKind="guide" />;
  if (component === "input-copy")
    return (
      <div
        style={{
          display: "grid",
          gap: 16,
          inlineSize: "100%",
          minInlineSize: 0,
        }}
      >
        <InputCopyExample
          language={language}
          value="https://madar.sa/invite/7KQ2-RX9"
        />
        <EntryCompositionExample language={language} />
      </div>
    );
  if (component === "sidebar") return <SidebarExamples language={language} />;
  if (component.endsWith("-chart"))
    return (
      <Suspense
        fallback={
          <p role="status">{t("جارٍ تحميل الأمثلة…", "Loading examples…")}</p>
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
  // These pages show the live component in the playground; no second stage.
  if (!hasExamples(component)) return null;
  if (component === "alert") return <AlertExamples language={language} />;
  if (component === "skeleton") return <SkeletonExamples language={language} />;
  if (component === "progress") return <ProgressExamples language={language} />;
  if (component === "spinner") return <SpinnerExamples language={language} />;
  if (component === "avatar-group")
    return <TeamExample language={language} photos />;
  if (component === "avatar") return <AvatarExamples language={language} />;
  if (component === "empty-state")
    return <EmptyStateExamples language={language} />;
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
          error={t("أكّد موافقتك للمتابعة.", "Confirm consent to continue.")}
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
        error={t("اختر طريقة للمتابعة.", "Choose an option to continue.")}
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
  if (component === "textarea") return <FeedbackForm language={language} />;
  if (component === "table")
    return (
      <div className="quiet-examples">
        <div className="example-row">
          <TableExample
            language={language}
            caption={t("العملاء", "Customers")}
          />
        </div>
        <div className="example-row">
          <TableExample
            language={language}
            caption={t("لا يوجد عملاء بعد", "No customers yet")}
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
                <Button key={variant} variant={variant}>
                  {localize(optionNames[variant], language)}
                </Button>
              ),
            )}
            <Button
              variant="secondary"
              iconOnly
              aria-label={t("الإعدادات", "Settings")}
            >
              <Settings2 size={15} />
            </Button>
          </div>
        </div>
        <div className="example-row">
          <p>{t("الحالات والأحجام", "States and sizes")}</p>
          <div className="example-inline">
            <Button disabled>{t("معطّل", "Disabled")}</Button>
            <Button state="loading">{t("جارٍ الحفظ…", "Saving")}</Button>
            <Button state="success">{t("تم الحفظ", "Saved")}</Button>
            <Button state="error">{t("تعذّر الحفظ", "Save failed")}</Button>
            <Button size="md" variant="secondary">
              {t("حجم عادي", "Regular size")}
            </Button>
          </div>
        </div>
      </div>
    );
  if (component === "tabs")
    return (
      <div className="quiet-examples">
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
              onSelect: () => {
                void navigator.clipboard.writeText("INV-2048").catch(() => {});
              },
            },
            {
              id: "archive",
              label: t("الأرشفة غير متاحة", "Archive unavailable"),
              disabled: true,
            },
            {
              id: "delete",
              label: t("حذف الفاتورة", "Delete invoice"),
              destructive: true,
              separatorBefore: true,
            },
          ]}
        />
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
              value={status}
              onValueChange={setStatus}
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
      </div>
    );
  if (component === "sheet")
    return (
      <div className="quiet-examples">
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
      label={t("التنبيهات", "Notifications")}
      closeLabel={t("إغلاق التنبيه", "Dismiss notification")}
    >
      <ToastExamples language={language} />
    </ToastProvider>
  );
}
