import type { FieldControlProps } from "./Field";
/** Preserve and deduplicate caller and generated associations. */
export function mergeDescriptionIds(...values: (string | undefined)[]) {
  return (
    [
      ...new Set(
        values.flatMap((value) => value?.split(/\s+/).filter(Boolean) ?? []),
      ),
    ].join(" ") || undefined
  );
}
// Internal to the source directory; not part of the public barrel.
export function associateControl(
  field: FieldControlProps | undefined,
  props: {
    id?: string;
    "aria-labelledby"?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling";
    required?: boolean;
  },
  invalid?: boolean,
) {
  return {
    id: field?.id ?? props.id,
    "aria-labelledby": mergeDescriptionIds(
      field?.["aria-labelledby"],
      props["aria-labelledby"],
    ),
    "aria-describedby": mergeDescriptionIds(
      field?.["aria-describedby"],
      props["aria-describedby"],
    ),
    "aria-invalid": invalid || field?.["aria-invalid"] || props["aria-invalid"],
    required: field?.required || props.required,
  };
}
