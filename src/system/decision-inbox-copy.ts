import type { DecisionInboxLabels } from "./DecisionInbox";

// The built-in words of the Decision inbox, picked by direction with the
// host's `labels` merged over them. They live here because a component file
// that exports anything but components breaks fast refresh.
export const decisionInboxCopy: {
  ar: DecisionInboxLabels;
  en: DecisionInboxLabels;
} = {
  ar: {
    title: "صندوق القرارات",
    byStatus: "الطلبات حسب الحالة",
    tabs: {
      all: "الكل",
      "needs-you": "بانتظارك",
      running: "يعمل",
      completed: "اكتملت",
    },
    // A failed or finished row agrees with المهمة.
    pills: {
      "needs-you": "بانتظارك",
      running: "يعمل",
      failed: "تعثّرت",
      completed: "اكتملت",
    },
    draft: "بانتظار مراجعتك",
    agents: "الوكلاء",
    steps: "آخر الخطوات",
    review: "راجع",
    answer: "أجب",
    retry: "أعد المحاولة",
    open: "افتح",
    waiting: (_count, requests) => `${requests} بانتظارك`,
    // The verb agrees with مهام: تعمل, and the dual تعملان for two.
    running: (count, tasks) => `${tasks} ${count === 2 ? "تعملان" : "تعمل"}`,
    nothingWaiting: "لا شيء بانتظارك",
    nothingWaitingHint: "سيظهر هنا كل طلب يحتاج قرارك.",
    nothingHere: "لا شيء هنا الآن",
  },
  en: {
    title: "Decision inbox",
    byStatus: "Requests by status",
    tabs: {
      all: "All",
      "needs-you": "Needs you",
      running: "Running",
      completed: "Done",
    },
    pills: {
      "needs-you": "Needs you",
      running: "Running",
      failed: "Failed",
      completed: "Done",
    },
    draft: "Waiting for your review",
    agents: "Agents",
    steps: "Latest steps",
    review: "Review",
    answer: "Answer",
    retry: "Try again",
    open: "Open",
    waiting: (count, requests) =>
      `${requests} ${count === 1 ? "needs" : "need"} you`,
    running: (_count, tasks) => `${tasks} running`,
    nothingWaiting: "Nothing needs you",
    nothingWaitingHint: "Every request that needs your decision shows up here.",
    nothingHere: "Nothing here right now",
  },
};
