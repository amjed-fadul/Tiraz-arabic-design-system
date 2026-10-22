import type { ApprovalCardLabels } from "./ApprovalCard";
import type { ApprovalFlowLabels } from "./ApprovalFlow";
import type { AskUserQuestionsLabels } from "./AskUserQuestions";

// The decision patterns' built-in words. Each pattern picks a set by direction
// and merges its `labels` over it. They live here because a component file
// that exports anything but components breaks fast refresh.

export const approvalCardCopy: {
  ar: ApprovalCardLabels;
  en: ApprovalCardLabels;
} = {
  ar: {
    target: "الهدف",
    oneTime: "قرار لمرة واحدة",
    recording: "جارٍ تسجيل القرار",
    failed: "تعذّر تسجيل القرار. راجع الطلب وحاول مرة أخرى.",
    retryHint: "يمكنك إعادة المحاولة أو الرفض.",
    approved: "تمت الموافقة",
    rejected: "رُفض الطلب",
    expired: "انتهت مهلة الطلب",
    irreversible: "لا يمكن التراجع عن هذا الإجراء.",
    needsYou: "بانتظارك",
    scope: "الموافقة تخصّ هذا الطلب وحده، ويتولّى التطبيق تنفيذه.",
  },
  en: {
    target: "Target",
    oneTime: "One-time decision",
    recording: "Recording decision",
    failed: "Decision was not accepted. Review and try again.",
    retryHint: "You can retry or reject.",
    approved: "Approved",
    rejected: "Request rejected",
    expired: "Request expired",
    irreversible: "This can't be undone.",
    needsYou: "Needs you",
    scope:
      "Approval records a decision for this request only. Execution belongs to the host.",
  },
};

export const approvalFlowCopy: {
  ar: ApprovalFlowLabels;
  en: ApprovalFlowLabels;
} = {
  ar: {
    position: (current, total) => `الطلب ${current} من ${total}`,
    history: "القرارات السابقة",
    allDecided: "اكتملت مراجعة الطلبات.",
    none: "لا طلبات للمراجعة.",
  },
  en: {
    position: (current, total) => `Request ${current} of ${total}`,
    history: "Prior decisions",
    allDecided: "All decisions made.",
    none: "No requests to review.",
  },
};

export const askUserQuestionsCopy: {
  ar: AskUserQuestionsLabels;
  en: AskUserQuestionsLabels;
} = {
  ar: {
    name: "أسئلة المساعد",
    position: (current, total) => `السؤال ${current} من ${total}`,
    previous: "السؤال السابق",
    next: "السؤال التالي",
    submit: "إرسال الإجابات",
    skip: "تخطّي الأسئلة",
    other: "إجابة أخرى",
    otherAnswer: "إجابة أخرى",
    required: "أجب عن هذا السؤال للمتابعة.",
    submitting: "جارٍ إرسال الإجابات",
    accepted: "أُرسلت الإجابات.",
    failed: "تعذّر إرسال الإجابات. مسودتك محفوظة، حاول مرة أخرى.",
    hint: (first, last) => `اضغط ${first}–${last} للاختيار`,
    empty: "لا توجد أسئلة.",
    answers: "إجاباتك",
    editAnswers: "تعديل الإجابات",
    needsYou: "بانتظارك",
  },
  en: {
    name: "Assistant questions",
    position: (current, total) => `Question ${current} of ${total}`,
    previous: "Previous question",
    next: "Next question",
    submit: "Submit answers",
    skip: "Skip questions",
    other: "Other",
    otherAnswer: "Other answer",
    required: "Answer this question to continue.",
    submitting: "Submitting answers",
    accepted: "Answers accepted.",
    failed: "Answers were not accepted. Your draft is preserved.",
    hint: (first, last) => `Press ${first}–${last} to choose`,
    empty: "No questions.",
    answers: "Your answers",
    editAnswers: "Edit answers",
    needsYou: "Needs you",
  },
};
