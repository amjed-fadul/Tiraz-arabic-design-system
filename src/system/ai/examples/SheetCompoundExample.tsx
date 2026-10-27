import { useState } from "react";
import {
  Button,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetRoot,
  SheetTrigger,
} from "../../index";
/** Controlled composition; omit side to open at the reading start's edge. */
export function CompoundSheetExample({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const [open, setOpen] = useState(false);
  const arabic = language === "ar";
  return (
    <SheetRoot open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary">
          {arabic ? "تفاصيل العميل" : "Customer details"}
        </Button>
      </SheetTrigger>
      <SheetContent
        title={arabic ? "تفاصيل العميل" : "Customer details"}
        description={
          arabic
            ? "راجع بيانات العميل قبل المتابعة."
            : "Review the customer before continuing."
        }
        closeLabel={arabic ? "إغلاق" : "Close"}
      >
        <SheetBody>
          <p>{arabic ? "شركة النور للتجارة" : "Al Noor Trading"}</p>
        </SheetBody>
        <SheetFooter>
          <Button onClick={() => setOpen(false)}>
            {arabic ? "تم" : "Done"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </SheetRoot>
  );
}
