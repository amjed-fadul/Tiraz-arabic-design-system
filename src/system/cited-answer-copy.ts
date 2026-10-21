import type { CitedAnswerLabels } from "./CitedAnswer";
import type { FeedbackBarLabels } from "./FeedbackBar";
import type { ThinkingPanelLabels } from "./ThinkingPanel";
import { toolLabelsCopy } from "./useToolLabels";

// The built-in words of Cited answer and the parts made for it. Each part picks
// a set by direction and merges its `labels` over it. They live here because a
// component file that exports anything but components breaks fast refresh.

export const thinkingPanelCopy: {
  ar: ThinkingPanelLabels;
  en: ThinkingPanelLabels;
} = {
  ar: {
    thinking: "يفكّر",
    thought: (elapsed) => `فكّر لمدة ${elapsed}`,
    done: "فكّر",
    stopped: (elapsed) => (elapsed ? `أُوقف بعد ${elapsed}` : "أُوقف"),
    failed: (elapsed) => (elapsed ? `تعثّر بعد ${elapsed}` : "تعثّر"),
    searched: "بحث في",
    more: (count) => `+${count}`,
    showAll: "عرض كل المصادر",
    showFewer: "عرض أقل",
    steps: "خطوات التفكير",
    // The steps are feminine (الخطوة), as everywhere else.
    stepStates: {
      pending: toolLabelsCopy.ar.pending,
      running: toolLabelsCopy.ar.running,
      completed: toolLabelsCopy.ar.completed,
    },
  },
  en: {
    thinking: "Thinking",
    thought: (elapsed) => `Thought for ${elapsed}`,
    done: "Thought",
    stopped: (elapsed) => (elapsed ? `Stopped after ${elapsed}` : "Stopped"),
    failed: (elapsed) => (elapsed ? `Failed after ${elapsed}` : "Failed"),
    searched: "Searched",
    more: (count) => `+${count}`,
    showAll: "Show all sources",
    showFewer: "Show fewer",
    steps: "Thinking steps",
    stepStates: {
      pending: toolLabelsCopy.en.pending,
      running: toolLabelsCopy.en.running,
      completed: toolLabelsCopy.en.completed,
    },
  },
};

export const feedbackBarCopy: {
  ar: FeedbackBarLabels;
  en: FeedbackBarLabels;
} = {
  ar: {
    group: "إجراءات الإجابة",
    copy: "نسخ الإجابة",
    copied: "نُسخت",
    regenerate: "إعادة التوليد",
    helpful: "إجابة مفيدة",
    notHelpful: "إجابة غير مفيدة",
    reasons: "ما المشكلة؟",
    reason: {
      inaccurate: "غير دقيقة",
      "wrong-source": "مصدر خاطئ",
      "too-long": "طويلة",
      outdated: "قديمة",
    },
  },
  en: {
    group: "Answer actions",
    copy: "Copy answer",
    copied: "Copied",
    regenerate: "Regenerate",
    helpful: "Helpful",
    notHelpful: "Not helpful",
    reasons: "What was wrong?",
    reason: {
      inaccurate: "Not accurate",
      "wrong-source": "Wrong source",
      "too-long": "Too long",
      outdated: "Out of date",
    },
  },
};

/** FollowUps' default name when the host gives none. */
export const followUpsCopy = { ar: "أسئلة تالية", en: "Next questions" };

/** The heading over the sources in a copied answer (answerText). */
export const answerSourcesCopy = { ar: "المصادر", en: "Sources" };

export const citedAnswerCopy: { ar: CitedAnswerLabels; en: CitedAnswerLabels } =
  {
    ar: {
      title: "إجابة موثّقة",
      thinking: "يفكّر",
      writing: "يكتب الإجابة",
      completed: "اكتملت الإجابة",
      failed: "تعذّر إكمال الإجابة",
      stopped: "أُوقفت الإجابة",
      stop: "إيقاف",
      retry: "أعد المحاولة",
      regenerate: "إعادة التوليد",
      followUps: followUpsCopy.ar,
    },
    en: {
      title: "Cited answer",
      thinking: "Thinking",
      writing: "Writing the answer",
      completed: "Answer complete",
      failed: "Couldn't finish the answer",
      stopped: "Answer stopped",
      stop: "Stop",
      retry: "Try again",
      regenerate: "Regenerate",
      followUps: followUpsCopy.en,
    },
  };
