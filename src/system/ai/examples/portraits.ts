import saraPortrait from "../assets/sara.jpg";
import omarPortrait from "../assets/omar.jpg";
import { teamMembers } from "./team";
export { saraPortrait, omarPortrait };
export function photoMembers(language: "ar" | "en") {
  return teamMembers(language).map((member) => ({
    ...member,
    src:
      member.id === "sara"
        ? saraPortrait
        : member.id === "omar"
          ? omarPortrait
          : undefined,
  }));
}
