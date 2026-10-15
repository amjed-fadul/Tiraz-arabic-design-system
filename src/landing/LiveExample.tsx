import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  AreaChart,
  Badge,
  Tabs,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../system";

export function LiveExample({ ar }: { ar: boolean }) {
  const [period, setPeriod] = useState("week");
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
        <div className="lp-demo-grid">
          <div className="lp-demo-analytics">
            <span className="lp-eyebrow">
              {ar ? "إجمالي الطلبات" : "TOTAL ORDERS"}
            </span>
            <div className="lp-order-value">
              <strong data-testid="order-total">{number.format(total)}</strong>
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
            <a className="lp-primary-link" href="./examples/dashboard">
              {ar ? "افتح مثال لوحة العملاء" : "Open the customer dashboard"}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
