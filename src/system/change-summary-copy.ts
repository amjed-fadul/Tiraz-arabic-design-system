import type { ChangeSummaryLabels } from "./ChangeSummary";

// What changed's built-in words. The pattern picks a set by direction and
// merges its `labels` over it. They live here because a component file that
// exports anything but components breaks fast refresh. The summary is
// masculine (الملخص), so the pill and the sentences agree with it.

export const changeSummaryCopy: {
  ar: ChangeSummaryLabels;
  en: ChangeSummaryLabels;
} = {
  ar: {
    title: "ما الذي تغيّر",
    madeByAssistant: "أعدّه المساعد",
    updatingPill: "يحدّث",
    failedPill: "تعثّر",
    directions: { up: "ارتفع", down: "انخفض", flat: "ثابت" },
    reason: "السبب الأرجح",
    refresh: "تحديث",
    retry: "أعد المحاولة",
    updating: "يحدّث الملخص",
    ready: "الملخص جاهز",
    stale: "قد يكون الملخص قديمًا",
    failed: "تعذّر تحديث الملخص",
  },
  en: {
    title: "What changed",
    madeByAssistant: "Prepared by the assistant",
    updatingPill: "Updating",
    failedPill: "Failed",
    directions: { up: "Up", down: "Down", flat: "Unchanged" },
    reason: "Most likely reason",
    refresh: "Refresh",
    retry: "Try again",
    updating: "Updating the summary",
    ready: "Summary ready",
    stale: "The summary may be out of date",
    failed: "Couldn't update the summary",
  },
};
