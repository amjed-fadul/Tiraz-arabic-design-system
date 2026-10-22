/** Tiraz's Warp mark, shared by the landing page, workbench and examples. */
export function TirazMark({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 4h12v4H8v16h8v4H4V4Zm24 0v24H16v-4h8V8h-8V4h12Z" />
      <path d="M10 12h12v4H10zM10 20h12v-4h-4v4z" />
    </svg>
  );
}
