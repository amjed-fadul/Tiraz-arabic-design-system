import {
  NoRecordsIllustration,
  NoSearchResultsIllustration,
  GettingStartedIllustration,
} from "../system/EmptyStateIllustrations";
import type { Localized } from "./i18n";
import type { IllustrationId } from "./site-routes";
import type { ComponentType } from "react";
export const illustrations: readonly {
  id: IllustrationId;
  name: Localized;
  description: Localized;
  exportName: string;
  Component: ComponentType;
}[] = [
  {
    id: "no-records",
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
    name: ["بداية جديدة", "Getting started"],
    description: [
      "خطوة أولى واضحة. استخدمها للترحيب بمستخدم أو تقديم مسار جديد.",
      "A clear first step. Use it to welcome someone or introduce a new workflow.",
    ],
    exportName: "GettingStartedIllustration",
    Component: GettingStartedIllustration,
  },
];
