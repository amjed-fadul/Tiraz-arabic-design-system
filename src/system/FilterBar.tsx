import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  useContext,
  useRef,
} from "react";
import type { ComponentPropsWithRef, ReactElement, ReactNode } from "react";
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
export type FilterBarRootProps = Omit<
  FilterBarProps,
  "search" | "filters" | "children"
> & {
  /** FilterBarSearch, your own controls and FilterBarChip children. */
  children: ReactNode;
};
export interface FilterBarSearchProps {
  /** The search control, such as an Input. */
  children: ReactNode;
}
export interface FilterBarChipProps {
  /** Unique, stable application ID. */
  id: string;
  label: string;
  removeLabel: string;
  /** Called once when the chip's remove button is activated. */
  onRemove?: () => void;
}

const FilterBarContext = createContext<{
  disabled: boolean | undefined;
  /** Moves focus to the chip after this one, or else to a control. */
  focusAfter: (chip: HTMLElement | null) => void;
} | null>(null);
function useFilterBar(part: string) {
  const context = useContext(FilterBarContext);
  if (!context) throw new Error(`${part} requires FilterBarRoot.`);
  return context;
}
const isChip = (child: ReactNode): child is ReactElement<FilterBarChipProps> =>
  isValidElement(child) && child.type === FilterBarChip;

/** A named group of application controls and removable active filters. */
export function FilterBarRoot({
  label,
  children,
  onClearAll,
  clearLabel,
  disabled,
  ref,
  className = "",
  ...props
}: FilterBarRootProps) {
  const ar = useSystem().config.direction === "rtl";
  const scope = useRef<HTMLDivElement | null>(null);
  function focusControls() {
    const target = scope.current?.querySelector<HTMLElement>(
      ".tz-filter-controls :is(input,button,select,textarea):not(:disabled)",
    );
    (target ?? scope.current)?.focus();
  }
  function focusAfter(chip: HTMLElement | null) {
    const buttons = scope.current?.querySelectorAll<HTMLButtonElement>(
      ".tz-filter-active .tz-remove-button",
    );
    const own = chip?.querySelector<HTMLButtonElement>(".tz-remove-button");
    const next = own && buttons?.[[...buttons].indexOf(own) + 1];
    if (next) next.focus();
    else focusControls();
  }
  // Chips collect in the active region; everything else stays in order among
  // the controls.
  const parts = Children.toArray(children);
  const chips = parts.filter(isChip);
  return (
    <FilterBarContext.Provider value={{ disabled, focusAfter }}>
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
          {parts.filter((part) => !isChip(part))}
        </div>
        {chips.length > 0 && (
          <div className="tz-filter-active">
            {chips.map((chip) => (
              <Fragment key={chip.props.id}>{chip}</Fragment>
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
    </FilterBarContext.Provider>
  );
}

/** The search slot of the controls row; its children are the search control. */
export function FilterBarSearch({ children }: FilterBarSearchProps) {
  useFilterBar("FilterBarSearch");
  return <div className="tz-filter-search">{children}</div>;
}

/** One removable active filter. Put it directly inside FilterBarRoot. */
export function FilterBarChip({
  label,
  removeLabel,
  onRemove,
}: FilterBarChipProps) {
  const { disabled, focusAfter } = useFilterBar("FilterBarChip");
  const chip = useRef<HTMLSpanElement>(null);
  return (
    <span ref={chip} className="tz-tag">
      <bdi>{label}</bdi>
      <RemoveButton
        label={removeLabel}
        disabled={disabled}
        onClick={() => {
          focusAfter(chip.current);
          onRemove?.();
        }}
      />
    </span>
  );
}

/** Original convenience API, rendered through the compound parts. */
export function FilterBar({
  search,
  children,
  filters = [],
  ...root
}: FilterBarProps) {
  return (
    <FilterBarRoot {...root}>
      {search && <FilterBarSearch>{search}</FilterBarSearch>}
      {children}
      {filters.map((filter) => (
        <FilterBarChip
          key={filter.id}
          id={filter.id}
          label={filter.label}
          removeLabel={filter.removeLabel}
          onRemove={filter.onRemove}
        />
      ))}
    </FilterBarRoot>
  );
}
