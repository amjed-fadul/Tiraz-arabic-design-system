import { useState } from "react";
import {
  Button,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalRoot,
  ModalTrigger,
} from "../../index";
/** Controlled composition; the application accepts every change request. */
export function CompoundModalExample({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const [open, setOpen] = useState(false);
  const arabic = language === "ar";
  return (
    <ModalRoot open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button variant="secondary">
          {arabic ? "حذف الفاتورة" : "Delete invoice"}
        </Button>
      </ModalTrigger>
      <ModalContent
        title={arabic ? "حذف الفاتورة؟" : "Delete this invoice?"}
        description={
          arabic
            ? "لا يمكن التراجع عن الحذف بعد التأكيد."
            : "This cannot be undone once confirmed."
        }
        closeLabel={arabic ? "إغلاق" : "Close"}
      >
        <ModalBody>
          <p>
            {arabic
              ? "ستُزال الفاتورة وبنودها من القائمة."
              : "The invoice and its lines leave the list."}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {arabic ? "إلغاء" : "Cancel"}
          </Button>
          <Button onClick={() => setOpen(false)}>
            {arabic ? "حذف" : "Delete"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
}
