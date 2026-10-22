import { today } from "../frame/screen";
import type { Screen } from "../frame/screen";
import { story } from "../../system/ai/examples/finance-story";
import type { Invoice } from "./data";
import { dayCount } from "./words";

export type InvoiceStatus = "late" | "paid" | "upcoming";

const day = 86_400_000;

/** Whole days between the due date and the screens' clock; 0 until it is late. */
export function daysLate(invoice: Invoice): number {
  if (invoice.paid) return 0;
  return Math.max(
    0,
    Math.round((Date.parse(today) - Date.parse(invoice.due)) / day),
  );
}

export function statusOf(invoice: Invoice): InvoiceStatus {
  return invoice.paid ? "paid" : daysLate(invoice) > 0 ? "late" : "upcoming";
}

/**
 * The reminder the collections agent drafts for a late invoice, in the page
 * language. It addresses the whole team of the customer («تجدون»), so it needs
 * no gender for the contact.
 */
export function reminderText(
  invoice: Invoice,
  screen: Pick<Screen, "language" | "number" | "money" | "date">,
): string {
  const { language, money, date } = screen;
  const first = invoice.contact[language].split(" ")[0];
  const amount = money(invoice.amount);
  const days = dayCount(screen, daysLate(invoice));
  return language === "ar"
    ? `مرحبًا ${first}،\n\nنودّ تذكيركم بأن الفاتورة ${invoice.id} بمبلغ ${amount} استُحقّت في ${date(invoice.due)}، أي قبل ${days}، ولم يصلنا سدادها بعد. تجدون نسخة منها مرفقة.\n\nنرجو السداد خلال هذا الأسبوع، وإن كان قد تمّ فيُرجى تجاهل هذه الرسالة.\n\nمع الشكر،\n${story.team.ar}`
    : `Hello ${first},\n\nThis is a reminder that invoice ${invoice.id} for ${amount} was due on ${date(invoice.due)}, ${days} ago, and we haven't received the payment yet. A copy is attached.\n\nPlease settle it this week. If it's already paid, please disregard this message.\n\nThank you,\n${story.team.en}`;
}
