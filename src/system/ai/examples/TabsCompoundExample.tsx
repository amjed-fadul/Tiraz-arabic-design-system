import { useState } from "react";
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "../../index";
/** Controlled composition; the application accepts every change request. */
export function CompoundTabsExample({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const [value, setValue] = useState("overview");
  const arabic = language === "ar";
  return (
    <TabsRoot
      label={arabic ? "أقسام العميل" : "Customer sections"}
      value={value}
      onValueChange={setValue}
    >
      <TabsList>
        <TabsTrigger value="overview">
          {arabic ? "نظرة عامة" : "Overview"}
        </TabsTrigger>
        <TabsTrigger value="invoices">
          {arabic ? "الفواتير" : "Invoices"}
        </TabsTrigger>
        <TabsTrigger value="activity" disabled>
          {arabic ? "النشاط" : "Activity"}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p>
          {arabic
            ? "عميل منذ ٢٠٢٣، ويدفع في موعده عادةً."
            : "A customer since 2023 who usually pays on time."}
        </p>
      </TabsContent>
      <TabsContent value="invoices">
        <p>
          {arabic
            ? "فاتورتان مفتوحتان وثلاث مسددة."
            : "Two open invoices and three paid."}
        </p>
      </TabsContent>
      <TabsContent value="activity">
        <p>{arabic ? "لا يوجد نشاط بعد." : "No activity yet."}</p>
      </TabsContent>
    </TabsRoot>
  );
}
