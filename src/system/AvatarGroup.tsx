import { Avatar } from "./Avatar";
import { numberLocale } from "./config";
import { useSystem } from "./useSystem";
export interface AvatarMember {
  id: string;
  name: string;
  src?: string;
  fallback?: string;
}
export interface AvatarGroupProps {
  members: AvatarMember[];
  label: string;
  overflowLabel: (count: number) => string;
  maxVisible?: number;
  size?: "sm" | "md";
}
export function AvatarGroup({
  members,
  label,
  overflowLabel,
  maxVisible = 4,
  size = "sm",
}: AvatarGroupProps) {
  const limit = Number.isFinite(maxVisible)
    ? Math.max(1, Math.floor(maxVisible))
    : 4;
  const hidden = members.slice(limit);
  const digits = new Intl.NumberFormat(numberLocale(useSystem().config), {
    useGrouping: false,
  });
  return (
    <div className="tz-avatar-group" role="group" aria-label={label}>
      {members.slice(0, limit).map((member) => (
        <Avatar
          key={member.id}
          name={member.name}
          src={member.src}
          fallback={member.fallback}
          size={size}
        />
      ))}
      {hidden.length > 0 && (
        <span className="tz-avatar-overflow">
          <span className="tz-avatar" data-size={size} aria-hidden="true">
            <bdi dir="ltr">+{digits.format(hidden.length)}</bdi>
          </span>
          <span className="tz-visually-hidden">
            {overflowLabel(hidden.length)}:{" "}
            {hidden.map((member) => member.name).join("، ")}
          </span>
        </span>
      )}
    </div>
  );
}
