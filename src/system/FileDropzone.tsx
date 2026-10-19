import { useId, useRef, useState } from "react";
import type { ComponentPropsWithRef } from "react";
import { File, Paperclip } from "lucide-react";
import { Field } from "./Field";
import type { FieldControlProps } from "./Field";
import { associateControl, mergeDescriptionIds } from "./control-associations";
import { RemoveButton } from "./RemoveButton";
import { useSystem } from "./useSystem";
import { numberLocale } from "./config";
import { useEntryReset } from "./useEntryReset";
import { useArrivals } from "./useArrivals";
export interface FileDropzoneLabels {
  browse?: string;
  drop?: string;
  remove?: (file: File) => string;
  rejected?: (
    file: File,
    reason: "type" | "size" | "count" | "duplicate",
  ) => string;
}
export type FileDropzoneProps = Omit<
  ComponentPropsWithRef<"input">,
  | "type"
  | "value"
  | "defaultValue"
  | "children"
  | "size"
  | "name"
  | "required"
  | "readOnly"
> & {
  value?: File[];
  defaultValue?: File[];
  onValueChange?: (files: File[]) => void;
  maxFileSize?: number;
  maxFiles?: number;
  labels?: FileDropzoneLabels;
  invalid?: boolean;
} & (
    | { label: string; helper?: string; error?: string; field?: never }
    | {
        label?: never;
        helper?: never;
        error?: never;
        field?: FieldControlProps;
      }
  );
const sameFile = (a: File, b: File) =>
  a.name === b.name &&
  a.size === b.size &&
  a.type === b.type &&
  a.lastModified === b.lastModified;
function accepts(file: File, accept?: string) {
  const rules = accept
    ?.split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  return (
    !rules?.length ||
    rules.some((rule) =>
      rule.startsWith(".")
        ? file.name.toLowerCase().endsWith(rule)
        : rule.endsWith("/*")
          ? file.type.toLowerCase().startsWith(rule.slice(0, -1))
          : file.type.toLowerCase() === rule,
    )
  );
}
/** Local selection only. The application submits the File array; native picker is cleared for reselection. */
const fileKey = (file: File) =>
  `${file.name}:${file.size}:${file.lastModified}`;
export function FileDropzone({
  value,
  defaultValue = [],
  onValueChange,
  maxFileSize,
  maxFiles,
  labels,
  label,
  helper,
  error,
  field,
  invalid,
  accept,
  multiple = false,
  disabled,
  ref,
  className = "",
  onChange,
  ...props
}: FileDropzoneProps) {
  const { config } = useSystem();
  const ar = config.direction === "rtl";
  const initial = useRef(defaultValue);
  const [local, setLocal] = useState(defaultValue);
  const files = value ?? local;
  const arrivals = useArrivals(files.map(fileKey));
  const [feedback, setFeedback] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const browseRef = useRef<HTMLButtonElement | null>(null);
  const statusId = `tz-files-status-${useId()}`;
  const browseId = `tz-files-browse-${useId()}`;
  const countLimit =
    maxFiles !== undefined && Number.isFinite(maxFiles)
      ? Math.max(0, Math.floor(maxFiles))
      : Infinity;
  const limit = multiple ? countLimit : Math.min(1, countLimit);
  const digits = new Intl.NumberFormat(numberLocale(config), {
    useGrouping: false,
  });
  const sizeLimit =
    maxFileSize !== undefined && Number.isFinite(maxFileSize)
      ? Math.max(0, maxFileSize)
      : Infinity;
  const blocked = () => disabled || inputRef.current?.matches(":disabled");
  useEntryReset(inputRef, () => {
    if (value === undefined) setLocal(initial.current);
    setFeedback([]);
    depth.current = 0;
    setDragging(false);
  });
  function update(next: File[]) {
    if (value === undefined) setLocal(next);
    onValueChange?.(next);
  }
  function select(incoming: File[]) {
    if (blocked()) return;
    const next = multiple ? [...files] : [];
    const messages: string[] = [];
    let accepted = false;
    for (const file of incoming) {
      const reason = !accepts(file, accept)
        ? "type"
        : file.size > sizeLimit
          ? "size"
          : [...files, ...next].some((existing) => sameFile(existing, file))
            ? "duplicate"
            : next.length >= limit
              ? "count"
              : undefined;
      if (reason) {
        const why =
          reason === "type"
            ? ar
              ? "نوع الملف غير مقبول."
              : "File type is not accepted."
            : reason === "size"
              ? ar
                ? "حجم الملف يتجاوز الحد."
                : "File size exceeds the limit."
              : reason === "duplicate"
                ? ar
                  ? "الملف محدد بالفعل."
                  : "File is already selected."
                : ar
                  ? `الحد الأقصى ${digits.format(limit)} من الملفات.`
                  : `Maximum of ${limit} ${limit === 1 ? "file" : "files"}.`;
        messages.push(
          labels?.rejected?.(file, reason) ?? `${file.name}: ${why}`,
        );
      } else {
        next.push(file);
        accepted = true;
      }
    }
    if (accepted) update(next);
    setFeedback(messages);
  }
  const control = (association = field) => {
    const associations = associateControl(association, props, invalid);
    const describedBy = mergeDescriptionIds(
      associations["aria-describedby"],
      feedback.length ? statusId : undefined,
    );
    return (
      <div className="tz-file-selection" data-disabled={disabled || undefined}>
        <div
          className="tz-file-drop"
          data-dragging={(dragging && !disabled) || undefined}
          data-invalid={associations["aria-invalid"] || undefined}
          onDragEnter={(event) => {
            if (
              !Array.from(event.dataTransfer.types).includes("Files") ||
              blocked()
            )
              return;
            event.preventDefault();
            depth.current++;
            setDragging(true);
          }}
          onDragOver={(event) => {
            if (!Array.from(event.dataTransfer.types).includes("Files")) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = blocked() ? "none" : "copy";
          }}
          onDragLeave={() => {
            depth.current = Math.max(0, depth.current - 1);
            if (!depth.current) setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            depth.current = 0;
            setDragging(false);
            select(Array.from(event.dataTransfer.files));
          }}
        >
          <Paperclip size={18} aria-hidden="true" />
          <span>
            {labels?.drop ??
              (ar ? "اسحب الملفات إلى هنا أو" : "Drop files here or")}
          </span>
          {!associations["aria-labelledby"] && props["aria-label"] && (
            <span id={`${browseId}-context`} className="tz-visually-hidden">
              {props["aria-label"]}
            </span>
          )}
          <button
            type="button"
            ref={browseRef}
            id={browseId}
            aria-labelledby={mergeDescriptionIds(
              associations["aria-labelledby"] ??
                (props["aria-label"] ? `${browseId}-context` : undefined),
              browseId,
            )}
            className="tz-file-browse"
            disabled={disabled}
            aria-describedby={describedBy}
            onClick={() => inputRef.current?.click()}
          >
            {labels?.browse ?? (ar ? "تصفّح الملفات" : "Browse files")}
          </button>
          <input
            {...props}
            {...associations}
            required={undefined}
            aria-describedby={describedBy}
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === "function") return ref(node);
              if (ref) ref.current = node;
            }}
            hidden
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            className={`tz-visually-hidden ${className}`}
            tabIndex={-1}
            onChange={(event) => {
              if (!event.defaultPrevented)
                select(Array.from(event.currentTarget.files ?? []));
              onChange?.(event);
              event.currentTarget.value = "";
            }}
          />
        </div>
        {files.length > 0 && (
          <ul className="tz-selected-files">
            {files.map((file, index) => (
              <li
                key={`${index}-${file.name}`}
                data-fresh={arrivals.fresh(fileKey(file)) || undefined}
                onAnimationEnd={(event) => {
                  if (event.target === event.currentTarget)
                    arrivals.settle(fileKey(file));
                }}
              >
                <File size={16} aria-hidden="true" />
                <bdi className="tz-file-name" title={file.name}>
                  {file.name}
                </bdi>
                <span className="tz-file-size" dir="ltr">
                  {new Intl.NumberFormat(numberLocale(config), {
                    maximumFractionDigits: 1,
                  }).format(
                    file.size < 1024 ? file.size : file.size / 1024,
                  )}{" "}
                  {file.size < 1024 ? "B" : "KB"}
                </span>
                <RemoveButton
                  label={
                    labels?.remove?.(file) ??
                    (ar ? `إزالة ${file.name}` : `Remove ${file.name}`)
                  }
                  disabled={disabled}
                  onClick={() => {
                    if (blocked()) return;
                    browseRef.current?.focus();
                    update(files.filter((_, i) => i !== index));
                    setFeedback([]);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
        <div
          id={statusId}
          role="status"
          className="tz-entry-feedback"
          data-error={feedback.length > 0 || undefined}
        >
          {feedback.map((text, i) => (
            <p key={i} dir="auto">
              {text}
            </p>
          ))}
        </div>
      </div>
    );
  };
  return label !== undefined ? (
    <Field label={label} helper={helper} error={error} id={props.id}>
      {control}
    </Field>
  ) : (
    control()
  );
}
