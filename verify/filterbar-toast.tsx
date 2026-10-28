import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Chip,
  FilterBarChip,
  FilterBarRoot,
  FilterBarSearch,
  Input,
  SystemProvider,
  Toast,
  ToastProvider,
  defaultConfig,
  useToast,
} from "../src/system";
import "../src/system/styles.css";

// Every request a part reports, in order, for the driver to count.
declare global {
  interface Window {
    __requests: string[];
  }
}
window.__requests = [];

export function ImperativeButton({
  label,
  title,
}: {
  label: string;
  title: string;
}) {
  const { toast } = useToast();
  return (
    <Button variant="secondary" onClick={() => toast({ title, tone: "info" })}>
      {label}
    </Button>
  );
}

export function Panel({ arabic }: { arabic: boolean }) {
  const t = (ar: string, en: string) => (arabic ? ar : en);
  const name = arabic ? "Arabic RTL" : "English LTR";
  const key = arabic ? "ar" : "en";
  const [query, setQuery] = useState("Ada");
  const [activeOnly, setActiveOnly] = useState(true);
  const [kind, setKind] = useState(true);
  const [saved, setSaved] = useState(false);
  const [quick, setQuick] = useState(false);
  const record = (kind: string, value: string) =>
    window.__requests.push(`${key}:${kind}:${value}`);
  return (
    <section aria-label={name} className="panel">
      <h2>{name}</h2>
      <SystemProvider
        lang={arabic ? "ar" : "en"}
        config={{ ...defaultConfig, direction: arabic ? "rtl" : "ltr" }}
      >
        <ToastProvider
          label={t("التنبيهات", "Notifications")}
          closeLabel={t("إغلاق التنبيه", "Dismiss notification")}
        >
          <FilterBarRoot
            label={t("تصفية العملاء", "Customer filters")}
            clearLabel={t("مسح الكل", "Clear all")}
            onClearAll={() => {
              record("clear", "all");
              setQuery("");
              setActiveOnly(false);
              setKind(false);
            }}
          >
            <FilterBarSearch>
              <Input
                aria-label={t("البحث في العملاء", "Search customers")}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
              />
            </FilterBarSearch>
            <Chip
              selected={activeOnly}
              onClick={() => setActiveOnly(!activeOnly)}
            >
              {t("النشطون فقط", "Active only")}
            </Chip>
            {query && (
              <FilterBarChip
                id="query"
                label={query}
                removeLabel={t("إزالة البحث", "Remove search")}
                onRemove={() => {
                  record("remove", "query");
                  setQuery("");
                }}
              />
            )}
            {activeOnly && (
              <FilterBarChip
                id="active"
                label={t("النشطون فقط", "Active only")}
                removeLabel={t("إزالة النشطين", "Remove active")}
                onRemove={() => {
                  record("remove", "active");
                  setActiveOnly(false);
                }}
              />
            )}
            {kind && (
              <FilterBarChip
                id="kind"
                label={t("الأدلة", "Guides")}
                removeLabel={t("إزالة النوع", "Remove kind")}
                onRemove={() => {
                  record("remove", "kind");
                  setKind(false);
                }}
              />
            )}
          </FilterBarRoot>
          <output aria-label={t("طلبات التصفية", "Filter state")}>
            {JSON.stringify({ query, activeOnly, kind })}
          </output>

          <div className="row">
            <Button onClick={() => setSaved(true)}>
              {t("حفظ التغييرات", "Save changes")}
            </Button>
            <Button variant="secondary" onClick={() => setQuick(true)}>
              {t("حفظ سريع", "Quick save")}
            </Button>
            <ImperativeButton
              label={t("تنبيه بالدالة", "Notify")}
              title={t("تنبيه من الشيفرة", "Message from code")}
            />
          </div>
          <Toast
            open={saved}
            tone="success"
            title={t("تم حفظ التغييرات", "Changes saved")}
            description={t(
              "حُدّث ملف العميل.",
              "The customer file is updated.",
            )}
            duration={60000}
            onOpenChange={(next) => {
              record("toast", String(next));
              setSaved(next);
            }}
          />
          <Toast
            open={quick}
            tone="warning"
            title={t("حفظ سريع", "Quick save")}
            duration={1500}
            onOpenChange={(next) => {
              record("quick", String(next));
              setQuick(next);
            }}
          />
        </ToastProvider>
      </SystemProvider>
    </section>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main>
      <h1>Tiraz FilterBar and Toast verification</h1>
      <div className="panels">
        <Panel arabic />
        <Panel arabic={false} />
      </div>
    </main>
  </StrictMode>,
);
