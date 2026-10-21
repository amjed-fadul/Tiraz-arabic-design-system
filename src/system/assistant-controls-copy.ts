import type { AssistantControlsLabels } from "./AssistantControls";

// Assistant controls' built-in words. The pattern picks a set by direction and
// merges its `labels` over it. They live here because a component file that
// exports anything but components breaks fast refresh. The words are the
// person's own settings, so none of them speaks for the assistant's work.
export const assistantControlsCopy: {
  ar: AssistantControlsLabels;
  en: AssistantControlsLabels;
} = {
  ar: {
    title: "إعدادات المساعد",
    permissions: "الصلاحيات",
    memory: "الذاكرة",
    context: "السياق والاستخدام",
    levels: {
      always: "اسأل دائمًا",
      sensitive: "إن كان حساسًا",
      auto: "تلقائي بالكامل",
    },
    risks: { sensitive: "حساس", irreversible: "لا يمكن التراجع" },
    locked: "لا يمكن التراجع عن هذا الإجراء، لذلك يسألك المساعد قبله دائمًا.",
    useMemory: "استخدم الذاكرة",
    memoryOff: "لا يستخدم المساعد الذاكرة الآن.",
    paused: "متوقف مؤقتًا",
    pause: "إيقاف مؤقت",
    resume: "استئناف",
    delete: "حذف",
    model: "النموذج",
  },
  en: {
    title: "Assistant controls",
    permissions: "Permissions",
    memory: "Memory",
    context: "Context and usage",
    levels: {
      always: "Always ask",
      sensitive: "If sensitive",
      auto: "Fully automatic",
    },
    risks: { sensitive: "Sensitive", irreversible: "Can't be undone" },
    locked: "This action can't be undone, so the assistant always asks first.",
    useMemory: "Use memory",
    memoryOff: "The assistant isn't using memory right now.",
    paused: "Paused",
    pause: "Pause",
    resume: "Resume",
    delete: "Delete",
    model: "Model",
  },
};
