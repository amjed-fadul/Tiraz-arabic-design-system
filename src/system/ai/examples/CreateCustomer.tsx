import { useId, useRef, useState } from "react";
import { Button, Field, Input, Select, Sheet, useToast } from "../../index";
interface Customer {
  id: number;
  name: string;
  email: string;
  status: string;
}
const emptyDraft = () => ({ name: "", email: "", status: "active" });
/** Application example; not a library export. Mount below SystemProvider/ToastProvider. */
export function CreateCustomer({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const formId = useId();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState({ name: false, email: false });
  const [open, setOpen] = useState(false);
  const submitted = useRef(false),
    nextId = useRef(1);
  const nameRef = useRef<HTMLInputElement>(null),
    emailRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  function changeOpen(next: boolean) {
    if (next) submitted.current = false;
    else submitted.current = true;
    setDraft(emptyDraft());
    setErrors({ name: false, email: false });
    setOpen(next);
  }
  const options = [
    { value: "active", label: t("نشط", "Active") },
    { value: "paused", label: t("متوقف", "Paused") },
    {
      value: "archived",
      label: t("مؤرشف — غير متاح", "Archived — unavailable"),
      disabled: true,
    },
  ];
  return (
    <div className="customer-example">
      <p>
        {t(
          "البيانات في ذاكرة هذا المثال فقط؛ تُفقد عند إعادة التحميل أو مغادرة المثال.",
          "Data lives in this example's memory only; reloading or leaving the example clears it.",
        )}
      </p>
      <Sheet
        open={open}
        onOpenChange={changeOpen}
        trigger={<Button>{t("إنشاء عميل", "Create customer")}</Button>}
        title={t("إنشاء عميل", "Create customer")}
        description={t(
          "أضف الاسم والبريد والحالة.",
          "Add a name, email and status.",
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
          className="customer-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (submitted.current) return;
            const invalidName = !draft.name.trim();
            const invalidEmail =
              !!draft.email && !emailRef.current?.validity.valid;
            setErrors({ name: invalidName, email: invalidEmail });
            if (invalidName || invalidEmail) {
              (invalidName ? nameRef : emailRef).current?.focus();
              return;
            }
            submitted.current = true;
            const customer = {
              ...draft,
              name: draft.name.trim(),
              email: draft.email.trim(),
              id: nextId.current++,
            };
            setCustomers((previous) => [...previous, customer]);
            changeOpen(false);
            toast({
              title: t("تم إنشاء العميل", "Customer created"),
              description: customer.name,
              tone: "success",
            });
          }}
        >
          <Input
            label={t("اسم العميل", "Customer name")}
            required
            error={
              errors.name
                ? t("أدخل اسم العميل.", "Enter a customer name.")
                : undefined
            }
            ref={nameRef}
            name="customerName"
            autoComplete="organization"
            value={draft.name}
            onChange={(event) =>
              setDraft({ ...draft, name: event.currentTarget.value })
            }
          />
          <Input
            label={t("البريد الإلكتروني", "Email")}
            helper={t("اختياري", "Optional")}
            error={
              errors.email
                ? t(
                    "أدخل بريدًا إلكترونيًا صحيحًا.",
                    "Enter a valid email address.",
                  )
                : undefined
            }
            ref={emailRef}
            type="email"
            name="email"
            autoComplete="email"
            dir="ltr"
            value={draft.email}
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
                onValueChange={(status) => setDraft({ ...draft, status })}
                options={options}
              />
            )}
          </Field>
        </form>
      </Sheet>
      {customers.length ? (
        <ul aria-label={t("العملاء", "Customers")} className="customer-list">
          {customers.map((customer) => (
            <li key={customer.id}>
              <strong>
                <bdi>{customer.name}</bdi>
              </strong>{" "}
              <span>
                {
                  options.find((option) => option.value === customer.status)
                    ?.label
                }
              </span>
              {customer.email && (
                <div>
                  <bdi dir="ltr">{customer.email}</bdi>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>{t("لا يوجد عملاء بعد.", "No customers yet.")}</p>
      )}
    </div>
  );
}
