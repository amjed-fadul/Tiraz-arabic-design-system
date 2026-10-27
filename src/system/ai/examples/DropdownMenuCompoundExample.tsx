import { useState } from "react";
import {
  Button,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../index";
/** Uncontrolled composition; the application records each selection. */
export function CompoundDropdownMenuExample({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const [last, setLast] = useState("");
  const arabic = language === "ar";
  return (
    <>
      <DropdownMenuRoot>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">
            {arabic ? "إجراءات الفاتورة" : "Invoice actions"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem shortcut="E" onSelect={() => setLast("edit")}>
            {arabic ? "تعديل" : "Edit"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setLast("duplicate")}>
            {arabic ? "نسخ" : "Duplicate"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => setLast("delete")}>
            {arabic ? "حذف" : "Delete"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuRoot>
      <output>{last}</output>
    </>
  );
}
