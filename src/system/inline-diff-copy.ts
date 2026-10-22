import type { InlineDiffLabels } from "./InlineDiff";

// InlineDiff's built-in words. The part picks a set by direction and merges
// its `labels` over it. They live here because a component file that exports
// anything but components breaks fast refresh. A change is named by what it
// does, with verbal nouns, so no label addresses the reader by gender.

export const inlineDiffCopy: { ar: InlineDiffLabels; en: InlineDiffLabels } = {
  ar: {
    accept: "قبول",
    reject: "رفض",
    change: (removed, added) =>
      removed && added
        ? `حذف «${removed}» وإضافة «${added}»`
        : added
          ? `إضافة «${added}»`
          : `حذف «${removed}»`,
    shortcut: (key) => `اختصار لوحة المفاتيح: ${key}`,
  },
  en: {
    accept: "Accept",
    reject: "Reject",
    change: (removed, added) =>
      removed && added
        ? `Delete “${removed}” and insert “${added}”`
        : added
          ? `Insert “${added}”`
          : `Delete “${removed}”`,
    shortcut: (key) => `Keyboard shortcut: ${key}`,
  },
};
