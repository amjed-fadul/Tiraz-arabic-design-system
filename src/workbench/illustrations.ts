import {
  NoRecordsIllustration,
  NoSearchResultsIllustration,
  GettingStartedIllustration,
} from "../system/EmptyStateIllustrations";
import { DocumentVault } from "../illustrations/DocumentVault";
import { AgentHandoff } from "../illustrations/AgentHandoff";
import { VoiceField } from "../illustrations/VoiceField";
import type { Localized } from "./i18n";
import type { IllustrationId } from "./site-routes";
import type { ComponentType } from "react";
export type IllustrationCategory = "agents" | "workspace" | "empty";
export const illustrations: readonly {
  id: IllustrationId;
  category: IllustrationCategory;
  name: Localized;
  description: Localized;
  exportName: string;
  Component: ComponentType<{
    language?: "ar" | "en";
    animated?: boolean;
    interactive?: boolean;
  }>;
}[] = [
  {
    id: "document-vault",
    category: "workspace",
    name: ["خزنة المستندات", "Document vault"],
    description: [
      "زجاج مصنفر وطبقات من الورق. افتح الملف لتكشف ما بداخله.",
      "Frosted glass, layered paper. Open the folder to reveal what is inside.",
    ],
    exportName: "DocumentVault",
    Component: DocumentVault,
  },
  {
    id: "agent-handoff",
    category: "agents",
    name: ["تعاون الوكلاء", "Agent handoff"],
    description: [
      "طلب واحد ينتقل من البحث إلى التحليل والمراجعة، حتى يكتمل الملخّص.",
      "One request moves through research, analysis, and review to become a finished brief.",
    ],
    exportName: "AgentHandoff",
    Component: AgentHandoff,
  },
  {
    id: "voice-field",
    category: "agents",
    name: ["مجال الصوت", "Voice field"],
    description: [
      "جسيمات تتشكّل مع الاستماع والتفكير والكلام. اختر حالة وشاهد تحوّلها.",
      "A field of particles for listening, thinking, and speaking. Choose a state and watch it take shape.",
    ],
    exportName: "VoiceField",
    Component: VoiceField,
  },
  {
    id: "no-records",
    category: "empty",
    name: ["لا توجد سجلات", "No records"],
    description: [
      "مساحة تنتظر أول سجل. استخدمها مع رسالة توضّح ما يمكن إضافته.",
      "A space waiting for its first record. Pair it with a message explaining what can be added.",
    ],
    exportName: "NoRecordsIllustration",
    Component: NoRecordsIllustration,
  },
  {
    id: "no-search-results",
    category: "empty",
    name: ["لا توجد نتائج", "No search results"],
    description: [
      "بحث لم يجد تطابقًا. اقترح تغيير الكلمات أو مسح المرشّحات.",
      "A search without a match. Suggest changing the query or clearing filters.",
    ],
    exportName: "NoSearchResultsIllustration",
    Component: NoSearchResultsIllustration,
  },
  {
    id: "getting-started",
    category: "empty",
    name: ["بداية جديدة", "Getting started"],
    description: [
      "خطوة أولى واضحة. استخدمها للترحيب بمستخدم أو تقديم مسار جديد.",
      "A clear first step. Use it to welcome someone or introduce a new workflow.",
    ],
    exportName: "GettingStartedIllustration",
    Component: GettingStartedIllustration,
  },
];
