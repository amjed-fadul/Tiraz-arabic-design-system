import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Home,
  FileText,
  Users,
  Activity,
  Bell,
  Settings2,
  Layers,
  Link,
  Menu,
  Info,
} from "lucide-react";
import type { ReactNode, MouseEvent } from "react";
import {
  Avatar,
  Button,
  Sheet,
  Sidebar,
  SidebarHeader,
  SidebarIdentity,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarItem,
  SidebarDisclosure,
  SidebarToggle,
  SidebarLabel,
  SidebarAction,
} from "../../index";

export interface SidebarExampleProps {
  /** Stable unique prefix for native URLs; use distinct values for multiple examples. */
  idPrefix?: string;
  language?: "ar" | "en";
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  grouped?: boolean;
  nested?: boolean;
  footer?: boolean;
  longLabels?: boolean;
}
/** Local library notes and actions; no product service or saved data. */
export function SidebarExample({
  language = "ar",
  idPrefix = "tiraz-sidebar",
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  grouped = true,
  nested = true,
  footer = true,
  longLabels = false,
}: SidebarExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const base = idPrefix;
  const pages = [
    {
      key: "overview",
      label: t("نظرة عامة", "Overview"),
      summary: t(
        "معاينة محلية للمكتبة: ثلاث ملاحظات وثلاث وثائق ومساهمان توضيحيان.",
        "A local library preview: three notes, three documents and two fictional contributors.",
      ),
    },
    {
      key: "guide",
      label: t("الأدلة", "Guides"),
      summary: t(
        "ملاحظات قصيرة لقراءة واجهات المكتبة.",
        "Short notes for reading library interfaces.",
      ),
    },
    {
      key: "reading",
      label: t("المكوّنات", "Components"),
      summary: t(
        "ركّب الرأس والمحتوى والتذييل. الروابط للوجهات والأزرار للإجراءات.",
        "Compose header, content and footer. Use links for destinations and buttons for actions.",
      ),
    },
    {
      key: "layout",
      label: t("المراجع", "Resources"),
      summary: t(
        "روابط إلى محتوى موجود في هذه المعاينة.",
        "Links to existing content in this preview.",
      ),
    },
    {
      key: "documents",
      label: t("الوثائق", "Documents"),
      summary: t(
        "ثلاث وثائق قصيرة داخل المثال، دون ملفات للتحميل.",
        "Three short documents within the example, with no downloadable files.",
      ),
    },
    {
      key: "people",
      label: t("الأشخاص", "People"),
      summary: t(
        "مساهمان خياليان لتوضيح محتوى المكتبة.",
        "Two fictional contributors illustrating library content.",
      ),
    },
    {
      key: "activity",
      label: t("النشاط", "Activity"),
      summary: t(
        "آخر اختياراتك في هذه المعاينة فقط.",
        "Your recent selections in this mounted preview only.",
      ),
    },
    {
      key: "notifications",
      label: t("التنبيهات", "Notifications"),
      summary: t(
        "تذكيرات محلية لمراجعة المثال، وليست إشعارات من خدمة.",
        "Local reminders for reviewing this example, not notifications from a service.",
      ),
    },
    {
      key: "settings",
      label: t("الإعدادات", "Settings"),
      summary: t(
        "إعدادات عرض محتوى هذه المعاينة فقط.",
        "Display preferences for this preview's content only.",
      ),
    },
  ];
  const [active, setActive] = useState(() => {
    const key = window.location.hash.slice(base.length + 2);
    return window.location.hash.startsWith(`#${base}-`) &&
      pages.some((page) => page.key === key)
      ? key
      : "reading";
  });
  const [details, setDetails] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [recent, setRecent] = useState([active]);
  const [reminders, setReminders] = useState(["labels", "keyboard"]);
  const [summaries, setSummaries] = useState(true);
  const destination = useRef<string | null>(null);
  useEffect(() => {
    const sync = () => {
      if (!window.location.hash.startsWith(`#${base}-`)) return;
      const key = window.location.hash.slice(base.length + 2);
      if (
        ![
          "overview",
          "guide",
          "reading",
          "layout",
          "documents",
          "people",
          "activity",
          "notifications",
          "settings",
        ].includes(key)
      )
        return;
      setActive(key);
      // Mobile destination focus belongs to the Sheet trigger-restoration handoff.
      if (destination.current) return;
      requestAnimationFrame(() => {
        const target = document.getElementById(`${base}-${key}`);
        target?.focus();
        target?.scrollIntoView();
      });
    };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [base]);
  const documents = [
    [
      t("دليل التركيب", "Composition guide"),
      t(
        "ابدأ بمحتوى واضح وإجراء محدد.",
        "Start with clear content and a specific action.",
      ),
    ],
    [
      t("ملاحظات الرموز", "Token notes"),
      t(
        "استخدم المسافات والألوان المشتركة.",
        "Use shared spacing and color tokens.",
      ),
    ],
    [
      t("قائمة لوحة المفاتيح", "Keyboard checklist"),
      t(
        "تحقق من أسماء العناصر والتركيز والإغلاق.",
        "Check control names, focus and dismissal.",
      ),
    ],
  ];
  const people = [
    { name: t("سارة علي", "Sara Ali"), initials: t("س ع", "SA") },
    { name: t("عمر خالد", "Omar Khalid"), initials: t("ع خ", "OK") },
  ];
  function select(
    key: string,
    event: MouseEvent<HTMLAnchorElement>,
    isMobile = false,
  ) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    setActive(key);
    setRecent((previous) => [key, ...previous].slice(0, 5));
    if (isMobile) {
      destination.current = key;
      setMobile(false);
    } else
      requestAnimationFrame(() =>
        document.getElementById(`${base}-${key}`)?.focus(),
      );
  }
  const label = (key: string) => pages.find((page) => page.key === key)!.label;
  function navigation(isMobile: boolean) {
    const item = (key: string, icon: ReactNode, count?: number) => (
      <SidebarItem
        href={`#${base}-${key}`}
        label={
          key === "documents" && longLabels
            ? t(
                "الوثائق والمراجع لبناء واجهات تطبيقات مدمجة باللغة العربية",
                "Documents and reference notes for compact Arabic-first application interfaces",
              )
            : label(key)
        }
        icon={icon}
        count={count}
        active={active === key}
        onClick={(event) => select(key, event, isMobile)}
      />
    );
    const children = (
      <>
        {item("guide", <BookOpen size={18} />)}
        {item("reading", <Layers size={18} />)}
        {item("layout", <Link size={18} />)}
      </>
    );
    return (
      <Sidebar
        collapsed={isMobile ? false : collapsed}
        defaultCollapsed={defaultCollapsed}
        onCollapsedChange={onCollapsedChange}
        aria-label={t("مكتبة طِراز", "Tiraz library")}
        style={isMobile ? { inlineSize: "100%", blockSize: "100%" } : undefined}
      >
        <SidebarHeader>
          <SidebarIdentity>
            <BookOpen size={24} aria-hidden="true" />
            <SidebarLabel>
              {t("طِراز · المكتبة", "Tiraz · Library")}
            </SidebarLabel>
          </SidebarIdentity>
          {!isMobile && (
            <SidebarToggle
              collapseLabel={t("طي التنقّل", "Collapse navigation")}
              expandLabel={t("توسيع التنقّل", "Expand navigation")}
            />
          )}
        </SidebarHeader>
        <SidebarContent aria-label={t("تنقّل المكتبة", "Library navigation")}>
          <SidebarGroup heading={grouped ? t("المكتبة", "Library") : undefined}>
            {item("overview", <Home size={18} />)}
            {nested ? (
              <SidebarDisclosure
                label={t("المكتبة", "Library")}
                icon={<BookOpen size={18} />}
                count={3}
                activeChild={["guide", "reading", "layout"].includes(active)}
                defaultOpen
              >
                {children}
              </SidebarDisclosure>
            ) : (
              children
            )}
            {item("documents", <FileText size={18} />, documents.length)}
            {item("people", <Users size={18} />, people.length)}
          </SidebarGroup>
          <SidebarGroup
            heading={grouped ? t("المساحة", "Workspace") : undefined}
          >
            {item("activity", <Activity size={18} />)}
            {item("notifications", <Bell size={18} />, reminders.length)}
            {item("settings", <Settings2 size={18} />)}
          </SidebarGroup>
        </SidebarContent>
        {footer && (
          <SidebarFooter>
            <SidebarIdentity>
              <Avatar
                name={people[0].name}
                fallback={people[0].initials}
                decorative
              />
              <SidebarLabel>{people[0].name}</SidebarLabel>
            </SidebarIdentity>
            <SidebarAction
              icon={<Info size={18} />}
              label={t("تفاصيل المثال", "Example details")}
              aria-pressed={details}
              onClick={() => setDetails(!details)}
            />
          </SidebarFooter>
        )}
      </Sidebar>
    );
  }
  const current = pages.find((page) => page.key === active)!;
  return (
    <div className="tz-sidebar-example">
      <div className="tz-sidebar-example-desktop">{navigation(false)}</div>
      <div className="tz-sidebar-example-main">
        <div className="tz-sidebar-example-mobile">
          <Sheet
            open={mobile}
            onOpenChange={setMobile}
            title={t("تنقّل المكتبة", "Library navigation")}
            description={t(
              "انتقل إلى محتوى محلي في المثال.",
              "Go to local content in the example.",
            )}
            closeLabel={t("إغلاق التنقّل", "Close navigation")}
            trigger={
              <Button
                variant="secondary"
                onFocus={() => {
                  const key = destination.current;
                  if (!key) return;
                  destination.current = null;
                  requestAnimationFrame(() =>
                    document.getElementById(`${base}-${key}`)?.focus(),
                  );
                }}
              >
                <Menu size={16} aria-hidden="true" />
                {t("فتح التنقّل", "Open navigation")}
              </Button>
            }
          >
            {navigation(true)}
          </Sheet>
        </div>
        <article aria-label={current.label}>
          <h3>{t("معاينة المكتبة", "Library preview")}</h3>
          <p>
            {t(
              "محتوى توضيحي محلي. الروابط تختار المحتوى وتوجّه التركيز إلى عنوانه.",
              "Local sample content. Links select content and focus its heading.",
            )}
          </p>
          {pages.map((page) => (
            <section key={page.key} hidden={active !== page.key}>
              <h4 id={`${base}-${page.key}`} tabIndex={-1}>
                {page.label}
              </h4>
              {summaries && <p>{page.summary}</p>}
              {page.key === "guide" && (
                <ul>
                  <li>{t("استخدم عناوين قصيرة.", "Use short headings.")}</li>
                  <li>
                    {t("راعِ اتجاه القراءة.", "Follow reading direction.")}
                  </li>
                  <li>
                    {t("اختبر بلوحة المفاتيح.", "Test with the keyboard.")}
                  </li>
                </ul>
              )}
              {page.key === "reading" && (
                <p>
                  {t(
                    "الرأس والتذييل ثابتان بينما يتمرّر التنقّل. شريط الأيقونات يحتفظ بأسماء العناصر.",
                    "Header and footer stay available while navigation scrolls. The icon rail retains control names.",
                  )}
                </p>
              )}
              {page.key === "layout" && (
                <ul>
                  {["guide", "documents", "settings"].map((key) => (
                    <li key={key}>
                      <a
                        href={`#${base}-${key}`}
                        onClick={(event) => select(key, event)}
                      >
                        {label(key)}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {page.key === "documents" && (
                <dl>
                  {documents.map(([title, text]) => (
                    <div key={title}>
                      <dt>{title}</dt>
                      <dd>{text}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {page.key === "people" && (
                <ul>
                  {people.map((person) => (
                    <li key={person.name}>
                      <Avatar
                        name={person.name}
                        fallback={person.initials}
                        decorative
                      />{" "}
                      {person.name}
                    </li>
                  ))}
                </ul>
              )}
              {page.key === "activity" && (
                <ol>
                  {recent.map((key, index) => (
                    <li key={`${key}-${index}`}>
                      {t("اختيار:", "Selected:")} {label(key)}
                    </li>
                  ))}
                </ol>
              )}
              {page.key === "notifications" && (
                <>
                  <ul>
                    {reminders.map((key) => (
                      <li key={key}>
                        {key === "labels"
                          ? t(
                              "راجع التسميات المترجمة.",
                              "Review translated labels.",
                            )
                          : t(
                              "تحقق من التركيز بلوحة المفاتيح.",
                              "Check keyboard focus.",
                            )}
                      </li>
                    ))}
                  </ul>
                  {reminders.length === 0 && (
                    <p role="status">
                      {t(
                        "لا توجد تذكيرات متبقية في هذا المثال.",
                        "No reminders left in this example.",
                      )}
                    </p>
                  )}
                  <Button
                    variant="secondary"
                    disabled={reminders.length === 0}
                    onClick={() => setReminders([])}
                  >
                    {t("مسح التذكيرات", "Clear reminders")}
                  </Button>
                </>
              )}
              {page.key === "settings" && (
                <Button
                  variant="secondary"
                  aria-pressed={summaries}
                  onClick={() => setSummaries(!summaries)}
                >
                  {summaries
                    ? t("إخفاء الملخصات", "Hide summaries")
                    : t("إظهار الملخصات", "Show summaries")}
                </Button>
              )}
            </section>
          ))}
          {details && (
            <p role="status">
              {t(
                "هذا حساب خيالي. الملاحظات والوثائق والمساهمون والتذكيرات محلية؛ لا توجد خدمة أو بيانات محفوظة.",
                "This is a fictional account. Notes, documents, contributors and reminders are local; no service or saved data.",
              )}
            </p>
          )}
        </article>
      </div>
    </div>
  );
}
export function SidebarExamples({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SidebarExample language={language} idPrefix="sidebar-expanded" />
      <SidebarExample
        language={language}
        idPrefix="sidebar-rail"
        defaultCollapsed
        longLabels
      />
    </div>
  );
}
