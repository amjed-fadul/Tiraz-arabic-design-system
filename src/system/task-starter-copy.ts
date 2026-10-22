import type { TaskStarterLabels } from "./TaskStarter";

// Start a task's built-in words. The pattern picks a set by direction and
// merges its `labels` over it. They live here because a component file that
// exports anything but components breaks fast refresh. The tasks in the recent
// list are feminine (المهمة), so their status words agree with it, as Agent
// task's pill does.

// What agrees with a count of records: «لا سجلات مرفقة», «سجل واحد مرفق»,
// «سجلّان مرفقان», «٣ سجلات مرفقة», «١١ سجلًا مرفقًا», «١٠٠ سجل مرفق».
const arabicPlural = new Intl.PluralRules("ar");
const attachedWord = {
  zero: "مرفقة",
  one: "مرفق",
  two: "مرفقان",
  few: "مرفقة",
  many: "مرفقًا",
  other: "مرفق",
};

export const taskStarterCopy: {
  ar: TaskStarterLabels;
  en: TaskStarterLabels;
} = {
  ar: {
    title: "ماذا نُنجز اليوم؟",
    field: "طلبك",
    placeholder: "اطلب مهمة أو اسأل عن بياناتك… اكتب @ لإضافة سجل",
    attach: "إرفاق ملف",
    mention: "إضافة سجل",
    voice: "إملاء صوتي",
    send: "إرسال",
    failure: "تعذّر الإرسال. مسودتك محفوظة، حاول مرة أخرى.",
    removeContext: (name) => `إزالة ${name}`,
    contextAdded: (name) => `أُضيف إلى السياق: ${name}`,
    contextRemoved: (name) => `أُزيل من السياق: ${name}`,
    contextStatus: (status) => `السياق: ${status}`,
    mode: "الوضع",
    model: "النموذج",
    unavailable: "غير متاح",
    used: (percent) => `السياق المستخدم ${percent}`,
    attached: (count, records) =>
      `${records} ${attachedWord[arabicPlural.select(count) as keyof typeof attachedWord]}`,
    suggestions: "مقترحة من هذه الصفحة",
    recent: "مهام حديثة",
    recentStates: {
      idle: "جاهزة",
      running: "يعمل",
      "needs-you": "بانتظارك",
      completed: "اكتملت",
      failed: "تعثّرت",
      stopped: "أُوقفت",
    },
  },
  en: {
    title: "What should we get done today?",
    field: "Your request",
    placeholder: "Ask for a task or about your data… type @ to add a record",
    attach: "Attach a file",
    mention: "Add a record",
    voice: "Dictate",
    send: "Send",
    failure: "Could not send. Your draft is kept; try again.",
    removeContext: (name) => `Remove ${name}`,
    contextAdded: (name) => `Added to context: ${name}`,
    contextRemoved: (name) => `Removed from context: ${name}`,
    contextStatus: (status) => `Context: ${status}`,
    mode: "Mode",
    model: "Model",
    unavailable: "Unavailable",
    used: (percent) => `Context used ${percent}`,
    attached: (count, records) =>
      `${count === 0 ? "No records" : records} attached`,
    suggestions: "Suggested for this page",
    recent: "Recent tasks",
    recentStates: {
      idle: "Ready",
      running: "Working",
      "needs-you": "Needs you",
      completed: "Done",
      failed: "Failed",
      stopped: "Stopped",
    },
  },
};
