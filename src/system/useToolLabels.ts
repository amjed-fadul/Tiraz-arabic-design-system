import { useSystem } from "./useSystem";
export function useToolLabels() {
  const { config } = useSystem();
  const ar = config.direction === "rtl";
  return {
    pending: ar ? "قيد الانتظار" : "Pending",
    running: ar ? "جارٍ التنفيذ" : "Running",
    completed: ar ? "مكتملة" : "Completed",
    failed: ar ? "فشلت" : "Failed",
    input: ar ? "المدخلات" : "Input",
    output: ar ? "المخرجات" : "Output",
    error: ar ? "الخطأ" : "Error",
    retry: ar ? "إعادة المحاولة" : "Try again",
  };
}
