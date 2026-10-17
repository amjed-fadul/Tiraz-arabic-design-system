import {
  useEffect as useResponseEffect,
  useRef as useResponseRef,
} from "react";
/** Example-only fixed chunks, shared by the chat demos. No network or model. */
export function useLocalResponse(language: "ar" | "en") {
  const timer = useResponseRef<ReturnType<typeof setTimeout> | undefined>(
      undefined,
    ),
    generation = useResponseRef(0),
    active = useResponseRef(false);
  function cancel() {
    generation.current++;
    active.current = false;
    clearTimeout(timer.current);
    timer.current = undefined;
  }
  useResponseEffect(() => cancel, []);
  function start(onChunk: (text: string) => void, onComplete: () => void) {
    if (active.current) return false;
    cancel();
    active.current = true;
    const run = generation.current;
    const chunks =
      language === "ar"
        ? [
            "ابدأ ",
            "بتسميات ",
            "واضحة ",
            "ومسافات ",
            "مدمجة. ",
            "Tiraz ",
            "يحافظ ",
            "على ",
            "العربية ",
            "والنص ",
            "المختلط. ",
            "راجع ",
            "الواجهة ",
            "بلوحة ",
            "المفاتيح.",
          ]
        : [
            "Start ",
            "with ",
            "clear ",
            "labels ",
            "and ",
            "compact ",
            "spacing. ",
            "Tiraz ",
            "preserves ",
            "Arabic ",
            "and ",
            "mixed ",
            "text: ",
            "مرحبًا ",
            "بالعالم.",
          ];
    let index = 0;
    function tick() {
      if (generation.current !== run) return;
      onChunk(chunks.slice(0, ++index).join(""));
      if (index === chunks.length) {
        active.current = false;
        timer.current = undefined;
        onComplete();
      } else timer.current = setTimeout(tick, 280);
    }
    timer.current = setTimeout(tick, 280);
    return true;
  }
  return { start, cancel, active };
}
