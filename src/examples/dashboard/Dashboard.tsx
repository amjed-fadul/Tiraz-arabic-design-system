import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import {
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
  Tray,
} from "../../system";
import type {
  ApprovalDecision,
  ApprovalDetails,
  ApprovalRequest,
  ChangeSummaryProps,
  DataAnswerChart,
  DataTableColumn,
  DecisionInboxItem,
  SourceReference,
} from "../../system";
import { ScreenFrame, ScreenHeader } from "../frame/ScreenFrame";
import { useScreenAgentPresentation } from "../frame/useScreenAgentPresentation";
import { recorded, useScreen } from "../frame/screen";
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
import { useScreenDemo } from "../frame/useScreenDemo";

// The customer assistant has requests for Madar Technology and Layla Ahmed.
const [madar, layla] = sampleCustomers;
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
  return (
    <ScreenFrame slug="dashboard">
      <DashboardContent />
    </ScreenFrame>
  );
}

/** A chart on the pattern cards' tray and paper, its title on the tray. */
function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="dashboard-card">
      <Tray header={<h3 className="dashboard-card-title">{title}</h3>}>
        {children}
      </Tray>
    </article>
  );
}

function DashboardContent() {
  const demo = useScreenDemo();
  const answerAgent = useScreenAgentPresentation(
    "customer",
    demo.active ? "thinking" : "done",
  );
  const agentPresentation = useScreenAgentPresentation(
    "customer",
    demo.active ? "working" : "done",
  );
  const { t, language, locale, number } = useScreen();
  const [inboxOpen, setInboxOpen] = useState(false);
  const [period, setPeriod] = useState<Period>(7);
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
  const nextId = useRef(sampleCustomers.length + 1);
  const searchRef = useRef<HTMLInputElement>(null);
  const orders = calculateOrders(sampleOrders, period);
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
  // What changed: up is good for all three, so more is green and less is red.
  const weeks = weekOverWeek(sampleOrders);
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
    customers.length === 0 ? (
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
  return (
    <div className="dashboard">
      <section id="overview" aria-label={t("نظرة عامة", "Overview")}>
        <ScreenHeader
          title={t(
            "كل ما يخص عملاءك في مكان واحد.",
            "Everything, in one place.",
          )}
          description={t(
            "تابع الطلبات وابقَ قريبًا من عملائك.",
            "Follow your orders. Stay close to your customers.",
          )}
          actions={
            <>
              <Sheet
                open={inboxOpen}
                onOpenChange={setInboxOpen}
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
                      `صندوق القرارات ${number(waiting)}، بانتظارك`,
                      `Decision inbox ${number(waiting)}, needs you`,
                    )}
                  >
                    <Inbox size={17} aria-hidden="true" />
                    <span className="dashboard-inbox-label">
                      {t("صندوق القرارات", "Decision inbox")}
                    </span>{" "}
                    <Badge tone={waiting > 0 ? "warning" : "neutral"}>
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
              <CreateCustomer
                language={language}
                disabled={false}
                onCreate={(draft) => {
                  const customer = { ...draft, id: nextId.current++ };
                  setCustomers((previous) => [customer, ...previous]);
                  setNewCustomer(customer);
                }}
              />
            </>
          }
        />
        <dl className="dashboard-metrics">
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
            <div key={metric.key} className="dashboard-metric">
              <dt className="dashboard-metric-label">{metric.label}</dt>
              <dd className="dashboard-metric-value" data-testid={metric.key}>
                {metric.value}
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
            <h2 id="orders-title">{t("أداء الطلبات", "Order performance")}</h2>
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
        {/* Pair each chart with the insight drawn from the same orders. */}
        <div className="dashboard-row dashboard-row-trend">
          <ChartCard title={t("حركة الطلبات", "Orders trend")}>
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
          </ChartCard>

          <ChangeSummary
            agentPresentation={agentPresentation}
            announcement="off"
            status={demo.active ? "updating" : "ready"}
            rows={changes}
            basedOn={t(
              `آخر ${number(7)} أيام مقابل ${number(7)} أيام قبلها`,
              `The last ${number(7)} days against the ${number(7)} before`,
            )}
          />
        </div>
        <div className="dashboard-row dashboard-row-split">
          <ChartCard title={t("توزيع القنوات", "Channel distribution")}>
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
          </ChartCard>
          <DataAnswer
            agentPresentation={answerAgent}
            announcement={inboxOpen || newCustomer ? "off" : "polite"}
            status={demo.active ? "thinking" : "completed"}
            question={t(
              "كم جلبت كل قناة من الإيرادات هذه الفترة؟",
              "How much revenue did each channel bring in this period?",
            )}
            chart={answerCharts[answerChart]}
            explanation={explanation}
            sources={[ordersTable]}
            method={{ range, filters: t("كل القنوات", "All channels") }}
            chartTypes={["bar", "donut"]}
            onChartTypeChange={(type) =>
              setAnswerChart(type === "donut" ? "donut" : "bar")
            }
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
            {t(
              `${number(customers.length)} عميل في الدليل`,
              `${number(customers.length)} in the directory`,
            )}
          </span>
        </header>
        <FilterBar
          className="dashboard-filters"
          label={t("تصفية العملاء", "Customer filters")}
          search={
            <Input
              ref={searchRef}
              type="search"
              aria-label={t(
                "ابحث عن عميل بالاسم أو البريد",
                "Search customers by name or email",
              )}
              placeholder={t("ابحث بالاسم أو البريد…", "Search name or email…")}
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
        {hiddenNew && (
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
          announcement="off"
          data={filtered}
          columns={columns}
          getRowId={(customer) => customer.id}
          caption={t("دليل العملاء", "Customer directory")}
          locale={language}
          pageSize={6}
          resetKey={JSON.stringify([query, status, spotlightId])}
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
                `${number(from)}–${number(to)} من ${number(total)} عميل`,
                `${number(from)}–${number(to)} of ${number(total)} customers`,
              ),
          }}
        />
      </section>
    </div>
  );
}
