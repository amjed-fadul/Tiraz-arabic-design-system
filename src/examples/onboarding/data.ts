/**
 * Onboarding's facts, as values: text in both languages and numbers. The story
 * has no company still to register, so the registration, the fiscal year and
 * the assistant that reads the documents are invented here.
 */
export const company = {
  /** The name on the commercial registration, which the person's entry may differ from. */
  registered: { ar: "شركة النخيل للتجارة", en: "Al Nakheel Trading Company" },
  /** The fiscal year starts here until the person picks another day. */
  fiscalStart: "2026-01-01",
} as const;

/** The assistant that reads the uploaded documents and asks about what they leave open. */
export const assistant = {
  ar: "مساعد التوثيق",
  en: "Verification assistant",
} as const;

export const limits = {
  /** Minutes the four steps take, as the header says. */
  minutes: 5,
  registrationDigits: 10,
  codeDigits: 6,
  /** The registration and the VAT certificate. */
  files: 2,
  /** Per file, in megabytes. */
  fileSize: 5,
} as const;

/** The four steps: the short word for the stepper, then the card's title and line. */
export const steps = [
  {
    id: "company",
    label: { ar: "المنشأة", en: "Company" },
    title: { ar: "بيانات المنشأة", en: "Company details" },
    description: {
      ar: "أدخل اسم منشأتك ورقم سجلها التجاري، ثم اختر بداية سنتها المالية.",
      en: "Enter your company's name and commercial registration number, then choose when its fiscal year starts.",
    },
  },
  {
    id: "mobile",
    label: { ar: "الجوال", en: "Mobile" },
    title: { ar: "تأكيد الجوال", en: "Confirm your mobile" },
    description: {
      ar: "أدخل الرمز المرسل إلى الجوال المسجّل لدى السجل التجاري.",
      en: "Enter the code sent to the mobile registered with the commercial register.",
    },
  },
  {
    id: "documents",
    label: { ar: "المستندات", en: "Documents" },
    title: { ar: "المستندات", en: "Documents" },
    description: {
      ar: "أرفق السجل التجاري وشهادة ضريبة القيمة المضافة. المستندان مطلوبان معًا.",
      en: "Attach the commercial registration and the VAT certificate. Both are required.",
    },
  },
  {
    id: "review",
    label: { ar: "المراجعة", en: "Review" },
    title: { ar: "المراجعة", en: "Review" },
    description: {
      ar: "راجع ما أدخلته، ثم أجب عمّا تركته مستنداتك مفتوحًا.",
      en: "Review what you entered, then answer what your documents leave open.",
    },
  },
] as const;
