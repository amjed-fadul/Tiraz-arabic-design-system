import { useState } from "react";
import {
  AccordionContent,
  AccordionRoot,
  AccordionSection,
  AccordionTrigger,
} from "../../index";
/** Controlled composition; the application accepts every change request. */
export function CompoundAccordionExample({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const [value, setValue] = useState("delivery");
  const arabic = language === "ar";
  return (
    <AccordionRoot value={value} onValueChange={setValue} collapsible>
      <AccordionSection value="delivery">
        <AccordionTrigger>{arabic ? "التوصيل" : "Delivery"}</AccordionTrigger>
        <AccordionContent>
          <p>
            {arabic
              ? "يصل الطلب خلال يومين إلى أربعة أيام عمل."
              : "Orders arrive in two to four working days."}
          </p>
        </AccordionContent>
      </AccordionSection>
      <AccordionSection value="returns">
        <AccordionTrigger>{arabic ? "الإرجاع" : "Returns"}</AccordionTrigger>
        <AccordionContent>
          <p>
            {arabic
              ? "يمكن الإرجاع خلال ثلاثين يومًا من الاستلام."
              : "Items can be returned within thirty days of delivery."}
          </p>
        </AccordionContent>
      </AccordionSection>
      <AccordionSection value="invoices" disabled>
        <AccordionTrigger>{arabic ? "الفواتير" : "Invoices"}</AccordionTrigger>
        <AccordionContent>
          <p>{arabic ? "غير متاحة بعد." : "Not available yet."}</p>
        </AccordionContent>
      </AccordionSection>
    </AccordionRoot>
  );
}
