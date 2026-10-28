import { useState } from "react";
import { ToolChip, ToolChips } from "../../index";
/** ToolChip parts instead of `items`; each chip carries its own onActivate. */
export function CompoundToolChipsExample({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <ToolChips label={t("نشاط الأدوات", "Tool activity")}>
        <ToolChip
          id="read"
          label={t("قراءة ملفات", "Read files")}
          state="completed"
          count={3}
          onActivate={() => setExpanded(!expanded)}
          controls="tool-chips-read-details"
          expanded={expanded}
        />
        <ToolChip id="check" label={t("تدقيق", "Proofread")} state="running" />
        <ToolChip id="send" label={t("إرسال", "Send")} state="pending" />
      </ToolChips>
      <p id="tool-chips-read-details" hidden={!expanded}>
        {t("قُرئت ثلاثة ملفات.", "Three files were read.")}
      </p>
    </>
  );
}
