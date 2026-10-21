import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  DataTable,
  DraftReview,
  EmptyState,
  FilterBar,
  Input,
  NoSearchResultsIllustration,
  Select,
  Sheet,
  useReducedMotion,
} from "../../system";
import type { DataTableColumn, DraftReviewProps } from "../../system";
import { story } from "../../system/ai/examples/finance-story";
import { draftReviewCopy } from "../../system/draft-review-copy";
import { ScreenFrame, ScreenHeader } from "../frame/ScreenFrame";
import { recorded, useScreen } from "../frame/screen";
import { invoices, readyReminders } from "./data";
import type { Invoice } from "./data";
import { daysLate, reminderText, statusOf } from "./invoice";
import type { InvoiceStatus } from "./invoice";
import { dayCount, invoiceCount, lateInvoices } from "./words";
import "./invoices.css";

type Status = DraftReviewProps["status"];
/** What the host keeps for one invoice's reminder. */
interface Draft {
  status: Status;
  /** Words shown so far while writing. */
  written: number;
  /** The text the person edited or sent; until then the draft is the assistant's. */
  edited?: string;
}

// How the host paces the assistant's writing, and where a draft starts.
const beatMs = 120,
  wordsPerBeat = 4;
const startingDrafts: Record<string, Draft> = Object.fromEntries(
  readyReminders.map((id) => [id, { status: "ready", written: 0 } as Draft]),
);
const wordsOf = (text: string) => text.match(/\S+\s*/gu) ?? [];

export function Invoices() {
  return (
    <ScreenFrame slug="invoices">
      <InvoicesScreen />
    </ScreenFrame>
  );
}

/** One invoice's reminder: the collections agent's draft, to review and send. */
function Reminder({
  invoice,
  draft,
  headingLevel,
  onBodyChange,
  onSend,
}: {
  invoice: Invoice;
  draft: Draft;
  headingLevel: 2 | 3;
  onBodyChange: (body: string) => void;
  onSend: (text: string) => void;
}) {
  const screen = useScreen();
  const { t, language, money } = screen;
  const text = reminderText(invoice, screen);
  const body =
    draft.status === "writing"
      ? wordsOf(text).slice(0, draft.written).join("")
      : (draft.edited ?? text);
  return (
    <DraftReview
      status={draft.status}
      title={t("تذكير بالسداد", "Payment reminder")}
      agent={story.agents.collections[language]}
      record={{
        id: invoice.id,
        customer: invoice.customer[language],
        amount: money(invoice.amount),
        overdue: t(
          `متأخرة ${dayCount(screen, daysLate(invoice))}`,
          `${dayCount(screen, daysLate(invoice))} overdue`,
        ),
      }}
      recipients={[{ id: "contact", label: invoice.contact[language] }]}
      attachments={[{ id: "pdf", label: `${invoice.id}.pdf` }]}
      body={body}
      onBodyChange={onBodyChange}
      onSend={onSend}
      headingLevel={headingLevel}
      // The panel is 20rem, so the pill's English words are shortened to leave
      // the title its line.
      labels={{
        pills: {
          ...draftReviewCopy[language].pills,
          ready: t("بانتظار مراجعتك", "To review"),
        },
      }}
      appearance="plain"
    />
  );
}

function InvoicesScreen() {
  const screen = useScreen();
  const { t, language, number, money, date, href, size, endSide } = screen;
  const reduced = useReducedMotion();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "all">("late");
  const [drafts, setDrafts] = useState(startingDrafts);
  // Wide: the invoice whose draft the end panel shows. Otherwise: the invoice
  // whose Sheet is open.
  const [selected, setSelected] = useState(readyReminders[0]);
  const [openId, setOpenId] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const sending = useRef(new Set<AbortController>());

  const late = invoices.filter((invoice) => statusOf(invoice) === "late");
  const owed = late.reduce((total, invoice) => total + invoice.amount, 0);
  const needle = query.trim().toLowerCase();
  const shown = invoices.filter(
    (invoice) =>
      (status === "all" || statusOf(invoice) === status) &&
      (!needle ||
        [invoice.id, invoice.customer.ar, invoice.customer.en]
          .join(" ")
          .toLowerCase()
          .includes(needle)),
  );

  // The assistant writes a new reminder a few words at a time, then hands it
  // over for review. Reduced motion shows it whole after one beat.
  const writing = Object.values(drafts).some((d) => d.status === "writing");
  useEffect(() => {
    if (!writing) return;
    const timer = setInterval(
      () =>
        setDrafts((current) => {
          const next = { ...current };
          for (const invoice of invoices) {
            const draft = current[invoice.id];
            if (draft?.status !== "writing") continue;
            const total = wordsOf(reminderText(invoice, screen)).length;
            const written = reduced ? total : draft.written + wordsPerBeat;
            next[invoice.id] =
              written >= total
                ? { ...draft, status: "ready", written: total }
                : { ...draft, written };
          }
          return next;
        }),
      reduced ? beatMs * 5 : beatMs,
    );
    return () => clearInterval(timer);
  }, [writing, reduced, screen]);
  // Whatever is still being sent when the screen goes records nothing.
  useEffect(() => {
    const requests = sending.current;
    return () => requests.forEach((request) => request.abort());
  }, []);

  function startDraft(id: string) {
    setDrafts((current) =>
      current[id]
        ? current
        : { ...current, [id]: { status: "writing", written: 0 } },
    );
  }
  function edit(id: string, edited: string) {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], edited },
    }));
  }
  // Stands in for your mail server: the message goes out after a moment.
  function send(id: string, text: string) {
    const settle = (next: Status) =>
      setDrafts((current) => ({
        ...current,
        [id]: { ...current[id], status: next, edited: text },
      }));
    settle("sending");
    const request = new AbortController();
    sending.current.add(request);
    recorded(request.signal)
      .then(() => settle("sent"))
      .catch(() => {})
      .finally(() => sending.current.delete(request));
  }
  // Beside the table, choosing a row puts its draft in the panel and hands the
  // panel focus, so the next Tab is the draft rather than the rest of the table.
  function choose(id: string) {
    startDraft(id);
    setSelected(id);
    requestAnimationFrame(() =>
      panel.current?.querySelector<HTMLElement>(".tz-draft-review")?.focus(),
    );
  }

  const statusWords: Record<InvoiceStatus, string> = {
    late: t("متأخرة", "Late"),
    paid: t("مدفوعة", "Paid"),
    upcoming: t("مستحقة لاحقًا", "Due later"),
  };
  const none = (words: string) => (
    <>
      <span aria-hidden="true">—</span>
      <span className="tz-visually-hidden">{words}</span>
    </>
  );
  const columns: DataTableColumn<Invoice>[] = [
    {
      id: "id",
      header: t("الفاتورة", "Invoice"),
      rowHeader: true,
      sortValue: (invoice) => invoice.id,
      cell: (invoice) => (
        <bdi className="invoices-id" dir="ltr">
          {invoice.id}
        </bdi>
      ),
    },
    {
      id: "customer",
      header: t("العميل", "Customer"),
      sortValue: (invoice) => invoice.customer[language],
      cell: (invoice) =>
        // Madar is the one customer with a profile screen.
        invoice.customer.en === story.customers[0].name.en ? (
          <a className="invoices-customer" href={href("customer-profile")}>
            <bdi>{invoice.customer[language]}</bdi>
          </a>
        ) : (
          <bdi>{invoice.customer[language]}</bdi>
        ),
    },
    {
      id: "amount",
      header: t("المبلغ", "Amount"),
      sortValue: (invoice) => String(invoice.amount),
      cell: (invoice) => (
        <span className="invoices-figure">{money(invoice.amount)}</span>
      ),
    },
    {
      id: "due",
      header: t("الاستحقاق", "Due"),
      sortValue: (invoice) => invoice.due,
      cell: (invoice) => (
        <span className="invoices-figure">{date(invoice.due)}</span>
      ),
    },
    {
      id: "late",
      header: t("التأخير", "Overdue"),
      sortValue: (invoice) => String(daysLate(invoice)),
      cell: (invoice) => {
        const days = daysLate(invoice);
        return days > 0 ? (
          <Badge tone={days >= 15 ? "error" : "warning"}>
            {dayCount(screen, days)}
          </Badge>
        ) : (
          none(t("لا تأخير", "Not late"))
        );
      },
    },
    {
      id: "status",
      header: t("الحالة", "Status"),
      cell: (invoice) => {
        const kind = statusOf(invoice);
        return (
          <div className="invoices-status">
            <Badge
              tone={
                kind === "late"
                  ? "error"
                  : kind === "paid"
                    ? "success"
                    : "neutral"
              }
            >
              {statusWords[kind]}
            </Badge>
            {drafts[invoice.id]?.status === "sent" && (
              <span className="invoices-sent">
                <Check size={14} aria-hidden="true" />
                {t("أُرسل التذكير", "Reminder sent")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "action",
      header: t("التذكير", "Reminder"),
      cell: (invoice) => {
        if (statusOf(invoice) !== "late") return null;
        const draft = drafts[invoice.id];
        const label = !draft
          ? t("اكتب تذكيرًا", "Write reminder")
          : draft.status === "sent"
            ? t("عرض التذكير", "View reminder")
            : t("راجع التذكير", "Review reminder");
        // The name starts with what the button says and ends with its row.
        const name = `${label} · ${invoice.id}`;
        // Beside the table the button picks the draft the panel shows; below
        // it, the button opens that draft in its own Sheet, and keeps being the
        // Sheet's trigger once the reminder is sent.
        return size === "wide" ? (
          <Button
            variant="secondary"
            className="invoices-action"
            aria-label={name}
            aria-current={selected === invoice.id ? "true" : undefined}
            onClick={() => choose(invoice.id)}
          >
            {label}
          </Button>
        ) : (
          <Sheet
            open={openId === invoice.id}
            onOpenChange={(open) => {
              if (open) startDraft(invoice.id);
              setOpenId(open ? invoice.id : null);
            }}
            side={endSide}
            title={t("مراجعة التذكير", "Review the reminder")}
            description={t(
              `راجع نص التذكير قبل إرساله إلى ${invoice.customer.ar}.`,
              `Review the reminder before it goes to ${invoice.customer.en}.`,
            )}
            closeLabel={t("إغلاق التذكير", "Close the reminder")}
            trigger={
              <Button
                variant="secondary"
                className="invoices-action"
                aria-label={name}
              >
                {label}
              </Button>
            }
          >
            {drafts[invoice.id] && (
              <div className="invoices-sheet">
                <Reminder
                  invoice={invoice}
                  draft={drafts[invoice.id]}
                  headingLevel={3}
                  onBodyChange={(body) => edit(invoice.id, body)}
                  onSend={(text) => send(invoice.id, text)}
                />
              </div>
            )}
          </Sheet>
        );
      },
    },
  ];

  const filters = [
    ...(query
      ? [
          {
            id: "query",
            label: query,
            removeLabel: t("إزالة البحث", "Remove invoice search"),
            onRemove: () => setQuery(""),
          },
        ]
      : []),
    ...(status !== "all"
      ? [
          {
            id: "status",
            label: statusWords[status],
            removeLabel: t("إزالة الحالة", "Remove invoice status"),
            onRemove: () => setStatus("all"),
          },
        ]
      : []),
  ];
  const selectedInvoice = invoices.find((invoice) => invoice.id === selected)!;
  const selectedDraft = drafts[selected];

  return (
    <>
      <ScreenHeader
        description={`${lateInvoices(screen, late.length)} · ${money(owed)}`}
      />
      <div className="invoices">
        <div className="invoices-main">
          <FilterBar
            className="invoices-filters"
            label={t("تصفية الفواتير", "Invoice filters")}
            search={
              <Input
                type="search"
                aria-label={t(
                  "ابحث بالعميل أو رقم الفاتورة",
                  "Search by customer or invoice number",
                )}
                placeholder={t(
                  "ابحث بالعميل أو الفاتورة…",
                  "Search customer or invoice…",
                )}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
              />
            }
            filters={filters}
            onClearAll={() => {
              setQuery("");
              setStatus("all");
            }}
            clearLabel={t("مسح التصفية", "Clear filters")}
          >
            <Select
              aria-label={t("حالة الفاتورة", "Invoice status")}
              value={status}
              onValueChange={(value) =>
                setStatus(value as InvoiceStatus | "all")
              }
              options={[
                { value: "all", label: t("كل الحالات", "All statuses") },
                { value: "late", label: statusWords.late },
                { value: "paid", label: statusWords.paid },
                { value: "upcoming", label: statusWords.upcoming },
              ]}
            />
          </FilterBar>
          <DataTable
            data={shown}
            columns={columns}
            getRowId={(invoice) => invoice.id}
            caption={t("الفواتير", "Invoices")}
            locale={language}
            pageSize={8}
            resetKey={JSON.stringify([query, status])}
            emptyContent={
              <EmptyState
                title={t("لا توجد فواتير مطابقة", "No matching invoices")}
                description={t(
                  "جرّب عميلًا آخر أو امسح التصفية.",
                  "Try another customer or clear your filters.",
                )}
                illustration={<NoSearchResultsIllustration />}
              />
            }
            labels={{
              previous: t("السابق", "Previous"),
              next: t("التالي", "Next"),
              pagination: t("صفحات الفواتير", "Invoice pages"),
              sortAscending: (header) =>
                t(`ترتيب ${header} تصاعديًا`, `Sort ${header} ascending`),
              sortDescending: (header) =>
                t(`ترتيب ${header} تنازليًا`, `Sort ${header} descending`),
              resultCount: (from, to, total) =>
                total === 0
                  ? t("لا توجد فواتير", "No invoices")
                  : `${number(from)}–${number(to)} ${t("من", "of")} ${invoiceCount(screen, total)}`,
            }}
          />
        </div>
        {size === "wide" && selectedDraft && (
          <Card className="invoices-panel">
            <CardContent ref={panel}>
              <Reminder
                key={selected}
                invoice={selectedInvoice}
                draft={selectedDraft}
                headingLevel={2}
                onBodyChange={(body) => edit(selected, body)}
                onSend={(text) => send(selected, text)}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
