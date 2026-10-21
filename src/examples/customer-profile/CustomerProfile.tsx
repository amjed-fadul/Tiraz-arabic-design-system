import { useEffect, useRef, useState } from "react";
import { CalendarCheck, Mail, ReceiptText } from "lucide-react";
import {
  Avatar,
  Badge,
  Breadcrumbs,
  Card,
  CardContent,
  CardHeader,
  DataAnswer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TaskStarter,
  Tabs,
  Timeline,
} from "../../system";
import type {
  ContextItem,
  DataAnswerChart,
  SourceReference,
  TimelineItem,
} from "../../system";
import { story } from "../../system/ai/examples/finance-story";
import { ScreenFrame, ScreenHeader } from "../frame/ScreenFrame";
import { today, useScreen } from "../frame/screen";
import { dayCount, invoiceCount, lateInvoices } from "../invoices/words";
import { daysLate } from "../invoices/invoice";
import {
  customer,
  customerInvoices,
  daysLateByMonth,
  issued,
  promise,
  reminder,
} from "./data";
import "./customer-profile.css";

// How long the host takes over the answer, and the screen's one question.
const thinkingMs = 1400;

export function CustomerProfile() {
  return (
    <ScreenFrame slug="customer-profile">
      <CustomerProfileScreen />
    </ScreenFrame>
  );
}

function CustomerProfileScreen() {
  const screen = useScreen();
  const { t, language, locale, number, money, date, href } = screen;
  const name = customer.name[language];
  const question = t(
    "كم تأخّرت مدار في السداد كل شهر هذا العام؟",
    "How late was Madar in paying each month this year?",
  );

  // Start a task: the draft, and the customer attached as a record.
  const [draft, setDraft] = useState("");
  const [attached, setAttached] = useState(true);
  const madar: ContextItem = {
    id: customer.id,
    label: name,
    kind: t("عميل", "Customer"),
  };
  // Ask your data: the answer rests on completed, and sending a question asks
  // it again, so it thinks for a moment first. The host's timer clears when it
  // is superseded and when the screen goes.
  const [answer, setAnswer] = useState<"thinking" | "completed">("completed");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const asking = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(asking.current), []);
  function ask() {
    clearTimeout(asking.current);
    setAnswer("thinking");
    asking.current = setTimeout(() => setAnswer("completed"), thinkingMs);
  }

  const owed = customerInvoices.reduce(
    (total, invoice) => total + invoice.amount,
    0,
  );
  const late = customerInvoices.filter((invoice) => daysLate(invoice) > 0);
  const oldest = customerInvoices.reduce((first, invoice) =>
    invoice.due < first.due ? invoice : first,
  );

  const facts = [
    [
      t("المبلغ المستحق", "Amount owed"),
      `${money(owed)} · ${t("في ", "in ")}${invoiceCount(screen, customerInvoices.length)}`,
    ],
    [
      t("أقدم استحقاق", "Oldest due date"),
      t(
        `${date(oldest.due)} · متأخرة ${dayCount(screen, daysLate(oldest))}`,
        `${date(oldest.due)} · ${dayCount(screen, daysLate(oldest))} late`,
      ),
    ],
    [t("جهة الاتصال", "Contact"), customer.contact[language]],
    [
      t("البريد الإلكتروني", "Email"),
      <bdi key="email" dir="ltr">
        {customer.email}
      </bdi>,
    ],
    [
      t("شروط الدفع", "Payment terms"),
      t(
        `خلال ${dayCount(screen, customer.terms)} من تاريخ الفاتورة`,
        `${dayCount(screen, customer.terms)} from the invoice date`,
      ),
    ],
    [t("مسؤول الحساب", "Account owner"), story.user[language]],
  ] as const;

  // Oldest first, in the order things happened.
  const activity: TimelineItem[] = [
    ...customerInvoices.map((invoice) => ({
      id: `issued-${invoice.id}`,
      title: (
        <>
          {t("صدرت الفاتورة ", "Invoice ")}
          <bdi dir="ltr">{invoice.id}</bdi>
          {t("", " issued")}
        </>
      ),
      description: t(
        `${money(invoice.amount)} · تستحق في ${date(invoice.due)}`,
        `${money(invoice.amount)} · due ${date(invoice.due)}`,
      ),
      timestamp: date(issued[invoice.id]),
      dateTime: issued[invoice.id],
      icon: <ReceiptText />,
    })),
    {
      id: "reminder",
      title: t("أُرسل أول تذكير بالسداد", "First payment reminder sent"),
      description: (
        <>
          {t("إلى ", "To ")}
          {customer.contact[language]}
          {t("، بشأن ", ", about ")}
          <bdi dir="ltr">{reminder.invoice}</bdi>
        </>
      ),
      timestamp: date(reminder.on),
      dateTime: reminder.on,
      icon: <Mail />,
    },
    {
      id: "promise",
      title: t(
        `وعدت ${customer.contact.ar} بالسداد قبل ${date(promise.before)}`,
        `${customer.contact.en} promised to pay before ${date(promise.before)}`,
      ),
      description: t(
        "ردًّا على التذكير الأول",
        "In reply to the first reminder",
      ),
      timestamp: date(promise.on),
      dateTime: promise.on,
      icon: <CalendarCheck />,
    },
  ];

  // Ask your data: the late days of each month, as bars or as a line. The
  // chart's caption, the two sentences and their citations share the figures.
  const months = daysLateByMonth.map((_, index) =>
    new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(
      new Date(Date.UTC(2026, index, 1)),
    ),
  );
  const first = daysLateByMonth[0];
  const last = daysLateByMonth[daysLateByMonth.length - 1];
  const unit = t("أيام التأخير", "Days late");
  const shared = {
    label: t("أيام تأخّر مدار كل شهر", "Madar's days late each month"),
    summary: `${unit}: ${months
      .map((month, index) => `${month} ${number(daysLateByMonth[index])}`)
      .join(t("، ", ", "))}.`,
    locale: language,
    height: 200,
    numberFormat: { maximumFractionDigits: 0 },
    data: months.map((category, index) => ({
      category,
      days: daysLateByMonth[index],
    })),
    series: [{ key: "days", label: unit }],
  };
  const charts: Record<"bar" | "line", DataAnswerChart> = {
    bar: { type: "bar", props: shared },
    line: { type: "line", props: shared },
  };
  const [, invoicesSource, , agingSource] = story.sources;
  const invoiceTable: SourceReference = {
    id: invoicesSource.id,
    number: invoicesSource.number,
    title: invoicesSource.title[language],
    description: t(
      "فواتير شركة مدار وتواريخ سدادها منذ يناير.",
      "Madar's invoices and the dates they were paid, since January.",
    ),
  };
  const agingTable: SourceReference = {
    id: agingSource.id,
    number: agingSource.number,
    title: agingSource.title[language],
    description: t(
      "المتأخرات حسب العميل، مع أعمارها.",
      "Overdue amounts by customer, with their ages.",
    ),
  };
  const explanation = t(
    `ارتفع تأخّر مدار من ${dayCount(screen, first)} في يناير إلى ${dayCount(screen, last)} في أكتوبر، وهو الأعلى هذا العام. [2] وتتصدّر مدار المتأخرات بمبلغ ${money(owed)} من أصل ${money(story.overdue.amount)}. [4]`,
    `Madar's delay rose from ${dayCount(screen, first)} in January to ${dayCount(screen, last)} in October, the highest this year. [2] Madar also leads the overdue list with ${money(owed)} of ${money(story.overdue.amount)}. [4]`,
  );

  return (
    <>
      <Breadcrumbs
        className="customer-profile-crumbs"
        label={t("مسار التنقل", "Breadcrumb")}
        items={[
          {
            label: t("الفواتير والتحصيل", "Invoices and collections"),
            href: href("invoices"),
          },
          { label: name },
        ]}
      />
      <ScreenHeader
        title={
          <span className="customer-profile-title">
            <Avatar name={name} size="md" decorative />
            <bdi>{name}</bdi>
          </span>
        }
        description={`${t(`${money(owed)} مستحقة`, `${money(owed)} owed`)} · ${lateInvoices(screen, late.length)} · ${t("جهة الاتصال", "Contact")}: ${customer.contact[language]}`}
      />
      <div className="customer-profile">
        <div className="customer-profile-main">
          <Tabs
            label={t("أقسام ملف العميل", "Customer sections")}
            items={[
              {
                value: "overview",
                label: t("نظرة عامة", "Overview"),
                content: (
                  <div className="customer-profile-tab customer-profile-overview">
                    <Card>
                      <CardHeader>
                        <h2 className="tz-card-title">
                          {t("بيانات العميل", "Customer details")}
                        </h2>
                      </CardHeader>
                      <CardContent>
                        <dl className="customer-profile-facts">
                          {facts.map(([term, value], index) => (
                            <div key={index}>
                              <dt>{term}</dt>
                              <dd>{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <h2 className="tz-card-title">
                          {t("النشاط", "Activity")}
                        </h2>
                      </CardHeader>
                      <CardContent>
                        <Timeline
                          label={t("سجل نشاط العميل", "Customer activity")}
                          items={activity}
                        />
                      </CardContent>
                    </Card>
                  </div>
                ),
              },
              {
                value: "invoices",
                label: t("الفواتير", "Invoices"),
                content: (
                  <div className="customer-profile-tab">
                    <Table
                      caption={t(
                        `فواتير ${customer.name.ar}`,
                        `${customer.name.en}'s invoices`,
                      )}
                    >
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("الفاتورة", "Invoice")}</TableHead>
                          <TableHead>{t("الصدور", "Issued")}</TableHead>
                          <TableHead>{t("الاستحقاق", "Due")}</TableHead>
                          <TableHead data-numeric="">
                            {t("المبلغ", "Amount")}
                          </TableHead>
                          <TableHead>{t("التأخير", "Overdue")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerInvoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableHead scope="row">
                              <bdi dir="ltr">{invoice.id}</bdi>
                            </TableHead>
                            <TableCell>{date(issued[invoice.id])}</TableCell>
                            <TableCell>{date(invoice.due)}</TableCell>
                            <TableCell data-numeric="">
                              {money(invoice.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                tone={
                                  daysLate(invoice) >= 15 ? "error" : "warning"
                                }
                              >
                                {dayCount(screen, daysLate(invoice))}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ),
              },
            ]}
          />
        </div>
        <Card className="customer-profile-panel">
          <CardContent>
            <TaskStarter
              title={t(
                `اسأل عن ${customer.name.ar}`,
                `Ask about ${customer.name.en}`,
              )}
              value={draft}
              onValueChange={setDraft}
              onSubmit={() => {
                setDraft("");
                ask();
              }}
              context={attached ? [madar] : []}
              onRemoveContext={() => setAttached(false)}
              mentionOptions={[madar]}
              onAddContext={() => setAttached(true)}
              suggestions={[{ id: "late-by-month", label: question }]}
              onSuggestion={() => setDraft(question)}
              headingLevel={2}
              appearance="plain"
            />
          </CardContent>
          <CardContent className="customer-profile-answer">
            <DataAnswer
              status={answer}
              question={question}
              chart={charts[chartType]}
              explanation={explanation}
              sources={[invoiceTable, agingTable]}
              method={{
                range: `${date("2026-01-01")} – ${date(today)}`,
                filters: name,
              }}
              thinking={
                answer === "thinking"
                  ? {
                      elapsed: 1,
                      searched: [invoiceTable],
                      steps: [
                        {
                          id: "read",
                          label: t(
                            "قراءة فواتير مدار",
                            "Read Madar's invoices",
                          ),
                          state: "completed",
                        },
                        {
                          id: "group",
                          label: t(
                            "حساب أيام التأخير لكل شهر",
                            "Work out the days late each month",
                          ),
                          state: "running",
                        },
                      ],
                    }
                  : undefined
              }
              chartTypes={["bar", "line"]}
              onChartTypeChange={(type) =>
                setChartType(type === "line" ? "line" : "bar")
              }
              headingLevel={2}
              appearance="plain"
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
