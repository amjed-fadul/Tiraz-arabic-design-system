import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  Settings2,
  Receipt,
  Check,
  Download,
} from "lucide-react";
import { Button, useToast } from "./design library/src/system";
import {
  CustomerEditSheet,
  PreferenceSettings,
  InvoiceActions,
} from "./design library/src/patterns";
import { api, initialCustomer, initialPreferences } from "./api";
import type { Customer } from "./api";
import "./pilot.css";

const copy = {
  en: {
    brand: "Al Noor",
    workspace: "Business workspace",
    navigation: "Workspace navigation",
    customers: "Customers",
    preferences: "Preferences",
    invoices: "Invoices",
    customerIntro: "Keep your customer records accurate and ready for billing.",
    customerRecord: "Customer record",
    customerId: "Customer ID",
    email: "Billing email",
    name: "Company name",
    active: "Active customer",
    edit: "Edit customer",
    editTitle: "Edit customer details",
    editDescription: "Changes are applied to this customer after you save.",
    close: "Close",
    save: "Save changes",
    saving: "Saving…",
    cancel: "Cancel",
    error:
      "Unable to save changes. Your edits are still here. Please try again.",
    customerSaved: "Customer details saved.",
    preferencesIntro:
      "Choose how your account receives billing and product communications.",
    communication: "Communication preferences",
    billing: "Billing emails",
    billingDescription:
      "Receive invoices and payment receipts at your billing email.",
    reminders: "Payment reminders",
    remindersDescription:
      "Receive a reminder before an invoice is due and follow-up messages while a balance remains outstanding, so your finance team has enough time to review the invoice and arrange payment without missing important account updates.",
    product: "Product updates",
    productDescription: "Receive news about new features and improvements.",
    preferencesSaved: "Your preferences have been saved.",
    savedSummary: "Saved preferences",
    savedDescription: "These settings reflect your last successful save.",
    enabled: "Enabled",
    disabled: "Disabled",
    invoiceIntro: "Review invoice details and record completed payments.",
    total: "Invoice total",
    issueDate: "Issue date",
    status: "Status",
    unpaid: "Awaiting payment",
    paid: "Paid",
    details: "View details",
    detailsTitle: "Invoice details",
    detailsDescription: "Review the billing record and manage this invoice.",
    invoiceId: "Invoice number",
    invoiceActions: "Invoice actions",
    markPaid: "Mark as paid",
    export: "Export",
    exportNote: "Export is not available in this workspace yet.",
    working: "Recording payment…",
    invoiceSuccess: "Invoice marked as paid.",
    invoiceError: "Payment could not be recorded. Please try again.",
    retry: "Retry payment",
    cancelRequest: "Cancel request",
    account: "Account",
    overview: "Overview",
    connected: "Customer and billing records",
    currencyNote: "United Arab Emirates dirham",
  },
  ar: {
    brand: "النور",
    workspace: "مساحة الأعمال",
    navigation: "التنقل في مساحة العمل",
    customers: "العملاء",
    preferences: "التفضيلات",
    invoices: "الفواتير",
    customerIntro: "حافظ على دقة بيانات عملائك وجهوزيتها للفوترة.",
    customerRecord: "سجل العميل",
    customerId: "معرّف العميل",
    email: "البريد الإلكتروني للفوترة",
    name: "اسم الشركة",
    active: "عميل نشط",
    edit: "تعديل العميل",
    editTitle: "تعديل بيانات العميل",
    editDescription: "تُطبّق التغييرات على بيانات هذا العميل بعد حفظها.",
    close: "إغلاق",
    save: "حفظ التغييرات",
    saving: "جارٍ الحفظ…",
    cancel: "إلغاء",
    error:
      "تعذّر حفظ التغييرات. ما زالت تعديلاتك محفوظة هنا. يُرجى المحاولة مجددًا.",
    customerSaved: "تم حفظ بيانات العميل.",
    preferencesIntro: "اختر طريقة تلقي حسابك لرسائل الفوترة ومستجدات المنتج.",
    communication: "تفضيلات التواصل",
    billing: "رسائل الفوترة",
    billingDescription:
      "تلقَّ الفواتير وإيصالات الدفع عبر بريدك الإلكتروني للفوترة.",
    reminders: "تذكيرات الدفع",
    remindersDescription:
      "تلقَّ تذكيرًا قبل موعد استحقاق الفاتورة ورسائل متابعة ما دام هناك رصيد مستحق، ليتمكن فريقك المالي من مراجعة الفاتورة وترتيب الدفع في الوقت المناسب، دون تفويت أي تحديثات مهمة تخص حسابك أو التزامات شركتك المالية.",
    product: "تحديثات المنتج",
    productDescription: "تلقَّ أخبار المزايا الجديدة والتحسينات.",
    preferencesSaved: "تم حفظ تفضيلاتك.",
    savedSummary: "التفضيلات المحفوظة",
    savedDescription: "تعكس هذه الإعدادات آخر عملية حفظ ناجحة.",
    enabled: "مفعّل",
    disabled: "غير مفعّل",
    invoiceIntro: "راجع تفاصيل الفواتير وسجّل الدفعات المكتملة.",
    total: "إجمالي الفاتورة",
    issueDate: "تاريخ الإصدار",
    status: "الحالة",
    unpaid: "بانتظار الدفع",
    paid: "مدفوعة",
    details: "عرض التفاصيل",
    detailsTitle: "تفاصيل الفاتورة",
    detailsDescription: "راجع بيانات الفوترة وأدِر هذه الفاتورة.",
    invoiceId: "رقم الفاتورة",
    invoiceActions: "إجراءات الفاتورة",
    markPaid: "تحديد كمدفوعة",
    export: "تصدير",
    exportNote: "التصدير غير متاح في مساحة العمل هذه حاليًا.",
    working: "جارٍ تسجيل الدفعة…",
    invoiceSuccess: "تم تحديد الفاتورة كمدفوعة.",
    invoiceError: "تعذّر تسجيل الدفعة. يُرجى المحاولة مجددًا.",
    retry: "إعادة محاولة الدفع",
    cancelRequest: "إلغاء الطلب",
    account: "الحساب",
    overview: "نظرة عامة",
    connected: "سجلات العملاء والفوترة",
    currencyNote: "درهم إماراتي",
  },
};
type Screen = "customers" | "preferences" | "invoices";
type Copy = typeof copy.en;
const screens: Screen[] = ["customers", "preferences", "invoices"];
const screenIcons = {
  customers: Users,
  preferences: Settings2,
  invoices: Receipt,
};
function currentScreen(): Screen {
  const hash = window.location.hash.slice(1);
  return screens.includes(hash as Screen) ? (hash as Screen) : "customers";
}

export function Pilot({ language }: { language: "ar" | "en" }) {
  const t = copy[language];
  const { toast } = useToast();
  const [screen, setScreen] = useState<Screen>(currentScreen);
  const [customer, setCustomer] = useState(initialCustomer);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [paid, setPaid] = useState(false);
  const [customerSaved, setCustomerSaved] = useState(false);
  useEffect(() => {
    const changed = () => setScreen(currentScreen());
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  const preferenceItems = [
    { id: "billing", label: t.billing, description: t.billingDescription },
    {
      id: "reminders",
      label: t.reminders,
      description: t.remindersDescription,
    },
    { id: "product", label: t.product, description: t.productDescription },
  ];
  const intro = {
    customers: t.customerIntro,
    preferences: t.preferencesIntro,
    invoices: t.invoiceIntro,
  };
  return (
    <div className="pilot" lang={language}>
      <aside className="pilot-sidebar">
        <div className="pilot-brand">
          <span className="pilot-brand-icon">
            <Building2 aria-hidden="true" size={24} />
          </span>
          <div>
            <strong>{t.brand}</strong>
            <span>{t.workspace}</span>
          </div>
        </div>
        <div className="pilot-nav-label">{t.overview}</div>
        <nav aria-label={t.navigation}>
          {screens.map((target) => {
            const Icon = screenIcons[target];
            return (
              <a
                key={target}
                href={`#${target}`}
                aria-current={screen === target ? "page" : undefined}
              >
                <Icon size={19} aria-hidden="true" />
                <span>{t[target]}</span>
              </a>
            );
          })}
        </nav>
        <div className="pilot-sidebar-note">
          <span>{t.account}</span>
          <strong>{t.brand}</strong>
          <small>{t.connected}</small>
        </div>
      </aside>
      <main id={screen} className="pilot-main">
        <header className="pilot-header">
          <div>
            <p className="pilot-eyebrow">{t.workspace}</p>
            <h1>{t[screen]}</h1>
            <p>{intro[screen]}</p>
          </div>
        </header>
        {screen === "customers" && (
          <>
            <section className="pilot-card" aria-labelledby="customer-record">
              <div className="pilot-card-heading">
                <h2 id="customer-record">{t.customerRecord}</h2>
                <span className="pilot-badge">
                  <Check aria-hidden="true" size={14} />
                  {t.active}
                </span>
              </div>
              <div className="pilot-customer-name">
                <span className="pilot-record-icon">
                  <Building2 aria-hidden="true" size={28} />
                </span>
                <div>
                  <span className="pilot-label">{t.name}</span>
                  <h3>
                    <bdi>{customer.name}</bdi>
                  </h3>
                </div>
              </div>
              <dl className="pilot-record">
                <div>
                  <dt>{t.customerId}</dt>
                  <dd>
                    <bdi dir="ltr">{customer.id}</bdi>
                  </dd>
                </div>
                <div>
                  <dt>{t.email}</dt>
                  <dd>
                    <bdi dir="ltr">{customer.email}</bdi>
                  </dd>
                </div>
              </dl>
              <div className="pilot-card-footer">
                <CustomerEditSheet
                  customer={customer}
                  labels={{
                    edit: t.edit,
                    title: t.editTitle,
                    description: t.editDescription,
                    close: t.close,
                    name: t.name,
                    email: t.email,
                    save: t.save,
                    saving: t.saving,
                    cancel: t.cancel,
                    error: t.error,
                  }}
                  onSave={async (draft, context) => {
                    await api.saveCustomer(draft, context);
                    context.signal.throwIfAborted();
                    setCustomer(draft);
                    setCustomerSaved(true);
                    toast({ title: t.customerSaved, tone: "success" });
                  }}
                />
                {customerSaved && (
                  <span className="pilot-success" role="status">
                    {t.customerSaved}
                  </span>
                )}
              </div>
            </section>
          </>
        )}
        {screen === "preferences" && (
          <div className="pilot-preference-grid">
            <section className="pilot-card">
              <PreferenceSettings
                value={preferences}
                items={preferenceItems}
                labels={{
                  title: t.communication,
                  save: t.save,
                  saving: t.saving,
                  cancel: t.cancel,
                  saved: t.preferencesSaved,
                  error: t.error,
                }}
                onSave={async (draft, context) => {
                  await api.savePreferences(draft, context);
                  context.signal.throwIfAborted();
                  setPreferences(draft);
                }}
              />
            </section>
            <section
              className="pilot-card pilot-summary"
              aria-labelledby="saved-preferences"
            >
              <h2 id="saved-preferences">{t.savedSummary}</h2>
              <p>{t.savedDescription}</p>
              <dl>
                {preferenceItems.map((item) => (
                  <div key={item.id}>
                    <dt>{item.label}</dt>
                    <dd className={preferences[item.id] ? "pilot-success" : ""}>
                      {preferences[item.id] ? t.enabled : t.disabled}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        )}
        {screen === "invoices" && (
          <InvoiceScreen
            customer={customer}
            paid={paid}
            onPaid={() => setPaid(true)}
            t={t}
            language={language}
          />
        )}
      </main>
    </div>
  );
}

function InvoiceScreen({
  customer,
  paid,
  onPaid,
  t,
  language,
}: {
  customer: Customer;
  paid: boolean;
  onPaid: () => void;
  t: Copy;
  language: "ar" | "en";
}) {
  const { toast } = useToast();
  const locale = language === "ar" ? "ar-AE" : "en-AE";
  const amount = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "AED",
  }).format(4250.75);
  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date("2026-10-22T12:00:00Z"));
  const fields = [
    { id: "number", label: t.invoiceId, value: <bdi dir="ltr">INV-0042</bdi> },
    { id: "customer", label: t.name, value: <bdi>{customer.name}</bdi> },
    {
      id: "email",
      label: t.email,
      value: <bdi dir="ltr">{customer.email}</bdi>,
    },
    {
      id: "date",
      label: t.issueDate,
      value: <time dateTime="2026-10-22">{date}</time>,
    },
    { id: "total", label: t.total, value: <bdi>{amount}</bdi> },
    { id: "status", label: t.status, value: paid ? t.paid : t.unpaid },
  ];
  return (
    <section className="pilot-card" aria-labelledby="invoice-number">
      <div className="pilot-card-heading">
        <div>
          <p className="pilot-label">{t.invoiceId}</p>
          <h2 id="invoice-number">
            <bdi dir="ltr">INV-0042</bdi>
          </h2>
        </div>
        <span className={`pilot-badge ${paid ? "" : "pilot-badge-neutral"}`}>
          {paid ? t.paid : t.unpaid}
        </span>
      </div>
      <div className="pilot-invoice-total">
        <span className="pilot-label">{t.total}</span>
        <strong>
          <bdi>{amount}</bdi>
        </strong>
        <span>{t.currencyNote}</span>
      </div>
      <dl className="pilot-record">
        <div>
          <dt>{t.email}</dt>
          <dd>
            <bdi dir="ltr">{customer.email}</bdi>
          </dd>
        </div>
        <div>
          <dt>{t.issueDate}</dt>
          <dd>
            <time dateTime="2026-10-22">{date}</time>
          </dd>
        </div>
      </dl>
      <div className="pilot-card-footer">
        <InvoiceActions
          invoice={{ id: "INV-0042", fields }}
          actions={[
            { id: "mark-paid", label: t.markPaid, disabled: paid },
            { id: "export", label: t.export, disabled: true },
          ]}
          actionsInDetails
          labels={{
            actions: t.invoiceActions,
            details: t.details,
            title: t.detailsTitle,
            description: t.detailsDescription,
            close: t.close,
            working: t.working,
            cancel: t.cancelRequest,
            success: t.invoiceSuccess,
            error: t.invoiceError,
          }}
          onAction={async (actionId, invoice, context) => {
            await api.runInvoiceAction(actionId, invoice.id, context);
            context.signal.throwIfAborted();
            if (actionId === "mark-paid") {
              onPaid();
              toast({ title: t.invoiceSuccess, tone: "success" });
            }
          }}
        />
        <Button variant="secondary" disabled aria-describedby="export-note">
          <Download size={16} aria-hidden="true" />
          {t.export}
        </Button>
      </div>
      <p id="export-note" className="pilot-muted pilot-export-note">
        {t.exportNote}
      </p>
    </section>
  );
}
