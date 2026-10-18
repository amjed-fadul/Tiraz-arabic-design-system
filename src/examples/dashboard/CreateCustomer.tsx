import { useId, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button, Field, Input, Select, Sheet, useToast } from "../../system";
import type { Customer, CustomerStatus } from "./data";

const emptyDraft = () => ({
  name: "",
  email: "",
  status: "active" as CustomerStatus,
});
export function CreateCustomer({
  language,
  disabled,
  onCreate,
}: {
  language: "ar" | "en";
  disabled: boolean;
  onCreate: (draft: Omit<Customer, "id">) => void;
}) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState({ name: false, email: false });
  const submitted = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null),
    emailRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  function changeOpen(next: boolean) {
    submitted.current = !next;
    setDraft(emptyDraft());
    setErrors({ name: false, email: false });
    setOpen(next);
  }
  return (
    <Sheet
      open={open}
      onOpenChange={changeOpen}
      trigger={
        <Button disabled={disabled}>
          <Plus size={15} aria-hidden="true" />
          {t("إضافة عميل", "Create customer")}
        </Button>
      }
      title={t("إضافة عميل", "Create customer")}
      description={t(
        "أضف عميلًا إلى دليل المثال. يبقى في الذاكرة حتى تعيد تحميل الصفحة.",
        "Add a customer to the sample directory. Kept in memory only until reload.",
      )}
      closeLabel={t("إغلاق نموذج العميل", "Close customer form")}
      footer={
        <>
          <Button variant="ghost" onClick={() => changeOpen(false)}>
            {t("إلغاء", "Cancel")}
          </Button>
          <Button type="submit" form={formId}>
            {t("حفظ العميل", "Save customer")}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className="dashboard-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (submitted.current) return;
          const invalidName = !draft.name.trim();
          const invalidEmail =
            !!draft.email.trim() && !emailRef.current?.validity.valid;
          setErrors({ name: invalidName, email: invalidEmail });
          if (invalidName || invalidEmail) {
            (invalidName ? nameRef : emailRef).current?.focus();
            return;
          }
          // Synchronous guard also covers repeated submit events before React renders.
          submitted.current = true;
          onCreate({
            ...draft,
            name: draft.name.trim(),
            email: draft.email.trim(),
          });
          changeOpen(false);
          toast({
            title: t("أُضيف العميل", "Customer created"),
            description: draft.name.trim(),
            tone: "success",
          });
        }}
      >
        <Input
          ref={nameRef}
          label={t("اسم العميل", "Customer name")}
          name="customerName"
          autoComplete="organization"
          required
          value={draft.name}
          error={
            errors.name
              ? t("أدخل اسم العميل.", "Enter a customer name.")
              : undefined
          }
          onChange={(event) =>
            setDraft({ ...draft, name: event.currentTarget.value })
          }
        />
        <Input
          ref={emailRef}
          label={t("البريد الإلكتروني", "Email")}
          helper={t("اختياري", "Optional")}
          name="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          value={draft.email}
          error={
            errors.email
              ? t(
                  "أدخل بريدًا إلكترونيًا صحيحًا.",
                  "Enter a valid email address.",
                )
              : undefined
          }
          onChange={(event) =>
            setDraft({ ...draft, email: event.currentTarget.value })
          }
        />
        <Field label={t("الحالة", "Status")}>
          {(field) => (
            <Select
              field={field}
              name="status"
              value={draft.status}
              onValueChange={(status) =>
                setDraft({ ...draft, status: status as CustomerStatus })
              }
              options={[
                { value: "active", label: t("نشط", "Active") },
                { value: "paused", label: t("متوقف", "Paused") },
              ]}
            />
          )}
        </Field>
      </form>
    </Sheet>
  );
}
