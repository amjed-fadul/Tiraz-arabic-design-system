import type { ActivityPanel, ActivitySnapshot } from "./activity-runtime";

export const effortNames = {
  ar: ["سريع", "متوازن", "عميق", "شامل"],
  en: ["Quick", "Balanced", "Deep", "Thorough"],
};

export function workspaceStatus(
  snapshot: ActivitySnapshot | null,
  ar: boolean,
) {
  if (!snapshot)
    return ar
      ? "يظهر العمل هنا بعد إرسال طلبك"
      : "The work appears here when you send a request";
  if (snapshot.status === "stopped")
    return ar ? "أُوقفت المراجعة" : "Sample review stopped";
  if (snapshot.activities.some((item) => item.status === "needs-input"))
    return ar ? "ينتظر قرارك" : "Waiting for you";
  if (snapshot.activities.some((item) => item.status === "error"))
    return ar ? "تعذّر إكمال جزء من المراجعة" : "Part of the review failed";
  if (snapshot.status === "complete")
    return ar ? "اكتملت المراجعة" : "Sample review complete";
  if (!snapshot.activities.length)
    return ar ? "يخطط للمراجعة" : "Planning the review";
  return ar ? "يراجع مسار التسجيل" : "Reviewing the signup flow";
}

export function panelCopy(language: "ar" | "en") {
  const t = (arabic: string, english: string) =>
    language === "ar" ? arabic : english;
  return {
    names: {
      folders: t("القراءة", "Reading"),
      research: t("البحث", "Research"),
      skills: t("الفحوص", "Checks"),
      "agent-0": t("المستكشف", "Explorer"),
      "agent-1": t("المحلّل", "Analyst"),
      "agent-2": t("المراجِع", "Reviewer"),
    } as Partial<Record<ActivityPanel, string>>,
    close: t("إغلاق", "Close"),
  };
}

/** The agents' work is the reply's log; tool panels only hold their evidence. */
export const isAgent = (panel: ActivityPanel) => panel.startsWith("agent-");
