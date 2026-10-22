import type { Screen } from "../frame/screen";
import { dayCount } from "../invoices/words";
import { stages } from "./data";
import type { Deal, StageId } from "./data";

// Counts with the words that agree with them (spec §1). These stand alone, as
// a column's count and the header's, so they take the nominative.
const arabicPlural = new Intl.PluralRules("ar");
type Words = Pick<Screen, "language" | "number">;

/** «صفقة واحدة» · «صفقتان» · «٣ صفقات» · «١٢ صفقة» / "10 deals". */
export function dealCount({ language, number }: Words, count: number) {
  if (language === "en")
    return `${number(count)} ${count === 1 ? "deal" : "deals"}`;
  switch (arabicPlural.select(count)) {
    case "zero":
      return "لا صفقات";
    case "one":
      return "صفقة واحدة";
    case "two":
      return "صفقتان";
    case "few":
      return `${number(count)} صفقات`;
    default:
      return `${number(count)} صفقة`;
  }
}

/** «انتقلت اليوم» · «يوم واحد في المرحلة» · «يومان في المرحلة» · «٤ أيام في المرحلة». */
export function daysInStage(screen: Words, days: number) {
  const { language } = screen;
  if (days === 0) return language === "ar" ? "انتقلت اليوم" : "Moved today";
  if (language === "en") return `${dayCount(screen, days)} in stage`;
  return `${days === 2 ? "يومان" : dayCount(screen, days)} في المرحلة`;
}

/**
 * An English name's two initials, skipping the family name's «Al-» ("Nasser
 * Al-Buqami" is NB). Avatar already skips the Arabic «ال», so Arabic names
 * need no override.
 */
export function englishInitials(name: string, language: "ar" | "en") {
  if (language === "ar") return undefined;
  const parts = name.split(/\s+/);
  const family = parts[parts.length - 1].replace(/^al-?/i, "");
  return `${parts[0][0]}${family[0]}`.toUpperCase();
}

export const stageName = (id: StageId) =>
  stages.find((stage) => stage.id === id)!.name;

/**
 * The follow-up the assistant drafts for a deal, in the page language. What it
 * says follows the stage the deal is in, so a deal that moves on is followed
 * up differently.
 */
export function followUpText(
  deal: Deal,
  language: "ar" | "en",
  owner: string,
): string {
  const first = deal.contact[language].split(" ")[0];
  const topic = deal.topic[language];
  const line =
    language === "ar"
      ? {
          new: `يسعدنا التعرّف على احتياجاتكم في ${topic}، ونقترح مكالمة تعريفية قصيرة.`,
          qualified: `شكرًا لوقتكم في اللقاء الأخير حول ${topic}. نودّ ترتيب الخطوة التالية معكم.`,
          quote: `أرسلنا لكم عرض السعر الخاص ب${topic}، ويسعدنا الإجابة عن أي استفسار حوله.`,
          negotiation: `نواصل العمل على بنود ${topic}، ونودّ مراجعتها معكم هذا الأسبوع.`,
          won: `يسعدنا البدء في ${topic}، ونودّ ترتيب اجتماع الانطلاق معكم.`,
        }[deal.stage]
      : {
          new: `We'd love to learn what you need from ${topic}, and suggest a short intro call.`,
          qualified: `Thank you for your time at our last meeting about ${topic}. We'd like to agree the next step with you.`,
          quote: `We sent you the quote for ${topic}, and we're happy to answer any question about it.`,
          negotiation: `We're working through the terms of ${topic} and would like to review them with you this week.`,
          won: `We're glad to get started on ${topic}, and would like to plan the kickoff meeting with you.`,
        }[deal.stage];
  return language === "ar"
    ? `مرحبًا ${first}،\n\n${line}\n\nمع الشكر،\n${owner}`
    : `Hello ${first},\n\n${line}\n\nThank you,\n${owner}`;
}
