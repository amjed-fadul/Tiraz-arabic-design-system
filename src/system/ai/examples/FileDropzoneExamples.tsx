import { useState } from "react";
import { Button, FileDropzone } from "../../index";
export interface FileDropzoneExampleProps {
  language?: "ar" | "en";
  label?: string;
  helper?: string;
  error?: string;
  multiple?: boolean;
  accept?: string;
  maxFileSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  mode?: "controlled" | "uncontrolled";
}
export function FileDropzoneExample({
  language = "ar",
  label,
  helper,
  error,
  multiple = true,
  accept = ".pdf,.txt,image/*",
  maxFileSize = 5242880,
  maxFiles = 3,
  disabled = false,
  mode = "controlled",
}: FileDropzoneExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [files, setFiles] = useState<File[]>([]);
  const [report, setReport] = useState<string[] | null>(null);
  return (
    <form
      style={{
        display: "grid",
        gap: "var(--space-3)",
        inlineSize: "100%",
        minInlineSize: 0,
      }}
      onSubmit={(event) => {
        event.preventDefault();
        setReport(disabled ? [] : files.map((file) => file.name));
      }}
      onReset={() => {
        setFiles([]);
        setReport(null);
      }}
    >
      <FileDropzone
        key={mode}
        label={label ?? t("ملفات المراجعة", "Review files")}
        helper={
          helper ??
          t(
            "PDF أو نص أو صور · حتى ٥ ميغابايت لكل ملف · ٣ ملفات كحد أقصى.",
            "PDF, text or images · up to 5 MB each · maximum 3 files.",
          )
        }
        error={error}
        multiple={multiple}
        accept={accept}
        maxFileSize={maxFileSize}
        maxFiles={maxFiles}
        disabled={disabled}
        value={mode === "controlled" ? files : undefined}
        onValueChange={setFiles}
      />
      <p
        style={{
          margin: 0,
          color: "var(--text-secondary)",
          fontSize: "var(--text-meta)",
        }}
      >
        {t(
          "اختيار محلي فقط. لم تُرفع أي ملفات. فحص النوع والحجم للتيسير، ويجب إعادة التحقق في الخادم.",
          "Local selection only. No files have been uploaded. Type and size checks are convenience checks; validate again on the server.",
        )}
      </p>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <Button type="submit" variant="secondary">
          {t("عرض الاختيار المحلي", "Read local selection")}
        </Button>
        <Button type="reset" variant="ghost">
          {t("إعادة ضبط الملفات", "Reset files")}
        </Button>
      </div>
      {report !== null && (
        <output role="status" style={{ overflowWrap: "anywhere" }}>
          {t("الملفات المحددة محليًا: ", "Locally selected files: ")}
          {report.length ? report.join("، ") : t("لا ملفات", "No files")}
        </output>
      )}
    </form>
  );
}
