import { useEffect, useState } from "react";
import { numberLocale } from "../../../config";
import { formatCount, formatElapsed } from "../../../format";
import { useSystem } from "../../../useSystem";

/** Ticks once a second while work runs. A display clock, never a progress source. */
export function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

/** Durations and counts in the reader's language and digits. */
export function useWorkFormat(language: "ar" | "en") {
  const { config } = useSystem();
  const format = {
    numerals: config.numerals,
    direction: language === "ar" ? ("rtl" as const) : ("ltr" as const),
  };
  return {
    /** Whole seconds while counting; a tenth under 10s once settled. */
    time: (ms: number, settled = false) =>
      formatElapsed(Math.max(0, ms) / 1000, format, {
        fractionDigits: settled && ms < 10_000 ? 1 : 0,
      }),
    steps: (count: number) => formatCount(count, "step", format),
    agents: (count: number) => {
      const n = new Intl.NumberFormat(numberLocale(format)).format(count);
      if (language === "en") return `${n} ${count === 1 ? "agent" : "agents"}`;
      if (count === 1) return "وكيل واحد";
      if (count === 2) return "وكيلان";
      return count <= 10 ? `${n} وكلاء` : `${n} وكيلًا`;
    },
  };
}
