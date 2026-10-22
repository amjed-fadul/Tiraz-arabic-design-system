import { useId, useState } from "react";
import { SystemProvider, defaultConfig } from "../system";
import type { SystemConfig } from "../system";
import {
  CustomerEditSheet,
  PreferenceSettings,
  InvoiceActions,
  Stack,
} from "../patterns";
import "../system/styles.css";
import "../patterns/patterns.css";

export function Patterns({
  config = defaultConfig,
  language = "ar",
}: {
  config?: SystemConfig;
  language?: "ar" | "en";
}) {
  const sectionId = useId();
  const text = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [customer, setCustomer] = useState({
    id: "CUS-0082",
    name: "Noor",
    email: "noor@example.com",
  });
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    billingEmails: true,
    paymentReminders: false,
  });
  const [invoice, setInvoice] = useState({
    id: "INV-0042",
    amount: 4250.75,
    issuedAt: "2026-10-22T00:00:00Z",
    paid: false,
  });
  // This example deliberately chooses a regional locale from language.
  // Applications should use their user's explicit locale and currency settings.
  const locale = language === "ar" ? "ar-AE" : "en-AE";
  const amount = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "AED",
  }).format(invoice.amount);
  const issuedAt = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(invoice.issuedAt));
  const invoiceStatus = invoice.paid
    ? text("مدفوعة", "Paid")
    : text("غير مدفوعة", "Unpaid");

  return (
    <SystemProvider config={config}>
      <main
        lang={language}
        style={{
          maxInlineSize: "48rem",
          marginInline: "auto",
          padding: "var(--space-6)",
        }}
      >
        <Stack style={{ gap: "var(--space-8)" }}>
          <header>
            <h1>{text("أنماط العمل", "Business patterns")}</h1>
            <p>
              {text(
                "عرض محلي: تُحفظ التغييرات في هذه الصفحة فقط وتُمسح عند إعادة تحميلها. لا تُرسل أي بيانات إلى خادم.",
                "Local demonstration: changes are saved only on this page and reset when it reloads. No data is sent to a server.",
              )}
            </p>
          </header>

          <section aria-labelledby={`${sectionId}-customer`}>
            <Stack>
              <h2 id={`${sectionId}-customer`} className="tz-pattern-heading">
                {text("العميل", "Customer")}
              </h2>
              <p>
                <bdi>{customer.name}</bdi> · <bdi dir="ltr">{customer.id}</bdi>
                <br />
                <bdi dir="ltr">{customer.email}</bdi>
              </p>
              <CustomerEditSheet
                customer={customer}
                labels={{
                  edit: text("تعديل العميل", "Edit customer"),
                  title: text("تعديل بيانات العميل", "Edit customer details"),
                  description: text(
                    "حدّث الاسم والبريد الإلكتروني لهذا العميل.",
                    "Update this customer's name and email address.",
                  ),
                  close: text("إغلاق تعديل العميل", "Close customer editor"),
                  name: text("اسم العميل", "Customer name"),
                  email: text("بريد العميل", "Customer email"),
                  save: text("حفظ العميل", "Save customer"),
                  saving: text("جارٍ حفظ العميل", "Saving customer"),
                  cancel: text("إلغاء تعديل العميل", "Cancel customer edit"),
                  error: text("تعذّر حفظ العميل.", "Unable to save customer."),
                }}
                onSave={async (next, { signal }) => {
                  signal.throwIfAborted();
                  setCustomer(next);
                }}
              />
            </Stack>
          </section>

          <section aria-label={text("إعدادات الحساب", "Account settings")}>
            <Stack>
              <PreferenceSettings
                value={preferences}
                items={[
                  {
                    id: "billingEmails",
                    label: text("رسائل الفوترة", "Billing emails"),
                    description: text(
                      "استلام تحديثات الفواتير عبر البريد الإلكتروني.",
                      "Receive invoice updates by email.",
                    ),
                  },
                  {
                    id: "paymentReminders",
                    label: text("تذكيرات الدفع", "Payment reminders"),
                    description: text(
                      "التذكير بالفواتير المستحقة.",
                      "Receive reminders for outstanding invoices.",
                    ),
                  },
                ]}
                labels={{
                  title: text("التفضيلات", "Preferences"),
                  save: text("حفظ التفضيلات", "Save preferences"),
                  saving: text("جارٍ حفظ التفضيلات", "Saving preferences"),
                  cancel: text(
                    "إلغاء تغييرات التفضيلات",
                    "Cancel preference changes",
                  ),
                  saved: text("تم حفظ التفضيلات.", "Preferences saved."),
                  error: text(
                    "تعذّر حفظ التفضيلات.",
                    "Unable to save preferences.",
                  ),
                }}
                onSave={async (next, { signal }) => {
                  signal.throwIfAborted();
                  setPreferences(next);
                }}
              />
              <p>
                {text(
                  "إعداد رسائل الفوترة المحفوظ: ",
                  "Saved billing email preference: ",
                )}
                {preferences.billingEmails
                  ? text("مفعّل", "Enabled")
                  : text("معطّل", "Disabled")}
              </p>
            </Stack>
          </section>

          <section aria-labelledby={`${sectionId}-invoice`}>
            <Stack>
              <h2 id={`${sectionId}-invoice`} className="tz-pattern-heading">
                {text("الفاتورة", "Invoice")} <bdi dir="ltr">{invoice.id}</bdi>
              </h2>
              <p>
                <bdi>{amount}</bdi> · {invoiceStatus}
              </p>
              <InvoiceActions
                invoice={{
                  id: invoice.id,
                  fields: [
                    {
                      id: "number",
                      label: text("رقم الفاتورة", "Invoice number"),
                      value: invoice.id,
                    },
                    {
                      id: "customer",
                      label: text("العميل", "Customer"),
                      value: customer.name,
                    },
                    {
                      id: "amount",
                      label: text("الإجمالي", "Total"),
                      value: amount,
                    },
                    {
                      id: "date",
                      label: text("تاريخ الإصدار", "Issued on"),
                      value: issuedAt,
                    },
                    {
                      id: "status",
                      label: text("الحالة", "Status"),
                      value: invoiceStatus,
                    },
                  ],
                }}
                actions={[
                  {
                    id: "mark-paid",
                    label: text("تعيين كمدفوعة", "Mark as paid"),
                    disabled: invoice.paid,
                  },
                  {
                    id: "mark-unpaid",
                    label: text("تعيين كغير مدفوعة", "Mark as unpaid"),
                    disabled: !invoice.paid,
                  },
                ]}
                labels={{
                  actions: text("إجراءات الفاتورة", "Invoice actions"),
                  details: text("عرض الفاتورة", "View invoice"),
                  title: text("تفاصيل الفاتورة", "Invoice details"),
                  description: text(
                    "بيانات الفاتورة وحالة الدفع.",
                    "Invoice information and payment status.",
                  ),
                  close: text("إغلاق الفاتورة", "Close invoice"),
                  working: text("جارٍ تحديث الفاتورة", "Updating invoice"),
                  cancel: text("إلغاء إجراء الفاتورة", "Cancel invoice action"),
                  success: text("تم تحديث الفاتورة.", "Invoice updated."),
                  error: text(
                    "تعذّر تحديث الفاتورة.",
                    "Unable to update invoice.",
                  ),
                }}
                onAction={async (actionId, current, { signal }) => {
                  signal.throwIfAborted();
                  setInvoice((saved) =>
                    current.id === saved.id
                      ? { ...saved, paid: actionId === "mark-paid" }
                      : saved,
                  );
                }}
              />
            </Stack>
          </section>
        </Stack>
      </main>
    </SystemProvider>
  );
}
