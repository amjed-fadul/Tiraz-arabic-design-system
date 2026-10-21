import { story } from "../../system/ai/examples/finance-story";

/** A text in both languages. */
export interface Text {
  ar: string;
  en: string;
}

export interface Invoice {
  id: string;
  customer: Text;
  /** Who the reminder goes to. */
  contact: Text;
  amount: number;
  /** The due date, ISO. */
  due: string;
  /** Paid invoices are never late, whatever their due date. */
  paid?: true;
}

// The story's three customers and their four invoices keep the story's names,
// amounts and contact; their due dates are the only thing added, except
// INV-1043's, which the story's draft gives (12 days late on 18 Oct).
const [madar, alNada, alRowad] = story.customers;
const [inv1043, inv1046] = madar.invoices;
const contacts = {
  madar: story.draft.recipient,
  alNada: { ar: "محمد القحطاني", en: "Mohammed Al-Qahtani" },
  alRowad: { ar: "نورة الدوسري", en: "Noura Al-Dosari" },
} as const;

/**
 * Sixteen invoices in due order: the story's four, eight more late ones (each
 * under 8,000 and 13,500 together, so the twelve late ones make the story's
 * 48,300), two paid and two not yet due.
 */
export const invoices: readonly Invoice[] = [
  {
    id: "INV-1033",
    customer: { ar: "مؤسسة الأفق", en: "Al Ufuq Establishment" },
    contact: { ar: "عبدالله المطيري", en: "Abdullah Al-Mutairi" },
    amount: 3_200,
    due: "2026-09-24",
  },
  {
    id: "INV-1035",
    customer: { ar: "صيدلية الشفاء", en: "Al Shifa Pharmacy" },
    contact: { ar: "رنا الجهني", en: "Rana Al-Juhani" },
    amount: 4_750,
    due: "2026-09-26",
    paid: true,
  },
  {
    id: alNada.invoices[0].id,
    customer: alNada.name,
    contact: contacts.alNada,
    amount: alNada.invoices[0].amount,
    due: "2026-09-28",
  },
  {
    id: "INV-1034",
    customer: { ar: "شركة بيان للتقنية", en: "Bayan Technology" },
    contact: { ar: "هند الغامدي", en: "Hind Al-Ghamdi" },
    amount: 1_850,
    due: "2026-09-30",
  },
  {
    id: "INV-1036",
    customer: { ar: "مطاعم السراة", en: "Al Sarat Restaurants" },
    contact: { ar: "فيصل الزهراني", en: "Faisal Al-Zahrani" },
    amount: 2_100,
    due: "2026-10-01",
  },
  {
    id: "INV-1040",
    customer: { ar: "مخبز الحياة", en: "Al Hayat Bakery" },
    contact: { ar: "أحمد البلوي", en: "Ahmed Al-Balawi" },
    amount: 3_300,
    due: "2026-10-02",
    paid: true,
  },
  {
    id: "INV-1037",
    customer: { ar: "الواحة للمقاولات", en: "Al Waha Contracting" },
    contact: { ar: "ماجد السبيعي", en: "Majed Al-Subaie" },
    amount: 1_200,
    due: "2026-10-03",
  },
  {
    id: alRowad.invoices[0].id,
    customer: alRowad.name,
    contact: contacts.alRowad,
    amount: alRowad.invoices[0].amount,
    due: "2026-10-04",
  },
  {
    id: "INV-1038",
    customer: { ar: "مكتب رؤية للاستشارات", en: "Ru'ya Consulting Office" },
    contact: { ar: "لمى الشهري", en: "Lama Al-Shehri" },
    amount: 950,
    due: "2026-10-05",
  },
  {
    id: inv1043.id,
    customer: madar.name,
    contact: contacts.madar,
    amount: inv1043.amount,
    due: story.draft.due,
  },
  {
    id: "INV-1042",
    customer: {
      ar: "مصنع الجزيرة للبلاستيك",
      en: "Al Jazira Plastics Factory",
    },
    contact: { ar: "خالد الدوسري", en: "Khaled Al-Dosari" },
    amount: 1_700,
    due: "2026-10-07",
  },
  {
    id: "INV-1044",
    customer: { ar: "شركة ريف للأغذية", en: "Reef Foods" },
    contact: { ar: "منى الحربي", en: "Muna Al-Harbi" },
    amount: 1_400,
    due: "2026-10-09",
  },
  {
    id: inv1046.id,
    customer: madar.name,
    contact: contacts.madar,
    amount: inv1046.amount,
    due: "2026-10-10",
  },
  {
    id: "INV-1045",
    customer: { ar: "مؤسسة الفرسان للنقل", en: "Al Fursan Transport" },
    contact: { ar: "تركي العنزي", en: "Turki Al-Anazi" },
    amount: 1_100,
    due: "2026-10-12",
  },
  {
    id: "INV-1047",
    customer: { ar: "شركة المسار للخدمات", en: "Al Masar Services" },
    contact: { ar: "سلمى الرشيد", en: "Salma Al-Rasheed" },
    amount: 5_600,
    due: "2026-10-28",
  },
  {
    id: "INV-1048",
    customer: { ar: "مؤسسة الغدير", en: "Al Ghadeer Establishment" },
    contact: { ar: "بدر الشمري", en: "Badr Al-Shammari" },
    amount: 2_900,
    due: "2026-11-04",
  },
];

/** The reminders the collections agent has already written, as the story has them. */
export const readyReminders: readonly string[] = [
  inv1043.id,
  alNada.invoices[0].id,
  alRowad.invoices[0].id,
];
