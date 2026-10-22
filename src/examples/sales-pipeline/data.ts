import { story } from "../../system/ai/examples/finance-story";
import { invoices } from "../invoices/data";
import type { Text } from "../invoices/data";

export type StageId = "new" | "qualified" | "quote" | "negotiation" | "won";

/** The five stages, in the order a deal moves through them. */
export const stages: readonly { id: StageId; name: Text }[] = [
  { id: "new", name: { ar: "جديد", en: "New" } },
  { id: "qualified", name: { ar: "مؤهَّل", en: "Qualified" } },
  { id: "quote", name: { ar: "عرض سعر", en: "Quote" } },
  { id: "negotiation", name: { ar: "تفاوض", en: "Negotiation" } },
  { id: "won", name: { ar: "مكسوبة", en: "Won" } },
];

/** The sales team: who owns each deal. */
export const owners = [
  { id: "reem", name: { ar: "ريم الكعبي", en: "Reem Al-Kaabi" } },
  { id: "nasser", name: { ar: "ناصر البقمي", en: "Nasser Al-Buqami" } },
  { id: "dana", name: { ar: "دانة العجمي", en: "Dana Al-Ajmi" } },
] as const;
export type OwnerId = (typeof owners)[number]["id"];

export interface Deal {
  id: string;
  customer: Text;
  /** Who a follow-up goes to. */
  contact: Text;
  /** What the deal is for, as a noun phrase. */
  topic: Text;
  /** In riyals. */
  amount: number;
  stage: StageId;
  owner: OwnerId;
  /** Whole days since the deal entered its stage. */
  days: number;
  /** What the owner does next. */
  next: Text;
}

// The story's three customers keep their names, and their contacts are the
// ones the Invoices screen has.
const [madar, alNada, alRowad] = story.customers;
const contactOf = (customer: Text) =>
  invoices.find((invoice) => invoice.customer.en === customer.en)!.contact;

/**
 * October's ten deals, in the order each stage lists them: the story's three
 * customers and seven more. Al Safwa Foods has sat in negotiation for 21 days,
 * the one stalled deal.
 */
export const deals: readonly Deal[] = [
  {
    id: "DL-3107",
    customer: { ar: "شركة تقنية الغد", en: "Tomorrow Tech" },
    contact: { ar: "هبة الصالح", en: "Heba Al-Saleh" },
    topic: { ar: "منصة إدارة المخزون", en: "the inventory platform" },
    amount: 60_000,
    stage: "new",
    owner: "reem",
    days: 1,
    next: { ar: "التواصل لأول مرة", en: "Make first contact" },
  },
  {
    id: "DL-3108",
    customer: { ar: "مؤسسة بوابة الشرق", en: "Eastern Gate Establishment" },
    contact: { ar: "عمر الزيد", en: "Omar Al-Zaid" },
    topic: { ar: "حلول الفوترة الإلكترونية", en: "e-invoicing" },
    amount: 45_000,
    stage: "new",
    owner: "nasser",
    days: 5,
    next: { ar: "تأهيل احتياجات العميل", en: "Qualify their needs" },
  },
  {
    id: "DL-3103",
    customer: alRowad.name,
    contact: contactOf(alRowad.name),
    topic: { ar: "تدريب الفريق المالي", en: "the finance team training" },
    amount: 75_000,
    stage: "qualified",
    owner: "dana",
    days: 3,
    next: { ar: "جدولة اجتماع الاحتياجات", en: "Schedule the needs meeting" },
  },
  {
    id: "DL-3109",
    customer: { ar: "مصنع الأثاث العصري", en: "Modern Furniture Factory" },
    contact: { ar: "سعاد الحمدان", en: "Suad Al-Hamdan" },
    topic: { ar: "نظام إدارة المصنع", en: "the factory management system" },
    amount: 130_000,
    stage: "qualified",
    owner: "nasser",
    days: 7,
    next: { ar: "إعداد عرض أولي", en: "Prepare a first proposal" },
  },
  {
    id: "DL-3101",
    customer: madar.name,
    contact: story.draft.recipient,
    topic: { ar: "تجديد اشتراك المنصة", en: "the platform renewal" },
    amount: 120_000,
    stage: "quote",
    owner: "reem",
    days: 6,
    next: { ar: "إرسال عرض السعر المحدّث", en: "Send the updated quote" },
  },
  {
    id: "DL-3106",
    customer: { ar: "مستشفى النور الأهلي", en: "Al Noor Private Hospital" },
    contact: { ar: "ياسر النعيمي", en: "Yasser Al-Nuaimi" },
    topic: { ar: "ربط أنظمة الفوترة", en: "the billing integration" },
    amount: 95_000,
    stage: "quote",
    owner: "dana",
    days: 2,
    next: {
      ar: "مراجعة العرض مع المدير المالي",
      en: "Review the quote with their CFO",
    },
  },
  {
    id: "DL-3102",
    customer: alNada.name,
    contact: contactOf(alNada.name),
    topic: { ar: "توسعة نظام الفوترة", en: "the billing system expansion" },
    amount: 240_000,
    stage: "negotiation",
    owner: "nasser",
    days: 9,
    next: { ar: "مراجعة بنود العقد", en: "Review the contract terms" },
  },
  {
    id: "DL-3104",
    customer: { ar: "شركة الصفوة للأغذية", en: "Al Safwa Foods" },
    contact: { ar: "علا الفهد", en: "Ola Al-Fahd" },
    topic: { ar: "تحليلات التدفق النقدي", en: "cash flow analytics" },
    amount: 180_000,
    stage: "negotiation",
    owner: "reem",
    days: 21,
    next: { ar: "متابعة رد العميل", en: "Chase their reply" },
  },
  {
    id: "DL-3105",
    customer: { ar: "مجموعة الخليج للمقاولات", en: "Gulf Contracting Group" },
    contact: { ar: "تميم الشايع", en: "Tamim Al-Shaya" },
    topic: { ar: "منصة المشتريات", en: "the procurement platform" },
    amount: 310_000,
    stage: "negotiation",
    owner: "dana",
    days: 4,
    next: { ar: "ترتيب اجتماع التسعير", en: "Set up the pricing meeting" },
  },
  {
    id: "DL-3110",
    customer: { ar: "شركة السهم للنقل", en: "Al Sahm Transport" },
    contact: { ar: "لجين المنصور", en: "Lujain Al-Mansour" },
    topic: {
      ar: "التسوية البنكية الآلية",
      en: "automated bank reconciliation",
    },
    amount: 150_000,
    stage: "won",
    owner: "reem",
    days: 3,
    next: { ar: "ترتيب اجتماع الانطلاق", en: "Plan the kickoff meeting" },
  },
];

/** What the deals in negotiation were worth a week ago, for What changed. */
export const lastWeekNegotiation = 520_000;
