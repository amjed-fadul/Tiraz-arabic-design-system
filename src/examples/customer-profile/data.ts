import { story } from "../../system/ai/examples/finance-story";
import { invoices } from "../invoices/data";

const madar = story.customers[0];

/** شركة مدار as the story has it, with its contact; the rest is added. */
export const customer = {
  id: madar.id,
  name: madar.name,
  contact: story.draft.recipient,
  email: "sara.alotaibi@madar.example",
  /** Days from an invoice's date to its due date. */
  terms: 30,
  /** Who looks after the account. */
  owner: story.user,
};

/**
 * Madar's invoices come from the Invoices screen's data, so the two screens
 * agree; each was issued `terms` days before it fell due.
 */
export const customerInvoices = invoices.filter(
  (invoice) => invoice.customer.en === madar.name.en,
);
export const issued: Readonly<Record<string, string>> = {
  "INV-1043": "2026-09-06",
  "INV-1046": "2026-09-10",
};

/** The first reminder, and Sara's reply with her promise to pay. */
export const reminder = { on: "2026-10-12", invoice: "INV-1043" };
export const promise = { on: "2026-10-14", before: "2026-10-25" };

/** How many days late Madar paid in each month of 2026, January to October. */
export const daysLateByMonth: readonly number[] = [
  3, 5, 4, 8, 6, 9, 7, 11, 10, 12,
];
