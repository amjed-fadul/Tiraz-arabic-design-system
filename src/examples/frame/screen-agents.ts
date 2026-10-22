import type { CSSProperties } from "react";
import type { KhaytState } from "../../mascot/khayt-motion";
import type { AgentIdentity } from "../../mascot/useAgentColor";
import type { ScreenSlug } from "./screen";

export const screenAgent: Record<ScreenSlug, AgentIdentity> = {
  dashboard: "customer",
  "month-end-close": "finance",
  invoices: "collections",
  "customer-profile": "customer",
  "sales-pipeline": "sales",
  onboarding: "verification",
  "help-center": "support",
  "contract-review": "contracts",
  "content-studio": "campaigns",
  "agent-control-room": "finance",
  "team-settings": "finance",
};
export const stateNames: Record<KhaytState, readonly [string, string]> = {
  idle: ["جاهز", "Ready"],
  thinking: ["يفكّر", "Thinking"],
  working: ["يعمل", "Working"],
  waiting: ["بانتظارك", "Needs you"],
  done: ["اكتمل العمل", "Work complete"],
  blocked: ["تعذّرت المتابعة", "Blocked"],
};
export const agentStyle = (color: string) =>
  ({ "--agent-color": color }) as CSSProperties;

export const agentNames: Record<AgentIdentity, readonly [string, string]> = {
  finance: ["وكيل المالية", "Finance agent"],
  collections: ["وكيل التحصيل", "Collections agent"],
  customer: ["مساعد العملاء", "Customer assistant"],
  campaigns: ["مصمّم الحملات", "Campaign designer"],
  support: ["مساعد الدعم", "Support agent"],
  contracts: ["مساعد العقود", "Contract agent"],
  sales: ["مساعد المبيعات", "Sales agent"],
  verification: ["مساعد التحقّق", "Verification agent"],
};
