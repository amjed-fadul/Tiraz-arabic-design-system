import type { ToolCallState } from "./ToolCall";
import { useSystem } from "./useSystem";

/** The five state words of a tool call, and its section and retry words. */
export type ToolLabels = Record<ToolCallState, string> & {
  input: string;
  output: string;
  error: string;
  retry: string;
};

// The state words are the step words every pattern shares (§18): they label
// feminine subjects, a task, an operation or a step.
export const toolLabelsCopy: { ar: ToolLabels; en: ToolLabels } = {
  ar: {
    pending: "لم تبدأ",
    running: "قيد التنفيذ",
    "needs-you": "بانتظارك",
    completed: "مكتملة",
    failed: "تعثّرت",
    input: "المدخلات",
    output: "المخرجات",
    error: "الخطأ",
    retry: "إعادة المحاولة",
  },
  en: {
    pending: "Not started",
    running: "Running",
    "needs-you": "Needs you",
    completed: "Done",
    failed: "Failed",
    input: "Input",
    output: "Output",
    error: "Error",
    retry: "Try again",
  },
};

export function useToolLabels(overrides?: Partial<ToolLabels>): ToolLabels {
  const { config } = useSystem();
  return {
    ...toolLabelsCopy[config.direction === "rtl" ? "ar" : "en"],
    ...overrides,
  };
}
