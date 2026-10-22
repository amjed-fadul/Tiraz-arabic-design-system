import { Avatar, AvatarGroup, numberLocale, useSystem } from "../../index";
import { saraPortrait, omarPortrait, photoMembers } from "./portraits";
const arabicPlural = new Intl.PluralRules("ar");
/** Arabic counts agree with the noun: one, the dual, 3–10, then 11 and up. */
function arabicOthers(count: number, digits: Intl.NumberFormat) {
  switch (arabicPlural.select(count)) {
    case "one":
      return "عضو آخر";
    case "two":
      return "عضوان آخران";
    case "few":
      return `${digits.format(count)} أعضاء آخرون`;
    case "many":
      return `${digits.format(count)} عضوًا آخر`;
    default:
      return `${digits.format(count)} عضو آخر`;
  }
}
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
          ar ? arabicOthers(count, number) : `${count} more members`
        }
      />
    </div>
  );
}
