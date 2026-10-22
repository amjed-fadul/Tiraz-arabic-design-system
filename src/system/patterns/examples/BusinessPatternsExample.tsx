import { useState } from "react";
import {
  CustomerEditSheet,
  InvoiceActions,
  PreferenceSettings,
} from "../index";
import type { ActionContext, CustomerData, InvoiceAction } from "../index";

/** Local, in-memory demonstration. Mount inside a matching SystemProvider. */
export function BusinessPatternsExample({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const ar = language === "ar";
  const [customer, setCustomer] = useState<CustomerData>({
    id: "customer-1",
    name: ar ? "أمل صالح" : "Amal Saleh",
    email: "amal@example.com",
  });
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    email: true,
    digest: false,
  });
  const [invoiceStatus, setInvoiceStatus] = useState<
    "unpaid" | "paid" | "void"
  >("unpaid");
  const actions: InvoiceAction[] = [
    {
      id: "pay",
      label: ar ? "تسجيل الدفع" : "Mark paid",
      disabled: invoiceStatus !== "unpaid",
    },
    {
      id: "void",
      label: ar ? "إلغاء الفاتورة" : "Void invoice",
      disabled: invoiceStatus === "void",
      destructive: true,
      confirmation: {
        title: ar ? "إلغاء الفاتورة INV-42؟" : "Void invoice INV-42?",
        description: ar
          ? "ستُلغى الفاتورة بقيمة ٤٢٠٫٠٠ د.إ. ولا يمكن التراجع عن هذا الإجراء."
          : "The AED 420.00 invoice will be voided. This cannot be undone.",
        confirm: ar ? "تأكيد الإلغاء" : "Void invoice",
        cancel: ar ? "الاحتفاظ بالفاتورة" : "Keep invoice",
        close: ar ? "إغلاق التأكيد" : "Close confirmation",
      },
    },
  ];
  return (
    <div className="tz-pattern-stack">
      <p>
        {ar
          ? "مثال محلي: تُحفظ التغييرات في هذه الصفحة فقط."
          : "Local example: changes stay in this page only."}
      </p>
      <section
        className="tz-pattern-stack"
        aria-label={ar ? "العميل" : "Customer"}
      >
        <p>
          <bdi>{customer.name}</bdi> · <bdi dir="ltr">{customer.email}</bdi>
        </p>
        <CustomerEditSheet
          customer={customer}
          labels={
            ar
              ? {
                  edit: "تعديل العميل",
                  title: "تعديل العميل",
                  description: "حدّث بيانات التواصل مع العميل.",
                  close: "إغلاق",
                  name: "الاسم",
                  email: "البريد الإلكتروني",
                  save: "حفظ",
                  saving: "جارٍ الحفظ",
                  saved: "تم حفظ العميل",
                  cancel: "إلغاء",
                  error: "تعذر حفظ العميل. حاول مرة أخرى.",
                }
              : {
                  edit: "Edit customer",
                  title: "Edit customer",
                  description: "Update the customer's contact details.",
                  close: "Close",
                  name: "Name",
                  email: "Email",
                  save: "Save",
                  saving: "Saving",
                  saved: "Customer saved",
                  cancel: "Cancel",
                  error: "Could not save the customer. Try again.",
                }
          }
          onSave={async (next, context) => {
            await localSave(context);
            setCustomer(next);
          }}
        />
      </section>
      <PreferenceSettings
        value={preferences}
        items={[
          {
            id: "email",
            label: ar ? "إشعارات البريد" : "Email notifications",
            description: ar
              ? "تحديثات عن نشاط الحساب."
              : "Updates about account activity.",
          },
          { id: "digest", label: ar ? "الملخص الأسبوعي" : "Weekly digest" },
        ]}
        labels={
          ar
            ? {
                title: "التفضيلات",
                save: "حفظ التفضيلات",
                saving: "جارٍ حفظ التفضيلات",
                cancel: "إلغاء",
                saved: "تم حفظ التفضيلات",
                error: "تعذر حفظ التفضيلات. حاول مرة أخرى.",
              }
            : {
                title: "Preferences",
                save: "Save preferences",
                saving: "Saving preferences",
                cancel: "Cancel",
                saved: "Preferences saved",
                error: "Could not save preferences. Try again.",
              }
        }
        onSave={async (next, context) => {
          await localSave(context);
          setPreferences(next);
        }}
      />
      <InvoiceActions
        invoice={{
          id: "INV-42",
          fields: [
            {
              id: "number",
              label: ar ? "رقم الفاتورة" : "Invoice number",
              value: "INV-42",
            },
            {
              id: "amount",
              label: ar ? "المبلغ" : "Amount",
              value: ar ? "٤٢٠٫٠٠ د.إ." : "AED 420.00",
            },
            {
              id: "status",
              label: ar ? "الحالة" : "Status",
              value:
                invoiceStatus === "void"
                  ? ar
                    ? "ملغاة"
                    : "Voided"
                  : invoiceStatus === "paid"
                    ? ar
                      ? "مدفوعة"
                      : "Paid"
                    : ar
                      ? "غير مدفوعة"
                      : "Unpaid",
            },
          ],
        }}
        actions={actions}
        actionsInDetails
        labels={
          ar
            ? {
                actions: "الإجراءات",
                details: "عرض تفاصيل الفاتورة",
                title: "تفاصيل الفاتورة",
                description: "راجع الفاتورة واختر الإجراء المناسب.",
                close: "إغلاق",
                working: "جارٍ التنفيذ",
                cancel: "إلغاء العملية",
                success: "اكتملت العملية",
                error: "تعذرت العملية. حاول مرة أخرى.",
              }
            : {
                actions: "Actions",
                details: "View invoice details",
                title: "Invoice details",
                description: "Review the invoice and choose an action.",
                close: "Close",
                working: "Working",
                cancel: "Cancel action",
                success: "Action complete",
                error: "Could not complete the action. Try again.",
              }
        }
        onAction={async (id, _, context) => {
          await localSave(context);
          setInvoiceStatus(id === "void" ? "void" : "paid");
        }}
      />
    </div>
  );
}

// A delay exists only after a click to demonstrate cancellation. Replace this
// function with the caller's persistence, passing signal to fetch or its SDK.
async function localSave({ signal }: ActionContext) {
  signal.throwIfAborted();
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, 600);
    function abort() {
      clearTimeout(timer);
      reject(signal.reason);
    }
    signal.addEventListener("abort", abort, { once: true });
  });
  signal.throwIfAborted();
}
