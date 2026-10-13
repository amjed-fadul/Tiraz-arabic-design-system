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
              ? "استخدم الرموز المشتركة للمسافات والزوايا."
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
                ? "قراءة الملاحظات"
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
}: {
  language?: Language;
  controlled?: boolean;
  collapsible?: boolean;
}) {
  const ar = language === "ar";
  const [value, setValue] = useState("reading");
  return (
    <Accordion
      collapsible={collapsible}
      value={controlled ? value : undefined}
      defaultValue={controlled ? undefined : "reading"}
      onValueChange={setValue}
      items={[
        {
          value: "reading",
          label: ar ? "القراءة" : "Reading",
          content: (
            <p>
              {ar
                ? "أظهر تفاصيل قسم واحد مع بقاء العناوين متاحة."
                : "Reveal one section while keeping every heading available."}
            </p>
          ),
        },
        {
          value: "layout",
          label: ar ? "التنسيق" : "Layout",
          content: (
            <p>
              {ar
                ? "يبقى المحتوى بترتيب القراءة، مع مسافات من الرموز المشتركة."
                : "Content stays in reading order, with spacing from shared tokens."}
            </p>
          ),
        },
        {
          value: "advanced",
          label: ar
            ? "خيارات متقدمة · غير متاحة"
            : "Advanced options · unavailable",
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
    rootId = useId(),
    libraryId = useId();
  return (
    <div className="tz-structure-example">
      <Breadcrumbs
        label={label ?? (ar ? "مسار الصفحة" : "Page path")}
        items={[
          { label: ar ? "الدليل" : "Guide", href: `#${rootId}` },
          { label: ar ? "المكتبة" : "Library", href: `#${libraryId}` },
          { label: current ?? (ar ? "القراءة" : "Reading") },
        ]}
      />
      <section id={rootId}>
        <h3>{ar ? "الدليل" : "Guide"}</h3>
        <p>
          {ar
            ? "روابط هذا المثال تصل إلى أقسام موجودة في الصفحة."
            : "These example links reach existing sections on this page."}
        </p>
      </section>
      <section id={libraryId}>
        <h3>{ar ? "المكتبة" : "Library"}</h3>
        <p>
          {ar
            ? "يحدد التطبيق الوجهات. الصفحة الحالية نص دون رابط."
            : "The application supplies destinations. The current page is text without a link."}
        </p>
      </section>
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
  const [localPage, setLocalPage] = useState(initialPage);
  // This example owns a small local list: one guide note per page, at most 20.
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
      ? `ملاحظة الدليل ${new Intl.NumberFormat("ar-u-nu-arab").format(index + 1)}`
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
              {ar
                ? "يختار التطبيق المحتوى المعروض لهذه الصفحة."
                : "The application selects the content shown on this page."}{" "}
              <bdi dir="ltr">DOC-{note.id}</bdi>
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
          page: (number) =>
            ar
              ? `الصفحة ${new Intl.NumberFormat("ar-u-nu-arab").format(number)}`
              : `Page ${number}`,
        }}
      />
    </div>
  );
}
