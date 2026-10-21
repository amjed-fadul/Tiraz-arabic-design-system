import type { DraftReviewLabels } from "./DraftReview";

// The built-in words of Draft for review, picked by direction with the host's
// `labels` merged over them. They live here because a component file that
// exports anything but components breaks fast refresh. The words agree with
// الرسالة and المسودة, which are feminine: تُرسَل، أُرسلت. A receipt says what
// happened to the message, never that a sent message came back.
export const draftReviewCopy: {
  ar: DraftReviewLabels;
  en: DraftReviewLabels;
} = {
  ar: {
    title: "مسودة للمراجعة",
    pills: {
      writing: "يكتب",
      ready: "بانتظار مراجعتك",
      sending: "تُرسَل",
      sent: "أُرسلت",
      discarded: "تم التجاهل",
    },
    to: "إلى",
    attachments: "المرفقات",
    suggestion: "اقتراح المساعد",
    message: "نص الرسالة",
    tone: "النبرة",
    tones: { friendly: "ودّي", brief: "مختصر", formal: "رسمي" },
    discard: "تجاهل",
    send: "إرسال",
    undo: "تراجع",
    sendingIn: (time) => `تُرسَل خلال ${time}`,
    sendingNow: "تُرسَل الآن…",
    sent: "أُرسلت الرسالة",
    discarded: "تم تجاهل المسودة",
    saysWriting: "يكتب المسودة",
    saysReady: "المسودة بانتظار مراجعتك",
    saysSending: "تُرسَل الرسالة",
    saysSendingIn: (time) => `تُرسَل الرسالة خلال ${time}. يمكنك التراجع.`,
    saysCancelled: "أُلغي الإرسال، والمسودة محفوظة",
    saysSentAfterUndo: "أُرسلت الرسالة قبل أن يُلغى الإرسال",
  },
  en: {
    title: "Draft for review",
    pills: {
      writing: "Writing",
      ready: "Waiting for your review",
      sending: "Sending",
      sent: "Sent",
      discarded: "Discarded",
    },
    to: "To",
    attachments: "Attachments",
    suggestion: "Assistant suggestion",
    message: "Message",
    tone: "Tone",
    tones: { friendly: "Friendly", brief: "Brief", formal: "Formal" },
    discard: "Discard",
    send: "Send",
    undo: "Undo",
    sendingIn: (time) => `Sending in ${time}`,
    sendingNow: "Sending now…",
    sent: "Message sent",
    discarded: "Draft discarded",
    saysWriting: "Writing the draft",
    saysReady: "The draft is waiting for your review",
    saysSending: "Sending the message",
    saysSendingIn: (time) => `Sending in ${time}. You can undo.`,
    saysCancelled: "Sending cancelled; the draft is kept",
    saysSentAfterUndo: "The message was sent before it could be cancelled",
  },
};
