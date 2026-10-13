import { Avatar } from "../../index";
// A local, original SVG portrait; no remote image or random color.
const portrait = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#e2e7e3"/><circle cx="32" cy="24" r="11" fill="#616b64"/><path d="M10 64V56a22 22 0 0 1 44 0v8" fill="#616b64"/></svg>')}`;
export function AvatarExamples({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const name = language === "ar" ? "سارة علي" : "Sara Ali";
  return (
    <div className="tz-preferences-actions">
      <Avatar
        name={name}
        fallback={language === "ar" ? "س ع" : "SA"}
        src={portrait}
      />
      <Avatar name={name} fallback={language === "ar" ? "س ع" : "SA"} />
      <Avatar
        name={name}
        fallback={language === "ar" ? "س ع" : "SA"}
        decorative
      />
      <span>{name}</span>
    </div>
  );
}
