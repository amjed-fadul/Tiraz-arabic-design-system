// The context meter's tone rule and status words, which ContextMeter and
// Start a task's ring share so they always agree. Internal: not exported from
// index.ts.

export type ContextTone = "normal" | "high" | "near" | "over";
/** Which status word applies; "" while there is room. */
export type ContextStatusKey = "" | "high" | "near" | "over" | "zero";

const valid = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && n >= 0;

const words: Record<"ar" | "en", Record<ContextStatusKey, string>> = {
  ar: {
    "": "",
    high: "يقترب من الامتلاء",
    near: "شبه ممتلئ",
    over: "تجاوز السعة",
    zero: "السعة صفر",
  },
  en: {
    "": "",
    high: "Filling up",
    near: "Near capacity",
    over: "Over capacity",
    zero: "Capacity is zero",
  },
};

/**
 * The share of capacity used, its tone and its status word. The tone moves at
 * the host's thresholds, "high" (0.8) and "near" (0.95); over capacity is
 * always above 1. A zero capacity has no share.
 */
export function contextStatus(
  usage: {
    used?: number | null;
    capacity?: number | null;
    thresholds?: { high?: number; near?: number };
  },
  ar: boolean,
) {
  const { used, capacity, thresholds } = usage;
  const known = valid(used) && valid(capacity);
  const ratio = known && capacity > 0 ? used / capacity : null;
  const tone: ContextTone =
    known && used > capacity
      ? "over"
      : ratio !== null && ratio >= (thresholds?.near ?? 0.95)
        ? "near"
        : ratio !== null && ratio >= (thresholds?.high ?? 0.8)
          ? "high"
          : "normal";
  const key: ContextStatusKey =
    tone === "over"
      ? "over"
      : valid(capacity) && capacity === 0
        ? "zero"
        : tone === "normal"
          ? ""
          : tone;
  return { ratio, tone, key, status: words[ar ? "ar" : "en"][key] };
}
