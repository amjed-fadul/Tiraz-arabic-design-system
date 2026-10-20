import { useEffect, useRef, useState } from "react";
import {
  ArrowUpLeft,
  ArrowUpRight,
  Menu,
  Moon,
  Sun,
  Home,
  ShoppingBag,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarIdentity,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarItem,
  SidebarToggle,
  SidebarLabel,
  Alert,
  AreaChart,
  Avatar,
  Badge,
  Button,
  ChangeSummary,
  DataTable,
  DonutChart,
  EmptyState,
  NoRecordsIllustration,
  NoSearchResultsIllustration,
  Input,
  FilterBar,
  Select,
  Sheet,
  Skeleton,
  Spinner,
  SystemProvider,
  ToastProvider,
  defaultConfig,
  numberLocale,
  useSystem,
} from "../../system";
import type { ChangeSummaryProps, DataTableColumn } from "../../system";
import { CreateCustomer } from "./CreateCustomer";
import {
  calculateOrders,
  filterCustomers,
  sampleCustomers,
  sampleEnd,
  sampleOrders,
} from "./data";
import type { Customer, CustomerStatus, Order, Period } from "./data";
import "./dashboard.css";

type Preview = "sample" | "loading" | "empty" | "error";
// The last seven days against the seven before them, for What changed: orders,
// revenue and the average order, each with its fourteen days for the sparkline.
function weekOverWeek(orders: readonly Order[]) {
  const end = Date.parse(`${sampleEnd}T00:00:00Z`);
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(end - (13 - index) * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const day = orders.filter((order) => order.date === date);
    return {
      orders: day.length,
      revenue: day.reduce((total, order) => total + order.amount, 0),
    };
  });
  const week = (from: number) => {
    const slice = days.slice(from, from + 7);
    const count = slice.reduce((total, day) => total + day.orders, 0);
    const revenue = slice.reduce((total, day) => total + day.revenue, 0);
    return { orders: count, revenue, average: count ? revenue / count : 0 };
  };
  return {
    last: week(7),
    previous: week(0),
    series: {
      orders: days.map((day) => day.orders),
      revenue: days.map((day) => day.revenue),
      average: days.map((day) => (day.orders ? day.revenue / day.orders : 0)),
    },
  };
}
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
  const { config } = useSystem();
  // Arabic digits follow SystemConfig.numerals; plain "ar" renders Western ones.
  const locale = numberLocale(config, language);
  const number = (value: number) => new Intl.NumberFormat(locale).format(value);
  const [period, setPeriod] = useState<Period>(7);
  const [preview, setPreview] = useState<Preview>("sample");
  const [customers, setCustomers] = useState<Customer[]>(sampleCustomers);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CustomerStatus | "all">("all");
  const [newCustomer, setNewCustomer] = useState<Customer | null>(null);
  const [spotlightId, setSpotlightId] = useState<number | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState(() =>
    ["overview", "orders", "customers"].includes(window.location.hash.slice(1))
      ? window.location.hash.slice(1)
      : "overview",
  );
  useEffect(() => {
    const update = () => {
      const id = window.location.hash.slice(1);
      if (["overview", "orders", "customers"].includes(id))
        setActiveSection(id);
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
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
  // What changed: up is good for all three, so more is green and less is red.
  const weeks = weekOverWeek(preview === "empty" ? [] : sampleOrders);
  const money = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0,
    }).format(value);
  const percent = new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  });
  const changes: ChangeSummaryProps["rows"] = (
    [
      ["orders", t("الطلبات", "Orders"), number],
      ["revenue", t("إيرادات الطلبات", "Order revenue"), money],
      ["average", t("متوسط قيمة الطلب", "Average order value"), money],
    ] as const
  ).map(([key, metric, format]) => {
    const [last, previous] = [weeks.last[key], weeks.previous[key]];
    const direction =
      last > previous ? "up" : last < previous ? "down" : "flat";
    return {
      id: key,
      metric,
      change: [
        previous > 0 && percent.format(Math.abs(last / previous - 1)),
        t(
          `من ${format(previous)} إلى ${format(last)}`,
          `from ${format(previous)} to ${format(last)}`,
        ),
      ]
        .filter(Boolean)
        .join(" · "),
      direction,
      tone:
        direction === "up" ? "good" : direction === "down" ? "bad" : "neutral",
      series: weeks.series[key],
    };
  });
  const range = `${new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${orders.start}T00:00:00Z`))} – ${new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${orders.end}T00:00:00Z`))}`;
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
    { id: "overview", label: t("نظرة عامة", "Overview"), icon: Home },
    { id: "orders", label: t("الطلبات", "Orders"), icon: ShoppingBag },
    { id: "customers", label: t("العملاء", "Customers"), icon: Users },
  ];
  function navigation(mobile: boolean) {
    return (
      <Sidebar
        className={mobile ? "dashboard-sheet-sidebar" : "dashboard-sidebar"}
        aria-label={t("مساحة العملاء", "Customer workspace")}
        collapsed={mobile ? false : collapsed}
        onCollapsedChange={setCollapsed}
      >
        <SidebarHeader>
          <SidebarIdentity>
            <span className="dashboard-mark" aria-hidden="true">
              ✳
            </span>
            <SidebarLabel className="dashboard-sidebar-copy">
              <span>{t("طِراز", "Tiraz")}</span>
              {!mobile && (
                <small>{t("مساحة العملاء", "Customer workspace")}</small>
              )}
            </SidebarLabel>
          </SidebarIdentity>
          {!mobile && (
            <SidebarToggle
              collapseLabel={t("طيّ القائمة الجانبية", "Collapse navigation")}
              expandLabel={t("توسيع القائمة الجانبية", "Expand navigation")}
            />
          )}
        </SidebarHeader>
        <SidebarContent
          aria-label={t("أقسام لوحة العملاء", "Dashboard navigation")}
        >
          <SidebarGroup>
            {navItems.map((item) => (
              <SidebarItem
                key={item.id}
                href={`#${item.id}`}
                label={item.label}
                icon={<item.icon size={18} />}
                active={activeSection === item.id}
                onClick={(event) => {
                  if (
                    event.defaultPrevented ||
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  )
                    return;
                  setActiveSection(item.id);
                  if (mobile) {
                    pendingDestination.current = item.id;
                    setNavOpen(false);
                  } else
                    requestAnimationFrame(() =>
                      document.getElementById(item.id)?.focus(),
                    );
                }}
              />
            ))}
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarIdentity>
            <Avatar
              name={t("مساحة العملاء", "Customer workspace")}
              fallback={t("ط", "T")}
              decorative
            />
            <SidebarLabel>{t("بيانات تجريبية", "Sample data")}</SidebarLabel>
          </SidebarIdentity>
        </SidebarFooter>
      </Sidebar>
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
          "سيظهر عملاؤك هنا. اختر «إضافة عميل» لتبدأ.",
          "The directory is empty. Add your first customer using Create customer.",
        )}
        illustration={<NoRecordsIllustration />}
      />
    ) : (
      <EmptyState
        title={t("لا توجد نتائج مطابقة", "No matching customers")}
        description={t(
          "جرّب اسمًا آخر أو امسح التصفية.",
          "Try another name or clear your filters.",
        )}
        illustration={<NoSearchResultsIllustration />}
      />
    );
  const ExitArrow = language === "ar" ? ArrowUpLeft : ArrowUpRight;
  return (
    <div className="dashboard">
      <a className="dashboard-skip" href="#overview">
        {t("انتقل إلى المحتوى", "Skip to content")}
      </a>
      {navigation(false)}
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
        <div className="dashboard-header-actions">
          <div className="dashboard-mobile-nav">
            <Sheet
              open={navOpen}
              onOpenChange={setNavOpen}
              title={t("الأقسام", "Navigation")}
              description={t(
                "انتقل إلى قسم في لوحة العملاء.",
                "Go to a section in the customer dashboard.",
              )}
              closeLabel={t("إغلاق القائمة", "Close navigation")}
              trigger={
                <Button
                  variant="ghost"
                  iconOnly
                  aria-label={t("فتح القائمة", "Open navigation")}
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
                {t(
                  "كل ما يخص عملاءك في مكان واحد.",
                  "Everything, in one place.",
                )}
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
                "في الذاكرة فقط · تعود البيانات الأصلية عند إعادة التحميل",
                "In memory only · reload restores the sample",
              )}
            </span>
          </div>
          <div className="dashboard-changes">
            <ChangeSummary
              headingLevel={2}
              status={
                preview === "loading"
                  ? "updating"
                  : preview === "error"
                    ? "failed"
                    : "ready"
              }
              rows={changes}
              basedOn={t(
                `آخر ${number(7)} أيام مقابل ${number(7)} أيام قبلها`,
                `The last ${number(7)} days against the ${number(7)} before`,
              )}
              onRefresh={() => changePreview("sample")}
            />
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
                value: new Intl.NumberFormat(locale, {
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
                  "معاينة لحالة التحميل، ولا يجري أي طلب فعلي.",
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
                "هذه معاينة لحالة الخطأ. اختر «إعادة المحاولة» لاستعادة البيانات التجريبية.",
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
                <h3>{t("حركة الطلبات", "Orders trend")}</h3>
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
                    `${number(orders.count)} طلبًا خلال ${range}. تمثّل كل نقطة إجمالي طلبات يوم واحد.`,
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
          <FilterBar
            className="dashboard-filters"
            label={t("تصفية العملاء", "Customer filters")}
            disabled={blocked}
            search={
              <Input
                ref={searchRef}
                type="search"
                aria-label={t(
                  "ابحث عن عميل بالاسم أو البريد",
                  "Search customers by name or email",
                )}
                placeholder={t(
                  "ابحث بالاسم أو البريد…",
                  "Search name or email…",
                )}
                disabled={blocked}
                value={query}
                onChange={(event) => {
                  setQuery(event.currentTarget.value);
                  setSpotlightId(null);
                }}
              />
            }
            filters={[
              ...(query
                ? [
                    {
                      id: "query",
                      label: query,
                      removeLabel: t("إزالة البحث", "Remove customer search"),
                      onRemove: () => {
                        setQuery("");
                        setSpotlightId(null);
                      },
                    },
                  ]
                : []),
              ...(status !== "all"
                ? [
                    {
                      id: "status",
                      label:
                        status === "active"
                          ? t("نشط", "Active")
                          : t("متوقف", "Paused"),
                      removeLabel: t("إزالة الحالة", "Remove customer status"),
                      onRemove: () => {
                        setStatus("all");
                        setSpotlightId(null);
                      },
                    },
                  ]
                : []),
              ...(spotlightId !== null
                ? [
                    {
                      id: "spotlight",
                      label: t("العميل الجديد", "New customer"),
                      removeLabel: t(
                        "إزالة تحديد العميل",
                        "Remove customer spotlight",
                      ),
                      onRemove: () => setSpotlightId(null),
                    },
                  ]
                : []),
            ]}
            onClearAll={clearFilters}
            clearLabel={t("مسح التصفية", "Clear filters")}
          >
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
          </FilterBar>
          {hiddenNew && !blocked && (
            <Alert
              title={t(
                "التصفية الحالية تُخفي العميل الجديد.",
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
                "تعرض الآن العميل الجديد فقط. امسح التصفية لعرض الجميع.",
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
                { value: "sample", label: t("بيانات تجريبية", "Sample") },
                { value: "loading", label: t("جارٍ التحميل", "Loading") },
                { value: "empty", label: t("بلا بيانات", "Empty dataset") },
                { value: "error", label: t("خطأ", "Error") },
              ]}
            />
          </div>
        </footer>
      </main>
    </div>
  );
}
