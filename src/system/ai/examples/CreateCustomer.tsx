import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Button,
  Field,
  Input,
  Select,
  Sheet,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  useToast,
} from "../../index";
export interface Customer {
  id: number;
  name: string;
  email: string;
  status: string;
}
const emptyDraft = () => ({ name: "", email: "", status: "active" });
/** Application example; not a library export. Mount below SystemProvider/ToastProvider. */
export function CreateCustomer({
  language = "ar",
  initialCustomers = [],
  children,
}: {
  language?: "ar" | "en";
  initialCustomers?: Customer[];
  children?: (customers: Customer[], create: ReactNode) => ReactNode;
}) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const formId = useId();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState({ name: false, email: false });
  const [open, setOpen] = useState(false);
  const submitted = useRef(false),
    nextId = useRef(
      Math.max(0, ...initialCustomers.map((customer) => customer.id)) + 1,
    );
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
  const create = (
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
  );
  if (children) return children(customers, create);
  return (
    <div className="customer-example">
      {create}
      <Table caption={t("العملاء", "Customers")}>
        <TableHeader>
          <TableRow>
            <TableHead>{t("الاسم", "Name")}</TableHead>
            <TableHead>{t("البريد الإلكتروني", "Email")}</TableHead>
            <TableHead>{t("الحالة", "Status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length ? (
            customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableHead scope="row">
                  <bdi>{customer.name}</bdi>
                </TableHead>
                <TableCell>
                  <bdi dir="ltr">{customer.email || "—"}</bdi>
                </TableCell>
                <TableCell>
                  {
                    options.find((option) => option.value === customer.status)
                      ?.label
                  }
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3}>
                {t("لا يوجد عملاء بعد.", "No customers yet.")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
