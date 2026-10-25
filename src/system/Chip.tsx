import type { ComponentPropsWithRef, ReactNode } from "react";

type ChipOptions = {
  children: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
};
export type ChipButtonProps = ChipOptions &
  Omit<
    ComponentPropsWithRef<"button">,
    keyof ChipOptions | "aria-pressed" | "aria-current" | "aria-disabled"
  > & { href?: never; "aria-current"?: never };
export type ChipLinkProps = ChipOptions &
  Omit<
    ComponentPropsWithRef<"a">,
    keyof ChipOptions | "href" | "aria-pressed" | "aria-disabled"
  > & { href: string };
export type ChipProps = ChipButtonProps | ChipLinkProps;

/** A controlled choice: a toggle button for filtering, or a real category link. */
export function Chip(props: ChipProps) {
  if (typeof props.href === "string") {
    const {
      selected = false,
      disabled = false,
      size = "sm",
      className = "",
      children,
      href,
      "aria-current": current = "page",
      onClick,
      onAuxClick,
      tabIndex,
      ...native
    } = props;
    return (
      <a
        {...native}
        href={disabled ? undefined : href}
        role={disabled ? "link" : native.role}
        tabIndex={disabled ? -1 : tabIndex}
        aria-current={selected ? current : undefined}
        aria-disabled={disabled || undefined}
        data-selected={selected}
        data-disabled={disabled || undefined}
        data-size={size}
        className={`tz-chip ${className}`}
        onClick={(event) => {
          if (disabled) event.preventDefault();
          else onClick?.(event);
        }}
        onAuxClick={(event) => {
          if (disabled) event.preventDefault();
          else onAuxClick?.(event);
        }}
      >
        <span className="tz-chip-label">{children}</span>
      </a>
    );
  }
  const {
    selected = false,
    disabled = false,
    size = "sm",
    className = "",
    children,
    type = "button",
    ...native
  } = props;
  return (
    <button
      {...native}
      type={type}
      disabled={disabled}
      aria-pressed={selected}
      aria-current={undefined}
      data-selected={selected}
      data-disabled={disabled || undefined}
      data-size={size}
      className={`tz-chip ${className}`}
    >
      <span className="tz-chip-label">{children}</span>
    </button>
  );
}
