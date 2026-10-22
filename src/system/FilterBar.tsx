import { useRef } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { Button } from "./Button";
import { RemoveButton } from "./RemoveButton";
import { useSystem } from "./useSystem";
export interface FilterBarFilter {
  id: string;
  label: string;
  removeLabel: string;
  onRemove: () => void;
}
export type FilterBarProps = Omit<
  ComponentPropsWithRef<"div">,
  "aria-label"
> & {
  label: string;
  search?: ReactNode;
  filters?: FilterBarFilter[];
  onClearAll?: () => void;
  clearLabel?: string;
  disabled?: boolean;
};
/** A named group of application controls and removable active filters. */
export function FilterBar({
  label,
  search,
  children,
  filters = [],
  onClearAll,
  clearLabel,
  disabled,
  ref,
  className = "",
  ...props
}: FilterBarProps) {
  const ar = useSystem().config.direction === "rtl";
  const scope = useRef<HTMLDivElement | null>(null);
  function focusControls() {
    const target = scope.current?.querySelector<HTMLElement>(
      ".tz-filter-controls :is(input,button,select,textarea):not(:disabled)",
    );
    (target ?? scope.current)?.focus();
  }
  return (
    <div
      {...props}
      role="group"
      tabIndex={props.tabIndex ?? -1}
      aria-label={label}
      ref={(node) => {
        scope.current = node;
        if (typeof ref === "function") return ref(node);
        if (ref) ref.current = node;
      }}
      className={`tz-filter-bar ${className}`}
    >
      <div className="tz-filter-controls">
        {search && <div className="tz-filter-search">{search}</div>}
        {children}
      </div>
      {filters.length > 0 && (
        <div className="tz-filter-active">
          {filters.map((filter, index) => (
            <span key={filter.id} className="tz-tag">
              <bdi>{filter.label}</bdi>
              <RemoveButton
                label={filter.removeLabel}
                disabled={disabled}
                onClick={() => {
                  const next =
                    scope.current?.querySelectorAll<HTMLButtonElement>(
                      ".tz-filter-active .tz-remove-button",
                    )[index + 1];
                  if (next) next.focus();
                  else focusControls();
                  filter.onRemove();
                }}
              />
            </span>
          ))}
          {onClearAll && (
            <Button
              variant="ghost"
              disabled={disabled}
              onClick={() => {
                focusControls();
                onClearAll();
              }}
            >
              {clearLabel ?? (ar ? "مسح الكل" : "Clear all")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
