import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AccordionContent,
  AccordionRoot,
  AccordionSection,
  AccordionTrigger,
  SystemProvider,
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
  TaskRowsEmpty,
  TaskRowsRoot,
  TaskRowsRow,
  defaultConfig,
} from "../src/system";
import "../src/system/styles.css";
import "./compound-items.css";

// Every change request a part reports, in order, for the driver to count.
declare global {
  interface Window {
    __requests: string[];
  }
}
window.__requests = [];

function Panel({ arabic }: { arabic: boolean }) {
  const t = (ar: string, en: string) => (arabic ? ar : en);
  const name = arabic ? "Arabic RTL" : "English LTR";
  const key = arabic ? "ar" : "en";
  const [tabs, setTabs] = useState<string[]>([]);
  const [section, setSection] = useState("delivery");
  const [rows, setRows] = useState<string[]>([]);
  const record = (kind: string, value: string) =>
    window.__requests.push(`${key}:${kind}:${value}`);
  return (
    <section aria-label={name} className="panel">
      <h2>{name}</h2>
      <SystemProvider
        lang={arabic ? "ar" : "en"}
        config={{ ...defaultConfig, direction: arabic ? "rtl" : "ltr" }}
      >
        <TabsRoot
          label={t("أقسام العميل", "Customer sections")}
          onValueChange={(value) => {
            record("tabs", value);
            setTabs((list) => [...list, value]);
          }}
        >
          <TabsList>
            <TabsTrigger value="overview">
              {t("نظرة عامة", "Overview")}
            </TabsTrigger>
            <TabsTrigger value="billing" disabled>
              {t("الفوترة", "Billing")}
            </TabsTrigger>
            <TabsTrigger value="invoices">
              {t("الفواتير", "Invoices")}
            </TabsTrigger>
            <TabsTrigger value="team">{t("الفريق", "Team")}</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <p>{t("ملخص العميل.", "Customer summary.")}</p>
          </TabsContent>
          <TabsContent value="billing">
            <p>{t("بيانات الفوترة.", "Billing details.")}</p>
          </TabsContent>
          <TabsContent value="invoices">
            <p>{t("الفواتير المفتوحة.", "Open invoices.")}</p>
          </TabsContent>
          <TabsContent value="team">
            <p>{t("أعضاء الفريق.", "Team members.")}</p>
          </TabsContent>
        </TabsRoot>
        <output aria-label={t("طلبات التبويب", "Tab requests")}>
          {tabs.join(",") || "none"}
        </output>

        <AccordionRoot
          value={section}
          collapsible
          onValueChange={(value) => {
            record("accordion", value || "(none)");
            setSection(value);
          }}
        >
          <AccordionSection value="delivery">
            <AccordionTrigger>{t("التوصيل", "Delivery")}</AccordionTrigger>
            <AccordionContent>
              <p>{t("خلال يومين.", "Within two days.")}</p>
            </AccordionContent>
          </AccordionSection>
          <AccordionSection value="returns" disabled>
            <AccordionTrigger>{t("الإرجاع", "Returns")}</AccordionTrigger>
            <AccordionContent>
              <p>{t("خلال ثلاثين يومًا.", "Within thirty days.")}</p>
            </AccordionContent>
          </AccordionSection>
          <AccordionSection value="payment">
            <AccordionTrigger>{t("الدفع", "Payment")}</AccordionTrigger>
            <AccordionContent>
              <p>{t("بالبطاقة أو التحويل.", "By card or transfer.")}</p>
            </AccordionContent>
          </AccordionSection>
        </AccordionRoot>

        <TaskRowsRoot
          label={t("مهام الوكيل", "Agent tasks")}
          expandedIds={rows}
          onExpandedChange={(ids) => {
            record("rows", ids.join("+") || "(none)");
            setRows(ids);
          }}
        >
          <TaskRowsRow
            id="quote"
            title={t("متابعة عرض السعر", "Follow up the quote")}
            summary={t("٣ مسودات", "3 drafts")}
            state="completed"
          >
            <p>{t("المسودات جاهزة.", "The drafts are ready.")}</p>
          </TaskRowsRow>
          <TaskRowsRow
            id="delivery"
            title={t("تأكيد موعد التسليم", "Confirm the delivery date")}
            state="pending"
          >
            <button type="button">{t("موافقة", "Approve")}</button>
          </TaskRowsRow>
          <TaskRowsRow
            id="payment"
            title={t("تذكير بالدفعة", "Remind about the payment")}
            state="pending"
          >
            <p>{t("لم تبدأ.", "Not started.")}</p>
          </TaskRowsRow>
        </TaskRowsRoot>

        <TaskRowsRoot label={t("مهام فارغة", "No tasks")}>
          <TaskRowsEmpty />
        </TaskRowsRoot>
      </SystemProvider>
    </section>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main>
      <h1>Tiraz compound items verification</h1>
      <div className="panels">
        <Panel arabic />
        <Panel arabic={false} />
      </div>
    </main>
  </StrictMode>,
);
