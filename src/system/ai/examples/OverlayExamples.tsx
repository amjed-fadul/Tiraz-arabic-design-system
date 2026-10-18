import { teamMembers } from "./team";
import { photoMembers } from "./portraits";
import { useRef, useState } from "react";
import { Close } from "@radix-ui/react-dialog";
import {
  AvatarGroup,
  Button,
  DropdownMenu,
  Modal,
  Select,
  Tooltip,
  numberLocale,
  useSystem,
} from "../../index";
type Language = "ar" | "en";
export function TeamExample({
  language = "ar",
  maxVisible = 3,
  photos = false,
  size = "sm",
}: {
  language?: Language;
  maxVisible?: number;
  photos?: boolean;
  size?: "sm" | "md";
}) {
  const number = new Intl.NumberFormat(
    numberLocale(useSystem().config, language),
  );
  return (
    <AvatarGroup
      members={photos ? photoMembers(language) : teamMembers(language)}
      maxVisible={maxVisible}
      size={size}
      label={language === "ar" ? "فريق المشروع" : "Project team"}
      overflowLabel={(count) =>
        language === "ar"
          ? `${number.format(count)} أعضاء آخرون`
          : `${count} more members`
      }
    />
  );
}
export function TooltipExample({
  language = "ar",
  content,
}: {
  language?: Language;
  content?: string;
}) {
  const [details, setDetails] = useState(false);
  const ar = language === "ar";
  return (
    <div>
      <Tooltip
        content={
          content ??
          (ar
            ? "يعرض المبلغ والضريبة لكل بند."
            : "Shows the amount and VAT for each line.")
        }
        trigger={
          <Button
            variant="secondary"
            aria-expanded={details}
            onClick={() => setDetails((value) => !value)}
          >
            {details
              ? ar
                ? "إخفاء التفاصيل"
                : "Hide details"
              : ar
                ? "عرض التفاصيل"
                : "Show details"}
          </Button>
        }
      />
      {details && (
        <p>
          {ar
            ? "١٠٬٠٠٠ ر.س + ضريبة ١٬٥٠٠ ر.س = ١١٬٥٠٠ ر.س"
            : "SAR 10,000 + VAT SAR 1,500 = SAR 11,500"}
        </p>
      )}
    </div>
  );
}
export function ModalExample({
  language = "ar",
  title,
  description,
  footer = true,
  controlled = true,
}: {
  language?: Language;
  title?: string;
  description?: string;
  footer?: boolean;
  controlled?: boolean;
}) {
  const ar = language === "ar";
  const [open, setOpen] = useState(false),
    [layout, setLayout] = useState("list");
  const focusRef = useRef<HTMLButtonElement>(null);
  return (
    <Modal
      title={title ?? (ar ? "خيارات العرض" : "Display options")}
      description={
        description ??
        (ar ? "اختر طريقة عرض الفواتير." : "Choose how invoices are shown.")
      }
      closeLabel={ar ? "إغلاق النافذة" : "Close dialog"}
      trigger={
        <Button variant="secondary">
          {ar ? "عرض الخيارات" : "View options"}
        </Button>
      }
      open={controlled ? open : undefined}
      onOpenChange={setOpen}
      initialFocusRef={focusRef}
      footer={
        footer ? (
          <Close asChild>
            <Button>{ar ? "تم" : "Done"}</Button>
          </Close>
        ) : undefined
      }
    >
      <div className="tz-preferences-form">
        <Select
          ref={focusRef}
          aria-label={ar ? "طريقة العرض" : "Layout"}
          value={layout}
          onValueChange={setLayout}
          options={[
            { value: "list", label: ar ? "قائمة" : "List" },
            { value: "cards", label: ar ? "بطاقات" : "Cards" },
          ]}
        />
        <DropdownMenu
          trigger={
            <Button variant="secondary">
              {ar ? "خيارات إضافية" : "More options"}
            </Button>
          }
          items={[
            {
              id: "reset",
              label: ar ? "استعادة الإعداد الافتراضي" : "Restore default",
              onSelect: () => setLayout("list"),
            },
          ]}
        />
        <Tooltip
          content={
            ar
              ? "تُحفظ طريقة العرض في حسابك على كل أجهزتك."
              : "Your layout is saved to your account on every device."
          }
          trigger={
            <span tabIndex={0}>
              {ar ? "يسري على حسابك" : "Applies to your account"}
            </span>
          }
        />
      </div>
    </Modal>
  );
}
