import { useId } from "react";
import {
  Avatar,
  Badge,
  Button,
  Chip,
  Card,
  CardContent,
  Checkbox,
  Field,
  Input,
  RadioGroup,
  Select,
  Slider,
  Switch,
  Tabs,
  TagInput,
  Textarea,
} from "../system";
import { words } from "./i18n";
import type { Language } from "./i18n";

/** Rendered at actual control size; the gallery owns the inert decorative wrapper. */
export function CorePreview({
  id,
  language,
}: {
  id: string;
  language: Language;
}) {
  const t = words(language),
    uid = useId();
  switch (id) {
    case "button":
      return (
        <div className="core-preview-row">
          <Button>{t("حفظ التغييرات", "Save changes")}</Button>
          <Button variant="secondary">{t("إلغاء", "Cancel")}</Button>
        </div>
      );
    case "input":
      return (
        <Input
          label={t("الاسم الكامل", "Full name")}
          placeholder={t("اكتب اسمك", "Your name")}
          size="md"
        />
      );
    case "chip":
      return (
        <div className="core-preview-row">
          <Chip selected>{t("الكل", "All")}</Chip>
          <Chip>{t("التصميم", "Design")}</Chip>
          <Chip>{t("التطوير", "Development")}</Chip>
        </div>
      );
    case "badge":
      return (
        <div className="core-preview-row">
          <Badge tone="success">{t("مكتمل", "Complete")}</Badge>
          <Badge tone="warning">{t("قيد المراجعة", "In review")}</Badge>
          <Badge>{t("مسودة", "Draft")}</Badge>
        </div>
      );
    case "select":
      return (
        <Field label={t("الدور", "Role")}>
          {(field) => (
            <Select
              field={field}
              defaultValue="designer"
              options={[
                { value: "designer", label: t("مصمم", "Designer") },
                { value: "developer", label: t("مطوّر", "Developer") },
              ]}
              size="md"
            />
          )}
        </Field>
      );
    case "checkbox":
      return (
        <div className="core-preview-stack">
          <Checkbox
            label={t("البريد الإلكتروني", "Email updates")}
            defaultChecked
          />
          <Checkbox label={t("ملخّص أسبوعي", "Weekly summary")} />
        </div>
      );
    case "radio-group":
      return (
        <RadioGroup
          name={uid}
          label={t("الخطة", "Plan")}
          defaultValue="personal"
          options={[
            { value: "personal", label: t("شخصية", "Personal") },
            { value: "team", label: t("للفريق", "Team") },
          ]}
        />
      );
    case "switch":
      return (
        <div className="core-preview-stack">
          <Switch label={t("الإشعارات", "Notifications")} defaultChecked />
          <Switch label={t("الملخّص اليومي", "Daily digest")} />
        </div>
      );
    case "textarea":
      return (
        <Textarea
          label={t("ملاحظاتك", "Your notes")}
          placeholder={t("أضف التفاصيل هنا…", "Add the details here…")}
          rows={2}
        />
      );
    case "tabs":
      return (
        <Tabs
          label={t("المشروع", "Project")}
          variant="segment"
          items={[
            {
              value: "overview",
              label: t("نظرة عامة", "Overview"),
              content: null,
            },
            {
              value: "activity",
              label: t("النشاط", "Activity"),
              content: null,
            },
          ]}
        />
      );
    case "card":
      return (
        <Card>
          <CardContent>
            <strong>{t("مساحة للفكرة", "Room for your idea")}</strong>
            <p>
              {t(
                "عنوان ومحتوى وإجراء، في مكان واحد.",
                "A title, content and an action together.",
              )}
            </p>
          </CardContent>
        </Card>
      );
    case "avatar":
      return (
        <div className="core-preview-row">
          <Avatar name={t("نورة أحمد", "Noura Ahmed")} />
          <Avatar name={t("سارة علي", "Sara Ali")} />
          <Avatar name={t("عمر حسن", "Omar Hassan")} />
        </div>
      );
    case "slider":
      return <Slider label={t("مستوى الصوت", "Volume")} defaultValue={60} />;
    case "tag-input":
      return (
        <TagInput
          label={t("المهارات", "Skills")}
          defaultValue={[t("تصميم", "Design"), t("تطوير", "Development")]}
          announcement="off"
        />
      );
    default:
      return null;
  }
}
