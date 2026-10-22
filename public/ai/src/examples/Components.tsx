import { useState } from "react";
import {
  Button,
  DropdownMenu,
  Sheet,
  SheetClose,
  Switch,
  Tabs,
  ToastProvider,
  useToast,
  SystemProvider,
  defaultConfig,
} from "../system";
import type { SystemConfig } from "../system";
import "../system/styles.css";

function ComponentExamples({ arabic }: { arabic: boolean }) {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [result, setResult] = useState("");
  const t = (ar: string, en: string) => (arabic ? ar : en);
  return (
    <main
      style={{
        padding: "var(--space-6)",
        display: "grid",
        gap: "var(--space-4)",
      }}
    >
      <h1>{t("أمثلة طِراز", "Tiraz examples")}</h1>
      <Button onClick={() => setResult(t("اكتمل الإجراء", "Action complete"))}>
        {t("تنفيذ إجراء", "Run action")}
      </Button>
      <Button iconOnly aria-label={t("إعدادات", "Settings")}>
        <span aria-hidden="true">⚙</span>
      </Button>
      <Switch
        label={t("تفعيل الإشعارات", "Enable notifications")}
        checked={enabled}
        onCheckedChange={setEnabled}
      />
      <Tabs
        label={t("تفاصيل العميل", "Customer details")}
        items={[
          {
            value: "overview",
            label: t("نظرة عامة", "Overview"),
            content: (
              <p>
                {t("العميل", "Customer")}: <bdi dir="ltr">CUS-0082</bdi>
              </p>
            ),
          },
          {
            value: "invoices",
            label: t("الفواتير", "Invoices"),
            content: (
              <p>
                <bdi dir="ltr">INV-0042</bdi>
              </p>
            ),
          },
        ]}
      />
      <DropdownMenu
        trigger={<Button>{t("الإجراءات", "Actions")}</Button>}
        items={[
          {
            id: "download",
            label: t("تنزيل", "Download"),
            onSelect: () => setResult(t("طلب التنزيل", "Download requested")),
          },
          {
            id: "unavailable",
            label: t("غير متاح", "Unavailable"),
            disabled: true,
          },
        ]}
      />
      <Sheet
        trigger={<Button>{t("عرض التفاصيل", "Show details")}</Button>}
        title={t("تفاصيل الفاتورة", "Invoice details")}
        description={t(
          "ملخص الفاتورة المحددة",
          "Summary of the selected invoice",
        )}
        closeLabel={t("إغلاق", "Close")}
        footer={
          <SheetClose asChild>
            <Button>{t("تم", "Done")}</Button>
          </SheetClose>
        }
      >
        <p>
          <bdi dir="ltr">INV-0042</bdi>
        </p>
        <DropdownMenu
          trigger={<Button>{t("إجراءات الفاتورة", "Invoice actions")}</Button>}
          items={[
            {
              id: "copy",
              label: t("نسخ المعرّف", "Copy identifier"),
              onSelect: () => setResult("INV-0042"),
            },
          ]}
        />
      </Sheet>
      <Button
        onClick={() =>
          toast({
            title: t("تم الحفظ", "Saved"),
            description: t("حُفظت التغييرات", "Changes saved"),
            tone: "success",
          })
        }
      >
        {t("إظهار إشعار", "Show notification")}
      </Button>
      <output aria-live="polite">{result}</output>
    </main>
  );
}
export function Components({
  config = defaultConfig,
}: {
  config?: SystemConfig;
}) {
  const arabic = config.direction === "rtl";
  return (
    <SystemProvider config={config}>
      <ToastProvider
        label={arabic ? "الإشعارات" : "Notifications"}
        closeLabel={arabic ? "إغلاق الإشعار" : "Dismiss notification"}
      >
        <ComponentExamples arabic={arabic} />
      </ToastProvider>
    </SystemProvider>
  );
}
