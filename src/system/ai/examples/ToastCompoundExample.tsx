import { useState } from "react";
import { Button, Toast, ToastProvider } from "../../index";
/** Controlled toast: the application opens it and accepts every close request. */
export function CompoundToastExample({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [open, setOpen] = useState(false);
  return (
    <ToastProvider
      label={t("التنبيهات", "Notifications")}
      closeLabel={t("إغلاق التنبيه", "Dismiss notification")}
    >
      <Button onClick={() => setOpen(true)}>
        {t("حفظ التغييرات", "Save changes")}
      </Button>
      <Toast
        open={open}
        onOpenChange={setOpen}
        tone="success"
        title={t("تم حفظ التغييرات", "Changes saved")}
        description={t("حُدّث ملف العميل.", "The customer file is updated.")}
      />
    </ToastProvider>
  );
}
