import type { SuggestedEditsLabels } from "./SuggestedEdits";
import { nounGender } from "./format";
import { inlineDiffCopy } from "./inline-diff-copy";

// Suggested edits' built-in words, InlineDiff's included. The pattern picks a
// set by direction and merges its `labels` over it. They live here because a
// component file that exports anything but components breaks fast refresh.
// The receipt's verb agrees with تعديل, which is masculine: «طُبّق تعديلان من ٣».

const appliedVerb = nounGender("edit") === "m" ? "طُبّق" : "طُبّقت";

export const suggestedEditsCopy: {
  ar: SuggestedEditsLabels;
  en: SuggestedEditsLabels;
} = {
  ar: {
    ...inlineDiffCopy.ar,
    region: "نص قابل للتحسين",
    rewriting: "يعيد الصياغة…",
    title: "اقتراح المساعد",
    position: (current, total) => `${current} من ${total}`,
    previous: "التعديل السابق",
    next: "التعديل التالي",
    rejectAll: "رفض الكل",
    acceptAll: "قبول الكل",
    apply: "تطبيق",
    dismiss: "تجاهل",
    undo: "تراجع",
    plainText: "يُطبَّق كنص عادي",
    reviewing: (_count, edits) => `اقتراح المساعد جاهز للمراجعة: ${edits}`,
    applied: (count, edits, total) =>
      count === 0
        ? "لم يُطبَّق أي تعديل"
        : `${appliedVerb} ${edits} من ${total}`,
  },
  en: {
    ...inlineDiffCopy.en,
    region: "Text you can improve",
    rewriting: "Rewriting…",
    title: "Assistant suggestion",
    position: (current, total) => `${current} of ${total}`,
    previous: "Previous edit",
    next: "Next edit",
    rejectAll: "Reject all",
    acceptAll: "Accept all",
    apply: "Apply",
    dismiss: "Dismiss",
    undo: "Undo",
    plainText: "Applied as plain text",
    reviewing: (_count, edits) => `Suggestion ready to review: ${edits}`,
    applied: (count, edits, total) =>
      count === 0 ? "No edits applied" : `Applied ${edits} out of ${total}`,
  },
};
