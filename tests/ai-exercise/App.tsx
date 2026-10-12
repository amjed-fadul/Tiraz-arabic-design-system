import { useState } from "react";
import { Receipt, Plus, ArrowUpRight } from "lucide-react";
import {
  Field,
  Input,
  Select,
  Button,
  Tabs,
  Switch,
  DropdownMenu,
  Sheet,
  SystemProvider,
  ToastProvider,
  useToast,
  defaultConfig,
} from "./vendor/tiraz";
import type { SystemConfig } from "./vendor/tiraz";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./vendor/tiraz/tokens.css";
import "./vendor/tiraz/components.css";
import "./styles.css";

type Invoice = {
  id: string;
  clientAr: string;
  clientEn: string;
  amount: number;
  paid: boolean;
};
const initialInvoices: Invoice[] = [
  {
    id: "INV-1042",
    clientAr: "استوديو نخيل",
    clientEn: "Nakheel Studio",
    amount: 4800,
    paid: false,
  },
  {
    id: "INV-1041",
    clientAr: "مؤسسة مدار",
    clientEn: "Madar Foundation",
    amount: 2350,
    paid: true,
  },
  {
    id: "INV-1040",
    clientAr: "دار سطر",
    clientEn: "Satr House",
    amount: 6200,
    paid: false,
  },
];

function Dashboard({
  config,
  setConfig,
}: {
  config: SystemConfig;
  setConfig: (config: SystemConfig) => void;
}) {
  const ar = config.direction === "rtl";
  const t = (arabic: string, english: string) => (ar ? arabic : english);
  const { toast } = useToast();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [view, setView] = useState("all");
  const [reminders, setReminders] = useState(true);
  const [client, setClient] = useState("");
  const [error, setError] = useState(false);
  const [created, setCreated] = useState(false);
  const [project, setProject] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const update = (patch: Partial<SystemConfig>) =>
    setConfig({ ...config, ...patch });
  const money = (amount: number) =>
    new Intl.NumberFormat(ar ? "ar-AE" : "en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0,
    }).format(amount);
  const markPaid = (id: string) => {
    setInvoices((previous) =>
      previous.map((invoice) =>
        invoice.id === id ? { ...invoice, paid: true } : invoice,
      ),
    );
    toast({
      title: t("تم تسجيل الدفعة", "Payment recorded"),
      description: id,
      tone: "success",
      duration: 1800,
    });
  };
  const createInvoice = () => {
    if (!client.trim()) {
      setError(true);
      setCreated(false);
      toast({
        title: t("أضف اسم العميل", "Enter a client name"),
        tone: "error",
        duration: 1800,
      });
      return;
    }
    setInvoices((previous) => [
      ...previous,
      {
        id: `INV-${1043 + previous.length - initialInvoices.length}`,
        clientAr: client.trim(),
        clientEn: client.trim(),
        amount: 1000,
        paid: false,
      },
    ]);
    setClient("");
    setError(false);
    setCreated(true);
    toast({
      title: t("تم إنشاء الفاتورة", "Invoice created"),
      description: t(
        "مسودة محلية بقيمة ١٬٠٠٠ درهم",
        "Local draft for AED 1,000",
      ),
      tone: "success",
      duration: 1800,
    });
  };
  const filtered = invoices.filter((invoice) => view === "all" || invoice.paid);
  const table = (
    <div className="table-scroll">
      <table>
        <caption>
          {t(
            "سجل الفواتير — جدول HTML يملكه التطبيق",
            "Invoice register — application-owned HTML table",
          )}
        </caption>
        <thead>
          <tr>
            <th scope="col">{t("الفاتورة", "Invoice")}</th>
            <th scope="col">{t("العميل", "Client")}</th>
            <th scope="col">{t("المبلغ", "Amount")}</th>
            <th scope="col">{t("الحالة", "Status")}</th>
            <th scope="col">{t("إجراء", "Action")}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((invoice) => (
            <tr key={invoice.id}>
              <th scope="row">
                <bdi dir="ltr">{invoice.id}</bdi>
              </th>
              <td>{ar ? invoice.clientAr : invoice.clientEn}</td>
              <td className="amount">{money(invoice.amount)}</td>
              <td>
                <span className={`badge ${invoice.paid ? "paid" : "pending"}`}>
                  {invoice.paid
                    ? t("مدفوعة", "Paid")
                    : t("بانتظار الدفع", "Awaiting payment")}
                </span>
              </td>
              <td>
                <DropdownMenu
                  trigger={
                    <Button
                      variant="ghost"
                      aria-label={t(
                        `إجراءات ${invoice.id}`,
                        `Actions for ${invoice.id}`,
                      )}
                    >
                      {t("الإجراءات", "Actions")}
                      <ArrowUpRight aria-hidden="true" size={14} />
                    </Button>
                  }
                  items={[
                    {
                      id: "paid",
                      label: t("تسجيل الدفعة", "Record payment"),
                      disabled: invoice.paid,
                      onSelect: () => markPaid(invoice.id),
                    },
                    {
                      id: "copy",
                      label: t("عرض رقم الفاتورة", "Show invoice number"),
                      onSelect: () =>
                        toast({
                          title: invoice.id,
                          tone: "info",
                          duration: 1800,
                        }),
                    },
                  ]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <main lang={ar ? "ar" : "en"}>
      <header className="page-header">
        <div className="brand">
          <Receipt aria-hidden="true" size={22} />
          <span>{t("دفتر · الفواتير", "Daftar · Invoices")}</span>
        </div>
        <Button
          variant="secondary"
          onClick={() => update({ direction: ar ? "ltr" : "rtl" })}
          data-testid="language"
        >
          {ar ? "English" : "العربية"}
        </Button>
      </header>
      <div className="intro">
        <div>
          <p className="eyebrow">
            {t("مساحة العمل / المالية", "Workspace / Finance")}
          </p>
          <h1>{t("كل فاتورة، في مكانها", "Every invoice, in its place")}</h1>
          <p>
            {t(
              "راجع الدفعات ونظّم متابعتك مع العملاء.",
              "Review payments and organize your client follow-up.",
            )}
          </p>
        </div>
        <Sheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          trigger={
            <Button data-testid="sheet-trigger" variant="secondary">
              {t("إعدادات المتابعة", "Follow-up settings")}
            </Button>
          }
          title={t("إعدادات المتابعة", "Follow-up settings")}
          description={t(
            "اضبط التذكيرات واختر المشروع لهذا السجل المحلي.",
            "Adjust reminders and choose a project for this local register.",
          )}
          closeLabel={t("إغلاق إعدادات المتابعة", "Close follow-up settings")}
        >
          <div className="sheet-stack">
            <Switch
              id="sheet-reminders"
              label={t("تذكيرات الدفع", "Payment reminders")}
              description={t(
                "تفضيل محلي فقط؛ لا يتم إرسال رسائل.",
                "Local preference only; no messages are sent.",
              )}
              checked={reminders}
              onCheckedChange={setReminders}
            />
            <section>
              <h3>{t("المشروع الحالي", "Current project")}</h3>
              <p data-testid="project">
                {t("المشروع", "Project")}{" "}
                <bdi dir="ltr">{String(project).padStart(2, "0")}</bdi>
              </p>
              <Field label={t("اختيار قيمة المشروع", "Project value")}>
                {(field) => (
                  <Select
                    field={field}
                    aria-label={t("اختيار قيمة المشروع", "Project value")}
                    data-testid="project-select"
                    value={String(project)}
                    onValueChange={(value) => setProject(Number(value))}
                    options={Array.from({ length: 48 }, (_, index) => ({
                      value: String(index + 1),
                      label: `${t("المشروع", "Project")} ${String(index + 1).padStart(2, "0")}`,
                    }))}
                  />
                )}
              </Field>
              <DropdownMenu
                open={menuOpen}
                onOpenChange={setMenuOpen}
                trigger={
                  <Button data-testid="project-menu" variant="secondary">
                    {t("اختيار المشروع", "Choose project")}
                  </Button>
                }
                items={Array.from({ length: 48 }, (_, index) => ({
                  id: `project-${index + 1}`,
                  label: `${t("تعيين المشروع", "Assign project")} ${String(index + 1).padStart(2, "0")}`,
                  onSelect: () => {
                    setProject(index + 1);
                    toast({
                      title: t("تم تغيير المشروع", "Project changed"),
                      duration: 1800,
                    });
                  },
                }))}
              />
            </section>
            <p className="muted">
              {t(
                "٤٨ مشروعًا في قائمة قابلة للتمرير. استخدم Home وEnd ومفاتيح الأسهم، ثم Enter.",
                "48 projects in a scrolling menu. Use Home, End, arrow keys, then Enter.",
              )}
            </p>
          </div>
        </Sheet>
      </div>
      <section
        className="summary"
        aria-label={t("ملخص الفواتير", "Invoice summary")}
      >
        <article>
          <span>{t("إجمالي المستحق", "Outstanding total")}</span>
          <strong>
            {money(
              invoices
                .filter((invoice) => !invoice.paid)
                .reduce((sum, invoice) => sum + invoice.amount, 0),
            )}
          </strong>
        </article>
        <article>
          <span>{t("فواتير مدفوعة", "Paid invoices")}</span>
          <strong>{invoices.filter((invoice) => invoice.paid).length}</strong>
        </article>
        <article>
          <span>{t("تذكيرات الدفع", "Payment reminders")}</span>
          <strong className="small-stat">
            {reminders ? t("مفعّلة", "Enabled") : t("متوقفة", "Paused")}
          </strong>
        </article>
      </section>
      <div className="dashboard-grid">
        <section className="panel register">
          <div className="panel-heading">
            <h2>{t("سجل الفواتير", "Invoice register")}</h2>
            <span className="muted">
              {invoices.length} {t("فواتير", "invoices")}
            </span>
          </div>
          <Tabs
            label={t("عرض الفواتير", "Invoice views")}
            value={view}
            onValueChange={setView}
            items={[
              {
                value: "all",
                label: t("كل الفواتير", "All invoices"),
                content: table,
              },
              { value: "paid", label: t("المدفوعة", "Paid"), content: table },
            ]}
          />
          <form
            className="draft"
            onSubmit={(event) => {
              event.preventDefault();
              createInvoice();
            }}
            noValidate
          >
            <div>
              <Field
                id="client"
                label={t(
                  "اسم العميل لفاتورة جديدة",
                  "Client for a new invoice",
                )}
                required
              >
                {(field) => (
                  <Input
                    field={field}
                    id="client"
                    value={client}
                    onChange={(event) => {
                      setClient(event.target.value);
                      setCreated(false);
                    }}
                    aria-invalid={error || undefined}
                    aria-describedby="draft-help"
                    placeholder={t("مثل: استوديو فلك", "e.g. Falak Studio")}
                  />
                )}
              </Field>
            </div>
            <Button
              type="submit"
              state={error ? "error" : created ? "success" : "idle"}
            >
              <Plus aria-hidden="true" size={16} />
              {t("إنشاء مسودة", "Create draft")}
            </Button>
            <p
              id="draft-help"
              className={error ? "error-text" : "muted"}
              role={error ? "alert" : undefined}
            >
              {error
                ? t(
                    "أدخل اسم العميل لإنشاء الفاتورة.",
                    "Enter a client name to create the invoice.",
                  )
                : t(
                    "تُنشأ مسودة محلية بقيمة ١٬٠٠٠ درهم. البيانات لا تُحفظ بعد إعادة التحميل.",
                    "Creates a local draft for AED 1,000. Reloading clears these changes.",
                  )}
            </p>
          </form>
        </section>
        <aside className="panel preferences">
          <h2>{t("تخصيص الواجهة", "Customize interface")}</h2>
          <p className="muted">
            {t(
              "إعدادات مشتركة تشمل القوائم واللوحة والتنبيهات.",
              "Shared settings include menus, the sheet, and notices.",
            )}
          </p>
          <Switch
            id="dark-mode"
            label={t("الوضع الداكن", "Dark mode")}
            checked={config.theme === "dark"}
            onCheckedChange={(checked) =>
              update({ theme: checked ? "dark" : "light" })
            }
          />
          <label className="field">
            {t("اللون الرئيسي", "Accent")}
            <select
              id="accent"
              value={config.accent}
              onChange={(event) =>
                update({ accent: event.target.value as SystemConfig["accent"] })
              }
            >
              <option value="sage">{t("أخضر", "Sage")}</option>
              <option value="blue">{t("أزرق", "Blue")}</option>
              <option value="plum">{t("بنفسجي", "Plum")}</option>
              <option value="clay">{t("طيني", "Clay")}</option>
            </select>
          </label>
          <label className="field">
            {t("الكثافة", "Density")}
            <select
              id="density"
              value={config.density}
              onChange={(event) =>
                update({
                  density: event.target.value as SystemConfig["density"],
                })
              }
            >
              <option value="compact">{t("مضغوطة", "Compact")}</option>
              <option value="standard">{t("قياسية", "Standard")}</option>
            </select>
          </label>
          <label className="field">
            {t("حجم النص", "Text size")}
            <select
              id="typography"
              value={config.typography}
              onChange={(event) =>
                update({
                  typography: event.target.value as SystemConfig["typography"],
                })
              }
            >
              <option value="standard">{t("قياسي", "Standard")}</option>
              <option value="large">{t("كبير", "Large")}</option>
            </select>
          </label>
          <label className="field">
            {t("استدارة الزوايا", "Corner radius")}
            <select
              id="radius"
              value={config.radius}
              onChange={(event) =>
                update({ radius: Number(event.target.value) })
              }
            >
              <option value="0">0</option>
              <option value="8">8</option>
              <option value="16">16</option>
            </select>
          </label>
          <Switch
            id="reduced-motion"
            label={t("تقليل الحركة", "Reduce motion")}
            checked={config.reducedMotion}
            onCheckedChange={(checked) => update({ reducedMotion: checked })}
          />
        </aside>
      </div>
      <footer className="page-footer">
        {t(
          "تجربة استهلاك مستقلة لـ Tiraz · تسع عائلات موثّقة · جدول يملكه التطبيق",
          "Independent Tiraz consumption exercise · Nine documented families · Application-owned table",
        )}
      </footer>
    </main>
  );
}

export default function App() {
  const [config, setConfig] = useState<SystemConfig>({ ...defaultConfig });
  const ar = config.direction === "rtl";
  return (
    <div lang={ar ? "ar" : "en"}>
      <SystemProvider config={config}>
        <ToastProvider
          label={ar ? "التنبيهات" : "Notifications"}
          closeLabel={ar ? "إغلاق التنبيه" : "Close notification"}
        >
          <Dashboard config={config} setConfig={setConfig} />
        </ToastProvider>
      </SystemProvider>
    </div>
  );
}
