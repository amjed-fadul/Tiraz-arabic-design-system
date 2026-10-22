import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
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
  DataTable,
  DropdownMenu,
  SystemProvider,
  ToastProvider,
  defaultConfig,
} from "./system";
import type { DataTableColumn } from "./system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
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
      <p>
        {t(
          "البيانات في ذاكرة هذا المثال فقط؛ تُفقد عند إعادة التحميل أو مغادرة المثال.",
          "Data lives in this example's memory only; reloading or leaving the example clears it.",
        )}
      </p>
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

export type CustomerPreset =
  "populated" | "loading" | "empty" | "no-results" | "error";
const sampleCustomers: Customer[] = [
  ["شركة مدار للتقنية", "hello@madar.example"],
  ["Nadia Hassan", "nadia@atlas.example"],
  ["مؤسسة نور للاستشارات", "team@nour.example"],
  ["Omar Khalid", "omar@cedar.example"],
  ["ليلى أحمد", "layla@bayt.example"],
  ["Daniel Chen", "daniel@orbit.example"],
  ["استوديو سارة", "sara@studio.example"],
  ["Maya Patel", "maya@loom.example"],
  ["خالد المنصوري", "khalid@wadi.example"],
  ["Atlas Design", "contact@atlas.example"],
  ["أفق للخدمات", "hello@ofuq.example"],
  ["Yara Nasser", "yara@field.example"],
  ["يوسف علي", "yousef@sahl.example"],
  ["Cedar Consulting", "team@cedar.example"],
  ["ريم الشامسي", "reem@dune.example"],
  ["Adam Wilson", "adam@north.example"],
  ["دار للتصميم", "hello@dar.example"],
  ["Lina Haddad", "lina@linen.example"],
  ["مريم إبراهيم", "mariam@bay.example"],
  ["Oliver Smith", "oliver@oak.example"],
  ["سالم الكعبي", "salem@palm.example"],
  ["Sofia Garcia", "sofia@arch.example"],
  ["شركة روافد", "contact@rawafid.example"],
  ["Noor Studio", "team@noor.example"],
  ["حسن مصطفى", "hassan@bahr.example"],
  ["Emma Brown", "emma@stone.example"],
].map(([name, email], index) => ({
  id: index + 1,
  name,
  email,
  status: index % 3 === 0 ? "paused" : "active",
}));
function CustomerActions({
  customer,
  language,
}: {
  customer: Customer;
  language: "ar" | "en";
}) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const detailsTrigger = useRef<HTMLButtonElement>(null);
  return (
    <>
      <DropdownMenu
        align="end"
        trigger={
          <button
            type="button"
            className="tz-icon-button"
            ref={trigger}
            aria-label={t(
              `إجراءات ${customer.name}`,
              `Actions for ${customer.name}`,
            )}
          >
            <MoreHorizontal size={16} aria-hidden="true" />
          </button>
        }
        items={[
          {
            id: "details",
            label: t("عرض التفاصيل", "View details"),
            onSelect: () => {
              // Let the menu close and restore focus before opening the dialog.
              requestAnimationFrame(() => detailsTrigger.current?.click());
            },
          },
        ]}
      />
      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) requestAnimationFrame(() => trigger.current?.focus());
        }}
        trigger={
          <button type="button" ref={detailsTrigger} hidden tabIndex={-1}>
            {t("عرض التفاصيل", "View details")}
          </button>
        }
        title={t("تفاصيل العميل", "Customer details")}
        description={t(
          "معلومات العميل المحدد.",
          "Information for the selected customer.",
        )}
        closeLabel={t("إغلاق تفاصيل العميل", "Close customer details")}
      >
        <dl className="customer-details">
          <div>
            <dt>{t("الاسم", "Name")}</dt>
            <dd>
              <bdi>{customer.name}</bdi>
            </dd>
          </div>
          <div>
            <dt>{t("البريد الإلكتروني", "Email")}</dt>
            <dd>
              <bdi dir="ltr">{customer.email || "—"}</bdi>
            </dd>
          </div>
          <div>
            <dt>{t("الحالة", "Status")}</dt>
            <dd>
              {customer.status === "active"
                ? t("نشط", "Active")
                : t("متوقف", "Paused")}
            </dd>
          </div>
        </dl>
      </Sheet>
    </>
  );
}
/** Connected application example. No persistence or simulated requests. */
export function CustomerDataTable({
  language = "ar",
  caption,
  preset = "populated",
}: {
  language?: "ar" | "en";
  caption?: string;
  preset?: CustomerPreset;
}) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [query, setQuery] = useState(
    preset === "no-results" ? "unmatched" : "",
  );
  const [status, setStatus] = useState("all");
  const [failed, setFailed] = useState(preset === "error");
  const loading = preset === "loading";
  const columns: DataTableColumn<Customer>[] = [
    {
      id: "name",
      header: t("الاسم", "Name"),
      cell: (customer) => <bdi>{customer.name}</bdi>,
      sortValue: (customer) => customer.name,
      rowHeader: true,
    },
    {
      id: "email",
      header: t("البريد الإلكتروني", "Email"),
      cell: (customer) => <bdi dir="ltr">{customer.email || "—"}</bdi>,
      sortValue: (customer) => customer.email,
    },
    {
      id: "status",
      header: t("الحالة", "Status"),
      cell: (customer) =>
        customer.status === "active"
          ? t("نشط", "Active")
          : t("متوقف", "Paused"),
    },
    {
      id: "actions",
      header: t("الإجراءات", "Actions"),
      cell: (customer) => (
        <CustomerActions customer={customer} language={language} />
      ),
    },
  ];
  return (
    <CreateCustomer
      language={language}
      initialCustomers={preset === "empty" ? [] : sampleCustomers}
    >
      {(customers, create) => {
        const term = query.trim().toLocaleLowerCase(language);
        const filtered = customers.filter(
          (customer) =>
            (status === "all" || customer.status === status) &&
            `${customer.name} ${customer.email}`
              .toLocaleLowerCase(language)
              .includes(term),
        );
        const emptyContent = loading ? (
          <span role="status">
            {t("جارٍ تحميل العملاء…", "Loading customers…")}
          </span>
        ) : failed ? (
          <div role="alert">
            {t("تعذر عرض العملاء.", "Unable to show customers.")}{" "}
            <Button variant="secondary" onClick={() => setFailed(false)}>
              {t("إعادة المحاولة", "Retry")}
            </Button>
          </div>
        ) : customers.length === 0 ? (
          t("لا يوجد عملاء بعد.", "No customers yet.")
        ) : (
          t("لا توجد نتائج مطابقة.", "No matching results.")
        );
        return (
          <div className="customer-data-example">
            <div className="customer-toolbar">
              <Input
                type="search"
                aria-label={t(
                  "البحث عن العملاء بالاسم أو البريد الإلكتروني",
                  "Search customers by name or email",
                )}
                placeholder={t(
                  "ابحث بالاسم أو البريد…",
                  "Search name or email…",
                )}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
              />
              <Select
                aria-label={t("حالة العميل", "Customer status")}
                value={status}
                onValueChange={setStatus}
                options={[
                  { value: "all", label: t("كل الحالات", "All statuses") },
                  { value: "active", label: t("نشط", "Active") },
                  { value: "paused", label: t("متوقف", "Paused") },
                ]}
              />
              {create}
            </div>
            <DataTable
              data={loading || failed ? [] : filtered}
              columns={columns}
              getRowId={(customer) => customer.id}
              caption={caption ?? t("العملاء", "Customers")}
              locale={language}
              resetKey={JSON.stringify([query, status])}
              loading={loading}
              emptyContent={emptyContent}
              labels={{
                previous: t("السابق", "Previous"),
                next: t("التالي", "Next"),
                pagination: t("صفحات العملاء", "Customer pages"),
                sortAscending: (header) =>
                  t(`ترتيب ${header} تصاعديًا`, `Sort ${header} ascending`),
                sortDescending: (header) =>
                  t(`ترتيب ${header} تنازليًا`, `Sort ${header} descending`),
                resultCount: (from, to, total) =>
                  t(
                    `${from}–${to} من ${total} عميل`,
                    `${from}–${to} of ${total} customers`,
                  ),
              }}
            />
            <p className="customer-memory-note">
              {t(
                "البيانات في ذاكرة المثال فقط.",
                "Data lives in this example's memory only.",
              )}
            </p>
          </div>
        );
      }}
    </CreateCustomer>
  );
}

export default function Example() {
  return (
    <div lang={"en"}>
      <SystemProvider
        config={{
          ...defaultConfig,
          ...{
            density: "standard",
            accent: "plum",
            radius: 16,
            reducedMotion: false,
            typography: "large",
            direction: "ltr",
            theme: "light",
          },
        }}
      >
        <ToastProvider
          label={"Customer notifications"}
          closeLabel={"Dismiss notification"}
        >
          <CustomerDataTable
            language={"en"}
            caption={"Customers"}
            preset={"populated"}
          />
        </ToastProvider>
      </SystemProvider>
    </div>
  );
}
