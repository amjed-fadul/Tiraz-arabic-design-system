import { useId, useState } from "react";
import {
  Accordion,
  Breadcrumbs,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Pagination,
  numberLocale,
  useSystem,
} from "../../index";
type Language = "ar" | "en";

export function CardExample({
  language = "ar",
  title,
  description,
  actions = true,
}: {
  language?: Language;
  title?: string;
  description?: string;
  actions?: boolean;
}) {
  const ar = language === "ar",
    notesId = useId();
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="tz-structure-example">
      <CardHeader>
        <CardTitle>
          {title ?? (ar ? "دليل القراءة" : "Reading guide")}
        </CardTitle>
        <CardDescription>
          {description ??
            (ar
              ? "ملاحظات قصيرة لتنسيق المحتوى."
              : "Short notes for arranging content.")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          {ar ? "مرجع المستند" : "Document reference"}:{" "}
          <bdi dir="ltr">DOC-24</bdi>
        </p>
        {actions && expanded && (
          <p id={notesId}>
            {ar
              ? "استخدم القيم المشتركة للمسافات والزوايا."
              : "Use shared tokens for spacing and corners."}
          </p>
        )}
      </CardContent>
      {actions && (
        <CardFooter>
          <Button
            variant="secondary"
            aria-expanded={expanded}
            aria-controls={expanded ? notesId : undefined}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded
              ? ar
                ? "إخفاء الملاحظات"
                : "Hide notes"
              : ar
                ? "عرض الملاحظات"
                : "Read notes"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export function AccordionExample({
  language = "ar",
  controlled = true,
  collapsible = true,
  defaultOpen = true,
}: {
  language?: Language;
  controlled?: boolean;
  collapsible?: boolean;
  /** Opens with the first question answered; false opens with none. */
  defaultOpen?: boolean;
}) {
  const ar = language === "ar";
  const [value, setValue] = useState(defaultOpen ? "billing" : "");
  return (
    <Accordion
      collapsible={collapsible}
      value={controlled ? value : undefined}
      defaultValue={controlled || !defaultOpen ? undefined : "billing"}
      onValueChange={setValue}
      items={[
        {
          value: "billing",
          label: ar ? "كيف تُحسب الفاتورة؟" : "How is my invoice calculated?",
          content: (
            <p>
              {ar
                ? "تُحسب شهريًا حسب عدد المستخدمين النشطين، وتشمل ضريبة القيمة المضافة ١٥٪."
                : "Monthly, by the number of active users, including 15% VAT."}
            </p>
          ),
        },
        {
          value: "plan",
          label: ar ? "هل يمكنني تغيير خطتي؟" : "Can I change my plan?",
          content: (
            <p>
              {ar
                ? "نعم، ويسري التغيير من بداية دورة الفوترة التالية."
                : "Yes. The change applies from the start of your next billing cycle."}
            </p>
          ),
        },
        {
          value: "export",
          label: ar ? "تصدير البيانات · قريبًا" : "Data export · coming soon",
          disabled: true,
          content: null,
        },
      ]}
    />
  );
}

export function BreadcrumbsExample({
  language = "ar",
  label,
  current,
}: {
  language?: Language;
  label?: string;
  current?: string;
}) {
  const ar = language === "ar",
    rootId = useId();
  // Parent links stay inside the example instead of leaving the page.
  return (
    <div className="tz-structure-example" id={rootId}>
      <Breadcrumbs
        label={label ?? (ar ? "مسار الصفحة" : "Page path")}
        items={[
          { label: ar ? "الدليل" : "Guide", href: `#${rootId}` },
          { label: ar ? "المكتبة" : "Library", href: `#${rootId}` },
          { label: current ?? (ar ? "القراءة" : "Reading") },
        ]}
      />
    </div>
  );
}

export function PaginationExample({
  language = "ar",
  initialPage = 1,
  totalPages = 12,
  page: controlledPage,
  onPageChange,
}: {
  language?: Language;
  initialPage?: number;
  totalPages?: number;
  page?: number;
  onPageChange?: (page: number) => void;
}) {
  const ar = language === "ar";
  const number = new Intl.NumberFormat(
    numberLocale(useSystem().config, language),
  );
  const [localPage, setLocalPage] = useState(initialPage);
  // One guide note per page, at most 20.
  const total = Number.isFinite(totalPages)
    ? Math.min(20, Math.max(1, Math.floor(totalPages)))
    : 1;
  const requested = controlledPage ?? localPage;
  const page = Number.isFinite(requested)
    ? Math.max(1, Math.min(total, Math.floor(requested)))
    : 1;
  const notes = Array.from({ length: total }, (_, index) => ({
    id: index + 1,
    title: ar
      ? `ملاحظة الدليل ${number.format(index + 1)}`
      : `Guide note ${index + 1}`,
  }));
  const visible = notes.slice(page - 1, page);
  return (
    <div className="tz-structure-example">
      <div aria-live="polite" aria-atomic="true">
        {visible.map((note) => (
          <article key={note.id}>
            <h3>{note.title}</h3>
            <p>
              <bdi dir="ltr">DOC-{note.id}</bdi> ·{" "}
              {ar ? "٤ دقائق للقراءة" : "4 min read"}
            </p>
          </article>
        ))}
      </div>
      <Pagination
        page={page}
        totalPages={total}
        locale={language}
        onPageChange={(next) => {
          setLocalPage(next);
          onPageChange?.(next);
        }}
        labels={{
          navigation: ar ? "صفحات الدليل" : "Guide pages",
          previous: ar ? "السابق" : "Previous",
          next: ar ? "التالي" : "Next",
          page: (page) =>
            ar ? `الصفحة ${number.format(page)}` : `Page ${page}`,
        }}
      />
    </div>
  );
}
