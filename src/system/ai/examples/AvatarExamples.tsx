import { Avatar, AvatarGroup, numberLocale, useSystem } from "../../index";
import { saraPortrait, omarPortrait, photoMembers } from "./portraits";
export function AvatarExamples({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const ar = language === "ar";
  const number = new Intl.NumberFormat(
    numberLocale(useSystem().config, language),
  );
  return (
    <div className="tz-feedback-examples">
      <div className="tz-preferences-actions">
        <Avatar
          name={ar ? "سارة علي" : "Sara Ali"}
          fallback={ar ? "س ع" : "SA"}
          src={saraPortrait}
        />
        <Avatar
          name={ar ? "عمر نور" : "Omar Noor"}
          fallback={ar ? "ع ن" : "ON"}
          src={omarPortrait}
        />
        <Avatar
          name={ar ? "لينا صالح" : "Lina Saleh"}
          fallback={ar ? "ل ص" : "LS"}
        />
      </div>
      <AvatarGroup
        members={photoMembers(language)}
        label={ar ? "فريق المشروع" : "Project team"}
        maxVisible={3}
        overflowLabel={(count) =>
          ar ? `${number.format(count)} أعضاء آخرون` : `${count} more members`
        }
      />
    </div>
  );
}
