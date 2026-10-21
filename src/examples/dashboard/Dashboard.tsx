import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowUpLeft,
  ArrowUpRight,
  Inbox,
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
  DataAnswer,
  DataTable,
  DecisionInbox,
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
  Tray,
  defaultConfig,
  numberLocale,
  useSystem,
} from "../../system";
import type {
  ApprovalDecision,
  ApprovalDetails,
  ApprovalRequest,
  ChangeSummaryProps,
  DataAnswerChart,
  DataAnswerProps,
  DataTableColumn,
  DecisionInboxItem,
  SourceReference,
} from "../../system";
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
// Ask your data follows the preview switch.
const askStatus: Record<Preview, DataAnswerProps["status"]> = {
  sample: "completed",
  loading: "thinking",
  empty: "empty",
  error: "failed",
};
// The customer assistant's requests are about two sample customers: Madar
// Technology, and Layla Ahmed, who is paused.
const [madar, layla] = sampleCustomers;
/** Stands in for your server: a decision is recorded after a moment. */
function recorded(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, 600);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Cancelled", "AbortError"));
      },
      { once: true },
    );
  });
}
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
// The docs show this page in an iframe of ?embed=1[&lang=en][&theme=dark]. The
// language and theme start from the address, standalone too; embedded, the
// docs page owns both buttons and is the page a link to "/" would nest.
function readAddress() {
  const params = new URLSearchParams(window.location.search);
  return {
    language: params.get("lang") === "en" ? "en" : "ar",
    theme: params.get("theme") === "dark" ? "dark" : "light",
    embedded: params.has("embed"),
  } as const;
}
export function Dashboard() {
  const [address] = useState(readAddress);
  const [language, setLanguage] = useState<"ar" | "en">(address.language);
  const [theme, setTheme] = useState<"light" | "dark">(address.theme);
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
            embedded={address.embedded}
            onLanguage={() => setLanguage(language === "ar" ? "en" : "ar")}
            onTheme={() => setTheme(theme === "light" ? "dark" : "light")}
          />
        </ToastProvider>
      </SystemProvider>
    </div>
  );
}

/** A chart on the pattern cards' tray and paper, its title on the tray. */
function ChartCard({
  title,
  busy,
  children,
}: {
  title: string;
  busy: boolean;
  children: ReactNode;
}) {
  return (
    <article className="dashboard-card" aria-busy={busy || undefined}>
      <Tray header={<h3 className="dashboard-card-title">{title}</h3>}>
        {children}
      </Tray>
    </article>
  );
}

function DashboardContent({
  language,
  theme,
  embedded,
  onLanguage,
  onTheme,
}: {
  language: "ar" | "en";
  theme: "light" | "dark";
  embedded: boolean;
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
  // The inbox's decisions and the chart type the person chose for the answer.
  const [decisions, setDecisions] = useState<Record<string, ApprovalDecision>>(
    {},
  );
  const [answerChart, setAnswerChart] = useState<"bar" | "donut">("bar");
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
      setDecisions({});
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
  // The money rows name their unit once, so each pill keeps to one line in a
  // card about 360px wide, in both languages.
  const whole = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const changes: ChangeSummaryProps["rows"] = (
    [
      ["orders", t("الطلبات", "Orders")],
      ["revenue", t("إيرادات الطلبات (د.إ.)", "Order revenue (AED)")],
      ["average", t("متوسط قيمة الطلب (د.إ.)", "Average order value (AED)")],
    ] as const
  ).map(([key, metric]) => {
    const [last, previous] = [weeks.last[key], weeks.previous[key]];
    const direction =
      last > previous ? "up" : last < previous ? "down" : "flat";
    return {
      id: key,
      metric,
      change: [
        previous > 0 && percent.format(Math.abs(last / previous - 1)),
        t(
          `من ${whole.format(previous)} إلى ${whole.format(last)}`,
          `from ${whole.format(previous)} to ${whole.format(last)}`,
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
  // Ask your data: how much revenue each channel brought in this period, beside
  // the donut of its orders. The chart, its caption, the two sentences and their
  // citation all come from the same figures; the host reshapes them for the
  // type the person picked.
  const figures = channels.map((channel) => ({
    ...channel,
    value: orders.channelRevenue[channel.key],
  }));
  const share = (value: number) =>
    percent.format(orders.revenue ? value / orders.revenue : 0);
  const [leading] = [...figures].sort((a, b) => b.value - a.value);
  const rest = orders.revenue - leading.value;
  const explanation = t(
    `جلب ${leading.label} ${money(leading.value)}، أي ${share(leading.value)} من إيرادات هذه الفترة. [1] أما القناتان الأخريان فجلبتا معًا ${money(rest)}، أي النسبة الباقية ${share(rest)}. [1]`,
    `${leading.label} brought in ${money(leading.value)}, ${share(leading.value)} of this period's revenue. [1] The other two channels brought in ${money(rest)} between them, the remaining ${share(rest)}. [1]`,
  );
  const ordersTable: SourceReference = {
    id: "orders",
    number: 1,
    title: t("الطلبات", "Orders"),
    description: t(
      "طلبات الفترة وقيمها، حسب القناة.",
      "The period's orders and their amounts, by channel.",
    ),
  };
  // The unit is named once, so the axis and the caption carry plain figures.
  const revenueUnit = t("الإيرادات (د.إ.)", "Revenue (AED)");
  const caption = `${revenueUnit}: ${figures
    .map((channel) => `${channel.label} ${number(channel.value)}`)
    .join(t("، ", ", "))}.`;
  const answerCharts: Record<"bar" | "donut", DataAnswerChart> = {
    bar: {
      type: "bar",
      props: {
        label: t("إيرادات كل قناة", "Revenue per channel"),
        summary: caption,
        locale: language,
        height: 220,
        data: figures.map((channel) => ({
          category: channel.label,
          revenue: channel.value,
        })),
        series: [
          { key: "revenue", label: revenueUnit, color: "var(--action)" },
        ],
      },
    },
    donut: {
      type: "donut",
      props: {
        label: t("حصة كل قناة من الإيرادات", "Each channel's share of revenue"),
        summary: caption,
        locale: language,
        height: 220,
        data: figures,
        legend: true,
        interactiveLegend: false,
      },
    },
  };
  // The Decision inbox: two requests from the customer assistant. The
  // reactivation is reversible, so its row decides without opening; a reminder
  // can't be recalled once sent, so it opens into the full request.
  const assistant = {
    id: "customer-assistant",
    name: t("مساعد العملاء", "Customer assistant"),
  };
  const requests: { request: ApprovalRequest; approval: ApprovalDetails }[] = [
    {
      request: {
        id: "reactivate-layla",
        action: t(
          "إعادة تفعيل حساب ليلى أحمد",
          "Reactivate Layla Ahmed's account",
        ),
        target: `${layla.name} · ${layla.email}`,
        consequences: [
          t(
            "تعود ليلى أحمد إلى دليل العملاء بحالة نشطة.",
            "Layla Ahmed is active in the customer directory again.",
          ),
        ],
        approveLabel: t("أعد التفعيل", "Reactivate"),
        rejectLabel: t("رفض", "Reject"),
      },
      approval: { reversible: true },
    },
    {
      request: {
        id: "remind-madar",
        action: t(
          "إرسال تذكير بالدفع إلى شركة مدار للتقنية",
          "Send a payment reminder to Madar Technology",
        ),
        target: `${madar.name} · ${madar.email}`,
        consequences: [
          t(
            "يصل إلى شركة مدار بريد تذكير واحد بالدفع.",
            "Madar Technology receives one payment reminder email.",
          ),
        ],
        approveLabel: t("أرسل التذكير", "Send the reminder"),
        rejectLabel: t("رفض", "Reject"),
      },
      approval: { irreversible: true },
    },
  ];
  const inboxItems = requests.map(
    ({ request, approval }): DecisionInboxItem => {
      const decision = decisions[request.id];
      return {
        id: request.id,
        title: request.action,
        agent: assistant,
        status: decision ? "completed" : "needs-you",
        // A receipt says what was decided, never more.
        receipt:
          decision &&
          (decision === "approved"
            ? t("تمت الموافقة · الآن", "Approved · just now")
            : t("رُفض الطلب · الآن", "Request rejected · just now")),
        request,
        approval,
      };
    },
  );
  // Requests that wait on the person, failed tasks included.
  const waiting = inboxItems.filter(
    (item) => item.status === "needs-you" || item.status === "failed",
  ).length;
  // Record the decision after the host's moment. An aborted one (Escape, or the
  // Sheet closing) throws first, so nothing is recorded or changed.
  async function decide(
    request: ApprovalRequest,
    decision: ApprovalDecision,
    { signal }: { signal: AbortSignal },
  ) {
    await recorded(signal);
    setDecisions((current) => ({ ...current, [request.id]: decision }));
    // Approving the reactivation makes her active in the directory, in memory.
    if (request.id === "reactivate-layla" && decision === "approved")
      setCustomers((current) =>
        current.map((customer) =>
          customer.id === layla.id
            ? { ...customer, status: "active" }
            : customer,
        ),
      );
  }
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
          <Sheet
            title={t("صندوق القرارات", "Decision inbox")}
            description={t(
              "طلبات مساعد العملاء التي تنتظر قرارك.",
              "Requests from the customer assistant that wait for your decision.",
            )}
            closeLabel={t("إغلاق صندوق القرارات", "Close decision inbox")}
            trigger={
              <Button
                variant="ghost"
                className="dashboard-inbox"
                aria-label={t(
                  `صندوق القرارات، بانتظارك: ${number(waiting)}`,
                  `Decision inbox, needs you: ${number(waiting)}`,
                )}
              >
                <Inbox size={17} aria-hidden="true" />
                <span className="dashboard-inbox-label">
                  {t("صندوق القرارات", "Decision inbox")}
                </span>{" "}
                {/* The badge says what the name says, so the button's visible
                    text sits inside its name; a phone keeps only the count. */}
                <Badge tone={waiting > 0 ? "warning" : "neutral"}>
                  <span className="dashboard-inbox-word">
                    {t("بانتظارك: ", "Needs you: ")}
                  </span>
                  {number(waiting)}
                </Badge>
              </Button>
            }
          >
            <DecisionInbox
              items={inboxItems}
              onDecision={decide}
              // The Sheet already says «صندوق القرارات».
              title={t("طلبات المساعد", "Assistant requests")}
              appearance="plain"
              headingLevel={3}
            />
          </Sheet>
          {!embedded && (
            <>
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
            </>
          )}
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
          {/* Each figure is a card like the patterns': its name on the tray,
              the figure on paper, the note on the tray. The list keeps its
              name–value pairs, so it takes the tray's classes, not Tray. */}
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
                value: money(orders.revenue),
                note: range,
              },
              {
                key: "average-order",
                label: t("متوسط قيمة الطلب", "Average order value"),
                value: money(orders.count ? orders.revenue / orders.count : 0),
                note: range,
              },
            ].map((metric) => (
              <div key={metric.key} className="tz-tray dashboard-metric">
                <dt className="tz-tray-header">{metric.label}</dt>
                <dd
                  className="tz-tray-paper dashboard-metric-value"
                  data-testid={metric.key}
                >
                  {preview === "loading" ? (
                    <Skeleton className="dashboard-metric-skeleton" />
                  ) : blocked ? (
                    "—"
                  ) : (
                    metric.value
                  )}
                </dd>
                <dd className="tz-tray-footer dashboard-metric-note">
                  {metric.note}
                </dd>
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
          {/* Two rows of cards across the column: the trend beside What
              changed, then the channels' orders beside their revenue. The
              error preview drops the charts, and a pattern left alone takes
              its whole row. */}
          <div className="dashboard-row dashboard-row-trend">
            {preview !== "error" && (
              <ChartCard
                title={t("حركة الطلبات", "Orders trend")}
                busy={preview === "loading"}
              >
                {preview === "loading" ? (
                  <Skeleton
                    shape="rectangle"
                    className="dashboard-chart-skeleton"
                  />
                ) : (
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
                )}
              </ChartCard>
            )}
            <ChangeSummary
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
          <div className="dashboard-row dashboard-row-split">
            {preview !== "error" && (
              <ChartCard
                title={t("توزيع القنوات", "Channel distribution")}
                busy={preview === "loading"}
              >
                {preview === "loading" ? (
                  <Skeleton
                    shape="rectangle"
                    className="dashboard-chart-skeleton"
                  />
                ) : (
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
                    // Taller than the trend: the ring fills its card beside
                    // the answer instead of floating in it.
                    height={280}
                    legend
                    interactiveLegend={false}
                    dataTable
                  />
                )}
              </ChartCard>
            )}
            <DataAnswer
              status={askStatus[preview]}
              question={t(
                "كم جلبت كل قناة من الإيرادات هذه الفترة؟",
                "How much revenue did each channel bring in this period?",
              )}
              chart={answerCharts[answerChart]}
              explanation={explanation}
              sources={[ordersTable]}
              method={{ range, filters: t("كل القنوات", "All channels") }}
              // The loading preview shows the answer mid-way, with its steps.
              thinking={
                preview === "loading"
                  ? {
                      elapsed: 2,
                      searched: [ordersTable],
                      steps: [
                        {
                          id: "read",
                          label: t(
                            "قراءة طلبات الفترة",
                            "Read the period's orders",
                          ),
                          state: "completed",
                        },
                        {
                          id: "add",
                          label: t(
                            "جمع الإيرادات حسب القناة",
                            "Add up the revenue by channel",
                          ),
                          state: "running",
                        },
                      ],
                    }
                  : undefined
              }
              chartTypes={["bar", "donut"]}
              onChartTypeChange={(type) =>
                setAnswerChart(type === "donut" ? "donut" : "bar")
              }
              onRetry={() => changePreview("sample")}
              error={t(
                "هذه معاينة لحالة الخطأ، ولا يجري أي طلب فعلي.",
                "This is an error preview; no request is running.",
              )}
            />
          </div>
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
          {!embedded && (
            <a href="/">
              {t("توثيق طِراز", "Tiraz documentation")}
              <ExitArrow size={14} aria-hidden="true" />
            </a>
          )}
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
