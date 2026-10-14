import { useEffect, useRef, useState } from "react";
import { BookOpen, Home, LayoutList, Menu, Info } from "lucide-react";
import {
  Avatar,
  Button,
  Sheet,
  Sidebar,
  SidebarHeader,
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
  /** Stable unique prefix for native note URLs; use distinct values for multiple examples. */
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
/** Host-owned destinations and actions; no router or workspace service. */
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
  const [active, setActive] = useState(() => {
    const key = window.location.hash.slice(base.length + 2);
    return window.location.hash.startsWith(`#${base}-`) &&
      ["guide", "reading", "layout"].includes(key)
      ? key
      : "guide";
  });
  useEffect(() => {
    const sync = () => {
      if (!window.location.hash.startsWith(`#${base}-`)) return;
      const key = window.location.hash.slice(base.length + 2);
      if (!["guide", "reading", "layout"].includes(key)) return;
      setActive(key);
      requestAnimationFrame(() => {
        const target = document.getElementById(`${base}-${key}`);
        target?.focus();
        target?.scrollIntoView();
      });
    };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [base]);
  const [details, setDetails] = useState(false);
  const [mobile, setMobile] = useState(false);
  const destination = useRef<string | null>(null);
  const title =
    active === "guide"
      ? t("دليل المكتبة", "Library guide")
      : active === "reading"
        ? t("القراءة", "Reading")
        : t("التخطيط", "Layout");
  function navigation(isMobile: boolean) {
    const item = (
      key: string,
      label: string,
      icon: React.ReactNode,
      count?: number,
    ) => (
      <SidebarItem
        href={`#${base}-${key}`}
        label={label}
        icon={icon}
        count={count}
        active={active === key}
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
          setActive(key);
          if (isMobile) {
            destination.current = key;
            setMobile(false);
          } else
            requestAnimationFrame(() =>
              document.getElementById(`${base}-${key}`)?.focus(),
            );
        }}
      />
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
          <div className="tz-sidebar-example-brand">
            <BookOpen size={24} aria-hidden="true" />
            <SidebarLabel>
              {t("طِراز · المكتبة", "Tiraz · Library")}
            </SidebarLabel>
          </div>
          {!isMobile && (
            <SidebarToggle
              collapseLabel={t("طي التنقّل", "Collapse navigation")}
              expandLabel={t("توسيع التنقّل", "Expand navigation")}
            />
          )}
        </SidebarHeader>
        <SidebarContent aria-label={t("تنقّل المكتبة", "Library navigation")}>
          <SidebarGroup heading={grouped ? t("المكتبة", "Library") : undefined}>
            {item(
              "guide",
              longLabels
                ? t(
                    "دليل مكتبة طِراز لتنسيق صفحات التطبيقات باللغة العربية",
                    "Tiraz library guide for arranging application pages with long labels",
                  )
                : t("الدليل", "Guide"),
              <Home size={18} />,
              2,
            )}
            {nested ? (
              <SidebarDisclosure
                label={t("ملاحظات", "Notes")}
                icon={<LayoutList size={18} />}
                activeChild={active !== "guide"}
                defaultOpen
              >
                {item(
                  "reading",
                  t("القراءة", "Reading"),
                  <BookOpen size={18} />,
                )}
                {item(
                  "layout",
                  t("التخطيط", "Layout"),
                  <LayoutList size={18} />,
                )}
              </SidebarDisclosure>
            ) : (
              <>
                {item(
                  "reading",
                  t("القراءة", "Reading"),
                  <BookOpen size={18} />,
                )}
                {item(
                  "layout",
                  t("التخطيط", "Layout"),
                  <LayoutList size={18} />,
                )}
              </>
            )}
          </SidebarGroup>
        </SidebarContent>
        {footer && (
          <SidebarFooter>
            <div className="tz-sidebar-example-brand">
              <Avatar
                name={t("سارة علي", "Sara Ali")}
                fallback={t("س ع", "SA")}
                decorative
              />
              <SidebarLabel>{t("سارة علي", "Sara Ali")}</SidebarLabel>
            </div>
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
              "انتقل إلى ملاحظة في المثال.",
              "Go to a note in the example.",
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
        <article aria-label={title}>
          <h3>{title}</h3>
          <p>
            {t(
              "ملاحظتان محليتان. الروابط تختار الملاحظة وتوجّه التركيز إلى عنوانها.",
              "Two local notes. Links select a note and focus its heading.",
            )}
          </p>
          {[
            [
              "guide",
              t("دليل المكتبة", "Library guide"),
              t(
                "ابدأ بمحتوى واضح وإجراء محدد.",
                "Start with clear content and a specific action.",
              ),
            ],
            [
              "reading",
              t("القراءة", "Reading"),
              t(
                "استخدم عناوين قصيرة ومسافات منطقية.",
                "Use short headings and logical spacing.",
              ),
            ],
            [
              "layout",
              t("التخطيط", "Layout"),
              t(
                "أبقِ التنقّل متاحًا والمحتوى قابلًا للتمرير.",
                "Keep navigation available and content scrollable.",
              ),
            ],
          ].map(([key, label, text]) => (
            <section key={key} hidden={active !== key}>
              <h4 id={`${base}-${key}`} tabIndex={-1}>
                {label}
              </h4>
              <p>{text}</p>
            </section>
          ))}
          {details && (
            <p role="status">
              {t(
                "هذا حساب توضيحي. عدد ٢ يشير إلى الملاحظتين؛ لا توجد خدمة أو بيانات محفوظة.",
                "This is an example account. The count of 2 refers to the two notes; no service or saved data.",
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
