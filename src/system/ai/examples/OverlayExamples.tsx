import { teamMembers } from "./team";
import { useRef, useState } from "react";
import { Close } from "@radix-ui/react-dialog";
import {
  AvatarGroup,
  Button,
  DropdownMenu,
  Modal,
  Select,
  Tooltip,
} from "../../index";
type Language = "ar" | "en";
export function TeamExample({
  language = "ar",
  maxVisible = 3,
  size = "sm",
}: {
  language?: Language;
  maxVisible?: number;
  size?: "sm" | "md";
}) {
  return (
    <AvatarGroup
      members={teamMembers(language)}
      maxVisible={maxVisible}
      size={size}
      label={language === "ar" ? "فريق المشروع" : "Project team"}
      overflowLabel={(count) =>
        language === "ar" ? `${count} أعضاء إضافيون` : `${count} more members`
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
            ? "عرض معلومات إضافية في هذه المعاينة."
            : "Show extra information in this preview.")
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
            ? "هذه معاينة محلية للمكوّن."
            : "This is a local component preview."}
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
    <div>
      <Modal
        title={title ?? (ar ? "خيارات العرض" : "Display options")}
        description={
          description ??
          (ar
            ? "اختر تخطيطًا لهذه المعاينة فقط."
            : "Choose a layout for this preview only.")
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
            aria-label={ar ? "التخطيط" : "Layout"}
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
                {ar ? "إجراءات المعاينة" : "Preview actions"}
              </Button>
            }
            items={[
              {
                id: "reset",
                label: ar ? "استعادة القائمة" : "Reset to list",
                onSelect: () => setLayout("list"),
              },
            ]}
          />
          <Tooltip
            content={
              ar ? "لا تُحفظ هذه الإعدادات." : "These settings are not saved."
            }
            trigger={
              <span tabIndex={0}>
                {ar ? "إعدادات مؤقتة" : "Temporary settings"}
              </span>
            }
          />
        </div>
      </Modal>
      <p role="status">
        {ar ? "التخطيط: " : "Layout: "}
        {layout === "list" ? (ar ? "قائمة" : "List") : ar ? "بطاقات" : "Cards"}
      </p>
    </div>
  );
}
