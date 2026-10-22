import { useState } from "react";
import { FileDropzone } from "../../index";
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
  /** Opens with two sample files; false opens with none. */
  filled?: boolean;
}
// Stand-ins for chosen files: real File objects of a believable size.
const sample = (name: string, type: string, size: number) =>
  new File([new Uint8Array(size)], name, { type });
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
  filled = false,
}: FileDropzoneExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [initial] = useState<File[]>(() =>
    filled
      ? [
          sample(
            t("عرض-سعر-مدار.pdf", "madar-quote.pdf"),
            "application/pdf",
            248_000,
          ),
          sample(
            t("ملاحظات-المراجعة.txt", "review-notes.txt"),
            "text/plain",
            3_200,
          ),
        ]
      : [],
  );
  const [files, setFiles] = useState<File[]>(initial);
  // Name the limits only while they match the defaults, so guidance stays truthful.
  const defaultRules =
    multiple &&
    accept === ".pdf,.txt,image/*" &&
    maxFiles === 3 &&
    maxFileSize === 5242880;
  return (
    <FileDropzone
      key={mode}
      label={label ?? t("ملفات المراجعة", "Review files")}
      helper={
        helper ??
        (defaultRules
          ? t(
              "PDF أو نص أو صور، حتى ٣ ملفات، ٥ م.ب لكل ملف.",
              "PDF, text or images — up to 3 files, 5 MB each.",
            )
          : t(
              "اختر ملفات من الأنواع المسموح بها وضمن الحجم المحدد.",
              "Choose files of an allowed type and size.",
            ))
      }
      error={error}
      multiple={multiple}
      accept={accept}
      maxFileSize={maxFileSize}
      maxFiles={maxFiles}
      disabled={disabled}
      value={mode === "controlled" ? files : undefined}
      defaultValue={initial}
      onValueChange={setFiles}
    />
  );
}
