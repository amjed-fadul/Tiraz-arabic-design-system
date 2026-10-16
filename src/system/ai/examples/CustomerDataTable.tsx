import { useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  Badge,
  Button,
  DataTable,
  DropdownMenu,
  Input,
  Select,
  Sheet,
} from "../../index";
import { CreateCustomer } from "./CreateCustomer";
import type { Customer } from "./CreateCustomer";
import type { DataTableColumn } from "../../index";
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
      cell: (customer) => (
        <Badge tone={customer.status === "active" ? "success" : "neutral"}>
          {customer.status === "active"
            ? t("نشط", "Active")
            : t("متوقف", "Paused")}
        </Badge>
      ),
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
                  loading
                    ? t("جارٍ تحميل العملاء…", "Loading customers…")
                    : failed
                      ? t("عدد العملاء غير متاح", "Customer count unavailable")
                      : t(
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
