import { Code2, Search, ShieldCheck } from "lucide-react";

export const agentDefinitions = [
  {
    name: ["Explorer", "المستكشف"],
    icon: Search,
    purpose: ["Maps the codebase", "استكشاف المكونات"],
    actions: [
      ["Read selected files", "قراءة الملفات المحددة"],
      ["Find the composer entry", "تحديد مدخل المحرر"],
      ["Trace dependencies", "تتبّع الاعتماديات"],
      ["Map shared hooks", "تحديد الدوال المشتركة"],
      ["Summarize the context", "تلخيص السياق"],
    ],
    outcome: ["Component map ready", "خريطة المكونات جاهزة"],
  },
  {
    name: ["Builder", "المنفّذ"],
    icon: Code2,
    purpose: ["Drafts the interaction", "صياغة التفاعل"],
    actions: [
      ["Read the component map", "قراءة خريطة المكونات"],
      ["Plan the changes", "تخطيط التغييرات"],
      ["Build the interaction", "تنفيذ التفاعل"],
      ["Check focus and motion", "فحص التركيز والحركة"],
      ["Prepare the draft", "إعداد المسودة"],
    ],
    outcome: ["Interaction draft ready", "مسودة التفاعل جاهزة"],
  },
  {
    name: ["Reviewer", "المراجع"],
    icon: ShieldCheck,
    purpose: ["Checks the details", "مراجعة التفاصيل"],
    actions: [
      ["Read the proposed changes", "قراءة التغييرات المقترحة"],
      ["Inspect the component states", "فحص حالات المكونات"],
      ["Check keyboard paths", "فحص التنقل بلوحة المفاتيح"],
      ["Review the motion", "مراجعة الحركة"],
      ["Write review notes", "كتابة الملاحظات"],
    ],
    outcome: ["Review notes ready", "ملاحظات المراجعة جاهزة"],
  },
];

export const demoStepEnds = [3500, 6500, 10500, 14000, 18000];
