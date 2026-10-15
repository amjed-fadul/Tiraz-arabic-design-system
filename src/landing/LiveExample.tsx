import { useState } from "react";
import { ArrowUpRight, SlidersHorizontal } from "lucide-react";
import {
  AreaChart,
  Badge,
  Button,
  SystemProvider,
  Tabs,
  defaultConfig,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../system";
import type { SystemConfig } from "../system";

export function LiveExample({
  ar,
  theme,
}: {
  ar: boolean;
  theme: SystemConfig["theme"];
}) {
  const [period, setPeriod] = useState("week");
  const [plum, setPlum] = useState(false);
  const number = new Intl.NumberFormat(ar ? "ar-u-nu-arab" : "en");
  const rows = [120, 184, 148, 220, 192, 260].map((orders, index) => ({
    category: `2026-10-0${index + 1}`,
    orders,
  }));
  const data = period === "week" ? rows : rows.slice(-3);
  const total = data.reduce((sum, row) => sum + row.orders, 0);
  const label = ar ? "الطلبات اليومية" : "Daily orders";
  const summary = ar
    ? `بيانات تجريبية · ${number.format(total)} طلبًا خلال ${number.format(data.length)} أيام، أكتوبر ٢٠٢٦.`
    : `Sample data · ${number.format(total)} orders over ${data.length} days, October 2026.`;
  const content = (
    <div className="lp-chart">
      <AreaChart
        data={data}
        series={[{ key: "orders", label }]}
        label={label}
        summary={summary}
        locale={ar ? "ar" : "en"}
        categoryFormat="date"
        height={205}
        dataTable
      />
    </div>
  );
  return (
    <SystemProvider
      config={{
        ...defaultConfig,
        theme,
        direction: ar ? "rtl" : "ltr",
        accent: plum ? "plum" : "sage",
      }}
    >
      <div className="lp-demo">
        <div className="lp-demo-toolbar">
          <span className="lp-demo-brand">
            {ar ? "مساحة العمل" : "Workspace"}
            <span className="lp-demo-slash">/</span>
            <strong>{ar ? "نظرة عامة" : "Overview"}</strong>
          </span>
          <Badge>{ar ? "بيانات تجريبية" : "Sample data"}</Badge>
        </div>
        <div className="lp-demo-body">
          <div className="lp-demo-heading">
            <div>
              <h3>
                {ar ? "كل التفاصيل، في مكانها" : "Every detail in its place"}
              </h3>
              <p>
                {ar
                  ? "جرّب تغيير الفترة أو لون الواجهة."
                  : "Change the period or try another accent."}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setPlum(!plum)}
              aria-pressed={plum}
            >
              <SlidersHorizontal size={14} aria-hidden="true" />
              {ar ? "تغيير اللون" : "Try an accent"}
            </Button>
          </div>
          <div className="lp-demo-grid">
            <div className="lp-demo-analytics">
              <span className="lp-eyebrow">
                {ar ? "إجمالي الطلبات" : "TOTAL ORDERS"}
              </span>
              <div className="lp-order-value">
                <strong data-testid="order-total">
                  {number.format(total)}
                </strong>
                <ArrowUpRight size={20} aria-hidden="true" />
              </div>
              <Tabs
                label={ar ? "فترة الطلبات" : "Order period"}
                value={period}
                onValueChange={setPeriod}
                variant="underline"
                items={[
                  {
                    value: "week",
                    label: ar ? "كل الأيام" : "All days",
                    content,
                  },
                  {
                    value: "recent",
                    label: ar ? "آخر ٣ أيام" : "Last 3 days",
                    content,
                  },
                ]}
              />
            </div>
            <div className="lp-demo-activity">
              <h4>{ar ? "آخر الطلبات" : "Latest orders"}</h4>
              <p>
                {ar
                  ? "سجلات توضيحية مستقلة عن الرسم."
                  : "Illustrative records, separate from the chart."}
              </p>
              <Table caption={ar ? "طلبات تجريبية" : "Sample orders"}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{ar ? "العميل" : "Customer"}</TableHead>
                    <TableHead>{ar ? "الحالة" : "Status"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    [ar ? "استوديو نواة" : "Nawa Studio", "NW-024", true],
                    [ar ? "متجر أثر" : "Athar Store", "AT-018", false],
                    [ar ? "مؤسسة مدار" : "Madar Co.", "MD-031", true],
                  ].map(([name, id, done]) => (
                    <TableRow key={String(id)}>
                      <TableCell>
                        <strong>{name}</strong>
                        <small>
                          <bdi dir="ltr">{id}</bdi>
                        </small>
                      </TableCell>
                      <TableCell>
                        <Badge tone={done ? "success" : "neutral"}>
                          {done
                            ? ar
                              ? "مكتمل"
                              : "Completed"
                            : ar
                              ? "قيد التنفيذ"
                              : "In progress"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <a href="./examples/dashboard">
                {ar ? "افتح مثال لوحة العملاء" : "Open the customer dashboard"}
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
        <div className="lp-demo-caption">
          <span className="lp-dot" />
          {ar
            ? "مكوّنات طِراز الفعلية · تفاعل محلي، بلا خدمة خلفية"
            : "Actual Tiraz components · local interaction, no backend"}
        </div>
      </div>
    </SystemProvider>
  );
}
