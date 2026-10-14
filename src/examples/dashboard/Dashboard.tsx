import { useEffect, useRef, useState } from "react";
import { ArrowUpLeft, ArrowUpRight, Menu, Moon, Sun } from "lucide-react";
import {
  Alert,
  AreaChart,
  Avatar,
  Badge,
  Button,
  DataTable,
  DonutChart,
  EmptyState,
  NoRecordsIllustration,
  NoSearchResultsIllustration,
  Input,
  Select,
  Sheet,
  Skeleton,
  Spinner,
  SystemProvider,
  ToastProvider,
  defaultConfig,
} from "../../system";
import type { DataTableColumn } from "../../system";
import { CreateCustomer } from "./CreateCustomer";
import {
  calculateOrders,
  filterCustomers,
  sampleCustomers,
  sampleOrders,
} from "./data";
import type { Customer, CustomerStatus, Period } from "./data";
import "./dashboard.css";

type Preview = "sample" | "loading" | "empty" | "error";
export function Dashboard() {
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const direction = language === "ar" ? "rtl" : "ltr";
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.documentElement.style.colorScheme = theme;
    document.title =
      language === "ar" ? "طِراز · لوحة العملاء" : "Tiraz · Customer dashboard";
  }, [language, direction, theme]);
  return (
    <div lang={language} className="dashboard-host">
      <SystemProvider config={{ ...defaultConfig, direction, theme }}>
        <ToastProvider
          label={t("الإشعارات", "Notifications")}
          closeLabel={t("إغلاق الإشعار", "Dismiss notification")}
        >
          <DashboardContent
            language={language}
            theme={theme}
            onLanguage={() => setLanguage(language === "ar" ? "en" : "ar")}
            onTheme={() => setTheme(theme === "light" ? "dark" : "light")}
          />
        </ToastProvider>
      </SystemProvider>
    </div>
  );
}

function DashboardContent({
  language,
  theme,
  onLanguage,
  onTheme,
}: {
  language: "ar" | "en";
  theme: "light" | "dark";
  onLanguage: () => void;
  onTheme: () => void;
}) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const number = (value: number) =>
    new Intl.NumberFormat(language).format(value);
  const [period, setPeriod] = useState<Period>(7);
  const [preview, setPreview] = useState<Preview>("sample");
  const [customers, setCustomers] = useState<Customer[]>(sampleCustomers);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CustomerStatus | "all">("all");
  const [newCustomer, setNewCustomer] = useState<Customer | null>(null);
  const [spotlightId, setSpotlightId] = useState<number | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const pendingDestination = useRef<string | null>(null);
  const nextId = useRef(sampleCustomers.length + 1);
  const searchRef = useRef<HTMLInputElement>(null);
  const blocked = preview === "loading" || preview === "error";
  const orders = calculateOrders(
    preview === "empty" ? [] : sampleOrders,
    period,
  );
  const filtered = filterCustomers(customers, query, status).filter(
    (customer) => spotlightId === null || customer.id === spotlightId,
  );
  const hiddenNew =
    newCustomer && !filtered.some((customer) => customer.id === newCustomer.id);
  const hasFilters = !!query || status !== "all" || spotlightId !== null;
  function clearFilters() {
    setQuery("");
    setStatus("all");
    setSpotlightId(null);
  }
  function changePreview(next: Preview) {
    setPreview(next);
    setNewCustomer(null);
    clearFilters();
    if (next === "sample" || next === "empty") {
      setCustomers(next === "empty" ? [] : sampleCustomers);
      nextId.current = sampleCustomers.length + 1;
    }
  }
  const range = `${new Intl.DateTimeFormat(language, { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${orders.start}T00:00:00Z`))} – ${new Intl.DateTimeFormat(language, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${orders.end}T00:00:00Z`))}`;
  const channels = [
    {
      key: "web" as const,
      label: t("الموقع", "Website"),
      color: "var(--action)",
    },
    {
      key: "store" as const,
      label: t("المتجر", "Store"),
      color: "var(--chart-blue)",
    },
    {
      key: "partner" as const,
      label: t("الشركاء", "Partners"),
      color: "var(--chart-clay)",
    },
  ];
  const navItems = [
    { id: "overview", label: t("نظرة عامة", "Overview") },
    { id: "orders", label: t("الطلبات", "Orders") },
    { id: "customers", label: t("العملاء", "Customers") },
  ];
  function navigation(mobile: boolean) {
    return (
      <nav
        aria-label={t("تنقّل لوحة العملاء", "Dashboard navigation")}
        className={mobile ? "dashboard-mobile-links" : "dashboard-links"}
      >
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={() => {
              if (mobile) {
                pendingDestination.current = item.id;
                setNavOpen(false);
              }
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
    );
  }
  const columns: DataTableColumn<Customer>[] = [
    {
      id: "name",
      header: t("العميل", "Customer"),
      rowHeader: true,
      sortValue: (customer) => customer.name,
      cell: (customer) => (
        <span className="dashboard-customer">
          <Avatar
            name={customer.name}
            fallback={customer.name.slice(0, 1)}
            decorative
          />
          <bdi>{customer.name}</bdi>
        </span>
      ),
    },
    {
      id: "email",
      header: t("البريد الإلكتروني", "Email"),
      sortValue: (customer) => customer.email,
      cell: (customer) => <bdi dir="ltr">{customer.email || "—"}</bdi>,
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
  ];
  const emptyContent =
    preview === "loading" ? (
      <Skeleton shape="rectangle" style={{ height: "8rem", width: "100%" }} />
    ) : preview === "error" ? (
      t(
        "البيانات غير متاحة في معاينة الخطأ.",
        "Data is unavailable in the error preview.",
      )
    ) : customers.length === 0 ? (
      <EmptyState
        title={t("لا يوجد عملاء بعد", "No customers yet")}
        description={t(
          "الدليل فارغ. أضف أول عميل باستخدام «إنشاء عميل».",
          "The directory is empty. Add your first customer using Create customer.",
        )}
        illustration={<NoRecordsIllustration />}
      />
    ) : (
      <EmptyState
        title={t("لا توجد نتائج مطابقة", "No matching customers")}
        description={t(
          "جرّب اسمًا آخر أو امسح عوامل التصفية.",
          "Try another name or clear your filters.",
        )}
        illustration={<NoSearchResultsIllustration />}
        action={
          <Button variant="secondary" onClick={clearFilters}>
            {t("مسح التصفية", "Clear filters")}
          </Button>
        }
      />
    );
  const ExitArrow = language === "ar" ? ArrowUpLeft : ArrowUpRight;
  return (
    <div className="dashboard">
      <a className="dashboard-skip" href="#overview">
        {t("انتقل إلى المحتوى", "Skip to content")}
      </a>
      <header className="dashboard-header">
        <a
          className="dashboard-brand"
          href="#overview"
          aria-label={t("طِراز — نظرة عامة", "Tiraz — Overview")}
        >
          <span className="dashboard-mark" aria-hidden="true">
            ✳
          </span>
          {t("طِراز", "Tiraz")}
          <span className="dashboard-workspace">
            {t("مساحة العملاء", "Customer workspace")}
          </span>
        </a>
        {navigation(false)}
        <div className="dashboard-header-actions">
          <div className="dashboard-mobile-nav">
            <Sheet
              open={navOpen}
              onOpenChange={setNavOpen}
              title={t("التنقّل", "Navigation")}
              description={t(
                "انتقل إلى قسم في لوحة العملاء.",
                "Go to a section in the customer dashboard.",
              )}
              closeLabel={t("إغلاق التنقّل", "Close navigation")}
              trigger={
                <Button
                  variant="ghost"
                  iconOnly
                  aria-label={t("فتح التنقّل", "Open navigation")}
                  onFocus={() => {
                    const destination = pendingDestination.current;
                    if (!destination) return;
                    pendingDestination.current = null;
                    // Radix has restored the trigger; hand off to the chosen section.
                    requestAnimationFrame(() => {
                      const section = document.getElementById(destination);
                      section?.focus();
                      section?.scrollIntoView();
                    });
                  }}
                >
                  <Menu size={18} aria-hidden="true" />
                </Button>
              }
            >
              {navigation(true)}
            </Sheet>
          </div>
          <Button variant="ghost" onClick={onLanguage}>
            <bdi>{language === "ar" ? "English" : "العربية"}</bdi>
          </Button>
          <Button
            variant="ghost"
            iconOnly
            aria-label={t("الوضع الداكن", "Dark mode")}
            aria-pressed={theme === "dark"}
            onClick={onTheme}
          >
            {theme === "light" ? (
              <Moon size={17} aria-hidden="true" />
            ) : (
              <Sun size={17} aria-hidden="true" />
            )}
          </Button>
        </div>
      </header>
      <main className="dashboard-main">
        <section id="overview" tabIndex={-1} aria-labelledby="overview-title">
          <div className="dashboard-heading">
            <div>
              <p className="dashboard-eyebrow">
                {t("لوحة العملاء", "CUSTOMER DASHBOARD")}
              </p>
              <h1 id="overview-title">
                {t("كل التفاصيل، في مكان واحد.", "Everything, in one place.")}
              </h1>
              <p className="dashboard-muted">
                {t(
                  "تابع الطلبات وابقَ قريبًا من عملائك.",
                  "Follow your orders. Stay close to your customers.",
                )}
              </p>
            </div>
            <CreateCustomer
              language={language}
              disabled={blocked}
              onCreate={(draft) => {
                const customer = { ...draft, id: nextId.current++ };
                setCustomers((previous) => [customer, ...previous]);
                setNewCustomer(customer);
              }}
            />
          </div>
          <div className="dashboard-context">
            <Badge>{t("بيانات تجريبية", "Sample data")}</Badge>
            <span>
              {t(
                "في الذاكرة فقط · إعادة التحميل تستعيد العينة",
                "In memory only · reload restores the sample",
              )}
            </span>
          </div>
          <dl className="dashboard-metrics" aria-busy={preview === "loading"}>
            {[
              {
                key: "customer-count",
                label: t("إجمالي العملاء", "Total customers"),
                value: number(customers.length),
                note: t("كل العملاء في الدليل", "Everyone in the directory"),
              },
              {
                key: "order-count",
                label: t("الطلبات", "Orders"),
                value: number(orders.count),
                note: range,
              },
              {
                key: "revenue",
                label: t("إيرادات الطلبات", "Order revenue"),
                value: new Intl.NumberFormat(language, {
                  style: "currency",
                  currency: "AED",
                  maximumFractionDigits: 0,
                }).format(orders.revenue),
                note: range,
              },
            ].map((metric) => (
              <div key={metric.key}>
                <dt>{metric.label}</dt>
                <dd className="dashboard-metric-value" data-testid={metric.key}>
                  {preview === "loading" ? (
                    <Skeleton style={{ width: "7rem", height: "2rem" }} />
                  ) : blocked ? (
                    "—"
                  ) : (
                    metric.value
                  )}
                </dd>
                <dd className="dashboard-metric-note">{metric.note}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section
          id="orders"
          tabIndex={-1}
          aria-labelledby="orders-title"
          className="dashboard-section"
        >
          <header className="dashboard-section-heading">
            <div>
              <h2 id="orders-title">
                {t("أداء الطلبات", "Order performance")}
              </h2>
              <p className="dashboard-muted">{range}</p>
            </div>
            <Select
              aria-label={t("الفترة", "Period")}
              value={String(period)}
              onValueChange={(value) => setPeriod(Number(value) as Period)}
              options={[
                { value: "7", label: t("٧ أيام", "7 days") },
                { value: "14", label: t("١٤ يومًا", "14 days") },
              ]}
            />
          </header>
          {preview === "loading" ? (
            <div className="dashboard-loading" role="status">
              <Spinner decorative />
              <span>
                {t(
                  "معاينة التحميل — لا يوجد طلب شبكة جارٍ.",
                  "Loading preview — no request is running.",
                )}
              </span>
            </div>
          ) : preview === "error" ? (
            <Alert
              tone="error"
              title={t(
                "تعذّر عرض بيانات المثال",
                "Unable to display the example data",
              )}
              description={t(
                "هذه معاينة للخطأ. إعادة المحاولة تستعيد البيانات التجريبية.",
                "This is an error preview. Retry restores the sample data.",
              )}
              action={
                <Button
                  variant="secondary"
                  onClick={() => changePreview("sample")}
                >
                  {t("إعادة المحاولة", "Retry")}
                </Button>
              }
            />
          ) : null}
          {preview === "error" ? null : preview === "loading" ? (
            <div className="dashboard-charts" aria-busy={preview === "loading"}>
              <Skeleton
                shape="rectangle"
                style={{ width: "100%", height: "16rem" }}
              />
              <Skeleton
                shape="rectangle"
                style={{ width: "100%", height: "16rem" }}
              />
            </div>
          ) : (
            <div className="dashboard-charts">
              <article>
                <h3>{t("اتجاه الطلبات", "Orders trend")}</h3>
                <AreaChart
                  data={orders.trend}
                  series={[
                    {
                      key: "orders",
                      label: t("الطلبات", "Orders"),
                      color: "var(--action)",
                    },
                  ]}
                  label={t("الطلبات اليومية", "Daily orders")}
                  summary={t(
                    `${number(orders.count)} طلبًا خلال ${range}. كل نقطة تمثل إجمالي طلبات يوم واحد.`,
                    `${number(orders.count)} orders during ${range}. Each point is one day's total orders.`,
                  )}
                  locale={language}
                  categoryFormat="date"
                  height={220}
                  dataTable
                />
              </article>
              <article>
                <h3>{t("توزيع القنوات", "Channel distribution")}</h3>
                <DonutChart
                  data={channels.map((channel) => ({
                    ...channel,
                    value: orders.channels[channel.key],
                  }))}
                  label={t("الطلبات حسب القناة", "Orders by channel")}
                  summary={t(
                    `${number(orders.count)} طلبًا: ${channels.map((channel) => `${channel.label} ${number(orders.channels[channel.key])}`).join("، ")}.`,
                    `${number(orders.count)} orders: ${channels.map((channel) => `${channel.label} ${number(orders.channels[channel.key])}`).join(", ")}.`,
                  )}
                  locale={language}
                  height={220}
                  legend
                  interactiveLegend={false}
                  dataTable
                />
              </article>
            </div>
          )}
        </section>
        <section
          id="customers"
          tabIndex={-1}
          aria-labelledby="customers-title"
          className="dashboard-section"
        >
          <header className="dashboard-section-heading">
            <div>
              <h2 id="customers-title">{t("العملاء", "Customers")}</h2>
              <p className="dashboard-muted">
                {t(
                  "أسماء تعرفها، وعلاقات تنمو.",
                  "Familiar names. Growing relationships.",
                )}
              </p>
            </div>
            <span className="dashboard-muted">
              {blocked
                ? "—"
                : t(
                    `${number(customers.length)} عميل في الدليل`,
                    `${number(customers.length)} in the directory`,
                  )}
            </span>
          </header>
          <div className="dashboard-filters">
            <Input
              ref={searchRef}
              type="search"
              aria-label={t(
                "البحث عن العملاء بالاسم أو البريد",
                "Search customers by name or email",
              )}
              placeholder={t("ابحث بالاسم أو البريد…", "Search name or email…")}
              disabled={blocked}
              value={query}
              onChange={(event) => {
                setQuery(event.currentTarget.value);
                setSpotlightId(null);
              }}
            />
            <Select
              aria-label={t("حالة العميل", "Customer status")}
              disabled={blocked}
              value={status}
              onValueChange={(value) => {
                setStatus(value as CustomerStatus | "all");
                setSpotlightId(null);
              }}
              options={[
                { value: "all", label: t("كل الحالات", "All statuses") },
                { value: "active", label: t("نشط", "Active") },
                { value: "paused", label: t("متوقف", "Paused") },
              ]}
            />
            {hasFilters && filtered.length > 0 && (
              <Button variant="ghost" onClick={clearFilters}>
                {t("مسح التصفية", "Clear filters")}
              </Button>
            )}
          </div>
          {hiddenNew && !blocked && (
            <Alert
              title={t(
                "عوامل التصفية تخفي العميل الجديد.",
                "Your filters hide the new customer.",
              )}
              description={newCustomer.name}
              announcement="polite"
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery(newCustomer.name);
                    setStatus("all");
                    setSpotlightId(newCustomer.id);
                    searchRef.current?.focus();
                  }}
                >
                  {t("عرض العميل", "Show customer")}
                </Button>
              }
            />
          )}
          {spotlightId !== null && (
            <p className="dashboard-muted">
              {t(
                "يُعرض العميل الجديد فقط. امسح التصفية لعرض الجميع.",
                "Showing only the new customer. Clear filters to show everyone.",
              )}
            </p>
          )}
          <DataTable
            data={blocked ? [] : filtered}
            columns={columns}
            getRowId={(customer) => customer.id}
            caption={t("دليل العملاء", "Customer directory")}
            locale={language}
            pageSize={6}
            resetKey={JSON.stringify([query, status, spotlightId, preview])}
            loading={preview === "loading"}
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
                blocked
                  ? t(
                      "البيانات غير متاحة في هذه المعاينة",
                      "Data unavailable in this preview",
                    )
                  : t(
                      `${number(from)}–${number(to)} من ${number(total)} عميل`,
                      `${number(from)}–${number(to)} of ${number(total)} customers`,
                    ),
            }}
          />
        </section>
        <footer className="dashboard-footer">
          <a href="/">
            {t("توثيق طِراز", "Tiraz documentation")}
            <ExitArrow size={14} aria-hidden="true" />
          </a>
          <div className="dashboard-preview">
            <label id="preview-label">
              {t("معاينة الحالة", "Preview state")}
            </label>
            <Select
              aria-labelledby="preview-label"
              value={preview}
              onValueChange={(value) => changePreview(value as Preview)}
              options={[
                { value: "sample", label: t("العينة", "Sample") },
                { value: "loading", label: t("تحميل", "Loading") },
                { value: "empty", label: t("بيانات فارغة", "Empty dataset") },
                { value: "error", label: t("خطأ", "Error") },
              ]}
            />
          </div>
        </footer>
      </main>
    </div>
  );
}
