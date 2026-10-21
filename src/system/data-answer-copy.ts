import type { DataAnswerLabels } from "./DataAnswer";

// The built-in words of Ask your data, picked by direction with the host's
// `labels` merged over them. They live here because a component file that
// exports anything but components breaks fast refresh.
export const dataAnswerCopy: { ar: DataAnswerLabels; en: DataAnswerLabels } = {
  ar: {
    thinking: "يفكّر",
    completed: "اكتملت الإجابة",
    failed: "تعذّر إكمال الإجابة",
    empty: "لا توجد بيانات لهذه الفترة",
    thinkingPill: "يفكّر",
    // The answer is feminine (الإجابة), as in Cited answer.
    completedPill: "اكتملت",
    failedPill: "تعثّرت",
    retry: "أعد المحاولة",
    method: "كيف حُسب هذا؟",
    range: "الفترة",
    filters: "التصفية",
    noFilters: "بلا تصفية",
    tables: "الجداول",
    chartType: "نوع الرسم",
    chartTypes: { line: "خطوط", area: "مساحة", bar: "أعمدة", donut: "حلقي" },
    openTable: "افتح في جدول",
    pin: "ثبّت في اللوحة",
  },
  en: {
    thinking: "Thinking",
    completed: "Answer complete",
    failed: "Couldn't finish the answer",
    empty: "No data for this period",
    thinkingPill: "Thinking",
    completedPill: "Done",
    failedPill: "Failed",
    retry: "Try again",
    method: "How was this calculated?",
    range: "Date range",
    filters: "Filters",
    noFilters: "None",
    tables: "Source tables",
    chartType: "Chart type",
    chartTypes: { line: "Lines", area: "Area", bar: "Bars", donut: "Donut" },
    openTable: "Open in a table",
    pin: "Pin to dashboard",
  },
};
