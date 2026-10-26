import { useState } from "react";
import {
  Button,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
} from "../../index";
/** Controlled composition; keep content short and the trigger independently named. */
export function CompoundTooltipExample({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const [open, setOpen] = useState(false);
  return (
    <TooltipRoot open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <Button variant="secondary">
          {language === "ar" ? "التفاصيل" : "Details"}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {language === "ar"
          ? "يعرض المبلغ والضريبة لكل بند."
          : "Shows the amount and VAT for each line."}
      </TooltipContent>
    </TooltipRoot>
  );
}
