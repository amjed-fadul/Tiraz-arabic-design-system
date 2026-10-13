import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Accordion,
  Breadcrumbs,
  Pagination,
  SystemProvider,
  defaultConfig,
} from "../../src/system";
import type { SystemConfig } from "../../src/system";
import { CardExample } from "../../src/system/ai/examples/StructureExamples";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
export function Fixture() {
  const q = new URLSearchParams(location.search),
    language = q.get("language") === "en" ? "en" : "ar",
    ar = language === "ar";
  const [config, setConfig] = useState<SystemConfig>({
    ...defaultConfig,
    direction: ar ? "rtl" : "ltr",
    theme: q.get("theme") === "dark" ? "dark" : "light",
    density: q.get("density") === "standard" ? "standard" : "compact",
    typography: q.get("typography") === "large" ? "large" : "standard",
  });
  const [value, setValue] = useState("reading"),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(20),
    [disabled, setDisabled] = useState(false);
  useEffect(() => {
    document.documentElement.lang = language;
    Object.assign(window, {
      updateTiraz: (patch: Partial<SystemConfig>) =>
        setConfig((c) => ({ ...c, ...patch })),
      setAccordion: setValue,
      setPage,
      setTotal,
      setPagingDisabled: setDisabled,
    });
  }, [language]);
  const number = new Intl.NumberFormat(ar ? "ar-u-nu-arab" : "en");
  return (
    <div lang={language}>
      <SystemProvider config={config}>
        <main
          style={{
            padding: "var(--space-4)",
            maxWidth: 800,
            margin: "auto",
            display: "grid",
            gap: "var(--space-4)",
          }}
        >
          <h1>{ar ? "المحتوى والتنقل" : "Structure and navigation"}</h1>
          <section aria-label="Card">
            <h2>Card</h2>
            <CardExample language={language} />
          </section>
          <section aria-label="Accordion">
            <h2>Accordion</h2>
            <Accordion
              value={value}
              onValueChange={setValue}
              collapsible
              items={[
                {
                  value: "reading",
                  label: ar ? "القراءة" : "Reading",
                  content: (
                    <a href="#guide">{ar ? "قراءة الدليل" : "Read guide"}</a>
                  ),
                },
                {
                  value: "disabled",
                  label: ar ? "غير متاح" : "Unavailable",
                  content: "Disabled",
                  disabled: true,
                },
                {
                  value: "layout",
                  label: ar ? "التنسيق" : "Layout",
                  content: (
                    <p>
                      {ar ? "محتوى عربي متصل مع" : "Mixed content with"}{" "}
                      <bdi dir="ltr">INV-2048</bdi>
                    </p>
                  ),
                },
              ]}
            />
          </section>
          <section aria-label="Breadcrumbs">
            <h2>Breadcrumbs</h2>
            <Breadcrumbs
              label={ar ? "مسار الصفحة" : "Page path"}
              items={[
                { label: ar ? "الدليل" : "Guide", href: "#guide" },
                {
                  label: ar
                    ? "المكتبة وملاحظات التنسيق والقراءة"
                    : "Library, layout and reading notes",
                  href: "#library",
                },
                { label: <bdi dir="ltr">DOC-24</bdi> },
              ]}
            />
          </section>
          <section aria-label="Pagination">
            <h2>Pagination</h2>
            <p role="status">
              {ar ? "الملاحظة" : "Note"}{" "}
              {number.format(
                Math.max(
                  1,
                  Math.min(
                    total || 1,
                    Number.isFinite(page) ? Math.floor(page) : 1,
                  ),
                ),
              )}
            </p>
            <Pagination
              page={page}
              totalPages={total}
              onPageChange={setPage}
              disabled={disabled}
              locale={language}
              labels={{
                navigation: ar ? "صفحات الدليل" : "Guide pages",
                previous: ar ? "السابق" : "Previous",
                next: ar ? "التالي" : "Next",
                page: (n) => (ar ? `الصفحة ${number.format(n)}` : `Page ${n}`),
              }}
            />
          </section>
          <section id="guide">
            <h2>{ar ? "الدليل" : "Guide"}</h2>
            <p>{ar ? "هدف رابط الدليل." : "Guide link destination."}</p>
          </section>
          <section id="library">
            <h2>{ar ? "المكتبة" : "Library"}</h2>
            <p>{ar ? "هدف رابط المكتبة." : "Library link destination."}</p>
          </section>
        </main>
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
